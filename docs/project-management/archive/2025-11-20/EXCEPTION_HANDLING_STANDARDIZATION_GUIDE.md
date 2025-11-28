# 예외 처리 표준화 가이드

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 분석 완료

---

## 📋 개요

CoreSolution 플랫폼의 서비스 레이어에서 예외 처리 패턴을 표준화하여 일관성과 유지보수성을 향상시킵니다.

---

## 🔍 현재 예외 처리 현황

### 통계

- **throw new 사용**: 314개 매치 (51개 파일)
- **throw new *Exception 사용**: 20개 파일
- **커스텀 예외 클래스**: 3개
  - `EntityNotFoundException`
  - `ValidationException`
  - `ConnectionTestException`

### 예외 처리 구조

1. **GlobalExceptionHandler** ✅
   - `@RestControllerAdvice`로 전역 예외 처리
   - `ErrorResponse` DTO 사용
   - HTTP 상태 코드 매핑

2. **커스텀 예외 클래스**
   - `EntityNotFoundException`: 엔티티를 찾을 수 없을 때
   - `ValidationException`: 데이터 검증 실패 시
   - `ConnectionTestException`: 연결 테스트 실패 시

3. **예외 처리 패턴**
   - 서비스에서 커스텀 예외 throw
   - GlobalExceptionHandler에서 예외 처리
   - ErrorResponse로 일관된 응답

---

## 🎯 표준화 목표

1. **일관된 예외 처리**
   - 비즈니스 예외는 커스텀 예외 사용
   - 예외는 GlobalExceptionHandler에서 처리

2. **명확한 예외 메시지**
   - 사용자 친화적인 메시지
   - 개발자를 위한 상세 정보 (개발 환경)

3. **적절한 HTTP 상태 코드**
   - 예외 유형에 맞는 상태 코드 매핑

---

## 📝 표준화 규칙

### 규칙 1: 비즈니스 예외는 커스텀 예외 사용

**권장 패턴:**
```java
@Override
public User findById(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("User", id));
}
```

**이유:**
- 명확한 예외 의미
- GlobalExceptionHandler에서 일관된 처리
- HTTP 상태 코드 자동 매핑

### 규칙 2: 검증 실패는 ValidationException 사용

**권장 패턴:**
```java
if (user.getEmail() == null || user.getEmail().isEmpty()) {
    throw new ValidationException("이메일은 필수입니다.");
}

if (user.getAge() < 0) {
    throw new ValidationException("age", user.getAge(), "나이는 0 이상이어야 합니다.");
}
```

**이유:**
- 검증 오류를 명확히 구분
- 필드별 오류 정보 제공 가능
- HTTP 400 Bad Request 자동 매핑

### 규칙 3: 엔티티를 찾을 수 없을 때는 EntityNotFoundException 사용

**권장 패턴:**
```java
@Override
public User findById(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("User", id));
}

@Override
public User findByIdOrThrow(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("User", id, "사용자를 찾을 수 없습니다."));
}
```

**이유:**
- 명확한 예외 의미
- HTTP 404 Not Found 자동 매핑
- 엔티티 이름과 ID 정보 포함

### 규칙 4: 예외 메시지는 사용자 친화적으로 작성

**권장 패턴:**
```java
// Good
throw new ValidationException("이메일 형식이 올바르지 않습니다.");

// Bad
throw new ValidationException("Invalid email format");
```

**이유:**
- 한국어 사용자 대상
- 명확한 오류 메시지
- 사용자 경험 향상

### 규칙 5: 예외는 GlobalExceptionHandler에서 처리

**권장 패턴:**
```java
// 서비스에서 예외 throw
@Override
public User createUser(UserCreateRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
        throw new ValidationException("이미 사용 중인 이메일입니다.");
    }
    // ...
}

// GlobalExceptionHandler에서 자동 처리
@ExceptionHandler(ValidationException.class)
public ResponseEntity<ErrorResponse> handleValidation(ValidationException e, HttpServletRequest request) {
    // HTTP 400 Bad Request 응답
}
```

**이유:**
- 일관된 예외 처리
- 중앙 집중식 관리
- 코드 중복 감소

### 규칙 6: 체크 예외는 가능한 한 언체크 예외로 변환

**권장 패턴:**
```java
// Before
public void processFile(String filePath) throws IOException {
    // 파일 처리
}

// After
public void processFile(String filePath) {
    try {
        // 파일 처리
    } catch (IOException e) {
        throw new RuntimeException("파일 처리 중 오류가 발생했습니다.", e);
    }
}
```

**이유:**
- 트랜잭션 롤백 보장
- 코드 간결성
- 예외 전파 단순화

---

## ✅ 표준화 체크리스트

### 서비스 구현체 작성 시

- [ ] 비즈니스 예외는 커스텀 예외 사용
- [ ] 검증 실패는 `ValidationException` 사용
- [ ] 엔티티를 찾을 수 없을 때는 `EntityNotFoundException` 사용
- [ ] 예외 메시지는 사용자 친화적으로 작성
- [ ] 예외는 GlobalExceptionHandler에서 처리되도록 함
- [ ] 체크 예외는 가능한 한 언체크 예외로 변환

### 리팩토링 시

- [ ] 기존 예외 처리 패턴 확인
- [ ] 커스텀 예외로 변경 가능한 부분 식별
- [ ] 예외 메시지 개선
- [ ] 테스트 및 검증

---

## 📊 현재 상태 분석

### 잘 적용된 부분

1. **GlobalExceptionHandler** ✅
   - 전역 예외 처리 구현
   - ErrorResponse 사용
   - HTTP 상태 코드 매핑

2. **커스텀 예외 클래스** ✅
   - EntityNotFoundException
   - ValidationException
   - ConnectionTestException

3. **예외 처리 패턴** ✅
   - 서비스에서 커스텀 예외 throw
   - GlobalExceptionHandler에서 처리

### 개선이 필요한 부분

1. **예외 메시지 일관성**
   - 일부 예외 메시지가 영어로 작성됨
   - 사용자 친화적인 메시지로 개선 필요

2. **예외 유형 확장**
   - 비즈니스 예외 유형 추가 고려
   - 예: `BusinessException`, `UnauthorizedException`, `ForbiddenException` 등

3. **예외 처리 문서화**
   - 예외 처리 가이드 문서화
   - 코드 리뷰 체크리스트 업데이트

---

## 🔄 마이그레이션 가이드

### 단계 1: 커스텀 예외로 변경

```java
// Before
if (user == null) {
    throw new RuntimeException("User not found");
}

// After
if (user == null) {
    throw new EntityNotFoundException("User", id);
}
```

### 단계 2: 검증 예외로 변경

```java
// Before
if (email == null) {
    throw new IllegalArgumentException("Email is required");
}

// After
if (email == null) {
    throw new ValidationException("이메일은 필수입니다.");
}
```

### 단계 3: 예외 메시지 개선

```java
// Before
throw new ValidationException("Invalid input");

// After
throw new ValidationException("입력 데이터가 올바르지 않습니다.");
```

---

## 📝 커스텀 예외 클래스

### EntityNotFoundException

```java
public class EntityNotFoundException extends RuntimeException {
    private final String entityName;
    private final Object identifier;
    
    public EntityNotFoundException(String entityName, Object identifier) {
        super(String.format("%s를 찾을 수 없습니다. ID: %s", entityName, identifier));
        this.entityName = entityName;
        this.identifier = identifier;
    }
}
```

**사용 예시:**
```java
return userRepository.findById(id)
    .orElseThrow(() -> new EntityNotFoundException("User", id));
```

### ValidationException

```java
public class ValidationException extends RuntimeException {
    private final String fieldName;
    private final Object invalidValue;
    private final List<String> validationErrors;
    private final Map<String, String> fieldErrors;
    
    public ValidationException(String message) {
        super(message);
    }
    
    public ValidationException(String fieldName, Object invalidValue, String message) {
        super(message);
        this.fieldName = fieldName;
        this.invalidValue = invalidValue;
    }
}
```

**사용 예시:**
```java
if (email == null) {
    throw new ValidationException("이메일은 필수입니다.");
}

if (age < 0) {
    throw new ValidationException("age", age, "나이는 0 이상이어야 합니다.");
}
```

---

## ⚠️ 주의사항

### 1. 예외 메시지 보안

- 민감한 정보(비밀번호, 개인정보 등)를 예외 메시지에 포함하지 않음
- 사용자에게 노출되는 메시지는 안전하게 작성

### 2. 예외 스택 트레이스

- 운영 환경에서는 스택 트레이스를 노출하지 않음
- 개발 환경에서만 상세 정보 제공

### 3. 예외 로깅

- 예외 발생 시 적절한 로그 레벨 사용
- `log.warn()`: 비즈니스 예외
- `log.error()`: 시스템 예외

---

## 📝 다음 단계

1. **예외 메시지 개선**
   - 영어로 작성된 예외 메시지를 한국어로 변경
   - 사용자 친화적인 메시지로 개선

2. **예외 유형 확장** (필요시)
   - 비즈니스 예외 유형 추가
   - 예: `BusinessException`, `UnauthorizedException`, `ForbiddenException` 등

3. **예외 처리 문서화**
   - 예외 처리 가이드 배포
   - 코드 리뷰 체크리스트 업데이트

---

**마지막 업데이트**: 2025-11-20

