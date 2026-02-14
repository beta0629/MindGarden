# 배포 및 서버 정보 (Deploy & Servers)

이 스킬은 **마인드가든 홈페이지**의 개발/운영 서버 접근, 배포 절차, 웹훅 정보를 한곳에 정리한 참조 문서입니다.  
배포·서버 접속·재기동·웹훅 확인 등 관련 요청 시 이 문서를 기준으로 일관되게 동작하세요.

---

## 1. SSH 접근

| 항목 | 값 |
|------|-----|
| **호스트** | `beta0629.cafe24.com` |
| **접속** | `ssh beta0629.cafe24.com` (로컬 SSH 키 사용, 별도 키 등록 없음) |
| **비고** | GitHub Actions에서는 SSH 키 없이 **웹훅 배포**만 사용함 |

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

## 3. 웹훅 자동 배포 (키 없이 사용)

- **Payload URL**: `http://114.202.247.246:3001/webhook`
- **서버 IP**: `114.202.247.246` (beta0629.cafe24.com)
- **동작**: `homepage/develop` 푸시 → GitHub이 서버로 POST → `deploy-from-webhook.sh` 실행 → git pull, build, **pm2 restart homepage-dev** 자동
- **재기동**: 웹훅이 정상 동작하면 **수동 재기동 불필요** (스크립트에 포함됨)

**자동 배포가 되는지 확인**: 푸시 후에도 사이트에 오류가 나거나 예전 버전이 보이면 웹훅이 동작하지 않는 것이다. (1) GitHub 저장소 → Settings → Webhooks 에서 해당 URL이 등록돼 있는지, (2) 서버에서 `pm2 list` 로 `homepage-webhook` 이 떠 있는지 확인. **자동이 안 되면 아래 5번 수동 배포**로 반영하면 된다.

**배포 후 자동 재기동이 안 되는 경우**: 코드는 갱신됐는데(빌드까지 됐는데) 앱이 예전 버전으로 보이면 **재기동 단계가 빠진 것**이다. 서버에서 다음을 확인할 것. (1) `deploy-from-webhook.sh` 스크립트 **끝**에 `pm2 restart homepage-dev` 가 반드시 있는지. (2) `git pull` 만 쓰는 경로라면 `.git/hooks/post-merge` 에도 빌드 후 `pm2 restart homepage-dev` 가 있는지. 없으면 추가. 참고 예시: `docs/DEPLOY_SCRIPT_REFERENCE.md`

---

## 4. 서버 배포 스크립트 경로

| 스크립트 | 경로 | 용도 |
|----------|------|------|
| 웹훅 배포 | `/var/www/homepage/deploy-from-webhook.sh` | 푸시 시 자동 실행 (git fetch/reset, npm install 필요 시, build, pm2 restart homepage-dev) |
| 수동 배포 | `/var/www/homepage/deploy.sh` | 수동 실행용 |

---

## 5. 수동 배포 절차 (웹훅 미동작 시)

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

## 6. GitHub / CI

- **저장소**: `beta0629/MindGarden`
- **개발 브랜치**: `homepage/develop`
- **Actions**: `Deploy Homepage` 워크플로는 **린트 + 빌드**만 수행. 실제 배포는 **웹훅**으로 처리 (SSH/SCP 단계 없음).
- **Secrets**: 웹훅만 쓰므로 `DEV_SSH_KEY` 등 SSH 시크릿 불필요.

---

## 7. 운영 서버

- 현재 문서 작성 시점에는 **운영 서버 정보는 개발 서버와 동일**한 것으로 가정.  
- 별도 운영 호스트/경로가 생기면 이 섹션을 갱신하세요.

---

## 8. 참고 문서 (프로젝트 내)

- `docs/GITHUB_WEBHOOK_SETUP.md` — 웹훅 설정 방법
- `docs/AUTO_DEPLOY_SETUP.md` — 자동 배포 개요
- `docs/DEPLOY_SCRIPT_REFERENCE.md` — 배포 스크립트 예시·**재기동(pm2 restart) 확인** 방법
- Webhook Secret: `mindgarden-webhook-secret-2025` (GitHub Webhooks 설정 시 사용)

---

**이 스킬 사용 시기**: 배포 요청, 개발 서버 접속/확인, 재기동, 웹훅/수동 배포 절차 안내, 서버/경로/PM2 이름 질문이 있을 때 이 문서를 우선 참조하세요.
