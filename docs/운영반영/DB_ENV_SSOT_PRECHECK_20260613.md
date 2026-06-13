# DB env SSOT 사전 점검 — 2026-06-13

> 본 문서는 운영 SSH 실측값 인벤토리이며, **secret 평문은 마스킹** 처리되어 있다 (`***SET***`/`***EMPTY***`/`***MASKED***`).  
> 후속 조치(수정·재시작·치환)는 **본 문서에서 일절 수행하지 않으며**, `core-coder` 위임 및 운영팀 합의로 진행한다.

## 0. 점검 환경

| 항목 | 값 |
|---|---|
| 점검 시각 | 2026-06-13 20:10 KST |
| 운영 호스트 | `beta74.cafe24.com` (= `secrets.PRODUCTION_HOST`) |
| 점검자 | core-coder (subagent, ssh read-only) |
| SSH 접속 | ✅ 성공 (`~/.ssh/beta74_cafe24` 사용) |
| 변경 명령 실행 여부 | ❌ 없음 (ls/cat/grep/awk 만) |
| 산출물 | 본 파일 1개 (`docs/운영반영/DB_ENV_SSOT_PRECHECK_20260613.md`) |

---

## 1. `/etc/mindgarden/prod.env`

| 항목 | 값 |
|---|---|
| 경로 | `/etc/mindgarden/prod.env` |
| 권한 / 소유자 | `-rw-------` / `root:root` |
| 크기 / mtime | 441 B / `Jun 12 14:01` |
| 키 개수 | **5개** |

### 1.1 키 목록 (전수)

```
DB_PASSWORD                          ***SET***
DB_READONLY_PASSWORD                 ***SET***
PRODUCTION_DB_PASSWORD               ***SET***
PRODUCTION_DB_PROCEDURE_PASSWORD     ***SET***
PRODUCTION_DB_PROCEDURE_USER         ***SET***
```

→ **DB 비밀번호류 5개 전용** 파일. `DB_HOST`/`DB_NAME`/`DB_USERNAME` 은 **여기에 없다.**

---

## 2. `/etc/mindgarden/prod-from-dev.env`

| 항목 | 값 |
|---|---|
| 경로 | `/etc/mindgarden/prod-from-dev.env` |
| 권한 / 소유자 | `-rw-------` / `root:root` |
| 크기 / mtime | 3,398 B / `Jun 13 18:02` (오늘) |
| 키 개수 | **62개** |
| 백업 파일 | `prod-from-dev.env.bak.*` **24개** 누적 (모두 2026-06-13 12:43~18:02 범위) |

> ⚠️ 오늘 하루 동안 24회의 백업이 누적되었다 — `*_db_keys_restored` 백업명이 포함된 것으로 보아, workflow `deploy-production.yml` 의 DB 키 PRESERVE/RESTORE 가드가 반복 작동 중인 정황. 별도 안정화 분석 필요.

### 2.1 키 목록 (62개, 전수)

```
APPLE_ALLOWED_AUDIENCES              APPLE_CLIENT_ID
APPLE_CLIENT_SECRET                  APPLE_KEY_ID
APPLE_PRIVATE_KEY                    APPLE_REDIRECT_URI
APPLE_REGISTERED_URLS                APPLE_TEAM_ID
COMPANY_URL                          CORS_ALLOWED_ORIGINS
DB_HOST                              DB_NAME
DB_USERNAME                          FRONTEND_BASE_URL
GOOGLE_CLIENT_ID                     GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI                  GOOGLE_REGISTERED_URLS
JWT_EXPIRATION                       JWT_REFRESH_EXPIRATION
JWT_SECRET                           KAKAO_ALIMTALK_ENABLED
KAKAO_ALIMTALK_PROVIDER              KAKAO_ALIMTALK_SIMULATION_MODE
KAKAO_CLIENT_ID                      KAKAO_CLIENT_SECRET
KAKAO_REDIRECT_URI                   KAKAO_REGISTERED_URLS
LEGACY_URL                           MAIL_DEBUG
MAIL_HOST                            MAIL_PASSWORD
MAIL_PORT                            MAIL_USERNAME
NAVER_CLIENT_ID                      NAVER_CLIENT_SECRET
NAVER_REDIRECT_URI                   NAVER_REGISTERED_URLS
NOTIFICATION_BATCH_ALIMTALK_ENABLED  ONBOARDING_URL
OPS_ADMIN_PASSWORD                   OPS_ADMIN_ROLE
OPS_ADMIN_USERNAME                   PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID
PERSONAL_DATA_ENCRYPTION_IV          PERSONAL_DATA_ENCRYPTION_KEY
PROFILE_IMAGE_UPLOAD_DIR             PSYCH_DOC_KEY_B64
SERVER_BASE_URL                      SERVER_PORT
SESSION_COOKIE_DOMAIN                SMS_API_KEY
SMS_API_SECRET                       SMS_AUTH_ENABLED
SMS_PROVIDER                         SMS_SENDER_NUMBER
SMS_TEST_MODE                        SOLAPI_ALIMTALK_PFID
WEBAUTHN_CHALLENGE_TIMEOUT           WEBAUTHN_RP_ID
```

---

## 3. 두 env 파일 키 diff

| 분류 | 키 개수 | 비고 |
|---|---|---|
| `prod.env` 전용 | **5개** | DB_PASSWORD, DB_READONLY_PASSWORD, PRODUCTION_DB_PASSWORD, PRODUCTION_DB_PROCEDURE_PASSWORD, PRODUCTION_DB_PROCEDURE_USER |
| `prod-from-dev.env` 전용 | **62개** | §2.1 목록 |
| **공통 키** | **0개** | 두 파일은 **상호 보완적 (mutually disjoint)** — 키 중복 없음 |

→ 두 파일은 키 set 이 완전히 분리되어 있어, **fingerprint 비교가 불필요**.  
→ 다만 **systemd unit `Environment=` 와의 충돌은 §4.3** 참조.

---

## 4. systemd unit 현황

### 4.1 메인 unit (2개) + drop-in (8개)

| 종류 | 파일 |
|---|---|
| unit (blue/green) | `/etc/systemd/system/mindgarden-core-blue.service`<br>`/etc/systemd/system/mindgarden-core-green.service` |
| drop-in (blue) | `50-expo-push.conf`, `90-envfile.conf`, `91-instance-id.conf`, `92-lifecycle-phase3-4-5.conf` |
| drop-in (green) | `50-expo-push.conf`, `90-envfile.conf`, `91-instance-id.conf`, `92-lifecycle-phase3-4-5.conf` |

### 4.2 `EnvironmentFile=` 인용 (전수)

| 위치 | 경로 | 옵셔널 |
|---|---|---|
| `mindgarden-core-{blue,green}.service` | `/etc/mindgarden/prod.env` | 필수 |
| `50-expo-push.conf` | `/etc/mindgarden/expo-push.env` | ✓ (`-` prefix) |
| `90-envfile.conf` | `/etc/mindgarden/prod-from-dev.env` | 필수 |

→ systemd 의 적용 순서는 본체 → drop-in lexical (`50-` → `90-` → `91-` → `92-`).  
→ 후순위 EnvironmentFile 이 동일 키를 덮어쓰며, **마지막에 `Environment=` 행이 모두를 덮어쓴다.**

### 4.3 `Environment=` 인용 (값 마스킹, blue/green 동일 — 23개)

| 키 | 값 (마스킹) | 비고 |
|---|---|---|
| `PERSONAL_DATA_ENCRYPTION_KEY` | `***MASKED*** (PII 암호화 키)` | 🔴 SECRET — unit 평문 |
| `PERSONAL_DATA_ENCRYPTION_IV` | `***MASKED*** (PII 암호화 IV)` | 🔴 SECRET — unit 평문 |
| `DB_HOST` | `localhost` | 일반 |
| `DB_PORT` | `3306` | 일반 |
| `DB_NAME` | `core_solution` | 일반 |
| `DB_USERNAME` | `mindgarden` | 일반 |
| `REDIS_HOST` | `localhost` | 일반 |
| `REDIS_PORT` | `6379` | 일반 |
| `OAUTH2_BASE_URL` | `https://core-solution.co.kr` | 일반 |
| `FRONTEND_BASE_URL` | `https://mindgarden.core-solution.co.kr` | 일반 |
| `SERVER_BASE_URL` | `https://core-solution.co.kr` | 일반 |
| `JWT_SECRET` | `***MASKED*** (로컬 개발용 secret 명칭 포함)` | 🔴🔴 SECRET — unit 평문 (로컬 키 의심) |
| `SESSION_DUPLICATE_LOGIN_CHECK_ASK_USER_CONFIRMATION` | `true` | 일반 |
| `SERVER_SERVLET_SESSION_COOKIE_SECURE` | `true` | 일반 |
| `SERVER_SERVLET_SESSION_COOKIE_SAME_SITE` | `none` | 일반 |
| `SESSION_COOKIE_DOMAIN` | `core-solution.co.kr` | 일반 |
| `KAKAO_CLIENT_ID` | `***MASKED*** (32자)` | 🔴 SECRET — unit 평문 |
| `KAKAO_CLIENT_SECRET` | `***MASKED*** (32자)` | 🔴 SECRET — unit 평문 |
| `KAKAO_REDIRECT_URI` | `https://core-solution.co.kr/api/auth/kakao/callback` | 일반 |
| `NAVER_CLIENT_ID` | `***MASKED*** (20자)` | 🔴 SECRET — unit 평문 |
| `NAVER_CLIENT_SECRET` | `***MASKED*** (10자)` | 🔴 SECRET — unit 평문 |
| `NAVER_REDIRECT_URI` | `https://core-solution.co.kr/api/auth/naver/callback` | 일반 |

drop-in `91-instance-id.conf` (blue/green 차이):

- blue: `APP_INSTANCE_ID=blue` / green: `APP_INSTANCE_ID=green`

drop-in `92-lifecycle-phase3-4-5.conf` (blue/green 동일, 8개):

| 키 | 값 | 비고 |
|---|---|---|
| `MINDGARDEN_SCHEDULER_DORMANT_BATCH_DRY_RUN` | `true` | |
| `MINDGARDEN_SCHEDULER_ANONYMIZE_BATCH_DRY_RUN` | `true` | |
| `MINDGARDEN_SCHEDULER_DORMANT_PRE_NOTICE_DRY_RUN` | `true` | |
| `MINDGARDEN_DORMANT_PII_ENC_KEY` | `***MASKED*** (base64)` | 🔴 SECRET — unit 평문 |
| `MINDGARDEN_LIFECYCLE_BUSINESS_MODE` | `NON_MEDICAL` | |
| `MINDGARDEN_COMMUNITY_ANONYMIZATION_ENABLED` | `true` | |
| `MINDGARDEN_SCHEDULER_WITHDRAWAL_GRACE_DRY_RUN` | `true` | |
| `MINDGARDEN_SCHEDULER_ADMIN_DELETE_RETENTION_DRY_RUN` | `true` | |

### 4.4 키 충돌 — `Environment=` vs `prod-from-dev.env`

| 충돌 키 | unit `Environment=` 값 | `prod-from-dev.env` 값 | 실제 적용 (Environment= 승리) |
|---|---|---|---|
| `DB_HOST` | `localhost` | `***SET***` | unit `localhost` |
| `DB_NAME` | `core_solution` | `***SET***` | unit `core_solution` |
| `DB_USERNAME` | `mindgarden` | `***SET***` | unit `mindgarden` |
| `JWT_SECRET` | `***MASKED***` | `***SET***` | unit |
| `PERSONAL_DATA_ENCRYPTION_KEY` | `***MASKED***` | `***SET***` | unit |
| `PERSONAL_DATA_ENCRYPTION_IV` | `***MASKED***` | `***SET***` | unit |
| `FRONTEND_BASE_URL` | `https://mindgarden...` | `***SET***` | unit |
| `SERVER_BASE_URL` | `https://core-solution...` | `***SET***` | unit |
| `SESSION_COOKIE_DOMAIN` | `core-solution.co.kr` | `***SET***` | unit |
| `KAKAO_CLIENT_ID` | `***MASKED***` | `***SET***` | unit |
| `KAKAO_CLIENT_SECRET` | `***MASKED***` | `***SET***` | unit |
| `KAKAO_REDIRECT_URI` | `***SET***` | `***SET***` | unit |
| `NAVER_CLIENT_ID` | `***MASKED***` | `***SET***` | unit |
| `NAVER_CLIENT_SECRET` | `***MASKED***` | `***SET***` | unit |
| `NAVER_REDIRECT_URI` | `***SET***` | `***SET***` | unit |

→ **충돌 키 15개, 전부 unit `Environment=` 가 승리** (systemd 우선순위 규칙).  
→ workflow 가 `prod-from-dev.env` 의 KAKAO/NAVER/JWT/PII 키를 갱신해도 **운영 실효 값은 변하지 않는다** (boot loop 재발 의심 → §7 참조).

### 4.5 키 충돌 — `Environment=` vs `prod.env`

→ **충돌 0개** (prod.env 는 DB 비밀번호 전용, unit Environment= 에는 비밀번호 없음).

### 4.6 2026-06-09 cleanup 이후 drop-in 재부활 여부

| 항목 | 결과 |
|---|---|
| `90-prod-from-dev-envfile.conf` 존재 | ❌ 없음 (2026-06-09 cleanup 이후 제거 확정) |
| **`90-envfile.conf`** 존재 | **✅ 살아있음** (`EnvironmentFile=/etc/mindgarden/prod-from-dev.env`) |
| 결론 | drop-in 파일 **이름만 다르고 기능 동일**. 사실상 동일 역할의 drop-in 이 재부활. SSOT 결정 시 본 파일도 함께 정리해야 함. |

---

## 5. `deploy-production.yml` 흐름 요약 (선행 1차 인용 + 본 회차 확인)

- workflow line **1022** (apple-secrets-sync job) / **1207** (google-secrets-sync job): `PROD_ENV_FILE=/etc/mindgarden/prod-from-dev.env` 를 SSOT 로 갱신 + 양쪽 BG 슬롯 재시작.
- workflow line **1070~1151 / 1258~1323** (PR #296 가드): `prod-from-dev.env` 의 `DB_HOST` / `DB_NAME` / `DB_USERNAME` **3 키만** PRESERVE → 신규 컨텐츠 쓰기 → RESTORE → FAIL-FAST.
- `docs/standards/*` 의 SSOT 표기는 여전히 **`prod.env`** 로 명시되어 있어 **3-way 불일치**:
  - workflow SSOT: `prod-from-dev.env`
  - 표준 문서 SSOT: `prod.env`
  - 실제 systemd 유효 값: **unit `Environment=` 가 15개 키에 대해 양쪽을 모두 덮어쓰기** (4.4)

---

## 6. SSOT 통일 방안 — 3안 비교 + 권장

| 안 | 설명 | BE 재시작 | 무중단 가능 | 롤백 비용 | secret 노출 위험 |
|---|---|---|---|---|---|
| **안1** | `docs/standards/*` 만 `prod-from-dev.env` 로 정정 (코드/unit 무수정) | 없음 | ✅ | 低 (문서 revert) | 변동 없음 (여전히 unit 평문) |
| **안2** | `prod.env` → `prod-from-dev.env` symlink 통일 (또는 역방향) | 1회 (`daemon-reload`) | ✅ blue/green 순차 | 中 (심볼릭 링크 복구) | 변동 없음 |
| **안3** | unit `Environment=` 의 15개 충돌 키 **제거** → `prod-from-dev.env` SSOT 로 일원화 | 1회 (`daemon-reload` + BG 슬롯 재시작) | ✅ blue/green 순차 | 中 (이전 unit 백업 복구) | 🟢 **현저히 감소** (unit 평문 제거) |

### 권장: **안2 + 안3 병행** (선행 1차 잠정 권장안 재확인)

- **근거 1**: workflow 가 이미 `prod-from-dev.env` 를 운영 SSOT 로 동작 → 표준 문서와 unit 둘 다 이쪽으로 수렴해야 정합.
- **근거 2**: unit `Environment=` 의 평문 secret (JWT_SECRET, KAKAO/NAVER/PII 키) 은 보안 게이트(§4.3, 운영 반영 전 하드코딩 검사) 위배. **안3 미시행 시 운영 반영 차단 사유**.
- **근거 3**: 두 env 파일은 키 set 이 완전 분리(§3)되어 있으므로 **symlink 만으로는 부족** → 안3 으로 unit 평문 정리 병행 필수.
- **근거 4**: `prod.env` 에 DB 비밀번호류 5개만 남아있어, `prod-from-dev.env` 로의 통합 시 DB_PASSWORD 등을 prod-from-dev 로 옮기거나 별도 `prod-db.env` 로 분리하는 결정이 추가로 필요. (§7 합의 항목)

---

## 7. 다음 단계

### 7.1 운영팀 합의 필요 항목

- [ ] **SSOT 단일화 방향 확정**: `prod-from-dev.env` 단일 vs `prod.env`+`prod-db.env` 분리 vs 통합.
- [ ] **unit `Environment=` 15개 키 제거 합의** (특히 secret 5개: `JWT_SECRET` / `PERSONAL_DATA_ENCRYPTION_KEY|IV` / `KAKAO_CLIENT_SECRET` / `NAVER_CLIENT_SECRET` / `MINDGARDEN_DORMANT_PII_ENC_KEY`).
- [ ] **`JWT_SECRET` 가 로컬 개발 키 명칭 (`...-local-development-only`)** 인지 즉시 확인 → 사실이면 **운영 secret 재발급 + 전 사용자 토큰 무효화** 비상 작업.
- [ ] **오늘(2026-06-13) `prod-from-dev.env` 24회 백업** 원인 합의: workflow `secrets-sync` job 의 idempotent 보장 여부 + DB 키 PRESERVE/RESTORE 가드 반복 trip 원인.
- [ ] `docs/standards/*` 의 SSOT 표기 일괄 정정.
- [ ] `prod.env` ↔ `prod-from-dev.env` symlink 정책 (안2) 적용 여부.

### 7.2 `core-coder` 위임 시 전달할 핵심 정보

- **수정 대상 (운영 서버, root)**:
  - `/etc/systemd/system/mindgarden-core-blue.service` (Environment= 15개 행 제거)
  - `/etc/systemd/system/mindgarden-core-green.service` (Environment= 15개 행 제거)
  - 안2 채택 시: `/etc/mindgarden/prod-from-dev.env` ↔ `/etc/mindgarden/prod.env` symlink 결정에 따른 파일 재배치.
- **수정 대상 (저장소)**:
  - `docs/standards/*` 의 SSOT 표기 → `prod-from-dev.env` 로 통일.
  - `.github/workflows/deploy-production.yml` PR #296 가드 (line 1070~1151 / 1258~1323) 의 보호 키 set 확장 검토 (현재 DB_HOST/DB_NAME/DB_USERNAME 3 키만).
- **완료 조건**:
  1. blue/green 두 unit 의 `systemctl cat mindgarden-core-blue.service` 결과에 secret 평문 `Environment=` 0건.
  2. `/etc/mindgarden/prod-from-dev.env` 의 모든 키가 BE 런타임에 실효(actuator/env 또는 동일 검증 수단).
  3. blue→green 무중단 cutover 검증 (`/actuator/health` UP, 외부 HTTPS 200).
  4. `prod-from-dev.env.bak.*` 24개 백업이 더 이상 분당 단위로 증식하지 않음 (workflow idempotent 회복).
  5. 저장소 `rg -i 'prod\.env' docs/standards/` 결과 0 또는 명시 deprecated.
- **참조 문서 (위임 프롬프트에 그대로 인용)**:
  - 본 문서 (`docs/운영반영/DB_ENV_SSOT_PRECHECK_20260613.md`)
  - `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17 (하드코딩 게이트)
  - `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
  - `docs/standards/BRANCH_DEPRECATION.md` (현재 diff 중)
  - `.github/workflows/deploy-production.yml` (line 1022 / 1070 / 1207 / 1258)

### 7.3 무중단 배포 윈도우 권장 시각

- **권장**: 평일 오전 04:00~05:30 KST (트래픽 최저, blue→green 순차 cutover 여유 확보).
- **차선**: 평일 14:00~15:00 KST (점심 직후, 운영팀 즉시 대응 가능 시간대).
- **금지**: 금요일 18시 이후, 주말, 공휴일 전일.

---

## 부록 A. 점검 명령 (운영팀 재실행용, 읽기 전용)

```bash
ssh beta74.cafe24.com 'bash -s' <<'EOF'
echo "===PROD_ENV==="
ls -l /etc/mindgarden/prod.env 2>/dev/null
echo "===PROD_FROM_DEV_ENV==="
ls -l /etc/mindgarden/prod-from-dev.env 2>/dev/null
echo "===PROD_KEYS==="
sudo awk -F= '/^[A-Z_][A-Z_0-9]*=/ {print $1}' /etc/mindgarden/prod.env 2>/dev/null | sort
echo "===PFD_KEYS==="
sudo awk -F= '/^[A-Z_][A-Z_0-9]*=/ {print $1}' /etc/mindgarden/prod-from-dev.env 2>/dev/null | sort
echo "===UNITS==="
ls /etc/systemd/system/mindgarden-core-*.service 2>/dev/null
echo "===DROPINS==="
ls /etc/systemd/system/mindgarden-core-*.service.d/*.conf 2>/dev/null
echo "===UNIT_ENV==="
sudo grep -HE '^(Environment|EnvironmentFile)=' \
  /etc/systemd/system/mindgarden-core-*.service \
  /etc/systemd/system/mindgarden-core-*.service.d/*.conf 2>/dev/null
EOF
```

## 부록 B. 후속 fingerprint 비교 명령 (안2 검토 시)

```bash
# 동일 키가 두 파일에 모두 존재하는 경우 sha256 앞 8자 비교 — 본 회차에는 공통 키 0개라 미실행.
for KEY in DB_HOST DB_NAME DB_USERNAME JWT_SECRET PERSONAL_DATA_ENCRYPTION_KEY; do
  V1=$(sudo grep -E "^${KEY}=" /etc/mindgarden/prod.env 2>/dev/null | head -1 | cut -d= -f2-)
  V2=$(sudo grep -E "^${KEY}=" /etc/mindgarden/prod-from-dev.env 2>/dev/null | head -1 | cut -d= -f2-)
  echo "${KEY}: prod=$(echo -n "$V1" | sha256sum | cut -c1-8) pfd=$(echo -n "$V2" | sha256sum | cut -c1-8)"
done
```

---

**점검 종료** — 본 문서는 정보 수집·인벤토리만 담는다. 모든 후속 변경은 운영팀 합의 + `core-coder` 위임 + `core-tester` 게이트를 거친다.
