# 디버그 부록 — 가예약(입금 전) vs 현행 일정·회기·결제 갭 (2026-05-06)

**역할**: core-debugger 산출(코드 수정 없음).  
**목적**: PO 가예약 요구와 현행 `createConsultantSchedule` / `useSessionForMapping` / 결제·입금 API 경로 간 **갭**을 재현·증거 수집 관점에서 정리한다.

---

## 1) 현행 vs PO 요구 (표)

| 축 | 현행(엔지니어링 스냅샷·리뷰 문서 요지) | PO 요구(§6·§12 인용 요지) |
|---|----------------------------------------|---------------------------|
| **일정 생성** | `createConsultantSchedule`는 저장 **전** `validateMappingForSchedule`(ACTIVE 쌍)·`validateRemainingSessions`(잔여>0)를 통과해야 하고, 저장 **후** `useSessionForMapping`으로 회기 차감. 일정 API는 결제 API를 대체하지 않음. | 입금 확인 **전**에 **가예약 1건**을 등록해 두고, 이후 입금 완료 또는 카드 결제 시 상태 변동·완료로 이어짐. |
| **매핑 상태** | 일정 사전 검증·프론트 `canScheduleForMapping` 축은 **ACTIVE + 잔여>0** 정합이 전제. “가예약”은 이 전제와 **충돌 가능**(별도 상태·전이 필요)이라는 엔지니어링 메모. | 가예약은 별도 **일정·매핑 상태**(또는 부가 플래그)와 **입금/결제 콜백 전이** 설계가 필요하다는 §12 간극 서술과 정합. |
| **회기** | 잔여는 저장 전 검증·저장 후 `useSessionForMapping`에서 소모. `confirmDeposit` 등에서 잔여 보정 로직 존재(리뷰 부록). | “결제·입금 전 슬롯 홀드”이므로 동일 **ACTIVE+잔여** 전제만으로는 표현·검증이 부족(§12). |
| **결제/입금 API** | `confirm-payment`(3·4인자)·`confirm-deposit`가 별도; 경로별 ERP·미수금 처리 차이·갭이 입금/ERP 분석 문서에 정리됨. | 입금 완료 또는 카드 결제 시 상태 변동·완료 — **어떤 API 조합이 “확정”인지**는 표 A·ADR과 교차 확인 필요. |

**인용(문서만)**

> «입금 확인 전 건: **가예약**을 한 건 만들어 등록… 이후 **입금 완료** 또는 **카드 결제**… **상태값이 변동**… **완료 처리**» — [`REVIEW_RESERVE_PAY_RECEIVABLES_SESSION_20260506.md`](./REVIEW_RESERVE_PAY_RECEIVABLES_SESSION_20260506.md) §6.

> «입금 확인 **전**에 **가예약** 1건… **입금 완료 또는 카드 결제** 시 **상태값 변동** 후 **완료 처리**… **신규 도메인 상태·허용 전이 표·API 응답 계약**이 별도로 정의·구현되어야» — [`INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`](../INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) §12.

> Phase 0~4에서 Phase **2** 퇴장을 «**ACTIVE+잔여** 전제와의 차이·필요 전이·4xx/도메인 코드 초안»으로 둠 — [`PRESERVE_PAY_TENTATIVE_BOOKING_PHASES_20260506.md`](./PRESERVE_PAY_TENTATIVE_BOOKING_PHASES_20260506.md).

> `confirm-payment` / `confirm-deposit` 경로·프로시저·용어 혼용 갭 — [`docs/debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md`](../../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md) §2~3 요지.

---

## 2) P0 시나리오 — 재현 절차 초안 (라벨 A·B·C)

민감정보 없음. 단계에는 **역할**, **화면 진입**, **호출 API 이름**만 기술.

### A — 선예약·후결제(가예약 → 입금/카드 후 완료)

1. 테넌트·**ADMIN**(또는 STAFF)으로 로그인 → 통합 스케줄(또는 동등 관리 일정 UI) 진입.  
2. 대상 매핑이 **입금 미확인·가예약 허용 상태**로 가정될 때(PO 의도), 슬롯에 일정 생성 시도.  
3. **Network**: `createConsultantSchedule`(또는 동일 도메인 일정 생성 API) 요청/응답·HTTP 상태 저장.  
4. (의도 플로우) 이어서 **`confirm-deposit`** 또는 **카드 결제 확정에 해당하는 API**(결제 대행/웹훅 경로는 인벤토리에 따름) 호출 전후 스냅샷.  
5. 동일 시각 기준 **매핑 상태 코드**, **`remainingSessions`**, 일정 row 존재 여부를 로그·응답에서 대조.

### B — 결제·회기 갱신 전 UI 재진입

1. A와 동일 역할로 가예약 또는 일정 생성 시도 직후 **브라우저 새로고침** 또는 통합 스케줄 재진입.  
2. 사이드바·캘린더에서 동일 컨설턴트·클라이언트 쌍의 **SCHEDULABLE/드래그 가능** 표시와 `canScheduleForMapping` 전제(ACTIVE 등) 불일치 여부 관창.  
3. **Network**: 동일 슬롯에 대한 **재시도** 시 `createConsultantSchedule` 응답(2xx vs 4xx) 및 응답 본문 도메인 코드.  
4. **confirm-payment** / **confirm-deposit** 완료 **전**에만 재현하면 B에 해당.

### C — 필터·역할 전환 후 불일치

1. **ADMIN**으로 통합 스케줄에서 매핑·필터 상태 확인 후, 동일 테넌트에서 **역할 전환**(STAFF ↔ CONSULTANT 등 운영 절차에 맞게) 또는 필터 변경.  
2. `SchedulePage` / `ScheduleCalendarView`에서 **신규 생성 vs 편집** 권한(`canRegisterScheduler` 정합)과 통합 스케줄 카드 **드롭 가드** 동작 차이 관찰.  
3. **Network**: `createConsultantSchedule` 또는 외부 드롭 가드에 막힌 경우 클라이언트만 성공으로 처리하는지(콘솔·토스트).  
4. 서버 **`validateMappingForSchedule`** 실패와 UI “가능” 표시가 어긋나는지 증거 4점으로 수집.

---

## 3) 오케스트레이션 §2.2 — 최소 증거 4점 (가예약 맥락 채움 템플릿)

상위 정의: [`INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`](../INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) §2.2. 아래는 **가예약·입금 전 홀드** 관점으로 체크 항목만 구체화한 빈칸 템플릿이다.

| # | 증거 항목 | 가예약 맥락에서 수집할 내용(민감정보 마스킹) | 수집 결과(디버거 기입) |
|---|-----------|---------------------------------------------|-------------------------|
| **1** | 요청·응답 쌍 | **일정**: `createConsultantSchedule` 요청 본문·HTTP·JSON 응답. **확정**: `confirm-deposit` / `confirm-payment`(3·4인자 구분) / 카드 확정 API 중 실제 호출된 것. **가예약 전용 API**가 도입되면 그 생성·확정 쌍으로 대체. | |
| **2** | 회기·잔여 필드 스냅샷 | 일정 생성 **직전·직후**·입금/결제 **직전·직후**의 `remainingSessions`, 세션/패키지 식별자, **가예약 상태에서 회기 차감 여부**(현행은 저장 후 `useSessionForMapping`). | |
| **3** | UI 상태 | 슬롯 **SCHEDULABLE**/드래그 가능 여부, `canScheduleForMapping` 입력 필드, 콘솔 경고, **“입금 대기·가예약” 카피** 노출 여부(Phase 0 산출 전이면 N/A). | |
| **4** | 시간 순서 | 가예약 레코드 생성 → **confirm-deposit** / **confirm-payment** / 결제 콜백 → ERP·`updateMappingInfo`(해당 시) → 일정 **확정·취소** 이벤트의 **타임스탬프** 타임라인. | |

---

## 4) core-coder 위임 시 의심 파일 (경로만 + grep 1단어, ≤12 bullet)

- `src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java` — `createConsultantSchedule`
- `src/main/java/com/coresolution/consultation/controller/ScheduleController.java` — `createConsultantSchedule`
- `src/main/java/com/coresolution/consultation/service/ScheduleService.java` — `createConsultantSchedule`
- `src/main/java/com/coresolution/consultation/service/impl/PlSqlMappingSyncServiceImpl.java` — `useSessionForMapping`
- `src/main/java/com/coresolution/consultation/controller/AdminController.java` — `confirmDeposit`
- `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` — `confirmDeposit`
- `src/main/java/com/coresolution/consultation/entity/ConsultantClientMapping.java` — `confirmDeposit`
- `frontend/src/components/admin/mapping-management/constants/integratedScheduleSidebarFilterConstants.js` — `canScheduleForMapping`
- `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` — `canScheduleForMapping`
- `frontend/src/utils/scheduleExternalDropGuards.js` — `canScheduleForMapping`
- `frontend/src/components/schedule/ScheduleModal.js` — `StandardizedApi`
- `src/main/java/com/coresolution/consultation/service/impl/DynamicPermissionServiceImpl.java` — `canRegisterScheduler`

---

## core-coder 전달용 한 줄

증거 4점 표를 채운 뒤, §12·REVIEW §6·Phase 부록과 **상태 전이·API 계약** 초안을 위임 문에 붙여 `core-coder`에 전달한다. 검증은 상위 SSOT §4 테스트 게이트·`core-tester`에 위임.
