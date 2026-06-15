# PII KEY/IV 회전 재암호화 마이그레이션 설계서

- **표준 ID**: PII-KEY-ROTATION-REENCRYPTION-DESIGN
- **버전**: v1.0.0 (초안)
- **상태**: 초안 — 사용자 합의 대기 (§6)
- **상위 정책**: [`SECRET_ROTATION_POLICY.md`](./SECRET_ROTATION_POLICY.md) v1.2.0 §3.4 (PII KEY/IV)
- **연관 표준**: [`PII_PROTECTION_STANDARD.md`](./PII_PROTECTION_STANDARD.md), [`ENCRYPTION_STANDARD.md`](./ENCRYPTION_STANDARD.md), [`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md)
- **베이스 커밋**: develop @ `054b938cf`
- **본 PR**: 설계서만 (구현 X). 구현은 Phase 1 / Phase 2 / Phase 3-4 로 PR 분할.

---

## 0. 본 설계서의 위상

`SECRET_ROTATION_POLICY.md` v1.2.0 §3.4 는 PII KEY/IV 회전이 **재암호화 마이그레이션을 동반하므로 자동화 1차 범위 외** 임을 선언하고, 별도 설계서 작성을 요구한다. 본 문서가 그 별도 설계서이며, 다음을 정의한다.

1. 현재 회전 인프라 사실관계 (§1)
2. 재암호화 마이그 전략 비교 및 권장 옵션 (§2)
3. 권장 옵션의 Phase 0~4 상세 절차 (§3)
4. 자동화 워크플로 골격 (§4)
5. 위험 분석 및 롤백 절차 (§5)
6. 사용자 합의 필요 항목 (§6)
7. 일정 (§7)

본 PR 은 설계서 1건만 신설한다. 코드·마이그레이션·워크플로 변경은 별도 PR 로 분할 진행한다.

---

## 1. 현황 분석

본 절은 1·2차 explore 결과로 **검증된 사실**만 정리한다. 추측·일반론은 일절 포함하지 않는다.

### 1.1 기존 회전 인프라 (이미 부분 구현됨)

#### 1.1.1 암호화 유틸 — `PersonalDataEncryptionUtil`

근거: `src/main/java/com/coresolution/consultation/util/PersonalDataEncryptionUtil.java`

| 항목 | 값 |
|---|---|
| 알고리즘 | AES/CBC/PKCS5Padding |
| 키 길이 | 32 byte (AES-256) |
| IV 길이 | 16 byte |
| Ciphertext 포맷 | `{keyId}::{base64cipher}` (VERSION_DELIMITER = `"::"`) |
| 활성 키 ID 식별 | `extractKeyVersion(cipher)` 로 prefix 파싱 |
| 복호화 fallback | `decryptWithVersionedCipher` → `decryptWithFallbackKeys` → legacy 단일 키 |
| 회전 헬퍼 | `ensureActiveKeyEncryption(value)` — 활성 키 미일치 시 재암호화 |
| 보조 메서드 | `encrypt`, `decrypt`, `safeEncrypt`, `safeDecrypt`, `isEncrypted`, `isEncryptedWithActiveKey` |

**핵심**: dual-read (구·신 키 동시 복호화) 가 **이미 구현되어 있다**. 본 설계서의 옵션 B (§2) 는 이 인프라를 **신설이 아닌 확장**으로 활용한다.

#### 1.1.2 키 SSOT — `PersonalDataEncryptionKeyProvider`

근거: `src/main/java/com/coresolution/consultation/util/PersonalDataEncryptionKeyProvider.java`, `src/main/resources/application.yml` 312-324

환경변수 → Spring property 매핑:

| 환경변수 | Spring property | 용도 |
|---|---|---|
| `PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID` | `encryption.personal-data.active-key-id` | 활성 keyId (예: `v2`) |
| `PERSONAL_DATA_ENCRYPTION_KEYS` | `encryption.personal-data.key-versions` | 다중 키 CSV (`keyId:value,keyId:value`) |
| `PERSONAL_DATA_ENCRYPTION_IVS` | `encryption.personal-data.iv-versions` | 다중 IV CSV (`keyId:value,keyId:value`) |
| `PERSONAL_DATA_ENCRYPTION_KEY` | (legacy) | 단일 키 fallback |
| `PERSONAL_DATA_ENCRYPTION_IV` | (legacy) | 단일 IV fallback |

**확정 사실**:

- `KeyMaterial` 의 **IV 는 keyId 당 단 1개 고정**이다. 같은 keyId 로 같은 평문을 암호화하면 결과 ciphertext 가 항상 같다 (**deterministic**).
  - 장점: equality 검색 (예: `email_hash` 미존재 컬럼) 가능
  - 단점: ECB-유사 정보 누출 — 같은 평문이 등장하면 ciphertext 가 동일하므로 빈도·분포 분석에 취약 (§5 위험 4)
- dev/local 프로파일에는 fallback 평문 키 (32 byte 고정 placeholder, `PersonalDataEncryptionKeyProvider` 내부 상수) 가 코드에 포함되어 있다. **운영 ACTIVE_PROFILES 분기가 이 fallback 을 비활성화하는지 Phase 0 게이트로 검증 필요** (§3.1).

#### 1.1.3 회전 서비스 — `PersonalDataKeyRotationService`

근거: `src/main/java/com/coresolution/consultation/service/PersonalDataKeyRotationService.java`

| 항목 | 현재 상태 |
|---|---|
| `rotateUserPersonalData()` | 존재 — `userRepository.findAll()` 전수 조회 후 단일 트랜잭션 처리 |
| 회전 대상 컬럼 | `name`, `nickname`, `phone`, `gender`, `address` — **5컬럼만** |
| 회전 메커니즘 | 각 컬럼에 `encryptionUtil.ensureActiveKeyEncryption(value)` 호출 |
| 호출처 (스케줄러·컨트롤러·CommandLineRunner·테스트) | **0건** |
| 누락 컬럼 (users) | `email`, `rrn_encrypted` |
| `clients` 회전 메서드 | **없음** |
| 페이징·청크·진행률 | **없음** |

**결론**: 서비스 클래스는 존재하지만 (a) 트리거되지 않고, (b) 누락 컬럼이 있으며, (c) clients 회전 경로가 없고, (d) 청크/진행률이 없어 운영 대량 데이터에 적용 불가하다.

### 1.2 PII 적용 컬럼 인벤토리

#### 1.2.1 `users` 테이블

| 컬럼 | 타입 | 암호화 호출 | 회전 대상 (현재) | 회전 대상 (개정 후) |
|---|---|---|---|---|
| `email` | VARCHAR(500) | 서비스 레이어 `safeEncrypt(...)` | ❌ | ✅ |
| `name` | VARCHAR(500) | 서비스 레이어 `safeEncrypt(...)` | ✅ | ✅ |
| `nickname` | VARCHAR(500) | 서비스 레이어 `safeEncrypt(...)` | ✅ | ✅ |
| `phone` | VARCHAR(500) | 서비스 레이어 `safeEncrypt(...)` | ✅ | ✅ |
| `gender` | VARCHAR(500) | 서비스 레이어 `safeEncrypt(...)` | ✅ | ✅ |
| `address` | VARCHAR(500) | 서비스 레이어 `safeEncrypt(...)` | ✅ | ✅ |
| `rrn_encrypted` | VARCHAR(500) | 서비스 레이어 `safeEncrypt(...)` | ❌ | ✅ |

암호화 호출 사이트는 90+ 곳으로, 주로 `AdminServiceImpl` 등 서비스 레이어에서 명시 호출된다 (AttributeConverter 자동 적용이 아님).

#### 1.2.2 `clients` 테이블

| 컬럼 | 타입 | 암호화 출처 | 회전 경로 |
|---|---|---|---|
| `name` | VARCHAR(500) | **users 의 암호문을 그대로 카피** (`client.setName(savedUser.getName())`) | ❌ 현재 없음 |
| `email` | VARCHAR(500) | users 카피 | ❌ 현재 없음 |
| `phone` | VARCHAR(500) | users 카피 | ❌ 현재 없음 |
| `gender` | VARCHAR(500) | users 카피 | ❌ 현재 없음 |
| `address` | VARCHAR(500) | users 카피 | ❌ 현재 없음 |
| `emergency_contact` | VARCHAR(500) | clients 자체 `safeEncrypt` | ❌ 현재 없음 |
| `emergency_phone` | VARCHAR(500) | clients 자체 `safeEncrypt` | ❌ 현재 없음 |

근거 (마이그 헤더 인용): `src/main/resources/db/migration/V20260330_001__extend_clients_columns_for_encrypted_pii.sql` 1~5라인 — "AdminServiceImpl 가 savedUser 값을 Client 에 그대로 저장함".

**의미**: users 회전 후 clients 의 5컬럼은 **자동으로 동기화되지 않는다**. 별도 회전 메서드 필요 (§3.2).

#### 1.2.3 `consultants` 테이블

`class Consultant extends User` (JOINED 상속). PII 는 users 행에만 저장되므로 users 회전으로 자동 커버된다. 별도 처리 불필요.

#### 1.2.4 평문 PII 잔존 (별도 결정 필요)

- `accounts` 테이블: 암호화 호출 0건 — 평문 유지
- `branches` 테이블: 암호화 호출 0건 — 평문 유지

본 회전 범위에 포함할지 §6 합의 필요 (별도 PR 권장).

### 1.3 휴면 vault — 별도 트랙

근거: `src/main/java/com/coresolution/consultation/service/impl/DormantPiiVaultServiceImpl.java`, `src/main/java/com/coresolution/consultation/service/DormantPiiVaultService.java`, `src/main/resources/db/migration/V20260606_004__create_dormant_user_pii_vault.sql`, `src/main/resources/application.yml` 257-258

| 항목 | 값 |
|---|---|
| 알고리즘 | AES/GCM/NoPadding |
| Nonce | 12 byte, **매 INSERT 마다 SecureRandom 신규** |
| Auth tag | 128 bit |
| 저장 포맷 | JSON `{"v":1,"nonce":..,"ciphertext":..,"tag":..}` |
| 적용 컬럼 | `dormant_user_pii_vault.encrypted_pii` (1 컬럼) |
| 키 SSOT | `MINDGARDEN_DORMANT_PII_ENC_KEY` (단일, base64) |
| 키 versioning | **없음** — 단일 키만 시도 |
| 회전 인터페이스 | **미구현** (javadoc: "키 로테이션은 미구현 (Phase 5+ 후속)") |

**결론**: 휴면 vault 는 본 설계 범위 **외**. 메인 키 회전과 알고리즘·키 SSOT·테이블 구조가 모두 다르므로 별도 설계서를 후속 작성한다 (§5 위험 6, §6 합의 1).

### 1.4 운영 SSOT GAP (선행 PR 필수)

근거: `deployment/mindgarden.prod-env.example`, `.github/workflows/deploy-production.yml`, `.github/actions/sync-prod-env-key/action.yml`, `docs/standards/DB_ENV_SSOT_POLICY.md`

| 항목 | 현재 상태 | 필요 조치 |
|---|---|---|
| `deployment/mindgarden.prod-env.example` 에 `PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID` 라인 | ❌ 없음 | 라인 추가 |
| 동 파일에 `PERSONAL_DATA_ENCRYPTION_KEYS` 라인 | ❌ 없음 | 라인 추가 (placeholder) |
| 동 파일에 `PERSONAL_DATA_ENCRYPTION_IVS` 라인 | ❌ 없음 | 라인 추가 (placeholder) |
| 동 파일에 `MINDGARDEN_DORMANT_PII_ENC_KEY` 라인 | ❌ 없음 | 라인 추가 (placeholder) |
| 동 파일의 `PERSONAL_DATA_ENCRYPTION_KEY` / `_IV` 단일 라인 | ✅ 존재 | legacy 보존 |
| `.github/workflows/deploy-production.yml` 의 PII/DORMANT env mapping | ❌ 0건 | env mapping 추가 |
| 동 워크플로의 sync step | ❌ 0건 | sync step 추가 |
| `.github/actions/sync-prod-env-key/action.yml` 의 PRESERVE 가드 | DB_* 8키만 하드코딩 | PII_* / DORMANT_* 추가 |
| dev 워크플로 (`deploy-dev.yml`, `deploy-onboarding-dev.yml`) | `PERSONAL_DATA_ENCRYPTION_KEY` / `_IV` export 만 | (참고) 본 회전과 직접 무관 |
| `docs/standards/DB_ENV_SSOT_POLICY.md:21` PR-3 | PII KEY/IV·DORMANT 이관 정의 (정책만, 워크플로 미구현) | 워크플로 구현 후 정책 §완료 표시 |

**의미**: 본 설계의 Phase 1 코드 변경을 운영에 배포하기 전에 **선행 PR 1건**으로 SSOT GAP 을 먼저 메워야 한다 (§3.1, §7).

### 1.5 사용자 초기 가설 vs 실제 사실 차이

사용자가 위임 시 가정했던 내용과 explore 로 확정된 실제 사실의 차이를 정정한다.

| # | 사용자 가설 | 실제 사실 (코드 근거) | 정정 |
|---|---|---|---|
| 1 | "PII KEY/IV 회전 인프라를 새로 신설해야 한다" | `PersonalDataEncryptionUtil` 의 `{keyId}::cipher` 포맷·`extractKeyVersion`·`decryptWithFallbackKeys` 가 **이미 구현**. dual-read 동작 가능 | **신설이 아니라 확장**. 옵션 B (§2) 의 근거. |
| 2 | "회전 서비스가 없다" | `PersonalDataKeyRotationService.rotateUserPersonalData()` **이미 존재**. 단, 호출처 0건·누락 컬럼 2개·청크 없음 | 트리거·확장만 추가. |
| 3 | "PII 컬럼은 AttributeConverter 자동 암복호화" (PII_PROTECTION_STANDARD §3 인용) | **서비스 레이어 `safeEncrypt(...)` 명시 호출**이 실제 패턴 (90+ 사이트, 주로 AdminServiceImpl). | 회전 배치는 엔티티 read/save 만으로는 부족 — 명시 재암호화 필요. |
| 4 | "users 만 회전하면 끝" | `clients` 5컬럼이 users 의 암호문을 카피하여 별도 보관. users 회전만으로 clients 미갱신 | clients 전용 회전 메서드 신설 (§3.2). |
| 5 | "휴면 vault 도 같은 인프라" | 휴면 vault 는 **AES/GCM + 매 row random nonce + 단일 키**. 알고리즘·키 versioning 모두 다름 | 본 설계 범위 외, 별도 트랙. |
| 6 | "IV 는 row 별 random" | 메인 PII 는 **keyId 당 IV 1개 고정** (deterministic). 휴면 vault 만 row 별 random nonce | §5 위험 4 (ECB-유사 정보 누출) + §6 합의 9 (GCM 전환 검토). |
| 7 | "운영 SSOT 는 정책 문서 기준으로 이미 정비됨" | `deployment/mindgarden.prod-env.example` 에 `_KEYS`/`_IVS`/`DORMANT` 라인 0건, 워크플로 mapping 0건, composite PRESERVE DB_* 8키만 | **선행 PR 필수** (§3.1). |

**핵심 정정 요약**: 본 회전 작업은 "신설"이 아니라 "이미 부분 구현된 인프라의 확장 + 누락 trigger·컬럼·SSOT·클라이언트 회전 보완"이다. 따라서 옵션 B (Dual-Read + 백그라운드 배치, §2) 가 합리적이다.

### 1.6 기존 재암호화 흔적

| 항목 | 상태 |
|---|---|
| Flyway 재암호화 마이그 | 0건 |
| `@Scheduled` PII 재암호화 잡 | 0건 |
| `TenantPgConfigurationKeyRotationServiceImpl` | 별 도메인. 트리거 0건, 테스트만 존재 — 참고용 |

**결론**: 본 설계가 PII 재암호화의 **첫 번째 정식 절차**가 된다.

---

## 2. 재암호화 마이그 전략 비교

### 2.1 옵션 A — Big Bang (다운타임 회전)

| 항목 | 내용 |
|---|---|
| 절차 | 점검 공지 → 운영 중단 → 전체 row 재암호화 → ACTIVE_KEY_ID 전환 → 재기동 → 서비스 재개 |
| 다운타임 | 필수 (수 분 ~ 수십 분, 데이터 규모에 비례) |
| 장점 | 구현 단순, dual-read 코드 불필요 |
| 단점 | 운영 중단·SLA 위반·대량 row 시 시간 폭증·중단 시 복구 복잡 |
| 사전 인프라 요구 | 없음 (`ensureActiveKeyEncryption` 만 있어도 됨) |

### 2.2 옵션 B — Dual-Read + 백그라운드 배치 (권장)

| 항목 | 내용 |
|---|---|
| 절차 | 신규 키 등록 (CSV 병존) → dual-read 유지 → 백그라운드 chunk 재암호화 → 검증 → 옛 keyId entry 제거 |
| 다운타임 | 0 (무중단) |
| 장점 | 무중단, chunk 단위 재시작 가능, **이미 구현된 dual-read 인프라 활용** (§1.1.1) |
| 단점 | 배치 잡·진행률 테이블 신설, 검증 로직 추가 |
| 사전 인프라 요구 | (이미 충족) `{keyId}::cipher` 포맷, `extractKeyVersion`, `decryptWithFallbackKeys` |

**권장 근거**:

1. `PersonalDataEncryptionUtil` 의 dual-read 인프라가 이미 구현되어 있다 — **신설이 아닌 확장**으로 충족.
2. `ensureActiveKeyEncryption` 헬퍼가 이미 존재 — 청크 배치에 그대로 적용 가능.
3. 무중단·롤백 가능 (구 keyId 가 CSV 에 살아 있는 동안 언제든 복원).
4. `SECRET_ROTATION_POLICY.md` §3.4 가 다중 키 병존 모델을 명시 — 정책 정합성 ✅.

### 2.3 옵션 C — Read-Modify-Write Lazy

| 항목 | 내용 |
|---|---|
| 절차 | 신규 키 등록 → 일반 트래픽이 read/save 할 때마다 `ensureActiveKeyEncryption` 자동 호출 → 시간이 지나면 점진 회전 |
| 다운타임 | 0 |
| 장점 | 배치 잡 불필요, 구현 최소 |
| 단점 | **회전 완료 시점 불확정** — 비활성 사용자·잘 안 쓰이는 row 는 영원히 옛 키. PIPA·내부 규정상 보안 사고 시 회전 시각 증명 곤란. 옛 키 폐기 시점 정의 불가. |

### 2.4 권장: 옵션 B

| 옵션 | 권장 |
|---|---|
| A (Big Bang) | ❌ — 운영 SLA 위반 |
| **B (Dual-Read + 배치)** | ✅ — 기존 인프라 확장·무중단·완료 시점 명확 |
| C (Lazy) | ❌ — 완료 시점 불확정 |

이후 §3 은 **옵션 B 기준**으로 작성한다.

---

## 3. 옵션 B 상세 설계 (Phase 0 ~ Phase 4)

### 3.1 Phase 0 — 사전 준비 (선행 PR + 운영 게이트)

#### 3.1.1 선행 PR 1: 운영 prod-env SSOT 보강

대상 파일: `deployment/mindgarden.prod-env.example`

추가할 라인 (값은 placeholder):

```text
# === PII 암호화 다중 키 SSOT ===
PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID=<set-active-key-id>
PERSONAL_DATA_ENCRYPTION_KEYS=<set-keys-csv>
PERSONAL_DATA_ENCRYPTION_IVS=<set-ivs-csv>

# === 휴면 PII vault SSOT ===
MINDGARDEN_DORMANT_PII_ENC_KEY=<set-dormant-key-base64>
```

> 실제 운영 secret 평문은 본 문서·PR·예시 파일에 **절대 포함 금지**. 운영 반영은 `/etc/mindgarden/prod.env` 직접 편집 또는 sync workflow 로 한정.

#### 3.1.2 선행 PR 2: composite action PRESERVE 가드 확장

대상 파일: `.github/actions/sync-prod-env-key/action.yml`

현재 PRESERVE 가드는 DB_* 8키만 하드코딩되어 있다. 다음을 추가한다 (예시 형식):

```yaml
# PII 다중 키·휴면 키는 본 회전 PR 머지 후에도 PRESERVE 대상
PII_PRESERVE_KEYS: |
  PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID
  PERSONAL_DATA_ENCRYPTION_KEYS
  PERSONAL_DATA_ENCRYPTION_IVS
  PERSONAL_DATA_ENCRYPTION_KEY
  PERSONAL_DATA_ENCRYPTION_IV
  MINDGARDEN_DORMANT_PII_ENC_KEY
```

> 위는 형식 예시일 뿐, 실제 구현은 본 PR 범위 외 (별도 PR). `DB_ENV_SSOT_POLICY.md` PR-3 의 미구현 항목과 정합.

#### 3.1.3 운영 DB 전체 dump 백업 (필수)

- 시점: Phase 1 코드 머지 직전
- 도구: `mysqldump --single-transaction --routines --triggers`
- 보관: 운영팀 vault (최소 30일)
- 책임: DBA

#### 3.1.4 신규 키 / IV 생성 (운영팀, 평문 절대 비공개)

생성 명령 예시 (실행은 운영팀 로컬·DBA 환경, 결과는 1Password / vault 직행):

```bash
# 키 (32 byte hex)
openssl rand -hex 32

# IV (16 byte hex)
openssl rand -hex 16
```

새 keyId 부여 규칙: `v{N+1}` (현재 활성이 `v1` 이면 신규는 `v2`). `extractKeyVersion` 이 prefix 파싱 기준이므로 `:` `,` 문자 금지.

#### 3.1.5 dev/local fallback 키 운영 차단 게이트

근거: `PersonalDataEncryptionKeyProvider` 가 dev/local 프로파일 fallback 평문 키 (32 byte 고정 placeholder) 를 코드 내부 상수로 보유.

운영 ACTIVE_PROFILES (`prod`, `production`) 에서 이 fallback 이 비활성화되는지를 사전 검증한다.

검증 절차 (실제 검증은 application 로그·actuator 기준, SQL 아님):

```text
1) BE 부트 로그 grep — dev fallback 활성화 로그 0건 확인
2) actuator/env (보안 가드 통과 시) — spring.profiles.active=prod 확인
3) 환경변수 주입 확인 — PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID 가 신규 keyId 로 주입
```

검증 항목 (Phase 0 게이트, 모두 통과해야 Phase 1 진행 가능):

- [ ] 운영 부트 로그에 dev fallback 키 활성화 메시지 0건
- [ ] `actuator/env` (보안 가드 통과 시) `spring.profiles.active=prod` 확인
- [ ] `PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID` 환경변수 주입 확인
- [ ] `PERSONAL_DATA_ENCRYPTION_KEYS` / `_IVS` CSV 에 신규 keyId 포함 확인

### 3.2 Phase 1 — 회전 인프라 확장 (코드 PR — 본 §은 Phase 1 PR 머지로 구현 완료, 본 문서 정합 갱신)

> **상태**: Phase 1 PR (`feat(security): PII KEY 회전 Phase 1 — 회전 인프라 확장`) 으로 본 §의 모든 항목이 구현되었다. 실행은 Phase 2 PR 의 별도 트리거로 진행한다.

#### 3.2.1 `PersonalDataKeyRotationService` 확장 (구현 완료)

대상 파일: `src/main/java/com/coresolution/consultation/service/PersonalDataKeyRotationService.java`

| 항목 | 현재 | 확장 후 (Phase 1 머지) |
|---|---|---|
| 처리 모델 | `findAll()` 전수 단일 트랜잭션 (JPA 변환기 경유) | `JdbcTemplate` 기반 chunk SELECT/UPDATE — JPA 변환기 우회로 ciphertext 직접 다룸 |
| users 회전 컬럼 (7개) | `name`, `nickname`, `phone`, `gender`, `address` | + `email`, `rrn_encrypted` (`USERS_PII_COLUMNS` 상수) |
| chunk size | — | 1 ~ 1000 (`MIN_CHUNK_SIZE` / `MAX_CHUNK_SIZE`), default 100 (`DEFAULT_CHUNK_SIZE`) |
| 트랜잭션 경계 | 단일 트랜잭션 | chunk 1개 = 트랜잭션 1개 (`TransactionTemplate.execute`) |
| 재시작 | 불가 | `pii_reencryption_progress` 의 마지막 DONE chunk_end_id 부터 재개 |
| 실패 chunk | rollback 후 흐름 종료 | 해당 chunk 만 `FAILED` 마킹, 다음 chunk 계속 진행 → `resumeFailedChunks(...)` 로 재시도 |
| 평문 백필 게이트 | — | `pii-rotation.allow-plaintext-encryption` (default `false`) — accounts/branches 회전은 본 플래그가 true 일 때만 활성 |
| 테이블 부재 가드 | — | `INFORMATION_SCHEMA.TABLES` 사전 조회 — 미존재 시 즉시 SKIPPED 결과 반환 (예: `branches` 가 V20260612_002 로 archive 됨) |

핵심 메서드 시그니처 (Phase 1 PR 확정):

```java
public PiiRotationResult rotateUserPersonalData(int chunkSize, String targetKeyId);
public PiiRotationResult rotateClientPersonalData(int chunkSize, String targetKeyId);
public PiiRotationResult rotateAccountPersonalData(int chunkSize, String targetKeyId);
public PiiRotationResult rotateBranchPersonalData(int chunkSize, String targetKeyId);
public PiiRotationResult rotateDormantPiiVault(int chunkSize, String targetKeyId);

public Map<Status, Long> aggregateProgress(String tableName, String targetKeyId);
public PiiRotationResult resumeFailedChunks(String tableName, List<String> piiColumns, String targetKeyId);
public int cancelPendingChunks(String tableName, String targetKeyId);
```

`PiiRotationResult` 는 평문 / 암호문 PII 를 절대 포함하지 않는다 — `tableName`, chunk 카운트, row 카운트, `activeKeyId` / `targetKeyId` 만 노출.

#### 3.2.2 `clients` 회전 메서드 (구현 완료)

신규 메서드: `rotateClientPersonalData(int chunkSize, String targetKeyId)`

회전 대상 컬럼 7개 (`CLIENTS_PII_COLUMNS` 상수):

- users 카피본: `name`, `email`, `phone`, `gender`, `address`
- clients 자체: `emergency_contact`, `emergency_phone`

**users → clients 동기성 보장**:

`PersonalDataEncryptionKeyProvider` 의 IV 결정성 (keyId 당 IV 1개 고정, §1.1.2) 에 의해 같은 keyId + 같은 평문은 항상 같은 ciphertext 를 생성한다. clients 컬럼은 직접 ciphertext 를 다시 fallback 복호화 → 활성 키 재암호화 (`PersonalDataEncryptionUtil.ensureActiveKeyEncryption`) 하므로, users 회전과 같은 결과 ciphertext 가 산출된다. emergency_contact / emergency_phone 은 clients 자체 평문이므로 독립 회전된다.

#### 3.2.2-A `accounts` / `branches` 평문 PII 백필 (구현 완료)

§6 합의 2 (사용자 결정: 본 회전 포함) 반영.

- `rotateAccountPersonalData(...)` — `account_number`, `account_holder` (2컬럼)
- `rotateBranchPersonalData(...)` — `phone_number`, `fax_number`, `email`, `address` (4컬럼)

두 메서드 모두 `pii-rotation.allow-plaintext-encryption=true` 일 때만 회전 수행. 본 플래그가 `false` 인 동안에는 `IllegalArgumentException` 없이 빈 결과 (`chunksProcessed=0, rowsRotated=0`) 를 반환하며 회전을 SKIP 한다. 이유: Phase 1 시점 `Account` / `Branch` 엔티티에 PII `@Convert` 가 미적용이므로, 데이터만 ciphertext 로 갱신되면 read 경로가 깨진다. Phase 2 PR 에서 entity 변환기를 적용한 뒤 본 플래그를 활성화한다.

`branches` 는 V20260612_002 로 `branches_dropped_20260612` 로 archive 되었다. 본 메서드는 `INFORMATION_SCHEMA` 조회로 테이블 부재를 사전 검출해 SKIPPED 결과로 반환하며, archive 테이블을 회전하려면 `branches_dropped_20260612` 를 명시 호출하면 된다.

#### 3.2.2-B `dormant_user_pii_vault` 별도 회전 메서드 (구현 완료, scan-only)

§6 합의 1 (사용자 결정: 메인 + 휴면 모두) 반영.

- `rotateDormantPiiVault(int chunkSize, String targetKeyId)` — Phase 1 인프라에서는 chunk scan + `SKIPPED` 마킹만 수행한다.
- 휴면 vault 는 AES-GCM + 단일 키 SSOT (`MINDGARDEN_DORMANT_PII_ENC_KEY`) 를 사용하며 메인 PII 의 다중 키 인프라와 호환되지 않는다. Phase 2 PR 에서 휴면 vault 다중 키 SSOT 가 추가되면 본 메서드를 활성 회전으로 전환한다.

#### 3.2.3 청크 / 페이징 / 진행률 테이블 (구현 완료)

Flyway 마이그: `src/main/resources/db/migration/V20260615_001__pii_reencryption_progress.sql`

```sql
CREATE TABLE IF NOT EXISTS pii_reencryption_progress (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(64) NOT NULL,
  chunk_no INT NOT NULL,
  chunk_start_id BIGINT NULL,
  chunk_end_id BIGINT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  rows_total INT NULL,
  rows_done INT NULL,
  error_message TEXT NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  active_key_id VARCHAR(16) NOT NULL,
  target_key_id VARCHAR(16) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_table_chunk_target (table_name, chunk_no, target_key_id),
  KEY idx_pii_progress_status (status, table_name),
  KEY idx_pii_progress_target_key (target_key_id, table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`status` enum: `PENDING / IN_PROGRESS / DONE / FAILED / SKIPPED` (기존 초안의 `RUNNING` → `IN_PROGRESS` 로 정리, `SKIPPED` 신규 추가). 본 테이블은 평문/암호문 PII 를 절대 보관하지 않으며 chunk 메타·키 ID 스냅샷·sanitize 된 에러 요약만 기록한다.

#### 3.2.4 트리거 경로 — Admin Endpoint (구현 완료)

대상 파일: `src/main/java/com/coresolution/core/controller/PiiKeyRotationAdminController.java`

| 메서드 | 경로 | 입력 | 응답 |
|---|---|---|---|
| `POST` | `/api/v1/admin/pii-rotation/start` | `table`, `target_key_id`, `chunk_size` (default 100) | `PiiRotationResult` |
| `GET` | `/api/v1/admin/pii-rotation/progress` | `table`, `target_key_id` | `PiiRotationProgressResponse` (chunk 상태별 카운트) |
| `POST` | `/api/v1/admin/pii-rotation/resume` | `table`, `target_key_id` | `PiiRotationResult` (FAILED chunk 만 재실행) |
| `POST` | `/api/v1/admin/pii-rotation/cancel` | `table`, `target_key_id` | `{ table, target_key_id, cancelled_chunks }` |

권한 가드: 컨트롤러 클래스에 `@PreAuthorize("hasRole('ADMIN')")` 부착 (레거시 `HQ_MASTER` 매핑 통합 — `docs/standards/ROLE_STANDARD.md` §3.1·§5.1 SSOT). 모든 응답은 평문/암호문 PII 를 절대 포함하지 않는다 (단위 테스트에서 정규식 가드로 회귀 차단).

> admin override 강제 회전 / grace 무시는 **금지**. 본 endpoint 는 chunk 단위 진행만 트리거하며, 옛 keyId 폐기는 워크플로 별도 phase (§3.5) 에서만 수행한다.

#### 3.2.5 단위 테스트 (구현 완료)

- `src/test/java/com/coresolution/consultation/service/PersonalDataKeyRotationServiceTest.java` — 14 케이스 (chunk 회전·idempotency·실패 chunk 격리·targetKey 검증·평문 게이트·테이블 부재·재시도·취소·집계).
- `src/test/java/com/coresolution/core/controller/PiiKeyRotationAdminControllerTest.java` — 8 케이스 (4 endpoints + `@PreAuthorize` reflection 검증 + 평문 PII 응답 비포함 정규식).

### 3.3 Phase 2 — 배치 재암호화 실행

#### 3.3.1 실행 시간대

- 권장: **23:00 ~ 06:00 KST** (`SECRET_ROTATION_POLICY.md` §7 동일)
- 금지: 09:00 ~ 22:00 KST 운영 시간 강행

#### 3.3.2 chunk 단위 처리

| 항목 | 기준 |
|---|---|
| chunk 크기 | 100 row (Phase 1 PR 에서 조정 가능) |
| 트랜잭션 | chunk 1개 = 트랜잭션 1개 |
| 실패 시 | chunk 단위 retry (최대 3회, 지수 backoff) |
| 동시성 | chunk 처리 worker 단일 (락 충돌 방지) |

#### 3.3.3 처리 순서

1. `users` 7컬럼 전체 chunk 처리
2. `clients` 7컬럼 전체 chunk 처리 (users 회전 완료 후)
3. 각 chunk 완료 시 `pii_reencryption_progress.status = 'DONE'` 업데이트

#### 3.3.4 휴면 vault — 범위 외

- `dormant_user_pii_vault.encrypted_pii` 는 본 Phase 에서 처리하지 **않는다**.
- 휴면 vault 회전 미구현 사실 (§1.3) 을 Phase 5+ 후속 과제로 분리.

### 3.4 Phase 3 — 검증

#### 3.4.1 잔여 row 0 확인

검증 SQL (`<newKeyId>` 는 Phase 0 에서 부여한 신규 keyId):

```sql
-- users 7컬럼 잔여 확인
SELECT
  SUM(CASE WHEN email          NOT LIKE '<newKeyId>::%' AND email          IS NOT NULL THEN 1 ELSE 0 END) AS email_left,
  SUM(CASE WHEN name           NOT LIKE '<newKeyId>::%' AND name           IS NOT NULL THEN 1 ELSE 0 END) AS name_left,
  SUM(CASE WHEN nickname       NOT LIKE '<newKeyId>::%' AND nickname       IS NOT NULL THEN 1 ELSE 0 END) AS nickname_left,
  SUM(CASE WHEN phone          NOT LIKE '<newKeyId>::%' AND phone          IS NOT NULL THEN 1 ELSE 0 END) AS phone_left,
  SUM(CASE WHEN gender         NOT LIKE '<newKeyId>::%' AND gender         IS NOT NULL THEN 1 ELSE 0 END) AS gender_left,
  SUM(CASE WHEN address        NOT LIKE '<newKeyId>::%' AND address        IS NOT NULL THEN 1 ELSE 0 END) AS address_left,
  SUM(CASE WHEN rrn_encrypted  NOT LIKE '<newKeyId>::%' AND rrn_encrypted  IS NOT NULL THEN 1 ELSE 0 END) AS rrn_left
FROM users;

-- clients 7컬럼 잔여 확인
SELECT
  SUM(CASE WHEN name              NOT LIKE '<newKeyId>::%' AND name              IS NOT NULL THEN 1 ELSE 0 END) AS name_left,
  SUM(CASE WHEN email             NOT LIKE '<newKeyId>::%' AND email             IS NOT NULL THEN 1 ELSE 0 END) AS email_left,
  SUM(CASE WHEN phone             NOT LIKE '<newKeyId>::%' AND phone             IS NOT NULL THEN 1 ELSE 0 END) AS phone_left,
  SUM(CASE WHEN gender            NOT LIKE '<newKeyId>::%' AND gender            IS NOT NULL THEN 1 ELSE 0 END) AS gender_left,
  SUM(CASE WHEN address           NOT LIKE '<newKeyId>::%' AND address           IS NOT NULL THEN 1 ELSE 0 END) AS address_left,
  SUM(CASE WHEN emergency_contact NOT LIKE '<newKeyId>::%' AND emergency_contact IS NOT NULL THEN 1 ELSE 0 END) AS emg_contact_left,
  SUM(CASE WHEN emergency_phone   NOT LIKE '<newKeyId>::%' AND emergency_phone   IS NOT NULL THEN 1 ELSE 0 END) AS emg_phone_left
FROM clients;
```

기대치: 모든 컬럼 `0`.

#### 3.4.2 샘플 복호화 무사고

- 샘플: users / clients 각 **1000건** random
- 검증 도구: `PersonalDataEncryptionUtil.safeDecrypt` 호출 (BE 어드민 ops endpoint 또는 단위 테스트)
- 기대치: 100% 정상 복호화. 1건이라도 실패 시 Phase 3 fail → 옛 keyId 유지 (Phase 4 진행 금지).

#### 3.4.3 진행률 테이블 검증

```sql
SELECT target_table, target_key_id, status, COUNT(*) AS chunks
FROM pii_reencryption_progress
WHERE target_key_id = '<newKeyId>'
GROUP BY target_table, target_key_id, status;
```

기대치: 모든 `status = 'DONE'` (PENDING / RUNNING / FAILED 0건).

### 3.5 Phase 4 — 구 키 폐기

#### 3.5.1 옛 keyId entry 제거

- `PERSONAL_DATA_ENCRYPTION_KEYS` CSV 에서 옛 keyId entry 제거
- `PERSONAL_DATA_ENCRYPTION_IVS` CSV 에서 옛 keyId entry 제거
- 단일 legacy fallback (`PERSONAL_DATA_ENCRYPTION_KEY` / `_IV`) 도 동시 제거 또는 placeholder 화

#### 3.5.2 GH Secrets 갱신

- `gh secret set PERSONAL_DATA_ENCRYPTION_KEYS --env prod --body "<신키만>"`
- `gh secret set PERSONAL_DATA_ENCRYPTION_IVS  --env prod --body "<신IV만>"`
- `gh secret set PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID --env prod --body "<newKeyId>"`

#### 3.5.3 회전 이력 append

- 대상: `docs/operations/secret-rotation-history.md` (SECRET_ROTATION_POLICY.md §10 SSOT)
- 포맷 동일: `| 시점(KST) | 시크릿명 | 환경 | 트리거 | Run ID | 책임자 | 비고 |`
- 시크릿명 컬럼: `PERSONAL_DATA_ENCRYPTION_KEYS` + `_IVS` + `_ACTIVE_KEY_ID` (3행 또는 1행 통합 — Phase 4 PR 에서 합의)

#### 3.5.4 grace 기간

- 옛 keyId 폐기 grace: **7일** (Phase 3 검증 GREEN 후)
- 7일 후 BE 재기동·옛 키 환경변수 제거 적용
- Converter fallback 분기 코드 제거는 **하지 않는다** — CSV 에서 옛 keyId 가 사라지면 fallback 도 자동으로 시도하지 않으므로 코드 변경 불필요.

---

## 4. 자동화 워크플로 설계 (`rotate-pii-key.yml`)

본 워크플로는 본 PR 범위 외 (별도 PR). 골격만 정의한다.

### 4.1 설계 원칙

- 5 step **전부 `workflow_dispatch` 독립 트리거** — 자동 연쇄 금지 (`SECRET_ROTATION_POLICY.md` 와 동일 패턴)
- 각 step 사이에 사용자 확인 / `core-tester` 게이트
- prod 회전은 **dev 회전 24h 무사고 통과 후**에만 실행

### 4.2 Step 정의

| step | phase | 동작 | 사용자 확인 |
|---|---|---|---|
| 1 | `phase1-deploy` | Phase 1 코드 머지 후 운영 재배포 (`deploy-production.yml` dispatch) | confirm=DEPLOY |
| 2 | `phase2-batch-start` | admin endpoint `POST /api/v1/ops/pii-rotation/start` 호출 또는 스케줄 실행 | confirm=BATCH_START |
| 3 | `batch-status` | 진행률 조회 (`SELECT ... FROM pii_reencryption_progress`) | (조회만, 확인 불필요) |
| 4 | `phase3-verify` | 검증 SQL (§3.4.1) + 샘플 복호화 (§3.4.2) | confirm=VERIFY |
| 5 | `phase4-finalize` | 옛 keyId entry 제거 + GH Secrets 갱신 + 이력 append | confirm=FINALIZE + confirm_prod=PROD_FINALIZE |

### 4.3 workflow_dispatch inputs (예시)

| input | 필수 | 값 |
|---|---|---|
| `phase` | ✅ | `phase1-deploy` / `phase2-batch-start` / `batch-status` / `phase3-verify` / `phase4-finalize` |
| `environment` | ✅ | `dev` / `prod` |
| `target_key_id` | ✅ | 회전 목표 keyId (예: `v2`) |
| `confirm` | ✅ | step 별 enum (위 표 참조) |
| `confirm_prod` | prod 만 | `PROD_DEPLOY` / `PROD_BATCH_START` / `PROD_VERIFY` / `PROD_FINALIZE` |
| `trigger_reason` | ✅ | `정기` / `비상` / `재시도` |

### 4.4 사전 조건

- `secrets.ROTATION_SECRETS_PAT` (`SECRET_ROTATION_POLICY.md` §3.1·§3.3 와 공유 PAT)
- `secrets.PRODUCTION_HOST` / `PRODUCTION_USER` / `PRODUCTION_SSH_KEY` (deploy-production 과 공유)
- `secrets.OPS_ADMIN_TOKEN` (admin endpoint 호출용 — Phase 1 PR 에서 정의)

---

## 5. 위험 분석 + 롤백

### 5.1 위험 분석

| # | 위험 | 영향 | 완화 |
|---|---|---|---|
| 1 | 새 키 손실 → 복호화 불가 | 전사 PII 접근 불가 (P0) | Phase 0 운영 dump 백업 + GH Secrets 즉시 등록 + 옛 키 grace 7일 보존 |
| 2 | 배치 중단 → 부분 재암호화 | chunk 일부만 신키, 일부 옛키 — 동작은 정상이나 시점 추적 어려움 | chunk 단위 트랜잭션 + `pii_reencryption_progress` 테이블, 재시작 시 RUNNING/FAILED chunk 만 retry |
| 3 | dev/local fallback 키 운영 활성 | 평문 키 운영 노출 (P0) | Phase 0 §3.1.5 사전 검증 게이트 (부트 로그·actuator 확인) |
| 4 | IV 결정성 (keyId 당 IV 1개 고정) | 같은 평문 → 같은 ciphertext → 빈도 분석 정보 누출 (ECB-유사) | 본 표준 §1.1.2 명시 + §6 합의 9 (향후 keyId 당 random IV / AES-GCM 전환 검토) → Phase 5+ 후속 |
| 5 | `clients` 미갱신 행 | users 만 회전하면 clients 5컬럼이 옛 keyId 유지 (dual-read 로 동작은 하지만 폐기 시 fail) | Phase 1 의 `rotateClientPersonalData()` 신설 (§3.2.2) |
| 6 | DormantPii vault 미회전 | 휴면 PII 단일 키 그대로 — 본 회전 범위 외 | §1.3 명시 + Phase 5+ 후속 트랙 분리 (§6 합의 1) |
| 7 | 운영 SSOT GAP (`_KEYS`/`_IVS`/DORMANT 미존재) | Phase 1 배포가 신키를 인식 못 함 | Phase 0 선행 PR §3.1.1 + §3.1.2 |
| 8 | 90+ `safeEncrypt` 사이트 누락 | 신규 INSERT row 가 옛 keyId 로 저장 | `PersonalDataEncryptionKeyProvider` 의 `active-key-id` 가 변경되면 `safeEncrypt` 가 자동으로 신키 사용 — Phase 0 신키 등록 시점에 자동 전환 |
| 9 | 회전 중 신규 INSERT row | 회전 진행 도중 들어온 INSERT 는 이미 신키 — 충돌 없음 | (별도 조치 불필요, dual-read 가 자동 처리) |

### 5.2 롤백 절차

#### 5.2.1 Phase 1 deploy 후 (Phase 4 이전)

| 시점 | 롤백 가능 여부 | 절차 |
|---|---|---|
| Phase 1 deploy 직후 | ✅ 완전 롤백 | BE 이전 버전 재배포. CSV 에 옛 keyId 가 살아 있으므로 모든 row 복호화 가능 |
| Phase 2 진행 중 | ✅ 부분 롤백 | 배치 중단 → 진행률 테이블에 RUNNING/PENDING 으로 남음. BE 이전 버전 재배포 가능 (dual-read 가 두 keyId 모두 처리) |
| Phase 3 검증 실패 | ✅ Phase 4 진행 금지 | 옛 keyId entry 그대로 유지. 신키 row 는 dual-read 가 처리 (운영 영향 없음). 원인 분석 후 재시도 |

#### 5.2.2 Phase 4 후 (옛 keyId entry 제거)

| 시점 | 롤백 가능 여부 | 절차 |
|---|---|---|
| Phase 4 직후 ~ grace 7일 이내 | ⚠️ 제한적 — GH Secrets 백업 복원 + BE 재배포 필요 | 운영팀 vault 의 옛 keyId 값을 `PERSONAL_DATA_ENCRYPTION_KEYS` CSV 에 재추가 → BE 재기동 |
| grace 7일 경과 후 | ❌ 데이터 손실 가능 | Phase 0 dump 복원 외 방법 없음 — 비상 회전 (`SECRET_ROTATION_POLICY.md` §4) 절차로 재진입 |

**핵심**: 데이터 손실 없는 진정한 롤백은 **Phase 4 전까지**만 보장된다. Phase 0 dump 백업은 필수이며, 옛 keyId 폐기 grace 7일은 **단축 금지**.

#### 5.2.3 롤백 결정 권한

- Phase 1~3 롤백: 운영팀 + `core-tester` 합의
- Phase 4 롤백: 운영팀 + 보안 담당 + 사용자(`B0KlA`) 합의 (P0 통보)

---

## 6. 사전 합의 사항 (사용자 결정 필요)

본 PR 머지 전 또는 Phase 1 PR 착수 전에 다음 9개 항목을 합의한다.

| # | 항목 | 권장 답 | 사용자 결정 |
|---|---|---|---|
| 1 | **본 회전 범위**: 메인 키만 vs 휴면 키 vs 둘 다 | **메인 키만** — 휴면 vault 는 알고리즘·키 구조 상이 (§1.3), 별도 트랙 후속 | ☐ |
| 2 | **`accounts` / `branches` 평문 PII 처리**: 본 회전 포함 vs 별도 PR | **별도 PR** — 본 회전과 무관, 평문 → 암호화 백필이 본 회전보다 큰 작업 (`PII_PROTECTION_STANDARD.md` §7) | ☐ |
| 3 | **`clients` 회전 정책**: 별도 메서드 vs users 회전 후 application 카피 의존 | **별도 메서드** (§3.2.2) — IV 결정성 의존 회피 + emergency_* 컬럼 독립 처리 필요 | ☐ |
| 4 | **`SECRET_ROTATION_POLICY.md` §3.4 본문 갱신 PR 위상** | **후행** — 본 설계서 합의 후 §3.4 에 본 문서 링크 추가하는 PR 후속 | ☐ |
| 5 | **운영 PII 데이터 규모 추정** (회전 소요 시간) | **추가 explore 필요** — `SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM clients;` Phase 1 PR 착수 전 측정 | ☐ |
| 6 | **회전 주기 정책** (분기 1회 유지 vs 완화) | **연 1회 유지** (`SECRET_ROTATION_POLICY.md` §2 표 PII KEY/IV 항목) — 본 설계는 1회 회전 절차 SSOT, 주기 변경은 §2 별도 갱신 | ☐ |
| 7 | **다운타임 허용 여부** | **무중단 (옵션 B)** — 옵션 A 대비 명백 우위 | ☐ |
| 8 | **dev/local fallback 키 운영 차단 게이트** | **필수** (§3.1.5) — Phase 0 게이트 통과 없이 Phase 1 진행 금지 | ☐ |
| 9 | **IV 결정성 → 향후 AES-GCM 전환 검토 일정** | **Phase 5+ 후속 과제로 분리** — 본 회전은 기존 알고리즘 그대로, GCM 전환은 별도 설계·재암호화 마이그 필요 (위험 4) | ☐ |

위 9개 항목이 모두 ☑ 처리되기 전까지 본 설계서 상태는 **초안** 으로 유지한다.

---

## 7. 일정 (예상)

| 시점 | 작업 | 산출물 |
|---|---|---|
| **D+0** | 본 PR (설계서) | `PII_KEY_ROTATION_REENCRYPTION_DESIGN.md` |
| **D+3** | 선행 PR — 운영 SSOT 보강 (`prod-env.example` PII 라인 추가 + composite PRESERVE 가드 확장) | `deployment/mindgarden.prod-env.example`, `.github/actions/sync-prod-env-key/action.yml` |
| **D+10** | Phase 1 PR — 회전 인프라 확장 (`PersonalDataKeyRotationService` 확장 + `clients` 메서드 + 진행률 테이블 마이그 + admin endpoint) | 코드 + Flyway 마이그 + 단위 테스트 |
| **D+17** | Phase 2 — 배치 재암호화 실행 (dev 환경) | 진행률 테이블 DONE, 검증 SQL 0건 |
| **D+18** | dev 실증 회전 24h 무사고 통과 | sanity 로그·alerting 0건 |
| **D+19** | staging 회전 (해당 환경 운영 시) | dev 동일 절차 |
| **D+20** | Phase 3~4 워크플로 신설 (`rotate-pii-key.yml`) | 워크플로 yml + 사용자 합의 PR |
| **D+24+** | prod 회전 — 사용자 합의 후 + 24h grace | 회전 이력 append PR |

> 위 일정은 사용자 결정·운영 데이터 규모·DBA 협업 여건에 따라 변동된다. 실제 시점은 §6 합의 항목 #5 (데이터 규모 측정) 결과 후 확정.

---

## 8. 참조

### 8.1 코드 (사실 근거)

- `src/main/java/com/coresolution/consultation/util/PersonalDataEncryptionUtil.java` — AES/CBC, `{keyId}::cipher` 포맷, dual-read
- `src/main/java/com/coresolution/consultation/util/PersonalDataEncryptionKeyProvider.java` — 환경변수 SSOT, KeyMaterial IV 1개 고정
- `src/main/java/com/coresolution/consultation/service/PersonalDataKeyRotationService.java` — 기존 회전 서비스 (5컬럼·트리거 0건)
- `src/main/java/com/coresolution/consultation/service/DormantPiiVaultService.java` — 휴면 vault 인터페이스 (회전 미구현)
- `src/main/java/com/coresolution/consultation/service/impl/DormantPiiVaultServiceImpl.java` — AES/GCM·random nonce·단일 키
- `src/main/resources/application.yml` 257-258 (dormant 키 매핑), 312-324 (PII 다중 키 매핑)
- `src/main/resources/db/migration/V20260330_001__extend_clients_columns_for_encrypted_pii.sql` — clients 카피본 근거
- `src/main/resources/db/migration/V20260606_004__create_dormant_user_pii_vault.sql` — 휴면 vault 테이블

### 8.2 운영 SSOT

- `deployment/mindgarden.prod-env.example` — 운영 env SSOT (PII 라인 추가 대상)
- `.github/workflows/deploy-production.yml` — 운영 배포 (PII env mapping 추가 대상)
- `.github/actions/sync-prod-env-key/action.yml` — composite action (PRESERVE 가드 확장 대상)

### 8.3 표준 문서

- [`SECRET_ROTATION_POLICY.md`](./SECRET_ROTATION_POLICY.md) v1.2.0 — 상위 정책 (§3.4 PII KEY/IV)
- [`PII_PROTECTION_STANDARD.md`](./PII_PROTECTION_STANDARD.md) — PII 분류·다중 키·백필
- [`ENCRYPTION_STANDARD.md`](./ENCRYPTION_STANDARD.md) — AES-256/CBC 표준
- [`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md) — env 파일 SSOT, PR-3 PII KEY/IV·DORMANT 이관
- [`SECURITY_STANDARD.md`](./SECURITY_STANDARD.md) — 보안 사고 처리

### 8.4 운영 이력 SSOT

- `docs/operations/secret-rotation-history.md` — 회전 이력 (Phase 4 시점 append 대상)

---

## 9. 변경 이력

| 일자(KST) | 버전 | 변경 | 작성 |
|---|---|---|---|
| 2026-06-14 | v1.0.0 (초안) | 설계서 신설 — §1 현황 사실관계 (1·2차 explore), §2 전략 비교, §3 옵션 B 상세 (Phase 0~4), §4 워크플로 골격, §5 위험·롤백, §6 9개 합의 항목, §7 일정 | MindGarden |
| 2026-06-15 | v1.1.0 | Phase 1 PR (회전 인프라 확장) 머지에 맞춰 §3.2 동기 갱신 — 구현 완료된 메서드 시그니처·진행률 테이블 schema 확정·admin endpoint 명세 추가, status enum 정리 (`RUNNING` → `IN_PROGRESS` + `SKIPPED` 신규), §3.2.2-A (accounts/branches 백필) / §3.2.2-B (dormant scan-only) / §3.2.5 (단위 테스트) 추가 | MindGarden |
