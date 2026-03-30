# 로깅 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 로깅 패턴 및 관리 표준입니다.

### 참조 문서
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)

### 구현 위치
- **로깅 설정**: `src/main/resources/logback-spring.xml`
- **로거 사용**: `@Slf4j` 어노테이션 (Lombok)

---

## 🎯 로깅 원칙

### 1. @Slf4j 어노테이션 사용
```java
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    // log 변수 자동 생성
}
```

**장점**:
- ✅ 코드 간결성
- ✅ 일관성 유지
- ✅ LoggerFactory 직접 사용 불필요

---

### 2. 구조화된 로깅
```java
// ✅ 권장: 키-값 쌍
log.info("사용자 생성: email={}, createdBy={}", email, createdBy);
log.debug("사용자 조회: id={}", id);
log.warn("사용자를 찾을 수 없습니다: id={}", id);
log.error("사용자 생성 실패: email={}", email, e);

// ❌ 금지: 문자열 연결
log.info("사용자 생성: " + email);
```

**이유**:
- ✅ 로그 파싱 용이
- ✅ 키-값 쌍으로 검색 가능
- ✅ 로그 분석 도구 활용 가능

---

### 3. 적절한 로그 레벨 사용

#### DEBUG 레벨
```java
log.debug("사용자 조회: id={}", id);
log.debug("캐시 조회: key={}", key);
log.debug("SQL 실행: query={}", query);
```

**사용 시점**:
- 디버그 정보
- 상세한 실행 흐름
- 개발 환경에서만 활성화

#### INFO 레벨
```java
log.info("사용자 생성: email={}, createdBy={}", email, createdBy);
log.info("이메일 발송 완료: emailId={}, status={}", emailId, status);
log.info("스케줄 생성: consultantId={}, clientId={}, date={}", consultantId, clientId, date);
```

**사용 시점**:
- 비즈니스 로직 시작/완료
- 중요한 작업 수행
- 운영 환경에서도 활성화

#### WARN 레벨
```java
log.warn("사용자를 찾을 수 없습니다: id={}", id);
log.warn("이메일 발송 제한 초과: email={}", email);
log.warn("보안 이벤트 발생: eventType={}, severity={}", eventType, severity);
```

**사용 시점**:
- 경고 상황
- 비즈니스 예외
- 주의가 필요한 상황

#### ERROR 레벨
```java
log.error("사용자 생성 실패: email={}", email, e);
log.error("이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
log.error("데이터베이스 연결 실패: {}", e.getMessage(), e);
```

**사용 시점**:
- 오류 상황
- 시스템 예외
- 예외 스택 트레이스 포함

---

## 📋 로깅 패턴

### 1. 서비스 메서드 시작/완료
```java
@Override
public User createUser(UserCreateRequest request) {
    log.info("🔧 사용자 생성 시작: email={}", request.getEmail());
    
    // 비즈니스 로직
    User user = userRepository.save(newUser);
    
    log.info("✅ 사용자 생성 완료: userId={}, email={}", user.getId(), user.getEmail());
    return user;
}
```

---

### 2. 조회 메서드
```java
@Override
public User findById(Long id) {
    log.debug("사용자 조회: id={}", id);
    
    return userRepository.findById(id)
        .orElseThrow(() -> {
            log.warn("사용자를 찾을 수 없습니다: id={}", id);
            return new EntityNotFoundException("User", id);
        });
}
```

---

### 3. 예외 처리
```java
try {
    // 작업 수행
    externalApiService.call();
} catch (Exception e) {
    log.error("외부 API 호출 실패: url={}, error={}", url, e.getMessage(), e);
    throw new BusinessException("외부 API 호출에 실패했습니다.", e);
}
```

---

### 4. 권한 체크
```java
if (!hasPermission(currentUser, "CONSULTANT_MANAGE")) {
    log.warn("❌ 권한 없음: 사용자={}, 역할={}, 필요한권한={}", 
            currentUser.getEmail(), currentUser.getRole(), "CONSULTANT_MANAGE");
    throw new ForbiddenException("상담사 관리 권한이 없습니다.");
}

log.info("✅ 권한 확인 완료: 사용자={}, 권한={}", currentUser.getEmail(), "CONSULTANT_MANAGE");
```

---

## 🔒 민감한 정보 보호

### 1. 로그에서 제외해야 할 정보
```java
// ❌ 금지
log.info("사용자 로그인: email={}, password={}", email, password);
log.info("카드 정보: cardNumber={}", cardNumber);
log.info("주민등록번호: ssn={}", ssn);

// ✅ 권장
log.info("사용자 로그인: email={}", email);
log.info("카드 정보: cardNumber={}", maskCardNumber(cardNumber));
log.info("주민등록번호: ssn={}", maskSsn(ssn));
```

---

### 2. 마스킹 유틸리티
```java
/**
 * 전화번호 마스킹
 * 010-1234-5678 → 010-****-5678
 */
private String maskPhone(String phone) {
    if (phone == null || phone.length() < 4) {
        return phone;
    }
    return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
}

/**
 * 이메일 마스킹
 * user@example.com → u***@example.com
 */
private String maskEmail(String email) {
    if (email == null || !email.contains("@")) {
        return email;
    }
    String[] parts = email.split("@");
    return parts[0].charAt(0) + "***@" + parts[1];
}

/**
 * 카드 번호 마스킹
 * 1234-5678-9012-3456 → 1234-****-****-3456
 */
private String maskCardNumber(String cardNumber) {
    if (cardNumber == null || cardNumber.length() < 4) {
        return cardNumber;
    }
    return cardNumber.substring(0, 4) + "-****-****-" + cardNumber.substring(cardNumber.length() - 4);
}
```

---

## 📊 로그 레벨 설정

### application.yml
```yaml
logging:
  level:
    root: INFO
    com.coresolution: INFO
    com.coresolution.consultation.service: DEBUG
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### 환경별 설정
```yaml
# 개발 환경 (application-dev.yml)
logging:
  level:
    root: DEBUG
    com.coresolution: DEBUG

# 운영 환경 (application-prod.yml)
logging:
  level:
    root: INFO
    com.coresolution: INFO
```

---

## ✅ 로깅 체크리스트

### 서비스 구현 시
- [ ] `@Slf4j` 어노테이션 사용
- [ ] 구조화된 로깅 사용 (키-값 쌍)
- [ ] 적절한 로그 레벨 사용
- [ ] 민감한 정보 로그 제외
- [ ] 예외 로깅 시 스택 트레이스 포함
- [ ] 로그 메시지 명확하게 작성

### 리팩토링 시
- [ ] 기존 로깅 패턴 확인
- [ ] `@Slf4j` 사용 확인
- [ ] 로그 레벨 적절성 확인
- [ ] 민감한 정보 포함 여부 확인
- [ ] 로그 메시지 개선

---

## 🚫 금지 사항

### 1. 문자열 연결
```java
// ❌ 금지
log.info("사용자 생성: " + email + ", " + createdBy);

// ✅ 권장
log.info("사용자 생성: email={}, createdBy={}", email, createdBy);
```

### 2. System.out.println 사용
```java
// ❌ 금지
System.out.println("사용자 생성: " + email);

// ✅ 권장
log.info("사용자 생성: email={}", email);
```

### 3. 과도한 로깅
```java
// ❌ 금지 (반복문 내부)
for (User user : users) {
    log.info("사용자 처리: id={}", user.getId());
}

// ✅ 권장
log.info("사용자 일괄 처리 시작: count={}", users.size());
// 처리 로직
log.info("사용자 일괄 처리 완료: count={}", users.size());
```

---

## 💡 베스트 프랙티스

### 1. 이모지 활용
```java
log.info("🔧 사용자 생성 시작: email={}", email);
log.info("✅ 사용자 생성 완료: userId={}", userId);
log.warn("⚠️ 권한 없음: user={}", userId);
log.error("❌ 사용자 생성 실패: {}", e.getMessage(), e);
```

### 2. 컨텍스트 정보 포함
```java
// Good
log.info("사용자 생성 완료: email={}, userId={}", email, userId);

// Better
log.info("사용자 생성 완료: email={}, userId={}, role={}, tenantId={}", 
         email, userId, role, tenantId);
```

### 3. 성능 고려
```java
// 조건부 로깅
if (log.isDebugEnabled()) {
    log.debug("복잡한 객체: {}", expensiveToString(object));
}

// 람다 사용 (Lazy Evaluation)
log.debug("복잡한 객체: {}", () -> expensiveToString(object));
```

---

## 📈 로그 분석

### 1. 로그 파일 위치
```
logs/
├── application.log          # 전체 로그
├── error.log               # 에러 로그만
├── access.log              # API 접근 로그
└── audit.log               # 감사 로그
```

### 2. 로그 로테이션
```xml
<!-- logback-spring.xml -->
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/application.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/application-%d{yyyy-MM-dd}.log</fileNamePattern>
        <maxHistory>30</maxHistory>
    </rollingPolicy>
</appender>
```

### 3. 로그 검색
```bash
# 특정 사용자 로그 검색
grep "email=user@example.com" logs/application.log

# 에러 로그 검색
grep "ERROR" logs/application.log

# 특정 날짜 로그 검색
grep "2025-12-02" logs/application.log
```

---

## ⚠️ 주의사항

### 1. 로그 레벨 설정
- 운영 환경에서는 INFO 레벨 이상만 활성화
- 개발 환경에서는 DEBUG 레벨 활성화 가능
- 로그 레벨은 `application.yml`에서 설정

### 2. 로그 성능
- 과도한 로깅은 성능 저하
- 반복문 내부의 로깅 주의
- 필요시 로그 레벨 조정

### 3. 로그 보관
- 로그 보관 정책 수립 (30일)
- 로그 로테이션 설정
- 로그 분석 도구 활용

---

## 📞 문의

로깅 표준 관련 문의:
- 백엔드 팀
- 운영 팀

**최종 업데이트**: 2025-12-02

