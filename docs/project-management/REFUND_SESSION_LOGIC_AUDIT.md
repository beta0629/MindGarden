# 환불·회기(세션) 연동 전체 로직 점검

**목적**: 환불 시 회기수(세션수) 연동 및 일관성 점검  
**범위**: 전체 환불(강제 종료), 부분 환불, 회기 필드, 스케줄 취소, ERP/프로시저 연동  
**작성**: 점검 결과 요약 및 개선 제안

---

## 1. 요약

| 구분 | 전체 환불 (terminate) | 부분 환불 (partial-refund) |
|------|------------------------|----------------------------|
| **진입점** | 매칭 관리 → 강제 종료 | 매칭 관리 → 부분 환불 (ACTIVE만) |
| **회기 처리** | remaining=0, used=total | remaining-=n, total-=n, used 유지 |
| **스케줄** | 미래 BOOKED/CONFIRMED 전부 취소 | **취소 없음** (부분 환불 후 남은 회기 0이어도 미취소) |
| **ERP** | sendRefundToErp → createConsultationRefundTransaction | sendRefundToErp → createPartialConsultationRefundTransaction |
| **DB 프로시저** | **미호출** (ProcessRefundWithSessionAdjustment 없음) | **미호출** (ProcessPartialRefund 없음) |
| **환불 가능 회기 조회** | 사용 안 함 | **미사용** (GetRefundableSessions API 미연동) |

---

## 2. 회기(세션) 필드 연동

### 2.1 엔티티·불변식

- **ConsultantClientMapping**
  - `totalSessions`, `usedSessions`, `remainingSessions`
  - **불변식**: `totalSessions = usedSessions + remainingSessions` (정규적으로 유지)

### 2.2 전체 환불 (terminateMapping)

**위치**: `AdminServiceImpl.terminateMapping(id, reason)`

| 단계 | 동작 |
|------|------|
| 1 | refundedSessions = mapping.getRemainingSessions() |
| 2 | refundAmount = (packagePrice * refundedSessions) / totalSessions |
| 3 | sendRefundToErp(...) → 내부에서 createConsultationRefundTransaction 호출 |
| 4 | mapping.setRemainingSessions(0) |
| 5 | mapping.setUsedSessions(mapping.getTotalSessions()) |
| 6 | mapping.save() 후 해당 매칭의 미래 스케줄(BOOKED/CONFIRMED) → CANCELLED |

- **회기 결과**: remaining=0, used=total → total = used + remaining 유지.
- **주의**: 주석 "전체를 사용한 것으로 처리하지 않고 실제 사용한 만큼만"은 **코드와 불일치**. 실제로는 `usedSessions = totalSessions`로 설정됨. (종료 시 “남은 회기 없음”을 나타내기 위한 처리로 해석 가능.)

### 2.3 부분 환불 (partialRefundMapping)

**위치**: `AdminServiceImpl.partialRefundMapping(id, refundSessions, reason)`

| 단계 | 동작 |
|------|------|
| 1 | TERMINATED 여부 검사, getLastAddedPackageInfo로 금액 계산 |
| 2 | refundSessions > remainingSessions 시 예외 |
| 3 | 청약 철회 15일 검사 (paymentDate 기준) |
| 4 | refundAmount 계산 (최근 추가 패키지 우선, 없으면 전체 비례) |
| 5 | sendRefundToErp → createPartialConsultationRefundTransaction |
| 6 | mapping.setRemainingSessions(remaining - refundSessions) |
| 7 | mapping.setTotalSessions(total - refundSessions) |
| 8 | **usedSessions는 변경 없음** |
| 9 | remaining <= 0 이면 status = SESSIONS_EXHAUSTED, endDate 설정 |

- **회기 결과**: total -= n, remaining -= n, used 동일 → 불변식 유지.
- **스케줄**: 부분 환불 후에도 **미래 스케줄 자동 취소 로직 없음**. 부분 환불로 남은 회기가 0이 되어 SESSIONS_EXHAUSTED가 되어도 해당 매칭의 예약은 그대로 둠.

---

## 3. 스케줄 취소 정책

| 상황 | 스케줄 처리 | 위치 |
|------|-------------|------|
| **전체 환불 (terminate)** | 상담사·내담자·오늘 이후 BOOKED/CONFIRMED → CANCELLED | AdminServiceImpl 2885~2924 |
| **부분 환불** | 없음 | — |
| **부분 환불 후 remaining=0** | 없음 (SESSIONS_EXHAUSTED만 설정) | — |
| **내담자 삭제** | 해당 내담자 미래 BOOKED/CONFIRMED → CANCELLED | AdminServiceImpl 2687~2710 |

- **갭**: 부분 환불로 남은 회기가 0이 된 경우, 전체 환불과 동일하게 “해당 매칭의 미래 예약 자동 취소”를 할지 정책 결정 및 구현 검토 필요.

---

## 4. ERP·거래 생성

- **전체 환불**
  - `sendRefundToErp(mapping, refundedSessions, refundAmount, reason)`  
    - ERP 전송(현재 모의 전송)  
    - 성공 시 `createConsultationRefundTransaction(...)` 호출 → EXPENSE, CONSULTATION_REFUND
- **부분 환불**
  - `sendRefundToErp(...)` 호출
  - 별도로 `createPartialConsultationRefundTransaction(...)` 호출 → EXPENSE, CONSULTATION_PARTIAL_REFUND  
  - `amountManagementService.recordAmountChange(...)` 로 금액 변경 이력 기록

회기·금액은 모두 Java 엔티티 기준으로 계산·반영되며, DB 저장 프로시저는 호출되지 않음.

---

## 5. DB 프로시저와의 연동 갭

| 프로시저 | 용도 | 현재 사용처 |
|----------|------|-------------|
| **GetRefundableSessions** | 환불 가능 회기·최대 환불 금액 조회 | PlSqlMappingSyncController `/refundable-sessions/{mappingId}` 만 호출. **매칭 관리/부분 환불 UI·API에서는 미사용** |
| **ProcessRefundWithSessionAdjustment** | 환불 + 세션 조정 (DB 반영) | **AdminServiceImpl에서 미호출** |
| **ProcessPartialRefund** | 부분 환불 (DB 반영) | **AdminServiceImpl에서 미호출** |

- **실제 환불 흐름**: AdminController → AdminServiceImpl 에서 엔티티 업데이트 + ERP/거래 생성만 수행.
- **영향**: DB 프로시저는 “단일 소스 오브 트루스”로 사용되지 않음. 감사·리포트용으로 DB와 Java가 동기화되어야 한다면, 프로시저 호출 추가 또는 프로시저 역할 재정의(감사 전용 등) 검토 필요.

---

## 6. 프론트엔드

### 6.1 부분 환불 모달 (PartialRefundModal.js)

- **데이터 소스**: 매칭 상세에서 내려준 `mapping` (totalSessions, usedSessions, remainingSessions, packagePrice 등).
- **환불 가능 회기**: `Math.min(mapping.remainingSessions, lastAddedPackage.sessions)` — **GetRefundableSessions API 미호출**.
- **금액**: “최근 추가 패키지” 추정으로 프론트에서 계산. 백엔드는 `getLastAddedPackageInfo`로 별도 계산하므로, 복잡한 패키지 이력이 있으면 프론트 예상 금액과 서버 환불 금액이 다를 수 있음.
- **권장**: 부분 환불 모달 오픈 시 `GET .../refundable-sessions/{mappingId}` 호출해 최대 환불 회기·최대 환불 금액을 표시하고, 동일 값으로 서버 검증 시 일관성 확보.

### 6.2 환불 버튼 노출

- 매칭 관리에서 **ACTIVE** 상태일 때만 환불(부분 환불) 버튼 동작.
- 입금 확인만 하고 승인 전(DEPOSIT_PENDING)에는 “활성 상태의 매칭만 환불 처리할 수 있습니다” 등으로 막힘. 백엔드는 TERMINATED만 아니면 호출 가능.

---

## 7. 개선 제안 체크리스트

- [ ] **terminateMapping 주석 수정**  
  - `setUsedSessions(mapping.getTotalSessions())` 옆 주석을 “종료 시 남은 회기 없음 처리로 used=total 로 설정” 등 코드와 일치하도록 수정.
- [ ] **부분 환불 후 remaining=0 인 경우 스케줄**  
  - 정책 결정: 전체 환불과 동일하게 해당 매칭의 미래 BOOKED/CONFIRMED 스케줄 자동 취소할지 여부.  
  - 적용 시 `partialRefundMapping` 내에서 remaining <= 0 일 때 terminateMapping과 동일한 스케줄 취소 로직 호출 검토.
- [ ] **GetRefundableSessions 연동**  
  - 부분 환불 모달에서 `GET refundable-sessions/{mappingId}` 호출해 최대 환불 회기·금액 표시 및 서버 검증에 활용.
- [ ] **ProcessPartialRefund / ProcessRefundWithSessionAdjustment**  
  - 감사·리포트·DB 일관성 요구가 있으면, 환불 처리 후 프로시저 호출 추가 또는 “감사 전용” 등 역할 명확화 후 설계.

---

## 8. 참고 코드 위치

| 항목 | 파일 | 메서드/라인 |
|------|------|-------------|
| 전체 환불 | AdminServiceImpl.java | terminateMapping (~2835), sendRefundToErp (~3879), createConsultationRefundTransaction (~879) |
| 부분 환불 | AdminServiceImpl.java | partialRefundMapping (~2951), createPartialConsultationRefundTransaction (~912) |
| 회기 사용/복원 | ConsultantClientMapping.java | useSession(), restoreSession(), addSessions() |
| 환불 가능 회기 (프로시저) | PlSqlMappingSyncServiceImpl.java | getRefundableSessions (~431) |
| 부분 환불 모달 | frontend/.../PartialRefundModal.js | — |
| API | AdminController.java | terminateMapping (L1966 부근), partialRefund (L1977 부근) |

이 문서는 `DEPOSIT_PAYMENT_ERP_REFUND_MEETING_SURVEY.md` 및 `docs/project-management/` 내 ERP·환불 관련 문서와 함께 참고하면 됩니다.
