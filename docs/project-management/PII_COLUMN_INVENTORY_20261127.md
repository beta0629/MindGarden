> 저장소 사본 (bot handoff 2026-11-27). 비밀·키 값 없음.

# Clinic-OS 전체 PII 컬럼 목록

**근거**: `SUMMARY-encryption-all.md` (15 PASS / 48 FAIL / 확인필요 3 / 고정 IV 12행)  
**기준 SHA**: `9fef542d` (release/dev)  
**판정**: 평문 / 고정IV(CBC v1) / GCM(v2) / 해시(SHA·무솔트) / PASS기타  
**PR 차수**: 1=본PR(SCT+공통) · 2=돈 · 3=노출 · 4=상담·사용자 · 5=고정IV·HMAC전역 · 6=FE

---

## PASS (참고)

| 위치 | 형태 | 차수 |
|---|---|---|
| consultation_records 서술 19컬럼, drafts.payload_json | GCM v2 | 1에서 컨버터만 공통화 |
| sct_response_answers.answer_text_enc, sct_domain_memos.memo_text_enc | GCM v2 | 1 (CBC면 러너) |
| dormant_user_pii_vault.encrypted_pii | 별도 GCM | 유지(키 분리) |
| consultation_audio_files, psych PDF 파일 | 파일 GCM | 유지 |
| IndexedDB consultation_log_backup | WebCrypto GCM | 6 유지 |
| notification_batch_send_log.recipient_phone_masked | 마스킹 | — |
| shop_client_orders | PII 없음 | — |

## 1차 — SCT (+ 공통 모듈이 덮는 기존 @Convert 쓰기 경로)

| 테이블.컬럼 | 러너 전 | 1차 후 | 비고 |
|---|---|---|---|
| sct_invitations.recipient_name | 평문 FAIL | GCM + @Convert | |
| sct_invitations.target_phone/email | CBC | GCM | hash→HMAC 블라인드 |
| sct_invitations.target_*_hash | SHA | HMAC | |
| sct_invitations.token_hash | SHA | 신규 HMAC+dual | 재계산 불가 |
| sct_consents.guardian_relation | 평문 FAIL | GCM | |
| sct_consents.guardian/signer/child *_enc | CBC | GCM | |
| sct_invitations.respondent_meta_json | 미사용 | DROP | |
| (전 엔티티 기존 @Convert) | CBC/GCM 혼재 | 쓰기=GCM 공통 컨버터 | 데이터 재암호는 SCT만 |

## 2차 — 돈

| 테이블.컬럼 | 판정 |
|---|---|
| payments.external_response, webhook_data | 평문 JSON FAIL |
| payments.virtual_account_number, failure_reason | 평문 FAIL |
| ops_payment_method.payment_method_token, cardholder_name | 평문 FAIL |
| accounts.account_number, account_holder | 평문 FAIL |
| recurring_expenses.supplier_*, account_number | 평문 FAIL |
| consultant_salary_profiles.business_registration_number, business_name | 평문 FAIL |
| discount/academy refund_reason, receipt_number | 평문 FAIL |
| erp_purchase_orders.supplierContact | 평문 FAIL |
| system_configs (EncryptionUtil ECB 하드코딩 키) | FAIL 심각 |
| tenant_pg_configurations.*_encrypted | 확인필요 |

## 3차 — 노출

| 위치 | 판정 |
|---|---|
| Redis spring:session User 직렬화 | 평문 FAIL |
| 앱 로그 PII 151건 | 평문 FAIL |
| OnboardingApproval INSERT / V20251222·23 / V57 | 평문 우회 FAIL |
| users.rrn_encrypted 수동 암호 | CBC·컨버터 없음 |
| @Cacheable userPersonalData | 확인필요 → JVM 유지 가드 |

## 4차 — 상담·사용자 PII

| 영역 | 주요 평문·미비 |
|---|---|
| clients | birth_date, gender, address*, vehicle_plate, clinical TEXT, … |
| users | birth_date, address*, memo, notes, social ids, … |
| user_addresses, user_social_accounts | 전부 평문 |
| consultants.vehicle_plate, branches, partner_institutions | 평문 |
| consultations, notes, schedules.notes, audio_transcriptions | 평문 |
| clinical_reports, mood, messages, self_assessment, psych JSON | 평문 |
| consultation_records.incompletion_reason | 평문 (19서술 외) |
| password_reset_tokens | 평문 레거시 |
| notifications, manual_notification_*, 접근·감사 로그 | 평문 |

## 5차 — 고정 IV 12행 + 전역 해시

SUMMARY §3 목록 전부 CBC→GCM; PhoneHashUtils/SctTokenHasher/감사·파기 SHA → HMAC.

## 6차 — FE

mg.sctPublicDraft(1차에서 답변 제거), mood/self-assessment, userInfo/tokens, sessionStorage; frontend-ops·expo-app 포함; 토큰 httpOnly/메모리.

---

## 레거시 평문·CBC COUNT (읽기 전용, 값 출력 금지)

마커: `^[A-Za-z0-9_.-]{1,32}(:v2)?::[A-Za-z0-9+/=]+$`  
v2: `:v2::` 포함 · v1 CBC: `::` 있으나 `:v2::` 없음 · 평문: 마커 불일치

```sql
SELECT COUNT(*) AS plaintext_recipient_name FROM sct_invitations
WHERE recipient_name IS NOT NULL AND TRIM(recipient_name) <> ''
  AND recipient_name NOT REGEXP '^[A-Za-z0-9_.-]{1,32}(:v2)?::[A-Za-z0-9+/=]+$';

SELECT COUNT(*) AS cbc_recipient_name FROM sct_invitations
WHERE recipient_name REGEXP '^[A-Za-z0-9_.-]{1,32}::[A-Za-z0-9+/=]+$'
  AND recipient_name NOT LIKE '%:v2::%';

SELECT COUNT(*) AS plaintext_guardian_relation FROM sct_consents
WHERE guardian_relation IS NOT NULL AND TRIM(guardian_relation) <> ''
  AND guardian_relation NOT REGEXP '^[A-Za-z0-9_.-]{1,32}(:v2)?::[A-Za-z0-9+/=]+$';

SELECT COUNT(*) AS cbc_guardian_name FROM sct_consents
WHERE guardian_name_enc REGEXP '^[A-Za-z0-9_.-]{1,32}::[A-Za-z0-9+/=]+$'
  AND guardian_name_enc NOT LIKE '%:v2::%';

SELECT COUNT(*) AS cbc_target_phone FROM sct_invitations
WHERE target_phone REGEXP '^[A-Za-z0-9_.-]{1,32}::[A-Za-z0-9+/=]+$'
  AND target_phone NOT LIKE '%:v2::%';

SELECT COUNT(*) AS cbc_target_email FROM sct_invitations
WHERE target_email REGEXP '^[A-Za-z0-9_.-]{1,32}::[A-Za-z0-9+/=]+$'
  AND target_email NOT LIKE '%:v2::%';

SELECT COUNT(*) AS cbc_signer_name FROM sct_consents
WHERE signer_name_enc REGEXP '^[A-Za-z0-9_.-]{1,32}::[A-Za-z0-9+/=]+$'
  AND signer_name_enc NOT LIKE '%:v2::%';

SELECT COUNT(*) AS cbc_child_name FROM sct_consents
WHERE child_name_confirm_enc REGEXP '^[A-Za-z0-9_.-]{1,32}::[A-Za-z0-9+/=]+$'
  AND child_name_confirm_enc NOT LIKE '%:v2::%';
```
