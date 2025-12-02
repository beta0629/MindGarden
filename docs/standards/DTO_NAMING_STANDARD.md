# DTO 네이밍 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 DTO (Data Transfer Object) 네이밍 규칙 및 구조 표준입니다.

### 참조 문서
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)

### 구현 위치
- **Core DTOs**: `src/main/java/com/coresolution/core/dto/`
- **Consultation DTOs**: `src/main/java/com/coresolution/consultation/dto/`

---

## 🎯 네이밍 규칙

### 1. Request DTO

#### 생성 요청
```
형식: {Entity}CreateRequest
```

**예시**:
```java
CommonCodeCreateRequest
TenantRoleCreateRequest
UserCreateRequest
ConsultantCreateRequest
```

#### 수정 요청
```
형식: {Entity}UpdateRequest
```

**예시**:
```java
CommonCodeUpdateRequest
TenantRoleUpdateRequest
UserUpdateRequest
ConsultantUpdateRequest
```

#### 조회/액션 요청
```
형식: {Entity}QueryRequest 또는 {Action}Request
```

**예시**:
```java
UserQueryRequest
LoginRequest
PasswordResetRequest
EmailSendRequest
PaymentCreateRequest
```

---

### 2. Response DTO

#### 단일 응답
```
형식: {Entity}Response
```

**예시**:
```java
CommonCodeResponse
TenantRoleResponse
UserResponse
ConsultantResponse
```

#### 목록 응답
```
형식: {Entity}ListResponse
```

**예시**:
```java
CommonCodeListResponse
TenantRoleListResponse
UserListResponse
ConsultantListResponse
```

---

### 3. 레거시 DTO (Deprecated)

#### 기존 패턴
```
❌ {Entity}Dto → ✅ {Entity}Response
❌ {Entity}CreateDto → ✅ {Entity}CreateRequest
❌ {Entity}ResponseDto → ✅ {Entity}Response
```

**마이그레이션 예시**:
```java
// Before
BranchDto → BranchResponse
UserDto → UserResponse
ScheduleCreateDto → ScheduleCreateRequest
ScheduleResponseDto → ScheduleResponse

// After
@Deprecated
public class BranchDto {
    // 레거시 코드, BranchResponse 사용 권장
}
```

---

## 📋 DTO 구조

### 1. Request DTO 기본 구조

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {
    
    /**
     * 이메일 (필수)
     */
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String email;
    
    /**
     * 비밀번호 (필수)
     */
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String password;
    
    /**
     * 이름 (필수)
     */
    @NotBlank(message = "이름은 필수입니다.")
    private String name;
    
    /**
     * 전화번호 (선택)
     */
    private String phone;
    
    /**
     * 역할 (필수)
     */
    @NotNull(message = "역할은 필수입니다.")
    private UserRole role;
    
    /**
     * 테넌트 ID (필수)
     */
    @NotBlank(message = "테넌트 ID는 필수입니다.")
    private String tenantId;
}
```

---

### 2. Response DTO 기본 구조

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    /**
     * 사용자 ID
     */
    private Long id;
    
    /**
     * 이메일
     */
    private String email;
    
    /**
     * 이름
     */
    private String name;
    
    /**
     * 전화번호
     */
    private String phone;
    
    /**
     * 역할
     */
    private UserRole role;
    
    /**
     * 테넌트 ID
     */
    private String tenantId;
    
    /**
     * 생성일시
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    /**
     * 수정일시
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    
    /**
     * 정적 팩토리 메서드 - Entity → Response 변환
     */
    public static UserResponse from(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .phone(user.getPhone())
            .role(user.getRole())
            .tenantId(user.getTenantId())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
    
    /**
     * 정적 팩토리 메서드 - Entity List → Response List 변환
     */
    public static List<UserResponse> fromList(List<User> users) {
        return users.stream()
            .map(UserResponse::from)
            .collect(Collectors.toList());
    }
}
```

---

### 3. ListResponse DTO 구조

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {
    
    /**
     * 사용자 목록
     */
    private List<UserResponse> users;
    
    /**
     * 전체 개수
     */
    private Long totalCount;
    
    /**
     * 활성 사용자 수
     */
    private Long activeCount;
    
    /**
     * 비활성 사용자 수
     */
    private Long inactiveCount;
    
    /**
     * 정적 팩토리 메서드
     */
    public static UserListResponse of(List<User> users) {
        List<UserResponse> userResponses = UserResponse.fromList(users);
        
        long activeCount = users.stream()
            .filter(User::isActive)
            .count();
        
        return UserListResponse.builder()
            .users(userResponses)
            .totalCount((long) users.size())
            .activeCount(activeCount)
            .inactiveCount((long) users.size() - activeCount)
            .build();
    }
}
```

---

## 💻 사용 예시

### 1. Controller에서 Request DTO 사용

```java
@PostMapping("/api/v1/users")
public ResponseEntity<ApiResponse<UserResponse>> createUser(
        @Valid @RequestBody UserCreateRequest request) {
    User user = userService.createUser(request);
    UserResponse response = UserResponse.from(user);
    return success(response);
}

@PutMapping("/api/v1/users/{id}")
public ResponseEntity<ApiResponse<UserResponse>> updateUser(
        @PathVariable Long id,
        @Valid @RequestBody UserUpdateRequest request) {
    User user = userService.updateUser(id, request);
    UserResponse response = UserResponse.from(user);
    return updated("사용자 정보가 수정되었습니다.", response);
}
```

---

### 2. Service에서 DTO 변환

```java
@Override
public User createUser(UserCreateRequest request) {
    log.info("🔧 사용자 생성 시작: email={}", request.getEmail());
    
    // Request DTO → Entity 변환
    User user = User.builder()
        .email(request.getEmail())
        .password(passwordEncoder.encode(request.getPassword()))
        .name(request.getName())
        .phone(request.getPhone())
        .role(request.getRole())
        .tenantId(request.getTenantId())
        .build();
    
    User savedUser = userRepository.save(user);
    
    log.info("✅ 사용자 생성 완료: userId={}, email={}", savedUser.getId(), savedUser.getEmail());
    return savedUser;
}
```

---

## ✅ DTO 작성 체크리스트

### Request DTO
- [ ] `{Entity}CreateRequest` 또는 `{Entity}UpdateRequest` 네이밍
- [ ] `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` 어노테이션
- [ ] 필수 필드에 `@NotNull`, `@NotBlank` 검증
- [ ] 이메일 필드에 `@Email` 검증
- [ ] JavaDoc 주석 (필수/선택 명시)

### Response DTO
- [ ] `{Entity}Response` 네이밍
- [ ] `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` 어노테이션
- [ ] 날짜 필드에 `@JsonFormat` 어노테이션
- [ ] `from()` 정적 팩토리 메서드 구현
- [ ] `fromList()` 정적 팩토리 메서드 구현 (목록용)
- [ ] JavaDoc 주석

### ListResponse DTO
- [ ] `{Entity}ListResponse` 네이밍
- [ ] 목록 필드 (`List<{Entity}Response>`)
- [ ] 통계 필드 (`totalCount`, `activeCount` 등)
- [ ] `of()` 정적 팩토리 메서드 구현

---

## 🚫 금지 사항

### 1. 레거시 네이밍 사용
```java
// ❌ 금지
public class UserDto { }
public class UserCreateDto { }
public class UserResponseDto { }

// ✅ 권장
public class UserResponse { }
public class UserCreateRequest { }
```

### 2. 검증 어노테이션 누락
```java
// ❌ 금지
public class UserCreateRequest {
    private String email;  // 검증 없음
    private String password;  // 검증 없음
}

// ✅ 권장
public class UserCreateRequest {
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String email;
    
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String password;
}
```

### 3. 정적 팩토리 메서드 누락
```java
// ❌ 금지
public class UserResponse {
    // from() 메서드 없음
}

// ✅ 권장
public class UserResponse {
    public static UserResponse from(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            // ...
            .build();
    }
}
```

---

## 📊 DTO 마이그레이션 현황

### 완료된 DTO (표준 준수)
| DTO | 상태 | 비고 |
|-----|------|------|
| CommonCodeCreateRequest | ✅ | 표준 준수 |
| CommonCodeUpdateRequest | ✅ | 표준 준수 |
| CommonCodeResponse | ✅ | 표준 준수 |
| TenantRoleCreateRequest | ✅ | 표준 준수 |
| TenantRoleUpdateRequest | ✅ | 표준 준수 |
| TenantRoleResponse | ✅ | 표준 준수 |

### 마이그레이션 필요 (레거시)
| DTO | 신규 DTO | 우선순위 |
|-----|---------|---------|
| BranchDto | BranchResponse | P0 (Deprecated) |
| UserDto | UserResponse | P0 (Deprecated) |
| ScheduleDto | ScheduleResponse | P1 |
| ScheduleCreateDto | ScheduleCreateRequest | P1 |
| ConsultantDto | ConsultantResponse | P2 |

---

## 💡 베스트 프랙티스

### 1. 명확한 네이밍
```java
// Good
PaymentCreateRequest
EmailSendRequest
LoginRequest

// Better (더 명확)
PaymentProcessRequest
EmailNotificationRequest
UserLoginRequest
```

### 2. 검증 메시지 한글화
```java
@NotBlank(message = "이메일은 필수입니다.")
@Email(message = "이메일 형식이 올바르지 않습니다.")
@Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
```

### 3. 정적 팩토리 메서드 활용
```java
// Controller
UserResponse response = UserResponse.from(user);
List<UserResponse> responses = UserResponse.fromList(users);
UserListResponse listResponse = UserListResponse.of(users);
```

---

## 📞 문의

DTO 네이밍 표준 관련 문의:
- 백엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-02

