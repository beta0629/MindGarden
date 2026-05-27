# PR #34 옵션 B 예약 우선 매칭 — 통합 회귀 검수 보고서

- **검수 일시**: 2026-05-28 KST
- **검수자**: core-tester (서브에이전트)
- **PR**: [#34 feat(matching): 옵션 B 예약 우선 매칭 + 회기 부여+즉시 1회 차감 단일 트랜잭션 (P1)](https://github.com/beta0629/MindGarden/pull/34)
- **브랜치**: `feature/option-b-reservation-first-matching` (`08ddde2fa`) → `develop`
- **합의서 SSOT**: `docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md` (`f89d3cbb4` — 별도 브랜치 `docs/option-b-reservation-first-plan`)
- **검수 모드**: 읽기 전용 (코드 수정 금지)

---

## §1 결론

```
결론: PASS
S1~S4: 4/4 PASS
회귀 매트릭스: 7/7 PASS
PR #33 통합: PASS (도메인 충돌 0건)
게이트 5종: PASS
HIGH 발견: 0건
운영 반영 권고: 즉시 deployer 위임 가능 (PR #33과 함께)
```

본 PR은 합의서 §2/§3 시퀀스(`confirmPayment → confirmDeposit → approveMapping`)와 R1~R8 결정 사항을 정확히 반영했으며, 신규 백엔드 16건 + 프론트엔드 11건 = 총 27건 단위/통합 테스트가 모두 PASS한다. 광역 회귀 게이트(`AdminServiceImpl*Test,ScheduleServiceImpl*Test,UserLifecycle*Test,UserAnonymization*Test,Mapping*Test`) 127건 또한 0 failure / 0 error를 기록했다.

---

## §2 S1~S4 시나리오 결과 매트릭스

| ID | 시나리오 | 검증 테스트 | 결과 | 비고 |
|----|---------|-----------|-----|-----|
| **S1** | 신규 매칭 → 사후 카드 모달 → 단회기(1회) → 잔여 0 + SESSIONS_EXHAUSTED | `AdminServiceImplCheckoutSameDayTest#checkoutSameDayCard_singleSessionPackage_skipsApproveAfterExhaustion` | ✅ PASS | `approveMapping` 호출 0회 (InOrder + `verify(spyService, never()).approveMapping(...)`) 보장. `SESSIONS_EXHAUSTED` 자동 전이 검증 |
| **S2** | 신규 매칭 → 사후 카드 → 10회 패키지 + 가예약 1건 → 잔여 9 + ACTIVE | `AdminServiceImplCheckoutSameDayTest#checkoutSameDayCard_multiSessionPackage_callsApproveAfterDeduction` + `ScheduleServiceImplSessionUsedHistoryTest#finalizeTentative_recordsSessionUsedHistoryWithSnapshots` | ✅ PASS | 매핑 ACTIVE / `remainingSessions=9` / `usedSessions=1` + `SESSION_USED` 이력 1건 INSERT(before/after JSON `remainingSessions:10→9`, `usedSessions:0→1`) |
| **S3** | PENDING_PAYMENT 알림 카드 → [당일 결제] 진입 → 정상 활성화 | `pendingPaymentAlertUtils.test.js` 6건 + `CheckoutSameDayModal.test.js` 5건 | ✅ PASS | `computePendingPaymentAlert` 분기 + `CheckoutSameDayModal` 라디오·검증·StandardizedApi POST 페이로드(`/api/v1/admin/mappings/{id}/checkout-same-day`) 정확성 |
| **S4** | `consultant_client_mapping_history.SESSION_USED` row 검증 | `ScheduleServiceImplSessionUsedHistoryTest` + 코드 검증 | ✅ PASS | `useSessionForSpecificMapping`(L794) + `useSessionForMapping`(L1969) **양쪽 경로** 모두 `recordSessionUsedHistory(...)` 동일 호출. before/after JSON에 `totalSessions/usedSessions/remainingSessions/status/paymentStatus` 5필드 캡처 |

### 추가 매트릭스 (코더 산출 외 부가 케이스)

| 항목 | 테스트 | 결과 |
|-----|-------|-----|
| 가예약 없음(차감 0회) | `checkoutSameDayCard_noTentativeSchedule_grantsOnlyAndActivates` | ✅ PASS |
| OCC 경합 → `OptimisticLockingFailureException` 전파 | `checkoutSameDayCard_optimisticLockingConflict_propagates` | ✅ PASS |
| tenantId 누락 → `IllegalStateException` | `checkoutSameDayCard_missingTenantId_throwsIllegalStateException` | ✅ PASS |
| 매핑 없음 → `RuntimeException("매칭...")` | `checkoutSameDayCard_mappingNotFound_throwsRuntimeException` | ✅ PASS |
| 이미 APPROVED → `IllegalStateException` (모든 step skip) | `checkoutSameDayCard_alreadyApproved_throwsIllegalStateException` | ✅ PASS |
| 필수 인자 검증(method/reference/amount) | `*_throwsIllegalArgumentException` 3건 | ✅ PASS |
| 호출 순서: `confirmPayment → confirmDeposit → approveMapping` | `checkoutSameDayCard_callOrder_paymentDepositApprove` (Mockito InOrder) | ✅ PASS |

---

## §3 회귀 매트릭스 (2-1 ~ 2-7)

### 2-1. PENDING_PAYMENT 자동 종료 가드 ✅ PASS

`AdminServiceImplCreateMappingPendingPaymentGuardTest` 4건 PASS.

| 케이스 | 메서드 | 결과 |
|-------|-------|-----|
| PENDING_PAYMENT 보호 | `createMapping_protectsPendingPaymentMappingFromAutoTerminate` | ✅ status 유지 + `terminatedAt=null` |
| PAYMENT_CONFIRMED 보호 | `createMapping_protectsPaymentConfirmedMappingFromAutoTerminate` | ✅ status 유지 + `terminatedAt=null` |
| ACTIVE 정상 종료 (기존 동작 유지) | `createMapping_terminatesActiveMappingAsBefore` | ✅ TERMINATED + `usedSessions=5`(잔여 흡수) |
| 혼합 (PENDING_PAYMENT + ACTIVE) | `createMapping_terminatesActiveButProtectsPendingPaymentMixed` | ✅ ACTIVE만 TERMINATED, PENDING_PAYMENT는 save 호출 자체에서 제외 |

코드 위치: `AdminServiceImpl.java:666-674` — 가드 로그 `⏸️ 옵션 B 가드: 결제 대기 매핑 자동 종료 제외` 출력 확인.

### 2-2. 동시성·OCC 회귀 ✅ PASS

- 단일 트랜잭션 호출 순서: `confirmPayment → confirmDeposit → approveMapping` — Mockito `InOrder` 검증 PASS
- `@Version` 낙관적 잠금 발동 시 `OptimisticLockingFailureException` 전파 + `approveMapping` 미호출 — 검증 PASS
- tenantId 누락 시 `IllegalStateException` — 검증 PASS
- ERP RECEIVABLE 거래는 `confirmPayment` 내부에서 `runInNewTransaction(REQUIRES_NEW)` 분리 — 코드 주석/구현 확인 (`AdminServiceImpl.java:1496-1498`)

### 2-3. UI/시각 회귀 (R5 라벨 변경) ✅ PASS

- `ScheduleStatus.TENTATIVE_PENDING_PAYMENT` displayName: `"결제 대기 (가예약)"` → `"사후 결제 예약"` (`ScheduleStatus.java:15`)
- `frontend/src/locales/ko/schedule.json` `t_35205a43` 값만 변경, 키 동일 (`schedule.json:163`)
- 노출 지점: 어드민 캘린더 / 통합 스케줄 / 사용자 마이페이지에서 모두 동일 키 참조 → 변경 전파 자동 적용
- 색상 토큰(`#fd7e14`) 및 아이콘(`⏳`) 유지 → 라이트/다크 모드 양쪽 동일 (별도 다크 모드 토큰 미정의 = 기존과 동일 회귀 영향 0)

### 2-4. lifecycle Phase 1+2-α 정착(PR #29) 회귀 ✅ PASS

- `UserLifecycleServiceImplTest` 19건 PASS
- `UserAnonymizationServiceImplTest` 17건 PASS
- 자발 탈퇴 흐름은 `UserLifecycleService.requestSelfWithdrawal(...)` → `UserAnonymizationService` 경로이며, PR #34의 매칭 트랙(`AdminServiceImpl.checkoutSameDayCard`, `ScheduleServiceImpl.useSession*`)과 **호출부 0건 중첩**

### 2-5. UnifiedModal SSOT 준수 (D11) ✅ PASS

- `CheckoutSameDayModal.js` line 4: `import UnifiedModal from '../../common/modals/UnifiedModal'` ✅
- 커스텀 오버레이/래퍼 0건. `mg-v2-ad-b0kla mg-v2-checkout-same-day-modal` className만 추가 (B0KlA 표준 준수)
- `MappingCreationModal.js` 기존 `UnifiedModal` 재사용 (라디오 추가만, 모달 구조 변경 0)
- `lint:codemod-mappings` PASS — D11 색상 가드 통과

### 2-6. tenantId 멀티테넌트 격리 ✅ PASS

- `AdminController.checkoutSameDay`: `PermissionCheckUtils.checkPermission(session, "MAPPING_MANAGE", ...)` 게이트 (`AdminController.java:1904-1908`)
- `AdminServiceImpl.checkoutSameDayCard`: `String tenantId = getTenantId();` 호출 + `mappingRepository.findByTenantIdAndId(tenantId, mappingId)` 사용 (`AdminServiceImpl.java:1526-1528`)
- 단위 테스트에서 `TenantContextHolder.clear()` 시 `IllegalStateException` 검증 PASS
- `BaseTenantAwareService.getTenantId()` 패턴 일치 — `core-solution-multi-tenant` skill 준수

### 2-7. i18n / 접근성 ✅ PASS

- `npm run check:i18n-seed` PASS — 14 파일 자기참조 0 / 빈값 0
- 신규 i18n 키:
  - `admin.mappingCreation.paymentTiming.*` (4 키)
  - `admin.mapping.checkout.sameDay.*` (16 키 — paymentMethod/Reference/Amount/sameDaySession/submit/cancel/success/error)
  - `admin.mapping.integrated.pendingPayment.alert.*` (4 키)
  - `schedule.t_35205a43` (값만 변경, 신규 키 없음)
- 모두 `t(...)` 호출과 1:1 매칭 (자기참조·빈값 없음)
- a11y: `CheckoutSameDayModal`이 `<fieldset>` + `<legend>` + `aria-labelledby` + `role="dialog"` (`UnifiedModal` 기본) + `aria-live="polite"` (알림 카드) 준수. focus trap / Esc는 `UnifiedModal` 책임이므로 SSOT 준수만으로 자동 충족

---

## §4 PR #33 자발 탈퇴 통합 회귀 ✅ PASS

| 항목 | 결과 |
|-----|-----|
| 도메인 충돌 | ✅ 0건 — PR #33은 `mypage/` + `WithdrawalPendingBanner/Widget/Modal` + `UserWithdrawal*` 트랙. PR #34는 `mapping/` + `MappingCreationModal/IntegratedMatchingSchedule/CheckoutSameDayModal` + `AdminServiceImpl.createMapping/checkoutSameDayCard` + `ScheduleServiceImpl` 트랙. **파일 교집합 0** |
| WithdrawalPendingBanner 전역 노출 (PR #33) | App.js 차원 추가 — PR #34와 무관 |
| WITHDRAWAL_PENDING 30일 카운트다운 | `UserAnonymizationServiceImpl` 회귀 17건 PASS — PR #34 영향 0 |
| 매칭 트랙 영향 | `AdminServiceImpl.checkoutSameDayCard`는 lifecycle_state를 변경하지 않음 (mapping status만 변경). PR #29 검증으로 충분 |

**참고**: PR #33의 신규 테스트 8건(`WithdrawalPendingBanner.test`, `WithdrawalPendingWidget.test`, `WithdrawalRequestModal.test`, `WithdrawalOptionsTest`, `UserWithdrawalControllerTest` 추가분 등)은 본 브랜치에 아직 미머지 상태이므로 본 보고서의 검증 대상에서 제외. PR #33 머지 후 별도 회귀 검증 권장.

---

## §5 게이트 5종 결과

| # | 게이트 | 명령 | 결과 |
|---|-------|------|-----|
| 1 | 백엔드 광역 회귀 | `mvn -DfailIfNoTests=false test -Dtest='AdminServiceImpl*Test,ScheduleServiceImpl*Test,UserLifecycle*Test,UserAnonymization*Test,Mapping*Test'` | ✅ **PASS** — Tests run: **127**, Failures: 0, Errors: 0 |
| 2 | 프론트엔드 회귀 | `cd frontend && npm test -- --watchAll=false --testPathPattern='CheckoutSameDay\|pendingPayment\|MappingCreation\|IntegratedMatchingSchedule\|Withdrawal'` | ✅ **PASS** — Test Suites: 2 passed, Tests: **11 passed** (CheckoutSameDayModal 5 + pendingPaymentAlertUtils 6) |
| 3 | i18n seed | `npm run check:i18n-seed` | ✅ **PASS** — 14 파일 자기참조 0 / 빈값 0 |
| 4 | codemod-mappings | `npm run lint:codemod-mappings` | ✅ **PASS** — 가드 1·2 모두 통과 |
| 5 | 하드코딩 (운영 게이트) | `bash config/shell-scripts/check-hardcode.sh` | ✅ **PASS** (exit 0) — 신규 0건 (분석 §5.1) |

### §5.1 하드코딩 게이트 신규 0건 검증

전체 워닝 5,591건은 모두 사전 존재(MMPI/TCI 파서, AdminController 기존 라인 등). PR #34 신규 파일에서 검출된 11건은 모두 **운영 게이트 비대상**(false positive)으로 확인:

- `CheckoutSameDayModal.js:16`, `CheckoutSameDayModal.test.js:4`, `pendingPaymentAlertUtils.js:4`, `pendingPaymentAlertUtils.test.js:5` — JavaDoc 주석의 합의서 경로 `2026-05-28` 날짜를 "매직 넘버(큰 숫자)"로 잘못 분류
- `CheckoutSameDayModal.test.js:40,90,92,98,184` — 테스트 픽스처(`id: 1001`, `packagePrice: 500000`) — 테스트 표준 §"테스트 데이터 동적 생성 vs 픽스처 상수"에서 허용
- `pendingPaymentAlertUtils.test.js:16,38` — `describe('filterPendingPaymentMappings', ...)` / `describe('computePendingPaymentAlert', ...)` 테스트 설명 — Jest 표준 식별자

운영 코드 신규 hex 색상 / B0KlA 토큰 / 한글 사용자 메시지 하드코딩 **0건**. 코더의 PR 설명("기존 경고는 본 PR 외부, 신규 hex/B0KlA 토큰 0")과 일치.

---

## §6 발견 사항

| Severity | 항목 | 권고 |
|---------|-----|-----|
| — | (HIGH 0건) | — |
| — | (MEDIUM 0건) | — |
| LOW | `useSessionForMapping`(L1969) 일반 BOOKED 차감 경로의 `SESSION_USED` 이력 직접 단위 테스트 누락 | 코드 검증으로는 동일 헬퍼(`recordSessionUsedHistory`) 호출 확인. 후속 PR에서 `ScheduleServiceImplGeneralBookedSessionUsedHistoryTest` 1건 추가 권장. **운영 반영 차단 사유는 아님** |
| LOW | 합의서 SSOT 문서가 별도 브랜치(`docs/option-b-reservation-first-plan`)에 위치 — develop 미머지 | 운영 반영 전 SSOT 문서 PR(`f89d3cbb4`)도 develop 머지 필요 (참조 무결성). **본 PR과 함께 일괄 머지 권장** |
| LOW | `CheckoutSameDayModal`의 `paymentReference` 자동 생성(`CARD_${stamp}`) — 어드민이 직접 입력하지 않으면 시스템 생성값 사용 | 합의서 §3 "결제 승인번호는 PG 응답값 사용"과의 정합성 확인 필요. 현행 구현은 어드민이 덮어쓸 수 있는 placeholder 형태로 사용성 보조. **기능 결함은 아님** |

---

## §7 운영 반영 권고

**즉시 deployer 위임 가능** — 단, PR #33과 함께 통합 머지를 권장.

```
✅ PR #34 단독: 운영 반영 가능 (게이트 5종 PASS, S1~S4 PASS, 회귀 7/7 PASS)
✅ PR #33 + PR #34 통합: 도메인 충돌 0건 — 동시 반영 안전
ℹ️ 합의서 SSOT 머지(`docs/option-b-reservation-first-plan` 브랜치) 동시 진행 권장
ℹ️ Phase 2-β PR(어드민 강제 종료/Q5) 도착 시 3-PR 통합 배포 가능
```

### 권장 배포 순서
1. **합의서 SSOT 머지** — `docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md` 정착 (참조 무결성)
2. **PR #34 머지** → develop
3. **PR #33 머지** → develop (도메인 독립이므로 순서 무관)
4. **(옵션) Phase 2-β PR** 도착 시 동시 반영
5. **`core-deployer` 위임**: GitHub Actions 운영 워크플로 트리거

### 후속 PR 권고 (운영 반영 차단 아님)
- `useSessionForMapping`(L1969) 일반 BOOKED 차감 경로 SESSION_USED 이력 단위 테스트 추가 (LOW)
- R4: 디러티 PENDING_PAYMENT 정리 어드민 UI (사용자 결정 — PR #34 외부)
- R6: KPI/통계 "예약 매칭" vs "결제 완료 매칭" 분리 (사용자 결정 — PR #34 외부)

---

## §8 검수 메타

- 검수 기준: `docs/standards/TESTING_STANDARD.md` (테스트 피라미드/Given-When-Then/@DisplayName/tenantId/동적 데이터)
- 참조 표준: `docs/standards/API_DESIGN_STANDARD.md` (`/api/v1/`), `docs/standards/ERROR_HANDLING_STANDARD.md` (예외 시나리오)
- 적용 스킬: `core-solution-testing`, `core-solution-multi-tenant`, `core-solution-unified-modal`, `core-solution-api`
- 본 보고서는 **읽기 전용 검수** 산출물로 코드 변경 없음. 발견 사항은 follow-up PR 권고로만 기록.

---

**보고 완료** — 운영 반영을 위해서는 `core-deployer` 서브에이전트에 위임하거나 사용자 결재 후 실행할 것.
