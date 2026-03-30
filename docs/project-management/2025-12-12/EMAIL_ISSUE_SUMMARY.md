# 개발 서버 이메일 전송 문제 요약

**확인일**: 2025-12-12 09:23  
**상태**: ❌ **이메일 전송 실패**

---

## 🔍 문제 상황

### 발견된 오류
```
Authentication failed
Caused by: jakarta.mail.AuthenticationFailedException: failed to connect, no password specified?
```

### 완료된 작업
1. ✅ 시작 스크립트에 이메일 환경 변수 export 추가
2. ✅ 환경 변수 파일에 이메일 설정 확인 (`/etc/mindgarden/dev.env`)
3. ✅ Java 시스템 프로퍼티로 이메일 설정 전달 추가
4. ✅ 백엔드 재시작 완료

### 현재 설정
- **환경 변수**: `/etc/mindgarden/dev.env`에 설정됨
  - `MAIL_HOST=smtp.gmail.com`
  - `MAIL_PORT=587`
  - `MAIL_USERNAME=mindgarden1013@gmail.com`
  - `MAIL_PASSWORD="ombe ansd pbcx wgrz"` (따옴표 포함)

- **시작 스크립트**: `/opt/mindgarden/start.sh`
  - 환경 변수 export
  - Java 시스템 프로퍼티로 전달: `-Dspring.mail.password="ombe ansd pbcx wgrz"`

---

## 🔧 가능한 원인

### 1. Gmail 앱 비밀번호 문제
- 앱 비밀번호가 만료되었을 수 있음
- 앱 비밀번호가 잘못되었을 수 있음
- Gmail 계정의 2단계 인증이 비활성화되었을 수 있음

### 2. Spring Boot 설정 우선순위 문제
- `application-dev.yml`의 `${MAIL_PASSWORD:}`가 빈 값으로 해석될 수 있음
- Java 시스템 프로퍼티가 YAML 설정보다 우선순위가 낮을 수 있음

### 3. 공백 포함 비밀번호 처리 문제
- 비밀번호에 공백이 포함되어 있어서 파싱 문제가 발생할 수 있음

---

## 📋 해결 방법

### 방법 1: Gmail 앱 비밀번호 재생성
1. Google 계정 → 보안 → 2단계 인증 확인
2. 앱 비밀번호 재생성
3. 새로운 비밀번호로 `/etc/mindgarden/dev.env` 업데이트
4. 백엔드 재시작

### 방법 2: application-dev.yml 직접 설정 (임시)
```yaml
spring:
  mail:
    password: "ombe ansd pbcx wgrz"  # 직접 설정 (보안 주의)
```

### 방법 3: 비밀번호 공백 제거
- Gmail 앱 비밀번호는 공백 없이 16자리 문자열
- 현재 비밀번호에 공백이 포함되어 있음 → 재생성 필요

---

## ⚠️ 주의사항

1. **보안**: 이메일 비밀번호를 Git에 커밋하지 않음
2. **테스트**: 실제 이메일 수신 확인 필요
3. **모니터링**: 이메일 전송 실패 로그 모니터링

---

## 📝 다음 단계

1. **즉시**: Gmail 앱 비밀번호 재생성 및 확인
2. **단기**: 새로운 비밀번호로 설정 업데이트 및 테스트
3. **중기**: 이메일 전송 모니터링 시스템 구축
4. **장기**: 이메일 전송 실패 시 알림 시스템 구축

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-12 09:23


