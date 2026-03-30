# API 문서화 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 API 문서화 표준입니다.  
SpringDoc OpenAPI (Swagger)를 사용한 API 문서 작성 규칙을 정의합니다.

### 참조 문서
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [백엔드 코딩 표준](./BACKEND_CODING_STANDARD.md)
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)

### 구현 위치
- **OpenAPI 설정**: `src/main/java/com/coresolution/core/config/OpenApiConfig.java`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`

---

## 🎯 API 문서화 원칙

### 1. 자동 문서화
```
코드와 문서를 동기화하여 유지보수성 향상
```

**원칙**:
- ✅ SpringDoc OpenAPI 어노테이션 사용
- ✅ 코드 변경 시 자동으로 문서 업데이트
- ✅ 수동 문서 작성 최소화
- ❌ 별도 문서 파일 관리 금지

### 2. 명확한 설명
```
API 사용자가 이해하기 쉬운 설명 제공
```

**원칙**:
- ✅ 각 API에 명확한 설명
- ✅ 요청/응답 예시 제공
- ✅ 에러 케이스 문서화
- ✅ 파라미터 설명 명확화

### 3. 일관된 형식
```
모든 API 문서는 일관된 형식으로 작성
```

**원칙**:
- ✅ 표준 어노테이션 사용
- ✅ 일관된 태그 사용
- ✅ 표준 응답 형식 문서화

---

## 📝 OpenAPI 어노테이션

### 1. Controller 레벨

#### @Tag
```java
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "사용자 관리", description = "사용자 생성, 수정, 삭제, 조회 API")
public class UserController {
    // ...
}
```

### 2. 메서드 레벨

#### @Operation
```java
@GetMapping
@Operation(
    summary = "사용자 목록 조회",
    description = "테넌트별 사용자 목록을 페이징하여 조회합니다. 역할, 상태로 필터링 가능합니다."
)
public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
    @Parameter(description = "페이지 번호 (0부터 시작)", example = "0") 
    @RequestParam(defaultValue = "0") int page,
    
    @Parameter(description = "페이지 크기 (기본 20, 최대 100)", example = "20") 
    @RequestParam(defaultValue = "20") int size,
    
    @Parameter(description = "역할 필터 (ADMIN, CONSULTANT, CLIENT, STAFF)", example = "ADMIN") 
    @RequestParam(required = false) String role,
    
    Pageable pageable
) {
    // 구현
}
```

#### @ApiResponses
```java
@PostMapping
@Operation(summary = "사용자 생성", description = "새로운 사용자를 생성합니다.")
@ApiResponses({
    @ApiResponse(
        responseCode = "201",
        description = "생성 성공",
        content = @Content(schema = @Schema(implementation = UserResponse.class))
    ),
    @ApiResponse(
        responseCode = "400",
        description = "잘못된 요청 (입력값 검증 실패)"
    ),
    @ApiResponse(
        responseCode = "403",
        description = "권한 없음 (관리자 권한 필요)"
    ),
    @ApiResponse(
        responseCode = "500",
        description = "서버 오류"
    )
})
public ResponseEntity<ApiResponse<UserResponse>> createUser(
    @RequestBody @Valid UserCreateRequest request
) {
    // 구현
}
```

### 3. 파라미터 문서화

#### @Parameter
```java
@GetMapping("/{id}")
@Operation(summary = "사용자 상세 조회")
public ResponseEntity<ApiResponse<UserResponse>> getUser(
    @Parameter(
        description = "사용자 ID",
        example = "1",
        required = true
    )
    @PathVariable Long id
) {
    // 구현
}
```

#### @RequestBody (Schema)
```java
@PostMapping
@Operation(summary = "사용자 생성")
public ResponseEntity<ApiResponse<UserResponse>> createUser(
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        description = "사용자 생성 요청",
        required = true,
        content = @Content(schema = @Schema(implementation = UserCreateRequest.class))
    )
    @RequestBody @Valid UserCreateRequest request
) {
    // 구현
}
```

---

## 🏷️ 태그 관리

### 1. 표준 태그 목록

```java
// 사용자 관리
@Tag(name = "사용자 관리", description = "사용자 CRUD API")

// 공통코드 관리
@Tag(name = "공통코드 관리", description = "공통코드 CRUD API")

// 상담 관리
@Tag(name = "상담 관리", description = "상담 생성, 수정, 조회 API")

// 스케줄 관리
@Tag(name = "스케줄 관리", description = "스케줄 생성, 수정, 조회 API")

// 권한 관리
@Tag(name = "권한 관리", description = "권한 조회, 부여, 회수 API")

// 파일 관리
@Tag(name = "파일 관리", description = "파일 업로드, 다운로드 API")

// 알림 관리
@Tag(name = "알림 관리", description = "알림 조회, 발송 API")
```

### 2. 태그 사용 규칙

```java
// ✅ 권장: 명확한 태그 사용
@Tag(name = "사용자 관리", description = "사용자 CRUD API")
public class UserController { }

// ❌ 금지: 불명확한 태그
@Tag(name = "User")
public class UserController { }
```

---

## 📋 요청/응답 문서화

### 1. DTO 문서화

#### Schema 어노테이션
```java
@Schema(description = "사용자 생성 요청")
public class UserCreateRequest {
    
    @Schema(description = "이메일 주소", example = "user@example.com", required = true)
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
    
    @Schema(description = "비밀번호 (8자 이상, 대소문자/숫자/특수문자 포함)", 
            example = "Password123!@#", required = true, minLength = 8)
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String password;
    
    @Schema(description = "이름", example = "홍길동", required = true)
    @NotBlank(message = "이름은 필수입니다.")
    private String name;
    
    @Schema(description = "역할", example = "ADMIN", 
            allowableValues = {"ADMIN", "CONSULTANT", "CLIENT", "STAFF"})
    private String role;
}
```

### 2. 응답 문서화

#### Response Schema
```java
@Schema(description = "사용자 응답")
public class UserResponse {
    
    @Schema(description = "사용자 ID", example = "1")
    private Long id;
    
    @Schema(description = "이메일 주소", example = "user@example.com")
    private String email;
    
    @Schema(description = "이름", example = "홍길동")
    private String name;
    
    @Schema(description = "역할", example = "ADMIN")
    private String role;
    
    @Schema(description = "생성일시", example = "2025-12-03T10:00:00")
    private LocalDateTime createdAt;
}
```

---

## 🔧 OpenAPI 설정

### 1. 기본 설정

```java
@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI coreSolutionOpenAPI() {
        Server devServer = new Server();
        devServer.setUrl("http://localhost:8080");
        devServer.setDescription("개발 서버");
        
        Server prodServer = new Server();
        prodServer.setUrl("https://core-solution.co.kr");
        prodServer.setDescription("운영 서버");
        
        Contact contact = new Contact();
        contact.setEmail("support@core-solution.co.kr");
        contact.setName("CoreSolution Support");
        
        Info info = new Info()
            .title("CoreSolution API")
            .version("1.0.0")
            .contact(contact)
            .description("CoreSolution 플랫폼 API 문서");
        
        return new OpenAPI()
            .info(info)
            .servers(List.of(devServer, prodServer));
    }
}
```

### 2. API 그룹 설정

```java
@Bean
public GroupedOpenApi publicApi() {
    return GroupedOpenApi.builder()
        .group("public-api")
        .pathsToMatch("/api/**")
        .pathsToExclude("/api/test/**")
        .build();
}

@Bean
public GroupedOpenApi testApi() {
    return GroupedOpenApi.builder()
        .group("test-api")
        .pathsToMatch("/api/test/**")
        .build();
}
```

---

## 📖 문서 작성 가이드

### 1. Controller 작성 템플릿

```java
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "사용자 관리", description = "사용자 CRUD API")
@RequiredArgsConstructor
public class UserController extends BaseApiController {
    
    private final UserService userService;
    
    /**
     * 사용자 목록 조회
     * 
     * 테넌트별 사용자 목록을 페이징하여 조회합니다.
     * 역할, 상태로 필터링할 수 있습니다.
     */
    @GetMapping
    @Operation(
        summary = "사용자 목록 조회",
        description = "테넌트별 사용자 목록을 페이징하여 조회합니다. 역할, 상태로 필터링 가능합니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "조회 성공",
            content = @Content(schema = @Schema(implementation = UserListResponse.class))
        ),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
        @Parameter(description = "페이지 번호 (0부터 시작)", example = "0") 
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "페이지 크기 (기본 20, 최대 100)", example = "20") 
        @RequestParam(defaultValue = "20") int size,
        
        @Parameter(description = "역할 필터", example = "ADMIN") 
        @RequestParam(required = false) String role,
        
        Pageable pageable
    ) {
        // 구현
    }
}
```

### 2. DTO 작성 템플릿

```java
@Schema(description = "사용자 생성 요청")
public class UserCreateRequest {
    
    @Schema(description = "이메일 주소", example = "user@example.com", required = true)
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
    
    @Schema(description = "비밀번호", example = "Password123!@#", required = true)
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String password;
}
```

---

## 🚫 금지 사항

### 1. 어노테이션 누락 금지
```java
// ❌ 금지: 어노테이션 없음
@GetMapping("/api/v1/users")
public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers() {
    // ...
}

// ✅ 권장: 어노테이션 포함
@GetMapping("/api/v1/users")
@Operation(summary = "사용자 목록 조회", description = "사용자 목록을 조회합니다.")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "조회 성공")
})
public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers() {
    // ...
}
```

### 2. 불명확한 설명 금지
```java
// ❌ 금지: 불명확한 설명
@Operation(summary = "사용자 조회")

// ✅ 권장: 명확한 설명
@Operation(
    summary = "사용자 목록 조회",
    description = "테넌트별 사용자 목록을 페이징하여 조회합니다. 역할, 상태로 필터링 가능합니다."
)
```

### 3. 예시 값 누락 금지
```java
// ❌ 금지: 예시 없음
@Schema(description = "이메일 주소")
private String email;

// ✅ 권장: 예시 포함
@Schema(description = "이메일 주소", example = "user@example.com")
private String email;
```

---

## ✅ 체크리스트

### API 문서화 시
- [ ] @Tag 어노테이션 추가 (Controller 레벨)
- [ ] @Operation 어노테이션 추가 (메서드 레벨)
- [ ] @ApiResponses 어노테이션 추가 (에러 케이스)
- [ ] @Parameter 어노테이션 추가 (파라미터 설명)
- [ ] @Schema 어노테이션 추가 (DTO 필드 설명)
- [ ] 예시 값 제공 (example 속성)
- [ ] Swagger UI에서 확인

### DTO 문서화 시
- [ ] @Schema 어노테이션 추가 (클래스 레벨)
- [ ] 각 필드에 @Schema 어노테이션 추가
- [ ] description 작성
- [ ] example 값 제공
- [ ] required 속성 명시

---

## 💡 베스트 프랙티스

### 1. 일관된 설명 형식
```java
// ✅ 권장: 일관된 형식
@Operation(
    summary = "사용자 목록 조회",
    description = "테넌트별 사용자 목록을 페이징하여 조회합니다. 역할, 상태로 필터링 가능합니다."
)
```

### 2. 에러 케이스 문서화
```java
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "조회 성공"),
    @ApiResponse(responseCode = "400", description = "잘못된 요청"),
    @ApiResponse(responseCode = "403", description = "권한 없음"),
    @ApiResponse(responseCode = "404", description = "리소스를 찾을 수 없음"),
    @ApiResponse(responseCode = "500", description = "서버 오류")
})
```

### 3. 예시 값 제공
```java
@Schema(
    description = "사용자 ID",
    example = "1",
    type = "integer",
    format = "int64"
)
private Long id;
```

---

## 📞 문의

API 문서화 표준 관련 문의:
- 백엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03

