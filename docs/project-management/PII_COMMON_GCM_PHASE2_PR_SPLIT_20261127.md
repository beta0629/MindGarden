> 저장소 사본 (bot handoff 2026-11-27). 비밀·키 값 없음.

# PII 공통 GCM — PR 분할안 (리더 승인 기준)

**근거**: `/cursor/stores/bot/handoff/sct-ui-gate-1127/SUMMARY-encryption-all.md`  
**집계**: 15 PASS / 48 FAIL / 확인필요 3 / 고정 IV 약함 12행(컬럼·경로 22건)  
**1차 범위 고정**: 공통 모듈 API + SCT 적용만. 2~6차 코드는 손대지 않음.

---

## 1차 (본 PR) — 공통 모듈 + SCT

| 항목 | 내용 |
|---|---|
| 공통 API | `PiiCryptoService`(GCM 쓰기·CBC/평문 읽기), `PiiAttributeConverter`, `PiiHmacService`(블라인드 인덱스), `PiiLegacyUpgradeRunner` 틀(멱등·키 없으면 no-op) |
| SCT | recipient_name·guardian_relation @Convert, 스키마, CBC→GCM·평문→GCM·phone/email_hash→HMAC 러너, localStorage 답변 제거, SMS 평문 로그 제거, fail-closed, @Convert 가드 |
| 재사용 | 2~6차가 동일 API만 호출. 도메인 전용 암·복호화 분기 금지 |
| 검색 | 동등 검색 깨지는 컬럼은 HMAC 블라인드 인덱스로 대체 — PR 본문에 명시 (SCT: target_phone_hash / target_email_hash) |

---

## 2차 — 돈

- `payments.external_response`, `webhook_data`, `virtual_account_number` (+ failure_reason 검토)
- `ops_payment_method.payment_method_token`, `cardholder_name`
- `accounts.account_number` / `account_holder`
- `recurring_expenses` 계좌·거래처 연락
- `consultant_salary_profiles.business_registration_number` (+ business_name)
- `EncryptionUtil` ECB+하드코딩 키 → 공통 GCM + 외부 키 주입 후 재암호화; 유틸 삭제
- `tenant_pg_configurations` api/secret 암호화 경로 확인·공통 모듈 정렬
- (관련) discount/academy refund_reason·receipt_number, erp_purchase_orders.supplierContact

**위험**: 높음(결제·계좌). 키 로테이션·재암호화 트랜잭션 필수.

---

## 3차 — 노출

- Redis Spring Session: `User` 엔티티 제거 → 최소 식별자만
- PII 앱 로그 151건 → 공통 마스킹 + 로그 가드(CI)
- OnboardingApproval JDBC INSERT / `V20251222`·`V20251223`·`V57` 프로시저 평문 우회 → 공통 컨버터·암호화 경로
- `users.rrn_encrypted` 수동 암호화 → `@Convert(PiiAttributeConverter)`
- `@Cacheable("userPersonalData")` — JVM 메모리 유지 가드(Redis CacheManager 전환 금지 가드)

**위험**: 중~높음(세션·온보딩·로그인).

---

## 4차 — 상담·사용자 PII (크면 도메인 분할)

- clients 평문 컬럼(birth_date, gender, address*, vehicle_plate, clinical TEXT…)
- consultations / notes / schedules.notes / audio_transcriptions / clinical_reports / mood / messages / self_assessment / psych JSON
- users 잔여 평문, user_addresses, user_social_accounts, consultants.vehicle_plate
- password_reset_tokens 레거시 제거(Opaque Redis 일원화)
- notifications / manual_notification_jobs / 접근·감사 로그 평문
- partner_institutions, branches (조직 연락처)

하위 분할 예: 4a clients·users·addresses / 4b 상담·심리 / 4c 알림·감사·소셜.

**위험**: 높음(데이터량·조회 경로).

---

## 5차 — 고정 IV 일괄 GCM + 전역 HMAC

- SUMMARY §3의 고정 IV 12행(22 컬럼/경로) CBC→GCM 재암호화 (멱등 러너)
- 이름·이메일·전화 등 검색 컬럼: HMAC 블라인드 인덱스 병행 후 GCM
- 모든 검색/감사 해시 SHA-256 → HMAC 통일, dual-verify 제거

**위험**: 높음(전역 재암호화·lookup).

---

## 6차 — FE 저장소

- `frontend` / `frontend-ops` / `expo-app` 세 곳
- localStorage·sessionStorage 민감값 정리
- 토큰 → httpOnly 쿠키 또는 메모리
- mood/self-assessment 등 평문 키 제거(서버 API)

**위험**: 중(클라이언트 호환·로그인 UX).

---

## 공통 모듈 API 계약 (1차가 고정, 이후 재사용)

```
PiiCryptoService.encrypt(plain) -> v2 GCM          // fail-closed
PiiCryptoService.decrypt(any)   -> plain           // v2|v1|plain
PiiCryptoService.isV2 / isLegacyCipher
PiiAttributeConverter                              // JPA SSOT
PiiHmacService.hmacHex(normalized)                 // blind index
PiiHmacService.matches(raw, stored)                // dual-verify during transition
PiiLegacyUpgradeRunner / template                  // idempotent; skip if keys missing
```

검색·정렬이 깨지는 컬럼: **본문 GCM + HMAC 블라인드 인덱스 컬럼**. LIKE/정렬은 지원하지 않음(표준 유지).
