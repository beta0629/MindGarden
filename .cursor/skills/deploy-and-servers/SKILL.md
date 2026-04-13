# 배포 및 서버 정보 (Deploy & Servers)

이 스킬은 **마인드가든 홈페이지**의 개발/운영 서버 접근, 배포 절차, 웹훅 정보를 한곳에 정리한 참조 문서입니다.  
배포·서버 접속·재기동·웹훅 확인 등 관련 요청 시 이 문서를 기준으로 일관되게 동작하세요.

---

## 1. SSH 접근

| 구분 | 호스트 | 접속 |
|------|--------|------|
| **개발** | `beta0629.cafe24.com` | `ssh beta0629.cafe24.com` (로컬 SSH 키) |
| **운영** | `beta74.cafe24.com` | `ssh root@beta74.cafe24.com` |

- **개발** 서버의 배포 경로·웹훅·PM2는 §2~§6. 선택 시 Actions **CI 후 SSH 자동 배포** (`HOMEPAGE_DEV_SSH_DEPLOY` + `DEV_SSH_*` Secrets, `docs/DEV_DEPLOY_CI_SSH.md`). **로컬 PC의 `~/.ssh`는 변경하지 않음** (러너 전용 키는 Secrets에만).
- **운영** 서버 요약은 §8.

---

## 2. 개발 서버

| 항목 | 값 |
|------|-----|
| **배포 경로** | `/var/www/homepage` |
| **브랜치** | `homepage/develop` |
| **PM2 앱 이름** | `homepage-dev` (실제 서비스 중) |
| **PM2 웹훅 리스너** | `homepage-webhook` (포트 3001) |
| **Next.js 포트** | 4000 (`npm start` → next start -p 4000) |

---

## 3. 개발 배포 워크플로 (권장 정리)

1. **GitHub Actions → SSH 자동 배포 (선택)**  
   - Variable `HOMEPAGE_DEV_SSH_DEPLOY=true` + Secrets `DEV_SSH_HOST`, `DEV_SSH_USER`, `DEV_SSH_KEY`.  
   - `homepage/develop` 푸시 → **빌드 성공 후** 서버에서 `deploy-from-webhook.sh` → `pm2 restart homepage-dev`.  
   - 시크릿 이름·절차: **`docs/DEV_DEPLOY_CI_SSH.md`**

2. **SSH 수동**  
   - 로컬 `ssh`로 접속 후 `deploy-from-webhook.sh` 또는 스킬 §6. **기존 로컬 키·config 유지.**

3. **GitHub Webhook (푸시 즉시)**  
   - 아래 Payload URL. CI와 무관할 수 있음.

레포의 배포 로직 단일 소스: `scripts/deploy-from-webhook.sh`, 루트 `deploy-from-webhook.sh`는 위임.

---

## 4. 웹훅 자동 배포 (키 없이 사용)

- **Payload URL**: `http://114.202.247.246:3001/webhook`
- **서버 IP**: `114.202.247.246` (beta0629.cafe24.com)
- **동작**: `homepage/develop` 푸시 → GitHub이 서버로 POST → `deploy-from-webhook.sh` 실행 → git pull, build, **pm2 restart homepage-dev** 자동
- **재기동**: 웹훅이 정상 동작하면 **수동 재기동 불필요** (스크립트에 포함됨)

**자동 배포가 되는지 확인**: 푸시 후에도 사이트에 오류가 나거나 예전 버전이 보이면 웹훅·CI SSH 중 사용 중인 경로를 점검한다. (1) Webhook: Settings → Webhooks, (2) CI SSH: Actions에서 `deploy-dev` 성공 여부, (3) 서버 `pm2 list`. **자동이 안 되면 아래 6번 수동 배포**로 반영하면 된다.

**배포 후 자동 재기동이 안 되는 경우**: 코드는 갱신됐는데(빌드까지 됐는데) 앱이 예전 버전으로 보이면 **재기동 단계가 빠진 것**이다. 서버에서 다음을 확인할 것. (1) `deploy-from-webhook.sh` 스크립트 **끝**에 `pm2 restart homepage-dev` 가 반드시 있는지. (2) `git pull` 만 쓰는 경로라면 `.git/hooks/post-merge` 에도 빌드 후 `pm2 restart homepage-dev` 가 있는지. 없으면 추가. 참고 예시: `docs/DEPLOY_SCRIPT_REFERENCE.md`

**자동 배포 자체가 안 될 때 점검 (웹훅 → 재기동까지)**  
푸시해도 자동으로 배포·재기동이 안 되면 아래 순서로 점검한다. 상세: `docs/AUTO_DEPLOY_TROUBLESHOOTING.md`

1. **웹훅이 서버에 도달하는지**  
   - GitHub 저장소 → Settings → Webhooks → Payload URL `http://114.202.247.246:3001/webhook` 등록 여부  
   - Recent Deliveries에서 푸시 시 **200** 응답·성공 여부 (실패 시 URL/방화벽/시크릿 확인)
2. **서버 웹훅 로그**  
   - `pm2 logs homepage-webhook --lines 100`  
   - "Webhook received for ref:", "Deployment triggered" 등이 **전혀 없으면** 1번부터 재확인 (요청이 서버에 안 옴)
3. **배포 스크립트·리스너**  
   - `deploy-from-webhook.sh` 끝에 `pm2 restart homepage-dev` 있는지  
   - `webhook-listener.js`: `refs/heads/homepage/develop` 일 때만 `exec`로 위 스크립트 실행 (서버에 이미 있음)
4. **빌드 실패로 재기동까지 못 가는 경우**  
   - 웹훅은 오지만 빌드가 실패하면 `set -e` 등으로 스크립트가 중단되어 `pm2 restart`가 실행되지 않음  
   - `pm2 logs homepage-webhook` 에 "Deployment error" 등이 있는지 확인  
   - 서버에서 수동 실행으로 동일 환경 검증: `cd /var/www/homepage && bash deploy-from-webhook.sh` (실패 시 env/노드 버전 등 확인)

---

## 5. 서버 배포 스크립트 경로

| 스크립트 | 경로 | 용도 |
|----------|------|------|
| 웹훅·SSH 공통 | 레포 루트 `deploy-from-webhook.sh` → `scripts/deploy-from-webhook.sh` | git fetch/reset, `npm ci`, `build`, `pm2 restart homepage-dev` |
| 서버상 관례 경로 | `/var/www/homepage/deploy-from-webhook.sh` | 위 루트 스크립트와 동일·또는 심볼릭 링크 권장 |
| 수동 배포 | `/var/www/homepage/deploy.sh` | 수동 실행용(있는 경우) |

---

## 6. 수동 배포 절차 (웹훅·CI SSH 미동작 시)

**전제**: 수동 배포는 **개발 서버에 SSH로 로그인할 수 있어야** 한다.  
로컬에서는 지금 쓰는 **`ssh beta0629.cafe24.com`** 방식(기존 키·`~/.ssh/config`) 그대로 사용하면 된다.  
자동 배포를 끈 경우에도 **사람이 수동 배포하려면 SSH가 필요**하다. (Actions용 키는 Secrets에만 있고 로컬과 별개.)

SSH 접속 후 아래 순서로 실행:

```bash
ssh beta0629.cafe24.com
cd /var/www/homepage
git fetch origin homepage/develop
git reset --hard origin/homepage/develop
npm ci
npm run build
pm2 restart homepage-dev
```

- `npm ci --production`만 하면 빌드 시 일부 모듈이 없어 실패할 수 있음 → **빌드할 때는 `npm ci`** (전체 의존성) 사용.

**배포된 커밋 확인**: 수동 배포 후 `git log -1 --oneline`으로 최신 커밋이 반영됐는지 확인. (예: RSC 이벤트 핸들러 수정 = `93319414`)

---

## 7. GitHub / CI

- **저장소**: `beta0629/MindGarden`
- **개발 브랜치**: `homepage/develop`
- **Actions**: `Deploy Homepage` — `deploy-dev`에서 **린트 + 빌드** 후, Variable 켜져 있으면 **SSH로 개발 서버 배포** (`docs/DEV_DEPLOY_CI_SSH.md`).
- **Secrets**: 빌드용 DB 등 + (자동 배포 시) **`DEV_SSH_HOST`**, **`DEV_SSH_USER`**, **`DEV_SSH_KEY`**. 로컬 `~/.ssh`와 별개.

---

## 8. 운영 서버

| 항목 | 값 |
|------|-----|
| **호스트** | `beta74.cafe24.com` |
| **SSH** | `ssh root@beta74.cafe24.com` |
| **공개 URL** | `https://m-garden.co.kr` |
| **앱 배포 경로** | `/var/www/homepage` |
| **PM2 앱 이름** | `homepage` (`npm start` → Next.js **포트 4000**) |
| **nginx (추가만)** | `/etc/nginx/conf.d/m-garden-homepage-nextjs.conf` |
| **배포 스크립트** | 레포 `scripts/deploy-production.sh` (서버에서 `bash scripts/deploy-production.sh`) |

- 개발(`beta0629.cafe24.com`)과 **별도 호스트**다.
- **도메인 연동**: 위 nginx 파일만 **추가**했고, `sites-available`·기존 블록은 **수정하지 않음**. `nginx.conf`는 `conf.d`를 `sites-enabled`보다 먼저 include하므로, 동일 `server_name`(m-garden.co.kr, www)에 대해 이 프록시가 **410 Gone** 등 후속 중복 블록보다 우선한다. (중복 경고는 무시되는 쪽이 후속 블록.)
- SSL은 기존 Let’s Encrypt 인증서 경로 `/etc/letsencrypt/live/m-garden.co.kr/` 사용.
- 레포 예시(백업·재현용): `docs/nginx-m-garden-homepage-nextjs.conf.example`
- **운영 배포**: 서버에 `.env` 또는 `.env.production`을 두고(템플릿 `/.env.production.example`), DB는 개발과 **동일 계정·비밀번호**, **`DB_HOST` 만 운영 DB 주소**(같은 장비면 `127.0.0.1`)로 설정. 이후 `cd /var/www/homepage && bash scripts/deploy-production.sh`.
- 비밀번호·개인키는 저장소/문서에 적지 않는다.

---

## 9. 참고 문서 (프로젝트 내)

- `docs/DEV_DEPLOY_CI_SSH.md` — **GitHub Actions SSH 시크릿·Variable 설정**
- `docs/GITHUB_WEBHOOK_SETUP.md` — 웹훅 설정 방법
- `docs/AUTO_DEPLOY_SETUP.md` — 자동 배포 개요
- `docs/AUTO_DEPLOY_TROUBLESHOOTING.md` — **자동 배포가 안 될 때 점검 절차** (웹훅 수신 → 재기동)
- `docs/DEPLOY_SCRIPT_REFERENCE.md` — 배포 스크립트 예시·**재기동(pm2 restart) 확인** 방법
- `docs/nginx-m-garden-homepage-nextjs.conf.example` — **운영** `m-garden.co.kr` → Next(:4000) nginx 추가 블록 예시
- Webhook Secret: `mindgarden-webhook-secret-2025` (GitHub Webhooks 설정 시 사용)

---

**이 스킬 사용 시기**: 배포 요청, 개발 서버 접속/확인, 재기동, 웹훅/수동 배포 절차 안내, 서버/경로/PM2 이름 질문이 있을 때 이 문서를 우선 참조하세요.
