# 에러 처리 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 에러 처리 및 예외 관리 표준입니다.

### 참조 문서
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [로깅 표준](./LOGGING_STANDARD.md)

### 구현 위치
- **GlobalExceptionHandler**: `src/main/java/com/coresolution/consultation/exception/GlobalExceptionHandler.java`
- **ErrorResponse**: `src/main/java/com/coresolution/core/dto/ErrorResponse.java`
- **커스텀 예외**: `src/main/java/com/coresolution/consultation/exception/`

---

## 🎯 에러 처리 원칙

### 1. 전역 예외 처리
```
모든 예외는 GlobalExceptionHandler에서 중앙 집중식으로 처리
```

**장점**:
- ✅ 일관된 에러 응답 형식
- ✅ 중복 코드 제거
- ✅ 유지보수 용이

### 2. 커스텀 예외 사용
```
비즈니스 예외는 커스텀 예외 클래스로 정의
```

**장점**:
- ✅ 명확한 예외 의미
- ✅ HTTP 상태 코드 자동 매핑
- ✅ 예외 처리 로직 분리

### 3. 표준 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "errorCode": "ERROR_CODE",
  "timestamp": "2025-12-02T10:00:00",
  "status": 400,
  "details": "상세 정보 (선택)",
  "path": "/api/v1/users",
  "method": "POST"
}
```

---

## 📋 커스텀 예외 클래스

### 1. EntityNotFoundException
```java
/**
 * 엔티티를 찾을 수 없을 때 발생
 * HTTP 404 Not Found
 */
public class EntityNotFoundException extends RuntimeException {
    private final String entityName;
    private final Object entityId;
    
    public EntityNotFoundException(String entityName, Object entityId) {
        super(String.format("%s를 찾을 수 없습니다: %s", entityName, entityId));
        this.entityName = entityName;
        this.entityId = entityId;
    }
}
```

**사용 예시**:
```java
@Override
public User findById(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("User", id));
}
```

---

### 2. ValidationException
```java
/**
 * 데이터 검증 실패 시 발생
 * HTTP 400 Bad Request
 */
public class ValidationException extends RuntimeException {
    private Map<String, String> fieldErrors;
    private List<String> validationErrors;
    
    public ValidationException(String message) {
        super(message);
    }
    
    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
}
```

**사용 예시**:
```java
if (user.getEmail() == null || user.getEmail().isEmpty()) {
    throw new ValidationException("이메일은 필수입니다.");
}

// 필드별 에러
Map<String, String> errors = new HashMap<>();
errors.put("email", "이메일 형식이 올바르지 않습니다.");
errors.put("phone", "전화번호는 필수입니다.");
throw new ValidationException("입력값 검증 실패", errors);
```

---

### 3. BusinessException
```java
/**
 * 비즈니스 로직 예외
 * HTTP 400 Bad Request
 */
public class BusinessException extends RuntimeException {
    private final String errorCode;
    
    public BusinessException(String message) {
        super(message);
        this.errorCode = "BUSINESS_ERROR";
    }
    
    public BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}
```

**사용 예시**:
```java
if (user.getBalance() < amount) {
    throw new BusinessException("잔액이 부족합니다.", "INSUFFICIENT_BALANCE");
}
```

---

### 4. UnauthorizedException
```java
/**
 * 인증 실패
 * HTTP 401 Unauthorized
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
```

**사용 예시**:
```java
if (currentUser == null) {
    throw new UnauthorizedException("로그인이 필요합니다.");
}
```

---

### 5. ForbiddenException
```java
/**
 * 권한 없음
 * HTTP 403 Forbidden
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
```

**사용 예시**:
```java
if (!hasPermission(currentUser, "CONSULTANT_MANAGE")) {
    throw new ForbiddenException("상담사 관리 권한이 없습니다.");
}
```

---

## 💻 GlobalExceptionHandler 구현

### 기본 구조
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    /**
     * EntityNotFoundException 처리
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(
            EntityNotFoundException e, HttpServletRequest request) {
        log.warn("Entity not found: {}", e.getMessage());
        
        ErrorResponse error = ErrorResponse.of(
            e.getMessage(),
            "ENTITY_NOT_FOUND",
            HttpStatus.NOT_FOUND.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    /**
     * ValidationException 처리
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            ValidationException e, HttpServletRequest request) {
        log.warn("Validation error: {}", e.getMessage());
        
        String details = null;
        if (e.hasFieldErrors()) {
            details = e.getFieldErrors().entrySet().stream()
                .map(entry -> entry.getKey() + ": " + entry.getValue())
                .collect(Collectors.joining(", "));
        }
        
        ErrorResponse error = ErrorResponse.of(
            e.getMessage(),
            "VALIDATION_ERROR",
            HttpStatus.BAD_REQUEST.value(),
            details
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    /**
     * AccessDeniedException 처리 (Spring Security)
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException e, HttpServletRequest request) {
        log.warn("Access denied: {}", e.getMessage());
        
        ErrorResponse error = ErrorResponse.of(
            "접근 권한이 없습니다.",
            "ACCESS_DENIED",
            HttpStatus.FORBIDDEN.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }
    
    /**
     * Exception 처리 (기타 모든 예외)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception e, HttpServletRequest request) {
        log.error("Unexpected error occurred: {}", e.getMessage(), e);
        
        ErrorResponse error = ErrorResponse.of(
            "예상치 못한 오류가 발생했습니다.",
            "UNEXPECTED_ERROR",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

---

## 📊 HTTP 상태 코드 매핑

| 예외 | HTTP 상태 코드 | 에러 코드 | 설명 |
|------|---------------|----------|------|
| EntityNotFoundException | 404 | ENTITY_NOT_FOUND | 리소스를 찾을 수 없음 |
| ValidationException | 400 | VALIDATION_ERROR | 입력값 검증 실패 |
| BusinessException | 400 | BUSINESS_ERROR | 비즈니스 로직 예외 |
| UnauthorizedException | 401 | UNAUTHORIZED | 인증 실패 |
| ForbiddenException | 403 | ACCESS_DENIED | 권한 없음 |
| IllegalArgumentException | 400 | INVALID_ARGUMENT | 잘못된 인자 |
| Exception | 500 | UNEXPECTED_ERROR | 예상치 못한 오류 |

---

## ✅ 에러 처리 체크리스트

### Controller에서
- [ ] try-catch 블록 사용 금지 (GlobalExceptionHandler에 위임)
- [ ] 비즈니스 예외는 커스텀 예외 throw
- [ ] 검증 실패는 ValidationException throw

### Service에서
- [ ] 엔티티 조회 실패 시 EntityNotFoundException throw
- [ ] 검증 실패 시 ValidationException throw
- [ ] 비즈니스 로직 예외 시 BusinessException throw
- [ ] 예외 메시지는 사용자 친화적으로 작성

### GlobalExceptionHandler에서
- [ ] 모든 커스텀 예외 처리 추가
- [ ] 적절한 HTTP 상태 코드 반환
- [ ] ErrorResponse 형식 준수
- [ ] 로그 레벨 적절히 사용 (warn, error)

---

## 🚫 금지 사항

### 1. Controller에서 try-catch 사용
```java
// ❌ 금지
@PostMapping("/users")
public ResponseEntity<?> createUser(@RequestBody UserRequest request) {
    try {
        User user = userService.createUser(request);
        return ResponseEntity.ok(user);
    } catch (Exception e) {
        return ResponseEntity.status(500).body("에러 발생");
    }
}

// ✅ 권장
@PostMapping("/users")
public ResponseEntity<ApiResponse<UserResponse>> createUser(@RequestBody UserRequest request) {
    User user = userService.createUser(request);
    UserResponse response = UserResponse.from(user);
    return success(response);
}
```

### 2. 일반 Exception throw
```java
// ❌ 금지
if (user == null) {
    throw new Exception("사용자를 찾을 수 없습니다.");
}

// ✅ 권장
if (user == null) {
    throw new EntityNotFoundException("User", userId);
}
```

### 3. 에러 메시지 하드코딩
```java
// ❌ 금지
throw new ValidationException("Email is required");

// ✅ 권장
throw new ValidationException("이메일은 필수입니다.");
```

---

## 📝 에러 코드 목록

### 공통 에러
| 에러 코드 | HTTP | 설명 |
|----------|------|------|
| ENTITY_NOT_FOUND | 404 | 리소스를 찾을 수 없음 |
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| INVALID_ARGUMENT | 400 | 잘못된 인자 |
| UNAUTHORIZED | 401 | 인증 실패 |
| ACCESS_DENIED | 403 | 권한 없음 |
| UNEXPECTED_ERROR | 500 | 예상치 못한 오류 |

### 비즈니스 에러
| 에러 코드 | HTTP | 설명 |
|----------|------|------|
| DUPLICATE_EMAIL | 400 | 이메일 중복 |
| INSUFFICIENT_BALANCE | 400 | 잔액 부족 |
| INVALID_PASSWORD | 400 | 비밀번호 불일치 |
| EXPIRED_TOKEN | 401 | 토큰 만료 |
| INVALID_TOKEN | 401 | 유효하지 않은 토큰 |

---

## 💡 베스트 프랙티스

### 1. 명확한 에러 메시지
```java
// Good
throw new EntityNotFoundException("User", userId);
// 결과: "User를 찾을 수 없습니다: 123"

// Better
throw new ValidationException("이메일 형식이 올바르지 않습니다: " + email);
```

### 2. 필드별 검증 에러
```java
Map<String, String> errors = new HashMap<>();

if (request.getEmail() == null) {
    errors.put("email", "이메일은 필수입니다.");
}
if (request.getPassword() == null) {
    errors.put("password", "비밀번호는 필수입니다.");
}

if (!errors.isEmpty()) {
    throw new ValidationException("입력값 검증 실패", errors);
}
```

### 3. 예외 체인 유지
```java
try {
    // 외부 API 호출
} catch (IOException e) {
    throw new BusinessException("외부 API 호출 실패", e);
}
```

---

## 📞 문의

에러 처리 표준 관련 문의:
- 백엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-02

