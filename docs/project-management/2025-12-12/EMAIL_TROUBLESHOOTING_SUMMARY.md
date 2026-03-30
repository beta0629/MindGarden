# 이메일 인증 문제 해결 요약

**작성일**: 2025-12-12  
**상태**: 진행 중 (부분 해결)

---

## 🔍 현재 상황

### 완료된 작업
1. ✅ Gmail 앱 비밀번호 재생성 (`mindgarden1013@gmail.com` 계정)
2. ✅ 환경 변수 파일 업데이트 (`/etc/mindgarden/dev.env`)
3. ✅ `start.sh` 스크립트 수정 (이메일 설정 추가)
4. ✅ `EmailConfig` 디버그 로그 추가
5. ✅ 환경 변수 export 확인 (`MAIL_PASSWORD length=16`)

### 현재 문제
- **환경 변수는 전달되고 있지만**, Spring Boot의 `@Value`가 비어있음
- `Password length (@Value): 0` - Spring Boot가 환경 변수를 읽지 못함
- `-D` 옵션으로 전달한 값도 `@Value`에 주입되지 않음

---

## 🛠️ 시도한 해결 방법

### 1. `start.sh` 수정
- ✅ 환경 변수 export 추가
- ✅ `-D` 옵션으로 시스템 프로퍼티 전달
- ✅ 비밀번호 따옴표 제거 로직 추가

### 2. `EmailConfig` 수정
- ✅ `System.getProperty()` 사용 시도 → `null` 반환
- ✅ `Environment.getProperty()` 사용 시도 → `null` 반환
- ✅ `@Value` 직접 사용 → 여전히 비어있음

### 3. `application-dev.yml` 확인
- ⚠️ 파일이 `.gitignore`에 있어서 직접 수정 불가
- ⚠️ GitHub Actions 배포 시 이전 버전으로 덮어쓸 수 있음

---

## 💡 다음 단계 제안

### 방법 1: `application-dev.yml` 직접 수정 (권장)
```bash
# 개발 서버에서 직접 수정
ssh root@beta0629.cafe24.com
cd /var/www/mindgarden-dev
# JAR 파일 내부의 application-dev.yml은 수정 불가
# 대신 외부 설정 파일 사용 또는 환경 변수 직접 사용
```

### 방법 2: 외부 설정 파일 사용
- `application-dev.yml`을 JAR 외부에 배치
- `--spring.config.location` 옵션으로 외부 파일 지정

### 방법 3: 환경 변수 직접 읽기
- `EmailConfig`에서 `System.getenv("MAIL_PASSWORD")` 직접 사용
- `@Value` 대신 `Environment`에서 직접 읽기

---

## 📋 현재 설정 상태

### 환경 변수 (`/etc/mindgarden/dev.env`)
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=mindgarden1013@gmail.com
MAIL_PASSWORD="pvvlfwygmbrsfqcb"
```

### `start.sh` 설정
- ✅ 환경 변수 export 완료
- ✅ `-D` 옵션으로 시스템 프로퍼티 전달
- ✅ 환경 변수 로그 기록 (`/tmp/mindgarden-start.log`)

### 프로세스 확인
```bash
ps aux | grep app.jar
# -Dspring.mail.host=smtp.gmail.com
# -Dspring.mail.port=587
# -Dspring.mail.userId=mindgarden1013@gmail.com
# -Dspring.mail.password=pvvlfwygmbrsfqcb
```

---

## 🔄 권장 해결 방법

**`EmailConfig`에서 `System.getenv()` 직접 사용:**

```java
@Bean
public JavaMailSender javaMailSender() {
    JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
    
    // 환경 변수에서 직접 읽기
    String mailHost = System.getenv("MAIL_HOST");
    String mailPort = System.getenv("MAIL_PORT");
    String mailUserId = System.getenv("MAIL_USERNAME");
    String mailPassword = System.getenv("MAIL_PASSWORD");
    
    mailSender.setHost(mailHost != null && !mailHost.isEmpty() ? mailHost : "smtp.gmail.com");
    mailSender.setPort(mailPort != null && !mailPort.isEmpty() ? Integer.parseInt(mailPort) : 587);
    mailSender.setUsername(mailUserId);
    mailSender.setPassword(mailPassword);
    
    // ... 나머지 설정
}
```

이 방법은 `@Value`나 `Environment`를 거치지 않고 직접 환경 변수를 읽으므로 가장 확실한 방법입니다.

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-12

