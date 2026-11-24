# Clinic-OS(MindGarden) SCT(문장완성검사) 온라인 질문지 — BE 설계안

> **문서 성격**: 설계안만. 코드 변경·브랜치 push·PR·운영/.dev DB 접근·데이터 생성 없음.  
> **원본 문항**: `uploads/mindgarden_sct_v3_110b.md` (성인·청소년·아동 각 50문항, 영역·방향·시점 메타, 문구 그대로 시드).  
> **조사 기준 브랜치**: `release/dev` (로컬 체크아웃).  
> **작성일**: 2026-11-23.

---

## 0. 12줄 요약

1. SCT는 **신규 도메인·신규 API**로 두고, 결제·일정·상담일지 기존 API는 변경하지 않는다.
2. 공개 응답은 **로그인 게이트 없음**: 일회성 opaque 토큰 링크로만 진입하며, DB에는 **토큰 SHA-256 해시만** 저장한다(`PasswordResetOpaqueTokenStore` 패턴).
3. 진입·임시저장·제출 전 **발송 대상 휴대폰/이메일 일치 확인** + 시도 횟수 제한을 강제한다.
4. 응답·임시본 본문은 상담일지와 동일하게 `ConsultationBodyAttributeConverter` → `PersonalDataEncryptionUtil.encryptWithRandomIv`(AES-GCM v2)로 **서버 DB 암호화**한다(로컬 전용 저장 금지).
5. 발송 건은 `tenant_id` + (nullable) `client_id`/`mapping_id` + 대상 연락처 + 양식·만료·상태를 가지며, 토큰 검증 성공 시 해당 행의 `tenant_id`로 `TenantContext`를 강제 세팅한다.
6. `client_id`·`mapping_id`는 **발송 시점에 배정이 있으면 채우고, 미등록 번호면 NULL** — 이후 관리자 확인 연결 API로만 채운다(번호·이메일 자동 매칭 금지).
7. 기능 ON은 `system_config` 테넌트 키 `feature.sct.enabled`(기본 false) + 필요 시 `common_codes` 그룹 `SCT_FORM`으로 양식 메타를 관리하며, **마인드가든 테넌트만 우선 시드 ON**.
8. 문자는 `SmsAuthService.sendNotificationMessage` 재사용, `.dev`는 `SMS_TEST_MODE`/`sms.auth.test-mode=true`로 **실내담자 문자 금지**.
9. 발송 권한: `ADMIN`·`STAFF`·담당 `CONSULTANT` / 열람: `ADMIN`·담당 `CONSULTANT`(사무원 열람은 미결) / 감사용 `AuditAction` 신규 코드 + 선택적 열람 로그.
10. 상담 중 보기 API는 **내담자(+선택 회기/매핑) 기준 최신 `SUBMITTED` 응답**을 복호화해 반환한다.
11. 상태: `SENT` → `DRAFT` → `SUBMITTED` | `EXPIRED` | `CANCELLED` (제출 후 재수정 불가, 만료 시 임시본 접근 불가).
12. Flyway로 테이블·시드(150문항)·플래그·공개 경로 정책 반영 계획을 세우고, 기존 일지/결제/스케줄 스키마는 건드리지 않는다.

---

## 1. 목표·범위·비범위

### 1.1 목표
- 상담 전/중 참고용 **마인드가든 SCT v3**를 문자 링크로 받아 Clinic-OS 화면에서 작성·임시저장·제출.
- 관리자·담당 상담사가 내담자 상세·상담 중 화면에서 응답을 열람.
- 로그인 내담자에게도 **동일 공개 링크**가 열림(세션 유무와 무관, 토큰·연락처 검증만).

### 1.2 범위 (1차)
- BE: 데이터 모델, 공개/관리 API, SMS 발송 연동, 암호화, 테넌트 격리, 권한, 감사, 마이그레이션·테스트 계획.
- 테넌트: **마인드가든만 우선** (플래그로 ON). 하드코딩 테넌트 UUID/슬러그 분기 금지.

### 1.3 비범위 / 금지
- 기존 결제·일정·상담일지 API 시그니처·스키마 변경 설계 금지.
- 운영/.dev DB 접근·데이터 생성 금지.
- 본 문서 단계의 코드 구현·브랜치·PR 금지.
- 번호·이메일로 내담자 **자동 연결** 금지(동명이인·가족 번호 위험).

---

## 2. 재사용 기존 모듈 목록 (실제 경로)

| 영역 | 재사용 대상 | 경로 / 식별자 |
|------|-------------|---------------|
| SMS 발송 | `SmsAuthService.sendNotificationMessage` | `src/main/java/com/coresolution/consultation/service/SmsAuthService.java` |
| SMS Provider | `SolapiSmsProvider` | `.../service/sms/impl/SolapiSmsProvider.java` |
| SMS 설정 | `SmsProperties` (`sms.auth.*`, **`sms.auth.test-mode` ← `SMS_TEST_MODE`**) | `.../config/SmsProperties.java`, `application.yml` / `application-dev.yml` |
| 테넌트 SMS on/off | `TenantSmsSettings` / `TenantSmsSettingsService` | 테이블 `tenant_sms_settings` |
| SMS 자동발송 게이트(참고) | `SmsDispatchFlagKeys`, `SmsTemplateServiceImpl` | `notification.sms.auto-dispatch.enabled` — SCT 수동 발송은 OTP/수동과 같이 **별도 게이트**로 설계(아래 §7) |
| 본문 암호화 | `ConsultationBodyAttributeConverter` | `.../converter/ConsultationBodyAttributeConverter.java` |
| 암호 유틸/키 | `PersonalDataEncryptionUtil`, `PersonalDataEncryptionKeyProvider` | `encryption.personal-data.*` / `PERSONAL_DATA_ENCRYPTION_*` |
| 일지 본문·초안 참고 | `ConsultationRecord`, `ConsultationRecordDraft` | 테이블 `consultation_records`, `consultation_record_drafts` |
| 전화/이메일 컬럼 암호 | `PhoneAttributeConverter`, `EmailAttributeConverter` | 내담자·발송 대상 저장 시 동일 패턴 |
| 테넌트 컨텍스트 | `TenantContext`, `TenantContextHolder`, `TenantContextFilter` | `.../core/context/*`, `.../core/filter/TenantContextFilter.java` |
| 테넌트 엔티티 베이스 | `AuditableTenantBase` | `tenant_id` 컬럼 |
| 멀티테넌트 룰 | Repository는 `findByTenantId...`만 | `.cursor/skills/core-solution-multi-tenant/SKILL.md` |
| 기능 플래그 | `SystemConfig` + `SystemConfigService.getBooleanForTenant` | 테이블 `system_config`, UK `(tenant_id, config_key)` |
| 공통코드 | `CommonCode` / `CommonCodeService` / `TenantCommonCodeService` | 테이블 `common_codes` |
| 컴포넌트 활성화(대안) | `TenantComponent` + `TenantComponentActivationService` + `PlatformComponentCodes` | 테이블 `tenant_components` — 1차는 `system_config` 권장, 확장 시 `CLINIC_SCT` 코드 추가 |
| 내담자 | `Client` / `ClientRepository` / `ClientService` | 테이블 `clients` (`id`=`users.id`) |
| 배정(매핑) | `ConsultantClientMapping` / `ConsultantClientMappingRepository` | 테이블 `consultant_client_mappings`, PK=`mappingId` |
| 역할 | `UserRole` | `ADMIN`, `STAFF`, `CONSULTANT`, `CLIENT` |
| 권한 유틸 | `PermissionCheckUtils`, `AdminRoleUtils`, `@PreAuthorize` | 예: `hasAnyRole('ADMIN','STAFF','CONSULTANT')` |
| 감사 로그 | `AuditLog` / `AuditLogService` / `AuditAction` | 테이블 `audit_logs` |
| 열람 감사(참고) | `ConsultationRecordAccessLog` | 테이블 `consultation_record_access_logs` — SCT 전용 형제 테이블 권장 |
| opaque 토큰 해시 | `PasswordResetOpaqueTokenStore` | Redis/메모리에 SHA-256(token) — SCT는 **DB 해시 컬럼**으로 동일 원칙 적용 |
| 공개 API 정책 | `PublicApiPathPolicy` | `src/main/java/com/coresolution/core/constant/PublicApiPathPolicy.java` + `SecurityConfig` permitAll 정합 |
| Flyway | `src/main/resources/db/migration/` | 네이밍 `V{yyyyMMdd}_{seq}__snake_case.sql` |

---

## 3. 기능 플래그·테넌트 범위

### 3.1 권장 SSOT (하드코딩 금지)
1. **테넌트 기능 플래그** (1차 필수)  
   - 테이블: `system_config`  
   - 키 상수(신규): `SctFeatureFlagKeys.FEATURE_SCT_ENABLED = "feature.sct.enabled"`  
   - 조회: `SystemConfigService.getBooleanForTenant(tenantId, key, false)` — **기본 false(fail-closed)**  
   - 마인드가든 테넌트만 Flyway/시드 스크립트로 `true` (테넌트 ID는 시드 시 `tenants` 조회·환경별 값, **코드에 UUID 리터럴 금지**).

2. **공통코드** (양식·상태 라벨·SMS 템플릿 코드)  
   - 그룹 예: `SCT_FORM_TYPE` (`ADULT`/`ADOLESCENT`/`CHILD`), `SCT_INVITE_STATUS`, `SCT_SMS_TEMPLATE`  
   - 테넌트 행 우선 → 코어 폴백 (`getCodesByGroupWithFallback`).

3. **확장(선택)**  
   - `PlatformComponentCodes`에 `CLINIC_SCT` 추가 후 `tenant_components` 활성화.  
   - 1차 구현은 `system_config`만으로도 충분. 이중 게이트가 필요하면 “플래그 AND 컴포넌트”로 확장.

### 3.2 게이트 적용 지점
- 관리 발송·목록·연결 API: 테넌트 플래그 OFF면 403/404.  
- 공개 링크 API: 토큰으로 초대 행을 찾은 뒤 **그 행의 tenant_id 플래그**를 재확인(비활성 테넌트 초대 잔존 방지).

---

## 4. 데이터 모델

### 4.1 ER 개요
```
sct_form_templates 1──* sct_form_items
        ▲
        │ form_template_id
sct_invitations (발송 건) 1──1..* sct_response_answers (문항별 응답/임시)
        │
        ├── optional clients.id (client_id)
        └── optional consultant_client_mappings.id (mapping_id)
sct_invite_access_attempts (검증 시도)
sct_consents (민감정보·보호자 동의)
sct_access_logs (열람 감사, append-only)
```

### 4.2 `sct_form_templates` — 질문지 템플릿(버전)

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| `id` | BIGINT PK | N | |
| `tenant_id` | VARCHAR(36) | Y | NULL/empty = **코어(전역) 시드**. 테넌트 커스텀 시 테넌트 ID |
| `form_type` | VARCHAR(20) | N | `ADULT` / `ADOLESCENT` / `CHILD` |
| `version` | VARCHAR(20) | N | 예: `v3` |
| `title` | VARCHAR(200) | N | 표시 제목 |
| `instruction_text` | TEXT | N | 실시 안내(원문) |
| `target_desc` | VARCHAR(200) | Y | 대상 설명 |
| `is_active` | BOOLEAN | N | 기본 true |
| `created_at` / `updated_at` | DATETIME | N | |
| `is_deleted` | BOOLEAN | N | soft delete |

**인덱스/UK**
- UK `uk_sct_form_tenant_type_ver` (`tenant_id`, `form_type`, `version`) — MySQL에서 NULL UK 동작을 피하려면 코어는 `tenant_id=''` 고정.
- IDX `idx_sct_form_active` (`form_type`, `is_active`).

### 4.3 `sct_form_items` — 문항(버전 종속)

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| `id` | BIGINT PK | N | |
| `form_template_id` | BIGINT FK | N | |
| `item_no` | INT | N | 1~50 |
| `prompt_text` | VARCHAR(1000) | N | **원문 그대로** |
| `domain_code` | VARCHAR(64) | N | 영역 코드(시드 표) |
| `domain_label` | VARCHAR(100) | N | 영역 표시명 |
| `valence` | VARCHAR(16) | Y | `POSITIVE`/`NEUTRAL`/`NEGATIVE` |
| `tense` | VARCHAR(16) | Y | `PAST`/`PRESENT`/`FUTURE` |
| `allows_not_applicable` | BOOLEAN | N | □ 해당 없음 여부 |
| `sort_order` | INT | N | = item_no |
| `created_at` | DATETIME | N | |

**UK** (`form_template_id`, `item_no`).

시드: 성인 11영역·청소년 10영역·아동 8영역 번호표를 메타로 넣고, `prompt_text`는 업로드 문서 문구 그대로(해당 없음 표기 포함).

### 4.4 `sct_invitations` — 발송 건(링크·상태)

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| `id` | BIGINT PK | N | |
| `tenant_id` | VARCHAR(36) | N | **필수** |
| `form_template_id` | BIGINT FK | N | |
| `client_id` | BIGINT | **Y** | `clients.id`/`users.id`. 배정·등록 내담자면 발송 시 set |
| `mapping_id` | BIGINT | **Y** | `consultant_client_mappings.id`. 담당 배정 있으면 set |
| `consultant_id` | BIGINT | Y | 발송 시점 담당 상담사(스냅샷). 연결 전 NULL 가능 |
| `target_phone` | VARCHAR(512) | Y | `PhoneAttributeConverter` 암호문. 최소 1개 연락처 필요 |
| `target_email` | VARCHAR(512) | Y | `EmailAttributeConverter` 암호문 |
| `target_phone_hash` | CHAR(64) | Y | 정규화 번호 SHA-256(조회·일치검증용, 평문 비저장) |
| `target_email_hash` | CHAR(64) | Y | 정규화 이메일 SHA-256 |
| `token_hash` | CHAR(64) | N | opaque 토큰 SHA-256. **평문 토큰 DB 금지** |
| `token_expires_at` | DATETIME | N | |
| `status` | VARCHAR(20) | N | `SENT`/`DRAFT`/`SUBMITTED`/`EXPIRED`/`CANCELLED` |
| `sent_at` | DATETIME | Y | |
| `draft_saved_at` | DATETIME | Y | |
| `submitted_at` | DATETIME | Y | |
| `cancelled_at` | DATETIME | Y | |
| `sent_by_user_id` | BIGINT | N | 발송자 |
| `sms_dispatch_result` | VARCHAR(40) | Y | `SENT`/`TEST_MODE_SKIP`/`FAILED` 등 |
| `link_opened_at` | DATETIME | Y | 최초 성공 진입 |
| `verify_fail_count` | INT | N | 연락처 불일치 누적(기본 0) |
| `verify_locked_until` | DATETIME | Y | 잠금 |
| `respondent_meta_json` | TEXT | Y | 나이·학교 등 비민감 메타(필요 시 암호) |
| `created_at`/`updated_at`/`is_deleted`/`version` | | N | `AuditableTenantBase` 정합 |

**인덱스**
- UK `uk_sct_inv_token_hash` (`token_hash`)
- IDX `idx_sct_inv_tenant_status` (`tenant_id`, `status`, `created_at`)
- IDX `idx_sct_inv_tenant_client` (`tenant_id`, `client_id`, `submitted_at`)
- IDX `idx_sct_inv_tenant_mapping` (`tenant_id`, `mapping_id`)
- IDX `idx_sct_inv_phone_hash` (`tenant_id`, `target_phone_hash`) — **후보 제시 검색용**(자동 연결 아님)

#### `client_id` / `mapping_id` nullable 근거
| 상황 | client_id | mapping_id | 근거 |
|------|-----------|------------|------|
| 등록·배정된 내담자에게 발송 | NOT NULL | NOT NULL(권장) | 내담자 상세·상담 중 화면 즉시 표시. `ConsultantClientMapping` ACTIVE 등 유효 매핑 |
| 등록만 되고 배정 없음 | NOT NULL | NULL | 내담자 상세에는 보이되 담당 스코프는 관리자 |
| **미등록 번호/이메일 발송** | **NULL** | **NULL** | 아직 `clients` 행 없음. 이후 §9 연결 API로만 채움 |
| 연결 해제 | NULL로 되돌림 | NULL | 감사 로그. 응답 본문은 invitation에 잔존 |

`mapping_id`만 있고 `client_id` 없음은 **허용하지 않음**(매핑은 항상 client를 가짐). 발송 시 매핑을 고르면 둘 다 set.

### 4.5 `sct_response_answers` — 문항별 응답(임시·제출 공용)

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| `id` | BIGINT PK | N | |
| `tenant_id` | VARCHAR(36) | N | invitation과 동일 강제 |
| `invitation_id` | BIGINT FK | N | |
| `form_item_id` | BIGINT FK | N | |
| `answer_text_enc` | TEXT | Y | **암호화 본문** (`ConsultationBodyAttributeConverter` 동일) |
| `not_applicable` | BOOLEAN | N | 해당 없음 |
| `is_blank` | BOOLEAN | N | 빈 응답 |
| `updated_at` | DATETIME | N | |

**UK** (`invitation_id`, `form_item_id`).  
제출 잠금은 invitation.status로 제어(행 삭제 없이 upsert 금지 전이).

대안(일지 초안형): invitation에 `draft_payload_json` LONGTEXT 암호 컬럼 단일 저장.  
**권장**: 문항별 테이블 — 상담 중 영역별 조회·부분 저장·감사에 유리. 대량 쓰기는 배치 upsert.

### 4.6 `sct_consents` — 동의

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| `id` | BIGINT PK | N | |
| `tenant_id` | VARCHAR(36) | N | |
| `invitation_id` | BIGINT FK | N | |
| `consent_type` | VARCHAR(40) | N | `SENSITIVE_INFO` / `GUARDIAN_UNDER_14` |
| `agreed` | BOOLEAN | N | |
| `guardian_name_enc` | VARCHAR(512) | Y | 보호자명(암호) |
| `guardian_relation` | VARCHAR(40) | Y | |
| `agreed_at` | DATETIME | N | |
| `ip_hash` | CHAR(64) | N | IP SHA-256 (일지 열람 로그와 동일 원칙) |
| `user_agent_hash` | CHAR(64) | Y | |

민감정보 동의 없이 제출 API는 거절. 아동·만 14세 미만(응답자 메타/보호자 체크)이면 `GUARDIAN_UNDER_14` 필수.

### 4.7 `sct_invite_access_attempts` — 연락처 검증 시도

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| `id` | BIGINT PK | N | |
| `tenant_id` | VARCHAR(36) | N | |
| `invitation_id` | BIGINT | N | |
| `success` | BOOLEAN | N | |
| `ip_hash` | CHAR(64) | N | |
| `created_at` | DATETIME | N | |

초대 행의 `verify_fail_count`와 병행. 임계(권장 5회/15분) 초과 시 `verify_locked_until`.

### 4.8 `sct_access_logs` — 관리자/상담사 열람 감사

`consultation_record_access_logs` 형제를 SCT용으로 분리(본문 원문·IP 평문 금지, 해시만).

| 컬럼 | 설명 |
|------|------|
| `tenant_id`, `invitation_id`, `client_id`, `actor_id`, `actor_role` | |
| `action` | `VIEW_LIST` / `VIEW_BODY` / `EXPORT` / `SESSION_VIEW` |
| `accessed_at`, `ip_hash`, `user_agent_hash` | |

동시에 `audit_logs`에 상태 변경·연결·발송 이벤트 기록.

### 4.9 신규 `AuditAction` 코드 (설계)
`AuditAction` enum 확장(구현 시):
- `SCT_INVITE_SENT`
- `SCT_INVITE_CANCELLED`
- `SCT_RESPONSE_SUBMITTED`
- `SCT_CLIENT_LINKED`
- `SCT_CLIENT_UNLINKED`
- `SCT_RESPONSE_VIEWED` (선택: 상세는 `sct_access_logs`)

metadata: invitationId, formType, masked phone/email, clientId, mappingId. **응답 본문·토큰 평문 금지**.

---

## 5. 상태 전이

### 5.1 상태값
| 상태 | 의미 |
|------|------|
| `SENT` | 발송·링크 유효, 아직 임시저장 없음(또는 진입만) |
| `DRAFT` | 서버에 임시 응답 존재, 미제출 |
| `SUBMITTED` | 제출 완료, **재수정 불가** |
| `EXPIRED` | `token_expires_at` 경과 또는 배치 만료. 임시본 접근 불가 |
| `CANCELLED` | 관리자/발송자 취소. 링크 무효 |

### 5.2 전이표

| From \ To | SENT | DRAFT | SUBMITTED | EXPIRED | CANCELLED |
|-----------|------|-------|-----------|---------|-----------|
| (신규) | 발송 성공 시 | — | — | — | — |
| SENT | — | 임시저장 | 동의 후 제출 | 만료 job/진입 | 취소 |
| DRAFT | — | 임시저장(갱신) | 제출 | 만료 | 취소 |
| SUBMITTED | — | **불가** | — | (보관 정책만) | **불가**(감사상 유지) |
| EXPIRED | 재발송=**신규 invitation** | — | — | — | — |
| CANCELLED | 재발송=신규 | — | — | — | — |

규칙:
- 제출 후 동일 토큰으로 PATCH/임시저장 → 409.
- 만료·취소 후 GET 응답/임시본 → 410.
- 만료는 lazy(요청 시) + 스케줄러 병행 가능.

---

## 6. 링크·토큰·보안

### 6.1 토큰
- 생성: CSPRNG 32바이트 이상 → URL-safe Base64 (또는 hex 64자).
- 저장: `SHA-256(token)` only (`PasswordResetOpaqueTokenStore`와 동일 원칙, 저장소는 DB).
- 링크 예: `https://{tenant-host}/public/sct/{token}` (FE) → API는 토큰으로 조회.
- 일회성 “제출” 관점: 토큰 자체는 만료 전까지 재진입 가능(임시저장 이어쓰기). **제출 후** 토큰은 읽기 전용 감사/완료 페이지만 허용할지 여부 → 권장: 제출 후 응답자 화면은 “제출 완료”만, 본문 재조회 최소화.

### 6.2 진입 흐름 (공개)
1. 토큰 해시로 invitation 조회 (테넌트 미지 → **토큰만으로 행 조회** 후 `TenantContextHolder.setTenantId(row.tenantId)`).
2. 플래그·상태·만료·잠금 검사.
3. 클라이언트가 입력한 휴대폰 또는 이메일을 정규화·해시하여 `target_*_hash`와 비교(발송 시 등록된 채널만).
4. 성공 시 단기 **verify session**(서버 사이드: Redis 또는 DB 일회 세션 토큰, TTL 예 30분) 발급 → 이후 임시저장/제출에 첨부.  
   - 매 요청마다 연락처 재입력도 가능하나 UX상 verify session 권장.
5. 실패 시 attempt 기록·카운트·잠금.

### 6.3 테넌트 격리
- Hibernate `@Filter` 없음 → **모든 Repository 메서드에 `tenantId` 필수**.
- 공개 API에서 `X-Tenant-Id` 신뢰 금지: `PublicApiPathPolicy` STRICT 공개 경로와 같이 **Host/토큰 유래 tenant만**.
- `findAllBy`(tenant 없는 전체 조회) 금지. 목록은 항상 `findByTenantIdAnd...`.
- 상담사 열람: `ConsultantClientMappingRepository`로 **본인 consultant_id ↔ client_id/mapping_id** 검증.

### 6.4 암호화
- 응답 본문: 일지와 동일 **랜덤 nonce v2**. LIKE 검색 없음.
- 대상 전화/이메: 결정적 암호(컨버터) + 별도 해시 컬럼으로 검증.
- 키: 기존 `PERSONAL_DATA_ENCRYPTION_*` 재사용. 별도 SCT 키 불필요(운영 키 회전 정책 공유).

### 6.5 동의
- 첫 작성 전 화면에서 민감정보 동의 필수 → `sct_consents`.
- 만 14세 미만: 보호자 동의 + `agreed_at` + `ip_hash`.
- 동의 시각·IP는 평문 IP 대신 해시(기존 일지 열람 로그 정책과 정합). 법적 원문이 평문 IP를 요구하면 별도 법적 보관함 설계를 미결로 둔다(§14).

---

## 7. 문자 발송

### 7.1 재사용
- 호출: `SmsAuthService.sendNotificationMessage(normalizedPhone, message)`.
- 메시지에 **원문 토큰 URL** 포함(DB에는 해시만).
- 템플릿 문구는 `common_codes` `SCT_SMS_TEMPLATE` 또는 SMS_TEMPLATE 그룹에 시드.

### 7.2 `.dev` / 테스트
- `sms.auth.test-mode` (`SMS_TEST_MODE`) 기본 true → `SmsAuthService`는 실발송 없이 true 반환 가능.
- SCT 발송 서비스는 test-mode일 때 `sms_dispatch_result=TEST_MODE_SKIP`으로 기록하고, **로그에만 마스킹된 번호·토큰 일부** 남김.
- **실제 내담자 번호로 실문자 금지**: 개발 환경 체크리스트에 `SMS_TEST_MODE=true` 고정. 운영만 test-mode false + `tenant_sms_settings.sms_enabled`.

### 7.3 자동발송 게이트와의 관계
- `SmsDispatchFlagKeys` 2단계 게이트는 **예약/알림 자동발송**용.
- SCT는 상담사·관리자 **수동 발송**이므로 OTP/수동 알림과 같이 해당 게이트를 강제하지 않되, 테넌트 `feature.sct.enabled` + SMS 설정은 적용.

---

## 8. API 목록 (신규만)

공통: JSON, 멀티테넌트. 관리 API는 세션/`TenantContextFilter`. 공개 API는 `PublicApiPathPolicy`에 `/api/v1/public/sct` 접두어 추가 + Security permitAll.

### 8.1 공개 (비로그인)

| 메서드 | 경로 | 권한 | 요청/응답 요지 |
|--------|------|------|----------------|
| `GET` | `/api/v1/public/sct/{token}/meta` | permitAll | 만료·상태·formType·문항 수·마스킹 연락처 힌트. 본문 문항은 verify 후 |
| `POST` | `/api/v1/public/sct/{token}/verify` | permitAll | `{phone?\|email?}` → verifySessionId. 시도 제한 |
| `GET` | `/api/v1/public/sct/{token}/form` | verifySession | 문항 목록(평문 문항)·기존 임시답(복호화)·동의 필요 여부 |
| `PUT` | `/api/v1/public/sct/{token}/draft` | verifySession | 자동저장/버튼 공용. 문항별 answers[]. DRAFT 전이. SUBMITTED/EXPIRED면 거절 |
| `POST` | `/api/v1/public/sct/{token}/consents` | verifySession | 민감정보·보호자 동의 |
| `POST` | `/api/v1/public/sct/{token}/submit` | verifySession | 최종 제출 → SUBMITTED 잠금 |

로그인 내담자가 같은 링크를 열어도 **세션 역할과 무관**하게 위 공개 API만 사용(게이트 없음).

### 8.2 관리·상담사

| 메서드 | 경로 | 권한 | 요지 |
|--------|------|------|------|
| `GET` | `/api/v1/sct/forms` | ADMIN, STAFF, CONSULTANT | 활성 템플릿 목록(플래그 ON) |
| `POST` | `/api/v1/sct/invitations` | ADMIN, STAFF, **담당** CONSULTANT | `{formType, clientId?, mappingId?, phone?, email?, expiresInHours?}` 발송 |
| `GET` | `/api/v1/sct/invitations` | ADMIN; CONSULTANT=담당분; STAFF=목록 메타만(?) | 필터: status, clientId |
| `GET` | `/api/v1/sct/invitations/{id}` | ADMIN; 담당 CONSULTANT; **STAFF 본문 열람 미결** | 메타 + (허용 시) 응답 |
| `POST` | `/api/v1/sct/invitations/{id}/cancel` | ADMIN, STAFF, 발송자/담당 CONSULTANT | CANCELLED |
| `POST` | `/api/v1/sct/invitations/{id}/resend-sms` | 동일 | 동일 토큰 재문자 또는 정책상 신규 토큰(권장: 미제출이면 동일, 만료면 신규) |
| `GET` | `/api/v1/sct/clients/{clientId}/invitations` | ADMIN; 담당 CONSULTANT | 내담자 상세 위젯 |
| `GET` | `/api/v1/sct/clients/{clientId}/latest-submitted` | ADMIN; 담당 CONSULTANT | **상담 중 보기** SSOT |
| `GET` | `/api/v1/sct/session-view` | ADMIN; 담당 CONSULTANT | query: `clientId` 필수, `mappingId?`, `scheduleId?`(참조만, 스케줄 API 변경 없음) → 최신 SUBMITTED |
| `GET` | `/api/v1/sct/invitations/unlinked` | ADMIN, STAFF | client_id IS NULL 목록 |
| `GET` | `/api/v1/sct/invitations/{id}/link-candidates` | ADMIN | 동일 테넌트 내 전화/이메일 해시 **후보 목록만** (자동 연결 없음) |
| `POST` | `/api/v1/sct/invitations/{id}/link` | ADMIN | `{clientId, mappingId?}` 관리자 확인 후 연결 + 감사 |
| `DELETE` | `/api/v1/sct/invitations/{id}/link` | ADMIN | 연결 해제 + 감사 |

CONSULTANT “담당” 정의: `ConsultantClientMapping`에서 `tenantId`+`consultant_id`=me+(`client_id` 또는 `mapping_id`)가 ACTIVE/SESSIONS_EXHAUSTED 등 허용 상태.

---

## 9. 내담자 연동

### 9.1 발송 시
- UI/API가 `clientId`/`mappingId`를 넘기면 서버가 테넌트 내 존재·매핑 일관성 검증 후 저장.
- 미등록 연락처만 있으면 NULL로 발송.

### 9.2 후보 제시 → 확인 연결
1. `link-candidates`: invitation의 `target_phone_hash`/`target_email_hash`로 `clients` 검색(컨버터/해시 전략 정합).  
2. 결과 0..N을 **후보로만** 반환(이름 마스킹 정책 적용).  
3. 관리자가 `link` API로 명시적 선택.  
4. `SCT_CLIENT_LINKED` 감사. 해제 시 `SCT_CLIENT_UNLINKED`.

자동 매칭·배치 조인 업데이트 금지.

---

## 10. 임시 저장

- **자동 저장**(FE debounce)과 **「임시 저장」 버튼** 모두 `PUT .../draft` 동일 API.
- 서버 DB 암호화 저장만 인정. localStorage-only 금지(오프라인 캐시는 보조 가능하나 SSOT는 서버).
- 재진입: 토큰 → 연락처 verify → 기존 answers 복호화 반환.
- 제출 전 수정 가능; 제출 시 잠금; 만료/취소 시 410.

---

## 11. 권한 매트릭스

| 행위 | ADMIN | STAFF | 담당 CONSULTANT | 비담당 CONSULTANT | CLIENT(로그인) |
|------|-------|-------|-----------------|-------------------|----------------|
| 기능 플래그 OFF | 전면 거부 | | | | |
| 발송 | O | O | O(담당 client/mapping) | X | X |
| 목록 메타 | O | O | 담당분 | X | X |
| 응답 본문 열람 | O | **미결(§14)** | O | X | 공개 링크로만 본인 작성 |
| 연결/해제 | O | X(또는 미결) | X | X | X |
| 상담 중 latest | O | X | O | X | X |

구현: `@PreAuthorize("hasAnyRole('ADMIN','STAFF','CONSULTANT')")` + 서비스 단 리소스 가드(`ClientPathAccessGuard`/`ConsultationMessageAccessGuard` 패턴 참고).

---

## 12. 마이그레이션 계획

1. `V{yyyyMMdd}_001__create_sct_tables.sql` — 위 테이블·인덱스.  
2. `V{yyyyMMdd}_002__seed_sct_form_v3_items.sql` — 코어 템플릿 3종 + 문항 150개(원문).  
3. `V{yyyyMMdd}_003__seed_sct_feature_flag_and_codes.sql` — `system_config` 키 정의, 마인드가든 테넌트만 `true` 시드, `common_codes` 그룹.  
4. `AuditAction` 코드 추가로 인한 앱 enum 배포는 코드 변경 시점(본 설계 단계 제외).  
5. **롤백**: 테이블 drop은 후속 reverse 마이그레이션; 기존 테이블 무변경이므로 영향 국소.  
6. 운영/.dev에 본 설계 단계에서 **데이터 생성 금지** — 구현 배치에서만 적용.

---

## 13. 테스트 계획

| 구분 | 내용 |
|------|------|
| 단위 | 토큰 해시 저장·평문 미저장, 상태 전이 가드, 암호화 round-trip(`ConsultationBodyAttributeConverter`/`PersonalDataEncryptionUtil`), 연락처 해시 일치 |
| 단위 | 권한: 비담당 상담사 403, STAFF 발송 허용, 열람 정책 분기 |
| 통합 | 공개 흐름 verify→draft→submit→재draft 409; 만료 410; 시도 초과 잠금 |
| 통합 | SMS_TEST_MODE에서 실발송 미호출·`TEST_MODE_SKIP` |
| 통합 | 테넌트 A 토큰으로 테넌트 B 컨텍스트 오염 불가; tenantId 없는 find 금지 회귀 |
| 통합 | link-candidates는 후보만, link 전 client_id NULL 유지; link/unlink 감사 |
| 보안 | 제출 응답 본문이 audit metadata에 없음; 공개 API X-Tenant-Id 스푸핑 무시 |
| 회귀 | 결제·스케줄·consultation record API 계약 변경 없음(스모크) |

테스트 프로파일: 기존 `application-test.yml`의 `SMS_TEST_MODE: true`, 암호화 키 테스트 더블.

---

## 14. 미결 질문 (최대 3)

1. **링크 만료 기간**: 기본값을 72시간 / 7일 / 14일 중 무엇으로 할지, 발송 API `expiresInHours` 상한은?  
2. **사무원(`STAFF`) 응답 본문 열람**: 전면 금지 vs 마스킹 요약만 vs 관리자 동등 — 제품 결정 필요.  
3. **보관·파기 기간**: 제출 응답을 상담일지와 동일 개인정보 수명에 묶을지, SCT 단독 보존기간(예: 종결 후 N년)을 둘지, 만료 `DRAFT` 물리 삭제 주기.

---

## 15. 보안 결정 요약과 근거

| 결정 | 근거 |
|------|------|
| DB에 토큰 해시만 | 유출 시 링크 재구성 방지. 기존 `PasswordResetOpaqueTokenStore`와 동일 |
| 연락처 재검증 | 링크 유출·전달 오발송 시 타인 작성 완화 |
| 본문 랜덤 IV 암호 | 상담일지와 동일 민감도. 결정적 암호는 패턴 노출 |
| 토큰→TenantContext 강제 | 공개 API에서 헤더 테넌트 스푸핑 차단 |
| client/mapping 수동 연결 | 가족 번호·동명이인 오연결 방지 |
| 신규 API만 | 결제/일정/일지 회귀·권한 면적 확대 방지 |
| fail-closed 플래그 | 타 테넌트 실수 노출 방지, 마인드가든만 시드 ON |
| SMS_TEST_MODE | .dev 실내담자 문자 금지 요구 |

---

## 16. 시드 문항·영역 (원본 반영 요약)

출처: `mindgarden_sct_v3` 업로드 문서. 구현 시 문구·번호·해당 없음 표기를 **편집 없이** `sct_form_items`에 적재.

### 16.1 성인 `ADULT` (50) — 영역
자기개념; 부모/원가족; 배우자·연인; 자녀; 대인관계; 직장·역할; 정서; 과거 경험; 미래·목표; 대처·자원·강점; 가치·의미.

### 16.2 청소년 `ADOLESCENT` (50)
자기개념·신체상; 부모; 형제; 친구·또래; 좋아하는 마음·관계; 학교·교사·학업; 정서; 미디어·여가; 미래·진로; 강점·대처.

### 16.3 아동 `CHILD` (50)
나; 엄마·아빠·가족; 친구; 학교·선생님; 감정; 놀이·좋아하는 것; 바람·소원; 걱정.

방향(`valence`)·시점(`tense`)·영역 세부 라벨은 문서의 문항 일람 표를 메타데이터로 시드한다.

---

## 17. 구현 위임 시 체크리스트 (코더용, 본 단계 미실행)

- [ ] Flyway 3식 + 공개 경로 `PublicApiPathPolicy`/`SecurityConfig` 정합  
- [ ] `SctFeatureFlagKeys` + 마인드가든 테넌트 시드만 ON  
- [ ] Invitation/Answer 엔티티에 암호 Converter 적용  
- [ ] `SmsAuthService` + test-mode 결과 코드  
- [ ] `AuditAction` 확장 + link/unlink  
- [ ] CONSULTANT 매핑 가드  
- [ ] 기존 결제·스케줄·일지 컨트롤러 diff 0  
- [ ] `core-tester` 게이트: §13 항목

---

## 18. 문서 이력
- 2026-11-23: `release/dev` 코드베이스 조사 기반 BE 설계안 초안. 코드 변경 없음.
