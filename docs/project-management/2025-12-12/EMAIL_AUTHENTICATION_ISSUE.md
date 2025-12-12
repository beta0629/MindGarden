# 이메일 인증 문제 해결 가이드

**작성일**: 2025-12-12  
**상태**: 진행 중

---

## 🔍 현재 상황

### 문제
- Gmail 앱 비밀번호 재생성 후에도 `Authentication failed` / `no password specified?` 오류 지속
- API 응답은 성공하지만 실제 이메일 전송 실패

### 현재 설정
- **MAIL_USERNAME**: `mindgarden1013@gmail.com`
- **MAIL_PASSWORD**: `pvvlfwygmbrsfqcb` (coreSolution 계정으로 재생성)
- **MAIL_HOST**: `smtp.gmail.com`
- **MAIL_PORT**: `587`

### 발견된 문제
1. **계정 불일치 가능성**: 
   - `MAIL_USERNAME`은 `mindgarden1013@gmail.com`
   - 앱 비밀번호는 `coreSolution` 계정으로 재생성
   - **Gmail 앱 비밀번호는 해당 계정의 것이어야 함**

2. **비밀번호 전달 확인**:
   - 프로세스 정보에서 비밀번호가 전달되고 있음 확인
   - `-Dspring.mail.password=pvvlfwygmbrsfqcb` (따옴표 없이 정상 전달)

---

## 🛠️ 해결 방법

### 방법 1: 계정 일치 확인 (권장)

**옵션 A**: `coreSolution` 계정의 실제 이메일 주소 확인 후 `MAIL_USERNAME` 업데이트
```bash
# coreSolution 계정의 이메일 주소가 무엇인지 확인 필요
# 예: coresolution@gmail.com 또는 다른 주소
```

**옵션 B**: `mindgarden1013@gmail.com` 계정의 앱 비밀번호 재생성
```bash
# 1. mindgarden1013@gmail.com 계정으로 로그인
# 2. 앱 비밀번호 재생성
# 3. 새 비밀번호로 MAIL_PASSWORD 업데이트
```

### 방법 2: Gmail 계정 설정 확인

1. **2단계 인증 활성화 확인**
   - https://myaccount.google.com → 보안 → 2단계 인증
   - 앱 비밀번호 사용을 위해서는 2단계 인증 필수

2. **앱 비밀번호 유효성 확인**
   - 앱 비밀번호가 만료되지 않았는지 확인
   - 앱 비밀번호가 올바르게 복사되었는지 확인 (공백 없음)

3. **"보안 수준이 낮은 앱 액세스" 확인**
   - 앱 비밀번호를 사용하면 이 설정은 필요 없음
   - 하지만 확인해볼 가치는 있음

---

## 📋 체크리스트

- [ ] `MAIL_USERNAME`과 앱 비밀번호가 같은 계정인지 확인
- [ ] Gmail 계정의 2단계 인증 활성화 확인
- [ ] 앱 비밀번호가 만료되지 않았는지 확인
- [ ] 앱 비밀번호가 올바르게 복사되었는지 확인 (공백 없음, 16자리)
- [ ] `coreSolution` 계정의 실제 이메일 주소 확인
- [ ] 필요시 `MAIL_USERNAME` 업데이트 또는 앱 비밀번호 재생성

---

## 🔄 다음 단계

1. **계정 정보 확인**: `coreSolution` 계정의 실제 이메일 주소 확인
2. **설정 업데이트**: 계정과 비밀번호 일치 확인 후 업데이트
3. **재테스트**: 이메일 전송 재테스트

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-12

