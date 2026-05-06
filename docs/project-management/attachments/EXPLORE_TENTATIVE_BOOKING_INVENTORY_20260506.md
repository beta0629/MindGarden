# 인벤토리 — 가예약·입금/카드 후 완료 (코드 탐색 메모)

**작성일**: 2026-05-06  
**성격**: 병렬 `explore` 보강용 요약(경로·API 후보). SSOT는 `PRESERVE_PAY_TENTATIVE_BOOKING_PHASES_20260506.md` 및 오케스트레이션 §12를 따른다.

## 매핑 상태(엔티티)

| 구역 | 경로 | 한 줄 메모 |
|------|------|------------|
| 매핑 상태 enum | `src/main/java/.../entity/ConsultantClientMapping.java` | `PENDING_PAYMENT`, `PAYMENT_CONFIRMED`, `DEPOSIT_PENDING`, `DEPOSIT_CONFIRMED`, `ACTIVE`, … — 가예약은 **신규 값 또는 기존 값 재해석** 검토 필요 |
| 매핑 전이·결제 | 동일 파일 `confirmPayment`/`confirmDeposit` 등 메서드 | 입금·결제와 `ACTIVE` 연결 로직 |
| 관리자 API | `src/main/java/.../controller/AdminController.java` | `confirm-payment`, `confirm-deposit` 엔드포인트 |
| 관리자 서비스 | `src/main/java/.../service/impl/AdminServiceImpl.java` | 미수금·INCOME·`remainingSessions` 보정 등 |
| 일정 생성·회기 | `src/main/java/.../service/impl/ScheduleServiceImpl.java` | 사전 검증·`useSessionForMapping` |
| 일정 API | `src/main/java/.../controller/ScheduleController.java` | 생성 권한·호출 서비스 |
| 매핑 동기·ERP | `PlSqlMappingSyncServiceImpl.java`, `PlSqlMappingSyncController.java` | 외부 프로시저·동기화 |
| 은행 이체 | `BankTransferServiceImpl.java` | 입금 관련 보조 흐름 |
| 세션 연장 | `SessionExtensionServiceImpl.java`, `SessionExtensionController.java` | 회기·연장과 교차 시 확인 |

## 프론트(통합 스케줄·가드)

| 구역 | 경로 | 한 줄 메모 |
|------|------|------------|
| 통합 스케줄 페이지 | `frontend/.../IntegratedMatchingSchedule.js` | 드롭·모달·매칭 목록 |
| 스케줄 가능 상수 | `frontend/.../integratedScheduleSidebarFilterConstants.js` | `canScheduleForMapping` — 가예약 시 **조건 분기** 필요 |
| 외부 드롭 가드 | `frontend/.../scheduleExternalDropGuards.js` | 검증 공통화 |
| 라우트 | `frontend/src/App.js` | `/admin/integrated-schedule` 등 |

## 추정(명시)

- **가예약** 전용 상태가 없으면 `DEPOSIT_PENDING` 등과 **제품 정의로 매핑**하거나, `Schedule`·별 엔티티에 **플래그**를 두는 방안이 `core-debugger`/설계에서 갈림.
