# PR #35 Phase 2-β 어드민 강제 종료 + 7일 윈도우 cron + 되돌리기 UI — 회귀 검수 보고서

> **⚠️ OBSOLETE — 2026-05-28 KST**
>
> 본 보고서는 V1(commit `03641e99f`) 기준이며, 후속 코더 조치(commit `6f3f2b4e3` rename Flyway + `c886a9a42` develop merge + `e8f0efdad` dry-run 토글)로 **HIGH H1 (Flyway 슬롯 충돌) + MEDIUM M2 (dry-run 토글 부재) 모두 해소** 되었다.
>
> 최신 검수 결과는 [`PHASE_2_BETA_PR_35_REGRESSION_REPORT_V2.md`](./PHASE_2_BETA_PR_35_REGRESSION_REPORT_V2.md) (**결론: PASS**) 참조.

- **검수 일시**: 2026-05-28 KST
- **검수자**: core-tester (서브에이전트)
- **PR**: [#35 feat(lifecycle): Phase 2-β — 어드민 강제 종료 redirect + 7일 윈도우 cron + 되돌리기 UI (Q5)](https://github.com/beta0629/MindGarden/pull/35)
- **브랜치**: `feature/lifecycle-phase2-beta-admin-delete` (`03641e99f`, 단일 커밋) → `develop`
- **정책 SSOT**: `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` v1.1 §0.1 Q5 (7일 윈도우) + §2 흐름 표 + §8 audit
- **검수 모드**: 읽기 전용 (코드 수정 금지)
- **별도 릴리스 라인**: PR #33 + PR #34 통합 배포(Agent `e37afab6`)와 분리 — 라이프사이클 cron 1주 dry-run 후 별도 릴리스 예정

---

## §1 결론

```
결론: CONDITIONAL_PASS (HIGH 1건 — Flyway 머지 차단 사안, 코드 수정 후 재검수 필요)
T1~T7: 7/7 PASS
회귀 매트릭스: 7/7 PASS (H1 발견 후 2-3 항목 ⚠️ 다운그레이드)
게이트 5종: PASS (mvn 82 + Jest 7 + i18n-seed + lint:codemod-mappings + check-hardcode errors=0)
HIGH 발견: 1건 (H1 — Flyway V20260606_002 슬롯 충돌, develop 머지 차단)
MEDIUM 발견: 1건 (M2 — application.yml dry-run 미설정)
LOW 발견: 3건 (L1·L2·L3 — §6 참조)
운영 반영 권고: H1 해소(rename to V20260606_003) → 재검수 PASS → 사용자 결재 → dry-run 1주 → 별도 릴리스
dry-run 1주 운영 검증 시점: H1 해소 + V20260606_003 적용 후 D+1 ~ D+7
```

본 PR은 `USER_LIFECYCLE_TERMINATION_POLICY.md` v1.1 §0.1 Q5 결정(어드민 강제 종료 7일 보존 윈도우 + 어드민 "되돌리기")을 충실히 구현했으며, **백엔드 82 PASS / 프론트 7 PASS / 운영 게이트 errors=0** 으로 5종 게이트 모두 통과한다.

**그러나 검수 마지막 단계에서 develop 최신 상태(`16b3fd0e5`)에 fast-forward 시 HIGH 발견 1건이 확정되었다**: PR #33 (`432a5e8d1` — 자발 탈퇴 마이페이지 UI) 이 이미 `V20260606_002__add_withdrawal_options_to_users.sql` 슬롯을 점유한 상태에서, 본 PR(`03641e99f`)이 동일한 `V20260606_002__add_deleted_by_admin_id_to_users.sql` 슬롯을 추가하므로 **Flyway duplicate version error** 가 발생한다. develop 머지 후 운영 배포 시 Flyway 가 두 마이그를 동시에 적용할 수 없어 **운영 빌드 실패** 가 예상된다.

이는 PR #35 분기 시점(`d401b23f8`)에는 충돌이 없었으나, 그 사이 PR #33이 먼저 develop에 머지되며 동일 슬롯을 점유한 결과다. **코드 수정 후 재검수가 필요한 머지 차단 사안** 으로 HIGH 1건 신규 발견된다.

---

## §2 T1~T7 시나리오 결과 매트릭스

| ID | 시나리오 | 검증 테스트 | 결과 | 비고 |
|----|---------|-----------|-----|-----|
| **T1** | `AdminServiceImpl.deleteClient` → `transitionTo(DELETED_BY_ADMIN)` redirect + audit | `AdminServiceImplDeleteRedirectTest#deleteClient_redirectsToLifecycleService` | ✅ PASS | `ArgumentCaptor<Actor>` 로 `actorUserId=ADMIN_ID` + `actorRole=ADMIN_ROLE` + 사유 정합 + `clientStatsService.evictTenantClientsWithStatsListCache` / `evictClientStatsCache` 호출 동시 검증. `userRepository.save()` 직접 호출 없음(`Strictness.LENIENT`). 단위 테스트 환경에서는 `personal_data_destruction_logs` 동시 기록은 Phase 2-α의 `UserAnonymizationService.anonymize` 위임 경로에서 발생하므로 본 T1(즉시 DELETE_BY_ADMIN) 시점에서는 진입하지 않음 — 정책 §2 흐름 표와 일치 |
| **T2** | `deleteConsultant` 활성 매핑 가드 + redirect | `AdminServiceImplDeleteRedirectTest#deleteConsultant_redirectsToLifecycleService` / `deleteConsultant_activeMapping_doesNotRedirect` | ✅ PASS | 활성 매핑 0건 → `transitionTo(DELETED_BY_ADMIN)` 1회 + `save(any)` never 검증. 활성 매핑 1건 → `RuntimeException` + `transitionTo` 0회 호출 |
| **T3** | `AdminDeleteRetentionScheduler` 7일 윈도우 cron + `REQUIRES_NEW` 격리 + dry-run | `AdminDeleteRetentionSchedulerTest` 4건 | ✅ PASS | (1) 후보 0건 → `transitionTo` 0회. (2) 만료 후보 2건 → ANONYMIZED 2회 + 사유 `Q5 7-day window expired (ADMIN_FORCED_DELETE_ANONYMIZED)`. (3) 1번 실패해도 다음 사용자 계속 처리(REQUIRES_NEW 격리). (4) `setDryRunForTest(true)` → `transitionTo` 0회 + 후보 수만 반환. cron 표현식 `0 30 3 * * *` zone `Asia/Seoul` 도 코드상 검증 |
| **T4** | `POST /api/v1/admin/users/{userId}/restore` — 7일 내 200 / 7일 외 409 / 404 / audit `ADMIN_RESTORE` | `AdminUserLifecycleControllerTest#restoreUser_within7Days_success` + `restoreUser_after7Days_returns409` + `restoreUser_notDeletedByAdmin_returns409` + `restoreUser_targetNotFound_returns404` + `UserLifecycleServiceImplTest#transitionTo_deletedByAdmin_to_active_restore` | ✅ PASS | 7일 내: `transitionTo(ACTIVE)` 호출 + 사유 `"ADMIN_RESTORE: "` prefix + `notificationLifecycleService.send` 1회. 7일 외: 409 + `transitionTo`/알림 0회. `lifecycle_state != DELETED_BY_ADMIN`: 409. 미존재: 404. audit_logs action=`ADMIN_RESTORE` 정합 (`UserLifecycleServiceImplTest`에서 `ArgumentCaptor<AuditLog>` 캡쳐) |
| **T5** | `GET /api/v1/admin/users/pending-deletion` — DTO 매핑 + 이메일 마스킹 + 정렬 + 페이징 | `AdminUserLifecycleControllerTest#listPendingDeletion_returnsPagedDto` + `maskEmail_normal` + `maskEmail_blank` + `calculateDaysRemaining_basic` + `calculateDaysRemaining_expired` | ✅ PASS | `findPendingDeletionByTenantId(tenantId, cutoff, pageable)` 호출 + `Sort.by(DESC, deletedAt)` + 페이지 메타(`totalElements`/`retentionWindowDays=7`) + `maskEmail("abc@example.com")` → `"a**@example.com"` + 7일 보존 윈도우 남은 일 계산(elapsed=3 → 3~4) + 만료 → 0 |
| **T6** | 프론트 `RestoreUserModal` (UnifiedModal SSOT + 사유 필수 + 409 처리) | `frontend/.../RestoreUserModal.test.js` 4건 | ✅ PASS | (1) `isOpen=false` → null 렌더 (2) 빈 사유 + 확인 → 에러 + API 미호출 (3) 정상 사유 → `POST /api/v1/admin/users/{userId}/restore` + `{reason}` body + `onRestored(userId)` + `onClose` + `showSuccess('사용자 되돌리기 완료')` (4) 409 응답 → `showError("이미 익명화 진입, 복원 불가")` + 모달 유지 + `onRestored`/`onClose` 미호출. UnifiedModal jest mock으로 SSOT 사용 검증 |
| **T7** | 프론트 `PendingDeletionList` — 색상 분기 + EmptyState + 되돌리기 모달 트리거 | `frontend/.../PendingDeletionList.test.js` 3건 | ✅ PASS | (1) API `GET /api/v1/admin/users/pending-deletion?page=0&size=20&role=ALL` 호출 + 행 3개 렌더 + `daysRemaining=1→variant=danger`, `4→warning`, `7→info` 색상 분기 (2) 빈 응답 → `EmptyState` 렌더 + "삭제 대기 사용자가 없습니다" (3) "되돌리기" 버튼 클릭 → `RestoreUserModal` 오픈 + `data-user-id=101` |

**합계**: 7/7 PASS

---

## §3 회귀 매트릭스 (2-1 ~ 2-7)

| ID | 회귀 항목 | 결과 | 비고 |
|----|----------|------|-----|
| **2-1** | PR #29 (lifecycle Phase 1+2-α) 영향 없음 — 자발 탈퇴 `WITHDRAWAL_PENDING` 흐름 + `UserLifecycleService.transitionTo` / `UserAnonymizationService.anonymize` 시그니처 보존 + `audit_logs` / `personal_data_destruction_logs` 스키마 호환 | ✅ PASS | `UserLifecycleServiceImplTest` 21건 PASS (Phase 1 시나리오 `ACTIVE↔WITHDRAWAL_PENDING` + `WITHDRAWAL_PENDING→ANONYMIZED` 위임 모두 포함). `UserAnonymizationServiceImplTest` 17건 PASS — 시그니처 변경 없음. PR #35 신규 메서드(`transitionTo(DELETED_BY_ADMIN)` / `transitionTo(DELETED_BY_ADMIN→ACTIVE)`)는 기존 `transitionTo` 메서드의 새 전이 그래프 분기로 추가됨 |
| **2-2** | PR #34 (옵션 B 예약 우선 매칭) 와 conflict-free — `ScheduleServiceImpl` / `MappingCreationModal` / `IntegratedMatchingSchedule` 미수정 | ✅ PASS | PR #35 단일 커밋 `03641e99f` stat 검증 → 26 files 모두 lifecycle 도메인 한정. `AdminServiceImpl.java` 변경 영역(+112/-있음)은 `deleteClient` / `deleteConsultant` redirect 부분(L2890~L2932, L3185~L3311) 한정, `checkoutSameDayCard` 신규 메서드와 충돌 영역 없음. PR #34는 develop 미머지 별도 브랜치 `feature/option-b-reservation-first-matching` 상태이므로 본 PR과 머지 시점 분리 가능 |
| **2-3** | Flyway 마이그 `V20260606_002__add_deleted_by_admin_id_to_users.sql` — `users.deleted_by_admin_id` BIGINT NULL + FK + index | ❌ **FAIL (H1)** | 컬럼/FK/index 자체는 정상 작성됨(JPA `User.deletedByAdminId @Column(name = "deleted_by_admin_id")` 매핑 정합). **그러나 develop 머지 차단 사안 발견**: develop 최신(`16b3fd0e5`)에 이미 머지된 PR #33이 동일 `V20260606_002` 슬롯을 `add_withdrawal_options_to_users.sql` 로 점유. 본 PR의 `add_deleted_by_admin_id_to_users.sql` 머지 시 Flyway 가 같은 버전 번호로 두 다른 SQL 파일을 발견하여 `Duplicate migration version detected` 오류 발생 예정. **§6 H1** 참고. SQL 내용 자체는 PR #32 hotfix 패턴(`V20260530_003 → V20260606_001` rename) 으로 `V20260606_003__add_deleted_by_admin_id_to_users.sql` 로 rename 하면 즉시 해소된다 |
| **2-4** | tenantId 멀티테넌트 격리 — `deleteClient` / `deleteConsultant` / `restore` API / `listPendingDeletion` | ✅ PASS | `AdminServiceImpl.deleteClient/deleteConsultant`: `getTenantId()` 호출 후 `userRepository.findByTenantIdAndId(tenantId, id)` 사용. `AdminUserLifecycleController`: `TenantContextHolder.getTenantId()` 추출 후 (a) `findByTenantIdAndId` (b) `findPendingDeletionByTenantId(tenantId, cutoff, pageable)` (c) `findPendingDeletionByTenantIdAndRole(tenantId, cutoff, role, pageable)` 모두 tenantId 필수 인자. tenantId 누락 시 `FORBIDDEN` 응답 |
| **2-5** | 7일 윈도우 경계 케이스 — 정확히 7일 0초 보존 / 7일+ε anonymize / KST timezone / dry-run 분기 | ✅ PASS | `AdminDeleteRetentionScheduler#runOnce`: `LocalDateTime.now(KST).minusDays(7)` cutoff + `findExpiredDeletedByAdminUsers(cutoff)` (`deleted_at < cutoff` strict less-than → 7일 0초 행은 보존, 7일+1초 행은 anonymize). `AdminUserLifecycleController#restoreUser`: `LocalDateTime.now().minusDays(7)` + `target.getDeletedAt().isBefore(cutoff)` 동일 strict-less 의미론 → 정확히 7일 시점에는 복원 허용. **다만** `restoreUser`가 `LocalDateTime.now()` (서버 default zone)을 사용하고 scheduler는 `LocalDateTime.now(KST)` 명시 → 운영 환경이 KST이 아닌 경우 미세 차이 가능(L1, §6) |
| **2-6** | UnifiedModal SSOT 준수 (D11) — RestoreUserModal UnifiedModal 기반 + 커스텀 오버레이 0건 | ✅ PASS | `RestoreUserModal.js` 코드 검토: UnifiedModal mock으로 jest 테스트 통과. lint:codemod-mappings 게이트 PASS (가드 1·2 모두 통과). 자체 오버레이/포털 추가 없음. `MGButton` `primary`/`secondary` variant 사용 검증 |
| **2-7** | i18n 시드 키 누락 0건 — `userManagement.pendingDeletion.*` namespace | ✅ PASS | `frontend/src/locales/ko/admin.json` `userManagement.pendingDeletion` 하위 키 **29건** 적재 (요구 9~12 키 초과 충족): `tabTitle`, `pageTitle`, `subtitle`, `empty`, `loading`, `loadError`, `column.{name,email,role,deletedAt,daysRemaining,reason,deletedByAdmin,actions}`, `daysRemainingValue/Expired`, `action.restore`, `modal.{title,subtitle,reasonLabel,reasonPlaceholder,reasonHint,confirm,cancel}`, `toast.{success,failure}`, `error.{reasonRequired,reasonTooLong,expired}`. `npm run check:i18n-seed` PASS — 14 파일 시드 정상 (자기참조 0 / 빈값 0) |

**합계**: 6/7 PASS + 1/7 FAIL (2-3 — H1 Flyway 슬롯 충돌)

---

## §4 게이트 5종 결과

| # | 게이트 | 명령 | 결과 | 비고 |
|---|--------|------|------|------|
| 1 | **mvn 백엔드** | `mvn -q -DfailIfNoTests=false -DargLine=-Xmx2g test -Dtest='AdminServiceImpl*Test,AdminDeleteRetentionSchedulerTest,AdminUserLifecycleControllerTest,UserLifecycleServiceImplTest,UserAnonymizationServiceImplTest'` | ✅ **82 / 0F / 0E / 0S** | `BUILD SUCCESS`. 코더 산출 `mvn 65 PASS` 보다 광범위(테스트 클래스 와일드카드 매칭으로 `AdminServiceImplConfirmDepositApproveTest` 4 + `AdminServiceImplUpdateClientTest` 5 + `AdminServiceImplCreateMappingSingleSessionGuardTest` 4 + `AdminServiceImplMappingSettlementNotificationBaselineTest` 3 + `AdminServiceImplPartialRefundExhaustedScheduleCancelTest` 5 + `AdminServiceImplRegisterClientContactTest` 6 추가 검증). 핵심 클래스: `AdminDeleteRetentionSchedulerTest` 4, `AdminUserLifecycleControllerTest` 9, `AdminServiceImplDeleteRedirectTest` 4, `UserLifecycleServiceImplTest` 21, `UserAnonymizationServiceImplTest` 17 |
| 2 | **Jest 프론트** | `cd frontend && npm test -- --watchAll=false --testPathPattern='RestoreUserModal|PendingDeletion|userManagement'` | ✅ **2 suites / 7 tests PASS** | `RestoreUserModal.test.js` 4 + `PendingDeletionList.test.js` 3. defaultProps 경고는 React 18 마이그레이션 부채(기존 패턴, 코드 동작에 영향 없음, L2) |
| 3 | **i18n-seed** | `npm run check:i18n-seed` | ✅ PASS | 14 파일 시드 정상 (자기참조 0 / 빈값 0) |
| 4 | **lint:codemod-mappings (D11)** | `npm run lint:codemod-mappings` | ✅ PASS | 가드 1·2 모두 통과 — codemod 진입 안전 |
| 5 | **check-hardcode (운영 게이트)** | `bash config/shell-scripts/check-hardcode.sh` | ✅ **errors=0** | 신규 PR errors 0건. 전체 warnings 5606 중 PR #35 변경 파일 관련 warnings 99건 — 모두 기존 자산(`AdminServiceImpl.java` 36, `AdminController.java` 13, `UserRepository.java` 9)의 주석/메시지 패턴이며 PR #35 신규 코드는 `AdminUserLifecycleController.java` 1 + `AdminDeleteRetentionScheduler.java` 1 + `RestoreUserModal.js` 1 + `PendingDeletionList.js` 0 (모두 Javadoc/주석/상수 false-positive). 운영 게이트 기준(errors=0) 충족 |

---

## §5 dry-run 1주 운영 권고 (코더 권고 인용)

코더 산출물 + 본 검수에서 다음 운영 절차를 권고한다:

1. **D-day (V20260606_002 적용)**: `feature/lifecycle-phase2-beta-admin-delete` 머지 → `develop` → 자동 배포 (`USER_LIFECYCLE_TERMINATION_POLICY.md` v1.1 §0.1 Q5 기반)
2. **D+0 ~ D+7 (dry-run 1주)**:
    - `application.yml` (또는 환경변수) `mindgarden.scheduler.admin-delete-retention.dry-run=true` 설정 후 배포
    - 매일 03:30 KST cron 실행 → `[AdminDeleteRetention] DRY-RUN — would anonymize N users (cutoff=...)` 로그 모니터링
    - 후보 사용자 명세(`userId`/`deletedAt`/`deletedByAdminId`) 운영 감사 추적
    - `audit_logs` / `personal_data_destruction_logs` 신규 row 없음 검증 (dry-run 진입 시 아무 변경 없음)
3. **D+7 (dry-run 종료)**:
    - dry-run 1주간 후보가 의도된 사용자(어드민이 강제 종료 후 7일 경과한 행)만 포함하는지 운영 결재
    - 결재 통과 시 `dry-run=false` 로 토글 + 배포 → 실제 anonymize 진행
4. **D+8 이후 (실 운영)**:
    - 첫 실 실행 결과(`[AdminDeleteRetention] executed: anonymized=N`) 모니터링
    - `personal_data_destruction_logs` 적재 검증 + `users.email_tombstone_hash` (W3 tombstone) 정합 확인

본 PR의 운영 반영은 **별도 릴리스 라인** — PR #33 + PR #34 통합 배포(Agent `e37afab6`)와는 분리해서 진행한다.

---

## §6 발견 사항 + Severity

### HIGH (H) — 머지 차단 사안

#### H1 — Flyway `V20260606_002` 슬롯 충돌 (develop 머지 차단)
- **위치**: `src/main/resources/db/migration/V20260606_002__add_deleted_by_admin_id_to_users.sql` (PR #35) vs `V20260606_002__add_withdrawal_options_to_users.sql` (PR #33, 이미 develop 머지됨 `432a5e8d1`)
- **현황**: PR #35 분기 시점(`d401b23f8`)에는 `V20260606_001` 만 존재했으나, 검수 진행 중 develop 최신(`16b3fd0e5`)에 PR #33 (자발 탈퇴 마이페이지 UI) 이 먼저 머지되며 동일 `V20260606_002` 슬롯을 점유. 본 PR 머지 시 Flyway 가 같은 버전 번호로 두 다른 SQL 파일을 발견하여 `FlywayException: Found more than one migration with version 2026.06.06.002` 형태의 에러로 운영 빌드/배포가 차단된다.
- **검증 기준**: 본 검수자는 `git checkout develop && git pull --ff-only` 직후 `ls src/main/resources/db/migration/V20260606*` 로 다음 결과를 확인:
  ```
  V20260606_001__lnb_admin_billing_menus.sql
  V20260606_002__add_withdrawal_options_to_users.sql  (develop 현재)
  ```
  PR #35 머지 시 `V20260606_002__add_deleted_by_admin_id_to_users.sql` 가 추가되어 충돌.
- **운영 영향**: **운영 배포 시 Flyway duplicate version 에러로 부트 실패** — 즉시 롤백 필요. 머지 자체는 Git 충돌 없이 가능(파일명 다름)하지만 Flyway 적용 단계에서 에러.
- **권고**: 본 PR 의 SQL 파일을 즉시 `V20260606_003__add_deleted_by_admin_id_to_users.sql` 로 rename + Java 측 참조 주석(`User.java` Javadoc, `V20260606_002` 인용 부분) 동시 갱신. PR #32 hotfix(`V20260530_003 → V20260606_001`) 와 동일 패턴. rename 1줄 수정 → 운영 게이트 5종 재검증 → 본 보고서 §1 결론 `PASS` 갱신.
- **위임 대상**: `core-coder` — `core-tester` 는 코드 수정 금지로 본 검수 범위 밖. **수정 후 본 보고서를 재발급하거나 §1 결론을 갱신한다.**

### MEDIUM (M)

#### M2 — `mindgarden.scheduler.admin-delete-retention.*` 의 `application.yml` 기본 설정 부재
- **위치**: `src/main/resources/application*.yml`
- **현황**: `AdminDeleteRetentionScheduler` 는 `@ConditionalOnProperty(matchIfMissing = true)` + `@Value` 기본값(`cron=0 30 3 * * *`, `dry-run=false`)으로 안전하게 동작하지만, **운영 yml에 명시되어 있지 않다**. dry-run 1주(D+0~D+7) 진입을 위해서는 운영자가 별도 환경변수 또는 yml 변경이 필요.
- **운영 영향**: dry-run 미설정 시 D-day 배포 즉시 실제 anonymize 진입 — 1주 dry-run 정책 위반 위험.
- **권고**: 운영 반영 전 `application.yml` (또는 운영 ConfigMap) 에 명시적으로 다음을 추가:
  ```yaml
  mindgarden:
    scheduler:
      admin-delete-retention:
        enabled: true
        cron: "0 30 3 * * *"
        dry-run: true   # D+7 까지 유지 → 운영 결재 후 false 로 토글
  ```

### LOW (L)

#### L1 — `restoreUser`의 `LocalDateTime.now()` vs scheduler의 `LocalDateTime.now(KST)` 미세 불일치
- **위치**: `AdminUserLifecycleController.java:173` (`restoreUser`) / `:107` (`listPendingDeletion`) vs `AdminDeleteRetentionScheduler.java:93` (`runOnce`)
- **현황**: scheduler는 명시적으로 `LocalDateTime.now(KST)` 사용하나 controller 측은 default zone(`LocalDateTime.now()`)을 사용. 운영 JVM이 KST(`Asia/Seoul`) 가 아니면 윈도우 경계 시각에 미세 차이 발생 가능.
- **운영 영향**: 운영 JVM은 통상 `Asia/Seoul` TZ로 설정되어 있으므로 실 운영 영향 없음. 다만 unit test 환경 또는 docker 컨테이너에서 TZ 누락 시 경계값 ε 차이 가능.
- **권고**: 운영 반영 전 `JAVA_OPTS=-Duser.timezone=Asia/Seoul` 확인 또는 controller 측도 `LocalDateTime.now(ZoneId.of("Asia/Seoul"))` 로 통일.

#### L2 — React 18 defaultProps 경고 (RestoreUserModal)
- **위치**: `frontend/src/components/admin/RestoreUserModal.js:24` (line number from Jest console)
- **현황**: `RestoreUserModal: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.`
- **운영 영향**: 없음 — 기능 동작 정상, React 18 deprecation 경고.
- **권고**: 후속 마이너 패치에서 `function RestoreUserModal({ isOpen = false, ... })` 디폴트 매개변수 패턴으로 마이그레이션. 본 PR 운영 반영을 차단하지 않음.

#### L3 — 알림 발송 `NotificationType.WITHDRAWAL` 재사용
- **위치**: `AdminUserLifecycleController.java:222` (`notifyAdminRestore`)
- **현황**: 어드민 복원 알림을 `NotificationType.WITHDRAWAL` 로 발송. 의미적으로는 어드민 강제 종료/복원 통보이지만 enum이 자발 탈퇴 라벨을 재사용.
- **운영 영향**: 없음 — 알림 채널 라우팅·전송은 정상 동작. 사용자 화면에서 알림 카테고리가 "탈퇴 관련"으로 표시될 가능성.
- **권고**: 후속 패치에서 `NotificationType.ADMIN_LIFECYCLE_RESTORE` (또는 `ADMIN_FORCE_DELETE_RESTORE`) enum을 신설하여 분리. 본 PR 운영 반영을 차단하지 않음.

---

## §7 별도 릴리스 권고 (PR #33 + PR #34 통합 배포와 분리, 부하 분산)

본 PR(#35)은 다음 이유로 PR #33 + PR #34 통합 배포 라인(Agent `e37afab6`)과 **별도 릴리스 라인**으로 진행할 것을 권고한다:

1. **운영 검증 절차 차이**: PR #33/#34는 사후 결제·매칭 흐름 — 즉시 실 트래픽 검증 가능. 본 PR은 **cron 기반 자동 anonymize** 흐름으로 1주 dry-run 검증 필요.
2. **롤백 비용 차이**: PR #33/#34 롤백은 매핑/스케줄 도메인 한정. 본 PR 롤백은 `audit_logs` / `personal_data_destruction_logs` 적재 후 사용자 데이터 anonymize 완료 시점부터는 **사실상 되돌릴 수 없음**(PII 복원 불가, 정책 §1 D5).
3. **운영 결재 분리**: 본 PR은 정책 §0.1 Q5 결정에 따른 7일 보존 윈도우 + 어드민 되돌리기 UI 정착 — `USER_LIFECYCLE_TERMINATION_POLICY.md` 결재 흐름과 함께 운영 반영 시점 결정 필요.
4. **부하 분산**: PR #33 + PR #34 통합 배포와 동시 진행 시 회귀 영향 분리 어려움. 별도 릴리스로 사용자/운영자의 모니터링 부담 분산.

### 권장 릴리스 순서

```
[Track A — 즉시 가능]
  PR #33 + PR #34 통합 → develop → 운영 반영 (Agent e37afab6)

[Track B — 별도 라인]
  PR #29 + PR #35 → develop → V20260606_002 적용
    → application.yml dry-run=true
    → D+0 ~ D+7 dry-run 모니터링
    → 운영 결재 후 dry-run=false 토글 → 실 운영 진입
```

---

## §8 검증 환경

| 항목 | 값 |
|------|---|
| OS | Darwin 25.5.0 (macOS) |
| Java | 17+ (mvn surefire) |
| Maven | wrapper `./mvnw` 환경 |
| Node | 18+ (frontend Jest) |
| 검수 워크트리 | `/Users/mind/mindGarden-phase2beta` |
| 검수 시점 commit | `03641e99f` (PR #35 HEAD) |
| 비교 base | `d401b23f8` (develop merge 직후) |

---

## §9 참조 문서

- 정책 SSOT: `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` v1.1 (§0.1 Q5 / §2 / §8)
- 표준: `docs/standards/TESTING_STANDARD.md`, `docs/standards/API_DESIGN_STANDARD.md`, `docs/standards/ERROR_HANDLING_STANDARD.md`
- 관련 PR: #29 (lifecycle Phase 1+2-α) · #34 (옵션 B 예약 우선 매칭, conflict-free 재확인) · #33 (사후 결제 흐름)
- 운영 게이트: `config/shell-scripts/check-hardcode.sh` + `scripts/i18n/validate-i18n-seed.js` + `scripts/design-system/color-management/validate-codemod-mappings.js`

---

**검수 완료**: 2026-05-28 KST · core-tester

본 보고서는 **읽기 전용** 검수 결과이며 코드 수정은 수행하지 않았다.

**HIGH 1건(H1 — Flyway V20260606_002 슬롯 충돌, develop 머지 차단) 발견 → 즉시 메인 보고 + STOP 트리거 적용**. `core-coder` 위임으로 `V20260606_002__add_deleted_by_admin_id_to_users.sql` → `V20260606_003__add_deleted_by_admin_id_to_users.sql` rename 1건 수정 후 본 보고서를 재발급한다 (또는 §1 결론을 PASS 로 갱신한다).
