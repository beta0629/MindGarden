# Phase 3 (PR #40) + Phase 4 (PR #41) 통합 회귀 검수 보고서

- **작성일**: 2026-05-28
- **작성자**: core-tester
- **검수 범위**: PR #40 (Phase 3 휴면/익명화 배치) + PR #41 (Phase 4 커뮤니티 옵션 b + 어드민 모니터링 UI)
- **base 분기**: `feature/lifecycle-phase4-community-anonymize-admin-ui` (PR #40 위 stacked, HEAD `2b9370cd4`)
- **PR #40 commit**: `740024154`
- **PR #41 commit**: `2b9370cd4`
- **정책서**: `USER_LIFECYCLE_TERMINATION_POLICY` v1.2 §10.9 (Q9) + §10.12 (Q12) + §11

---

## 0. 결론

| 항목 | 결과 |
|------|------|
| **종합 판정** | **PASS** — 통합 운영 반영 권고 |
| 게이트 5종 (PR #40 단독) | 5/5 PASS |
| 게이트 5종 (PR #41 통합 stacked) | 5/5 PASS |
| Phase 3 시나리오 (T3-1~T3-7) | 7/7 PASS |
| Phase 4 시나리오 (T4-1~T4-6) | 6/6 PASS |
| 회귀 매트릭스 (R1~R8) | 8/8 PASS |
| Flyway H2 통합 | PASS (V20260606_004 + _005) |
| 정책서 정합 (§10.9 / §10.12) | PASS |
| PII 암호화 보안 (AES-256-GCM) | PASS |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 2 (정책서 본 워크트리 미동기 / 한글 하드코딩 워닝 5,671건 — 둘 다 별도 트랙) |

---

## 1. Phase 3 시나리오 매트릭스 (T3-1 ~ T3-7)

| # | 시나리오 | 검증 근거 | 결과 |
|---|----------|-----------|------|
| T3-1 | `BusinessMode.NON_MEDICAL` + 1년 DORMANT 진입 | `DormantUserBatchService` 04:00 KST cron + `findDormantBatchCandidates(cutoff = now-1Y)` (UserRepository.java:1589) + dry-run 4 시나리오 | PASS |
| T3-2 | DORMANT 4년 후 ANONYMIZE | `AnonymizeBatchService` 04:30 KST cron + `findDueForAnonymization(now)` + UserLifecycleService.transitionTo(ANONYMIZED) + vault hard delete | PASS |
| T3-3 | 30일 사전 통지 | `DormantUserPreNoticeService` 09:00 KST cron + `findDueForPreNotice(now+30d)` + EMAIL→KAKAO→SMS 우선순위 + audit_logs(AUTO_ANONYMIZE_NOTIFIED) + vault stamp | PASS |
| T3-4 | 활성 복귀 | `UserLifecycleServiceImpl.reactivate()` — vault 복호화 + `DormantUserPiiSnapshot.applyTo(user)` + ACTIVE 전이 + audit(PII_VAULT_RESTORE) + vault delete | PASS |
| T3-5 | PII 암호화 | AES-256-GCM, nonce 매번 `SecureRandom.nextBytes(new byte[12])`, tag 16 bytes 검증, JSON `{v,nonce,ciphertext,tag}` 봉투 | PASS |
| T3-6 | tenantId 격리 | vault 조회/INSERT/UPDATE/DELETE 모두 `(userId, tenantId)` 페어로 통과 (`uq_dormant_pii_user_tenant` UNIQUE 인덱스 보장) — SYSTEM cron 의 across-tenant 조회는 단건 처리 시 `tenantId` 정합 검증 | PASS |
| T3-7 | dry-run default=true | application.yml `MINDGARDEN_SCHEDULER_*_DRY_RUN:true` + `@Value(":true")` default + `@ConditionalOnProperty(matchIfMissing = true)` | PASS |

### 핵심 코드 정합

- **AES-256-GCM key 미설정 시 startup 통과**: `decodeKey(...)` 빈 배열 반환 → `ensureKeyConfigured()` 가 실제 호출 시점에만 `IllegalStateException` 발생. 운영 키 미주입 시 부트는 가능하지만 vault 사용은 차단됨 (Phase 3 의도된 안전 default).
- **REQUIRES_NEW 격리**: `transitionSingle` / `anonymizeSingle` / `notifySingle` 모두 `@Transactional(propagation = REQUIRES_NEW)` → 단일 사용자 실패가 배치 전체를 중단하지 않음.
- **time isolation**: 03:00 (자발 탈퇴 30일 만료, PR #33), 04:00 (DORMANT), 04:30 (ANONYMIZE), 09:00 (사전 통지) — 4 cron 모두 분리. R4 회귀 정합.

---

## 2. Phase 4 시나리오 매트릭스 (T4-1 ~ T4-6)

| # | 시나리오 | 검증 근거 | 결과 |
|---|----------|-----------|------|
| T4-1 | community_posts/comments 작성자 익명화 (옵션 b) | `CommunityAnonymizationServiceImpl.anonymizeCommunityRecords()` — `findByAuthor_Id(userId)` → `tenantId.equals` 필터 → `author_anonymized=true` 토글, **본문은 절대 setBody() 호출 없음** (옵션 b 보존 보장) | PASS |
| T4-2 | community_anonymization_audit 기록 | `body_hash`(SHA-256 hex) + `community_table` + `record_id` + `original_user_id` + `anonymization_reason` + `actor_user_id` + `actor_role` 모두 INSERT (행마다 1건, 멱등 가드는 `!isAuthorAnonymized()` 사전 필터로 중복 INSERT 방지) | PASS |
| T4-3 | UserAnonymizationService 통합 | `UserAnonymizationServiceImpl.anonymize()` 의 동일 `@Transactional` 안에서 `communityAnonymizationService.anonymizeCommunityRecords(userId, tenantId, resolveCommunityReason(reason), actor.getActorUserId(), actor.getActorRole())` 호출 | PASS |
| T4-4 | 프론트엔드 작성자 표시 | `frontend/src/utils/communityAuthorDisplay.js` — `getAuthorDisplay()`/`getAuthorAvatarInitial()`/`shouldShowAuthorProfileImage()`. CommunityFeed/PostDetail 통합 (`grep authorAnonymized` = 5건). `safeDisplay.toDisplayString` 경계 호출. i18n: ko/community.json `anonymizedAuthor: "[삭제된 사용자]"` | PASS |
| T4-5 | 어드민 휴면 모니터링 UI | `/admin/lifecycle/dormant-users` 라우트 (App.js) + DormantUsersPage / DormantUsersList / DormantUserDetail / ReactivateUserModal / ForceAnonymizeUserModal — 모두 UnifiedModal 사용. dormantUsersApi 4 endpoint. 페이지네이션 / 상세 / reactivate / 강제 익명화 | PASS |
| T4-6 | community_replies 미존재 처리 | V20260606_005 SQL 명시 `community_replies 테이블은 미존재 — 본 PR 처리 대상 외`. application.yml `tables=community_posts,community_comments` (replies 미포함). `enabledTables.contains(...)` 가드로 신규 테이블 도입 시 토글로 활성화 가능 | PASS |

### 옵션 b 본문 보존 검증 (정책서 §10.12 Q12 핵심)

`CommunityAnonymizationServiceImpl` 흐름에서 `post.setBody(...)` 또는 `comment.setBody(...)` 호출 **0건** 확인. `author_anonymized=true` + `author_anonymized_at=now` 만 토글하며 본문은 절대 변조하지 않음. 단, **자발 탈퇴 옵션 B**(`WithdrawalOptions.deleteCommunityBody=true`) 분기는 `UserAnonymizationServiceImpl.applyCommunityBodyOption()` 에서 별도 처리 (사용자 본인이 명시적으로 본문 삭제 선택했을 때만 — 정책서 §10.12 Q12 본인 동의 옵션 정합).

---

## 3. 회귀 매트릭스 (R1 ~ R8)

| # | 회귀 영역 | 검증 결과 | 비고 |
|---|-----------|-----------|------|
| R1 | PR #35 (Phase 2-β, V20260606_003) 충돌 | conflict-free | 본 브랜치는 `_003` 슬롯 미점유. PR #35 머지 시 채번 충돌 0 |
| R2 | PR #39 (Phase 5) 충돌 | conflict-free | application.yml `mindgarden.lifecycle.*` 블록 additive 추가만 — 기존 `cutoff.user-data-years` 와 키 중복 없음 |
| R3 | PR #29 Phase 1+2-α 호환 | PASS | `UserLifecycleServiceImplTest` 22/22, `UserAnonymizationServiceImplTest` 24/24 (보강 후) — 기존 ACTIVE/WITHDRAWAL_PENDING/DELETED_BY_ADMIN 전이 회귀 0 |
| R4 | PR #33 자발 탈퇴 호환 | PASS | `WithdrawalGracePeriodScheduler` 03:00 KST vs `DormantUserBatchService` 04:00 KST — 시간대 분리. `WithdrawalGracePeriodScheduler` 코드 변경 0 |
| R5 | PR #34 옵션 B 호환 | PASS | `AdminServiceImpl.checkoutSameDayCard` 코드 변경 0. PR #40/#41 은 `AdminServiceImpl` 외부 신규 컨트롤러/서비스 추가만 |
| R6 | tenantId 격리 | PASS | 신규 쿼리 `findDormantUsersByTenantId` / `findDormantUserByTenantIdAndId` / `findByUserIdAndTenantId` / `countByTenantIdAndOriginalUserId` 모두 tenantId 필터. `AdminLifecycleDormantUsersController` 의 4 endpoint 모두 `TenantContextHolder.setTenantId(admin.getTenantId().trim())` finally clear. `CommunityAnonymizationServiceImpl` 의 community 조회는 `tenantId.equals(p.getTenantId())` filter |
| R7 | UnifiedModal SSOT | PASS | `ReactivateUserModal` / `ForceAnonymizeUserModal` / `DormantUserDetail` 모두 `import UnifiedModal from '../../common/modals/UnifiedModal'` 사용. 신규 모달 0 (raw modal/portal 직접 사용 0) |
| R8 | i18n 시드 | PASS | `npm run check:i18n-seed` PASS — 16 파일 자기참조 0 / 빈값 0. ko/community.json 신규 (4 key — anonymizedAuthor / anonymizedAuthorDescription / profileImagePlaceholder / anonymizedAvatarInitial). ko/admin.json `lifecycle.dormantUsers.*` 신규 시드 |

---

## 4. 게이트 5종 결과

### 4-1. PR #40 단독 (Phase 3)

| # | 게이트 | 명령 | 결과 |
|---|--------|------|------|
| G1 | mvn test 패턴 | `*DormantUserBatch*Test,*AnonymizeBatch*Test,*DormantUserPreNotice*Test,UserLifecycleServiceImpl*Test,*DormantUserPiiVault*Test,*DormantPiiVault*Test` | PASS — 59/59 (DormantUserBatch 7, Anonymize 5, PreNotice 7, UserLifecycle 22, Reactivate 7, PiiVaultRepo 5, PiiVaultImpl 6) |
| G2 | Jest | (Phase 3 백엔드 전용 — N/A) | N/A |
| G3 | i18n 시드 | `npm run check:i18n-seed` | PASS — 16 파일 자기참조 0/빈값 0 |
| G4 | codemod mappings | `npm run lint:codemod-mappings` | PASS — 가드 1·2 모두 통과 |
| G5 | hardcode | `bash config/shell-scripts/check-hardcode.sh` | PASS — **오류: 0** (워닝 5,671건은 본 PR 신규 0건, 전부 기존 코드 잔존) |

### 4-2. PR #41 통합 stacked (PR #40 위에서 실행)

| # | 게이트 | 결과 |
|---|--------|------|
| G1 | mvn test (Phase 4 패턴) | PASS — Phase 4 신규 51건 (CommunityAnonymization 9, UserAnonymization 24, AdminLifecycle 10, AdminLifecycleController 7, AuditRepo 1) + Phase 3 reactivate 호환 7. 전체 Phase 4 누적 80개 이상 모두 0 failure |
| G2 | Jest (DormantUsersList\|ReactivateUserModal\|CommunityPost) | PASS — 2 suites / 12 tests / 0 failures |
| G3 | i18n 시드 | PASS |
| G4 | codemod mappings | PASS |
| G5 | hardcode | PASS — 오류: 0 |

### 4-3. 통합 (PR #40 + PR #41 동시 회귀)

PR #41 브랜치 (Phase 3+4 통합 상태)에서 `mvn test` 전체 수행 결과:

- **TOTAL: 699 tests, 0 failures, 0 errors, 0 skipped**
- Phase 3 신규 59 + Phase 4 신규 51 + 기존 회귀 589 모두 GREEN
- exit code = 0

→ Phase 3 + Phase 4 가 통합 환경에서도 **회귀 0** 정합.

---

## 5. Flyway H2 통합 검증

### 5-1. 채번 정합 (단일 source of truth)

| 버전 | 슬롯 점유 | 상태 |
|------|-----------|------|
| V20260606_001 | LNB admin billing menus | develop 정착 |
| V20260606_002 | withdrawal_options on users (PR #33 합의 후 제자리) | develop 정착 |
| V20260606_003 | **빈 슬롯** | PR #35 (Phase 2-β) 머지 시 점유 |
| V20260606_004 | dormant_user_pii_vault (PR #40 — Phase 3) | 본 검수 대상 |
| V20260606_005 | community_anonymization_audit (PR #41 — Phase 4) | 본 검수 대상 |

→ PR #35 머지 후 PR #40/#41 머지 순서에서도 _003 ↔ _004 ↔ _005 순차 진행, conflict-free.

### 5-2. H2 부트 통합 검증

- `DormantUserPiiVaultRepositoryTest` (5 PASS, 16.63s) — H2 in MySQL mode 로 V20260606_004 적용 → vault 테이블 + UNIQUE + 인덱스 + users.last_login_at 복합 인덱스 모두 적용 검증
- `CommunityAnonymizationAuditRepositoryTest` (1 PASS, 15.11s) — H2 + V20260606_005 적용 → audit 테이블 INSERT/SELECT + community_posts.author_anonymized 컬럼 ALTER 검증

→ 단일 H2 부트로 V20260606_004 + _005 모두 적용 가능. 마이그레이션 흐름 PASS.

---

## 6. 정책서 §10.9 / §10.12 정합

| 정책 항목 | 코드 정합 | 결과 |
|-----------|-----------|------|
| §10.9 Q9 — 1년 비활성 → DORMANT | `DormantUserBatchService.DORMANT_INACTIVE_YEARS=1` + `last_login_at < now-1Y` 쿼리 | PASS |
| §10.9 Q9 — 4년 안정 보관 | `DormantUserBatchService.ANONYMIZE_AFTER_DORMANT_YEARS=4` + vault.anonymize_scheduled_at = now+4Y | PASS |
| §10.9 — 30일 사전 통지 (개인정보보호법 §29) | `DormantUserPreNoticeService.preNoticeDaysBefore=30` + EMAIL/KAKAO/SMS 우선순위 + audit_logs(AUTO_ANONYMIZE_NOTIFIED) | PASS |
| §10.9 — NON_MEDICAL default | application.yml 토글로 의료법 §22 분기 (medical-mode 별도) — 본 PR 의 default 동작은 비의료 흐름 | PASS |
| §10.12 Q12 옵션 b — 본문 KEEP + 작성자 익명 | `CommunityAnonymizationServiceImpl` 의 `setBody()` 호출 0건 + `author_anonymized=true` 토글만 | PASS |
| §10.12 Q12 — community_anonymization_audit | `body_hash` SHA-256 + `community_table`/`record_id`/`original_user_id`/`reason` + `actor_user_id`/`actor_role` 모두 적재 | PASS |
| §11 법령 매트릭스 — PIPA §16/§29/§39-6/§39-7 | `UserAnonymizationServiceImpl.resolveLegalBasis()` 매핑 정합 | PASS |

---

## 7. PII 암호화 보안 정합

| 보안 항목 | 코드 정합 | 결과 |
|-----------|-----------|------|
| 알고리즘 | `AES/GCM/NoPadding` | PASS |
| Key 길이 | 32 bytes (AES-256) — `KEY_LENGTH_BYTES=32` | PASS |
| Nonce 길이 | 12 bytes (NIST 권고) — `GCM_NONCE_LENGTH_BYTES=12` | PASS |
| Nonce 재사용 방지 | `secureRandom.nextBytes(new byte[12])` 매 encrypt 호출 — 재사용 0 | PASS |
| GCM tag | 128 bits (`GCM_TAG_LENGTH_BITS=128`) — decrypt 시 tag 검증 자동 (`Cipher.doFinal` 이 `AEADBadTagException` 발생) | PASS |
| Hardcoded key 부재 | `@Value("${mindgarden.lifecycle.dormant-pii-encryption-key:}")` 환경변수 + 하드코딩 0 | PASS |
| 키 미설정 시 부트 안전성 | `decodeKey()` 빈 배열 반환 → 호출 시점에 `ensureKeyConfigured()` 가 IllegalState 발생. 부트는 통과 (Phase 3 dry-run=true 보호) | PASS |
| 봉투 JSON 버전 관리 | `{v:1, nonce, ciphertext, tag}` — 향후 알고리즘 교체 호환성 확보 | PASS |
| nonce/tag 길이 변조 검증 | decrypt 시 `nonce.length != 12 \|\| tag.length != 16` 체크 후 IllegalArgumentException | PASS |
| GCM tag 변조 검증 | `Cipher.doFinal()` 가 `AEADBadTagException` 자동 throw → `IllegalArgumentException` 으로 변환 | PASS |

→ PII 암호화 보안 결함 **0건**.

---

## 8. HIGH · MEDIUM · LOW 항목

### HIGH

**없음** — 정책서/멀티테넌트 룰/PII 암호화/community 옵션 b 정합성에 결함 없음.

### MEDIUM

**없음**.

### LOW

| ID | 영역 | 내용 | 권고 |
|----|------|------|------|
| L1 | 정책서 동기화 | 본 워크트리에 `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` 가 미존재 (PR #40/#41 코드 주석/SQL 주석에서만 인용) | 별도 PR (예: `docs/user-lifecycle-termination-policy` 브랜치 머지) 통한 정책서 develop 동기 후 코드 인용과 cross-reference 강화. 본 PR 의 운영 반영 차단 사유 아님 |
| L2 | 한글 하드코딩 워닝 | `check-hardcode.sh` 가 5,671건 워닝 보고. 본 PR 신규 워닝 0건 (모두 기존 코드 잔존, 예: TciExtractionParser 의 척도명) | 별도 표준화 트랙으로 점진 정리. 본 PR 게이트는 "errors=0" 통과 |

---

## 9. 운영 반영 권고

### 9-1. 묶음 권고

**Phase 3 (PR #40) + Phase 4 (PR #41) 묶음 develop 머지 권고**.

근거:

1. **stacked 의존**: PR #41 의 어드민 reactivate UI 와 community 익명화 audit 가 PR #40 의 vault/snapshot/reactivate 인프라에 의존 — 두 PR 분리 머지 시 PR #41 단독 운영 불가.
2. **회귀 0**: 통합 환경 mvn 699 PASS / Jest 12 PASS / i18n+codemod+hardcode 모두 PASS.
3. **dry-run=true default**: Phase 3 의 3 cron(DormantUserBatch/AnonymizeBatch/DormantUserPreNotice) 모두 application.yml 에서 dry-run=true default 로 운영 진입. 1주 dry-run 검증 후 운영 결재로 false 전환 절차 보장.
4. **Phase 5 (PR #39) 정착 사전 조건**: PR #39 는 `mindgarden.lifecycle.cutoff.*` 만 추가하고, PR #40 은 `mindgarden.scheduler.*` + `mindgarden.lifecycle.dormant-*/anonymize-*/pre-notice-*/dormant-pii-encryption-key` 추가 → 키 충돌 0, additive merge 가능.

### 9-2. 분리 권고 (대안)

PR #40 단독 머지 (Phase 3 인프라 + dry-run 1주 운영 검증) → PR #41 (어드민 UI + community 옵션 b) 머지. 이 경우:

- PR #40 머지 후 develop 에서 1주 dry-run 결과 모니터링.
- dry-run 결과 정합 확인 후 PR #41 머지 + community 옵션 b enabled=true 운영 default 검토.

→ **묶음 권고가 우선**. 단, 운영 결재 승인 사이클상 분리가 필요하면 분리도 가능.

### 9-3. 운영 yml 점검 체크리스트

- [ ] `MINDGARDEN_DORMANT_PII_ENC_KEY` — 운영 환경변수에 Base64(32 bytes) 채움 (미설정 시 vault 호출 시점 IllegalState — Phase 3 운영 차단 의미).
- [ ] `MINDGARDEN_SCHEDULER_DORMANT_BATCH_DRY_RUN=true` 1주 유지 → 모니터링 → false 전환.
- [ ] `MINDGARDEN_SCHEDULER_ANONYMIZE_BATCH_DRY_RUN=true` 1주 유지.
- [ ] `MINDGARDEN_SCHEDULER_DORMANT_PRE_NOTICE_DRY_RUN=true` 1주 유지.
- [ ] `MINDGARDEN_COMMUNITY_ANONYMIZATION_ENABLED=true` (default) — Phase 4 enabled.
- [ ] `MINDGARDEN_COMMUNITY_TABLES=community_posts,community_comments` — community_replies 도입 시 추가.
- [ ] cron 시간대 (03:00 / 04:00 / 04:30 / 09:00 KST) 운영 점검.

### 9-4. 모니터링 권고

- 어드민 UI `/admin/lifecycle/dormant-users` — 1주차 vault present 카운트 / pre_notice_sent_at 진척 추적.
- `audit_logs.action = AUTO_ANONYMIZE_NOTIFIED` / `PII_VAULT_RESTORE` / `USER_DORMANT_TRANSITION` / `USER_ANONYMIZE` 모니터링.
- `community_anonymization_audit` 행 증가 추세 + community_posts/comments author_anonymized=true 비율.

---

## 10. 검수 메타데이터

- **검수자**: core-tester
- **검수 기간**: 2026-05-28 04:30~05:00 KST
- **base 분기**: `feature/lifecycle-phase4-community-anonymize-admin-ui` (origin sync, 2b9370cd4)
- **검수 후 코드 수정 0건** (read-only 검수 원칙 준수)
- **본 보고서 commit 후 develop 푸시 예정**

---

**End of report.**
