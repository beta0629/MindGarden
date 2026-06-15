# PII KEY 회전 운영 Runbook (Phase 1 ~ Phase 4)

**버전**: 1.0.0
**작성일**: 2026-06-15
**관리 정책**: [`docs/standards/SECRET_ROTATION_POLICY.md`](../standards/SECRET_ROTATION_POLICY.md) §3.4
**설계 SSOT**: [`docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md`](../standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md)
**Dry-run 가이드**: [`docs/operations/pii-rotation-dry-run-guide.md`](./pii-rotation-dry-run-guide.md)
**워크플로**: [`.github/workflows/rotate-pii-key.yml`](../../.github/workflows/rotate-pii-key.yml)

---

## 0. 개요

PII KEY/IV 회전은 **회전 시 기존 데이터 재암호화 마이그레이션이 필요**하므로 JWT/DB 회전과 달리 4단계로 분리 운영한다.

| Phase | 책임 | 상태 변경 | 자동화 |
|---|---|---|---|
| **Phase 1 verify** | 운영팀 | 0 (state mutation 없음) | 워크플로 자동 |
| **Phase 2 batch** | 운영팀 | DB row UPDATE (재암호화) | 워크플로 자동 |
| **Phase 3 verify** | DBA + 운영팀 | 0 (잔여 SELECT 만) | SQL 명세 출력 + 수동 실행 |
| **Phase 4 finalize** | 운영팀 | GH Secrets CSV 수정 (구 키 제거) | 이력 PR 자동, CSV 수정 수동 |

> **무중단 회전 — Dual-Read 보장**: 회전 중에도 BE 는 `PersonalDataEncryptionUtil` 의 다중 키 dual-read 인프라로 구 키·신 키 row 양쪽 모두 복호화한다. 회전 완료 후 180일 보존 → 구 키 폐기.

---

## 1. 사전 조건 (회전 시작 전)

### 1.1 필수 코드 / 인프라

- [x] PR #335 (설계서) merged
- [x] PR #339 (PR-1 회전 SSOT 워크플로 주입) merged
- [x] PR #340 (PR-2 composite action PRESERVE) merged
- [x] PR #344 (Phase 1 인프라 — `PiiKeyRotationAdminController` + service + Flyway) merged
- [ ] 본 PR (Phase 2 배치 워크플로 + runbook + dry-run 가이드) merged

### 1.2 필수 GH Secrets

| Secret | scope | 용도 |
|---|---|---|
| `PERSONAL_DATA_ENCRYPTION_KEYS` | env (dev/prod) | 다중 키 CSV (`v2:base64,v1:base64`) — 신 키 사전 등록 |
| `PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID` | env | 활성 키 ID (`v2`) |
| `PERSONAL_DATA_ENCRYPTION_IV` | env | Phase 1 호환 IV |
| `MINDGARDEN_DORMANT_PII_ENC_KEY` | env | 휴면 PII AES-GCM 키 (다중 키 SSOT 도입 시 CSV 확장) |
| `PII_ROTATION_ADMIN_TOKEN` | env | ADMIN 권한 JWT (레거시 HQ_MASTER 매핑 통합 — `docs/standards/ROLE_STANDARD.md` §5.1; 본 워크플로 admin endpoint 호출용, 회전 직전 발급) |
| `ROTATION_SECRETS_PAT` | repo | repo scope `contents:write`, `pull-requests:write`, `actions:write` PAT (Phase 4 이력 PR 생성용) |

### 1.3 필수 BE 설정

| 설정 키 | 값 | 비고 |
|---|---|---|
| `pii-rotation.allow-plaintext-encryption` | `true` (accounts/branches 회전 시) | Phase 1 default false — Phase 2 entity converter 적용 후 true 전환 |
| `MINDGARDEN_DORMANT_PII_ENC_KEY` 다중 키 | CSV 형식 가용 | `DormantPiiVaultService` 가 다중 키 SSOT 를 지원하는지 사전 확인 |

> **사전 확인 SQL** (DBA readonly): `pii_reencryption_progress` 테이블 존재 — `SHOW CREATE TABLE pii_reencryption_progress;` (Flyway V20260615_001 적용 여부).

---

## 2. 회전 트리거 — 시점 / 사유

| 트리거 | 사례 | 권장 시간대 |
|---|---|---|
| **정기** | 180일 주기 (KEY/IV 보존 정책 §6) | 매 분기 첫째 주 일요일 23:00 ~ 06:00 KST |
| **비상** | PII KEY 평문 노출 정황, 약 키 발견 | 즉시 (P0 §4 절차) |
| **점검** | dev readonly dry-run, CI/BI 게이트 검증 | 평시 (운영 영향 없음) |
| **재시도** | 직전 회전 FAILED chunk 복구 | 직전 회전 종료 직후 |

---

## 3. Phase 별 실행 절차

### 3.1 Phase 1 verify — endpoint 가용성 사전 확인

**목적**: 회전 시작 전 BE health + admin endpoint 가 정상 응답하는지 확인 (state mutation 0).

**워크플로**: `rotate-pii-key.yml` `phase=phase1-verify`

| 입력 | 값 |
|---|---|
| `environment` | `dev` 또는 `prod` |
| `phase` | `phase1-verify` |
| `table` | 회전 대상 첫 테이블 (예: `users`) |
| `target_key_id` | 신 키 ID (예: `v2`) |
| `chunk_size` | 100 (기본값) |
| `dry_run` | `true` 또는 `false` (Phase 1 은 state mutation 없음) |
| `confirm` | 공란 (Phase 1 은 confirm 불요) |
| `trigger_reason` | `정기` / `점검` 등 |

**기대 결과**:

- BE `/actuator/health` 연속 UP
- `GET /api/v1/admin/pii-rotation/progress` HTTP 200 (PII 누출 0)

### 3.2 Phase 2 batch — 실제 재암호화 배치

**목적**: chunk 단위로 운영 PII 컬럼을 신 키로 재암호화.

**사전 — 신 키 등록 (수동)**:

```bash
# 1) 신 키 생성 (32 bytes → base64)
NEW_KEY_B64=$(openssl rand -base64 32 | tr -d '\n')

# 2) 기존 활성 키 (v1) 와 함께 다중 키 CSV 등록 — 신 키를 첫 번째 위치에
NEW_CSV="v2:${NEW_KEY_B64},$(gh secret get PERSONAL_DATA_ENCRYPTION_KEYS --env prod --raw 2>/dev/null || echo 'v1:CURRENT_BASE64')"

# 3) GH Secrets 갱신 (수동 — 본 워크플로는 CSV 자동 수정하지 않음)
printf '%s' "$NEW_CSV" | gh secret set PERSONAL_DATA_ENCRYPTION_KEYS --env prod --body -

# 4) 활성 키 ID 갱신 (v1 → v2)
printf '%s' "v2" | gh secret set PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID --env prod --body -

# 5) deploy-production.yml workflow_dispatch — 신 키 활성화
gh workflow run deploy-production.yml --ref main -f deploy_ref=main

# 6) /actuator/health UP + 신 키 dual-read 동작 확인 (구 키로 저장된 row 1건 복호화 sanity)
```

**Phase 2 워크플로 실행**:

| 입력 | 값 |
|---|---|
| `environment` | `prod` |
| `phase` | `phase2-batch` |
| `table` | `users` → `clients` → `accounts` → `branches` → `dormant` (순차, 1회 1테이블 권장) |
| `target_key_id` | `v2` (신 키 ID) |
| `chunk_size` | `100` (권장 50~500, 대규모 200~500) |
| `dry_run` | `false` |
| `confirm` | `ROTATE` |
| `confirm_prod` | `PROD_ROTATE` |
| `confirm_dba` | `DBA_APPROVED` |
| `trigger_reason` | `정기` |

**진행 모니터링**:

- 워크플로 Job log 에서 `[poll N/M]` 라인으로 chunk 진행률 실시간 확인
- 60초 간격 polling, 최대 6시간 (대규모 데이터 대비)
- `pending=0 AND inProgress=0` 도달 시 종료
- `failed>0` 시 §6.4 (resume) 또는 §6.5 (cancel) 분기

### 3.3 Phase 3 verify — 잔여 SQL 검증 (DBA 수동)

**목적**: 신 키로 재암호화되지 않은 row 가 잔존하는지 확인.

**워크플로 실행** (`phase=phase3-verify`) → Job log 에 7컬럼 × 5테이블 SQL 출력.

**DBA 수동 실행** (readonly 계정):

```sql
-- 예: users 테이블
SELECT 'email' AS col, COUNT(*) AS not_rotated
FROM users
WHERE email IS NOT NULL AND email <> ''
  AND email NOT LIKE 'v2::%';
-- 기대: not_rotated = 0
```

> **PII 평문 SELECT 절대 금지** — 위 SQL 은 컬럼 값 자체를 SELECT 하지 않고 prefix 만 LIKE 비교한다.

**샘플 복호화 검증** (admin 호출, optional):

```bash
# /progress 의 done 카운트와 위 SQL 의 NULL/빈 값 제외 row 수 교차 검증
curl -sS -H "Authorization: Bearer ${PROD_ADMIN_TOKEN}" \
  "https://mindgarden.core-solution.co.kr/api/v1/admin/pii-rotation/progress?table=users&target_key_id=v2" \
  | jq '{done, totalChunks}'
```

### 3.4 Phase 4 finalize — 이력 PR + 구 키 폐기 안내

**워크플로 실행** (`phase=phase4-finalize`):

- 자동: `secret-rotation-history.md` append + PR 생성
- 출력: 구 키 폐기 체크리스트 (Job Summary)

**구 키 폐기 (수동, 180일 후)**:

```bash
# 1) 24h ~ 180일 모니터링 GREEN 유지 확인 (에러율, 알람, 복호화 실패 row 0)

# 2) 180일 경과 후 — CSV 에서 구 키 entry 제거
# 기존: "v2:NEW_B64,v1:OLD_B64"
# 변경: "v2:NEW_B64"
NEW_CSV="v2:NEW_B64"
printf '%s' "$NEW_CSV" | gh secret set PERSONAL_DATA_ENCRYPTION_KEYS --env prod --body -

# 3) MINDGARDEN_DORMANT_PII_ENC_KEY 동일 절차

# 4) deploy-production.yml 재배포 → /actuator/health UP
gh workflow run deploy-production.yml --ref main -f deploy_ref=main

# 5) 휴면 사용자 1건 unmask sanity 테스트 (구 키 사라진 상태에서 복호화 성공해야 함)

# 6) secret-rotation-history.md 에 폐기 행 추가 PR (수동)
```

---

## 4. DBA 사후 검증 책임 (confirm_dba=DBA_APPROVED)

본 워크플로의 `confirm_dba=DBA_APPROVED` 입력은 **사후 검증 책임자가 명시되어 있음**을 의미한다. DBA 가 다음 항목을 검증한다.

- [ ] 회전 직전 / 직후 `pii_reencryption_progress` 테이블 row 수 비교 (chunk 생성 정확)
- [ ] Phase 3 잔여 SQL 각 테이블 × 컬럼 `not_rotated = 0`
- [ ] 회전 후 24h 동안 BE 로그에서 `KeyNotFoundException` 발생 0건 (다중 키 dual-read 정상)
- [ ] 회전 후 24h 동안 5xx 에러율 < 회전 직전 1시간 평균의 2배
- [ ] Sentry / Datadog 알람 0건 (PII 복호화 실패 알람 포함)

---

## 5. admin JWT 토큰 발급 가이드

본 워크플로는 `secrets.PII_ROTATION_ADMIN_TOKEN` (**OPS Authority + 본사(HQ) 테넌트 컨텍스트** 를 보유한 본사 ADMIN 계정의 JWT) 으로 admin endpoint 를 호출한다. Phase 1 (`ops-portal-migration`) 부터 컨트롤러는 **옵션 3+1 하이브리드 가드** 를 적용한다 — `@PreAuthorize("hasRole('OPS')")` (Ops Portal Authority) + `OpsTenantConstants#isHqTenant(...)` (본사 테넌트 자체 검증). 자세한 배경은 `docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md` §6 참조.

### 5.1 발급 원칙

- **권한**: **OPS Authority 보유 + 본사(HQ) 테넌트 ADMIN** 사용자 1명 (운영팀 책임자). JWT 발급 시 actor role 이 `ACTOR_ROLE_OPS` (= `"OPS"`) 또는 본사 테넌트의 ADMIN 계정으로 발급되어야 한다.
- **테넌트 컨텍스트**: 발급 계정은 **본사(HQ) 테넌트** 로 인식되어야 한다 — 외부 테넌트 ADMIN 으로 발급된 토큰은 `OpsTenantConstants` HQ 가드가 `AccessDeniedException` 으로 차단 (Defense in Depth).
- **만료**: **1주일 이하** (회전 작업 직전 발급, 작업 완료 후 즉시 폐기 권장)
- **저장**: GH Secrets `PII_ROTATION_ADMIN_TOKEN` (환경별 `dev` / `prod` 분리)
- **노출**: 채팅·티켓·문서·로그 어디에도 평문 0건 — 워크플로는 `::add-mask::` 즉시 마스킹
- **사전 등록**: BE 부팅 fail-fast 방지를 위해 `MINDGARDEN_HQ_TENANT_ID` GH Secret(또는 `prod.env`) 등록이 사전 조건 — 미설정 시 `OpsTenantConstants#validate()` 가 부트 자체를 실패시킨다.

### 5.2 발급 절차

1. **본사(HQ) 테넌트 ADMIN 계정으로 BE 로그인** (Ops Portal Authority 보유 — actor role `OPS` 또는 본사 테넌트 ADMIN):

   ```bash
   # 회전 대상 환경의 로그인 endpoint
   LOGIN_URL="https://mindgarden.core-solution.co.kr/api/v1/auth/login"
   # 또는 dev: https://mindgarden.dev.core-solution.co.kr/api/v1/auth/login

   # 로그인 — 응답에서 access_token 추출
   curl -sS -X POST "${LOGIN_URL}" \
     -H "Content-Type: application/json" \
     -d '{"username":"<ADMIN_USERNAME>","password":"<ADMIN_PASSWORD>"}' \
     | jq -r '.data.accessToken'
   ```

   > 응답 토큰은 즉시 환경 변수로만 다루고 echo / 클립보드 / 채팅 0건.

2. **GH Secret 등록**:

   ```bash
   ADMIN_TOKEN="<위에서_추출한_JWT>"
   printf '%s' "$ADMIN_TOKEN" | gh secret set PII_ROTATION_ADMIN_TOKEN --env prod --body -
   unset ADMIN_TOKEN
   # 검증 — 키 이름만 (값 노출 불가능)
   gh secret list --env prod | grep PII_ROTATION_ADMIN_TOKEN
   ```

3. **회전 완료 후 즉시 폐기**:

   ```bash
   # access token revoke (refresh token 무효화 포함)
   curl -sS -X POST "https://mindgarden.core-solution.co.kr/api/v1/auth/logout" \
     -H "Authorization: Bearer ${ADMIN_TOKEN}"

   # GH Secret 삭제
   gh secret delete PII_ROTATION_ADMIN_TOKEN --env prod
   ```

### 5.3 절대 금지

- ADMIN 계정으로 발급한 토큰을 본 회전 외 목적으로 재사용 금지
- 토큰 만료를 30일 이상으로 설정 금지
- 토큰을 PR 코멘트 / 이슈 / Slack / 메일에 첨부 금지 (마스킹 여부 무관)
- 워크플로 외 부분에서 평문 입력 / echo / `cat` 금지

---

## 6. Trouble-shooting

### 6.1 헬스 게이트 실패 (`연속 5회 UP 미달성`)

**원인 추정**: BE 가 부팅 중이거나 신 키 등록 직후 컨테이너 교체 중.

**조치**:

1. 워크플로 Job log 에서 마지막 polling status / http code 확인
2. `gh run view <DEPLOY_RUN_ID>` 로 직전 배포 결과 확인 (실패 시 rollback)
3. 직전 회전을 cancel + 정책 §6 rollback 절차 진입

### 6.2 admin endpoint 404 / 401 / 403

| HTTP | 의미 | 조치 |
|---|---|---|
| 404 | endpoint 미배포 | PR #344 (Phase 1 인프라) 머지 + deploy-production 재실행 |
| 401 | 토큰 만료 | runbook §5 절차로 신 JWT 재발급 |
| 403 | OPS 권한 미보유 또는 외부 테넌트 차단 (`@PreAuthorize("hasRole('OPS')")` 또는 `OpsTenantConstants` HQ 가드) | (1) 발급 계정이 OPS Authority 를 보유한지 확인 (`SecurityRoleConstants.ACTOR_ROLE_OPS`) (2) 본사(HQ) 테넌트 컨텍스트로 발급되었는지 확인 (3) `MINDGARDEN_HQ_TENANT_ID` 환경변수가 실제 운영 본사 테넌트 UUID 와 정확히 일치하는지 점검 |

### 6.3 `rowsRotated > 0` (활성 키와 다른 키로 저장된 row 존재)

**상황**: dry-run 또는 활성 키 == target_key_id 회전에서 일부 row 가 실제로 UPDATE 됨.

**해석**: 자연스러운 데이터 정리 (이전 키 회전 미완료 row). FAILED 가 아니면 정상.

**확인**: `pii_reencryption_progress` 의 해당 chunk row 의 `errorSummary` 가 NULL 인지 (정상이면 NULL).

### 6.4 일부 chunk FAILED — resume

```bash
curl -sS -X POST \
  -H "Authorization: Bearer ${PROD_ADMIN_TOKEN}" \
  "https://mindgarden.core-solution.co.kr/api/v1/admin/pii-rotation/resume?table=users&target_key_id=v2"
```

→ 응답 `chunksDone` 증가 확인. 다시 `phase=batch-status` 워크플로로 모니터링.

### 6.5 진행 중 chunk 강제 취소

```bash
curl -sS -X POST \
  -H "Authorization: Bearer ${PROD_ADMIN_TOKEN}" \
  "https://mindgarden.core-solution.co.kr/api/v1/admin/pii-rotation/cancel?table=users&target_key_id=v2"
```

→ PENDING / IN_PROGRESS → SKIPPED. 이후 재시작 시 SKIPPED 는 자동 재처리되지 않음 (정책: 명시적 resume 만).

### 6.6 운영 회전 중 BE 5xx 급증 / 복호화 실패

**즉시 조치**:

1. 진행 중 chunk cancel (위 §6.5)
2. `PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID` 를 구 키 ID (v1) 로 복원
3. CSV 는 양 키 (v2,v1) 유지 (이미 v2 로 변경된 row 복호화 호환)
4. deploy-production.yml 재실행 → /actuator/health UP
5. `core-debugger` 위임 — 회전 batch 로그 분석
6. 정책 §4 (비상 회전 절차) 진입 검토

### 6.7 dormant 회전 시 `DormantPiiVaultService` 다중 키 SSOT 미가용

**상황**: Phase 1 (PR #344) 시점에는 `rotateDormantPiiVault` 가 scan-only.

**조치**: dormant 회전은 Phase 2 후속 PR (다중 키 SSOT 도입) 머지 전까지 skip. 메인 (users/clients/accounts/branches) 만 진행하고 dormant 는 별도 사이클.

---

## 7. 안전 가드 요약 (워크플로 빌트인)

| 가드 | 작동 단계 | 차단 케이스 |
|---|---|---|
| confirm=ROTATE | phase2/3/4 입력 검증 | 실수 dispatch 차단 |
| confirm_prod=PROD_ROTATE | prod + phase2/3/4 | 운영 환경 추가 확인 |
| confirm_dba=DBA_APPROVED | phase2/3/4 | DBA 사후 검증 책임자 명시 |
| dry_run=true (기본값) | phase2 | endpoint 호출 0 — 실수 회전 차단 |
| chunk_size 범위 1~1000 | 입력 검증 | OOM / lock 위험 차단 |
| target_key_id 형식 `[A-Za-z0-9_.-]{1,32}` | 입력 검증 | injection / 잘못된 키 ID 차단 |
| `::add-mask::` 즉시 마스킹 | 토큰 로드 직후 | admin JWT 로그 노출 차단 |
| PII 응답 정규식 가드 | start/progress 호출 후 | 평문 PII 노출 시 즉시 운영 중단 |
| concurrency `<env>-<table>` | 워크플로 레벨 | 동일 환경·테이블 동시 회전 race 차단 |
| `contents/pull-requests/actions:write` 만 | permissions | secret 갱신 불가능 (CSV 자동 수정 차단) |
| timeout 360분 | job 레벨 | 대규모 데이터 대비 + 무한 대기 차단 |

---

## 8. 관련 문서

- [`docs/standards/SECRET_ROTATION_POLICY.md`](../standards/SECRET_ROTATION_POLICY.md) §3.4 — 정책 SSOT
- [`docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md`](../standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md) — 설계서 (§3.2 메서드 시그니처)
- [`docs/standards/PII_PROTECTION_STANDARD.md`](../standards/PII_PROTECTION_STANDARD.md) — PII 보호 표준
- [`docs/operations/pii-rotation-dry-run-guide.md`](./pii-rotation-dry-run-guide.md) — dev readonly dry-run 가이드
- [`docs/operations/secret-rotation-history.md`](./secret-rotation-history.md) — 회전 이력
- [`.github/workflows/rotate-pii-key.yml`](../../.github/workflows/rotate-pii-key.yml) — Phase 2 배치 워크플로
- [`.github/workflows/rotate-jwt-secret.yml`](../../.github/workflows/rotate-jwt-secret.yml) — JWT_SECRET 회전 (동일 패턴 참고)
- [`.github/workflows/rotate-db-password.yml`](../../.github/workflows/rotate-db-password.yml) — DB_PASSWORD 회전 (동일 패턴 참고)

---

## 9. 변경 이력

| 버전 | 일자 | 변경 |
|---|---|---|
| 1.0.0 | 2026-06-15 | 최초 작성 (Phase 2 PR — `rotate-pii-key.yml` 워크플로 + Phase 1~4 절차 + admin JWT 발급 가이드) |
