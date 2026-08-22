# 회기 승계 (Session Succession) — 상세 기획서

**문서 버전**: 1.0  
**작성일**: 2026-08-22  
**작성**: core-planner  
**상태**: 잠금 스펙 반영 · 구현 대기 (문서만, 커밋·배포는 사용자 검수 후)  
**화면설계**: [SCREEN_SPEC_SESSION_SUCCESSION.md](../design-system/SCREEN_SPEC_SESSION_SUCCESSION.md)  
**디자인 핸드오프**: [DESIGN_SPEC_SESSION_SUCCESSION.md](../design-system/DESIGN_SPEC_SESSION_SUCCESSION.md)

---

## 1. 배경·목표

부모가 CLIENT로 가입했으나 실제 상담은 가족·친지 등 **다른 사람**이 받는 경우, 시스템상 CLIENT가 상담 당사자와 어긋나면 스케줄·알림·회기 이력이 혼란스럽다.

**목표**: 어드민이 **통합 스케줄**에서 소스 매핑의 **스케줄에 묶이지 않은 잔여 회기**를 수혜자 CLIENT(신규/기존)의 타깃 매핑으로 **전량 또는 부분 이전**한다. 수혜자가 곧 실제 상담 당사자(CLIENT)가 된다.

**비목표(1차)**: 알림만 분리·보호자 이중수신 UX, 스케줄 일괄 이전, ERP 거래 재작성, 클라이언트 셀프 승계.

---

## 2. 잠금 비즈니스 규칙

1. **CLIENT = 실제 상담 당사자.** 수혜자 = 신규 등록 또는 기존 CLIENT(가족·친지·타인 포함).
2. **전량·부분 승계** — 이전 횟수 `N` 지정. 전량 = 승계가능 전액.
3. **데이터 모델**: 소스 `ConsultantClientMapping.remainingSessions` ↓ + 타깃 매핑(신규 또는 기존 ACTIVE) `remainingSessions` ↑ (`addSessions` 계열). **한 매핑의 `client`만 바꿔 회기를 쪼개기 불가.**
4. **스케줄에 이미 등록된 분은 승계 제외**(미실시여도). **스케줄 일괄 이전 폐기.**
5. **승계가능** 산식 §3. `N ≤ 승계가능`.
6. **타깃 상담사 선택 가능**(소스와 달라도 됨).
7. **진입**: 통합 스케줄 `/admin/integrated-schedule` · 매칭 카드 **「회기 승계」**.
8. **권한 ADMIN/STAFF.** ERP `FinancialTransaction` **재작성 금지.**

**용어**

| 용어 | 의미 |
|------|------|
| 회기 승계 / 회기 이전 | 본 기능 UI·문서명 |
| 이전 당사자 | 소스 매핑의 CLIENT |
| 수혜자 | 타깃 매핑의 CLIENT |
| 승계가능 | 스케줄 점유분을 뺀 이전 가능 잔여 |

**기존 기능과 구분**

| 기능 | API | 축 |
|------|-----|-----|
| 상담사 변경 | `POST /api/v1/admin/mappings/transfer` (`ConsultantTransferRequest`) | **동일 client**, 상담사 변경 |
| 회기 승계(본 기능) | §5 신규 API | **client(수혜자) 변경·분기**, 상담사 선택 가능 |

---

## 3. 승계가능 산식 (확정안)

### 3.1 코드 근거 (확인됨)

- 회기 SSOT: `ConsultantClientMapping.remainingSessions` / `useSession()` / `addSessions(Integer)`.
- 스케줄↔매핑: `Schedule.mappingId` (`schedules.mapping_id`).
- 점유 카운트 API: `ScheduleRepository.countOccupyingConsultationSchedulesForMapping(tenantId, mappingId, consultantId, clientId, statuses)`  
  — `mappingId` 일치 **또는** legacy(`mappingId IS NULL` + consultant/client).
- 시간 충돌 점유: `ScheduleStatus.occupiesTimeForConflictCheck()` → `BOOKED` | `TENTATIVE_PENDING_PAYMENT` | `CONFIRMED` | `IN_PROGRESS`.
- 호출부 status 집합은 **용도별로 불일치**(단일 전역 SSOT 없음).  
  - 예: `AdminServiceImpl` enrich ≈ `BOOKED`, `TENTATIVE_PENDING_PAYMENT`, `CONFIRMED`  
  - 예: `SessionSyncServiceImpl` used 정합 ≈ `BOOKED`, `CONFIRMED`, `COMPLETED`, `IN_PROGRESS`

### 3.2 MVP 확정안 (승계 전용)

**목적**: “스케줄에 **이미 잡혀 있어** 소스에 남겨야 하는 회기”를 뺀다. 이미 차감·완료된 회기는 `usedSessions`에 반영되어 `remaining`에 없음.

```
승계가능 = max(0, remainingSessions − occupyingScheduleCount)

occupyingScheduleCount = countOccupyingConsultationSchedulesForMapping(
  tenantId, mappingId, consultantId, clientId,
  statuses = {
    BOOKED,
    TENTATIVE_PENDING_PAYMENT,
    CONFIRMED,
    IN_PROGRESS
  }
)
```

| 포함 | 이유 |
|------|------|
| `BOOKED`, `TENTATIVE_PENDING_PAYMENT`, `CONFIRMED`, `IN_PROGRESS` | 등록·진행 중 슬롯이 remaining을 사실상 예약 |
| **제외** `COMPLETED`, `CANCELLED` 등 | 완료는 used로 이미 반영; 취소는 점유 아님 |

- **`COMPLETED`를 점유에 넣지 않음** — `SessionSyncServiceImpl` 집합과 **의도적으로 다름**(그쪽은 used 정합용). 구현·테스트에 주석으로 명시.
- **legacy `mappingId IS NULL`**: 기존 Repository 쿼리의 consultant/client OR 조건 **그대로 사용**.
- UI·API 모두 동일 산식. `N < 1` 또는 `N > 승계가능` → 거절.
- 전량 = `N = 승계가능`. 승계가능이 0이면 액션 비활성 + 안내.

**오픈(구현 시 단위 테스트로 고정)**: `scheduleType`이 CONSULTATION/null만 카운트하는지는 Repository 쿼리 정의를 코더가 재확인(메서드 시그니처상 statuses·mapping 조건 확인됨).

---

## 4. 데이터·트랜잭션 개요

1. 소스 매핑 로드(ACTIVE 등 허용 상태 — 구현 시 기존 매핑 가드와 정합, **확인 후 고정**).
2. `승계가능` 계산 · `N` 검증.
3. 수혜자 User/Client 확보(기존 ID 또는 신규 등록 — 기존 내담자 등록 경로 재사용 권장).
4. 타깃: `(tenantId, targetConsultantId, beneficiaryClientId)` ACTIVE 매핑이 있으면 `addSessions(N)`(+ total 정합). 없으면 신규 ACTIVE 매핑 생성 후 회기 `N` 부여(패키지명/가격 복사 정책은 §8).
5. 소스: `remainingSessions`에서 `N` 차감. `totalSessions`/`usedSessions` 조정 규칙은 §8 권장안. remaining→0이면 기존 `SESSIONS_EXHAUSTED` 전이와 정합 검토.
6. **스케줄 행은 수정하지 않음**(client_id/mapping_id 유지).
7. 감사: §7.
8. ERP: §6 — 거래 INSERT/UPDATE/DELETE 없음.

---

## 5. API 초안 (신규)

> 기존 `POST .../mappings/transfer`와 **경로·의미를 분리**한다.

### 5.1 Preview (선택, 권장)

`GET /api/v1/admin/mappings/{sourceMappingId}/session-succession/preview`

**응답(초안)**

| 필드 | 설명 |
|------|------|
| `sourceMappingId` | 소스 |
| `remainingSessions` | 현재 remaining |
| `occupyingScheduleCount` | §3.2 점유 건수 |
| `transferableSessions` | 승계가능 |
| `consultantId` / `clientId` | 소스 상담사·당사자 |
| `packageName` 등 | 미리보기용 메타 |

### 5.2 Execute

`POST /api/v1/admin/mappings/{sourceMappingId}/session-succession`

**Request body (초안)**

| 필드 | 필수 | 설명 |
|------|------|------|
| `beneficiaryClientId` | 조건부 | 기존 수혜자. 신규 시 생략하고 `newClient` 사용 |
| `newClient` | 조건부 | 신규 CLIENT 최소 필드(기존 Client 생성 DTO와 정합 — **확인 필요**) |
| `targetConsultantId` | Y | 타깃 상담사(소스와 동일·타사 모두 가능) |
| `sessionCount` | Y | `N`, `1 ≤ N ≤ transferable` |
| `reason` | N | 사유 |
| `packageName` / `packagePrice` | N | 타깃 신규 매핑 시 기본은 소스 복사 |

**Response (초안)**: 소스·타깃 매핑 요약(id, remaining, consultant, client), `transferredCount`, `occupyingScheduleCount`.

**권한**: `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")` (회기 추가·매핑 수정과 동일 계열).  
**테넌트**: `TenantContextHolder` — 소스/타깃/스케줄 카운트 모두 동일 tenant.

**에러(초안)**: 승계가능 초과, 소스 상태 불가, 수혜자=소스 client 동일 + N만 이동이 무의미한 경우(정책: **거절 또는 no-op 금지·명시 에러**), 타깃 상담사 없음, 동시성(optimistic / 재조회 후 재계산).

---

## 6. ERP · 결제 (비재작성)

- `FinancialTransaction.relatedEntityId` = mappingId, type `CONSULTANT_CLIENT_MAPPING` 등 **기존 거래 행을 수정·이관하지 않음**.
- 승계는 **회기 수량만** 이동. 입금·환불·금액 화면은 원 매핑/원 거래 기준 유지.
- UI 카피에 “결제·영수증 정보는 원 매핑 기준으로 남습니다” 안내(화면설계서).

---

## 7. 감사·이력

- `AuditAction`에 매핑 승계 전용 코드: **현재 코드에 MAPPING/TRANSFER 없음**(확인됨).
- **MVP 권장**: (A) `AuditLog`에 액션 코드 추가 **또는** (B) 소스/타깃 `notes`에 `auditLine` 누적(`AdminServiceImpl` / cleanup 패턴) + 응답/이력 API에 승계 이벤트 기록.
- 최소 기록 필드: tenantId, actorUserId, sourceMappingId, targetMappingId, sessionCount, source/target consultantId·clientId, occupyingScheduleCount, timestamp, reason.
- **확인 필요**: 전용 이력 테이블 신설 여부(없으면 notes+AuditLog로 MVP).

---

## 8. 패키지·total/used 권장안 (구현 세부)

| 항목 | MVP 권장 |
|------|----------|
| 소스 `usedSessions` | 변경 없음 |
| 소스 `remainingSessions` | `− N` |
| 소스 `totalSessions` | `− N` (잔여 이전으로 총량도 축소해 used+remaining 정합) — **코더가 기존 extend/차감 불변식과 충돌 시 재협의** |
| 타깃 신규 매핑 | `total=N`, `remaining=N`, `used=0`, package 메타 소스 복사 |
| 타깃 기존 ACTIVE | `addSessions(N)` (기존 메서드) |
| 소스 remaining=0 | `SESSIONS_EXHAUSTED` 등 기존 전이 |

---

## 9. MVP in / out

| MVP in | Out (1차) |
|--------|-----------|
| 통합스케줄 카드 「회기 승계」+ UnifiedModal 마법사 | 알림만 분리·이중수신 |
| 수혜자 신규/기존, 전량·부분, 상담사 선택 | 스케줄 행 이전 |
| §3.2 산식, §5 API, ADMIN/STAFF | 결제/영수증 재배분 |
| ERP 비재작성, 감사 최소 | 다수 수혜자 일괄 분할, CONSULTANT 개방, 셀프 승계 |

---

## 10. UI 진입 (요약)

- 라우트: `ADMIN_ROUTES.INTEGRATED_SCHEDULE` = `/admin/integrated-schedule`
- 페이지: `IntegratedMatchingScheduleManagement` → `AdminCommonLayout` + `IntegratedMatchingSchedule`
- 카드 액션: `CardActionGroup.js` + `MappingMatchActions.js` — ACTIVE 분기에서 **「회기 추가」옆**에 「회기 승계」추가(현재 해당 라벨 **없음**).
- 상세: SCREEN_SPEC / DESIGN_SPEC.

---

## 11. 오픈 이슈

1. 소스 매핑 **허용 status** 목록(ACTIVE만 vs EXHAUSTED에서 잔여 재계산 등) — 구현 전 코드 가드와 맞출 것.
2. `totalSessions − N` 불변식이 리포트/ERP 금액 표시와 충돌하는지.
3. 타깃에 **다른 상담사 ACTIVE가 이미 있고** 동일 수혜자인 경우 가산 vs 거절 — MVP는 **가산(addSessions)** 권장.
4. 신규 CLIENT 필드·전화 유일성(`PHONE_VERIFICATION_POLICY`) — 기존 등록 API 재사용 시 동일 정책.
5. AuditLog 신설 vs notes — §7.
6. Preview API를 MVP에 넣을지(권장: 넣음, UI 미리보기용).

---

## 12. 분배실행 (문서화 이후)

| Phase | 담당 | 상태 |
|-------|------|------|
| 문서(본 문서·SCREEN·DESIGN) | core-planner | 본 배치 |
| 디자인 시안 보강(선택) | core-designer `gemini-3.1-pro` | 필요 시 |
| 구현 | core-coder | 대기 |
| 검증 | core-tester | 코더 후 필수 |

**참조**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `/core-solution-business-flow`, `/core-solution-multi-tenant`.
