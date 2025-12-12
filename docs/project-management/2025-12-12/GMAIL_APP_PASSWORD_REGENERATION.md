# Gmail 앱 비밀번호 재생성 가이드

**작성일**: 2025-12-12  
**목적**: 개발 서버 이메일 전송 문제 해결  
**계정**: `mindgarden1013@gmail.com`

---

## 📋 Gmail 앱 비밀번호 재생성 방법

### 1단계: Google 계정 접속
1. https://myaccount.google.com 접속
2. 로그인: `mindgarden1013@gmail.com`

### 2단계: 2단계 인증 확인
1. 좌측 메뉴 → **보안** 클릭
2. **Google에 로그인** 섹션 확인
3. **2단계 인증**이 활성화되어 있는지 확인
   - 비활성화되어 있으면 활성화 필요

### 3단계: 앱 비밀번호 생성
1. **보안** 페이지에서 **앱 비밀번호** 검색 또는
2. **2단계 인증** 설정 페이지로 이동
3. **앱 비밀번호** 섹션 찾기
4. **앱 선택**: "메일"
5. **기기 선택**: "기타(맞춤 이름)" → "MindGarden Dev Server" 입력
6. **생성** 클릭
7. **16자리 비밀번호 복사** (공백 없이 표시됨, 예: `abcd efgh ijkl mnop` → `abcdefghijklmnop`)

---

## 🔧 재생성 후 설정 업데이트

### 방법 1: SSH로 직접 업데이트
```bash
# 1. 개발 서버 접속
ssh root@beta0629.cafe24.com

# 2. 환경 변수 파일 편집
nano /etc/mindgarden/dev.env

# 3. MAIL_PASSWORD 라인 찾아서 새 비밀번호로 변경
# 예: MAIL_PASSWORD="새로운16자리비밀번호" (따옴표 포함, 공백 없음)

# 4. 저장 후 백엔드 재시작
sudo systemctl restart mindgarden-dev.service

# 5. 로그 확인
sudo journalctl -u mindgarden-dev.service -f | grep -E '이메일|email|Mail'
```

### 방법 2: 스크립트 사용 (권장)
```bash
# 재생성한 새 비밀번호를 입력 (공백 없이)
/tmp/update_gmail_password.sh "새로운16자리비밀번호"
```

---

## ⚠️ 중요 사항

### 비밀번호 형식
- ✅ **올바른 형식**: `MAIL_PASSWORD="abcdefghijklmnop"` (따옴표 포함, 공백 없음)
- ❌ **잘못된 형식**: `MAIL_PASSWORD=abc def ghi jkl` (공백 포함)
- ❌ **잘못된 형식**: `MAIL_PASSWORD=abcdefghijklmnop` (따옴표 없음, 공백 포함 시 문제)

### 보안
- 앱 비밀번호는 절대 Git에 커밋하지 않음
- `/etc/mindgarden/dev.env` 파일은 root 권한으로만 접근 가능
- 비밀번호는 정기적으로 재생성 권장

### 계정 확인
- **반드시 `mindgarden1013@gmail.com` 계정의 앱 비밀번호를 사용해야 함**
- 다른 계정의 앱 비밀번호는 작동하지 않음

---

## ✅ 검증 방법

### 1. 환경 변수 확인
```bash
ssh root@beta0629.cafe24.com "source /etc/mindgarden/dev.env && echo \"MAIL_PASSWORD=[\$MAIL_PASSWORD]\""
```

### 2. API 테스트
```bash
curl -X POST "https://api.dev.core-solution.co.kr/api/v1/accounts/integration/send-verification-code?email=test@example.com" \
  -H "Content-Type: application/json"
```

### 3. 로그 확인
```bash
ssh root@beta0629.cafe24.com "journalctl -u mindgarden-dev.service --since '1 minute ago' | grep -E '이메일.*성공|이메일.*실패|Authentication'"
```

### 4. 실제 이메일 수신 확인
- `mindgarden1013@gmail.com` 계정의 받은편지함 확인
- 스팸함도 확인

---

## 📝 체크리스트

- [ ] Google 계정에 로그인 (`mindgarden1013@gmail.com`)
- [ ] 2단계 인증 활성화 확인
- [ ] 앱 비밀번호 재생성 (16자리, 공백 없음)
- [ ] `/etc/mindgarden/dev.env` 파일 업데이트
- [ ] 백엔드 재시작
- [ ] 로그 확인 (오류 없음)
- [ ] API 테스트 (성공 응답)
- [ ] 실제 이메일 수신 확인

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-12
