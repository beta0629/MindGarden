# 보안 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 포괄적인 보안 표준입니다.  
인증, 인가, 데이터 보호, 입력 검증, 보안 감사 등 모든 보안 관련 사항을 정의합니다.

### 참조 문서
- [보안 인증 표준](./SECURITY_AUTHENTICATION_STANDARD.md) - JWT, 인증 관련
- [암호화 처리 표준](./ENCRYPTION_STANDARD.md) - 암호화 관련
- [API 설계 표준](./API_DESIGN_STANDARD.md) - API 보안 관련

### 구현 위치
- **보안 설정**: `src/main/java/com/coresolution/consultation/config/SecurityConfig.java`
- **보안 필터**: `src/main/java/com/coresolution/core/security/SecurityFilter.java`
- **입력 검증**: `src/main/java/com/coresolution/consultation/config/InputValidationConfig.java`
- **보안 감사**: `src/main/java/com/coresolution/core/security/SecurityAuditService.java`

---

## 🎯 보안 원칙

### 1. 보안 우선 원칙 (Security First)
```
보안은 모든 기능 개발의 최우선 고려사항
```

**원칙**:
- ✅ 최소 권한 원칙 (Principle of Least Privilege)
- ✅ 심층 방어 (Defense in Depth)
- ✅ 실패 시 안전 (Fail Secure)
- ✅ 완전한 중간 방지 (Complete Mediation)
- ✅ 개방 설계 (Open Design)

### 2. 환경 변수 관리
```
모든 비밀키는 환경 변수로 관리, 하드코딩 절대 금지
```

**원칙**:
- ✅ 환경 변수로 비밀키 관리
- ✅ `.env` 파일은 `.gitignore`에 포함
- ✅ 운영/개발 환경 분리
- ❌ 코드 내 비밀키 하드코딩 금지

### 3. 보안 감사 필수
```
모든 보안 이벤트는 기록되어야 함
```

**원칙**:
- ✅ 로그인/로그아웃 기록
- ✅ 권한 변경 기록
- ✅ 민감 데이터 접근 기록
- ✅ 보안 위협 탐지 기록

---

## 🔐 인증/인가

### 1. 세션 기반 인증

#### 세션 관리
```java
// SessionBasedAuthenticationFilter
- 세션 기반 인증 사용
- 세션 타임아웃 설정
- 동시 세션 제한 (운영: 1개, 개발: 3개)
```

#### 세션 보안
```java
// SecurityConfig.java
@Bean
public SessionAuthenticationStrategy sessionAuthenticationStrategy() {
    ConcurrentSessionControlAuthenticationStrategy concurrentSessionControl = 
        new ConcurrentSessionControlAuthenticationStrategy(sessionRegistry());
    
    if (isProductionEnvironment()) {
        concurrentSessionControl.setMaximumSessions(1);  // 운영: 1개만
    } else {
        concurrentSessionControl.setMaximumSessions(3);  // 개발: 3개까지
    }
    
    return new CompositeSessionAuthenticationStrategy(
        Arrays.asList(concurrentSessionControl, registerSession)
    );
}
```

### 2. JWT 토큰 인증

#### JWT 설정
```java
// 환경 변수 필수
JWT_SECRET=<32자 이상의 강력한 비밀키>
JWT_EXPIRATION=3600000  // 1시간
JWT_REFRESH_EXPIRATION=604800000  // 7일
```

#### JWT 검증
```java
// JwtAuthenticationFilter
- Authorization 헤더에서 토큰 추출
- 토큰 서명 검증
- 토큰 만료 확인
- 토큰 블랙리스트 확인
```

### 3. 권한 체크

#### 동적 권한 시스템
```java
// PermissionCheckUtils 사용
ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
    session, 
    "RESOURCE_CREATE", 
    dynamicPermissionService
);

if (check != null) {
    return check; // 401 또는 403 응답
}
```

---

## 🛡️ 입력 검증 및 방어

### 1. SQL Injection 방지

#### 백엔드 검증
```java
// SecurityAuditService.checkSQLInjection()
- SQL 키워드 패턴 검사
- 특수 문자 검사
- 파라미터화된 쿼리 사용 필수
```

#### 프론트엔드 검증
```javascript
// 입력값 검증
const validateInput = (input) => {
  const sqlPattern = /['";\\]/;
  if (sqlPattern.test(input)) {
    throw new Error('잘못된 입력입니다.');
  }
};
```

### 2. XSS (Cross-Site Scripting) 방지

#### 백엔드 검증
```java
// SecurityAuditService.checkXSS()
- 스크립트 태그 패턴 검사
- 이벤트 핸들러 패턴 검사
- HTML 이스케이프 처리
```

#### 프론트엔드 방어
```javascript
// React는 기본적으로 XSS 방어
// 사용자 입력은 항상 검증
const sanitizeInput = (input) => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
```

### 3. CSRF (Cross-Site Request Forgery) 방지

#### 백엔드 설정
```java
// SecurityConfig.java
.csrf(csrf -> csrf
    .csrfTokenRepository(csrfTokenRepository())
    .ignoringRequestMatchers(
        "/api/auth/**"  // 인증 API는 CSRF 제외
    )
)
```

#### 프론트엔드 처리
```javascript
// CSRF 토큰 자동 관리
import csrfTokenManager from '../utils/csrfTokenManager';

// API 호출 시 자동으로 CSRF 토큰 포함
csrfTokenManager.initialize();
```

### 4. 경로 순회 공격 방지

```java
// SecurityAuditService.checkPathTraversal()
- "../", "..\\" 패턴 검사
- 시스템 파일 경로 검사
- 파일 경로 정규화
```

---

## 🔒 데이터 보호

### 1. 개인정보 암호화

#### 암호화 필수 항목
- 이름 (name)
- 전화번호 (phone)
- 이메일 (email)
- 주소 (address)
- 계좌번호 (bankAccount)

#### 암호화 방법
```java
// PersonalDataEncryptionUtil 사용
user.setName(encryptionUtil.safeEncrypt(request.getName()));
user.setPhone(encryptionUtil.safeEncrypt(request.getPhone()));
```

자세한 내용은 [암호화 처리 표준](./ENCRYPTION_STANDARD.md) 참조

### 2. 비밀번호 보호

#### 비밀번호 정책
- 최소 8자 이상
- 영문 대소문자, 숫자, 특수문자 포함
- BCrypt 암호화 (Strength: 12)

```java
// BCrypt 암호화
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

### 3. 로그에서 개인정보 마스킹

```java
// 로그 출력 시 마스킹
log.info("사용자 조회: name={}, phone={}", 
    encryptionUtil.maskName(user.getName()),
    maskPhone(user.getPhone()));
```

---

## 🚨 보안 위협 탐지

### 1. 보안 이벤트 감지

#### 탐지 대상
- SQL Injection 시도
- XSS 공격 시도
- 경로 순회 공격 시도
- 무단 접근 시도
- 로그인 실패 반복

#### 보안 감사 서비스
```java
// SecurityAuditService
public void recordSecurityEvent(
    SecurityEventType eventType,
    String clientIP,
    String userAgent,
    String details
) {
    // 보안 이벤트 기록
    // 의심스러운 활동 추적
    // 심각한 경우 즉시 알림
}
```

### 2. 로그인 보안

#### 로그인 실패 제한
- 최대 5회 실패
- 30분간 계정 잠금
- 실패 횟수 Redis에 저장

```java
// LoginSecurityService
private static final int MAX_LOGIN_ATTEMPTS = 5;
private static final long ACCOUNT_LOCK_DURATION = 1800000L; // 30분
```

### 3. 의심스러운 활동 모니터링

```java
// SecurityAuditService
- 의심스러운 IP 추적
- 이상 패턴 감지
- 자동 알림 발송
```

---

## 🌐 네트워크 보안

### 1. HTTPS/TLS

#### 운영 환경 필수
- 모든 통신은 HTTPS
- TLS 1.2 이상 사용
- 인증서 정기 갱신

### 2. CORS 설정

#### 환경별 설정
```java
// SecurityConfig.corsConfigurationSource()
if (isProd) {
    // 운영: 특정 도메인만 허용
    configuration.setAllowedOrigins(Arrays.asList(
        "https://core-solution.co.kr",
        "https://m-garden.co.kr"
    ));
} else {
    // 개발: localhost 허용
    configuration.setAllowedOriginPatterns(Arrays.asList("*"));
}
```

### 3. Rate Limiting

```java
// RateLimitingConfig
- API 호출 제한
- IP별 요청 제한
- DDoS 공격 방어
```

---

## 🔑 키 관리

### 1. 키 로테이션

#### 주기
- JWT 비밀키: 90일
- 암호화 키: 180일
- API 키: 365일

#### 로테이션 절차
1. 새 키 생성
2. 환경 변수에 추가
3. 활성 키 변경
4. 점진적 재암호화

자세한 내용은 [암호화 처리 표준](./ENCRYPTION_STANDARD.md) 참조

### 2. 키 저장

```bash
# 환경 변수로 관리
JWT_SECRET=<비밀키>
ENCRYPTION_KEY=<암호화키>

# .env 파일은 .gitignore에 포함
```

---

## 📊 보안 감사 로그

### 1. 로그 기록 대상

- 로그인/로그아웃
- 권한 변경
- 민감 데이터 접근
- 보안 설정 변경
- 보안 위협 탐지

### 2. 로그 형식

```java
// SecurityAuditLog
{
  "eventType": "LOGIN",
  "userId": 123,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "result": "SUCCESS",
  "timestamp": "2025-12-03T10:00:00"
}
```

### 3. 로그 보관

- 최소 1년 보관
- 암호화 저장
- 정기 백업

---

## 🚫 금지 사항

### 1. 하드코딩 절대 금지

```java
// ❌ 절대 금지
private static final String JWT_SECRET = "MySecretKey123";
private static final String ENCRYPTION_KEY = "MyEncryptionKey";

// ✅ 필수
@Value("${jwt.secret}")
private String jwtSecret;
```

### 2. 평문 저장 금지

```java
// ❌ 절대 금지
user.setPassword("plaintext");

// ✅ 필수
user.setPassword(passwordEncoder.encode("plaintext"));
```

### 3. 민감한 정보 로깅 금지

```java
// ❌ 절대 금지
log.info("비밀번호: {}", password);
log.info("JWT 토큰: {}", token);

// ✅ 필수
log.info("사용자 로그인: email={}", email);
```

### 4. SQL 직접 조작 금지

```java
// ❌ 절대 금지
String query = "SELECT * FROM users WHERE id = " + userId;

// ✅ 필수
@Query("SELECT u FROM User u WHERE u.id = :userId")
User findById(@Param("userId") Long userId);
```

---

## ✅ 체크리스트

### 보안 설정
- [ ] 환경 변수로 비밀키 관리
- [ ] HTTPS 통신 설정
- [ ] CORS 정책 설정
- [ ] CSRF 보호 활성화
- [ ] 세션 보안 설정

### 인증/인가
- [ ] 로그인 실패 제한 구현
- [ ] 세션 타임아웃 설정
- [ ] 동시 세션 제한 설정
- [ ] 권한 체크 구현

### 데이터 보호
- [ ] 개인정보 암호화 적용
- [ ] 비밀번호 BCrypt 암호화
- [ ] 로그 마스킹 적용
- [ ] 데이터베이스 백업

### 입력 검증
- [ ] SQL Injection 방어
- [ ] XSS 방어
- [ ] 경로 순회 방어
- [ ] 입력값 검증

### 보안 감사
- [ ] 보안 이벤트 로깅
- [ ] 로그 보관 정책
- [ ] 모니터링 시스템
- [ ] 알림 시스템

---

## 💡 베스트 프랙티스

### 1. 최소 권한 원칙

```java
// 필요한 최소한의 권한만 부여
if (!hasPermission("USER_VIEW")) {
    throw new ForbiddenException("권한이 없습니다.");
}
```

### 2. 심층 방어

```java
// 여러 레벨에서 보안 검사
// 1. 프론트엔드 검증
// 2. 백엔드 입력 검증
// 3. 권한 체크
// 4. 데이터베이스 제약 조건
```

### 3. 실패 시 안전

```java
// 에러 발생 시 보안이 강화되도록
try {
    // 보안 작업
} catch (Exception e) {
    log.error("보안 오류", e);
    // 기본적으로 접근 거부
    throw new SecurityException("접근이 거부되었습니다.");
}
```

---

## 📞 문의

보안 표준 관련 문의:
- 보안 팀
- 백엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03

