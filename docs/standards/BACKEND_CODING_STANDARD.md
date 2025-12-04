# 백엔드 코딩 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 백엔드(Java/Spring Boot) 코딩 표준입니다.  
일관된 코드 품질과 유지보수성을 보장하기 위한 원칙과 규칙을 정의합니다.

### 참조 문서
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [로깅 표준](./LOGGING_STANDARD.md)
- [DTO 네이밍 표준](./DTO_NAMING_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)

### 구현 위치
- **기본 컨트롤러**: `src/main/java/com/coresolution/core/controller/BaseApiController.java`
- **기본 서비스**: `src/main/java/com/coresolution/core/service/BaseService.java`
- **예외 처리**: `src/main/java/com/coresolution/consultation/exception/GlobalExceptionHandler.java`

---

## 🎯 핵심 원칙

### 1. 테넌트 기반 아키텍처
```
모든 데이터는 테넌트별로 격리되어야 함
```

**원칙**:
- ✅ 모든 엔티티는 `tenantId` 필드 보유
- ✅ 모든 조회는 테넌트 컨텍스트 기반
- ❌ 브랜치(branch) 개념 사용 금지
- ❌ 전역 데이터 접근 금지

### 2. 하드코딩 금지
```
모든 설정값은 데이터베이스 또는 환경변수에서 조회
```

**원칙**:
- ✅ 공통코드 테이블에서 동적 조회
- ✅ 환경변수 또는 설정 파일 사용
- ❌ 코드 내 하드코딩된 값 금지
- ❌ 상수 클래스 사용 금지 (백엔드)

### 3. 계층 분리
```
Controller → Service → Repository 계층 명확히 분리
```

**원칙**:
- ✅ Controller: HTTP 요청/응답 처리만
- ✅ Service: 비즈니스 로직 처리
- ✅ Repository: 데이터 접근만
- ❌ Controller에서 직접 DB 접근 금지
- ❌ Service에서 HTTP 응답 생성 금지

---

## 📋 패키지 구조

### 표준 패키지 구조
```
com.coresolution.{module}
├── controller          # REST API 컨트롤러
│   ├── {Resource}Controller.java
│   └── BaseApiController.java (상속)
├── service            # 비즈니스 로직 서비스
│   ├── {Resource}Service.java (인터페이스)
│   └── impl
│       └── {Resource}ServiceImpl.java
├── repository         # 데이터 접근 계층
│   └── {Resource}Repository.java
├── entity            # 엔티티 클래스
│   └── {Resource}.java
├── dto               # 데이터 전송 객체
│   ├── request
│   │   └── {Resource}Request.java
│   └── response
│       └── {Resource}Response.java
├── exception         # 커스텀 예외
│   └── {Resource}Exception.java
└── config            # 설정 클래스
    └── {Resource}Config.java
```

### 모듈별 패키지 구조
```
com.coresolution.core          # 코어 시스템
com.coresolution.consultation  # 상담 관리
com.coresolution.tenant        # 테넌트 관리
com.coresolution.billing       # 결제 관리
com.coresolution.erp           # ERP 시스템
```

---

## 💻 Controller 표준

### 1. 기본 구조

#### 표준 Controller 구조
```java
package com.coresolution.consultation.controller;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * {Resource} 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-03
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/{resource}")
@RequiredArgsConstructor
public class {Resource}Controller extends BaseApiController {
    
    private final {Resource}Service {resource}Service;
    
    // 컨트롤러 메서드들...
}
```

#### 어노테이션 규칙
```java
@Slf4j                          // ✅ 필수: 로깅
@RestController                  // ✅ 필수: REST 컨트롤러
@RequestMapping("/api/v1/...")  // ✅ 필수: API 버전 포함
@RequiredArgsConstructor        // ✅ 필수: 의존성 주입
@CrossOrigin(origins = "*")     // ⚠️ 선택: CORS 설정 (필요 시)
```

### 2. HTTP 메서드별 표준

#### GET - 조회
```java
/**
 * 목록 조회
 */
@GetMapping
public ResponseEntity<ApiResponse<List<{Resource}Response>>> findAll(
        @RequestParam(required = false) String codeGroup,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
    log.info("목록 조회 요청: codeGroup={}, page={}, size={}", codeGroup, page, size);
    
    List<{Resource}Response> list = {resource}Service.findAll(codeGroup, page, size);
    
    log.info("목록 조회 완료: count={}", list.size());
    return success(list);
}

/**
 * 단건 조회
 */
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<{Resource}Response>> findById(@PathVariable Long id) {
    log.info("단건 조회 요청: id={}", id);
    
    {Resource}Response response = {resource}Service.findById(id);
    
    log.info("단건 조회 완료: id={}", id);
    return success(response);
}
```

#### POST - 생성
```java
/**
 * 생성
 */
@PostMapping
public ResponseEntity<ApiResponse<{Resource}Response>> create(
        @RequestBody {Resource}CreateRequest request,
        HttpSession session) {
    log.info("생성 요청: {}", request);
    
    String createdBy = SessionUtils.getUserId(session);
    {Resource}Response response = {resource}Service.create(request, createdBy);
    
    log.info("생성 완료: id={}", response.getId());
    return created(response);
}
```

#### PUT/PATCH - 수정
```java
/**
 * 전체 수정
 */
@PutMapping("/{id}")
public ResponseEntity<ApiResponse<{Resource}Response>> update(
        @PathVariable Long id,
        @RequestBody {Resource}UpdateRequest request,
        HttpSession session) {
    log.info("전체 수정 요청: id={}, request={}", id, request);
    
    String updatedBy = SessionUtils.getUserId(session);
    {Resource}Response response = {resource}Service.update(id, request, updatedBy);
    
    log.info("전체 수정 완료: id={}", id);
    return success(response);
}

/**
 * 부분 수정
 */
@PatchMapping("/{id}")
public ResponseEntity<ApiResponse<{Resource}Response>> partialUpdate(
        @PathVariable Long id,
        @RequestBody Map<String, Object> updates,
        HttpSession session) {
    log.info("부분 수정 요청: id={}, updates={}", id, updates);
    
    String updatedBy = SessionUtils.getUserId(session);
    {Resource}Response response = {resource}Service.partialUpdate(id, updates, updatedBy);
    
    log.info("부분 수정 완료: id={}", id);
    return success(response);
}
```

#### DELETE - 삭제
```java
/**
 * 삭제 (소프트 삭제)
 */
@DeleteMapping("/{id}")
public ResponseEntity<ApiResponse<Void>> delete(
        @PathVariable Long id,
        HttpSession session) {
    log.info("삭제 요청: id={}", id);
    
    String deletedBy = SessionUtils.getUserId(session);
    {resource}Service.delete(id, deletedBy);
    
    log.info("삭제 완료: id={}", id);
    return noContent();
}
```

### 3. 파라미터 처리 표준

#### 경로 변수 (Path Variable)
```java
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<{Resource}Response>> findById(
        @PathVariable Long id) {
    // id 검증은 Service 레이어에서 수행
    return success(service.findById(id));
}
```

#### 쿼리 파라미터 (Query Parameter)
```java
@GetMapping
public ResponseEntity<ApiResponse<List<{Resource}Response>>> findAll(
        @RequestParam(required = false) String codeGroup,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
    // 파라미터 정제 및 검증
    if (codeGroup != null) {
        codeGroup = codeGroup.trim().toUpperCase();
    }
    
    return success(service.findAll(codeGroup, status, page, size));
}
```

#### 요청 본문 (Request Body)
```java
@PostMapping
public ResponseEntity<ApiResponse<{Resource}Response>> create(
        @RequestBody @Valid {Resource}CreateRequest request) {
    // @Valid로 자동 검증 (Bean Validation)
    return created(service.create(request));
}
```

### 4. 응답 형식 표준

#### 성공 응답
```java
// 200 OK - 조회/수정 성공
return success(data);

// 201 Created - 생성 성공
return created(data);

// 204 No Content - 삭제 성공
return noContent();
```

#### 에러 응답
```java
// Controller에서는 예외를 throw만 하고
// GlobalExceptionHandler에서 처리
throw new EntityNotFoundException("Resource", id);
```

---

## 🏗️ Service 표준

### 1. 기본 구조

#### 인터페이스
```java
package com.coresolution.consultation.service;

/**
 * {Resource} 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-03
 */
public interface {Resource}Service {
    
    // ==================== 기본 조회 메서드 ====================
    
    /**
     * 목록 조회
     * 
     * @param codeGroup 코드 그룹 (선택)
     * @return 리소스 목록
     */
    List<{Resource}Response> findAll(String codeGroup);
    
    /**
     * 단건 조회
     * 
     * @param id 리소스 ID
     * @return 리소스 응답
     * @throws EntityNotFoundException 리소스를 찾을 수 없을 때
     */
    {Resource}Response findById(Long id);
    
    // ==================== CRUD 메서드 ====================
    
    /**
     * 생성
     * 
     * @param request 생성 요청
     * @param createdBy 생성자 ID
     * @return 생성된 리소스
     */
    {Resource}Response create({Resource}CreateRequest request, String createdBy);
    
    /**
     * 수정
     * 
     * @param id 리소스 ID
     * @param request 수정 요청
     * @param updatedBy 수정자 ID
     * @return 수정된 리소스
     */
    {Resource}Response update(Long id, {Resource}UpdateRequest request, String updatedBy);
    
    /**
     * 삭제 (소프트 삭제)
     * 
     * @param id 리소스 ID
     * @param deletedBy 삭제자 ID
     */
    void delete(Long id, String deletedBy);
}
```

#### 구현체
```java
package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.service.{Resource}Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {Resource} 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class {Resource}ServiceImpl implements {Resource}Service {
    
    private final {Resource}Repository {resource}Repository;
    
    @Override
    @Transactional(readOnly = true)
    public List<{Resource}Response> findAll(String codeGroup) {
        log.info("목록 조회: codeGroup={}", codeGroup);
        
        List<{Resource}> entities = {resource}Repository.findAll(codeGroup);
        return entities.stream()
            .map({Resource}Response::fromEntity)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public {Resource}Response findById(Long id) {
        log.info("단건 조회: id={}", id);
        
        {Resource} entity = {resource}Repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("{Resource}", id));
        
        return {Resource}Response.fromEntity(entity);
    }
    
    @Override
    public {Resource}Response create({Resource}CreateRequest request, String createdBy) {
        log.info("생성: request={}", request);
        
        // 비즈니스 로직
        {Resource} entity = {Resource}.builder()
            .field1(request.getField1())
            .field2(request.getField2())
            .build();
        
        {Resource} saved = {resource}Repository.save(entity);
        log.info("생성 완료: id={}", saved.getId());
        
        return {Resource}Response.fromEntity(saved);
    }
    
    @Override
    public {Resource}Response update(Long id, {Resource}UpdateRequest request, String updatedBy) {
        log.info("수정: id={}, request={}", id, request);
        
        {Resource} entity = {resource}Repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("{Resource}", id));
        
        // 비즈니스 로직
        entity.update(request);
        
        {Resource} updated = {resource}Repository.save(entity);
        log.info("수정 완료: id={}", id);
        
        return {Resource}Response.fromEntity(updated);
    }
    
    @Override
    public void delete(Long id, String deletedBy) {
        log.info("삭제: id={}, deletedBy={}", id, deletedBy);
        
        {Resource} entity = {resource}Repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("{Resource}", id));
        
        // 소프트 삭제
        entity.softDelete();
        {resource}Repository.save(entity);
        
        log.info("삭제 완료: id={}", id);
    }
}
```

### 2. 트랜잭션 관리

#### 트랜잭션 어노테이션 규칙
```java
@Service
@Transactional  // 클래스 레벨: 기본 트랜잭션 설정
public class {Resource}ServiceImpl implements {Resource}Service {
    
    @Transactional(readOnly = true)  // 읽기 전용 메서드
    public List<{Resource}Response> findAll() {
        // 조회 메서드는 readOnly = true
    }
    
    public {Resource}Response create(...) {
        // 생성/수정/삭제는 기본 트랜잭션 (자동 커밋)
    }
    
    @Transactional(rollbackFor = Exception.class)  // 예외 시 롤백
    public void criticalOperation(...) {
        // 중요한 작업은 명시적 롤백 설정
    }
}
```

### 3. 의존성 주입

#### 생성자 주입 (권장)
```java
@RequiredArgsConstructor  // Lombok 사용
public class {Resource}ServiceImpl {
    
    private final {Resource}Repository {resource}Repository;
    private final CommonCodeService commonCodeService;
}
```

#### 필드 주입 (금지)
```java
// ❌ 금지
@Autowired
private {Resource}Repository {resource}Repository;
```

---

## 🗄️ Repository 표준

### 1. 기본 구조

```java
package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.{Resource};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * {Resource} Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-03
 */
@Repository
public interface {Resource}Repository extends JpaRepository<{Resource}, Long> {
    
    // ==================== 기본 쿼리 메서드 ====================
    
    /**
     * 코드 그룹별 조회
     */
    List<{Resource}> findByCodeGroupOrderBySortOrderAsc(String codeGroup);
    
    /**
     * 활성 리소스만 조회
     */
    List<{Resource}> findByIsActiveTrueOrderByCreatedAtDesc();
    
    // ==================== 커스텀 쿼리 ====================
    
    /**
     * 커스텀 쿼리 (JPQL)
     */
    @Query("SELECT r FROM {Resource} r WHERE r.codeGroup = :codeGroup AND r.isActive = true")
    List<{Resource}> findActiveByCodeGroup(@Param("codeGroup") String codeGroup);
    
    /**
     * 네이티브 쿼리 (필요 시)
     */
    @Query(value = "SELECT * FROM {resource}s WHERE code_group = :codeGroup", nativeQuery = true)
    List<{Resource}> findNativeByCodeGroup(@Param("codeGroup") String codeGroup);
}
```

### 2. 네이밍 규칙

#### 메서드 네이밍
```
findBy{Field}                     // 단일 필드로 조회
findBy{Field1}And{Field2}         // 여러 필드로 조회
findBy{Field}OrderBy{Field}Desc   // 정렬 포함
countBy{Field}                    // 개수 조회
existsBy{Field}                   // 존재 여부 확인
deleteBy{Field}                   // 삭제
```

#### 예시
```java
// 단일 필드
findByCodeGroup(String codeGroup)
findByIsActiveTrue()

// 여러 필드
findByCodeGroupAndIsActiveTrue(String codeGroup)
findByTenantIdAndCodeGroup(String tenantId, String codeGroup)

// 정렬
findByCodeGroupOrderBySortOrderAsc(String codeGroup)
findAllOrderByCreatedAtDesc()

// 개수
countByCodeGroup(String codeGroup)
countByIsActiveTrue()
```

---

## 📦 Entity 표준

### 1. 기본 구조

```java
package com.coresolution.consultation.entity;

import com.coresolution.core.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * {Resource} 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-03
 */
@Entity
@Table(name = "{resources}",
    indexes = {
        @Index(name = "idx_{resource}_code_group", columnList = "codeGroup"),
        @Index(name = "idx_{resource}_active", columnList = "isActive")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class {Resource} extends BaseEntity {
    
    @Column(name = "code_group", nullable = false, length = 50)
    private String codeGroup;
    
    @Column(name = "code_value", nullable = false, length = 50)
    private String codeValue;
    
    @Column(name = "korean_name", nullable = false, length = 100)
    private String koreanName;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    /**
     * 소프트 삭제
     */
    public void softDelete() {
        this.isActive = false;
        super.delete();
    }
}
```

### 2. BaseEntity 상속

```java
// 모든 엔티티는 BaseEntity를 상속받아야 함
@MappedSuperclass
public abstract class BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", length = 36)
    private String tenantId;  // 테넌트 격리
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @Version
    private Long version;  // 낙관적 locking
}
```

---

## 📝 DTO 표준

### 1. Request DTO

```java
package com.coresolution.consultation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * {Resource} 생성 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-03
 */
@Data
public class {Resource}CreateRequest {
    
    @NotBlank(message = "코드 그룹은 필수입니다.")
    private String codeGroup;
    
    @NotBlank(message = "코드 값은 필수입니다.")
    private String codeValue;
    
    @NotBlank(message = "한글명은 필수입니다.")
    private String koreanName;
    
    private String codeDescription;
    
    @NotNull(message = "정렬 순서는 필수입니다.")
    private Integer sortOrder;
}
```

### 2. Response DTO

```java
package com.coresolution.consultation.dto.response;

import com.coresolution.consultation.entity.{Resource};
import lombok.Builder;
import lombok.Data;

/**
 * {Resource} 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-03
 */
@Data
@Builder
public class {Resource}Response {
    
    private Long id;
    private String codeGroup;
    private String codeValue;
    private String koreanName;
    private String codeDescription;
    private Integer sortOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    
    /**
     * Entity를 Response로 변환
     */
    public static {Resource}Response fromEntity({Resource} entity) {
        return {Resource}Response.builder()
            .id(entity.getId())
            .codeGroup(entity.getCodeGroup())
            .codeValue(entity.getCodeValue())
            .koreanName(entity.getKoreanName())
            .codeDescription(entity.getCodeDescription())
            .sortOrder(entity.getSortOrder())
            .isActive(entity.getIsActive())
            .createdAt(entity.getCreatedAt())
            .build();
    }
}
```

---

## 🚫 금지 사항

### 1. 하드코딩 금지
```java
// ❌ 금지
if (codeGroup.equals("USER_STATUS")) { ... }

// ✅ 권장
CommonCode codeType = commonCodeService.getCodeByGroupAndValue(
    "CODE_GROUP_TYPE", codeGroup
);
```

### 2. Controller에서 비즈니스 로직 금지
```java
// ❌ 금지
@GetMapping("/users/{id}")
public ResponseEntity<?> getUser(@PathVariable Long id) {
    User user = userRepository.findById(id).orElse(null);
    if (user == null) {
        return ResponseEntity.notFound().build();
    }
    // 비즈니스 로직...
    return ResponseEntity.ok(user);
}

// ✅ 권장
@GetMapping("/users/{id}")
public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
    UserResponse response = userService.findById(id);
    return success(response);
}
```

### 3. Service에서 HTTP 응답 생성 금지
```java
// ❌ 금지
public ResponseEntity<UserResponse> findById(Long id) {
    // ...
    return ResponseEntity.ok(response);
}

// ✅ 권장
public UserResponse findById(Long id) {
    // ...
    return response;
}
```

---

## ✅ 체크리스트

### 새 Controller 작성 시
- [ ] BaseApiController 상속
- [ ] @Slf4j, @RestController, @RequiredArgsConstructor 어노테이션
- [ ] API 버전 포함 (`/api/v1/...`)
- [ ] 표준 응답 형식 사용 (success, created, noContent)
- [ ] 예외는 throw만 하고 GlobalExceptionHandler에 위임
- [ ] 모든 메서드에 로깅 추가

### 새 Service 작성 시
- [ ] 인터페이스와 구현체 분리
- [ ] @Service, @Transactional 어노테이션
- [ ] 읽기 전용 메서드는 @Transactional(readOnly = true)
- [ ] 생성자 주입 사용 (@RequiredArgsConstructor)
- [ ] 모든 메서드에 로깅 추가
- [ ] 예외 메시지는 사용자 친화적으로

### 새 Entity 작성 시
- [ ] BaseEntity 상속
- [ ] @Entity, @Table 어노테이션
- [ ] 적절한 인덱스 정의
- [ ] 필수 필드에 @Column(nullable = false)
- [ ] 한글명 필드 포함 (koreanName)

---

## 📞 문의

백엔드 코딩 표준 관련 문의:
- 백엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03

