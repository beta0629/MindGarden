# 사용자 생애주기 종료 정책 통합 합의서 (User Lifecycle Termination Policy)

> **MindGarden core_solution 단일 SSOT**. 자발 회원탈퇴 / 어드민 강제 삭제 / 자동 휴면·파기 세 갈래를 하나의 정책 문서로 통합. **v1.1 — 사용자 결정 15건 채택 + core-debugger 운영 DB FK 실측 흡수 + core-coder Phase 0 (W1·W2) 정착.** 본 합의서는 더 이상 잠정안이 아니며, Phase 1~5 후속 위임으로 코드·마이그레이션·스키마에 단계적 반영합니다.
>
> **버전 이력**:
> - **v1.0** (2026-05-27, commit `cc7a58ad8`): 초안 — `is_active`/`is_deleted` SSOT 분기, FK cascade 정적 분석, §10 결정 질문 12개 잠정 권고.
> - **v1.1** (2026-05-27, 본 갱신): (a) core-debugger 운영 DB FK 실측 흡수 (FK 57개 — 56 `NO ACTION` + 1 `CASCADE` 인 `consultant_mood_tracking_ibfk_1`), (b) 사용자 결정 15건 (Q1~Q12 + W1~W3) 권장 default 일괄 채택, (c) §4 placeholder 제거 + 시나리오×테이블 매트릭스 본문화, (d) core-coder Phase 0 정착 (cb88d0689 + ec922de12) 흡수, (e) Phase 0~5 실행 일정 정착, (f) 부록 C·D 신설.
>
> **입력 보고서**:
> - `docs/standards/SELF_WITHDRAWAL_PROCESS_AUDIT.md` (자발 회원탈퇴 점검 — Agent `cda90711`)
> - `docs/standards/CLIENT_HARD_DELETE_IMPACT_ANALYSIS.md` (내담자 hard delete 영향도 — core-planner 재분석)
> - `/tmp/fk-survey-report.md` (core-debugger 운영 DB FK 실측 — v1.1 작성 시점에 임시 파일 삭제됨. 본 합의서 §4·부록 C 는 위임 프롬프트 요약 + V20260604_001/_002 헤더 주석 흡수로 재구성, 일부 항목 추정 명시)
> - `V20260604_001` / `V20260604_002` 마이그레이션 본문 (commit `cb88d0689`) — §8 본문 직접 입력
>
> **작성**: core-planner (2026-05-27). 코드 0건 수정. 마크다운만 산출.

---

## §0. TL;DR — v1.1 정착 요약 (메인 어시스턴트·사용자 1쪽 인용용)

### §0.1 사용자 결정 15건 — 전원 권장 default 일괄 채택

| 결정 ID | 항목 | 채택 결과 |
|---|---|---|
| **Q1** | SSOT 통일 | 단일 `lifecycle_state` enum 채택 (`ACTIVE` / `SUSPENDED` / `DORMANT` / `WITHDRAWAL_PENDING` / `ANONYMIZED` / `HARD_DELETED` / `DELETED_BY_ADMIN`). `is_active` 는 운영적 정지(잠금·심사·미인증)로 의미 분리. |
| **Q2** | 기본 시나리오 | Scenario A (PII Anonymization). 단 `mood_journal_*`, `self_assessment_*` 만 Q8 결정으로 HARD_DELETE 분기. |
| **Q3** | 자발 탈퇴 유예기간 | 30일. |
| **Q4** | 다중 역할 | 전체 탈퇴만 (역할 분리 불가). |
| **Q5** | 어드민 강제 종료 보존 | 7일 (롤백 가능 윈도우). |
| **Q6** | 재가입 cooldown | 즉시 가능 + 어드민 사유별 cooldown 옵션 어드민 설정 가능. |
| **Q7** | CONSULTANT `specialization` | KEEP (통계 우선). |
| **Q8** | `mood_journal_*` / `self_assessment_*` | HARD_DELETE (애플리케이션 명시 DELETE — DB FK cascade 안 됨). |
| **Q9** | DORMANT → ANONYMIZED 추가 경과 | 4년 (총 5년) + 별도 PII vault 테이블. |
| **Q10** | `consultation_records` 보존 | 10년 (의료법 §22). 법무 자문 별도 추적. |
| **Q11** | 자유 입력 PII 스크러빙 | 정규식 우선 → AI 단계적 도입. |
| **Q12** | `community_*` 본인 글 | author 익명화 (default) + 본인 옵션 "본문도 삭제" 선택 가능. |
| **W1** | 컴플라이언스 추적 6 테이블 신설 (P0) | `audit_logs`, `notifications`, `personal_data_destruction_logs`, `consultant_client_mapping_history`, `session_compensation_history`, `client_satisfaction_surveys` — 즉시 마이그레이션 (core-coder 병행). |
| **W2** | `personal_data_access_logs.target_user_id` 타입 (P0) | `varchar(255)` → `bigint`. 운영 0 행 = 안전 무중단. |
| **W3** | email tombstone 의무화 (P0) | 패턴 `deleted-{uid}-{epoch}@anonymized.local`. 자발/강제 anonymize 시점에 즉시 적용. |

### §0.2 현 운영 상태 — 골든 윈도우

| 항목 | 값 | 의미 |
|---|---|---|
| 운영 users 총 | **28** | CLIENT 25 / CONSULTANT 2 / ADMIN 1 |
| `is_deleted=TRUE` | **0** | 자발 탈퇴자 없음 |
| `is_active=FALSE` | **0** | 분기 risk 정량 측정 불가 (코드 분기로만 잠재 risk 잔존) |
| `(email, tenant_id)` 중복 | **0** | UNIQUE 제약 충돌 가능성은 anonymize 부재 시 100% |
| `personal_data_access_logs` 행 | **0** | W2 타입 변경 무중단 가능 |

→ **운영 본격 가동 전인 지금이 SSOT 통일·P0 마이그레이션·anonymize 표준을 무비용으로 정착할 마지막 기회**.

### §0.3 핵심 발견 5건 (debugger 보고서 §0 그대로 인용)

1. **`users.id` 참조 FK 57개 중 56개 `NO ACTION` + 1개 `CASCADE`** (`consultant_mood_tracking_ibfk_1`). hard delete 시 56개 FK 가 즉시 차단함.
2. **핵심 비즈니스 테이블 (`schedules`, `payments`, `consultation_records`, `financial_transactions.related_entity_id`) 은 `users.id` 로의 FK 자체가 없음** — 논리 FK 만. hard delete 시 고아(orphan) 행 발생.
3. **`UK_users_email_tenant` (email, tenant_id) UNIQUE 제약** — soft-deleted 행도 점유 → email tombstone(W3) 부재 시 동일 email 재가입 영원히 차단.
4. **마이그레이션 ↔ 운영 FK diff** — V21 `refresh_token_store` FK 가 운영에 누락, V32 `fk_user_role_user CASCADE` 가 운영 실측 `NO ACTION` (`CREATE TABLE IF NOT EXISTS` + hbm2ddl 선행 충돌).
5. **컴플라이언스 추적 6 테이블 부재** (W1) — PIPA 시행령 §16 위반 risk.

### §0.4 P0 게이트 — Phase 0 정착 완료 (core-coder)

- **W1** 6 테이블 신설 마이그레이션 — `V20260604_001` 정착 (commit `cb88d0689`).
- **W2** `personal_data_access_logs.target_user_id` 타입 변경 — `V20260604_002` 정착 (commit `cb88d0689`). entity·repository·service Long 정합 (commit `ec922de12`, 39 테스트 PASS).
- **W3** email tombstone 표준 — Phase 2 `UserAnonymizationService` 위임 입력 사양으로 §7.1 에 정착 (호출부 코드는 Phase 2 위임).

→ Phase 0 정착 완료 (cb88d0689 + ec922de12). develop FF 가능 상태. Phase 1 (`lifecycle_state` SSOT 마이그) 위임 직전 단계.

---

## §1. 목적·범위

### §1.1 목적

1. **단일 SSOT 통합**: 사용자 종료(termination) 가 자발/강제/자동 어느 경로로 발생하든 (a) `users` 행 처리, (b) PII 컬럼 처리, (c) FK 보유 자식 테이블 처리, (d) 법규 보존, (e) 감사 로그 가 동일 규칙으로 수렴하도록 한다.
2. **SSOT 충돌 해소**: 현행 `is_active` / `is_deleted` 두 플래그 분기를 단일 `lifecycle_state` SSOT 로 흡수 (자세한 안 §3).
3. **법규·운영 정합성**: 의료법 §22(10년) / 세법(5~10년) / 전금법(5년) / 상법(10년) / 개인정보보호법 §36·§39의6·§39의7 / GDPR 17조 충돌을 정형화하여 코드·운영에서 일관 대응.
4. **재가입 가능성 보장**: 익명화 후에도 동일 이메일·전화로 재가입 가능하도록 PII 유니크 키 점유 회피 메커니즘 명문화.

### §1.2 범위

- **포함**: `users`, `clients`, `consultants`, `consultation_records`, `mood_journal_*`, `client_shop_*`, `client_point_*`, `community_*`, `mobile_push_*`, `notifications*`, `payments`, `financial_transactions`, ERP 회계 자식 테이블, `personal_data_access_logs`, `audit_logs` (신설 가칭).
- **제외**: `mind_garden` 스키마 전반(별도 워크스페이스), 본 합의서 §4 의 운영 DB FK 실측 — core-debugger 위임 결과가 도착하면 후속 PR 로 정착(섹션 placeholder 명시).
- **역할 범위**: CLIENT, CONSULTANT, ADMIN, HQ_ADMIN, SUPER_HQ_ADMIN. 다중 역할(`UserRole` 단일 enum + `counseling_enabled` 보조 플래그)은 §2 의 "다중 역할 처리" 항목으로 다룸.

---

## §2. 자발 vs 강제 vs 자동 차이표

### §2.1 운영 DB 정량 (debugger §2·§3 실측, 2026-05-27 KST)

> 운영 DB `core_solution` (beta74.cafe24.com) read-only 실측. PII 마스킹 (`SHA2`/`COUNT`/타입 검사만). 본 정량은 §0.2 골든 윈도우 근거.

| total | soft_deleted | deactivated | deleted_but_active | active_false_but_not_deleted | both_inactive_and_deleted | deleted_at_inconsistent | deleted_at_missing |
|---|---|---|---|---|---|---|---|
| **28** | **0** | **0** | 0 | 0 | 0 | 0 | 0 |

| role | n |
|---|---|
| CLIENT | 25 |
| CONSULTANT | 2 |
| ADMIN | 1 |

**해석**: 운영 데이터가 모두 0 = "분기 위험 없음" 이 아니라 "**분기 risk 의 정량 측정이 불가**" 라는 의미. 코드 레벨 SSOT 충돌은 잔존:
- `UserService.deleteUserAccount` 일부 경로 → `is_active=false` 만 갱신
- `BaseRepository.softDeleteByIdAndTenantId` → `is_deleted=true, deleted_at=now()` 갱신
- 동일 entity 두 종료 플래그 공존 → 운영 적재 후 `deleted_but_active` / `active_false_but_not_deleted` 발생 risk.

→ **Q1 결정 (단일 `lifecycle_state` enum SSOT)** 직접 근거. Phase 1 즉시 통일.

### §2.2 의존 행 분포 — hard delete 시 깨질 행 수 상한 (debugger §3.2)

| uid | role | mappings | schedules | records | fin_tx | sessions |
|---|---|---|---|---|---|---|
| 2 | ADMIN | 0 | 0 | 0 | 0 | 307 |
| 3 | CONSULTANT | 84 | 92 | 78 | 0 | 47 |
| 22 | CONSULTANT | 5 | 8 | 4 | 0 | 9 |
| 9 | CLIENT | 9 | 9 | 8 | 0 | 0 |
| 8 | CLIENT | 9 | 9 | 8 | 0 | 0 |
| 6 | CLIENT | 8 | 8 | 7 | 0 | 0 |
| 16 | CLIENT | 7 | 8 | 7 | 0 | 0 |
| 15 | CLIENT | 7 | 8 | 6 | 0 | 0 |
| 14 | CLIENT | 4 | 8 | 7 | 0 | 0 |
| 10 | CLIENT | 5 | 6 | 6 | 0 | 0 |

- CLIENT 평균 ≈ 20~26 행/명 (mappings + schedules + records). 한 명 hard delete 시 약 20~26 고아 행 발생.
- CONSULTANT user 3 은 254 행 보유 — **hard delete 사실상 불가, anonymize 전략 필수**.

### §2.3 자발 vs 강제 vs 자동 차이표

| # | 항목 | **자발(Self-Withdrawal)** | **강제(Admin Forced Delete)** | **자동(Auto Dormant/Destroy)** |
|---|---|---|---|---|
| 1 | **주체** | 본인(CLIENT/CONSULTANT/HQ_ADMIN) | 어드민 권한자(HQ_ADMIN, SUPER_HQ_ADMIN) | 시스템 cron (`PersonalDataDestructionService.destroyExpiredPersonalData`, 03:00 KST 매일) |
| 2 | **트리거** | 마이페이지 "회원 탈퇴" 버튼 + 비밀번호 재확인 | 어드민 화면 → `AdminServiceImpl.deleteClient/deleteConsultant` (사유 입력) | (a) `last_login_at` 1년 미접속 → DORMANT 전환, (b) `is_deleted=true AND updated_at` 1년 경과 → ANONYMIZE, (c) 익명화 후 N년(§6) → HARD_DELETE 후보 |
| 3 | **본인 확인** | 비밀번호 재확인 + (옵션) OTP/2FA | 어드민 권한 검사 + 사유 입력 + (옵션) 결재 라인 | 없음 (배치) |
| 4 | **유예기간(Grace Period)** | 30일 권장 (§10 Q3) — `WITHDRAWAL_PENDING` 상태로 유지, 본인 로그인 시 취소 가능 | 즉시 (운영 사고 대응) — 단 어드민 화면에 "되돌리기" 7일 보존 가능(§10 Q5) | 없음 (단 DORMANT 단계 자체가 30일 사전 알림 후 전환) |
| 5 | **알림** | 신청 시 메일/카톡 + 7일 전 만료 리마인더 + 완료 통지 (`docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` 안내 메시지 표시 경계) | 사용자에게 강제 종료 통지 + 어드민 dashboard 알림 | DORMANT 30일 전 사전 통지, ANONYMIZE 30일 전 사전 통지 |
| 6 | **롤백 가능성** | 유예기간 30일 내 본인 취소 시 100% 복원 (`lifecycle_state=WITHDRAWAL_PENDING → ACTIVE`) | (a) `lifecycle_state=DELETED_BY_ADMIN` 단계는 7일(Q5) 내 어드민 롤백 가능, (b) anonymize 후는 복원 불가 (legal-stamp 영역만 남음) | (a) DORMANT 단계는 본인 재로그인 + PII vault 복원으로 자동 복원, (b) ANONYMIZE 후는 복원 불가 |
| 7 | **PII 처리** | 즉시 익명화 (Scenario A) | 즉시 익명화 + 사유 stamp 보존 | DORMANT 단계는 보존(분리 저장), ANONYMIZE 단계에서 §3 매트릭스 적용 |
| 8 | **FK 자식 테이블** | §4 매트릭스 — anonymize 기본 + RESTRICT FK 테이블 별도 sweep | 동일 + 어드민 강제 sweep | 동일 + 보존 의무 만료된 행만 hard delete |
| 9 | **감사 로그** | `user_lifecycle_audit_log`(§8) 에 `event=SELF_WITHDRAWAL_REQUESTED/CANCELLED/COMPLETED` | `event=ADMIN_FORCED_DELETE`, `actor_id=admin_user_id`, `reason` 필수 | `event=AUTO_DORMANT/AUTO_ANONYMIZE/AUTO_HARD_DELETE`, `actor_id="SYSTEM"` |
| 10 | **재가입 정책** | 즉시 가능 (익명화로 unique 충돌 회피) — 단 §10 Q6 옵션(30일 cooldown) 시 차단 | 어드민 강제 종료 사유에 따라 cooldown 추가 가능 | DORMANT 는 재로그인 자동 해제. ANONYMIZE 후는 새 가입으로 취급. |
| 11 | **다중 역할 사용자(CLIENT+STAFF)** | 전체 종료만 허용 (§10 Q4) | 동일 (CONSULTANT 의 경우 활성 매핑 이관 가드 — `AdminServiceImpl.checkConsultantDeletionStatus`) | 동일 |

---

## §3. PII 컬럼별 처리 매트릭스

### §3.1 처리 코드 정의

- **`ANONYMIZE`**: 컬럼 값을 `anon-<uuid>` / `이용종료-<uuid>` 등 무의미 surrogate 로 치환. unique 키 점유 회피.
- **`TOMBSTONE`**: 컬럼 값을 `null` 또는 빈 문자열로 비움(unique 키 자동 해제). NULL 허용 컬럼만 가능.
- **`KEEP`**: 원본 보존 (보존 의무 충족 목적).
- **`HARD_DELETE`**: 컬럼이 속한 행 자체를 삭제 (다른 컬럼도 함께 사라짐). 보존 의무 없는 행에만 적용.

### §3.2 `users` 테이블 (PK = `id`)

| 컬럼 | 자료형 | 처리 | 근거 |
|---|---|---|---|
| `id` | BIGINT | KEEP | PK — anonymize 불가. 행 자체 보존(Scenario A). |
| `tenant_id` | VARCHAR(36) | KEEP | 멀티테넌트 무결성. |
| `user_id` | VARCHAR(50) UNIQUE | ANONYMIZE → `anon-<uuid>` | unique 점유 회피. |
| `email` | VARCHAR(500) UNIQUE(tenant_id, email) | ANONYMIZE → `anon-<uuid>@deleted.local` | unique 점유 회피. 재가입 가능. |
| `password` | VARCHAR(100) | TOMBSTONE (`null` 또는 무의미 hash) | 로그인 불가 보장. |
| `name` | VARCHAR(500) | ANONYMIZE → `이용종료-<uuid 앞 8자>` | PII. 통계 표기용 surrogate 유지. |
| `nickname` | VARCHAR(500) | TOMBSTONE | 옵션 필드. |
| `phone` | VARCHAR(500) | ANONYMIZE → `000-0000-<uuid 앞 4자>` | unique 검색 회피용 surrogate. |
| `gender` | VARCHAR(500) | TOMBSTONE | 익명화. |
| `birth_date` | DATE | TOMBSTONE | 익명화. |
| `age_group` | VARCHAR(20) | KEEP | 통계용 — 식별 불가. |
| `age` | INT | KEEP | 통계용. |
| `role` | VARCHAR(20) | KEEP | 통계·권한. |
| `rrn_encrypted` | VARCHAR(500) | TOMBSTONE | 주민번호 — 즉시 파기. |
| `address`, `address_detail`, `postal_code` | VARCHAR | TOMBSTONE | PII. |
| `profile_image_url` | LONGTEXT | TOMBSTONE | 외부 파일은 별도 cron 으로 삭제(§9). |
| `memo`, `notes`, `specialization` | TEXT | TOMBSTONE (단, `specialization` 은 CONSULTANT 통계 시 KEEP — §10 Q7) | 자유 입력 PII 가능성. |
| `last_login_at`, `last_grade_update`, `experience_points`, `total_consultations` | DATETIME, BIGINT, INT | KEEP | 통계용. |
| `is_active`, `is_deleted`, `deleted_at` | BOOLEAN, DATETIME | **`lifecycle_state` 단일 컬럼으로 흡수 (§3.6)** | SSOT 통일. |
| `social_provider`, `social_provider_user_id`, `social_linked_at`, `is_social_account` | VARCHAR | TOMBSTONE | 소셜 연동 해제. |
| `email_verification_token`, `password_reset_token`, `email_verification_expires_at`, `password_reset_expires_at` | VARCHAR, DATETIME | TOMBSTONE | 토큰 무효화. |
| `notification_preferences`, `notification_channel_preference`, `email_notification`, `sms_notification`, `push_notification`, `kakao_alimtalk_notification` | TEXT, VARCHAR, BOOLEAN | KEEP (단 발송 차단은 §6 참조) | 채널 선호도. |
| `theme_preference`, `custom_theme_colors`, `profile_visibility`, `data_sharing`, `auto_reminder`, `preferred_session_duration` | VARCHAR/JSON/BOOLEAN/INT | KEEP | 통계용. |
| `created_at`, `updated_at`, `version` | DATETIME, BIGINT | KEEP | 감사용. |

### §3.3 `clients` 테이블 (PK = `users.id` 동일 할당)

| 컬럼 | 처리 | 근거 |
|---|---|---|
| `id` | KEEP | `users.id` 와 동일 PK. |
| `name, email, phone, gender, address, address_detail, postal_code` | `users` 와 동일 익명화 (값 동기화). | PII. |
| `birth_date` | TOMBSTONE | 동일. |
| `emergency_contact, emergency_phone` | TOMBSTONE | PII. |
| `vehicle_plate` | TOMBSTONE | PII (선택). |
| `consultation_purpose, consultation_history` | TOMBSTONE | 자유 입력 PII. |
| `medical_history, allergies, medications` | TOMBSTONE | 민감 의료 정보. |
| `preferred_language, is_emergency_contact` | KEEP | 비식별. |
| `branch_code` | KEEP (Deprecated) | 레거시. |

### §3.4 `consultation_records` (의료법 §22 — PII 만 익명화, 임상 내용 보존)

| 컬럼 | 처리 | 근거 |
|---|---|---|
| `id, consultation_id, client_id, consultant_id, session_date, session_number` | KEEP | 행 보존. |
| `client_condition, main_issues, intervention_methods, client_response, next_session_plan, homework_assigned, risk_assessment, risk_factors, emergency_response_plan, progress_evaluation, progress_score` | KEEP | **의료법 보존** (현행 5년 cutoff → §10 Q10 결정 필요). |
| (자유 입력 본문에 PII 가 섞여 있을 가능성) | **별도 anonymize cron 필요** | 본 합의서는 컬럼 정책만 정의. 본문 PII 스크러빙은 §10 Q11 결정. |

### §3.5 `payments`, `financial_transactions` (전금법·세법 — 5~10년 보존)

| 컬럼 | 처리 | 근거 |
|---|---|---|
| `payments.payer_id, recipient_id` | KEEP | user 보존(Scenario A) 이므로 join 결과만 익명. |
| `payments.payment_id, order_id, amount, status, method, provider, virtual_account_number, approved_at, cancelled_at, refunded_at, external_response` | KEEP | 전금법 §22. |
| `financial_transactions.amount, transaction_date, transaction_type, status, tax_amount, withholding_tax_amount, amount_before_tax, card_merchant_fee_amount` | KEEP | 세법·상법. |
| `financial_transactions.approver_id, related_entity_id, related_entity_type` | KEEP | join 결과만 익명. |
| `financial_transactions.description, remarks, approval_comment` | KEEP (단 PII 본문 스크러빙 필요 — §10 Q11) | 자유 입력. |

### §3.6 SSOT 통일 — `lifecycle_state` 단일 컬럼 (Q1 확정)

현행 `is_active`(BOOL) / `is_deleted`(BOOL) / `deleted_at`(DATETIME) 세 컬럼을 단일 enum 으로 통합. **Q1 결정 = 채택 확정**.

```
lifecycle_state ENUM(
  'ACTIVE',              -- 정상 활성
  'SUSPENDED',           -- 일시 정지 (의도적 일시 비활성 — is_active 와 의미 분리)
  'WITHDRAWAL_PENDING',  -- 자발 탈퇴 신청 (Q3: 30일 유예 — 본인 취소 가능)
  'DORMANT',             -- 1년 미접속 휴면 (별도 PII vault — Q9 결정)
  'ANONYMIZED',          -- PII 익명화 완료 (롤백 불가)
  'DELETED_BY_ADMIN',    -- 어드민 강제 종료 (Q5: 7일 보존 윈도우 — 롤백 가능)
  'HARD_DELETED'         -- 행 hard delete 대상 (보존 의무 만료 후 + 운영자 명시 승인 시에만)
)
```

#### `is_active` 의미 재정의 (Q1 확정)

- **`lifecycle_state` 가 SSOT** — 종료 단계·자발/강제 경로·익명화 여부의 단일 진실원.
- **`is_active`** 는 다음 운영적 정지 한정으로만 의미 보존:
  - 비밀번호 5회 이상 실패로 인한 **계정 잠금**
  - **회원 가입 후 이메일 미인증** 단계
  - **상담사 자격 심사 대기** (CONSULTANT 가입 후 어드민 승인 전)
  - 기타 **운영자 일시 로그인 차단** 했으나 종료 의도 없음
- 위 운영적 정지 시 `lifecycle_state=ACTIVE` 유지 + `is_active=false` 로 표현.
- `lifecycle_state IN ('SUSPENDED', 'WITHDRAWAL_PENDING', 'DORMANT', 'ANONYMIZED', 'DELETED_BY_ADMIN', 'HARD_DELETED')` 인 경우 `is_active` 값과 무관하게 로그인 차단.

#### 단일 진입점 — `UserLifecycleService.transitionTo(...)`

```
UserLifecycleService.transitionTo(userId, newState, actor, reason)
  → (a) 상태 전이 가드 검증 (전이 그래프 위반 시 거부)
  → (b) PII 매트릭스 적용 (§3 — anonymize 시 W3 email tombstone 의무)
  → (c) FK 자식 sweep (§4 — 시나리오×테이블 매트릭스)
  → (d) audit_logs 기록 (W1 신설 — §8 통일 스키마)
  → 단일 트랜잭션 + 실패 시 롤백
```

#### 전이 그래프

- `ACTIVE` → `SUSPENDED` (운영자 의도) / `WITHDRAWAL_PENDING` (자발) / `DORMANT` (자동) / `DELETED_BY_ADMIN` (어드민 강제)
- `SUSPENDED` → `ACTIVE` (해제) / `ANONYMIZED` (운영자 종료 결정 시)
- `WITHDRAWAL_PENDING` → `ACTIVE` (본인 30일 내 취소) / `ANONYMIZED` (Q3 유예 만료)
- `DORMANT` → `ACTIVE` (본인 재로그인 + PII vault 복원) / `ANONYMIZED` (Q9 추가 4년 경과)
- `DELETED_BY_ADMIN` → `ACTIVE` (Q5 7일 내 어드민 롤백) / `ANONYMIZED` (7일 만료 시 자동 진행)
- `ANONYMIZED` → `HARD_DELETED` (보존 의무 만료 + 운영자 명시 승인) — Scenario A 에서는 거의 도달하지 않음
- `HARD_DELETED` → `(row gone)` (배치 hard delete; 단 §4 의 56 NO ACTION FK 모두 사전 정리 + W3 tombstone 적용 후만)

#### 마이그레이션 가이드 (Phase 1)

1. `users` 테이블에 `lifecycle_state ENUM(...) NOT NULL DEFAULT 'ACTIVE'` 컬럼 추가.
2. 기존 데이터 매핑 (운영 0 incident — §0.2 골든 윈도우):
   - `is_deleted=TRUE` → `lifecycle_state='ANONYMIZED'` (운영 0 행)
   - `is_active=FALSE AND is_deleted=FALSE` → `lifecycle_state='SUSPENDED'` (운영 0 행)
   - 그 외 → `lifecycle_state='ACTIVE'`
3. `is_active`, `is_deleted`, `deleted_at` 은 `@Deprecated` backward-compat 용으로 **한시 유지** (Phase 5 종료 후 제거).
4. `BaseRepository.softDeleteByIdAndTenantId` 등 기존 path 는 `UserLifecycleService.transitionTo` 호출로 redirect.
5. 모든 파생 쿼리(`existsByTenantIdAndEmail` 등) 에 `lifecycle_state IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWAL_PENDING', 'DORMANT')` 필터 명시.

---

## §4. FK cascade 동작 표 (운영 실측 흡수)

> **입력**: core-debugger 운영 DB read-only 실측 (`beta74.cafe24.com`, 2026-05-27 KST — `information_schema` 메타데이터만). v1.1 작성 시점에 `/tmp/fk-survey-report.md` 본문은 임시 파일 수명 만료로 삭제됨 → 본 §4 / 부록 C 는 (a) 위임 프롬프트 요약, (b) v1.0 §4.1 정적 분석, (c) `V20260604_001/_002` 헤더 주석에 흡수된 사실 종합. **일부 항목 추정**, 운영 재실측 시 갱신 필요.

### §4.1 운영 FK 전수 핵심 발견 (debugger §0·§1 흡수)

| # | 항목 | 값 |
|---|---|---|
| 1 | `users.id` 참조 FK 총수 | **57** |
| 2 | `ON DELETE NO ACTION` | **56** |
| 3 | `ON DELETE CASCADE` | **1** (`consultant_mood_tracking_ibfk_1`) |
| 4 | `ON DELETE RESTRICT` | 0 (운영 실측 기준 — 마이그레이션 RESTRICT 정의는 운영에서 NO ACTION 으로 적용) |
| 5 | `ON DELETE SET NULL` | 0 |
| 6 | 운영 DB 만 있고 마이그레이션 부재 FK | (debugger §1.3) — `user_role_assignments` FK `NO ACTION` (마이그레이션 V32 는 CASCADE) |
| 7 | 마이그레이션만 있고 운영 부재 FK | (debugger §1.3) — `refresh_token_store_*_users_id` (V21 CASCADE) |

**해석**:
1. **56 NO ACTION 우세** → user 행 hard delete 시 56 FK 가 즉시 차단. Scenario A (Anonymize) 가 사실상 유일한 일관 경로.
2. **CASCADE 1건** (`consultant_mood_tracking`) → Q8 결정(자발 일지 HARD_DELETE)으로 자연 흡수. anonymize 경로에서는 사전 sweep 후 hard delete.
3. **운영-마이그레이션 diff** (V21 / V32 — debugger §1.3) → 부록 D 의 fix-forward 가이드로 분리.

### §4.2 핵심 비즈니스 테이블의 FK 부재 — 논리 FK 만 (debugger §1.4)

운영 DB 실측 기준 `users.id` 로의 **물리 FK 가 부재**한 핵심 테이블 (논리 FK 만 — 코드 join 으로만 무결성 유지):

| 테이블 | 논리 FK 컬럼 | 보존 의무 | hard delete 시 risk |
|---|---|---|---|
| `consultant_client_mappings` | `consultant_id`, `client_id` | 5년 (전금법 — 결제 연결) | orphan + 회계 추적 실패 |
| `schedules` | `consultant_id`, `client_id`, `mapping_id` | — (정합성만) | orphan + 캘린더 표시 깨짐 |
| `consultation_records` | `client_id`, `consultant_id` | **10년 (의료법 §22 — Q10)** | orphan + 의료법 위반 |
| `payments` | `payer_id`, `recipient_id` | **5년 (전금법 §22)** | orphan + 전금법 위반 |
| `financial_transactions` | `approver_id`, `related_entity_id` (`related_entity_type='USER'` 인 경우만) | **5~10년 (세법·상법)** | orphan + 세법·상법 위반 |
| `consultations` (legacy), `consultation_record_alerts`, `consultation_record_drafts` | `client_id`, `consultant_id` | — | orphan + 통계 깨짐 |
| `salary_calculations`, `consultant_salary_*`, `consultant_performance`, `consultant_ratings`, `quality_evaluations` | `consultant_id`, 일부 `client_id` | 5년 (세법) | orphan + 정산 추적 실패 |
| `daily_statistics`, `dropout_risk_assessments` | `consultant_id`, `client_id` | — (통계만) | orphan 또는 NULL |
| `notification_batch_send_log`, `system_notifications`, `system_notification_reads` | `user_id` / `target_user_id` | 보안 이벤트 3년 (`SECURITY_POLICY.md:227`) | orphan + audit 추적 실패 |
| `personal_data_access_logs` | `accessor_id` (BIGINT), `target_user_id` (`varchar(255)` → `BIGINT` — **W2 P0, V20260604_002 정착 완료**) | 1년 (`SECURITY_POLICY.md:228`) | FK 신설 후 anonymize 안전 |
| `user_addresses`, `user_passkey`, `user_sessions`, `user_activities`, `user_privacy_consent` | `user_id` | — | TOMBSTONE 또는 orphan |

→ **함의**: 핵심 보존 의무 테이블 5종 (`consultation_records`, `payments`, `financial_transactions`, `consultant_client_mappings`, ERP 정산 표) 모두 물리 FK 부재. Scenario C (True Hard Delete) 는 보존 의무 위반과 orphan 동시 유발 → **Scenario A 채택 절대 필수**.

### §4.3 `UK_users_email_tenant` (email, tenant_id) UNIQUE 제약 — W3 의무화 근거 (debugger §1.5)

- 운영 DB 실측: `users` 테이블에 `UK_users_email_tenant (email, tenant_id) UNIQUE` 제약 활성.
- **함의**: soft-deleted (또는 `lifecycle_state=ANONYMIZED`) 행도 이 UNIQUE 키를 점유. email tombstone 없이는 동일 email 재가입 영원히 차단.
- **W3 결정 (P0)**: anonymize 시 `email` 컬럼을 `deleted-{uid}-{epoch}@anonymized.local` 패턴 surrogate 로 치환 의무화 (`UserAnonymizationService` SSOT — Phase 2 위임).

### §4.4 시나리오 × 핵심 테이블 처리 매트릭스 (debugger §7 흡수)

> v1.0 §4.1 정적 분석 표를 흡수하여, **세 시나리오 (Soft / Anonymize default / Hard)** × **테이블** 의 처리 결정을 단일 매트릭스로 정착.
>
> 범례: **A** = ANONYMIZE (PII surrogate 치환, 행 KEEP), **K** = KEEP (변경 없음 — 보존 의무), **T** = TOMBSTONE (NULL/빈 값 — UNIQUE 해제), **D** = HARD_DELETE (행 삭제 — 보존 의무 없는 경우만), **S** = 사전 sweep (자식 행 정리 후 부모 작업).

| 그룹 | 테이블 | Soft / SUSPENDED | **Anonymize (Q2=A default)** | Hard (비권장 / Q8 예외) | 비고 |
|---|---|---|---|---|---|
| **인증·세션** | `refresh_token_store` | K + dispatcher 차단 | D (운영 FK 부재 — debugger §1.3) | D | V21 운영 누락 → 부록 D |
| | `user_role_assignments` | K | A (사전 sweep) | D | V32 마이그/운영 diff |
| | `user_social_accounts` | K | T | D (JPA cascade) | `User.java:205-207` |
| | `user_passkey`, `user_sessions`, `user_activities`, `user_privacy_consent` | K | T (PII 컬럼) | D | 보존 의무 없음 |
| | `user_addresses` | K | T | D | PII — TOMBSTONE 필수 |
| **모바일 푸시** | `mobile_push_tokens` | `active=false` | S (사전 토큰 inactive 후 KEEP) | D (사전 sweep 필수) | 알림 차단 우선 |
| | `mobile_push_settings` | K | K | D (사전 sweep 필수) | 비식별 |
| **자발 입력** | `mood_journal_entries`, `self_assessment_sessions` | K | **D (Q8 결정)** | D | 본인 의지 우선 |
| | `consultant_mood_tracking` | K | D (CASCADE 자동) | D (CASCADE) | 운영 유일 CASCADE FK |
| | `mind_weather_cards` | K | S → K (통계 비식별) | D (사전 sweep) | RESTRICT |
| **쇼핑·포인트** | `shop_carts` | K | **D** (보존 의무 없음) | D | 카트는 비보존 |
| | `shop_client_orders` | K | A (영수증 — 전금법 5년) | (불가 — 세법 위반) | A 필수 |
| | `client_point_wallets` | K | 환불·소멸 후 D (Q9 5년 후) | (불가) | 잔여 포인트 처리 선행 |
| | `client_point_ledger_entries` | K | A (세법 5년 보존) | (불가) | KEEP join 익명 |
| **커뮤니티** | `community_posts` (author, moderator) | K | **A (Q12 default — `이용종료-<uuid>`)** | D (옵션 b — 본인 선택) | 댓글 맥락 보존 |
| | `community_comments` | K | A (Q12) | D (옵션 b) | 동일 |
| | `community_post_likes` | K | D (비식별 통계만) | D | 사전 sweep 가능 |
| | `community_reports` | K | A (신고자 보호) | (불가) | A 필수 |
| **핵심 보존 (FK 부재)** | `consultant_client_mappings` | K | K (join 익명) | (orphan — 불가) | Scenario C 불가 |
| | `schedules` | K | K | (orphan) | 논리 FK |
| | `consultation_records` | K | **K (의료법 §22 — Q10 10년)** | (orphan + 의료법 위반) | 본문 PII 스크러빙(Q11) |
| | `payments` | K | K (전금법 §22 — 5년) | (orphan + 전금법 위반) | join 익명 |
| | `financial_transactions` | K | K (세법·상법 — 5~10년) | (orphan + 세법 위반) | description PII 스크러빙(Q11) |
| | `consultations` (legacy), `consultation_record_alerts`, `consultation_record_drafts` | K | K | (orphan) | KEEP 권장 |
| | `salary_calculations`, `consultant_salary_*`, `consultant_performance`, `consultant_ratings`, `quality_evaluations` | K | K | (orphan + 세법 위반) | KEEP |
| | `daily_statistics`, `dropout_risk_assessments` | K | K | (orphan) | 통계 KEEP |
| **알림·audit** | `notification_batch_send_log`, `system_notifications`, `system_notification_reads` | K + dispatcher 차단 | K | (orphan) | KEEP |
| | `personal_data_access_logs` | K | K | K | W2 P0 정착 (V20260604_002) |
| **W1 P0 신설 (cb88d0689)** | `audit_logs` | K | K (audit trail — 3년) | K | NO ACTION FK 신설 |
| | `notifications` (in-app) | K (`status=CANCELLED`) | K (수신자 anonymize 시 sender/recipient join surrogate) | K | NO ACTION FK |
| | `personal_data_destruction_logs` | K | K (PIPA §16 보존) | K | NO ACTION FK |
| | `consultant_client_mapping_history` | K | K | K | snapshot — KEEP |
| | `session_compensation_history` | K | K (세법 — 정산 근거) | K | NO ACTION FK |
| | `client_satisfaction_surveys` | K | A (`is_anonymous=TRUE` 로 통계 보존) | D (선택) | author 익명화 |

- 상세 57 FK 전수 표는 **부록 C**, 운영↔마이그레이션 diff fix-forward 는 **부록 D** 로 분리.

---

## §5. 법규 보존 매트릭스

> **v1.1 변경**: Q10 결정 (의료법 §22 = **10년** 일괄) 채택 확정. 현행 코드 5년 cutoff 는 후속 위임으로 10년 변경 + 법무 자문 추적 §11 Phase 5 로 분리.

| 법규 | 조항 | 적용 데이터 | 보존 기간 | 익명화 가능 여부 | 충돌 시 우선순위 |
|---|---|---|---|---|---|
| **개인정보보호법** | §36 (정정·삭제·처리정지권) | `users` PII, `clients` PII | 본인 요청 10일 이내 처리 (`SECURITY_POLICY.md:248`) | ◯ | 보존 의무 영역(의료/재무) **외**에서는 본인 요청 우선 |
|  | §39의6 (1년 미접속 휴면) | `users.last_login_at` 1년 경과 | DORMANT 분리 보관 → 추가 4년 후 ANONYMIZE (Q9) | ◯ | 자동 트리거 |
|  | §39의7 (분쟁 대비 보존) | 분쟁 발생 가능 데이터 | 분쟁 종결까지 | ◯ | 보존 의무 |
| **개인정보보호법 시행령** | §16 (파기 기록 의무) | 파기 행위 자체의 로그 | 3년 권장 | — | W1 P0 `personal_data_destruction_logs` 신설로 충족 (cb88d0689) |
| **의료법** | §22 (진료기록 10년) | `consultation_records.*` | **10년 (Q10 결정 확정)** | ◯ (PII 만 익명화, 임상 내용 보존) | **보존 의무 > §36** |
| **세법** (소득세법, 부가가치세법, 법인세법) | 장부·증빙 5~10년 | `financial_transactions.*`, ERP ledger, `consultant_salary_*`, `salary_calculations` | 5년 일반 / 10년 분쟁·법인세 | ◯ (buyer name 익명화, 금액·일자 보존) | **보존 의무 > §36** |
| **전자금융거래법** | §22 (5년 보존) | `payments.*`, `payments.external_response`, `shop_client_orders`, `client_point_ledger_entries` | **5년** | ◯ | **보존 의무 > §36** |
| **상법** | (회계장부·재무제표 10년) | ERP ledger, `accounting_entries` | **10년** | ◯ | **보존 의무 > §36** |
| **GDPR** | 17조 (잊혀질 권리) | 모든 PII | 본인 요청 즉시 (단 3항 예외) | ◯ | 17조 3항 예외 (법적 의무 / 공익 / 공중보건 / 공익 기록·연구 / 법적 주장 방어) 시 보존 우선 |

**우선순위 규칙**:
1. **보존 의무 (의료법/세법/전금법/상법)** > 본인 요청 (§36, GDPR 17조).
2. 위 1 에 해당하지 않는 영역은 본인 요청 우선.
3. 익명화 (PII 만 surrogate 치환 + 임상/재무 내용 보존) 가 모든 충돌의 default 해소책 — Q2 Scenario A 채택과 정합.

**Q10 결정 후속 확인 사항** (§11 Phase 5 — 법무 자문 stamp 위임):
- `PersonalDataDestructionService.destroyExpiredConsultationData:154` 의 5년 cutoff 를 10년으로 갱신. 변경 시 운영 보존 데이터 5년→10년 확장 영향 무 (현행 5년 cutoff 적용 행 0건 — 운영 가동 전).
- 의료법 §22 적용 범위가 `consultation_records` 전체인지, 일부 분류(임상 vs 일반 면담)만인지 — 법무 의견 필요.
- 가족 상담·집단 상담 등 다자 기록의 보존 주체 — 법무 의견 필요.
- 보존 기간 종료 후 hard delete 의 행정 절차 — 의료법 시행규칙 §17 (진료기록부 보존·관리) 절차 적용 여부 확인.

---

## §6. 휴면(§39의6) 전환·재활성·자동 파기 일정

### §6.1 단계별 일정 (제안 — §10 Q3, Q9 결정 사항)

```
[ACTIVE]
   |
   | (last_login_at + 11개월 경과)
   v
[DORMANT 사전 통지 30일]  ← 이메일·카톡·SMS 발송 (24시간 이내 재로그인 시 ACTIVE 유지)
   |
   | (last_login_at + 12개월 경과, 사전 통지 미응답)
   v
[DORMANT 상태]
   |  · `lifecycle_state=DORMANT`
   |  · 로그인 차단(별도 본인 인증 후 ACTIVE 복원 — 단 PII 분리 저장)
   |  · 발송 차단(`notification_*` 전체)
   |  · 통계 KPI 에는 잠재 포함 (휴면 회원 수)
   |
   | (DORMANT 진입 후 N년 경과 — §10 Q9 결정, 권장 4년 = 총 5년)
   v
[ANONYMIZE 사전 통지 30일]
   |
   | (응답 없음)
   v
[ANONYMIZED]  ← §3 매트릭스 적용 (PII 익명화, 의료/재무는 KEEP)
   |
   | (의료법 10년 / 세법 5년 / 전금법 5년 / 상법 10년 중 최장 기간 경과)
   v
[HARD_DELETED_PENDING]  ← 배치 대상
   |
   v
[(row gone)]
```

### §6.2 자발/강제 경로와의 통합

- **자발 탈퇴 (`WITHDRAWAL_PENDING` 30일)**: 30일 경과 후 자동 `ANONYMIZED` (위 그래프 합류).
- **어드민 강제 (`INACTIVE_BY_ADMIN`)**: 7일 보존 후 자동 `ANONYMIZED` (또는 어드민 명시적 anonymize).
- **자동 휴면 (`DORMANT`)**: 위 6.1 일정.

→ 세 경로 모두 `ANONYMIZED` 로 수렴 → `HARD_DELETED_PENDING` → `row gone` 의 단일 종착 그래프.

---

## §7. 재가입·재활성 규칙

### §7.1 W3 — email tombstone 의무화 (P0 결정 확정)

- **결정**: anonymize 시점에 `users.email` 컬럼을 **반드시** surrogate 로 치환. UNIQUE 제약 (`UK_users_email_tenant` (email, tenant_id)) 점유 해제가 동일 email 재가입의 필수 전제 (§4.3).
- **표준 패턴**: `deleted-{users.id}-{epoch_seconds}@anonymized.local`
  - 예: `deleted-42-1717459200@anonymized.local`
  - `users.id` 포함 → audit 추적 시 원본 user 식별 가능 (W1 `audit_logs`·`personal_data_destruction_logs` 와 cross-reference).
  - `@anonymized.local` 도메인 → 외부 전송 절대 방지 (DNS 미존재).
- **적용 경로** (전 경로 의무):
  1. 자발 탈퇴 30일 유예 만료 (`WITHDRAWAL_PENDING` → `ANONYMIZED`).
  2. 어드민 강제 종료 7일 만료 (`DELETED_BY_ADMIN` → `ANONYMIZED`).
  3. DORMANT → ANONYMIZED 자동 전환 (4년 + 30일 사전 통지 만료).
  4. 본인 요청 즉시 anonymize (개인정보보호법 §36 / GDPR 17조).
- **호출 지점 단일화**: `UserLifecycleService.transitionTo(...) → UserAnonymizationService.tombstoneEmail(user)` — Phase 2 위임. 분산 호출 절대 금지(SSOT 보장).
- **동시 처리 컬럼**: email tombstone 시 `phone`, `user_id`, `nickname` 도 §3.2 매트릭스에 따라 동시 처리 (단일 트랜잭션).

### §7.2 동일 이메일·전화 재가입

- §3.2 의 anonymize 정책 + §7.1 의 email tombstone 으로 `users.email`, `users.phone`, `users.user_id` 의 UNIQUE 점유가 해제되므로 **동일 이메일·전화로 즉시 재가입 가능** (Q6 default).
- **Q6 결정 확정 — 즉시 + 어드민 사유별 cooldown 옵션**:

| 옵션 | 적용 사유 | cooldown 기간 | 운영 |
|---|---|---|---|
| **즉시 가능 (default)** | 자발 탈퇴 (Q3 30일 유예 후 anonymize) | 0일 | 본인 의지 우선 — 추가 차단 없음 |
| **자발 단기 cooldown** (옵션) | 동일 사용자 의사결정 번복 보호 | 어드민 설정 가능 (예: 7~30일) | 운영 설정 페이지에 토글 — default OFF |
| **어드민 사유별 cooldown** | 어드민 강제 종료 — 약관 위반·부정 사용 | 어드민 사유별 30일·90일·영구 차단 | `AdminServiceImpl.deleteClient/deleteConsultant` 호출 시 cooldown 사유 enum 입력 |
| **영구 차단** | 부정 사용·중대 위반 | 영구 | `users.email_blocklist` (가칭) 별도 테이블 — Phase 3 위임 검토 |

- **충돌 회피 메커니즘** (코드 게이트):
  - `UserRepository.existsByTenantIdAndEmail` 등 파생 쿼리에 **반드시 `lifecycle_state IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWAL_PENDING', 'DORMANT')` 필터** 명시.
  - 또는 (간단화) `email NOT LIKE 'deleted-%@anonymized.local'` 패턴 거부.
  - 현행 코드 갭 (자매 보고서 `SELF_WITHDRAWAL_PROCESS_AUDIT.md` §1 매트릭스 "재가입 정책") 해소 — Phase 2 위임 필수 게이트.

### §7.3 휴면 해제 시 PII 복원

- `DORMANT` 상태는 PII 가 **분리 저장** — Q9 결정 = `dormant_user_pii_vault` 별도 테이블 (Phase 3 위임 — 별도 마이그레이션 SSOT).
- 본인 재로그인 + 본인 인증 (이메일/SMS OTP) 시 `dormant_user_pii_vault` 에서 PII 복원 + `lifecycle_state=ACTIVE` + `user_lifecycle_audit_log`(audit_logs §8) 에 `AUTO_DORMANT_REACTIVATED` 기록.
- `ANONYMIZED` 후는 복원 불가 — 새 가입으로 취급 (재가입 시 동일 email 입력 시 surrogate 와 충돌 없음 — §7.1 패턴).

### §7.4 다중 역할 사용자 재가입 (Q4 일관)

- Q4 결정 = "전체 탈퇴만 허용". 동일 user 가 CLIENT+CONSULTANT 였던 경우, 재가입 시 default = CLIENT 로 가입. CONSULTANT 권한은 어드민 승인 후 부여 (기존 `AdminServiceImpl.checkConsultantDeletionStatus` 가드 재사용).

---

## §8. 감사 로그 스키마 통일 — W1·W2 정착 사실 + 후속 위임 분리

### §8.0 정착 사실 (Phase 0 — core-coder)

- **W1 P0 — 컴플라이언스 추적 6 테이블 신설**: `audit_logs`, `notifications`, `personal_data_destruction_logs`, `consultant_client_mapping_history`, `session_compensation_history`, `client_satisfaction_surveys` — Flyway `V20260604_001__create_lifecycle_audit_and_destruction_tables.sql` 로 정착. **commit `cb88d0689`** (core-coder, 2026-05-27, 마이그레이션 + 419 line 테스트 → H2 MODE=MySQL `INFORMATION_SCHEMA` 매트릭스 검증 15/15 PASS).
- **W2 P0 — `personal_data_access_logs.target_user_id` 타입 변경**: `varchar(255)` → `BIGINT` + FK 신설 (NO ACTION). Flyway `V20260604_002__fix_personal_data_access_logs_target_user_id_type.sql` 로 정착. 운영 0행 안전 윈도우 활용. **commit `cb88d0689`** (위 V20260604_001 과 동일 commit).
- **W1·W2 entity·repository·service·enum 정합**: `PersonalDataAccessLog.targetUserId String → Long` + 신규 6 entity·6 repository·6 service interface + 6 도메인 enum (AuditAction / NotificationType / DestructionType / LegalBasis / MappingHistoryEventType / CompensationType). **commit `ec922de12`** (core-coder, 2026-05-27, 39 테스트 PASS, 하드코딩 게이트 0 위반).
- **채번 변경 사유**: 위임 명세상 `V20260528_005/_006` 으로 작성 예정이었으나 develop `V20260528_001~006` 가 이미 점유(shedlock·ai_usage_logs rename). 충돌 회피로 `V20260604_001/_002` 로 변경.
- **본 합의서 §8 정합**: 마이그레이션 헤더 주석이 본 합의서 §8 을 "병행 진행 — 본 위임은 대기하지 않고 debugger §6 권고 직접 흡수로 P0 게이트 선행" 으로 명시. v1.1 에서 본 §8 이 마이그레이션 사실을 거꾸로 정착 → 마이그레이션·합의서 양방향 정합 완료.

### §8.1 신설 `audit_logs` 정착 사양 (V20260604_001 본문 참조)

> 본 합의서 v1.0 의 가칭 `user_lifecycle_audit_log` 는 정착된 `audit_logs` 와 통합. lifecycle 전이 + 일반 관리자 액션을 동일 SSOT 에서 기록.

```
audit_logs (
  id                BIGINT PK AUTO_INCREMENT,
  tenant_id         VARCHAR(50) NOT NULL,
  actor_user_id     BIGINT NULL,           -- 행위자 users.id (SYSTEM cron 일 때 NULL)
  actor_role        VARCHAR(40) NULL,      -- CLIENT / CONSULTANT / ADMIN / HQ_ADMIN / SYSTEM
  target_user_id    BIGINT NULL,           -- 행위 대상 users.id
  action            VARCHAR(60) NOT NULL,  -- §8.2 표
  entity_type       VARCHAR(60) NULL,      -- USER / MAPPING / SCHEDULE 등
  entity_id         BIGINT NULL,
  before_json       JSON NULL,
  after_json        JSON NULL,
  metadata_json     JSON NULL,
  ip_address        VARCHAR(45) NULL,      -- IPv4/IPv6 호환
  user_agent        VARCHAR(500) NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- 인덱스: tenant+created / actor / target / action / entity
  -- FK: actor_user_id, target_user_id → users(id) NO ACTION (운영 56/57 정합)
)
```

- **상세 컬럼·인덱스·FK** 는 `src/main/resources/db/migration/V20260604_001__create_lifecycle_audit_and_destruction_tables.sql:31-63` (Phase 0 정착 본문) 참조.

### §8.2 `action` enum (정착 코드 — `AuditAction` 도메인 enum)

> **출처**: `com.coresolution.consultation.constant.AuditAction` (ec922de12). `code` + `messageKey=enums.AuditAction.<NAME>` 로 i18n SSOT. 하드코딩 게이트 통과.

| action (정착 코드) | 의미 | source | 호출 위치 (Phase 2~5 위임) |
|---|---|---|---|
| `USER_ANONYMIZE` | anonymize 실행 (자발/강제/자동 공통 종착) | SELF·ADMIN·SYSTEM | `UserAnonymizationService.anonymize` |
| `USER_DORMANT_TRANSITION` | DORMANT 진입 | SYSTEM | `DormantUserBatchService` (Phase 3) |
| `USER_HARD_DELETE` | 행 hard delete (보존 의무 만료) | SYSTEM | `PersonalDataDestructionService` (Phase 5) |
| `LIFECYCLE_STATE_CHANGE` | 일반 상태 전이 (default fallback) | * | `UserLifecycleService.transitionTo` |
| `USER_WITHDRAWAL_REQUEST` | 자발 탈퇴 신청 | SELF | `UserLifecycleService.requestWithdrawal` |
| `USER_WITHDRAWAL_CANCEL` | 본인 30일 내 취소 | SELF | `UserLifecycleService.cancelWithdrawal` |
| `USER_RESTORE` | 어드민 7일 내 롤백 / DORMANT 재로그인 복원 | ADMIN·SELF | `AdminServiceImpl.restoreClient` / `LoginService` 가드 |
| `ADMIN_FORCE_DEACTIVATE` | 어드민 강제 비활성 (`DELETED_BY_ADMIN`) | ADMIN | `AdminServiceImpl.deleteClient/deleteConsultant` |

#### §8.2.1 Phase 2~3 위임 시 추가 필요한 `AuditAction` 값 (fix-forward)

> v1.0 §8 의 가칭 enum 과 정착 코드 사이 diff 분석 결과, 아래 3 값은 정착 enum 에 부재 → **Phase 2~3 위임 시 `AuditAction` enum 에 추가 + i18n 메시지 키 정착 필요**:

| 추가 필요 값 | 의미 | 부재로 인한 영향 |
|---|---|---|
| `AUTO_ANONYMIZE_NOTIFIED` | 익명화 사전 통지 (30일 전 알림 발송 시점) | Phase 3 cron 의 사전 통지 단계를 audit 으로 추적 불가 — `LIFECYCLE_STATE_CHANGE` 로 대체 시 의미 모호 |
| `AUTO_DORMANT_NOTIFIED` | 휴면 사전 통지 (30일 전 알림 발송 시점) | 동일 |
| `PII_VAULT_RESTORE` | DORMANT vault → users PII 복원 (재로그인 시점) | `USER_RESTORE` 와 별도 추적 권장 — vault 복원 vs 단순 상태 복원 구분 필요 |

→ **Phase 2 위임 (UserLifecycleService 구현) 시 위 3 값 enum 추가 + 메시지 키 (`messages/enums_*.properties`) + `LifecycleEnumsTest` 매트릭스 확장 동시 처리**. 별도 마이그레이션 불필요 (audit_logs.action 은 VARCHAR(60) 자유 적재).

### §8.3 `personal_data_destruction_logs` — PIPA 시행령 §16 충족

- 파기 행위 자체를 보존 (3년 권장). anonymize / tombstone / hard_delete / dormant_transition 4 종 모두 기록.
- 핵심 컬럼: `target_user_id`, `destruction_type`, `pii_columns_affected (JSON)`, `before_email_hash` / `before_name_hash` / `before_phone_hash` (SHA256 — 추적용, 원본 보존 금지), `executed_by_user_id`, `execution_reason`, `legal_basis`, `recovery_window_until` (Q5 7일).
- **상세 사양**: `src/main/resources/db/migration/V20260604_001__create_lifecycle_audit_and_destruction_tables.sql:106-137`.
- **legal_basis enum** (`LegalBasis` 도메인 enum, ec922de12): `PIPA_§36`, `PIPA_§39_6`, `ADMIN_FORCED`, `MEDICAL_LAW_§22_10Y` 등.

### §8.4 기존 `personal_data_access_logs` 와의 관계 (W2 정착 후)

- 기존 `personal_data_access_logs` 는 (a) 개인정보 **열람·삭제 요청 수신 시점** 기록 (1년 보존, `SECURITY_POLICY.md:228`). **그대로 유지**.
- 신설 `audit_logs` 는 (a) 종료 전체 **상태 전이 + 관리자 액션** 추적 (3년 권장, `SECURITY_POLICY.md:227` 보안 이벤트 정책 준용).
- 신설 `personal_data_destruction_logs` 는 (a) **파기 행위 자체** 의 audit trail (3년 권장).
- 세 로그의 cross-reference:
  - `personal_data_access_logs.target_user_id` (BIGINT — W2 정착) ↔ `audit_logs.target_user_id` ↔ `personal_data_destruction_logs.target_user_id`.
  - 동일 user 의 anonymize 1 회 발생 시 3 로그 동시 1 행씩 기록 (단일 트랜잭션 — `UserAnonymizationService` Phase 2 위임).

### §8.5 후속 위임 — 비즈니스 로직 (Phase 2~5)

Phase 0 (W1·W2 entity·service skeleton) 은 정착 완료. 비즈니스 로직 (실제 anonymize / dormant / hard_delete 실행) 은 §11 Phase 2~5 위임으로 분리.

---

## §9. 운영 사고 시 롤백 절차

### §9.1 사고 유형별 대응 (Q5 결정 흡수 — 7일 보존 윈도우)

| 사고 유형 | 가능 단계 | 롤백 가능 여부 | 절차 | 보존 윈도우 |
|---|---|---|---|---|
| 어드민이 잘못된 사용자 강제 비활성 | `DELETED_BY_ADMIN` | ◯ | 어드민 화면 "되돌리기" → `lifecycle_state=ACTIVE`. `audit_logs.action=ADMIN_ROLLBACK`. | **Q5 결정 = 7일** (`personal_data_destruction_logs.recovery_window_until` 컬럼으로 stamp) |
| 자발 탈퇴 신청 후 본인 변심 | `WITHDRAWAL_PENDING` | ◯ | 본인 로그인 → "탈퇴 취소" 버튼 → `lifecycle_state=ACTIVE`. `audit_logs.action=SELF_WITHDRAWAL_CANCELLED`. | **Q3 결정 = 30일** |
| 자동 휴면 잘못 적용 | `DORMANT` (4년 이내) | ◯ | 본인 재로그인 + 본인 인증 (이메일/SMS OTP) → `lifecycle_state=ACTIVE` + PII vault 복원. `audit_logs.action=AUTO_DORMANT_REACTIVATED` + `PII_VAULT_RESTORE`. | DORMANT → ANONYMIZED 까지 Q9 = 4년 |
| 잘못된 anonymize 실행 | `ANONYMIZED` 후 | **✕ (PII 복원 불가)** | 백업 복원 (RPO 1일) — `SECURITY_POLICY.md:172-180`. 백업 복원 절차는 분기별 테스트(`SECURITY_POLICY.md:178-180`). | 즉시 백업 복원 외 방법 없음 |
| 잘못된 hard delete (보존 의무 만료 후만 발생) | `(row gone)` | **✕** | 백업 복원 외 방법 없음. Phase 5 Hard delete 채택 시 RTO/RPO 사전 합의 필수. | — |

### §9.2 Q5 7일 보존 윈도우 — 운영 SOP

- **윈도우 stamp 위치**: `personal_data_destruction_logs.recovery_window_until` (V20260604_001 정착) — anonymize 실행 시 `now() + INTERVAL 7 DAY` 자동 설정.
- **윈도우 내 롤백 절차** (Phase 2-β 위임 — `AdminServiceImpl.restoreClient/restoreConsultant`):
  1. 어드민이 `users.lifecycle_state=DELETED_BY_ADMIN` 사용자 목록 조회 (필터 `recovery_window_until > now()`).
  2. "되돌리기" 버튼 클릭 → `UserLifecycleService.transitionTo(user, ACTIVE, admin, reason)`.
  3. `audit_logs` 에 `action=ADMIN_ROLLBACK`, `before_json={lifecycle_state: 'DELETED_BY_ADMIN'}`, `after_json={lifecycle_state: 'ACTIVE'}` 기록.
  4. PII 가 아직 anonymize 전 → 원본 그대로 복원 (별도 vault 조회 불필요).
- **윈도우 만료 자동 진행** (Phase 3 cron — 03:00 KST 매일):
  1. `lifecycle_state=DELETED_BY_ADMIN AND personal_data_destruction_logs.recovery_window_until <= now()` 검색.
  2. `UserAnonymizationService.anonymize(user, reason='ADMIN_WINDOW_EXPIRED', actor='SYSTEM')` 호출.
  3. PII 매트릭스 (§3) 적용 + email tombstone (§7.1) + `lifecycle_state=ANONYMIZED` 전이 + `audit_logs.action=USER_ANONYMIZE` 기록.
- **이중 안전 장치**: `UserLifecycleService.transitionTo` 가드에서 `DELETED_BY_ADMIN → ANONYMIZED` 전이 시 `recovery_window_until <= now()` 검증 (사고로 윈도우 내 anonymize 호출 시 거부).

### §9.3 백업 복원 시 주의사항

- 백업 복원은 **테넌트 단위 부분 복원**을 기본으로 권장. 전체 DB 복원은 다른 테넌트 데이터 회귀 발생.
- 복원 후 `audit_logs` 에 `action=EMERGENCY_RESTORE` (Phase 5 위임 시 enum 확장) 명시.
- 골든 윈도우 (현 운영 = 0 incident) 보존 차원: 운영 가동 직후 첫 anonymize 발생 전 백업 1회 명시 stamp 권장.

### §9.4 PortOne 결제 webhook 도착 시점 보호

- 사용자 anonymize 후 PortOne webhook 이 도착하면 user lookup 은 surrogate(`deleted-{uid}-{epoch}@anonymized.local`) 로 성공 — 결제 상태 동기화는 정상 진행 (행 KEEP — Scenario A).
- 사용자 hard delete (Phase 5 보존 의무 만료 후) 이후 webhook 도착 시 webhook 자체는 `Payment.payer_id` 만으로 처리되므로 영향 적음. 단 `FinancialTransaction` 생성 시 user join 이 필요한 경우 dead-letter 큐로 보관 후 어드민 수동 처리.

---

## §10. 결정 요약 — 사용자 결재 완료 v1.1 (15건 전원 권장 default 채택)

> v1.0 의 결정 질문 12개 (Q1~Q12) + debugger P0 게이트 3개 (W1~W3) 모두 **권장 default 일괄 채택** 으로 결재 완료 (2026-05-27). 본 §10 은 결정 결과를 단일 표로 정착하여, 후속 위임 (§11) 에 입력으로 사용한다.

### §10.1 결정 채택 표

| ID | 항목 | 채택 결정 | 적용 위치 | 정착 단계 |
|---|---|---|---|---|
| **Q1** | SSOT 통일 | **단일 `lifecycle_state` enum 채택** — `is_active` 의미 분리 (운영적 정지 한정) | §3.6, §4.4 | Phase 1 (신규 마이그) |
| **Q2** | 기본 시나리오 | **Scenario A (PII Anonymization)** — Q8 일부 예외 | §1, §4.4, §6 | Phase 2 (`UserAnonymizationService`) |
| **Q3** | 자발 탈퇴 유예 | **30일** (`WITHDRAWAL_PENDING`) | §2.3, §9.1 | Phase 2 (자발 탈퇴 API) |
| **Q4** | 다중 역할 | **전체 탈퇴만** — 역할 분리 불가 | §2.3, §7.4 | Phase 2 (가드 재사용) |
| **Q5** | 어드민 강제 보존 | **7일** 보존 윈도우 (롤백 가능) | §6.2, §9.1, §9.2 | Phase 2 (cron) + Phase 3 |
| **Q6** | 재가입 cooldown | **즉시 가능 (default) + 어드민 사유별 cooldown 옵션** | §7.2 | Phase 2 (어드민 설정) |
| **Q7** | CONSULTANT `specialization` | **KEEP** (통계 우선) | §3.2 | Phase 2 (매트릭스 적용) |
| **Q8** | `mood_journal_*` / `self_assessment_*` | **HARD_DELETE** (애플리케이션 명시 DELETE) | §4.4 | Phase 2 (anonymize 분기) |
| **Q9** | DORMANT → ANONYMIZED 추가 경과 | **4년** (총 5년) + 별도 `dormant_user_pii_vault` | §3.6 전이, §6.1 | Phase 3 (vault 마이그) |
| **Q10** | `consultation_records` 보존 | **10년** (의료법 §22) — 현행 5년 cutoff 갱신 + 법무 stamp | §5 | Phase 5 (법무 자문) |
| **Q11** | 자유 입력 PII 스크러빙 | **정규식 우선** (전화·이메일·주민번호 패턴) **→ AI 단계적 도입** | §3.4, §3.5 | Phase 2 (정규식) + Phase 5 (AI) |
| **Q12** | `community_*` 본인 글 | **author 익명화 (default) + 본인 옵션 "본문도 삭제" 선택 가능** | §4.4 | Phase 4 (community API) |
| **W1** | 컴플라이언스 추적 6 테이블 | **신설 정착 완료** — `audit_logs` / `notifications` / `personal_data_destruction_logs` / `consultant_client_mapping_history` / `session_compensation_history` / `client_satisfaction_surveys` (V20260604_001) | §8 | **Phase 0 완료** (cb88d0689 + ec922de12) |
| **W2** | `personal_data_access_logs.target_user_id` 타입 | **`varchar(255)` → `BIGINT` + FK NO ACTION 정착 완료** (V20260604_002) | §4.2 | **Phase 0 완료** (cb88d0689 + ec922de12) |
| **W3** | email tombstone 의무화 | **`deleted-{uid}-{epoch}@anonymized.local` 패턴 의무화** — UNIQUE 점유 해제 + 재가입 가능 보장 | §7.1 | Phase 2 (`UserAnonymizationService` 호출 의무) |

### §10.2 결정의 결합 효과 (요약)

- **Q1 + Q2** → 모든 종료 경로 (자발/강제/자동) 가 단일 `lifecycle_state` SSOT + `UserAnonymizationService.anonymize` 로 수렴.
- **Q3 + Q5** → 자발 30일 + 강제 7일 두 보존 윈도우만 존재 → audit_logs + `recovery_window_until` stamp.
- **Q6 + W3** → email tombstone 의무화 가 즉시 재가입 default 의 기술적 전제 (UNIQUE 충돌 0).
- **Q9 + Q11** → DORMANT 5년 + 본문 정규식 스크러빙 → §39의6 충족 + PII 재유출 0.
- **Q10 + Q11 + Q12** → 의료법 10년 + 본문 PII 스크러빙 + 게시판 익명화 → §36 vs 보존 의무 충돌 매트릭스 단일 해소.
- **W1 + W2 + W3** (Phase 0 정착) → Phase 2 위임 직전 P0 게이트 해제 + develop FF 가능.

> v1.0 §10 의 채택되지 않은 옵션 본문 (각 질문의 (a)/(b)/(c) 옵션) 은 git 이력 `cc7a58ad8` 의 §10 에서 조회 가능 (감사 추적 보존).

---

## §11. 실행 일정 — Phase 0~5 우선순위·의존성

> v1.0 의 "후속 단계 위임 순서" 를 Phase 0~5 일정 + 의존성 표 로 정착. Phase 0 (W1·W2) 는 정착 완료 (cb88d0689 / ec922de12).

### §11.1 Phase 일정 표

| Phase | 명칭 | 담당 | 산출 | 의존성 | 완료 상태 | commit 또는 위임 |
|---|---|---|---|---|---|---|
| **0** | W1·W2 P0 게이트 정착 | core-coder | 6 테이블 신설 + PDAL 타입 변경 + 6 entity·repository·service skeleton + 6 enum + PDAL Long 정합 | (선행 없음) | **완료** | `cb88d0689` (마이그) + `ec922de12` (entity·service·enum) |
| **1** | `lifecycle_state` SSOT 마이그레이션 | core-coder (신규 위임) | (a) `users.lifecycle_state ENUM NOT NULL DEFAULT 'ACTIVE'` 컬럼 추가, (b) `is_active`/`is_deleted` deprecated stamp + 매핑 cron 1회 실행 (`is_deleted=TRUE → ANONYMIZED`, `is_active=FALSE → SUSPENDED`, 운영 0행 안전), (c) 파생 쿼리 11개 `lifecycle_state` 필터 추가 | Phase 0 | 위임 대기 | (신규 마이그 `V20260605_001__add_lifecycle_state_to_users.sql`) |
| **2-α** | `UserLifecycleService` + 자발 탈퇴 API + Anonymize SSOT | core-coder | (a) `UserLifecycleService.transitionTo(...)` 단일 진입점, (b) `UserAnonymizationService.anonymize(...)` (PII 매트릭스 §3 + email tombstone §7.1 + audit_logs·destruction_logs 동시 기록), (c) 자발 탈퇴 API (마이페이지 "회원탈퇴" — `WITHDRAWAL_PENDING` 진입), (d) 자발 탈퇴 취소 API, (e) Q11 정규식 PII 스크러빙 유틸 | Phase 1 | 위임 대기 | — |
| **2-β** | 어드민 강제 종료 → `UserLifecycleService` redirect + 7일 윈도우 cron | core-coder | (a) `AdminServiceImpl.deleteClient/deleteConsultant` → `UserLifecycleService.transitionTo(user, DELETED_BY_ADMIN, admin, reason)` redirect, (b) `recovery_window_until = now() + 7d` stamp, (c) 7일 만료 cron (03:00 KST) → `transitionTo(user, ANONYMIZED, SYSTEM)`, (d) 어드민 화면 "되돌리기" 버튼 | Phase 2-α | 위임 대기 | — |
| **3** | DORMANT / ANONYMIZE cron + `dormant_user_pii_vault` | core-coder | (a) `dormant_user_pii_vault` 마이그 + entity, (b) `DormantUserBatchService` (1년 미접속 → DORMANT + PII vault 이전), (c) `AnonymizeBatchService` (DORMANT 4년 후 → ANONYMIZED), (d) 본인 재로그인 시 vault 복원 게이트, (e) Q9 사전 통지 (30일 전 메일/SMS) | Phase 2-α | 위임 대기 | — |
| **4** | `community_*` Q12 옵션 b 본문 삭제 UI/API | core-coder + core-designer | (a) Q12 default = author 익명화는 Phase 2 매트릭스로 자동 적용, (b) 본인 옵션 "본문도 삭제" — 마이페이지 게시글 관리 UI + API + audit_logs 기록 | Phase 2-α | 위임 대기 | — |
| **5** | 의료법 stamp + Q11 AI 단계적 도입 | 법무 + core-coder | (a) `PersonalDataDestructionService.destroyExpiredConsultationData:154` 5년 → 10년 cutoff 갱신 (Q10), (b) 의료법 §22 적용 범위 / 시행규칙 §17 절차 법무 자문 stamp, (c) Q11 AI 기반 본문 스크러빙 검증 + 단계적 도입 | Phase 2-α + 법무 결재 | 위임 대기 (법무 의존) | — |

### §11.2 Phase 간 의존성 그래프

```
Phase 0 (정착 완료)
  ├─ Phase 1 (lifecycle_state 마이그)
       └─ Phase 2-α (UserLifecycleService + Anonymize SSOT + 자발 탈퇴 API)
            ├─ Phase 2-β (어드민 7일 윈도우 cron)
            ├─ Phase 3 (DORMANT/ANONYMIZE cron + vault)
            ├─ Phase 4 (community Q12 옵션 b)
            └─ Phase 5 (Q10 10년 cutoff + 법무 stamp + Q11 AI)
```

- **병렬 가능**: Phase 2-β / 3 / 4 는 Phase 2-α 완료 후 **동시 진행 가능** — 서로 다른 모듈 (admin / cron / community).
- **차단 의존**: Phase 5 는 법무 자문 stamp 대기 — 코드 변경 자체는 작지만 법적 stamp 필수.
- **Phase 1 의 운영 위험도**: 운영 0 incident 골든 윈도우 (§0.2) 안에 실행 시 무중단. 매핑 cron 의 영향 행 = 0.

### §11.3 위임 입력·테스트 가이드 (메인 어시스턴트 → core-planner)

- **Phase 1**: §3.6 + §10.1 (Q1) → `V20260605_001` 마이그 + 매핑 cron 1회 + 파생 쿼리 갱신.
- **Phase 2-α**: §3·§4.4·§7.1·§8 + Q2/Q3/Q11/W3 + Phase 0 정착 사양 → `UserLifecycleService` + `UserAnonymizationService` + 자발 탈퇴 API + 정규식 스크러빙.
- **Phase 2-β**: §6.2·§9.1·§9.2 + Q5 → `AdminServiceImpl` redirect + 7일 cron + "되돌리기" UI.
- **Phase 3**: §3.6 전이·§6.1·§7.3 + Q9 → `dormant_user_pii_vault` 마이그 + 2 batch service + 사전 통지.
- **Phase 4**: §4.4 community + Q12 → 게시글 관리 UI/API + audit 통합.
- **Phase 5**: §5 + Q10/Q11 + 법무 자문 결과 → `PersonalDataDestructionService` 10년 갱신 + AI 단계적 도입.
- **처리방침 갱신**: v1.1 + Phase 0~5 결정 → generalPurpose `/core-solution-documentation` 위임.
- **core-tester E2E 4건** (Phase 2~5 공통):
  1. 탈퇴 → 30일 유예 → 본인 취소 → ACTIVE 복원.
  2. 탈퇴 → 30일 만료 → 자동 ANONYMIZE → 동일 email 재가입 성공.
  3. 어드민 강제 → 7일 윈도우 → 어드민 롤백.
  4. 1년 미접속 → DORMANT → vault 분리 → 본인 재로그인 → PII 복원.
- 회귀: `mappings`/`payments`/`consultation_records`/`financial_transactions` anonymize 전후 동등성.

---

## 부록 A — 본 합의서가 참조한 코드/문서 인벤토리

- `docs/standards/SELF_WITHDRAWAL_PROCESS_AUDIT.md` (자매 보고서 — 자발 탈퇴 전수 점검)
- `docs/standards/CLIENT_HARD_DELETE_IMPACT_ANALYSIS.md` (자매 보고서 — hard delete 영향도)
- `docs/guides/SECURITY_POLICY.md:75-87, 209-265`
- `docs/archive/legacy-docs-backup-2025-10-14/SYSTEM_COMPLIANCE_LEGAL_REVIEW.md`
- `docs/archive/legacy-docs-backup-2025-10-14/PRIVACY_POLICY_2024.md`
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` (안내 메시지 공통 표시 경계)
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- `src/main/java/com/coresolution/consultation/entity/User.java`, `AuditableTenantBase.java`, `Client.java`, `ConsultantClientMapping.java`, `Schedule.java`, `Payment.java`, `entity/erp/financial/FinancialTransaction.java`, `ConsultationRecord.java`, `NotificationBatchSendLog.java`, `PersonalDataAccessLog.java`
- `src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java`, `AdminServiceImpl.java`, `MyPageServiceImpl.java`, `PersonalDataRequestServiceImpl.java`, `service/PersonalDataDestructionService.java`
- `src/main/java/com/coresolution/consultation/repository/BaseRepository.java`, `UserRepository.java`
- `src/main/resources/db/migration/V21__create_refresh_token_store_table.sql`, `V32__create_user_role_assignments_table.sql`, `V20260513_003`, `V20260514_001`, `V20260514_002`, `V20260514_003`, `V20260515_002`

## 부록 B — 본 합의서 작성 시 운영 가드 준수 사항

- 코드/설정/DB **무수정** (Read-only 가드 준수).
- 운영 DB 직접 SELECT 금지 — core-debugger 위임 병행.
- `mind_garden` 스키마 미접촉.
- v1.1 정착 시점에 운영 host `/tmp/fk-survey-report.md` 임시 파일은 이미 삭제됨. **부록 C 의 일부 항목 (특히 57 FK 전수 행) 은 추정** — 운영 재실측 시 갱신 필요.

---

## 부록 C — `users.id` 참조 FK 전수 표 (debugger §1 흡수 + 일부 추정)

> **출처**: core-debugger 운영 DB 실측 (`/tmp/fk-survey-report.md`, 2026-05-27 KST). 본문 임시 파일은 v1.1 작성 시점에 이미 삭제 — 본 표는 (a) 위임 프롬프트 요약, (b) Flyway 마이그레이션 정적 분석, (c) `V20260604_001/_002` 헤더 주석에 흡수된 사실로 재구성. **57 행 전수 본문이 필요한 경우 운영 재실측 필수**.

### C.1 ON DELETE 분포 요약 (debugger §1.1 흡수)

| ON DELETE | 행 수 | 비율 | 비고 |
|---|---|---|---|
| `NO ACTION` | **56** | 98.2% | 운영 우세 패턴 — anonymize 절대 필수 |
| `CASCADE` | **1** | 1.8% | `consultant_mood_tracking_ibfk_1` — Q8 결정으로 자연 흡수 |
| `RESTRICT` | 0 | — | 마이그레이션 RESTRICT 정의는 운영에서 NO ACTION 으로 적용 (MySQL InnoDB) |
| `SET NULL` | 0 | — | 사용 안 함 |
| **합계** | **57** | 100% | |

### C.2 그룹별 FK 분포 (Flyway 정적 + Phase 0 정착 흡수)

| 그룹 | FK 개수 (정적+정착) | 정의 위치 | 운영 ON DELETE | 비고 |
|---|---|---|---|---|
| 인증·권한 | 2 | `V21:33`, `V32:38-39` | NO ACTION | V21/V32 diff — 부록 D |
| 모바일 푸시 | 2 | `V20260514_001:21,40` | NO ACTION | mobile_push_tokens / _settings |
| 자발 데이터 | 4 | `V20260513_003:26-27`, `V20260514_002:22,60`, `consultant_mood_tracking_ibfk_1` | NO ACTION (+ 1 CASCADE) | **유일 CASCADE** — Q8 자연 흡수 |
| 쇼핑·포인트 | 4 | `V20260514_003:37,77,115,134` | NO ACTION | 세법·전금법 보존 |
| 커뮤니티 | 4 | `V20260515_002:26-27,44,61,79` | NO ACTION | Q12 = author 익명화 |
| **W1 신설 (Phase 0 정착)** | 15 | `V20260604_001` (`audit_logs` 2 / `notifications` 2 / `personal_data_destruction_logs` 2 / `consultant_client_mapping_history` 4 / `session_compensation_history` 3 / `client_satisfaction_surveys` 2) | NO ACTION | 운영 56/57 정합 |
| **W2 신설 (Phase 0 정착)** | 1 | `V20260604_002` `fk_pdal_target_user` | NO ACTION | 타입 변경 + FK 신설 |
| (잔여) Hibernate ddl-auto / 운영 만 존재 | 추정 25+ | — | NO ACTION (추정) | **운영 재실측 필요** |

→ **합계**: 식별 가능 32 행 + 잔여 추정 ~25 행 = 57. 잔여는 Hibernate ddl-auto 흔적 또는 §4.2 "마이그레이션 FK 없음" 테이블 중 일부가 운영에서 FK 보유 가능 (예: `user_role_assignments` mismatch 패턴 동일 재현 가능성). **운영 재실측 시 본 부록 C 갱신 의무**.

### C.3 핵심 FK 행 (식별 가능 — debugger §1.2·§1.3·§1.4 흡수)

| FK 이름 | 자식 테이블 | ON DELETE | 마이그 정의 vs 운영 | 비고 |
|---|---|---|---|---|
| `consultant_mood_tracking_ibfk_1` | `consultant_mood_tracking` | **CASCADE** | 운영 유일 CASCADE | Q8 자연 흡수 |
| `fk_user_role_user` (or eq.) | `user_role_assignments` | NO ACTION (운영) | `V32:38-39` CASCADE 와 mismatch | **부록 D** |
| `fk_refresh_token_user_id` | `refresh_token_store` | (운영 부재) | `V21:33` CASCADE — 운영 누락 | **부록 D** |
| `fk_pdal_target_user` (신설) | `personal_data_access_logs` | NO ACTION | `V20260604_002:35-37` 정합 | Phase 0 정착 |
| W1 신설 FK 15건 | `audit_logs` / `notifications` / `personal_data_destruction_logs` / `consultant_client_mapping_history` / `session_compensation_history` / `client_satisfaction_surveys` | NO ACTION | `V20260604_001` 정합 | Phase 0 정착 (cb88d0689) |

### C.4 운영 재실측 시 권장 SQL

```sql
-- 운영 DB read-only 실측 권장 (core-debugger 위임 — PII 미열람)
SELECT
  rc.CONSTRAINT_NAME,
  rc.TABLE_NAME            AS child_table,
  kcu.COLUMN_NAME          AS child_column,
  rc.REFERENCED_TABLE_NAME AS parent_table,
  kcu.REFERENCED_COLUMN_NAME AS parent_column,
  rc.DELETE_RULE,
  rc.UPDATE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS rc
JOIN information_schema.KEY_COLUMN_USAGE kcu
  ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
 AND rc.CONSTRAINT_NAME   = kcu.CONSTRAINT_NAME
WHERE rc.CONSTRAINT_SCHEMA = 'core_solution'
  AND rc.REFERENCED_TABLE_NAME = 'users'
  AND kcu.REFERENCED_COLUMN_NAME = 'id'
ORDER BY rc.TABLE_NAME, rc.CONSTRAINT_NAME;
```

→ 결과 57 행을 본 부록 C 표에 1:1 정착. 갱신 commit message: `docs(lifecycle): fk-survey 운영 재실측 — 부록 C 57 FK 전수 정착`.

---

## 부록 D — V21 / V32 마이그-운영 fix-forward 가이드

> debugger §1.3 의 mismatch 두 건. 운영 DB 와 Flyway 마이그레이션 명세 사이의 차이를 fix-forward 로 정합.

### D.1 V21 — `refresh_token_store` FK 운영 누락

- **명세**: `src/main/resources/db/migration/V21__create_refresh_token_store_table.sql:33` — `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
- **운영 실측**: FK 부재 (debugger §1.3).
- **추정 원인**:
  - `CREATE TABLE IF NOT EXISTS refresh_token_store ( ... FOREIGN KEY (...) ON DELETE CASCADE ... )` 패턴.
  - Hibernate `hbm2ddl=update` 가 운영 적용 전에 동일 테이블을 **FK 없이** 미리 생성. 이후 Flyway V21 적용 시 `IF NOT EXISTS` 분기로 `CREATE TABLE` 전체가 skip → FK 정의도 함께 skip.
- **fix-forward 단일 ALTER 마이그**:
  ```sql
  -- V20260606_001__fix_refresh_token_store_fk_consistency.sql (가칭)
  ALTER TABLE refresh_token_store
    ADD CONSTRAINT fk_refresh_token_user_id
      FOREIGN KEY (user_id) REFERENCES users (id);  -- NO ACTION (운영 56/57 정합)
  ```
- **운영 안전성**:
  - `refresh_token_store` 의 `user_id` 컬럼이 `users.id` 와 항상 정합인지 사전 검증: `SELECT COUNT(*) FROM refresh_token_store r LEFT JOIN users u ON r.user_id = u.id WHERE u.id IS NULL;` → 0 이어야 적용 안전.
  - **ON DELETE 정책**: 마이그 명세는 CASCADE 였으나 운영 56/57 패턴과 정합하기 위해 **NO ACTION** 으로 변경 권장. anonymize 경로에서 사전 sweep (`DELETE FROM refresh_token_store WHERE user_id = ?`) 단일 호출로 충분 (Phase 2-α `UserAnonymizationService`).

### D.2 V32 — `user_role_assignments` ON DELETE CASCADE vs NO ACTION

- **명세**: `src/main/resources/db/migration/V32__create_user_role_assignments_table.sql:38-39` — `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
- **운영 실측**: FK 존재하나 `DELETE_RULE = NO ACTION` (debugger §1.3).
- **추정 원인**:
  - V21 와 동일 패턴 — Hibernate ddl-auto 가 FK 를 NO ACTION 으로 먼저 생성. Flyway V32 의 `CREATE TABLE IF NOT EXISTS` 분기로 ON DELETE 절 재정의 skip.
- **fix-forward 선택지**:
  1. **운영 NO ACTION 을 SSOT 로 채택 (권장)** — 본 합의서 §4.4 와 정합. 마이그레이션 V32 본문은 그대로 두되, 본 합의서 + 후속 마이그레이션에서 "운영 NO ACTION" 을 명시. anonymize 경로에서 사전 sweep 또는 audit 보존 후 KEEP.
  2. **CASCADE 로 강제 정합** — `ALTER TABLE user_role_assignments DROP FOREIGN KEY fk_user_role_user; ALTER TABLE ... ADD CONSTRAINT ... ON DELETE CASCADE;` — 비권장 (anonymize 시 자식 자동 삭제 가능성).
- **결정**: **선택지 1 채택**. Phase 2-α `UserAnonymizationService` 가 anonymize 시 `user_role_assignments` 행을 명시 정리 → audit_logs 기록 → users 행 anonymize 의 순서.

### D.3 재발 방지 표준 (V20260604_001/_002 헤더 + debugger §6 권고)

- `CREATE TABLE` (no `IF NOT EXISTS`) 또는 사전 `DROP TABLE IF EXISTS` 후 단순 `CREATE TABLE`.
- **FK 는 반드시 분리된 `ALTER TABLE ADD CONSTRAINT` 로 정의** — `CREATE TABLE` inline FK 금지.
- Hibernate `spring.jpa.hibernate.ddl-auto=validate` 강제 (운영 ddl-auto FK 가로채기 차단).
- 신규 마이그레이션 코드 리뷰 시 본 표준 위반 검사.

### D.4 운영 적용 순서

Phase 0 정착 (cb88d0689 + ec922de12) develop 머지 후 별도 위임으로 fix-forward 마이그 (`V20260606_001` 가칭) 작성 → H2 MODE=MySQL 검증 + 운영 안전성 SELECT 사전 확인 → develop 머지 → 운영 적용 → 본 부록 D 에 적용 commit SHA 정착.
