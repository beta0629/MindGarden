# 자동 배포 설정 가이드

**작성일**: 2025-12-13  
**서버**: beta0629.cafe24.com  
**프로젝트 경로**: /var/www/homepage

## 설정된 자동 배포 방법

### 1. Git Post-Merge Hook (자동)

`git pull` 또는 `git merge` 시 자동으로 실행됩니다.

**위치**: `/var/www/homepage/.git/hooks/post-merge`

**실행 순서**:
1. Git pull 확인
2. package.json/package-lock.json 변경 시 npm install
3. npm run build 실행
4. PM2 프로세스 재시작 (homepage-dev)

### 2. 수동 배포 스크립트

필요 시 수동으로 실행할 수 있는 배포 스크립트입니다.

**위치**: `/var/www/homepage/deploy.sh`

**사용 방법**:
```bash
ssh root@beta0629.cafe24.com
cd /var/www/homepage
./deploy.sh
```

## 자동 배포 사용 방법

### 방법 1: Git Pull (권장)

서버에서 직접 pull하면 자동으로 배포됩니다:

```bash
ssh root@beta0629.cafe24.com
cd /var/www/homepage
git pull origin homepage/develop
# 자동으로 빌드 및 재시작됩니다
```

### 방법 2: 수동 배포 스크립트

```bash
ssh root@beta0629.cafe24.com
cd /var/www/homepage
./deploy.sh
```

### 3. GitHub Webhook (자동 - 푸시 시 즉시 배포)

GitHub에 코드를 푸시하면 자동으로 서버가 배포됩니다.

**Webhook 리스너**: PM2로 실행 중 (`homepage-webhook`)
- **포트**: 3001
- **URL**: `http://beta0629.cafe24.com:3001/webhook` 또는 `http://114.202.247.246:3001/webhook`
- **Secret**: `mindgarden-webhook-secret-2025` (환경변수에서 변경 가능)

**GitHub Webhook 설정 방법**:

1. GitHub 저장소로 이동: https://github.com/beta0629/MindGarden
2. Settings → Webhooks → Add webhook 클릭
3. 다음 정보 입력:
   - **Payload URL**: `http://114.202.247.246:3001/webhook`
   - **Content type**: `application/json`
   - **Secret**: `mindgarden-webhook-secret-2025`
   - **Which events**: "Just the push event" 선택
   - **Active**: 체크
4. Add webhook 클릭

**동작 방식**:
- `homepage/develop` 브랜치에 푸시 시 자동으로 배포 실행
- 다른 브랜치는 무시

## 주의사항

1. **Git Pull 시**: post-merge hook이 자동 실행됩니다
2. **GitHub 푸시 시**: Webhook이 자동으로 배포를 트리거합니다 (설정 완료 후)
3. **직접 수정 시**: hook이 실행되지 않으므로 수동으로 배포 스크립트를 실행해야 합니다
4. **PM2 프로세스**: 
   - `homepage-dev`: Next.js 앱
   - `homepage-webhook`: Webhook 리스너

## PM2 관리 명령어

```bash
# 상태 확인
pm2 status homepage-dev

# 재시작
pm2 restart homepage-dev

# 로그 확인
pm2 logs homepage-dev

# 프로세스 정보
pm2 describe homepage-dev
```

## 문제 해결

### Hook이 실행되지 않는 경우

```bash
# Hook 권한 확인
ls -la /var/www/homepage/.git/hooks/post-merge

# 수동 실행 (테스트용)
bash /var/www/homepage/.git/hooks/post-merge
```

### 빌드 실패 시

```bash
# 로그 확인
pm2 logs homepage-dev

# 수동 빌드
cd /var/www/homepage
npm run build

# 재시작
pm2 restart homepage-dev
```


