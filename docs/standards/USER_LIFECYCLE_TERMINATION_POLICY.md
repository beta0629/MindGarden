# 사용자 생애주기 종료 정책 통합 합의서 (User Lifecycle Termination Policy)

> **MindGarden core_solution 단일 SSOT**. 자발 회원탈퇴 / 어드민 강제 삭제 / 자동 휴면·파기 세 갈래를 하나의 정책 문서로 통합. 본 합의서가 정착되기 전까지 신규 코드는 본 정책을 잠정 가이드라인으로 사용하고, §10 결정 질문 확정 후 후속 PR 로 구현에 반영.
>
> **입력 보고서**:
> - `docs/standards/SELF_WITHDRAWAL_PROCESS_AUDIT.md` (자발 회원탈퇴 점검 — Agent `cda90711`)
> - `docs/standards/CLIENT_HARD_DELETE_IMPACT_ANALYSIS.md` (내담자 hard delete 영향도 — core-planner 재분석)
>
> **작성**: core-planner (2026-05-27). 코드 0건 수정. 마크다운만 산출.

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

| # | 항목 | **자발(Self-Withdrawal)** | **강제(Admin Forced Delete)** | **자동(Auto Dormant/Destroy)** |
|---|---|---|---|---|
| 1 | **주체** | 본인(CLIENT/CONSULTANT/HQ_ADMIN) | 어드민 권한자(HQ_ADMIN, SUPER_HQ_ADMIN) | 시스템 cron (`PersonalDataDestructionService.destroyExpiredPersonalData`, 03:00 KST 매일) |
| 2 | **트리거** | 마이페이지 "회원 탈퇴" 버튼 + 비밀번호 재확인 | 어드민 화면 → `AdminServiceImpl.deleteClient/deleteConsultant` (사유 입력) | (a) `last_login_at` 1년 미접속 → DORMANT 전환, (b) `is_deleted=true AND updated_at` 1년 경과 → ANONYMIZE, (c) 익명화 후 N년(§6) → HARD_DELETE 후보 |
| 3 | **본인 확인** | 비밀번호 재확인 + (옵션) OTP/2FA | 어드민 권한 검사 + 사유 입력 + (옵션) 결재 라인 | 없음 (배치) |
| 4 | **유예기간(Grace Period)** | 30일 권장 (§10 Q3) — `WITHDRAWAL_PENDING` 상태로 유지, 본인 로그인 시 취소 가능 | 즉시 (운영 사고 대응) — 단 어드민 화면에 "되돌리기" 7일 보존 가능(§10 Q5) | 없음 (단 DORMANT 단계 자체가 30일 사전 알림 후 전환) |
| 5 | **알림** | 신청 시 메일/카톡 + 7일 전 만료 리마인더 + 완료 통지 (`docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` 안내 메시지 표시 경계) | 사용자에게 강제 종료 통지 + 어드민 dashboard 알림 | DORMANT 30일 전 사전 통지, ANONYMIZE 30일 전 사전 통지 |
| 6 | **롤백 가능성** | 유예기간 30일 내 본인 취소 시 100% 복원 | (a) `is_active=false` 단계는 즉시 복원 가능(`UserServiceImpl.restoreById`), (b) anonymize 후는 복원 불가 (legal-stamp 영역만 남음) | (a) DORMANT 단계는 본인 재로그인으로 자동 복원, (b) ANONYMIZE 후는 복원 불가 |
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

### §3.6 SSOT 통일안 — `lifecycle_state` 단일 컬럼 (제안)

현행 `is_active`(BOOL) / `is_deleted`(BOOL) / `deleted_at`(DATETIME) 세 컬럼을 단일 enum 으로 통합:

```
lifecycle_state ENUM(
  'ACTIVE',                -- 정상 활성
  'INACTIVE_BY_ADMIN',     -- 어드민 비활성 (롤백 가능, 로그인 차단)
  'WITHDRAWAL_PENDING',    -- 자발 탈퇴 신청 (유예기간 — 본인 취소 가능)
  'DORMANT',               -- 1년 미접속 휴면 (분리 저장 — 본인 재로그인 시 자동 해제)
  'ANONYMIZED',            -- PII 익명화 완료 (롤백 불가, legal-stamp 영역만 잔존)
  'HARD_DELETED_PENDING'   -- 행 hard delete 대상 (배치 대기, 보존 의무 만료 후만)
)
```

- 기존 `is_active, is_deleted, deleted_at` 은 backward-compat 용으로 한시 유지(`@Deprecated`).
- 단일 진입점(`UserLifecycleService.transitionTo(userId, newState, actor, reason)`) 에서 (a) 상태 전이 (b) PII 매트릭스 적용 (c) FK 자식 sweep (d) 감사 로그 기록 을 단일 트랜잭션으로 처리.
- 전이 그래프:
  - `ACTIVE` → `INACTIVE_BY_ADMIN` / `WITHDRAWAL_PENDING` / `DORMANT`
  - `INACTIVE_BY_ADMIN` → `ACTIVE` (롤백) / `ANONYMIZED`
  - `WITHDRAWAL_PENDING` → `ACTIVE` (본인 취소) / `ANONYMIZED` (유예 만료)
  - `DORMANT` → `ACTIVE` (본인 재로그인) / `ANONYMIZED` (휴면 추가 N년 경과)
  - `ANONYMIZED` → `HARD_DELETED_PENDING` (보존 의무 만료 후) — Scenario A 에서는 거의 도달하지 않음
  - `HARD_DELETED_PENDING` → `(row gone)` (배치 hard delete)

→ 이 SSOT 단일화는 §10 Q1 (SSOT 통일 채택 여부) 의 답에 따라 본 합의서 본문이 갱신됩니다.

---

## §4. FK cascade 동작 표 (테이블별, soft / anonymize / hard)

### §4.1 정적 분석 기준 (Flyway 마이그레이션) — `CLIENT_HARD_DELETE_IMPACT_ANALYSIS.md` §2 와 정합

| 테이블 | FK 정의 위치 | ON DELETE | **Soft (Scenario A)** | **Anonymize (default)** | **Hard (Scenario C, 비권장)** |
|---|---|---|---|---|---|
| `refresh_token_store` | `V21:33` | CASCADE | 행 KEEP, dispatcher 차단 | DB CASCADE 로 자동 삭제 가능 / 또는 사전 sweep 후 user CASCADE | DB CASCADE 자동 삭제 |
| `user_role_assignments` | `V32:38-39` | CASCADE | KEEP | 사전 sweep 또는 CASCADE | CASCADE 자동 삭제 |
| `mind_weather_cards` | `V20260513_003:26-27` | RESTRICT | KEEP | 사전 sweep 후 anonymize 또는 KEEP | 사전 sweep 필수 (없으면 user hard delete 실패) |
| `mobile_push_tokens` | `V20260514_001:21` | RESTRICT | `active=false` 변경 | 사전 sweep 또는 KEEP 후 dispatcher 차단 | 사전 sweep 필수 |
| `mobile_push_settings` | `V20260514_001:40` | RESTRICT | KEEP | KEEP (FK 만 끊김) | 사전 sweep 필수 |
| `mood_journal_entries` | `V20260514_002:22` | RESTRICT | KEEP | 사용자 자발 일지 — **hard delete 권장**(보존 의무 없음, §10 Q8) | 사전 sweep 필수 |
| `self_assessment_sessions` | `V20260514_002:60` | RESTRICT | KEEP | 동일 (자발 평가) | 사전 sweep 필수 |
| `shop_carts` | `V20260514_003:37` | RESTRICT | KEEP | **hard delete** (카트는 보존 의무 없음) | 사전 sweep 필수 |
| `shop_client_orders` | `V20260514_003:77` | RESTRICT | KEEP | **anonymize** (영수증 보존 — 전금법 5년) | 사전 sweep 시 세법 위반 |
| `client_point_wallets` | `V20260514_003:115` | RESTRICT | KEEP | 잔여 포인트 환불/소멸 후 hard delete (§10 Q9) | 사전 sweep 시 세법 위반 가능 |
| `client_point_ledger_entries` | `V20260514_003:134` | RESTRICT | KEEP | **anonymize** (세법 5년 보존 — 거래 내역) | 세법 위반 |
| `community_posts` (author_user_id, moderated_by_user_id) | `V20260515_002:26-27` | RESTRICT | KEEP | **본인 글 anonymize** (author 표기만 `이용종료`) — 게시판 맥락 보존 (§10 Q12) | 사전 sweep 시 다른 사용자의 댓글 맥락 깨짐 |
| `community_comments` | `V20260515_002:44` | RESTRICT | KEEP | 동일 anonymize | 동일 |
| `community_post_likes` | `V20260515_002:61` | RESTRICT | KEEP | **hard delete** (좋아요는 비식별 통계만 보존) | 사전 sweep 가능 |
| `community_reports` | `V20260515_002:79` | RESTRICT | KEEP | **anonymize** (신고자 보호) | 사전 sweep 가능 |
| `consultant_client_mappings` (consultant_id, client_id) | **마이그레이션 FK 없음** | (RESTRICT 강제 불가) | KEEP | KEEP (user 행 보존으로 join 익명) | orphan 발생 — Scenario C 불가 |
| `schedules` (consultant_id, client_id, mapping_id) | **마이그레이션 FK 없음** | — | KEEP | KEEP | orphan |
| `consultation_records` (client_id, consultant_id) | **마이그레이션 FK 없음** | — | KEEP | KEEP (의료법 §22 보존) | orphan + 의료법 위반 |
| `payments` (payer_id, recipient_id) | **마이그레이션 FK 없음** | — | KEEP | KEEP (전금법 §22) | orphan + 전금법 위반 |
| `financial_transactions` (approver_id, related_entity_id) | **마이그레이션 FK 없음** | — | KEEP | KEEP (세법·상법) | orphan + 세법·상법 위반 |
| `consultations` (legacy), `consultation_record_alerts`, `consultation_record_drafts` | **마이그레이션 FK 없음** | — | KEEP | KEEP | orphan |
| `salary_calculations`, `consultant_salary_*`, `consultant_performance`, `consultant_ratings`, `quality_evaluations` | **마이그레이션 FK 없음** | — | KEEP | KEEP | orphan |
| `daily_statistics`, `dropout_risk_assessments` | **마이그레이션 FK 없음** | — | KEEP | KEEP | orphan |
| `notification_batch_send_log`, `system_notifications`, `system_notification_reads` | **마이그레이션 FK 없음** | — | KEEP, dispatcher 차단 | KEEP | orphan |
| `personal_data_access_logs` (accessor_id, target_user_id 가 VARCHAR — FK 불가) | — | — | KEEP | KEEP | KEEP |
| `user_social_accounts` | JPA `cascade=ALL` (`User.java:205-207`) | — | KEEP | TOMBSTONE 또는 hard delete | JPA cascade 로 자동 삭제 |
| `user_addresses, user_passkey, user_sessions, user_activities, user_privacy_consent` | **마이그레이션 FK 없음** | — | KEEP | TOMBSTONE | orphan |

### §4.2 운영 DB 실측 placeholder

> ⚠️ **운영 DB 실측 대기**: core-debugger 위임으로 운영 DB 의 실제 `information_schema.KEY_COLUMN_USAGE` / `information_schema.REFERENTIAL_CONSTRAINTS` SELECT 결과가 도착하면 본 §4 표를 (a) Flyway 마이그레이션과 다른 FK 가 발견되는지 (b) `ON DELETE` 동작이 실측 기준으로 다른지 검증해야 합니다.
>
> **정착 위치**: 본 합의서 §4.1 표에 "운영 DB 실측: ◯/✕/불일치" 컬럼을 추가하여 후속 PR (`docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` v1.1) 에서 갱신.
>
> **실측 항목**: (1) 위 §4.1 표 각 행의 FK 존재 여부, (2) ON DELETE 동작, (3) 표에 없는 추가 FK (Hibernate ddl-auto 가 만든 FK 가능성), (4) 운영 DB 의 실제 `users` 테이블 row count + 각 `lifecycle_state` 후보 컬럼 분포.

---

## §5. 법규 보존 매트릭스

| 법규 | 조항 | 적용 데이터 | 보존 기간 | 익명화 가능 여부 | 충돌 시 우선순위 |
|---|---|---|---|---|---|
| **개인정보보호법** | §36 (정정·삭제·처리정지권) | `users` PII, `clients` PII | 본인 요청 즉시 처리 (10일 이내, `SECURITY_POLICY.md:248`) | ◯ | 보존 의무 영역(의료/재무) **외**에서는 본인 요청 우선 |
|  | §39의6 (1년 미접속 휴면) | `users.last_login_at` 1년 경과 | 휴면 분리 or 파기 | ◯ | 자동 트리거 |
|  | §39의7 (분쟁 대비 보존) | 분쟁 발생 가능 데이터 | 분쟁 종결까지 | ◯ | 보존 의무 |
| **의료법** | §22 (진료기록 10년) | `consultation_records.*` | **10년** (현행 코드 5년 — §10 Q10) | ◯ (PII 만 익명화, 임상 내용 보존) | **보존 의무 > §36** |
| **세법** (소득세법, 부가가치세법, 법인세법) | 장부·증빙 5~10년 | `financial_transactions.*`, ERP ledger | 5년 일반 / 10년 분쟁·법인세 | ◯ (buyer name 익명화, 금액·일자 보존) | **보존 의무 > §36** |
| **전자금융거래법** | §22 (5년 보존) | `payments.*`, `payments.external_response` | **5년** | ◯ | **보존 의무 > §36** |
| **상법** | (회계장부·재무제표 10년) | ERP ledger, `accounting_entries` | **10년** | ◯ | **보존 의무 > §36** |
| **GDPR** | 17조 (잊혀질 권리) | 모든 PII | 본인 요청 즉시 (단 3항 예외) | ◯ | 17조 3항 예외 (법적 의무 / 공익 / 공중보건 / 공익 기록·연구 / 법적 주장 방어) 시 보존 우선 |

**우선순위 규칙**:
1. **보존 의무 (의료법/세법/전금법/상법)** > 본인 요청 (§36, GDPR 17조).
2. 위 1 에 해당하지 않는 영역은 본인 요청 우선.
3. 익명화 (PII 만 surrogate 치환 + 임상/재무 내용 보존) 가 모든 충돌의 default 해소책.

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

### §7.1 동일 이메일·전화 재가입

- §3.2 의 anonymize 정책으로 `users.email`, `users.phone`, `users.user_id` 의 unique 점유가 해제되므로 **동일 이메일·전화로 즉시 재가입 가능** (default).
- **옵션 — Cooldown** (§10 Q6):
  - (a) 즉시 가능 (default)
  - (b) 30일 cooldown — 자발 탈퇴 직후 재가입을 막아 의사결정 번복 보호.
  - (c) 영구 차단 — 어드민 강제 종료 사유가 부정사용·약관 위반인 경우만.
- **충돌 회피 메커니즘**:
  - 재가입 시 `UserRepository.existsByTenantIdAndEmail` 등 파생 쿼리에 **반드시 `isDeleted=false AND lifecycle_state IN ('ACTIVE', 'DORMANT', 'WITHDRAWAL_PENDING')` 필터** 명시 — 현행 코드 갭(자매 보고서 §1 매트릭스 "재가입 정책") 해소 필수.

### §7.2 휴면 해제 시 PII 복원

- `DORMANT` 상태는 PII 가 **분리 저장**(별도 보안 스토리지) — 본 합의서 단계에서는 "분리 저장 = 동일 DB 내 별도 테이블 `dormant_user_pii_vault`" 로 잠정 정의 (§10 Q9 결정).
- 본인 재로그인 시 `dormant_user_pii_vault` 에서 PII 복원 + `lifecycle_state=ACTIVE`.
- `ANONYMIZED` 후는 복원 불가 — 새 가입으로 취급.

### §7.3 다중 역할 사용자 재가입

- 동일 user 가 CLIENT+CONSULTANT 였던 경우, 재가입 시 default = CLIENT 로 가입. CONSULTANT 권한은 어드민 승인 후 부여.

---

## §8. 감사 로그 스키마 통일 — `user_lifecycle_audit_log` (가칭)

### §8.1 신설 테이블 제안 (Flyway V20260601_001__user_lifecycle_audit_log.sql 가칭)

```
CREATE TABLE user_lifecycle_audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id VARCHAR(36) NOT NULL,
  target_user_id BIGINT NOT NULL,            -- users.id (hard delete 전 보존)
  target_user_role VARCHAR(20),              -- CLIENT/CONSULTANT/ADMIN 등
  event VARCHAR(40) NOT NULL,                -- §8.2 enum
  event_source VARCHAR(20) NOT NULL,         -- SELF / ADMIN / SYSTEM
  actor_id VARCHAR(64) NOT NULL,             -- self 시 본인 user_id, admin 시 admin user_id, system 시 "SYSTEM"
  actor_role VARCHAR(20),
  actor_ip VARCHAR(64),
  actor_user_agent VARCHAR(255),
  reason VARCHAR(500),                       -- 본인 입력 사유 또는 어드민 사유 또는 SYSTEM 트리거
  before_lifecycle_state VARCHAR(40),
  after_lifecycle_state VARCHAR(40),
  affected_tables JSON,                      -- {"consultation_records": 12, "payments": 3, ...}
  created_at DATETIME NOT NULL,
  INDEX idx_ula_tenant_target (tenant_id, target_user_id),
  INDEX idx_ula_event_created (event, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### §8.2 `event` enum 후보

| event | 의미 | source |
|---|---|---|
| `SELF_WITHDRAWAL_REQUESTED` | 자발 탈퇴 신청 | SELF |
| `SELF_WITHDRAWAL_CANCELLED` | 본인 취소 | SELF |
| `SELF_WITHDRAWAL_COMPLETED` | 유예 만료 → anonymize | SYSTEM |
| `ADMIN_FORCED_INACTIVATE` | 어드민 비활성 | ADMIN |
| `ADMIN_FORCED_DELETE` | 어드민 강제 삭제 | ADMIN |
| `ADMIN_ROLLBACK` | 어드민 비활성 롤백 | ADMIN |
| `AUTO_DORMANT_NOTIFIED` | 휴면 사전 통지 | SYSTEM |
| `AUTO_DORMANT_APPLIED` | 휴면 전환 | SYSTEM |
| `AUTO_DORMANT_REACTIVATED` | 본인 재로그인 복원 | SELF |
| `AUTO_ANONYMIZE_NOTIFIED` | 익명화 사전 통지 | SYSTEM |
| `AUTO_ANONYMIZE_APPLIED` | 익명화 실행 | SYSTEM |
| `AUTO_HARD_DELETE_APPLIED` | 행 hard delete | SYSTEM |
| `PII_VAULT_RESTORE` | DORMANT → ACTIVE 시 PII 복원 | SELF |

### §8.3 기존 `personal_data_access_logs` 와의 관계

- 기존 `personal_data_access_logs` 는 (a) 개인정보 열람·삭제 요청 기록, (b) 1년 보존(`SECURITY_POLICY.md:228`) — **그대로 유지**.
- 신설 `user_lifecycle_audit_log` 는 (a) 종료 전체 상태 전이, (b) **3년 보존 권장** (`SECURITY_POLICY.md:227` 보안 이벤트 3년 정책 준용).
- 두 로그는 cross-reference: `personal_data_access_logs.dataIdentifier="USER_<id>"` ↔ `user_lifecycle_audit_log.target_user_id`.

---

## §9. 운영 사고 시 롤백 절차

### §9.1 사고 유형별 대응

| 사고 유형 | 가능 단계 | 롤백 가능 여부 | 절차 |
|---|---|---|---|
| 어드민이 잘못된 사용자 강제 비활성 | `INACTIVE_BY_ADMIN` 7일 이내 | ◯ | 어드민 어드민 화면 → "되돌리기" → `lifecycle_state=ACTIVE`. 감사 로그 `ADMIN_ROLLBACK`. |
| 자발 탈퇴 신청 후 본인 변심 | `WITHDRAWAL_PENDING` 30일 이내 | ◯ | 본인 로그인 → "탈퇴 취소" 버튼 → `lifecycle_state=ACTIVE`. |
| 자동 휴면 잘못 적용 | `DORMANT` 즉시 ~ N년 | ◯ | 본인 재로그인 + 본인 인증 → `lifecycle_state=ACTIVE` + PII vault 복원. |
| 잘못된 anonymize 실행 (Scenario A) | `ANONYMIZED` 후 | **✕ (PII 복원 불가)** | 백업 복원 (RPO 1일) — `SECURITY_POLICY.md:172-180`. 백업 복원 절차는 분기별 테스트(`SECURITY_POLICY.md:178-180`). |
| 잘못된 hard delete (Scenario C) | `(row gone)` | **✕** | 백업 복원 외 방법 없음. Scenario C 채택 시 RTO/RPO 사전 합의 필수. |

### §9.2 백업 복원 시 주의사항

- 백업 복원은 **테넌트 단위 부분 복원**을 기본으로 권장. 전체 DB 복원은 다른 테넌트 데이터 회귀 발생.
- 복원 후 `user_lifecycle_audit_log` 에 `EMERGENCY_RESTORE` (가칭) 이벤트 명시.

### §9.3 PortOne 결제 webhook 도착 시점 보호

- 사용자 anonymize 후 PortOne webhook 이 도착하면 user lookup 은 surrogate(`anon-<uuid>`) 로 성공 — 결제 상태 동기화는 정상 진행.
- 사용자 hard delete 후 webhook 도착 시 webhook 자체는 `Payment.payer_id` 만으로 처리되므로 영향 적음. 단 `FinancialTransaction` 생성 시 user join 이 필요한 경우 dead-letter 큐로 보관 후 어드민 수동 처리.

---

## §10. 결정 질문 (사용자 결재 필요 — 메인 어시스턴트 → 사용자 전달용)

> 본 합의서가 **잠정안** 인 이유는 아래 결정이 모두 사용자(서비스 오너 + 법무 자문) 결재가 필요하기 때문입니다. 결정 후 본 합의서 v1.1 로 업데이트 → 후속 PR 로 코드 반영(`core-coder` 위임).

### Q1. **SSOT 통일 채택 여부**
   현행 `is_active` / `is_deleted` 두 플래그 분기를 단일 `lifecycle_state` enum 컬럼으로 통합(§3.6)할지 결정.
   - (a) 채택 (권장) — 신규 컬럼 추가 + 단일 진입점 `UserLifecycleService` 신설.
   - (b) 미채택 — 기존 두 플래그 유지 + 사용 규약만 합의.
   - **권장: (a)**.

### Q2. **시나리오 채택 (자발/강제/자동 공통 기본)**
   `CLIENT_HARD_DELETE_IMPACT_ANALYSIS.md` §6.4 의 세 시나리오 중 어느 것을 default 로 채택할지.
   - (A) PII Anonymization (행 유지) — 권장 default
   - (B) Partial Hard Delete — 신규 테이블 별도 처리
   - (C) True Hard Delete — 비권장 (법규 위반)
   - **권장: (A)** + 일부 신규 테이블(자발 일지·카트 등) 만 (B) 부분 채택.

### Q3. **자발 탈퇴 유예기간**
   `WITHDRAWAL_PENDING` 상태 유지 기간.
   - (a) 없음 (즉시 anonymize)
   - (b) 14일
   - (c) 30일 — 한국 e-커머스 관행
   - (d) 60일
   - **권장: (c) 30일**.

### Q4. **다중 역할 사용자 처리**
   한 user 가 CLIENT+STAFF(CONSULTANT/ADMIN) 인 경우.
   - (a) 전체 탈퇴만 허용 (권장)
   - (b) role 별 분리 종료 (별도 컬럼 추가 필요)
   - (c) 어드민 수동 처리만 허용
   - **권장: (a)**. CONSULTANT 의 경우 활성 매핑 이관 가드(`AdminServiceImpl.checkConsultantDeletionStatus`) 기존 로직 재사용.

### Q5. **어드민 강제 종료의 7일 보존 (롤백 가능 여부)**
   어드민이 `deleteClient/deleteConsultant` 호출 시 즉시 anonymize 까지 가는지, 7일 보존 후 자동 진행하는지.
   - (a) 즉시 anonymize
   - (b) `INACTIVE_BY_ADMIN` 7일 → 자동 anonymize (어드민 롤백 가능)
   - **권장: (b)**.

### Q6. **재가입 cooldown**
   동일 이메일·전화 재가입 정책.
   - (a) 즉시 가능 (권장 default)
   - (b) 자발 탈퇴 30일 cooldown
   - (c) 어드민 강제 종료는 영구 차단 옵션
   - **권장: (a) + (c) 의 어드민 사유별 cooldown 옵션 부여**.

### Q7. **CONSULTANT `specialization`, `specialty` 컬럼 처리**
   상담사 종료 시 전문분야 컬럼을 TOMBSTONE 할지 KEEP 할지 (상담사 풀 통계 vs 식별 가능성).
   - (a) TOMBSTONE
   - (b) KEEP (통계 우선)
   - **권장: (b)** — 식별 위험 낮음, 통계 우선.

### Q8. **`mood_journal_*`, `self_assessment_sessions` 처리**
   자발 일지·자가평가는 본인의 자발 데이터.
   - (a) `ANONYMIZE` (사용자 통계만 보존)
   - (b) `HARD_DELETE` (본인 의지 우선) — 권장
   - **권장: (b)**.

### Q9. **`DORMANT` → `ANONYMIZED` 추가 경과 기간**
   1년 미접속으로 DORMANT 진입 후, 추가 몇 년 경과 시 ANONYMIZED 자동 전환할지.
   - (a) 1년 (총 2년)
   - (b) 2년 (총 3년)
   - (c) 4년 (총 5년) — 권장
   - 동반 결정: `dormant_user_pii_vault` 별도 테이블 vs 동일 `users` 테이블 별도 컬럼.
   - **권장: (c) + 별도 테이블**.

### Q10. **`consultation_records` 보존 기간**
   현행 코드 5년 (`PersonalDataDestructionService.destroyExpiredConsultationData:154`) 을 의료법 §22 의 10년으로 변경할지.
   - (a) 5년 유지 (현행)
   - (b) 10년으로 변경 — 권장
   - (c) 분류별 차등 (임상 = 10년, 일반 면담 = 5년)
   - **권장: (b)**. 법무 자문 필수.

### Q11. **자유 입력 컬럼 본문 PII 스크러빙**
   `consultation_records.client_condition/main_issues/...`, `financial_transactions.description/remarks` 등 자유 입력 본문에 PII 가 섞여 있을 가능성.
   - (a) 스크러빙 미적용 (보존 우선)
   - (b) 정규식 기반 자동 스크러빙(전화·이메일·주민번호 패턴) — 권장
   - (c) 인공지능 기반 스크러빙 (인력·비용 부담)
   - **권장: (b) 후 (c) 단계적 도입**.

### Q12. **`community_*` 게시판 본인 글 anonymize vs hard delete**
   본인 글 hard delete 시 다른 사용자의 댓글 트리 맥락이 깨짐.
   - (a) author 만 `이용종료-<uuid>` 로 표기, 본문 보존 — 권장
   - (b) 본문도 "[삭제된 게시글]" 로 치환
   - (c) 댓글 포함 전체 hard delete
   - **권장: (a) + 본인 옵션 (b)**.

---

## §11. 후속 단계 위임 순서 (메인 어시스턴트 → core-planner / core-coder)

1. **메인 어시스턴트 → 사용자**: §10 결정 질문 12개 답변 수령.
2. **메인 → core-debugger**: 운영 DB FK 실측 (§4.2 placeholder 채우기). 본 합의서 v1.1 로 갱신.
3. **메인 → core-planner**: §10 결정 + §4 실측 반영 후 본 합의서 v1.1 확정. `lifecycle_state` 단일 컬럼 마이그레이션 + `user_lifecycle_audit_log` 신설 plan 작성.
4. **메인 → core-planner**: 시나리오 A 기반 자발 탈퇴 구현 Phase 분배표 작성 (SELF_WITHDRAWAL_PROCESS_AUDIT.md §6.1 위임문 갱신).
5. **core-planner → core-coder**: `UserLifecycleService` 단일 진입점 + 자발 탈퇴 API + 어드민 강제 anonymize 흐름 + DORMANT/ANONYMIZE cron 실 코드화.
6. **core-planner → core-tester**: 단위 5건 + 통합 3건 + E2E (탈퇴→유예→취소·만료, 어드민 강제→롤백, DORMANT 진입→복원, ANONYMIZE 후 재가입) + 회기·재무 정합성 회귀.
7. **core-planner → generalPurpose (`/core-solution-documentation`)**: 본 합의서 v1.1 → 처리방침(`docs/archive/legacy-docs-backup-2025-10-14/PRIVACY_POLICY_2024.md` 후속) 갱신.

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
- 본 합의서는 **잠정안** — §10 결정 후 v1.1 로 정착.
