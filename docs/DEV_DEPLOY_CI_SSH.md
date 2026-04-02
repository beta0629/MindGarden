# 개발 배포: CI 통과 후 SSH (권장 워크플로)

**목적**: `homepage/develop`에 **푸시 → GitHub Actions에서 린트·빌드 성공 → 그 다음** 개발 서버에서 `git reset`·`npm ci`·`build`·**`pm2 restart homepage-dev`**까지 한 번에 실행한다.  
**선행 조건**: 코드가 이미 CI에서 검증된 뒤에만 서버에 반영되므로, 빌드 실패 시 개발 서버는 이전 커밋을 유지한다.

## 1. 동작 순서

1. 로컬에서 `homepage/develop`에 커밋 후 `git push`.
2. Workflow **Deploy Homepage** → job `deploy-dev`: `npm ci` → lint(경고 허용) → `npm run build`.
3. 저장소 **Variable** `HOMEPAGE_DEV_SSH_DEPLOY`가 `true`이면, 같은 job 마지막에 **SSH**로 서버에 접속해 `deploy-from-webhook.sh` 실행.
4. 스크립트는 `scripts/deploy-from-webhook.sh`의 단일 로직을 사용한다(루트 `deploy-from-webhook.sh`가 위임).

## 2. GitHub 설정

### Repository variables (Settings → Secrets and variables → Actions → Variables)

| Name | 값 | 설명 |
|------|-----|------|
| `HOMEPAGE_DEV_SSH_DEPLOY` | `true` | SSH 배포 단계를 켠다. 비우거나 `true`가 아니면 SSH 배포는 건너뜀(웹훅만 사용 시). |

### Repository secrets (Settings → Secrets and variables → Actions → Secrets)

| Name | 설명 |
|------|------|
| `DEV_SSH_HOST` | 예: `beta0629.cafe24.com` 또는 서버 IP |
| `DEV_SSH_USER` | SSH 로그인 사용자 (예: `root` 또는 배포 전용 계정) |
| `DEV_SSH_KEY` | **전체** PEM 개인키 (`-----BEGIN ... PRIVATE KEY-----` 부터 끝까지) |

SSH 포트가 22가 아니면 `appleboy/ssh-action`에 `port`를 넣도록 `.github/workflows/deploy.yml`을 저장소에서 수정하거나, 서버에서 `~/.ssh/config`로 처리한다.

## 3. 서버 측 (한 번만)

1. 배포 계정의 `~/.ssh/authorized_keys`에 GitHub Actions용 **공개키**를 등록한다.
2. `/var/www/homepage`가 본 레포 클론이고, `homepage/develop`을 추적하는지 확인한다.
3. 최신 코드를 한 번 받은 뒤 루트 `deploy-from-webhook.sh`가 존재하는지 확인한다.  
   - 예전에 루트에만 복붙한 스크립트가 있다면, 레포의 `deploy-from-webhook.sh` + `scripts/deploy-from-webhook.sh` 구조로 맞춘다.

## 4. Webhook과의 관계

- **GitHub Webhook**(푸시 즉시 서버 스크립트 실행)과 **CI 후 SSH**를 동시에 켜면, 같은 푸시에 대해 **빌드가 두 번** 돌 수 있다.
- **권장**: 개발은 **CI 후 SSH만** 쓰거나, **웹훅만** 쓰는 쪽으로 하나로 정리한다.
- CI 후 SSH를 쓰면 GitHub에서 **Recent Deliveries** 실패와 무관하게 배포 신뢰도를 맞추기 쉽다.

## 5. 트러블슈팅

- SSH 단계가 스킵된다 → `HOMEPAGE_DEV_SSH_DEPLOY`가 정확히 `true`인지, **push** 이벤트인지(PR만 아닌지) 확인.
- `Permission denied (publickey)` → Secrets의 키·서버 `authorized_keys`·사용자명 확인.
- 빌드는 되는데 사이트가 안 바뀐다 → 서버에서 `pm2 list`, `git log -1`, `pm2 logs homepage-dev` 확인.

## 6. 관련 파일

- `.github/workflows/deploy.yml` — `deploy-dev` job
- `deploy-from-webhook.sh` — 루트 엔트리 (웹훅·SSH 공통)
- `scripts/deploy-from-webhook.sh` — 실제 fetch / npm ci / build / pm2 restart
