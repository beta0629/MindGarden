# prod Environment Protection 가이드

**버전**: 1.0.0
**최종 업데이트**: 2026-06-15
**상태**: 운영 가이드 (1회 적용 후 유지)
**참조 정책**: [`docs/standards/SECRET_ROTATION_POLICY.md`](../standards/SECRET_ROTATION_POLICY.md) §8

---

## 1. 목적

운영(`prod`) Environment 의 GitHub Environment **protection rule** 을 설정하여,
실수로 인한 SECRET 회전·수동 디스패치를 차단한다.

특히 다음을 방지한다.

- 비승인 사용자의 `rotate-jwt-secret.yml` / `rotate-db-password.yml` `environment=prod` 트리거
- `deploy-production.yml` 비승인 디스패치
- 운영팀 외 다른 협업자의 prod secret 갱신

---

## 2. 권장 설정값

GitHub UI 또는 REST API 로 다음 값을 1회 등록한다.

| 항목 | 값 | 비고 |
|---|---|---|
| **Required reviewers** | 운영팀 2명 (예: `beta0629`, `+ 1명`) | 동일 워크플로 트리거 actor 는 review 불가 (셀프 승인 차단) |
| **Wait timer** | `0` 분 | reviewer 가 즉시 승인하면 진행 (필요 시 `5` 분으로 강화) |
| **Deployment branches and tags** | `Selected branches and tags` → `main` 만 | develop/feature 에서의 prod 회전 차단 |
| **Allow administrators to bypass configured protection rules** | **OFF** (체크 해제) | 정책 §11: admin override 강제 금지 |

> **셀프 승인 차단**: GitHub 의 동일 actor 는 자기 자신을 reviewer 로 승인할 수 없다 (자체 정책). reviewer 가 1명이면 **다른 사람 1명** 이 review 하므로 안전하다. 운영팀 2명을 등록하면 가용성도 확보된다.

---

## 3. GitHub UI 적용 (권장)

1. Repository → **Settings** → **Environments** → `prod` (없으면 `New environment` 로 신설)
2. **Environment protection rules** 섹션에서 다음 적용
   - `Required reviewers` 체크 → 운영팀 2명 추가
   - `Allow administrators to bypass configured protection rules` **체크 해제**
3. **Deployment branches and tags** 섹션에서 `Selected branches and tags` 선택
   - `main` 브랜치만 허용 추가
4. **Environment secrets** 섹션 — 기존에 등록된 `JWT_SECRET`, `KAKAO_CLIENT_SECRET`, `NAVER_CLIENT_SECRET`, `PRODUCTION_DB_PASSWORD` 등 유지 (본 가이드는 **rule 만** 추가; secret 값 변경 없음)
5. **Save protection rules**

---

## 4. gh API 1회 적용 (자동화)

운영자가 셸에서 1회 실행한다. **본 PR 머지 시점에 자동 실행하지 않는다** (정책 §11: prod Environment 자동 변경 금지).

### 4.1 사전 조건

- `gh` CLI 인증 (`gh auth status` 통과)
- Repo `Admin` 권한
- 운영팀 reviewer 사용자 ID 사전 확인 (아래 §5 참조)

### 4.2 적용 명령

```bash
# 변수
REPO="beta0629/MindGarden"
REVIEWER_1_ID=12345678   # §5 에서 조회한 사용자 ID
REVIEWER_2_ID=87654321   # §5 에서 조회한 사용자 ID

# prod Environment protection rule 적용 (PUT 으로 멱등 적용)
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/environments/prod" \
  -F "wait_timer=0" \
  -F "prevent_self_review=true" \
  -f "reviewers[][type]=User" \
  -F "reviewers[][id]=${REVIEWER_1_ID}" \
  -f "reviewers[][type]=User" \
  -F "reviewers[][id]=${REVIEWER_2_ID}" \
  -f "deployment_branch_policy[protected_branches]=false" \
  -f "deployment_branch_policy[custom_branch_policies]=true"

# 브랜치 정책 — main 만 허용
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/environments/prod/deployment-branch-policies" \
  -f "name=main" \
  -f "type=branch"

# admin bypass 비활성 (Beta 기능, 일부 plan 한정)
# 참고: GitHub UI 의 "Allow administrators to bypass" 항목은 REST API 로
# 직접 토글 불가능한 케이스가 있다. UI 에서 1회 체크 해제 필수.
```

### 4.3 적용 후 확인

```bash
gh api "/repos/${REPO}/environments/prod" --jq '{
  reviewers: .protection_rules[] | select(.type=="required_reviewers") | .reviewers[] | {type: .type, login: (.reviewer.login // "n/a"), id: (.reviewer.id // -1)},
  wait_timer: (.protection_rules[] | select(.type=="wait_timer") | .wait_timer // 0),
  branch_policy: .deployment_branch_policy
}'
```

---

## 5. 운영팀 사용자 ID 확인

GitHub 사용자 ID 는 `login` 과 별도이다. REST API 로 조회한다.

```bash
gh api "/users/beta0629" --jq '{login: .login, id: .id}'
# → {"login":"beta0629","id":12345678}
```

조회한 `id` 를 §4.2 명령의 `REVIEWER_*_ID` 에 입력한다.

> 사용자 `login` 이 변경되어도 `id` 는 영구 보존되므로 ID 기반 등록을 권장한다.

---

## 6. 적용 확인 — 회전 워크플로 dispatch 시 동작

설정이 정상 적용되면 다음과 같이 동작한다.

1. 운영팀이 `gh workflow run rotate-jwt-secret.yml -f environment=prod ...` 실행
2. 워크플로의 `environment: prod` step 에서 **승인 대기** 상태로 진입 (Pending review)
3. Repo → Actions → 해당 run → `Review pending deployments` 에서 다른 reviewer 가 승인
4. 승인 직후 step 진행, 회전 실행
5. 승인 없이 30일 경과 시 자동 만료 — 회전 차단

> 본 워크플로 시리즈 (`rotate-jwt-secret.yml`, `rotate-db-password.yml`, `rotate-social-secrets.yml`) 은
> 회전 step 에 `environment:` 키워드를 사용하지 않는 패턴으로 설계되어 있다. 본 가이드를 적용한
> 후속 PR 에서 회전 워크플로의 prod 분기에 `environment: prod` 를 명시 추가하여 본 보호 규칙이
> 자동 적용되도록 한다 (현재는 confirm 입력 3단계로 1차 차단).

---

## 7. 비활성/삭제

protection rule 을 임시 비활성해야 하는 경우(긴급 비상 회전 §4 등):

```bash
# reviewer 등록 해제 (위험 — 임시만)
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/environments/prod" \
  -F "wait_timer=0"
```

이후 §4.2 로 즉시 복구해야 한다. 비상 회전 처리 직후 자동 알림 issue 가 발행되도록 별도 스크립트 추가는 후속 작업.

---

## 8. 변경 이력

| 일자(KST) | 버전 | 변경 | 작성 |
|---|---|---|---|
| 2026-06-15 | 1.0.0 | 가이드 신설 (회전 자동화 v2 PR — PAT 만료 알림 + 분기 자동 회전 동시 신설) | MindGarden |

---

## 9. 참조

- [`docs/standards/SECRET_ROTATION_POLICY.md`](../standards/SECRET_ROTATION_POLICY.md) — Secret 회전 정책 SSOT
- [`docs/standards/DEPLOYMENT_STANDARD.md`](../standards/DEPLOYMENT_STANDARD.md) — 배포 표준
- [`docs/standards/SECURITY_STANDARD.md`](../standards/SECURITY_STANDARD.md) — 보안 표준
- [`.github/workflows/check-pat-expiry.yml`](../../.github/workflows/check-pat-expiry.yml) — PAT 만료 알림
- [`.github/workflows/quarterly-secret-rotation-trigger.yml`](../../.github/workflows/quarterly-secret-rotation-trigger.yml) — 분기 자동 회전
- GitHub Docs: [Environment protection rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-protection-rules)
