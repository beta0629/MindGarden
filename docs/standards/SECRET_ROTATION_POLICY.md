# Secret 회전 정책

**버전**: 1.3.0
**최종 업데이트**: 2026-06-15
**상태**: 공식 표준 (P0 표준 5종 묶음)
**변경 요지 (v1.3.0)**: 회전 자동화 v2 — `ROTATION_SECRETS_PAT` 만료 알림(`check-pat-expiry.yml`) + 분기 자동 회전 트리거(`quarterly-secret-rotation-trigger.yml`) + prod Environment protection 가이드(`docs/operations/prod-environment-protection.md`) 신설. §8 "자동화" 신설로 SSOT 분리, 후속 §9~§12 재번호.
**이전 변경 (v1.2.0)**: DB_PASSWORD 자동 회전 워크플로(`rotate-db-password.yml`) 신설에 따라 §3.3 을 수동 절차에서 자동화 절차 + DBA 협업 절차로 전면 개정. PR #331 health 게이트 패턴(연속 5회 UP + grace 120s + deploy run watch) 동일 적용.
**이전 변경 (v1.1.0)**: JWT_SECRET 자동 회전 워크플로(`rotate-jwt-secret.yml`) 신설에 따른 자동화 절차·강도 정책 SSOT·이력 SSOT 분리 보완. JWT_SECRET P0 사고(2026-06-13) 후속.

## 1. 정책 개요

운영(`production`) 의 모든 secret 은 **정기 회전** 한다. 회전 주기·승인 경로·롤백 절차를 표준화하여 회귀·평문 노출·미회전 누적을 차단한다.

**자동화 범위 (v1.3.0 시점)**: `JWT_SECRET`(§3.1) / `KAKAO_CLIENT_SECRET`·`NAVER_CLIENT_SECRET`(§3.2) / `DB_PASSWORD`(§3.3) 회전 워크플로 신설 완료. 회전 인프라(만료 알림·분기 자동 트리거·prod Environment 보호)는 §8 자동화 섹션 단일 SSOT 로 관리한다. `PII_KEY`/`PII_IV` 는 **재암호화 마이그레이션이 필요하므로 자동화 범위 외**(§3.4 별도 절차).

## 2. 회전 대상·주기

| Secret | 주기 | 근거 |
|---|---|---|
| `JWT_SECRET` | **분기 1회** (Q1·Q2·Q3·Q4 초) | 토큰 위조·세션 탈취 시 영향 광범위 |
| `KAKAO_CLIENT_SECRET` | **분기 1회** | 카카오 CS 권고 + 소셜 로그인 핵심 |
| `NAVER_CLIENT_SECRET` | **분기 1회** | 네이버 CS 권고 + 소셜 로그인 핵심 |
| `DB_PASSWORD` (`mindgarden`, `mindgarden_readonly`, `mindgarden_procedure`) | **분기 1회** | DB 계정별 분리 회전, blue/green 양 슬롯 동시 적용 |
| `PERSONAL_DATA_ENCRYPTION_KEY` | **연 1회** (다중 키 v1→v2→...) | AES-256 PII 키, 복호화 호환 유지 |
| `PERSONAL_DATA_ENCRYPTION_IV` | **연 1회** (KEY 와 동시) | IV 단독 회전 금지 |
| `MINDGARDEN_DORMANT_PII_ENC_KEY` | **연 1회** | 휴면 PII 키, KEY 와 동시 회전 |
| 기타 OAuth (Google·Apple) | **연 1회** | 변경 시 콘솔 동기화 필요 |

`PERSONAL_DATA_ENCRYPTION_KEYS=v2:...,v1:...` 형식의 **다중 키 등록** 으로 복호화 호환을 유지한다 (`PersonalDataEncryptionKeyProvider`).

### 2.1 강도 정책 SSOT

운영 부트 가드 [`JwtSecretValidator`](../../src/main/java/com/coresolution/core/security/JwtSecretValidator.java) 가 본 정책의 **JWT_SECRET 강도 SSOT** 이다.

- 길이: 64자 이상 ~ 512자 이하 (`openssl rand -hex 64` 권장 = 128자 hex)
- 인코딩: `^[0-9a-fA-F]+$` (hex) 또는 `^[A-Za-z0-9+/_\-]+={0,2}$` (base64/base64url)
- 약 단어 차단 (부분 일치, 대소문자 무관): `local`, `dev`, `development`, `secret-key`, `secret_key`, `secretkey`, `changeme`, `change-me`, `test`, `example`, `mindgarden`, `coresolution`
- 위반 시 운영 동치 프로파일(`prod`, `production`, `staging`, 무프로파일)에서 부트 중단(`IllegalStateException`)

워크플로 `rotate-jwt-secret.yml` 의 inline 검증 step 이 위 정책을 셸 레벨에서 1차 실행한 뒤 GH Secrets 갱신을 진행한다 — **BE 부트 가드에 도달하기 전 단계에서 차단**.

`DB_PASSWORD` 강도 권장: 32자 이상, 영문 대/소문자·숫자·기호 3종 이상 혼합 (`openssl rand -base64 32 | tr -d '+/=' | head -c 40`).

## 3. 회전 절차

본 절차는 JWT_SECRET 자동 회전 기준이다. 다른 secret(KAKAO/NAVER/DB_PASSWORD/PII KEY)은 §3.2 ~ §3.4 차이만 추가한다.

### 3.1 JWT_SECRET — 자동 회전 (워크플로 신설)

워크플로: [`.github/workflows/rotate-jwt-secret.yml`](../../.github/workflows/rotate-jwt-secret.yml)

| Phase | 단계 | 자동/수동 |
|---|---|---|
| 0 | **승인** — Repo Admin + 운영팀 리드 2인 승인 (P0 채널) | 수동 |
| 1 | **신규 키 생성** (`openssl rand -hex 64`) | 워크플로 자동 |
| 2 | **JwtSecretValidator 정책 inline 검증** (§2.1) | 워크플로 자동 |
| 3 | **GH Environment Secret 갱신** (`gh secret set JWT_SECRET --env <env>`) | 워크플로 자동 (PAT 필요) |
| 4 | **환경별 BE 재배포 트리거** (`deploy-backend-dev` / `deploy-production`) | 워크플로 자동 |
| 5 | **`/actuator/health` UP 30회 polling** (10초 간격) | 워크플로 자동 |
| 6 | **회전 결과 요약** (구 SHA prefix → 신 SHA prefix, 평문 금지) | 워크플로 자동 |
| 7 | **회전 이력 자동 append + PR 생성** (`docs/operations/secret-rotation-history.md`) | 워크플로 자동 |
| 8 | **사후 검증** (§5 체크리스트) | 수동 (`core-tester`) |
| 9 | **구 키 폐기** (cutover 후 N=7일, refresh token 만료 주기) | 수동 |

#### 워크플로 트리거

```bash
# dev 환경 정기 회전
gh workflow run rotate-jwt-secret.yml \
  -f environment=dev \
  -f confirm=ROTATE \
  -f trigger_reason=정기

# prod 환경 정기 회전 (confirm 2단계)
gh workflow run rotate-jwt-secret.yml \
  -f environment=prod \
  -f confirm=ROTATE \
  -f confirm_prod=PROD_ROTATE \
  -f trigger_reason=정기
```

운영(`prod`) 회전은 반드시 `dev` 회전이 24시간 무사고 통과한 뒤에만 실행한다.

#### 사전 조건 — `ROTATION_SECRETS_PAT`

GitHub `secrets:write` 권한은 GITHUB_TOKEN 으로는 부여되지 않는다. `secrets.ROTATION_SECRETS_PAT` (repo scope: `secrets:write`, `actions:write`, `contents:write`, `pull-requests:write`) PAT 를 GH Repo Secret 으로 사전 등록해야 한다. 미설정 시 워크플로의 `🔐 GH Environment Secret 갱신` step 이 `::error` 로 즉시 종료된다.

### 3.2 KAKAO / NAVER / OAuth (Google · Apple) — 수동

1. 외부 IdP 콘솔(카카오/네이버/Google Cloud/Apple Developer)에서 신규 시크릿 발급
2. GH Secrets 갱신: `gh secret set <KEY> --env <env> --body "$NEW"` (수동, 외부 콘솔 발급 직후)
3. 운영 배포 워크플로 재실행 (`workflow_dispatch` 수동)
4. 콜백 URL로 실제 로그인 1건 수행하여 토큰 발급 정상 확인 (`core-tester`)
5. 구 시크릿은 콘솔에서 **즉시 폐기** (외부 IdP는 자체 무효화가 즉시 효력)

후속 PR에서 외부 콘솔 회전 후 GH Secrets 동기 단계를 자동화한다(예: `rotate-social-secrets.yml`).

### 3.3 DB_PASSWORD — 자동 회전 (워크플로 신설) + DBA 협업

워크플로: [`.github/workflows/rotate-db-password.yml`](../../.github/workflows/rotate-db-password.yml)

| Phase | 단계 | 자동/수동 |
|---|---|---|
| 0 | **DBA 협업 사전 통지** — 24h 사전 통지 후 `confirm_dba=DBA_APPROVED` 입력 | 수동 |
| 1 | **신규 패스워드 생성** (`openssl rand -base64 48` + 위험 문자 strip, 36자 고정) | 워크플로 자동 |
| 2 | **강도 검증** (길이 ≥ 24, 영문 대/소문자·숫자 3종 혼합, 위험 문자 차단) | 워크플로 자동 |
| 3 | **SSH 로 운영 MySQL `ALTER USER ... IDENTIFIED BY ...` 실행** (계정별 분리) | 워크플로 자동 (prod 만) |
| 4 | **신 패스워드로 `SELECT 1` 라이브 검증** (mysql `--defaults-extra-file` stdin 인증) | 워크플로 자동 |
| 5 | **(mindgarden 회전 시) `/etc/mindgarden/prod.env` `DB_PASSWORD` 동기 갱신** (PR #303 PRESERVE/RESTORE 가드 인라인) | 워크플로 자동 |
| 6 | **GH Environment Secret 갱신** (`PRODUCTION_DB_PASSWORD` / `_READONLY_PASSWORD` / `_PROCEDURE_PASSWORD`) | 워크플로 자동 (PAT 필요) |
| 7 | **(mindgarden) BE blue/green 재기동** (`deploy-production.yml` dispatch + `gh run watch --exit-status`) | 워크플로 자동 |
| 8 | **(mindgarden) `/actuator/health` 연속 5회 UP polling** (grace 120s + 15s × 30회, PR #331 패턴) | 워크플로 자동 |
| 9 | **회전 이력 자동 append + PR 생성** (`docs/operations/secret-rotation-history.md`) | 워크플로 자동 |
| 10 | **사후 검증** (§5 체크리스트 + DBA 모니터링 도구 동작) | 수동 (`core-tester`) |
| 11 | **24h grace 후 구 패스워드 명시적 거절** (DBA 운영) | 수동 |

> readonly/procedure 회전은 BE 미사용이므로 step 5·7·8 모두 skip 한다.
> SYSTEM_USER + ALL PRIVILEGES 권한 보유 `mindgarden_procedure` 는 패스워드만 회전하며 GRANT 절을 절대 포함하지 않는다.

#### 워크플로 트리거

```bash
# dev 환경 정기 회전 (readonly 사용자)
gh workflow run rotate-db-password.yml \
  -f environment=dev \
  -f user=mindgarden_readonly \
  -f confirm=ROTATE \
  -f confirm_dba=DBA_APPROVED \
  -f trigger_reason=정기

# prod 환경 정기 회전 (mindgarden 메인, confirm 3단계)
gh workflow run rotate-db-password.yml \
  -f environment=prod \
  -f user=mindgarden \
  -f confirm=ROTATE \
  -f confirm_prod=PROD_ROTATE \
  -f confirm_dba=DBA_APPROVED \
  -f trigger_reason=정기
```

운영(`prod`) 회전은 반드시 `dev` 회전이 24시간 무사고 통과한 뒤에만 실행한다.
3종 사용자 동시 회전이 필요하면 `user=ALL` 을 사용하되, mindgarden 단독 회전을 권장한다 (BE 영향 격리).

#### DBA 협업 절차

1. **T-24h**: DBA·운영팀 슬랙(`#dba`/`#oncall`) 에 회전 시각·대상 사용자·트리거 사유 공유
2. **T-1h**: DBA 가 백업 (`mysqldump`) + 현재 패스워드 vault 백업 완료 확인
3. **T+0**: 운영팀이 `confirm_dba=DBA_APPROVED` 입력 후 워크플로 트리거
4. **T+회전 종료**: DBA 사후 검증
   - DB 가 새 패스워드로 정상 UP
   - 라이브 `SELECT 1` 1회 수동 로그인 (mindgarden 메인)
   - 모니터링 도구 (readonly) / 프로시저 배포 도구 (procedure) 동작 확인
5. **T+24h**: 구 패스워드 명시적 거절 확인 (필요 시 `ALTER USER` 재확인)

#### 사전 조건

- `secrets.ROTATION_SECRETS_PAT` — `secrets:write`, `actions:write`, `contents:write`, `pull-requests:write` (§3.1 PAT 공유)
- `secrets.PRODUCTION_HOST` / `PRODUCTION_USER` / `PRODUCTION_SSH_KEY` — `deploy-production.yml` 과 동일 set 재사용 (별도 PROD_SSH_* 등록 불필요)
- 운영 DB 는 socket peer-auth (`sudo mysql`) 로 root 접속 가능해야 한다 (워크플로는 root 패스워드를 모름 — `--defaults-extra-file` stdin 인증).

#### 핵심 안전 원칙 (절대 금지)

- ALTER USER 의 `IDENTIFIED BY` 절 외 `GRANT` / `REVOKE` / `WITH SYSTEM_USER` 등 권한 변경 절대 포함 금지
- 구 패스워드 평문 자동 백업 금지 — DBA · 운영팀 vault 백업이 사전 조건
- 회전 직후 cutover 원자성이 핵심 (prod.env 갱신 → BE 재기동 → health 게이트 통과 전까지 단일 트랜잭션처럼 처리)
- prod 환경 confirm 3단계 (`ROTATE` + `PROD_ROTATE` + `DBA_APPROVED`) 우회 금지

### 3.4 PII KEY / IV — 자동화 범위 외

> **회전 시 기존 데이터 재암호화 마이그레이션이 필요**하므로 본 정책의 자동 회전 대상이 아니다. 별도 설계서 작성 후 진행한다.

#### 사전 설계 필수 항목

1. 이중 키(`PERSONAL_DATA_ENCRYPTION_KEYS=v2:...,v1:...`) 운영 — 신규 키 도입 직후에도 기존 row 복호화 보장
2. `BaseEntity` 또는 PII 컬럼별로 **암호화 키 버전 식별자**(`enc_key_version` 등) 보유 여부 확인
3. 재암호화 배치 잡 설계 — 트랜잭션 단위, 청크 크기, 실패 시 롤백 시나리오, 운영 부하
4. PII_IV 회전은 IV 재생성 + 재암호화가 동반된다 — `PII_KEY` 회전보다 비용이 크다

#### 실행 절차 (요약, 별도 설계서 작성 후 진행)

1. 신규 키 생성 → `PERSONAL_DATA_ENCRYPTION_KEYS=vNEW:...,vCURRENT:...` 로 등록 (병존)
2. 재암호화 배치 실행 (운영 트래픽 영향 최소화 시간대)
3. 검증 후 `vNEW` 를 current 로 승격, 기존 키는 180일 보존 후 폐기
4. 휴면 PII (`MINDGARDEN_DORMANT_PII_ENC_KEY`) 도 동일 절차 동시 진행

## 4. 비상 회전 (P0 노출 시 즉시 절차)

> **트리거 조건**: 시크릿 평문 유출 정황, 약한 키 운영 노출(JWT_SECRET P0 같은 케이스: [`JWT_SECRET_P0_HANDOFF_20260613.md`](../운영반영/JWT_SECRET_P0_HANDOFF_20260613.md)), 내부 인사 권한 변경, 의심 인증 활동.

### 4.1 즉시 (T+0 ~ T+30분)

1. Slack `#security` / `#oncall` 채널에 비상 회전 선언 (시크릿명·환경·트리거 사유만, 값 절대 금지)
2. 영향 범위 식별 — 어떤 토큰/세션이 노출 가능한지 매핑
3. `rotate-jwt-secret.yml` 등 해당 시크릿 워크플로 `environment=prod` + `trigger_reason=비상` 실행
4. 워크플로 완료 직후 헬스/로그인 sanity 1건 확인

### 4.2 단기 (T+30분 ~ T+24시간)

1. 노출 가능 토큰 전수 무효화 필요 시 — `refresh_token` 테이블 전수 무효화 SQL 실행:
   ```sql
   UPDATE refresh_token SET revoked = true, revoked_at = NOW() WHERE revoked = false;
   ```
2. 어드민 계정 강제 재로그인 처리 (공통 코드 OPS API)
3. 외부 IdP 연동 시 — Kakao/Naver/Apple/Google 콘솔에서도 동일 회전 절차 병행

### 4.3 사후 (T+1일 ~ T+7일)

1. P0 사후 분석 문서 `docs/운영반영/<DATE>_<SECRET>_P0_POSTMORTEM.md` 작성
2. 재발 방지 가드 추가 (부트 가드, 워크플로 사전 검증, CI 정적 분석 규칙)
3. 회전 이력 표(`docs/operations/secret-rotation-history.md`) 의 "트리거" 열을 `비상` 으로 기록

## 5. 사후 검증 체크리스트

회전 워크플로(또는 수동 회전) 완료 후 아래 항목을 반드시 통과한다.

- [ ] **헬스**: `/actuator/health` `{"status":"UP"}` 30회 polling 안에 1회 이상 응답
- [ ] **로그인**: 테스트 계정 1건 로그인 → access token 발급 → 보호 API 1건 200 응답
- [ ] **구 토큰 거절**: 회전 직전 발급된 access token 으로 보호 API 호출 시 401/403 (HS256 키 변경)
- [ ] **에러율**: 회전 후 5분간 5xx 비율 < 회전 직전 1시간 평균의 2배
- [ ] **로그 평문 미노출**: 워크플로 로그·BE 로그에 시크릿 평문이 없음 (`grep -F` 로 prefix 4자 검색 시 0건)
- [ ] **이력 기록**: `docs/operations/secret-rotation-history.md` 신규 행이 PR로 머지됨

운영(prod) 회전은 위 항목 외에 다음을 추가로 확인한다.

- [ ] blue / green 슬롯 양쪽이 동일한 새 키로 기동되었음 (8080/8081 모두 200)
- [ ] `/etc/mindgarden/prod-from-dev.env` 의 `DB_PRESERVE_KEYS` 가드가 회전 도중에 트립되지 않았음
- [ ] Sentry / Datadog 알람 5분 내 신규 critical 없음

## 6. 롤백 절차

> 회전 후 검증 실패 시 즉시 롤백한다. 구 키 폐기(7일) 이전이라면 롤백은 무리 없이 가능하다.

| 증상 | 액션 |
|---|---|
| 회전 직후 부팅 실패 | 직전 secret 으로 GitHub Secrets 재설정 → deploy workflow 재실행 |
| PII 복호화 실패 row 발생 | 다중 키 리스트에 이전 키(`v1`) 즉시 추가 + BE 재기동, `core-debugger` 위임 |
| 소셜 로그인 100% 실패 | 카카오/네이버 콘솔의 secret 과 GitHub Secrets 동기화 재확인 |

회전 후 24h 모니터링이 GREEN 이면 이전 secret 폐기. KEY/IV 는 **180일 보존** 후 폐기 (휴면 PII 복호화 호환).

### 6.1 JWT_SECRET 롤백

1. **결정 시점**: §5 체크리스트 항목 중 헬스 / 로그인 / 에러율 중 하나라도 실패하면 즉시 롤백 결정
2. **GH Secrets 복구**: 운영팀이 회전 직전 자신의 1Password / 안전한 vault 에 **반드시** 백업한 구 값으로 `gh secret set JWT_SECRET --env <env>` 재실행
   - 워크플로는 보안상 평문 자동 백업을 수행하지 않는다 — 책임자 vault 백업이 사전 조건
3. **재배포**: `deploy-backend-dev.yml` / `deploy-production.yml` `workflow_dispatch` 재실행
4. **검증 재실행**: §5 체크리스트 다시 수행
5. **이력 기록**: `docs/operations/secret-rotation-history.md` 에 롤백 행 추가 (트리거 = `롤백`, 비고에 원인 한 줄)

**롤백이 불가능한 케이스**: 구 키 폐기 7일 경과 후, 또는 구 키가 외부 IdP 콘솔에서 이미 무효화된 경우 → 비상 회전(§4) 절차로 재진입한다.

## 7. 금지 사항

- 회전된 secret 평문을 채팅·티켓·문서·로그에 게시 금지. 허용 노출 한계: 길이·sha256 앞 8자·앞 4자 prefix
- systemd unit `Environment=` 인라인 secret 회전 금지 — `prod.env` 단일 SSOT 만 사용 ([`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md))
- IV 단독 회전 / 다중 키 등록 없이 KEY 회전 금지 (복호화 호환 깨짐)
- 운영 시간대(09:00 ~ 22:00 KST) JWT/PII 회전 강행 금지 — 23:00 ~ 06:00 권장
- 회전 워크플로의 PAT 권한을 `admin` 으로 부여 금지 — 정확히 `secrets:write`, `actions:write`, `contents:write`, `pull-requests:write` 만
- 본 정책 신설/개정 PR 자체에서 회전을 즉시 실행 금지 (워크플로 신설만, 실제 회전은 별도 트리거)
- DB 회전 시 `ALTER USER` 의 `IDENTIFIED BY` 절 외 `GRANT` / `REVOKE` / `WITH SYSTEM_USER` 등 권한 변경 절대 포함 금지 (`mindgarden_procedure` 의 SYSTEM_USER + ALL PRIVILEGES 보존)

## 8. 자동화 (Automation)

본 정책의 자동화 인프라(워크플로 + GH Variable + Environment protection) SSOT 를 단일 섹션으로 통합한다.
회전 자동화 v2 (PR — 본 문서 신설) 부터 운영팀 수동 디스패치 부담을 줄이고, 만료·분기 일정을 표준 트리거로 운영한다.

### 8.1 만료 알림 워크플로

워크플로: [`.github/workflows/check-pat-expiry.yml`](../../.github/workflows/check-pat-expiry.yml)

| 항목 | 값 |
|---|---|
| 트리거 | `schedule` cron `0 0 * * MON` (매주 월요일 09:00 KST = UTC 00:00) + `workflow_dispatch` |
| 만료일 SSOT | GH Repository Variable `ROTATION_SECRETS_PAT_EXPIRES_AT` (YYYY-MM-DD UTC, 수동 등록) |
| 임계치 | D > 30 = `ok` (요약만) / D ≤ 30 = `warning` (Discord) / D ≤ 7 = `critical` (Discord + Issue) / D < 0 = `expired` (Discord + Issue) |
| 알림 채널 | `secrets.DISCORD_WEBHOOK_URL` (미등록 시 알림 skip) + GitHub Issue (`security`/`secret-rotation`/`pat-expiry` 라벨) |
| 보안 | PAT 값 자체 노출 0 — 만료일 메타만 출력 |

#### GH Variable 등록 (1회)

```bash
# PAT 발급 시 부여받은 만료일을 YYYY-MM-DD 로 입력 (예: 2026-09-13)
gh variable set ROTATION_SECRETS_PAT_EXPIRES_AT --body '2026-09-13'

# PAT 회전 시 변수 갱신
gh variable set ROTATION_SECRETS_PAT_EXPIRES_AT --body '2026-12-12'
```

GH Variable 미등록 시 워크플로는 `::warning` 만 출력하고 정상 종료한다 (실패 처리하지 않음).

### 8.2 분기 자동 회전 트리거

워크플로: [`.github/workflows/quarterly-secret-rotation-trigger.yml`](../../.github/workflows/quarterly-secret-rotation-trigger.yml)

| 항목 | 값 |
|---|---|
| 트리거 | `schedule` cron `0 17 1 1,4,7,10 *` (분기 첫째날 02:00 KST = 전일 17:00 UTC) + `workflow_dispatch` |
| 사전 가드 | `if: github.repository == 'beta0629/MindGarden'` (다른 fork 차단) + `concurrency: quarterly-secret-rotation` + 내부 분기 월(1/4/7/10) 검증 + `dry_run` / `override_quarter_gate` 입력 |
| 자동 회전 대상 | (1) `JWT_SECRET` dev (30분 안정 대기 후 prod 권고 issue 발행) — `rotate-jwt-secret.yml` dispatch / (2) `DB_PASSWORD` `mindgarden_readonly` dev — `rotate-db-password.yml` dispatch |
| 권고 issue 대상 | `JWT_SECRET` prod / `DB_PASSWORD` `mindgarden` prod / `KAKAO_CLIENT_SECRET` + `NAVER_CLIENT_SECRET` (외부 콘솔 의존) / `PERSONAL_DATA_ENCRYPTION_KEY` (자동화 범위 외, §3.4) |
| 사후 처리 | `recommend-manual-rotations` job 이 권고 issue (`security`/`secret-rotation`/`quarterly-rotation` 라벨) 자동 생성 + `notify-discord` job 이 분기 트리거 결과 요약 Discord 알림 |

#### 회전 대상 매트릭스

| Secret | 자동 회전 환경 | 수동 처리 환경 | 자동화 비고 |
|---|---|---|---|
| `JWT_SECRET` | `dev` (분기 1회) | `prod` (24h 무사고 후 운영팀 수동 트리거) | `confirm_prod=PROD_ROTATE` 우회 금지 |
| `DB_PASSWORD` `mindgarden_readonly` | `dev` (분기 1회) | `prod` (DBA `confirm_dba=DBA_APPROVED`) | BE 영향 없음 |
| `DB_PASSWORD` `mindgarden` | (없음) | `dev`/`prod` 모두 운영팀+DBA 수동 | BE blue/green 재기동 동반 |
| `DB_PASSWORD` `mindgarden_procedure` | (없음) | `dev`/`prod` 운영팀+DBA 수동 | SYSTEM_USER 권한 보존 |
| `KAKAO_CLIENT_SECRET` / `NAVER_CLIENT_SECRET` | (없음) | 외부 콘솔 발급 후 워크플로 dispatch | API 미공개로 자동화 불가 |
| `PERSONAL_DATA_ENCRYPTION_KEY` | (없음, disabled) | 별도 설계서 후 진행 | 재암호화 마이그레이션 필요 (§3.4) |

#### 사전 조건

- `secrets.ROTATION_SECRETS_PAT` (§3.1 PAT 공유) — 미설정 시 분기 자동 회전 차단 (`::error`)
- `secrets.DISCORD_WEBHOOK_URL` (선택) — 미등록 시 Discord 알림만 skip (자동 회전은 정상 진행)

### 8.3 prod Environment protection

가이드: [`docs/operations/prod-environment-protection.md`](../operations/prod-environment-protection.md)

| 항목 | 값 |
|---|---|
| 적용 대상 | GitHub Environment `prod` |
| Required reviewers | 운영팀 2명 (셀프 승인 차단) |
| Wait timer | 0분 (필요 시 5분 강화) |
| Deployment branches | `main` 만 허용 |
| Admin bypass | OFF (정책 §7 admin override 강제 금지와 정합) |
| 적용 시점 | 본 정책 신설 PR 머지 후 운영자가 1회 적용 — **자동 적용 금지** (정책 §7) |

> 회전 워크플로의 prod 분기에 `environment: prod` 키워드를 명시 추가하는 후속 PR 에서 본 보호 규칙이 자동 적용되도록 진화시킨다. 현재는 `confirm` 입력 3단계로 1차 차단.

### 8.4 자동화 SSOT 인덱스

| 자동화 자원 | SSOT 경로 |
|---|---|
| 만료 알림 | `.github/workflows/check-pat-expiry.yml` |
| 분기 자동 회전 트리거 | `.github/workflows/quarterly-secret-rotation-trigger.yml` |
| PAT 만료일 변수 | GH Repository Variable `ROTATION_SECRETS_PAT_EXPIRES_AT` |
| Discord webhook | `secrets.DISCORD_WEBHOOK_URL` |
| 회전 PAT | `secrets.ROTATION_SECRETS_PAT` |
| prod Environment 보호 가이드 | `docs/operations/prod-environment-protection.md` |
| 회전 이력 (자동 append) | `docs/operations/secret-rotation-history.md` |

## 9. 권한 / 책임자

| 역할 | 책임 |
|---|---|
| **운영팀** | 정기 회전 일정 관리, 비상 회전 트리거, 외부 콘솔 회전 |
| **보안 담당** | 회전 정책 SSOT 유지, 사후 분석, 가드 추가 |
| **개발팀** | 부트 가드 / 워크플로 검증 코드 유지보수, 재암호화 마이그레이션 설계 |
| **DBA** | DB_PASSWORD 계정별 회전 실행, 롤백 시 신속 패스워드 복구 |

## 10. 회전 이력

본 정책 문서의 v1.0.0 §6 의 placeholder 표를 SSOT 분리하여 다음 위치로 이전한다.

- **위치**: [`docs/operations/secret-rotation-history.md`](../operations/secret-rotation-history.md)
- **포맷**: 마크다운 표
  | 시점(KST) | 시크릿명 | 환경 | 트리거 | Run ID | 책임자 | 비고 |
- **트리거 enum**: `정기` / `비상` / `롤백` / `재시도`
- **자동 append**: `rotate-jwt-secret.yml` 등 회전 워크플로가 성공 시 본 파일에 신규 행을 추가하고 PR을 생성한다
- **시크릿 값 평문 금지**: 비고 열에는 길이·sha256 앞 8자·앞 4자 prefix 까지만

## 11. 위반 시 처리

본 정책 위반(회전 누락, 약한 키 등록, 평문 노출)은 [`SECURITY_STANDARD.md`](./SECURITY_STANDARD.md) §보안 사고 처리 절차를 따른다. 자동 회전 워크플로의 `JwtSecretValidator` 정책 위반 secret 은 부트 가드에서 차단되어 운영 반영이 불가능하다 — 정책 자체가 SSOT.

## 12. 참조

- [`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md) — env 파일 SSOT
- [`SYSTEMD_FALLBACK_DB_ENV_POLICY.md`](./SYSTEMD_FALLBACK_DB_ENV_POLICY.md) — unit 평문 금지
- [`ENCRYPTION_STANDARD.md`](./ENCRYPTION_STANDARD.md) — PII KEY 관리
- [`SECURITY_AUTHENTICATION_STANDARD.md`](./SECURITY_AUTHENTICATION_STANDARD.md) — JWT 표준
- [`PII_PROTECTION_STANDARD.md`](./PII_PROTECTION_STANDARD.md) — 다중 키 + AttributeConverter
- [`JwtSecretValidator.java`](../../src/main/java/com/coresolution/core/security/JwtSecretValidator.java) — JWT_SECRET 강도 SSOT
- [`.github/actions/sync-prod-env-key/action.yml`](../../.github/actions/sync-prod-env-key/action.yml) — composite action (DB_PRESERVE_KEYS 가드 포함)
- [`.github/workflows/rotate-jwt-secret.yml`](../../.github/workflows/rotate-jwt-secret.yml) — JWT_SECRET 자동 회전 (PR #326 + PR #331)
- [`.github/workflows/rotate-social-secrets.yml`](../../.github/workflows/rotate-social-secrets.yml) — KAKAO/NAVER 자동 회전 (PR #327 + PR #331)
- [`.github/workflows/rotate-db-password.yml`](../../.github/workflows/rotate-db-password.yml) — DB_PASSWORD 자동 회전 (회전 자동화 후속 2, PR #331 health 게이트 패턴)
- [`.github/workflows/check-pat-expiry.yml`](../../.github/workflows/check-pat-expiry.yml) — `ROTATION_SECRETS_PAT` 만료 알림 (회전 자동화 v2, §8.1)
- [`.github/workflows/quarterly-secret-rotation-trigger.yml`](../../.github/workflows/quarterly-secret-rotation-trigger.yml) — 분기 자동 회전 트리거 (회전 자동화 v2, §8.2)
- [`docs/operations/prod-environment-protection.md`](../operations/prod-environment-protection.md) — prod Environment protection 가이드 (회전 자동화 v2, §8.3)
- [`JWT_SECRET_P0_HANDOFF_20260613.md`](../운영반영/JWT_SECRET_P0_HANDOFF_20260613.md) — 본 자동화의 직접 동기 P0 사고

## 변경 이력

| 일자(KST) | 버전 | 변경 | 작성 |
|---|---|---|---|
| 2026-06-14 | 1.0.0 | 정책 신설 (PR #309 — P0 표준 5종 묶음) | MindGarden |
| 2026-06-14 | 1.1.0 | JWT_SECRET 자동 회전 워크플로(`rotate-jwt-secret.yml`) 신설, 자동화 절차·강도 SSOT(`JwtSecretValidator`)·이력 SSOT(`secret-rotation-history.md`) 분리 보완 | MindGarden |
| 2026-06-14 | 1.2.0 | DB_PASSWORD 자동 회전 워크플로(`rotate-db-password.yml`) 신설. §3.3 을 자동화 절차 + DBA 협업 절차(24h 사전 통지·`confirm_dba=DBA_APPROVED`)로 전면 개정. PR #331 health 게이트 패턴 동일 적용. | MindGarden |
| 2026-06-15 | 1.3.0 | 회전 자동화 v2 — `ROTATION_SECRETS_PAT` 만료 알림(`check-pat-expiry.yml`, D-30/D-7/expired) + 분기 자동 회전 트리거(`quarterly-secret-rotation-trigger.yml`, cron `0 17 1 1,4,7,10 *`) + prod Environment protection 가이드(`docs/operations/prod-environment-protection.md`) 신설. §8 "자동화" 섹션 신설 (8.1 만료 알림 / 8.2 분기 자동 회전 / 8.3 prod 보호 / 8.4 SSOT 인덱스), 후속 §9~§12 재번호. | MindGarden |
