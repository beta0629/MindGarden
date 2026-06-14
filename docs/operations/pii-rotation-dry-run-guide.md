# PII KEY 회전 dev readonly dry-run 가이드

**버전**: 1.0.0
**작성일**: 2026-06-15
**관리 정책**: [`docs/standards/SECRET_ROTATION_POLICY.md`](../standards/SECRET_ROTATION_POLICY.md) §3.4
**설계 SSOT**: [`docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md`](../standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md)
**운영 Runbook**: [`docs/operations/pii-rotation-runbook.md`](./pii-rotation-runbook.md)
**워크플로**: [`.github/workflows/rotate-pii-key.yml`](../../.github/workflows/rotate-pii-key.yml)

---

## 0. 목적

PII KEY 회전 Phase 2 배치 워크플로(`rotate-pii-key.yml`)를 **dev 환경에서 실제 PII row 변경 없이** 1회 검증한다.

- 워크플로의 입력 검증 / 헬스 게이트 / admin endpoint 가용성 / polling 분기를 운영 회전 전에 1회 통과
- BE 측 `PersonalDataKeyRotationService` 가 dev row 1~수십 건에 대해 정상 동작하는지 확인
- 평문 PII 응답·로그 노출 0건 회귀 차단
- runbook §6 trouble-shooting 절차 사전 walk-through

> **본 가이드의 실행은 의도적으로 row 변경을 최소화한다** — `chunk_size=10` + 단일 테이블(`users`) + 활성 키 == 목표 키 조합으로, `ensureActiveKeyEncryption` idempotency 에 의해 대부분 no-op 처리되도록 설계.

---

## 1. 전제 조건

| 항목 | 확인 방법 |
|---|---|
| PR #344 (Phase 1 인프라) 머지 | `gh pr view 344` → `MERGED` |
| 본 PR (Phase 2 워크플로) 머지 또는 본 브랜치 dispatch 가능 | `gh workflow list` 결과에 `rotate-pii-key.yml` 존재 |
| dev BE 가동 + `/actuator/health` UP | `curl https://mindgarden.dev.core-solution.co.kr/actuator/health` → `{"status":"UP"}` |
| dev BE 의 `PERSONAL_DATA_ENCRYPTION_KEYS` CSV 가 v1 단일 키 또는 v1,v2 다중 키 | `gh secret list --env dev` |
| `secrets.PII_ROTATION_ADMIN_TOKEN` 등록 (HQ_MASTER JWT) | runbook §5 발급 후 `gh secret set` |
| `secrets.ROTATION_SECRETS_PAT` 등록 (Phase 4 이력 PR 생성용) | 기존 회전 워크플로와 공유 |
| GH Secrets 4종 동기화 (PR-1 #339 / PR-2 #340 완료) | `gh secret list --env dev` 에 `MINDGARDEN_DORMANT_PII_ENC_KEY` 등 존재 |

---

## 2. 사전 점검 — dev BE admin endpoint 직접 호출

워크플로 실행 전 endpoint 가 실제로 가용한지 1회 수동 확인한다. 평문 PII 노출 0 — `/progress` 만 사용.

```bash
# 1) dev admin JWT 발급 (runbook §5 절차로 dev BE 에서 HQ_MASTER 로 로그인 → access token)
DEV_ADMIN_TOKEN="..."  # 절대 echo / log 금지

# 2) /progress 호출 — 200 + PII 누출 0 확인
curl -sS -o /tmp/progress.json -w "HTTP %{http_code}\n" \
  -H "Authorization: Bearer ${DEV_ADMIN_TOKEN}" \
  -H "Accept: application/json" \
  "https://mindgarden.dev.core-solution.co.kr/api/v1/admin/pii-rotation/progress?table=users&target_key_id=v1"

# 3) 응답에 PII 필드 누출 0 확인 (출력은 키 이름만)
jq 'keys' /tmp/progress.json
# 기대 출력: ["activeKeyId","done","failed","inProgress","pending","skipped","table","targetKeyId","totalChunks"]
```

> **응답에 `email` / `phone` / `address` 같은 키가 보이면 즉시 운영 중단** + `core-debugger` 위임.

---

## 3. dry-run 실행 절차

### 3.1 Phase 1 verify — dry-run

워크플로 dispatch:

| 입력 | 값 |
|---|---|
| `environment` | `dev` |
| `phase` | `phase1-verify` |
| `table` | `users` |
| `target_key_id` | `v1` (현재 활성 키와 동일 — no-op 보장) |
| `chunk_size` | `10` |
| `dry_run` | `true` |
| `trigger_reason` | `점검` |
| `confirm` / `confirm_prod` / `confirm_dba` | 모두 공란 (phase1-verify 는 confirm 불요) |

**기대 결과**:

- 입력 검증 통과
- `🏥 BE health 게이트` 통과 (짧은 1분 검증창, 연속 2회 UP)
- `🔎 admin endpoint 가용성 검증` HTTP 200
- 평문 PII 누출 가드 통과
- Job Summary 에 `batch 결과: N/A` (phase2 미실행)

**실패 시 trouble-shooting**: runbook §6.1 (헬스 게이트 실패) / §6.2 (admin endpoint 404·401).

### 3.2 Phase 2 batch — dry-run (실제 row 변경 0)

워크플로 dispatch:

| 입력 | 값 |
|---|---|
| `environment` | `dev` |
| `phase` | `phase2-batch` |
| `table` | `users` |
| `target_key_id` | `v1` |
| `chunk_size` | `10` |
| `dry_run` | **`true`** ← 핵심 |
| `trigger_reason` | `점검` |
| `confirm` | `ROTATE` |
| `confirm_prod` | (공란 — dev 환경) |
| `confirm_dba` | `DBA_APPROVED` |

**기대 결과**:

- 입력 검증 통과 + confirm 3단계 검증 (dev 는 `PROD_ROTATE` 불요)
- `🚀 Phase 2 batch` 단계에서 **호출 계획만 출력**, endpoint 호출 0건
- Job Summary 에 `batch 결과: DRY_RUN` + `tables_processed: users`

> **여기까지가 운영 회전 직전의 안전한 walk-through**. 다음 단계는 실제 row UPDATE 가 동반된다.

### 3.3 Phase 2 batch — 실제 호출 (소규모, dev readonly idempotency 검증)

> **주의**: 본 단계는 dev BE 에 대해 실제 chunk SELECT/UPDATE 를 실행한다. dev DB 의 users row 가 대상이며, `target_key_id == activeKeyId` 이므로 `ensureActiveKeyEncryption` idempotency 로 대부분 no-op (UPDATE rowcount=0) 처리되어야 한다.

워크플로 dispatch:

| 입력 | 값 |
|---|---|
| `environment` | `dev` |
| `phase` | `phase2-batch` |
| `table` | `users` |
| `target_key_id` | `v1` (활성 키와 동일 — UPDATE 0 기대) |
| `chunk_size` | `10` (소규모) |
| `dry_run` | **`false`** |
| `trigger_reason` | `점검` |
| `confirm` | `ROTATE` |
| `confirm_dba` | `DBA_APPROVED` |

**기대 결과**:

- POST `/start` HTTP 200 + 응답에 PII 누출 0
- 응답 `rowsScanned > 0` (dev users row 수), `rowsRotated == 0` (이미 활성 키로 암호화되어 있으므로 no-op idempotency)
- GET `/progress` polling 이 `pending=0, inProgress=0` 도달 후 종료
- Job Summary `batch 결과: DONE`

**실패 시**:

- `rowsRotated > 0` 인 경우 → 일부 row 가 활성 키와 다른 키로 저장되어 있었음. 정상 (자연스러운 데이터 정리). runbook §6.3 로그 확인.
- `chunksFailed > 0` → runbook §6.4 (resume 시도) 절차 진행.

### 3.4 Phase 3 verify — 잔여 SQL 출력 확인

워크플로 dispatch:

| 입력 | 값 |
|---|---|
| `environment` | `dev` |
| `phase` | `phase3-verify` |
| `table` | `users` |
| `target_key_id` | `v1` |
| `dry_run` | `true` (또는 false — Phase 3 는 SQL 명세 출력만) |
| `confirm` | `ROTATE` |
| `confirm_dba` | `DBA_APPROVED` |

**기대 결과**: Job log 에 7컬럼 잔여 SQL 출력. DBA 가 readonly 계정으로 dev DB 에 수동 실행 → `not_rotated = 0` 확인.

```sql
-- 예시 (Phase 3 출력 SQL):
SELECT 'email' AS col, COUNT(*) AS not_rotated
FROM users
WHERE email IS NOT NULL
  AND email <> ''
  AND email NOT LIKE 'v1::%';
```

### 3.5 Phase 4 finalize — 이력 PR 생성

워크플로 dispatch:

| 입력 | 값 |
|---|---|
| `environment` | `dev` |
| `phase` | `phase4-finalize` |
| `table` | `users` |
| `target_key_id` | `v1` |
| `confirm` | `ROTATE` |
| `confirm_dba` | `DBA_APPROVED` |
| `trigger_reason` | `점검` |

**기대 결과**:

- `secret-rotation-history.md` 에 dev / users / v1 / 점검 행 1줄 append
- 자동 PR `chore(security): PII_KEY 회전 이력 (dev, users, run <RUN_ID>)` 생성
- Job Summary 에 구 키 폐기 가이드 출력 (수동 단계 안내)

---

## 4. 사후 체크리스트 (Phase 2 dry-run 완료 기준)

워크플로 5단계 모두 GREEN 통과 후 다음 항목을 확인한다.

- [ ] dev `/actuator/health` UP 유지
- [ ] admin JWT 토큰 가용 (만료까지 ≥ 24h)
- [ ] Phase 2 dry-run 실행 결과 `rowsScanned > 0`, `chunksFailed == 0`
- [ ] Phase 2 응답 / Job log 어디에도 평문 PII (email/phone/address/rrn/account_number) 노출 0건
- [ ] Phase 3 SQL 출력 정상 (7컬럼 × users)
- [ ] Phase 4 이력 PR 자동 생성 + body 에 `dry_run=true` 또는 `dry_run=false` 정확히 기재
- [ ] 진행률 테이블 `pii_reencryption_progress` row 수 변화 정확 (DBA readonly 확인)

### PII 노출 회귀 검사 (필수)

```bash
# Job log 에서 PII 키워드 검색 — 0건 기대
gh run view <RUN_ID> --log | grep -iE '"(email|phone|address|rrn|account_number|account_holder|encrypted_pii)"[[:space:]]*:[[:space:]]*"[^"]+"' || echo "PII 노출 0 — OK"
```

---

## 5. 실패 시 resume / cancel

### 5.1 일부 chunk FAILED — resume

```bash
# admin JWT 로 직접 호출 (워크플로 신규 endpoint 미추가 시 수동)
curl -sS -X POST \
  -H "Authorization: Bearer ${DEV_ADMIN_TOKEN}" \
  "https://mindgarden.dev.core-solution.co.kr/api/v1/admin/pii-rotation/resume?table=users&target_key_id=v1"
```

→ 응답 `chunksDone` 증가 확인. 다시 `/progress` polling 으로 `failed=0` 도달까지 모니터링.

### 5.2 진행 중 chunk 강제 취소

```bash
curl -sS -X POST \
  -H "Authorization: Bearer ${DEV_ADMIN_TOKEN}" \
  "https://mindgarden.dev.core-solution.co.kr/api/v1/admin/pii-rotation/cancel?table=users&target_key_id=v1"
```

→ `cancelled_chunks: <N>` 응답. PENDING/IN_PROGRESS → SKIPPED 마킹.

---

## 6. 절대 금지

- 본 dry-run 절차를 **prod 환경에서 실행하지 않는다**. 운영 회전은 runbook §3 이후 절차.
- `target_key_id` 를 **현재 활성 키와 다른 값으로** dry-run 하지 않는다 — 실제 row UPDATE 가 대량 발생.
- admin JWT 평문을 채팅·티켓·로그·PR 코멘트에 노출하지 않는다.
- workflow log 에 PII 평문이 1건이라도 노출되면 즉시 P0 보고 + `core-debugger` 위임.
- dry-run 절차의 chunk_size 를 **`> 100`** 으로 키우지 않는다 — 검증 목적 외 부하 유발.

---

## 7. 관련 문서

- [`docs/standards/SECRET_ROTATION_POLICY.md`](../standards/SECRET_ROTATION_POLICY.md) §3.4 — 정책 SSOT
- [`docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md`](../standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md) — 설계서
- [`docs/operations/pii-rotation-runbook.md`](./pii-rotation-runbook.md) — 운영 runbook (Phase 1~4 + JWT 발급)
- [`docs/operations/secret-rotation-history.md`](./secret-rotation-history.md) — 회전 이력
- [`.github/workflows/rotate-pii-key.yml`](../../.github/workflows/rotate-pii-key.yml) — Phase 2 배치 워크플로
