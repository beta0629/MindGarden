# 개발 서버 이메일 전송 문제 해결

**작성일**: 2025-12-12  
**문제**: 개발 서버에서 이메일 인증 코드가 전송되지 않음

---

## 🔍 문제 분석

### 발견된 문제
1. **환경 변수 누락**: `/opt/mindgarden/start.sh`에 이메일 관련 환경 변수 export가 없음
2. **설정 파일 확인 필요**: `/etc/mindgarden/dev.env`에 이메일 설정이 있는지 확인 필요
3. **application-dev.yml 설정 불일치**: `username` vs `userId` 불일치 (이미 수정됨)

---

## 🔧 해결 방법

### 1. 시작 스크립트 수정 (완료)
**파일**: `.github/workflows/deploy-backend-dev.yml`

**추가된 내용**:
```bash
export MAIL_HOST
export MAIL_PORT
export MAIL_USERNAME
export MAIL_PASSWORD
```

### 2. 개발 서버 환경 변수 설정 필요
**파일**: `/etc/mindgarden/dev.env` (서버에 직접 설정 필요)

**추가해야 할 내용**:
```bash
# 이메일 설정
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # Gmail 앱 비밀번호
```

### 3. application-dev.yml 수정 (완료)
**변경사항**: `spring.mail.username` → `spring.mail.userId`

---

## 📋 실행 단계

### 즉시 실행
1. ✅ GitHub Actions 워크플로우 수정 (시작 스크립트에 이메일 환경 변수 추가)
2. ⏳ 개발 서버에 `/etc/mindgarden/dev.env` 파일에 이메일 설정 추가
3. ⏳ 백엔드 재시작

### 개발 서버에서 실행할 명령어
```bash
# 1. 환경 변수 파일 확인
cat /etc/mindgarden/dev.env

# 2. 이메일 설정 추가 (없는 경우)
echo "" >> /etc/mindgarden/dev.env
echo "# 이메일 설정" >> /etc/mindgarden/dev.env
echo "MAIL_HOST=smtp.gmail.com" >> /etc/mindgarden/dev.env
echo "MAIL_PORT=587" >> /etc/mindgarden/dev.env
echo "MAIL_USERNAME=your-email@gmail.com" >> /etc/mindgarden/dev.env
echo "MAIL_PASSWORD=your-app-password" >> /etc/mindgarden/dev.env

# 3. 백엔드 재시작
sudo systemctl restart mindgarden-dev.service

# 4. 로그 확인
sudo journalctl -u mindgarden-dev.service -f | grep -E '이메일|email|Mail'
```

---

## ⚠️ 주의사항

### Gmail 앱 비밀번호 생성
1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 생성 (16자리)
3. 생성된 비밀번호를 `MAIL_PASSWORD`에 설정

### 보안
- `/etc/mindgarden/dev.env` 파일은 root 권한으로만 접근 가능해야 함
- 이메일 비밀번호는 절대 Git에 커밋하지 않음

---

## ✅ 검증 방법

### 1. 환경 변수 확인
```bash
ssh root@beta0629.cafe24.com "source /etc/mindgarden/dev.env && echo \$MAIL_HOST \$MAIL_USERNAME"
```

### 2. 시작 스크립트 확인
```bash
ssh root@beta0629.cafe24.com "cat /opt/mindgarden/start.sh | grep MAIL"
```

### 3. API 테스트
```bash
curl -X POST "https://api.dev.core-solution.co.kr/api/v1/accounts/integration/send-verification-code?email=test@example.com" \
  -H "Content-Type: application/json"
```

### 4. 로그 확인
```bash
ssh root@beta0629.cafe24.com "tail -50 /var/log/mindgarden/dev.log | grep -E '이메일|email|Mail|SMTP'"
```

## ✅ 완료된 작업

1. ✅ 시작 스크립트에 이메일 환경 변수 export 추가
2. ✅ 백엔드 재시작 완료
3. ⏳ 이메일 전송 테스트 진행 중

---

## 📝 다음 단계

1. **즉시**: 개발 서버에 이메일 환경 변수 추가
2. **단기**: 백엔드 재시작 및 테스트
3. **중기**: 이메일 전송 모니터링 및 로그 확인
4. **장기**: 이메일 전송 실패 시 알림 시스템 구축

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-12

