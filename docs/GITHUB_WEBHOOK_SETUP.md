# GitHub Webhook 자동 배포 설정 가이드

**작성일**: 2025-12-13  
**목적**: GitHub에 푸시하면 자동으로 개발 서버에 배포

## 서버 설정 완료 사항

✅ Webhook 리스너 서버 실행 중 (PM2: `homepage-webhook`)  
✅ 배포 스크립트 준비 완료  
✅ 포트: 3001

## GitHub Webhook 설정 방법

### 1. GitHub 저장소 접속

1. https://github.com/beta0629/MindGarden 로 이동
2. **Settings** 탭 클릭 (저장소 메뉴에서)
3. 왼쪽 사이드바에서 **Webhooks** 클릭
4. **Add webhook** 버튼 클릭

### 2. Webhook 정보 입력

다음 정보를 입력하세요:

- **Payload URL**: 
  ```
  http://114.202.247.246:3001/webhook
  ```
  
- **Content type**: 
  ```
  application/json
  ```

- **Secret**: 
  ```
  mindgarden-webhook-secret-2025
  ```

- **Which events would you like to trigger this webhook?**:
  - ✅ **Just the push event** 선택

- **Active**: 
  - ✅ 체크 (활성화)

### 3. Webhook 저장

**Add webhook** 버튼을 클릭하여 저장합니다.

### 4. Webhook 테스트

GitHub에서 webhook이 정상 작동하는지 확인:

1. Webhooks 페이지에서 방금 추가한 webhook 클릭
2. **Recent Deliveries** 섹션에서 전송 이력 확인
3. 녹색 체크 표시가 보이면 정상 작동

### 5. 테스트 배포

로컬에서 테스트 커밋 후 푸시:

```bash
cd MindGarden_Homepage_temp
echo "# Test" >> test.txt
git add test.txt
git commit -m "Test webhook deployment"
git push origin homepage/develop
```

서버에서 자동 배포가 시작되는지 확인:

```bash
ssh root@beta0629.cafe24.com
pm2 logs homepage-webhook
```

## 동작 방식

1. **GitHub에 푸시** → GitHub이 webhook 전송
2. **서버 webhook 리스너** → `/webhook` 엔드포인트로 POST 요청 수신
3. **브랜치 확인** → `homepage/develop` 브랜치인지 확인
4. **배포 스크립트 실행** → `deploy-from-webhook.sh` 실행
5. **자동 배포**:
   - Git fetch & reset
   - npm install (package.json 변경 시)
   - npm run build
   - PM2 restart

## 보안

- Webhook signature 검증 활성화 (SHA256 HMAC)
- Secret 키로 인증
- `homepage/develop` 브랜치만 배포

## 문제 해결

### Webhook이 작동하지 않는 경우

1. **PM2 상태 확인**:
   ```bash
   ssh root@beta0629.cafe24.com
   pm2 status homepage-webhook
   ```

2. **Webhook 로그 확인**:
   ```bash
   pm2 logs homepage-webhook
   ```

3. **포트 확인**:
   ```bash
   netstat -tlnp | grep 3001
   ```

4. **방화벽 확인**:
   - 포트 3001이 열려있는지 확인 필요

### 수동 배포

Webhook이 작동하지 않을 때 수동 배포:

```bash
ssh root@beta0629.cafe24.com
cd /var/www/homepage
git pull origin homepage/develop
```

## 서버 정보

- **서버 주소**: beta0629.cafe24.com
- **서버 IP**: 114.202.247.246
- **Webhook 포트**: 3001
- **프로젝트 경로**: /var/www/homepage
- **Webhook Secret**: mindgarden-webhook-secret-2025


