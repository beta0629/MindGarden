# 로깅 표준화 가이드

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 분석 완료

---

## 📋 개요

CoreSolution 플랫폼의 서비스 레이어에서 로깅 패턴을 표준화하여 일관성과 유지보수성을 향상시킵니다.

---

## 🔍 현재 로깅 사용 현황

### 통계

- **로깅 사용**: 2405개 매치 (90개 파일)
- **@Slf4j 사용**: 96개 매치 (92개 파일)
- **log.debug**: 163개 매치 (33개 파일)
- **log.info**: 1461개 매치 (81개 파일)
- **log.warn**: 261개 매치 (55개 파일)
- **log.error**: 520개 매치 (71개 파일)

### 로깅 프레임워크

- **SLF4J + Lombok**: 대부분의 서비스가 `@Slf4j` 어노테이션 사용
- **LoggerFactory**: 일부 서비스에서 직접 사용

---

## 🎯 표준화 목표

1. **일관된 로깅 패턴**
   - `@Slf4j` 어노테이션 사용
   - 구조화된 로깅 (키-값 쌍)

2. **적절한 로그 레벨 사용**
   - DEBUG: 디버그 정보
   - INFO: 비즈니스 로직 시작/완료
   - WARN: 경고 상황
   - ERROR: 오류 상황

3. **보안 고려**
   - 민감한 정보(비밀번호, 개인정보) 로그 제외
   - 마스킹 처리

---

## 📝 표준화 규칙

### 규칙 1: @Slf4j 어노테이션 사용

**권장 패턴:**
```java
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    // log 변수 자동 생성
}
```

**이유:**
- 코드 간결성
- 일관성 유지
- LoggerFactory 직접 사용 불필요

### 규칙 2: 구조화된 로깅 사용

**권장 패턴:**
```java
log.info("사용자 생성: email={}, createdBy={}", email, createdBy);
log.debug("사용자 조회: id={}", id);
log.warn("사용자를 찾을 수 없습니다: id={}", id);
log.error("사용자 생성 실패: email={}", email, e);
```

**이유:**
- 로그 파싱 용이
- 키-값 쌍으로 검색 가능
- 로그 분석 도구 활용 가능

### 규칙 3: 로그 레벨 적절히 사용

**DEBUG 레벨:**
```java
log.debug("사용자 조회: id={}", id);
log.debug("캐시 조회: key={}", key);
```

**사용 시점:**
- 디버그 정보
- 상세한 실행 흐름
- 개발 환경에서만 활성화

**INFO 레벨:**
```java
log.info("사용자 생성: email={}, createdBy={}", email, createdBy);
log.info("이메일 발송 완료: emailId={}, status={}", emailId, status);
```

**사용 시점:**
- 비즈니스 로직 시작/완료
- 중요한 작업 수행
- 운영 환경에서도 활성화

**WARN 레벨:**
```java
log.warn("사용자를 찾을 수 없습니다: id={}", id);
log.warn("이메일 발송 제한 초과: {}", email);
log.warn("보안 이벤트 발생: eventType={}, severity={}", eventType, severity);
```

**사용 시점:**
- 경고 상황
- 비즈니스 예외
- 주의가 필요한 상황

**ERROR 레벨:**
```java
log.error("사용자 생성 실패: email={}", email, e);
log.error("이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
```

**사용 시점:**
- 오류 상황
- 시스템 예외
- 예외 스택 트레이스 포함

### 규칙 4: 민감한 정보 보호

**권장 패턴:**
```java
// Bad
log.info("사용자 로그인: email={}, password={}", email, password);

// Good
log.info("사용자 로그인: email={}", email);

// Good (마스킹)
log.info("사용자 로그인: email={}, phone={}", email, maskPhone(phone));
```

**마스킹 유틸리티:**
```java
private String maskPhone(String phone) {
    if (phone == null || phone.length() < 4) {
        return phone;
    }
    return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
}
```

**이유:**
- 개인정보 보호
- 보안 강화
- GDPR 준수

### 규칙 5: 예외 로깅 시 스택 트레이스 포함

**권장 패턴:**
```java
try {
    // 작업 수행
} catch (Exception e) {
    log.error("작업 실패: id={}, error={}", id, e.getMessage(), e);
    throw new RuntimeException("작업에 실패했습니다.", e);
}
```

**이유:**
- 디버깅 용이
- 문제 원인 파악
- 예외 체인 유지

### 규칙 6: 로그 메시지 명확하게 작성

**권장 패턴:**
```java
// Good
log.info("사용자 생성 완료: email={}, userId={}", email, userId);
log.warn("이메일 발송 제한 초과: email={}, limit={}", email, limit);

// Bad
log.info("완료");
log.warn("문제 발생");
```

**이유:**
- 로그 분석 용이
- 문제 추적 가능
- 컨텍스트 정보 포함

---

## ✅ 표준화 체크리스트

### 서비스 구현체 작성 시

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

## 📊 현재 상태 분석

### 잘 적용된 부분

1. **@Slf4j 사용** ✅
   - 대부분의 서비스가 `@Slf4j` 어노테이션 사용
   - 92개 파일에서 사용 중

2. **구조화된 로깅** ✅
   - 대부분의 로그가 키-값 쌍 형식 사용
   - 예: `log.info("사용자 생성: email={}, createdBy={}", email, createdBy)`

3. **로그 레벨 사용** ✅
   - DEBUG, INFO, WARN, ERROR 적절히 사용
   - INFO가 가장 많이 사용됨 (1461개)

### 개선이 필요한 부분

1. **로깅 일관성**
   - 일부 서비스에서 로깅 패턴이 다를 수 있음
   - 로그 메시지 형식 통일 필요

2. **민감한 정보 보호**
   - 일부 로그에 민감한 정보가 포함될 수 있음
   - 마스킹 처리 필요

3. **로깅 문서화**
   - 로깅 가이드 문서화
   - 코드 리뷰 체크리스트 업데이트

---

## 🔄 마이그레이션 가이드

### 단계 1: @Slf4j 사용 확인

```java
// Before
private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

// After
@Slf4j
@Service
public class UserServiceImpl implements UserService {
    // log 변수 자동 생성
}
```

### 단계 2: 구조화된 로깅으로 변경

```java
// Before
log.info("사용자 생성: " + email + ", createdBy: " + createdBy);

// After
log.info("사용자 생성: email={}, createdBy={}", email, createdBy);
```

### 단계 3: 민감한 정보 마스킹

```java
// Before
log.info("사용자 로그인: email={}, phone={}", email, phone);

// After
log.info("사용자 로그인: email={}, phone={}", email, maskPhone(phone));
```

### 단계 4: 로그 레벨 조정

```java
// Before
log.info("사용자 조회: id={}", id);  // 단순 조회는 DEBUG가 적절

// After
log.debug("사용자 조회: id={}", id);
```

---

## 📝 로깅 유틸리티

### 마스킹 유틸리티

```java
public class LoggingUtils {
    
    /**
     * 전화번호 마스킹
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
    
    /**
     * 이메일 마스킹
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        String[] parts = email.split("@");
        if (parts[0].length() <= 2) {
            return email;
        }
        return parts[0].substring(0, 2) + "***@" + parts[1];
    }
    
    /**
     * 계좌번호 마스킹
     */
    public static String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 8) {
            return accountNumber;
        }
        return accountNumber.substring(0, 4) + "****" + accountNumber.substring(accountNumber.length() - 4);
    }
}
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

- 로그 보관 정책 수립
- 로그 로테이션 설정
- 로그 분석 도구 활용

---

## 📝 다음 단계

1. **로깅 패턴 통일**
   - 일관된 로깅 패턴 적용
   - 로그 메시지 형식 통일

2. **민감한 정보 보호**
   - 민감한 정보 마스킹 처리
   - 로그 보안 강화

3. **로깅 문서화**
   - 로깅 가이드 배포
   - 코드 리뷰 체크리스트 업데이트

---

## 🔗 관련 문서

- [서비스 레이어 개발 가이드](./SERVICE_LAYER_GUIDE.md)
- [서비스 레이어 코드 리뷰 체크리스트](./SERVICE_LAYER_CODE_REVIEW_CHECKLIST.md)

---

**마지막 업데이트**: 2025-11-20

