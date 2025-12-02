# 보안 및 인증 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📋 개요

CoreSolution 플랫폼의 보안 및 인증 시스템 표준입니다. JWT 토큰 관리, 암호화, 키 관리, 보안 감사 로그 등 보안 관련 모든 사항을 정의합니다.

---

## 🎯 핵심 원칙

### ⭐ 보안 우선 원칙

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  모든 보안 키는 환경 변수로 관리하며 하드코딩을 절대 금지합니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**보안 원칙**:
- ✅ 모든 비밀키는 환경 변수로 관리
- ✅ 최소 권한 원칙 (Principle of Least Privilege)
- ✅ 심층 방어 (Defense in Depth)
- ✅ 보안 감사 로그 필수
- ✅ 정기적인 키 로테이션
- ✅ 암호화 통신 (HTTPS/TLS)
- ❌ 하드코딩된 비밀키 절대 금지
- ❌ 평문 비밀번호 저장 금지

---

## 🔐 JWT 토큰 표준

### 1. JWT 비밀키 관리

#### 비밀키 요구사항
```java
// 표준 JWT 설정
public class JwtSecurityStandard {
    // 비밀키 최소 길이 (256비트 = 32바이트)
    public static final int JWT_SECRET_MIN_LENGTH = 32;
    
    // 비밀키 최대 길이
    public static final int JWT_SECRET_MAX_LENGTH = 512;
    
    // 토큰 만료 시간
    public static final long ACCESS_TOKEN_EXPIRATION = 3600000L; // 1시간
    public static final long REFRESH_TOKEN_EXPIRATION = 604800000L; // 7일
    
    // 토큰 발급자
    public static final String TOKEN_ISSUER = "CoreSolution";
    
    // 토큰 타입
    public static final String TOKEN_TYPE = "Bearer";
}
```

#### 환경 변수 설정
```yaml
# application.yml
jwt:
  secret: ${JWT_SECRET}  # 환경 변수 필수
  expiration: ${JWT_EXPIRATION:3600000}
  refresh-expiration: ${JWT_REFRESH_EXPIRATION:604800000}
  issuer: ${JWT_ISSUER:CoreSolution}
```

```bash
# .env 파일 (절대 Git에 커밋하지 않음)
JWT_SECRET=<32자 이상의 강력한 비밀키>
JWT_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=604800000
```

#### 비밀키 검증
```java
@Component
public class JwtSecretValidator {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @PostConstruct
    public void validateJwtSecret() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new SecurityException("JWT 비밀키가 설정되지 않았습니다. JWT_SECRET 환경 변수를 설정하세요.");
        }
        
        if (jwtSecret.length() < JwtSecurityStandard.JWT_SECRET_MIN_LENGTH) {
            throw new SecurityException(
                String.format("JWT 비밀키는 최소 %d자 이상이어야 합니다. 현재: %d자",
                    JwtSecurityStandard.JWT_SECRET_MIN_LENGTH,
                    jwtSecret.length())
            );
        }
        
        // 기본값 사용 경고
        if (jwtSecret.contains("MindGarden") || jwtSecret.contains("default")) {
            log.warn("⚠️ JWT 비밀키가 기본값을 사용하고 있습니다. 운영 환경에서는 반드시 변경하세요!");
        }
        
        log.info("✅ JWT 비밀키 검증 완료: 길이={}자", jwtSecret.length());
    }
}
```

### 2. JWT 토큰 생성 표준

```java
@Service
@RequiredArgsConstructor
public class StandardJwtService {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private Long jwtExpiration;
    
    @Value("${jwt.issuer}")
    private String jwtIssuer;
    
    /**
     * Access Token 생성
     */
    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().name());
        claims.put("tenantId", user.getTenantId());
        claims.put("tokenType", "ACCESS");
        
        return createToken(claims, user.getEmail(), jwtExpiration);
    }
    
    /**
     * Refresh Token 생성
     */
    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("tokenType", "REFRESH");
        
        return createToken(claims, user.getEmail(), 
            Long.parseLong(environment.getProperty("jwt.refresh-expiration", "604800000")));
    }
    
    /**
     * JWT 토큰 생성 (표준 패턴)
     */
    private String createToken(Map<String, Object> claims, String subject, Long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(subject)
            .setIssuer(jwtIssuer)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS512)
            .compact();
    }
    
    /**
     * 서명 키 생성
     */
    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        
        // 키 길이가 32바이트 미만이면 예외
        if (keyBytes.length < JwtSecurityStandard.JWT_SECRET_MIN_LENGTH) {
            throw new SecurityException("JWT 비밀키 길이가 부족합니다.");
        }
        
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    /**
     * 토큰 검증
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (SecurityException e) {
            log.error("잘못된 JWT 서명입니다.");
        } catch (MalformedJwtException e) {
            log.error("잘못된 JWT 토큰입니다.");
        } catch (ExpiredJwtException e) {
            log.error("만료된 JWT 토큰입니다.");
        } catch (UnsupportedJwtException e) {
            log.error("지원되지 않는 JWT 토큰입니다.");
        } catch (IllegalArgumentException e) {
            log.error("JWT 토큰이 비어있습니다.");
        }
        return false;
    }
}
```

### 3. 토큰 블랙리스트 관리

```java
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {
    
    private final RedisTemplate<String, String> redisTemplate;
    
    private static final String BLACKLIST_PREFIX = "token:blacklist:";
    
    /**
     * 토큰 블랙리스트 추가 (로그아웃 시)
     */
    public void addToBlacklist(String token, Long expirationTime) {
        String key = BLACKLIST_PREFIX + token;
        redisTemplate.opsForValue().set(key, "blacklisted", expirationTime, TimeUnit.MILLISECONDS);
        log.info("토큰 블랙리스트 추가: token={}", maskToken(token));
    }
    
    /**
     * 토큰 블랙리스트 확인
     */
    public boolean isBlacklisted(String token) {
        String key = BLACKLIST_PREFIX + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
    
    /**
     * 토큰 마스킹 (로그용)
     */
    private String maskToken(String token) {
        if (token == null || token.length() < 20) {
            return "***";
        }
        return token.substring(0, 10) + "..." + token.substring(token.length() - 10);
    }
}
```

---

## 🔒 암호화 표준

### 1. 비밀번호 암호화

```java
@Configuration
public class PasswordEncoderConfig {
    
    /**
     * BCrypt 암호화 사용 (표준)
     * Strength: 12 (2^12 = 4096 rounds)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}

@Service
@RequiredArgsConstructor
public class PasswordService {
    
    private final PasswordEncoder passwordEncoder;
    
    // 비밀번호 정책
    private static final int PASSWORD_MIN_LENGTH = 8;
    private static final int PASSWORD_MAX_LENGTH = 100;
    private static final String PASSWORD_PATTERN = 
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    
    /**
     * 비밀번호 검증
     */
    public void validatePassword(String password) {
        if (password == null || password.length() < PASSWORD_MIN_LENGTH) {
            throw new InvalidPasswordException(
                String.format("비밀번호는 최소 %d자 이상이어야 합니다.", PASSWORD_MIN_LENGTH)
            );
        }
        
        if (password.length() > PASSWORD_MAX_LENGTH) {
            throw new InvalidPasswordException(
                String.format("비밀번호는 최대 %d자 이하여야 합니다.", PASSWORD_MAX_LENGTH)
            );
        }
        
        if (!password.matches(PASSWORD_PATTERN)) {
            throw new InvalidPasswordException(
                "비밀번호는 영문 대소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다."
            );
        }
    }
    
    /**
     * 비밀번호 암호화
     */
    public String encodePassword(String rawPassword) {
        validatePassword(rawPassword);
        return passwordEncoder.encode(rawPassword);
    }
    
    /**
     * 비밀번호 일치 확인
     */
    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
```

### 2. 개인정보 암호화

```java
@Component
public class PersonalDataEncryption {
    
    @Value("${encryption.personal-data.key}")
    private String encryptionKey;
    
    @Value("${encryption.personal-data.iv}")
    private String encryptionIv;
    
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";
    
    @PostConstruct
    public void validateEncryptionKey() {
        if (encryptionKey == null || encryptionKey.length() < 32) {
            throw new SecurityException("개인정보 암호화 키는 최소 32자 이상이어야 합니다.");
        }
    }
    
    /**
     * 개인정보 암호화 (AES-256)
     */
    public String encrypt(String plainText) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(
                encryptionKey.getBytes(StandardCharsets.UTF_8), ALGORITHM
            );
            IvParameterSpec iv = new IvParameterSpec(
                encryptionIv.getBytes(StandardCharsets.UTF_8)
            );
            
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, iv);
            
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
            
        } catch (Exception e) {
            log.error("개인정보 암호화 실패", e);
            throw new EncryptionException("개인정보 암호화에 실패했습니다.", e);
        }
    }
    
    /**
     * 개인정보 복호화
     */
    public String decrypt(String encryptedText) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(
                encryptionKey.getBytes(StandardCharsets.UTF_8), ALGORITHM
            );
            IvParameterSpec iv = new IvParameterSpec(
                encryptionIv.getBytes(StandardCharsets.UTF_8)
            );
            
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, iv);
            
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decrypted, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            log.error("개인정보 복호화 실패", e);
            throw new EncryptionException("개인정보 복호화에 실패했습니다.", e);
        }
    }
}
```

---

## 🔑 키 관리 표준

### 1. 키 로테이션 전략

```java
@Service
@RequiredArgsConstructor
public class KeyRotationService {
    
    private final KeyRepository keyRepository;
    private final NotificationService notificationService;
    
    /**
     * 매월 1일 자정에 키 로테이션 체크
     */
    @Scheduled(cron = "0 0 0 1 * ?")
    public void checkKeyRotation() {
        log.info("🔐 보안 키 로테이션 체크 시작");
        
        try {
            // 1. JWT 비밀키 로테이션 체크 (90일마다)
            checkJwtSecretRotation();
            
            // 2. 암호화 키 로테이션 체크 (180일마다)
            checkEncryptionKeyRotation();
            
            // 3. API 키 로테이션 체크 (365일마다)
            checkApiKeyRotation();
            
            log.info("✅ 보안 키 로테이션 체크 완료");
            
        } catch (Exception e) {
            log.error("❌ 보안 키 로테이션 체크 실패", e);
            notificationService.sendSecurityAlert("키 로테이션 체크 실패", e.getMessage());
        }
    }
    
    private void checkJwtSecretRotation() {
        KeyMetadata jwtKey = keyRepository.findByKeyType("JWT_SECRET");
        
        if (jwtKey == null) {
            log.warn("JWT 비밀키 메타데이터가 없습니다.");
            return;
        }
        
        LocalDateTime lastRotation = jwtKey.getLastRotationDate();
        LocalDateTime now = LocalDateTime.now();
        long daysSinceRotation = ChronoUnit.DAYS.between(lastRotation, now);
        
        if (daysSinceRotation >= 90) {
            log.warn("⚠️ JWT 비밀키 로테이션 필요: {}일 경과", daysSinceRotation);
            notificationService.sendSecurityAlert(
                "JWT 비밀키 로테이션 필요",
                String.format("마지막 로테이션 이후 %d일이 경과했습니다.", daysSinceRotation)
            );
        } else if (daysSinceRotation >= 75) {
            log.info("📅 JWT 비밀키 로테이션 예정: {}일 후", 90 - daysSinceRotation);
        }
    }
}
```

### 2. 키 메타데이터 관리

```sql
CREATE TABLE IF NOT EXISTS security_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    key_type VARCHAR(50) NOT NULL COMMENT '키 타입: JWT_SECRET, ENCRYPTION_KEY, API_KEY',
    key_id VARCHAR(50) UNIQUE NOT NULL COMMENT '키 ID',
    key_version INT NOT NULL COMMENT '키 버전',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    last_rotation_date TIMESTAMP NOT NULL COMMENT '마지막 로테이션 날짜',
    next_rotation_date TIMESTAMP NOT NULL COMMENT '다음 로테이션 예정일',
    rotation_period_days INT NOT NULL COMMENT '로테이션 주기 (일)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT,
    
    INDEX idx_key_type (key_type),
    INDEX idx_is_active (is_active),
    INDEX idx_next_rotation_date (next_rotation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='보안 키 메타데이터 테이블';
```

---

## 📊 보안 감사 로그

### 1. 보안 이벤트 로깅

```java
@Aspect
@Component
@RequiredArgsConstructor
public class SecurityAuditAspect {
    
    private final SecurityAuditLogRepository auditLogRepository;
    private final HttpServletRequest request;
    
    /**
     * 보안 감사 대상 메서드 자동 로깅
     */
    @Around("@annotation(securityAudit)")
    public Object auditSecurityEvent(ProceedingJoinPoint joinPoint, SecurityAudit securityAudit) throws Throwable {
        String eventType = securityAudit.eventType();
        LocalDateTime startTime = LocalDateTime.now();
        String result = "SUCCESS";
        String errorMessage = null;
        
        try {
            Object returnValue = joinPoint.proceed();
            return returnValue;
            
        } catch (Exception e) {
            result = "FAILED";
            errorMessage = e.getMessage();
            throw e;
            
        } finally {
            // 보안 감사 로그 저장
            saveAuditLog(eventType, result, errorMessage, startTime);
        }
    }
    
    private void saveAuditLog(String eventType, String result, String errorMessage, LocalDateTime startTime) {
        try {
            SecurityAuditLog log = SecurityAuditLog.builder()
                .tenantId(TenantContextHolder.getTenantId())
                .eventType(eventType)
                .userId(SecurityContextHolder.getContext().getAuthentication().getName())
                .ipAddress(getClientIpAddress())
                .userAgent(request.getHeader("User-Agent"))
                .result(result)
                .errorMessage(errorMessage)
                .executionTime(Duration.between(startTime, LocalDateTime.now()).toMillis())
                .build();
            
            auditLogRepository.save(log);
            
        } catch (Exception e) {
            log.error("보안 감사 로그 저장 실패", e);
        }
    }
    
    private String getClientIpAddress() {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

// 보안 감사 어노테이션
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface SecurityAudit {
    String eventType();
}
```

### 2. 보안 감사 로그 테이블

```sql
CREATE TABLE IF NOT EXISTS security_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    event_type VARCHAR(50) NOT NULL COMMENT '이벤트 타입',
    user_id BIGINT COMMENT '사용자 ID',
    user_email VARCHAR(255) COMMENT '사용자 이메일',
    ip_address VARCHAR(50) COMMENT 'IP 주소',
    user_agent TEXT COMMENT 'User Agent',
    event_details JSON COMMENT '이벤트 상세 정보',
    result VARCHAR(20) NOT NULL COMMENT '결과: SUCCESS, FAILED',
    error_message TEXT COMMENT '오류 메시지',
    execution_time BIGINT COMMENT '실행 시간 (ms)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_result (result),
    INDEX idx_created_at (created_at),
    INDEX idx_tenant_event_date (tenant_id, event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='보안 감사 로그 테이블';
```

### 3. 보안 이벤트 타입

```java
public enum SecurityEventType {
    // 인증 관련
    LOGIN("로그인"),
    LOGOUT("로그아웃"),
    LOGIN_FAILED("로그인 실패"),
    PASSWORD_CHANGE("비밀번호 변경"),
    PASSWORD_RESET("비밀번호 재설정"),
    
    // 권한 관련
    PERMISSION_GRANTED("권한 부여"),
    PERMISSION_REVOKED("권한 회수"),
    ROLE_CHANGED("역할 변경"),
    
    // 데이터 접근
    SENSITIVE_DATA_ACCESS("민감 데이터 접근"),
    PERSONAL_DATA_EXPORT("개인정보 내보내기"),
    BULK_DATA_DOWNLOAD("대량 데이터 다운로드"),
    
    // 보안 설정 변경
    SECURITY_CONFIG_CHANGE("보안 설정 변경"),
    KEY_ROTATION("키 로테이션"),
    
    // 의심스러운 활동
    SUSPICIOUS_ACTIVITY("의심스러운 활동"),
    BRUTE_FORCE_ATTEMPT("무차별 대입 공격 시도"),
    UNAUTHORIZED_ACCESS_ATTEMPT("무단 접근 시도");
    
    private final String description;
    
    SecurityEventType(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
```

---

## 🛡️ 로그인 보안

### 1. 로그인 실패 제한

```java
@Service
@RequiredArgsConstructor
public class LoginSecurityService {
    
    private final RedisTemplate<String, Integer> redisTemplate;
    private final SecurityAuditLogRepository auditLogRepository;
    
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final long ACCOUNT_LOCK_DURATION = 1800000L; // 30분
    private static final String LOGIN_ATTEMPT_PREFIX = "login:attempt:";
    
    /**
     * 로그인 실패 기록
     */
    public void recordLoginFailure(String email) {
        String key = LOGIN_ATTEMPT_PREFIX + email;
        Integer attempts = redisTemplate.opsForValue().get(key);
        
        if (attempts == null) {
            attempts = 0;
        }
        
        attempts++;
        redisTemplate.opsForValue().set(key, attempts, ACCOUNT_LOCK_DURATION, TimeUnit.MILLISECONDS);
        
        log.warn("로그인 실패 기록: email={}, attempts={}/{}", email, attempts, MAX_LOGIN_ATTEMPTS);
        
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            log.error("⚠️ 계정 잠금: email={}, 30분 후 재시도 가능", email);
            // 보안 알림 발송
            sendAccountLockNotification(email);
        }
    }
    
    /**
     * 로그인 성공 시 실패 기록 초기화
     */
    public void clearLoginFailures(String email) {
        String key = LOGIN_ATTEMPT_PREFIX + email;
        redisTemplate.delete(key);
    }
    
    /**
     * 계정 잠금 여부 확인
     */
    public boolean isAccountLocked(String email) {
        String key = LOGIN_ATTEMPT_PREFIX + email;
        Integer attempts = redisTemplate.opsForValue().get(key);
        return attempts != null && attempts >= MAX_LOGIN_ATTEMPTS;
    }
    
    /**
     * 남은 로그인 시도 횟수
     */
    public int getRemainingAttempts(String email) {
        String key = LOGIN_ATTEMPT_PREFIX + email;
        Integer attempts = redisTemplate.opsForValue().get(key);
        return attempts == null ? MAX_LOGIN_ATTEMPTS : Math.max(0, MAX_LOGIN_ATTEMPTS - attempts);
    }
}
```

---

## 🚫 금지 사항

### 1. 하드코딩 절대 금지
```java
// ❌ 절대 금지
private static final String JWT_SECRET = "MindGardenJWTSecretKey2025!@#$%^&*()_+";
private static final String ENCRYPTION_KEY = "MyEncryptionKey123";

// ✅ 필수
@Value("${jwt.secret}")
private String jwtSecret;

@Value("${encryption.personal-data.key}")
private String encryptionKey;
```

### 2. 평문 비밀번호 저장 금지
```java
// ❌ 절대 금지
user.setPassword(rawPassword);

// ✅ 필수
user.setPassword(passwordEncoder.encode(rawPassword));
```

### 3. 민감한 정보 로깅 금지
```java
// ❌ 절대 금지
log.info("사용자 비밀번호: {}", password);
log.info("JWT 토큰: {}", token);

// ✅ 필수
log.info("사용자 로그인: email={}", email);
log.info("JWT 토큰 발급: userId={}", userId);
```

---

## ✅ 개발 체크리스트

### 보안 설정
- [ ] JWT 비밀키 환경 변수 설정
- [ ] 암호화 키 환경 변수 설정
- [ ] 비밀키 최소 길이 검증 구현
- [ ] 키 로테이션 스케줄러 설정
- [ ] 보안 감사 로그 테이블 생성

### 인증/인가
- [ ] JWT 토큰 생성/검증 구현
- [ ] 토큰 블랙리스트 관리 구현
- [ ] 비밀번호 정책 검증 구현
- [ ] 로그인 실패 제한 구현
- [ ] 계정 잠금 기능 구현

### 암호화
- [ ] BCrypt 비밀번호 암호화 적용
- [ ] AES-256 개인정보 암호화 적용
- [ ] 암호화 키 검증 로직 구현

### 감사 로그
- [ ] 보안 감사 로그 AOP 구현
- [ ] 보안 이벤트 타입 정의
- [ ] 보안 알림 채널 설정

---

## 📖 참조 문서

- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)
- [로깅 표준](./LOGGING_STANDARD.md)

---

**최종 업데이트**: 2025-12-02

