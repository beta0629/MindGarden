# 배포 스크립트 참고 (서버 점검용)

**목적**: 서버의 `deploy-from-webhook.sh` 또는 `post-merge` 훅에 **재기동 단계가 빠져 있으면** 배포 후에도 예전 프로세스가 계속 떠 있어 사이트가 갱신되지 않는다. 아래 순서대로 재기동까지 포함해 두는지 확인할 것.

---

## 1. 웹훅·CI SSH 공통 배포 스크립트

**레포 단일 소스**: `scripts/deploy-from-webhook.sh` (루트 `deploy-from-webhook.sh`는 이 파일을 호출).

**서버 위치**: `/var/www/homepage/deploy-from-webhook.sh` — 레포를 pull한 뒤 루트 스크립트와 동일 내용이면 됨.

다음 순서가 **전부** 들어가 있어야 한다. **마지막에 `pm2 restart homepage-dev` 가 반드시 있어야** 배포 후 자동 재기동된다.

```bash
#!/bin/bash
set -e
cd /var/www/homepage

# 1) 코드 갱신
git fetch origin homepage/develop
git reset --hard origin/homepage/develop

# 2) 의존성·빌드 (빌드 실패 시 아래 restart 는 실행 안 됨)
npm ci
npm run build

# 3) 반드시 필요: 앱 재기동 (없으면 예전 프로세스가 계속 서빙함)
pm2 restart homepage-dev
```

- `set -e`: 중간에 실패하면 이후 단계 실행 안 함 (빌드 실패 시 restart 는 안 하는 게 맞음).
- **restart 를 빼면** pull·build 만 되고 앱은 재시작되지 않아, 푸시해도 예전 버전이 보일 수 있음.

---

## 2. post-merge 훅 예시 (git pull 시 자동 배포)

**위치**: 서버 `/var/www/homepage/.git/hooks/post-merge`

`git pull` 만 해도 배포가 되게 하려면 이 훅이 있고, **끝에 `pm2 restart homepage-dev`** 가 있어야 한다.

```bash
#!/bin/bash
cd /var/www/homepage
# package.json/package-lock 변경 시에만 npm install 등 처리한 뒤
npm run build
pm2 restart homepage-dev
```

(실제 훅은 npm install 조건 분기 등이 더 있을 수 있음. **중요한 것은 마지막에 `pm2 restart homepage-dev` 가 있는지** 확인하는 것.)

---

## 3. 확인 방법

서버 접속 후:

```bash
# 웹훅 스크립트에 restart 있는지
grep -n "pm2 restart" /var/www/homepage/deploy-from-webhook.sh

# post-merge 훅에 restart 있는지
grep -n "pm2 restart" /var/www/homepage/.git/hooks/post-merge
```

한 줄이라도 나오면 해당 스크립트에는 재기동이 포함된 것이다. 아무것도 안 나오면 **재기동 단계를 스크립트 끝에 추가**하면 된다.
