# PR #35 Phase 2-β — 어드민 강제 종료 회귀 검수 보고서 V2 (재검수)

- **검수 일시**: 2026-05-28 KST (1차 검수 V1 의 코더 후속 조치 직후)
- **검수자**: core-tester (서브에이전트, 읽기 전용)
- **PR**: [#35 feat(lifecycle): Phase 2-β — 어드민 강제 종료 redirect + 7일 윈도우 cron + 되돌리기 UI (Q5)](https://github.com/beta0629/MindGarden/pull/35)
- **브랜치**: `feature/lifecycle-phase2-beta-admin-delete` (`e8f0efdad`)
- **정책 SSOT**: `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` v1.1 §0.1 Q5 (7일 윈도우) · §2 흐름 표 · §6.2 cron · §8 audit
- **별도 릴리스 라인**: PR #33 + PR #34 통합 배포(Agent `e37afab6`, `d474297` 정착)와 분리 — 라이프사이클 cron 1주 dry-run 후 별도 릴리스 예정
- **V1 보고서**: `docs/project-management/2026-05-28/PHASE_2_BETA_PR_35_REGRESSION_REPORT.md` (CONDITIONAL_PASS / H1 + M2 발견) — **본 V2 발급으로 obsolete 처리 권고**

---

## §0 1차 보고서(V1) 대비 변경점

| 영역 | V1 (commit `03641e99f`) | V2 (commit `e8f0efdad`) | 사유 |
|------|------------------------|------------------------|------|
| HIGH H1 — Flyway `V20260606_002` 슬롯 충돌 | ❌ FAIL (머지 차단) | ✅ **RESOLVED** — `V20260606_003__add_deleted_by_admin_id_to_users.sql` 로 rename 정착 (coder commit `6f3f2b4e3`) | PR #33 (`V20260606_002__add_withdrawal_options_to_users.sql`) 와 슬롯 분리 |
| MEDIUM M2 — `WithdrawalGracePeriodScheduler` dry-run 토글 부재 | ❌ MISSING | ✅ **RESOLVED** — `mindgarden.scheduler.withdrawal-grace.dry-run` 토글 + `application.yml` 명세 + 단위 테스트 1건 추가 (coder commit `e8f0efdad`) | `AdminDeleteRetentionScheduler` 와 동일 패턴 정착 |
| develop 머지 가능성 | ❌ 충돌 차단 | ✅ **MERGEABLE / CLEAN** — develop 머지 + `User.java` 충돌 해소 (양 컬럼 보존: `withdrawal_options_json` + `deleted_by_admin_id`) (coder commit `c886a9a42`) | PR #33 + PR #35 양립 |
| 게이트 5종 | PASS (mvn 82 / Jest 7 / i18n / codemod / hardcode) | PASS (mvn **148** / Jest **7** / i18n / codemod / hardcode) | mvn 와일드카드 확장 + 신규 테스트 클래스 (WithdrawalGracePeriodSchedulerTest, ScheduleServiceImpl*Test) 추가 검증 |
| 신규 단위 테스트 | — | `WithdrawalGracePeriodSchedulerTest.runOnce_dryRun_doesNotCallTransition` 1건 PASS | M2 권고 정착 검증 |
| 신규 발견 (V2) | — | **L4 — Phase 5 PR (#39) 머지 시 `application.yml` 트리비얼 충돌 1건** | 양 PR 모두 `mindgarden:` 하위 sibling 키 추가 — additive 머지 가능 |

---

## §1 결론

```
결론: PASS (1차 발견 H1 + M2 완전 해소 / 회귀 게이트 + T1~T7 + R1~R7 모두 그린)

게이트 5종:    5/5 PASS
T1~T7:        7/7 PASS
R1~R7:        7/7 PASS (R7 Phase 5 PR #39 충돌 1건 — 트리비얼/additive)
1차 발견 해소: H1 ✅ RESOLVED / M2 ✅ RESOLVED

HIGH 발견:    0건
MEDIUM 발견:   0건
LOW 발견:      4건 (L1·L2·L3 — V1 와 동일 미해소 · L4 신규)

운영 반영 권고:
  1) 본 PR (별도 릴리스 라인) → develop 머지
  2) D-day 배포 시 `MINDGARDEN_SCHEDULER_*_DRY_RUN=true` 환경변수 강제 적용
  3) D+0 ~ D+7 dry-run 모니터링 (양 cron 후보 로그 추적)
  4) 운영 결재 → D+8 `dry-run=false` 토글 → 실 anonymize 진입
```

본 PR(`e8f0efdad`)은 1차 검수(V1)에서 발견된 **HIGH 1건(H1 — Flyway 슬롯 충돌) + MEDIUM 1건(M2 — dry-run 토글 부재) 모두 코더 후속 조치(commit `6f3f2b4e3` + `c886a9a42` + `e8f0efdad`)로 완전 해소**되었다. 회귀 게이트 5종(mvn 148 / Jest 7 / i18n / codemod / hardcode) + T1~T7 + R1~R7 모두 그린이며, 머지 차단 사유는 0건이다.

이에 결론을 **CONDITIONAL_PASS → PASS** 로 갱신하고, V1 보고서를 obsolete 표시 + 본 V2 보고서를 최종 검수 결과로 권고한다.

---

## §2 게이트 5종 결과 (재실행)

| # | 게이트 | 명령 | 결과 | 비고 |
|---|--------|------|------|------|
| 1 | **mvn 백엔드** | `mvn -q -DfailIfNoTests=false -DargLine=-Xmx2g test -Dtest='AdminServiceImpl*Test,AdminDeleteRetentionSchedulerTest,WithdrawalGracePeriodSchedulerTest,AdminUserLifecycleControllerTest,UserLifecycleServiceImplTest,UserAnonymizationServiceImplTest,ScheduleServiceImpl*Test'` | ✅ **148 / 0F / 0E / 0S** | 26 TEST 클래스 매칭. 핵심 클래스: `WithdrawalGracePeriodSchedulerTest` **6** (신규 dry-run 1건 포함) · `AdminDeleteRetentionSchedulerTest` 4 · `AdminUserLifecycleControllerTest` 9 · `AdminServiceImplDeleteRedirectTest` 4 · `AdminServiceImplCheckoutSameDayTest` **11** (PR #34 옵션 B 회귀, `UserLifecycleService` mock 인자 추가됨) · `AdminServiceImplCreateMappingPendingPaymentGuardTest` **4** (동일) · `UserLifecycleServiceImplTest` 24 · `UserAnonymizationServiceImplTest` 21 · `ScheduleServiceImpl*Test` 44 |
| 2 | **Jest 프론트** | `cd frontend && npm test -- --watchAll=false --testPathPattern='RestoreUserModal|PendingDeletion|userManagement'` | ✅ **2 suites / 7 tests PASS** | `RestoreUserModal.test.js` 4 + `PendingDeletionList.test.js` 3. defaultProps deprecation 경고 (L2) 유지 |
| 3 | **i18n-seed** | `npm run check:i18n-seed` | ✅ PASS | **15 파일** 시드 정상 (자기참조 0 / 빈값 0). V1 의 14 → 15 파일 증가는 develop 정착분 영향 |
| 4 | **lint:codemod-mappings (D11)** | `npm run lint:codemod-mappings` | ✅ PASS | 가드 1·2 모두 통과 — codemod 진입 안전 |
| 5 | **check-hardcode (운영 게이트)** | `bash config/shell-scripts/check-hardcode.sh` | ✅ **errors=0** (warnings=5635) | JSON 리포트 `errors: list len=0` 확인. PR #35 신규 코드 errors 0건 |

### Raw output 발췌 — 게이트 1 (surefire 집계)

```
tests=148 failures=0 errors=0 skipped=0
```

```
AdminUserLifecycleControllerTest                                   9 (F=0, E=0, S=0)
AdminDeleteRetentionSchedulerTest                                  4 (F=0, E=0, S=0)
WithdrawalGracePeriodSchedulerTest                                 6 (F=0, E=0, S=0)   ← 신규 +1 (dry-run)
AdminServiceImplCheckoutSameDayTest                                11 (F=0, E=0, S=0)
AdminServiceImplConfirmDepositApproveTest                          4 (F=0, E=0, S=0)
AdminServiceImplCreateMappingPendingPaymentGuardTest               4 (F=0, E=0, S=0)
AdminServiceImplCreateMappingSingleSessionGuardTest                4 (F=0, E=0, S=0)
AdminServiceImplDeleteRedirectTest                                 4 (F=0, E=0, S=0)
AdminServiceImplMappingSettlementNotificationBaselineTest          3 (F=0, E=0, S=0)
AdminServiceImplPartialRefundExhaustedScheduleCancelTest           5 (F=0, E=0, S=0)
AdminServiceImplRegisterClientContactTest                          6 (F=0, E=0, S=0)
AdminServiceImplUpdateClientTest                                   5 (F=0, E=0, S=0)
ScheduleServiceImpl*Test                                          44 (F=0, E=0, S=0)
UserAnonymizationServiceImplTest                                  21 (F=0, E=0, S=0)
UserLifecycleServiceImplTest                                      24 (F=0, E=0, S=0)
```

### Raw output 발췌 — 게이트 2 (Jest)

```
Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        0.709 s, estimated 1 s
Ran all test suites matching /RestoreUserModal|PendingDeletion|userManagement/i.
```

### Raw output 발췌 — 게이트 3 (i18n)

```
[validate-i18n-seed] PASS — 15 파일 시드 정상 (자기참조 0 / 빈값 0).
```

### Raw output 발췌 — 게이트 5 (hardcode JSON)

```
top-level keys: ['timestamp', 'totalFiles', 'errors', 'warnings', 'summary']
errors: list len=0
warnings: list len=5635
```

---

## §3 T1~T7 시나리오 재검수 (HEAD `e8f0efdad`)

| ID | 시나리오 | 검증 테스트 | V1 결과 | V2 결과 | 비고 |
|----|---------|-----------|---------|---------|-----|
| **T1** | `AdminServiceImpl.deleteClient` → `transitionTo(DELETED_BY_ADMIN)` redirect + audit | `AdminServiceImplDeleteRedirectTest#deleteClient_*` | ✅ PASS | ✅ **PASS** | `clientStatsService.evictTenantClientsWithStatsListCache(tenantId)` / `evictClientStatsCache` 동시 검증. `userRepository.save` 직접 호출 없음. tenantId 격리 유지 |
| **T2** | `deleteConsultant` 활성 매핑 가드 + redirect | `AdminServiceImplDeleteRedirectTest#deleteConsultant_*` | ✅ PASS | ✅ **PASS** | 활성 매핑 0건 → `transitionTo` 1회. 활성 매핑 1건 → `RuntimeException` + `transitionTo` 0회 |
| **T3** | `AdminDeleteRetentionScheduler` 7일 윈도우 cron + REQUIRES_NEW 격리 + dry-run | `AdminDeleteRetentionSchedulerTest` 4건 | ✅ PASS | ✅ **PASS** | 후보 0/2/실패 격리/dry-run 4시나리오 모두 그린. cron `0 30 3 * * *` zone `Asia/Seoul` |
| **T4** | `POST /api/v1/admin/users/{userId}/restore` — 7일 내 200 / 7일 외 409 / 404 / audit `ADMIN_RESTORE` | `AdminUserLifecycleControllerTest#restoreUser_*` + `UserLifecycleServiceImplTest#transitionTo_deletedByAdmin_to_active_restore` | ✅ PASS | ✅ **PASS** | 7일 내 → `transitionTo(ACTIVE)` + `notificationLifecycleService.send` 1회. 7일 외 → 409. `lifecycle_state ≠ DELETED_BY_ADMIN` → 409. 미존재 → 404 |
| **T5** | `GET /api/v1/admin/users/pending-deletion` — DTO 매핑 + 이메일 마스킹 + 정렬 + 페이징 | `AdminUserLifecycleControllerTest#listPendingDeletion_*` + `maskEmail_*` + `calculateDaysRemaining_*` | ✅ PASS | ✅ **PASS** | `findPendingDeletionByTenantId(tenantId, cutoff, pageable)` 호출 + `Sort.by(DESC, deletedAt)`. 마스킹 `a**@example.com` 정합 |
| **T6** | 프론트 `RestoreUserModal` (UnifiedModal SSOT + 사유 필수 + 409 처리) | `frontend/.../RestoreUserModal.test.js` 4건 | ✅ PASS | ✅ **PASS** | 코드 상 `import UnifiedModal from '../common/modals/UnifiedModal'` + `import MGButton` 검증. 빈 사유 가드 / 409 응답 분기 모두 그린 |
| **T7** | 프론트 `PendingDeletionList` — 색상 분기 + EmptyState + 되돌리기 모달 트리거 | `frontend/.../PendingDeletionList.test.js` 3건 | ✅ PASS | ✅ **PASS** | 행 3개 렌더 + `daysRemaining=1/4/7` → `danger/warning/info` 색상 분기. EmptyState 정합. 모달 트리거 OK |

**합계**: **7/7 PASS**

---

## §4 회귀 매트릭스 R1~R7 (PR #34 정착 후 통합 검증)

| ID | 회귀 영역 | 검증 | 결과 | 비고 |
|----|----------|------|------|------|
| **R1** | PR #34 옵션 B 호환 — `AdminServiceImpl.checkoutSameDayCard` | `mvn test -Dtest='AdminServiceImpl*Test'` 12 클래스 / 65 테스트 PASS (특히 `AdminServiceImplCheckoutSameDayTest` **11** + `AdminServiceImplCreateMappingPendingPaymentGuardTest` **4**) | ✅ **PASS** | 두 클래스 모두 `@Mock private UserLifecycleService userLifecycleService;` 정착 (coder commit `c886a9a42`). 시그니처/assertion 변경 0 |
| **R2** | PR #29 Phase 1+2-α 호환 — `UserLifecycleService` / `UserAnonymizationService` | 시그니처 변경 0 + `UserLifecycleServiceImplTest` 24 PASS + `UserAnonymizationServiceImplTest` 21 PASS | ✅ **PASS** | PR #35 가 추가한 새 전이 분기 (`*→DELETED_BY_ADMIN` / `DELETED_BY_ADMIN→ACTIVE`) 는 기존 `transitionTo(Long, LifecycleState, Actor, String)` 시그니처 위에 그래프 분기로 추가. V1 의 (21+17) 기준 → 신규 테스트 보강으로 (24+21) 증가, 기존 테스트 제거/수정 0건 |
| **R3** | PR #33 자발 탈퇴 마이페이지 호환 — `WithdrawalGracePeriodScheduler` | dry-run 토글 추가 후 enabled=true / dry-run=false 일 때 기존 동작 무변경. `WithdrawalGracePeriodSchedulerTest` **6** PASS (V1 의 5 + 신규 `runOnce_dryRun_doesNotCallTransition` 1) | ✅ **PASS** | `@Value("${mindgarden.scheduler.withdrawal-grace.dry-run:false}")` 기본 false → 운영 안전성 보존. `User.withdrawalOptionsJson` (PR #33) + `User.deletedByAdminId` (PR #35) 양 컬럼 정상 매핑 |
| **R4** | tenantId 격리 | (a) `WithdrawalGracePeriodScheduler.runOnce` dry-run 분기는 cron 시스템 컨텍스트 — 후보 조회·로깅만 (anonymize 호출 없음, 격리 위반 0). (b) `AdminDeleteRetentionScheduler` 동일 패턴. (c) `AdminServiceImpl.deleteClient/Consultant`: `getTenantId()` + `findByTenantIdAndId(tenantId, id)` 사용. (d) `AdminUserLifecycleController`: `TenantContextHolder.getTenantId()` + null/blank 가드 → `FORBIDDEN` | ✅ **PASS** | 양 cron 의 시스템 컨텍스트 우회는 의도된 설계 (정책 §6.2 — 모든 테넌트 across 후보 조회 후 user.tenantId 별로 transitionTo). dry-run 분기는 anonymize 미수행 → 격리 위반 영향 0 |
| **R5** | UnifiedModal SSOT (D11) | `RestoreUserModal.js` 상단 `import UnifiedModal` + `<UnifiedModal>` 래핑 + `<MGButton primary/secondary>` variant. `PendingDeletionList.js` 자체 오버레이 0. 게이트 4 (`lint:codemod-mappings`) PASS | ✅ **PASS** | 자체 오버레이/포털 0 — SSOT 위반 0 |
| **R6** | i18n 시드 29 키 | `frontend/src/locales/ko/admin.json` `userManagement.pendingDeletion` 하위 **29 키** (top-level: `tabTitle`/`pageTitle`/`subtitle`/`empty`/`loading`/`loadError`/`column`/`daysRemainingValue`/`daysRemainingExpired`/`action`/`modal`/`toast`/`error`). 게이트 3 (`check:i18n-seed`) PASS — 15 파일 / 자기참조 0 / 빈값 0 | ✅ **PASS** | V1 의 14 → 15 파일 증가는 develop 정착분 (PR #33/#34/별도 PR) 영향 — pendingDeletion 키 자체는 29 유지 |
| **R7** | Phase 5 PR #39 충돌 시뮬레이션 | `git merge --no-commit --no-ff origin/feature/lifecycle-phase5-cutoff-pii-regex` (시뮬레이션 후 `git merge --abort`). 결과: **`UU src/main/resources/application.yml` 1건만 충돌, 그 외 17 파일 auto-merge 성공** | ⚠️ **PASS w/ L4 신규** | 충돌은 양 PR 모두 `mindgarden:` 하위 sibling 키 추가 (`scheduler.*` vs `lifecycle.*`) — **트리비얼/additive 머지** (양 블록 모두 유지로 해소). 비 SQL/Java 충돌이며 운영 영향 0. **§5 L4 권고 참조** |

**합계**: **7/7 PASS** (R7 트리비얼 충돌 1건은 LOW 등급, 머지 차단 아님)

### R7 raw output 발췌 (충돌 사이트)

```
## feature/lifecycle-phase2-beta-admin-delete...origin/feature/lifecycle-phase2-beta-admin-delete
M  src/main/java/com/coresolution/consultation/ConsultationManagementApplication.java
A  src/main/java/com/coresolution/consultation/config/LifecycleCutoffProperties.java
A  src/main/java/com/coresolution/consultation/config/PiiScrubberProperties.java
A  src/main/java/com/coresolution/consultation/lifecycle/BusinessMode.java
... (16 files auto-merged)
UU src/main/resources/application.yml       ← 1건 양측 수정 conflict
```

```yaml
<<<<<<< HEAD                                                                    (PR #35)
  scheduler:
    withdrawal-grace:
      enabled: ${MINDGARDEN_SCHEDULER_WITHDRAWAL_GRACE_ENABLED:true}
      dry-run: ${MINDGARDEN_SCHEDULER_WITHDRAWAL_GRACE_DRY_RUN:false}
    admin-delete-retention:
      enabled: ${MINDGARDEN_SCHEDULER_ADMIN_DELETE_RETENTION_ENABLED:true}
      dry-run: ${MINDGARDEN_SCHEDULER_ADMIN_DELETE_RETENTION_DRY_RUN:false}
=======                                                                         (PR #39)
  lifecycle:
    cutoff:
      business-mode: NON_MEDICAL
      policy-version: v1.2-2026-05-28
      ...
    pii-scrubber:
      strategy: regex
      enabled-patterns: email,phone,rrn,arn,card,bank,url
>>>>>>> origin/feature/lifecycle-phase5-cutoff-pii-regex
```

→ **해소 방안**: 양 블록을 모두 `mindgarden:` 하위에 sibling 으로 보존 (의미 충돌 0). Phase 5 머지 시점에 1줄 conflict resolution 만 필요. **PR #35 머지에는 영향 없음** (Phase 5 PR 가 후행).

---

## §5 1차 발견 (V1) 해소 검증 매트릭스

| # | V1 발견 | Severity | V2 상태 | 해소 commit | 검증 방법 |
|---|--------|----------|---------|-------------|----------|
| **H1** | Flyway `V20260606_002` 슬롯 충돌 (develop 머지 차단) | HIGH | ✅ **RESOLVED** | `6f3f2b4e3` (rename SQL → `V20260606_003__add_deleted_by_admin_id_to_users.sql`) + `c886a9a42` (User.java 양 컬럼 보존) | `ls src/main/resources/db/migration/V20260606*` → `_001/_002/_003` 3 파일 공존, 슬롯 분리 확인. `User.java` 에 `withdrawalOptionsJson` (V20260606_002 매핑) + `deletedByAdminId` (V20260606_003 매핑) 양 필드 정착. 게이트 1 (mvn 148 PASS) 으로 JPA 매핑 + 컴파일 정합 검증 |
| **M2** | `WithdrawalGracePeriodScheduler` dry-run 토글 부재 | MEDIUM | ✅ **RESOLVED** | `e8f0efdad` (scheduler dry-run 토글 + application.yml 명세 + 단위 테스트 1건) | `WithdrawalGracePeriodScheduler.java` L62 `@Value("${mindgarden.scheduler.withdrawal-grace.dry-run:false}")` 정착, L92~L100 dry-run 분기 (`AdminDeleteRetentionScheduler` 동일 패턴). `application.yml` L188~L197 `mindgarden.scheduler.{withdrawal-grace,admin-delete-retention}.{enabled,dry-run}` 명세화. 신규 단위 테스트 `WithdrawalGracePeriodSchedulerTest#runOnce_dryRun_doesNotCallTransition` PASS — 후보 2명에도 `transitionTo` 0회 검증 |
| **L1** | `restoreUser` 의 `LocalDateTime.now()` vs scheduler 의 `LocalDateTime.now(KST)` 미세 불일치 | LOW | ⚠️ **미해소** (운영 영향 없음) | — | V1 와 동일. 운영 JVM `Asia/Seoul` TZ 가정 시 영향 0. 후속 마이너 패치 권고 (controller 측도 명시 KST 통일) |
| **L2** | React 18 defaultProps 경고 (RestoreUserModal) | LOW | ⚠️ **미해소** (운영 영향 없음) | — | V1 와 동일. 기능 동작 정상. 후속 마이너 패치에서 디폴트 매개변수 패턴 마이그레이션 권고 |
| **L3** | 알림 발송 `NotificationType.WITHDRAWAL` 재사용 (의미 부정합) | LOW | ⚠️ **미해소** (운영 영향 없음) | — | V1 와 동일. 알림 라우팅 정상. 후속 패치에서 `NotificationType.ADMIN_LIFECYCLE_RESTORE` enum 신설 권고 |

---

## §6 V2 발견 사항 + Severity

### HIGH (H) — 0건

**없음.** V1 의 H1 (Flyway 슬롯 충돌) 은 완전 해소됨.

### MEDIUM (M) — 0건

**없음.** V1 의 M2 (dry-run 토글) 는 완전 해소됨.

### LOW (L) — 4건 (L1·L2·L3 V1 유지 / L4 신규)

#### L1 — `restoreUser` 의 `LocalDateTime.now()` vs scheduler 의 `LocalDateTime.now(KST)` 미세 불일치 (V1 유지)

- **위치**: `AdminUserLifecycleController.java` (`restoreUser`/`listPendingDeletion`) vs `AdminDeleteRetentionScheduler.java#runOnce`
- **현황**: V1 와 동일. controller 측 default zone 사용. 운영 JVM `Asia/Seoul` TZ 가정 시 영향 0.
- **권고**: 후속 마이너 패치에서 controller 도 `LocalDateTime.now(ZoneId.of("Asia/Seoul"))` 통일.

#### L2 — React 18 `defaultProps` deprecation 경고 (V1 유지)

- **위치**: `frontend/src/components/admin/RestoreUserModal.js`
- **현황**: V1 와 동일. 기능 동작 정상. Jest console 경고 다수 출력.
- **권고**: 후속 마이너 패치에서 함수형 컴포넌트 디폴트 매개변수 패턴 마이그레이션.

#### L3 — 알림 발송 `NotificationType.WITHDRAWAL` 재사용 (V1 유지)

- **위치**: `AdminUserLifecycleController.java#notifyAdminRestore`
- **현황**: V1 와 동일. 자발 탈퇴 라벨을 어드민 강제 종료 복원 알림에 재사용.
- **권고**: 후속 패치에서 `NotificationType.ADMIN_LIFECYCLE_RESTORE` (또는 `ADMIN_FORCE_DELETE_RESTORE`) enum 신설.

#### L4 — Phase 5 PR #39 머지 시 `application.yml` 트리비얼 충돌 (V2 신규)

- **위치**: `src/main/resources/application.yml` L188 ~ L220 부근
- **현황**: PR #35 가 `mindgarden.scheduler.*` 블록 추가 + PR #39 (`feature/lifecycle-phase5-cutoff-pii-regex`) 가 `mindgarden.lifecycle.*` 블록 추가. `mindgarden:` 하위 sibling 키지만 git 텍스트 머지 시점에 동일 라인 영역으로 인식되어 1건 conflict 발생. `git merge --no-commit --no-ff origin/feature/lifecycle-phase5-cutoff-pii-regex` 시뮬레이션 결과 `UU src/main/resources/application.yml` 1건만 충돌, 그 외 17 파일은 auto-merge.
- **운영 영향**: 0 — **PR #35 머지에는 영향 없음** (Phase 5 PR 가 후행). Phase 5 PR 머지 시점에 1줄 conflict resolution (양 블록 모두 보존) 만 필요.
- **권고**:
  1. Phase 5 PR 머지 담당자(core-planner / core-coder) 에게 본 충돌 사이트를 사전 공유 — additive 머지 (양 블록 모두 유지) 로 해소.
  2. 후속 작업으로 application.yml `mindgarden:` 블록을 알파벳 순으로 정렬 (lifecycle → scheduler → security 등) 권고 — 향후 동일 패턴 충돌 예방.

---

## §7 Flyway H2 통합 검증 (코드 정합 인스펙션)

PR #35 의 `V20260606_003__add_deleted_by_admin_id_to_users.sql` 와 PR #33 (`develop` 정착) 의 `V20260606_002__add_withdrawal_options_to_users.sql` 양립 가능성을 다음과 같이 검증한다.

### V20260606_001 → V20260606_002 → V20260606_003 순차 적용 정합

| 슬롯 | 파일 | 출처 | 컬럼 | 충돌 |
|------|-----|------|------|------|
| V20260606_001 | `__lnb_admin_billing_menus.sql` | PR #28 (rename from V20260530_003) | (메뉴 시드) | — |
| V20260606_002 | `__add_withdrawal_options_to_users.sql` | PR #33 `432a5e8d1` (develop 정착) | `users.withdrawal_options_json TEXT NULL` | — |
| V20260606_003 | `__add_deleted_by_admin_id_to_users.sql` | PR #35 `6f3f2b4e3` (rename from `_002`) | `users.deleted_by_admin_id BIGINT NULL` + FK + 2 INDEX | — |

**검증**:
1. **슬롯 분리**: 3 파일 모두 다른 버전 번호 → Flyway `Duplicate migration version` 에러 0.
2. **컬럼 분리**: `withdrawal_options_json` (TEXT) vs `deleted_by_admin_id` (BIGINT) — 동일 테이블(`users`) 다른 컬럼 → 동시 ADD COLUMN 시 충돌 0.
3. **JPA 매핑**: `User.java` 에 양 필드 모두 정착 (`@Column(name = "withdrawal_options_json", columnDefinition = "TEXT")` + `@Column(name = "deleted_by_admin_id")`) → JPA 매핑 충돌 0.
4. **컴파일·테스트 검증**: 게이트 1 (mvn 148 PASS) — JPA 매핑 + 테스트 데이터 빌더 모두 양 컬럼 인식 정상.
5. **실 H2 적용**: 본 PR 단위 테스트는 Mockito 기반 (Flyway 실행 안 함). **실 Flyway 적용 검증은 D-day blue/green cutover 직전 staging 환경에서 추가 1회 권고** (양 마이그가 sequential 로 적용되는지 dev 환경 부트 로그 모니터링).

---

## §8 운영 반영 권고

### 8-1. 별도 릴리스 라인 (PR #33 + PR #34 통합 배포와 분리)

V1 §7 와 동일 — 다음 이유로 본 PR(#35) 은 별도 릴리스 라인으로 진행:

1. **운영 검증 절차 차이**: PR #33/#34 는 즉시 실 트래픽 검증 가능. 본 PR 은 **cron 기반 자동 anonymize** — 1주 dry-run 검증 필요.
2. **롤백 비용 차이**: 본 PR 은 `audit_logs` + `personal_data_destruction_logs` 적재 + PII anonymize 완료 시점부터 **사실상 되돌릴 수 없음** (정책 §1 D5).
3. **운영 결재 분리**: USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1 Q5 결재 흐름과 함께 운영 반영 시점 결정 필요.

### 8-2. dry-run 1주 운영 절차 (Q5 + 정책 §6.2)

| Phase | 시점 | 액션 | 검증 |
|-------|------|------|------|
| **D-day** | PR #35 `develop → main` 머지 + 배포 | (a) `MINDGARDEN_SCHEDULER_WITHDRAWAL_GRACE_DRY_RUN=true` (b) `MINDGARDEN_SCHEDULER_ADMIN_DELETE_RETENTION_DRY_RUN=true` 환경변수 강제 적용 후 배포 (deployment/systemd Environment 또는 ConfigMap) | 부트 로그에서 양 토글 `true` 적용 확인 |
| **D+0 ~ D+7** | 매일 03:00 / 03:30 KST | 양 cron 자동 실행 → `[WithdrawalGracePeriod] DRY-RUN — would anonymize N users` + `[AdminDeleteRetention] DRY-RUN — would anonymize N users` 로그 모니터링 | (a) 후보 사용자 명세(`userId` / 진입 시각 / `deletedByAdminId`) 운영 감사 추적 (b) `audit_logs` / `personal_data_destruction_logs` 신규 row 없음 검증 |
| **D+7** | dry-run 종료 | dry-run 1주간 후보가 의도된 사용자(자발 탈퇴 30일 경과 + 어드민 강제 종료 7일 경과) 만 포함하는지 운영 결재 | 결재 통과 시 `*_DRY_RUN=false` 토글 + 배포 |
| **D+8 이후** | 실 운영 | 첫 실 실행 결과 (`[AdminDeleteRetention] executed: anonymized=N` / `[WithdrawalGracePeriod] executed: anonymized=N`) 모니터링 | `personal_data_destruction_logs` 적재 + `users.email_tombstone_hash` (W3 tombstone) 정합 확인 |

### 8-3. Phase 5 PR #39 머지 담당자 사전 공유 사항 (§6 L4)

- `src/main/resources/application.yml` 의 `mindgarden:` 블록에서 1건 트리비얼 충돌 발생 예정.
- 해소: 양 블록 (PR #35 `mindgarden.scheduler.*` + PR #39 `mindgarden.lifecycle.*`) 모두 sibling 으로 보존.
- 충돌 발생 라인 범위: L188 ~ L220 부근.

### 8-4. V1 보고서 obsolete 처리

- V1 (`PHASE_2_BETA_PR_35_REGRESSION_REPORT.md`) 의 결론 `CONDITIONAL_PASS (H1)` 는 본 V2 발급 시점에 무효화됨.
- V1 상단에 다음 헤더 추가 권고:
  ```
  > **⚠️ OBSOLETE — 2026-05-28 KST**
  > 본 보고서는 V1(commit `03641e99f`) 기준이며, 후속 코더 조치(commit `6f3f2b4e3` + `c886a9a42` + `e8f0efdad`)
  > 로 H1 + M2 모두 해소되었다.
  > **최신 검수 결과는 `PHASE_2_BETA_PR_35_REGRESSION_REPORT_V2.md` (PASS) 참조.**
  ```

---

## §9 검증 환경

| 항목 | 값 |
|------|---|
| OS | Darwin 25.5.0 (macOS) |
| Java | 17.0.10 (Adoptium / SDKMAN) |
| Maven | 3.9.9 |
| Node | (frontend Jest) |
| 검수 워크트리 | `/Users/mind/mindGarden-phase2beta` |
| 검수 시점 commit | `e8f0efdad` (PR #35 HEAD, mergeable: CLEAN) |
| 비교 base | `2049323c5` (develop 머지 직후) |
| PR mergeable status | **MERGEABLE / CLEAN** |

---

## §10 참조 문서

- 정책 SSOT: `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` v1.1 (§0.1 Q5 / §2 / §6.2 / §8)
- 1차 보고서 (obsolete 권고): `docs/project-management/2026-05-28/PHASE_2_BETA_PR_35_REGRESSION_REPORT.md`
- 표준: `docs/standards/TESTING_STANDARD.md` · `docs/standards/API_DESIGN_STANDARD.md` · `docs/standards/ERROR_HANDLING_STANDARD.md`
- 관련 PR: #29 (lifecycle Phase 1+2-α) · #33 (자발 탈퇴 마이페이지, V20260606_002 슬롯 점유) · #34 (옵션 B 예약 우선 매칭, 정착 `d474297`) · #39 (Phase 5 cutoff/PII, R7 L4 시뮬레이션)
- 운영 게이트: `config/shell-scripts/check-hardcode.sh` · `scripts/i18n/validate-i18n-seed.js` · `scripts/design-system/color-management/validate-codemod-mappings.js`

---

**검수 완료**: 2026-05-28 KST · core-tester (V2 재검수)

본 V2 보고서는 **읽기 전용** 검수 결과이며 코드 수정은 수행하지 않았다.

**결론**: PR #35 (`e8f0efdad`) — **PASS** (HIGH 0 / MEDIUM 0 / LOW 4 — 모두 운영 영향 없음). 1차 발견 H1 + M2 완전 해소 확인. 별도 릴리스 라인 + 1주 dry-run 운영 절차 권고.
