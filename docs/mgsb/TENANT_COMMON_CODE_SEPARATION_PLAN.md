# 테넌트별 공통 코드 분리 방안

## 📋 개요

**CoreSolution 플랫폼**의 공통 코드(`CommonCode`)는 현재 모든 테넌트가 공유하는 구조입니다. 멀티테넌트 환경에서 테넌트별로 커스터마이징이 필요한 공통 코드와 CoreSolution 플랫폼에서 관리하는 시스템 공통 코드를 분리하여 관리하는 방안을 제시합니다.

### CoreSolution과 MindGarden의 관계
- **CoreSolution**: 멀티테넌트 SaaS 플랫폼 (코어 시스템)
- **MindGarden**: CoreSolution 플랫폼을 사용하는 하나의 프로젝트/테넌트
- **하드코딩 금지 원칙**: CoreSolution 플랫폼 전체에 적용되는 원칙

## 🎯 목표

1. **테넌트별 공통 코드**: 각 테넌트가 자체적으로 관리하는 공통 코드
   - 예: 테넌트별 상담 패키지 타입, 결제 방법, 업종별 특화 코드
   
2. **코어솔루션 공통 코드**: 시스템 전역에서 사용하는 공통 코드
   - 예: 사용자 상태, 시스템 설정, 공통 열거형 값

3. **하위 호환성 유지**: 기존 코드의 동작을 유지하면서 점진적으로 마이그레이션

## 🔑 핵심 원칙

### CoreSolution 백엔드 원칙 (플랫폼 전체 적용)
- ❌ **하드코딩 절대 금지**: 모든 코드 그룹명, 코드값, 코드 타입은 공통코드에서 조회
- ✅ **공통코드 기반**: 모든 분류, 타입, 설정은 공통코드 테이블에서 동적으로 조회
- ✅ **동적 조회**: 코드 그룹 타입, 코드값 등 모든 것은 데이터베이스에서 조회
- ✅ **플랫폼 원칙**: 이 원칙은 CoreSolution 플랫폼의 모든 프로젝트(MindGarden 포함)에 적용

### 프론트엔드 원칙
- ✅ **상수 사용 가능**: 프론트엔드에서는 성능 및 타입 안정성을 위해 상수 사용 허용
- ✅ **API 응답 기반**: 백엔드에서 공통코드로 조회한 결과를 API로 받아서 사용

### 예시
```java
// ❌ 백엔드 - 하드코딩 금지
if (codeGroup.equals("USER_STATUS")) { ... }  // 금지!

// ✅ 백엔드 - 공통코드에서 조회
CommonCode codeType = commonCodeService.getCodeByGroupAndValue("CODE_GROUP_TYPE", codeGroup);
if ("CORE".equals(codeType.getCodeValue())) { ... }

// ✅ 프론트엔드 - 상수 사용 가능
const CODE_GROUP = {
  USER_STATUS: 'USER_STATUS',
  PAYMENT_METHOD: 'PAYMENT_METHOD'
};
if (codeGroup === CODE_GROUP.USER_STATUS) { ... }
```

## 📊 현재 구조 분석

### 현재 CommonCode 엔티티
```java
@Entity
@Table(name = "common_codes")
public class CommonCode extends BaseEntity {
    private String codeGroup;      // 코드 그룹
    private String codeValue;      // 코드 값
    private String codeLabel;      // 코드 라벨
    // ... tenant_id 없음
}
```

### 문제점
- 모든 테넌트가 동일한 공통 코드를 공유
- 테넌트별 커스터마이징 불가능
- 코어솔루션 코드와 테넌트 코드 구분 불가

## 🏗️ 설계 방안

### 방안 1: 단일 테이블 + tenant_id 구분 (권장)

**장점:**
- 기존 구조 최소 변경
- 마이그레이션 용이
- 쿼리 단순화

**단점:**
- tenant_id가 null인 경우와 값이 있는 경우 구분 필요

#### 구조
```sql
CREATE TABLE common_codes (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),  -- NULL: 코어솔루션, 값 있음: 테넌트별
    code_group VARCHAR(50) NOT NULL,
    code_value VARCHAR(50) NOT NULL,
    code_label VARCHAR(100) NOT NULL,
    -- ... 기타 필드
    UNIQUE KEY uk_tenant_code (tenant_id, code_group, code_value)
);
```

#### 코드 그룹 분류 (공통코드로 관리)

**중요: 모든 코드 그룹의 타입(코어/테넌트)은 공통코드에서 관리**

- 코드 그룹 메타데이터에 `code_type` 필드 추가
- `CODE_GROUP_TYPE` 공통코드 그룹 생성
  - `CORE`: 코어솔루션 코드 그룹
  - `TENANT`: 테넌트별 코드 그룹

**하드코딩 금지**: 모든 코드 그룹 분류는 공통코드에서 동적으로 조회

### 방안 2: 별도 테이블 분리

**장점:**
- 명확한 분리
- 성능 최적화 가능 (인덱스 분리)

**단점:**
- 마이그레이션 복잡
- 쿼리 복잡도 증가

#### 구조
```sql
-- 코어솔루션 공통 코드
CREATE TABLE core_common_codes (
    id BIGINT PRIMARY KEY,
    code_group VARCHAR(50) NOT NULL,
    code_value VARCHAR(50) NOT NULL,
    -- ...
    UNIQUE KEY uk_core_code (code_group, code_value)
);

-- 테넌트별 공통 코드
CREATE TABLE tenant_common_codes (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    code_group VARCHAR(50) NOT NULL,
    code_value VARCHAR(50) NOT NULL,
    -- ...
    UNIQUE KEY uk_tenant_code (tenant_id, code_group, code_value),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);
```

## 🔧 구현 방안 (방안 1 기준)

### Phase 1: 데이터베이스 스키마 변경

#### 1.1 마이그레이션 스크립트
```sql
-- V34__add_tenant_id_to_common_codes.sql

-- 1. tenant_id 컬럼 추가 (NULL 허용)
ALTER TABLE common_codes 
ADD COLUMN tenant_id VARCHAR(36) NULL 
AFTER id;

-- 2. 인덱스 추가
CREATE INDEX idx_common_code_tenant ON common_codes(tenant_id);
CREATE UNIQUE INDEX uk_tenant_code_group_value 
ON common_codes(tenant_id, code_group, code_value);

-- 3. 코드 그룹 메타데이터에서 타입 조회하여 분류
-- 하드코딩 금지: 공통코드에서 동적으로 조회
-- 코드 그룹 메타데이터에 code_type 필드가 있어야 함

-- 4. 코드 그룹 타입별로 tenant_id 설정
-- 코어 코드 그룹 (code_type = 'CORE'): tenant_id = NULL
UPDATE common_codes cc
INNER JOIN code_group_metadata cgm ON cc.code_group = cgm.group_name
SET cc.tenant_id = NULL
WHERE cgm.code_type = 'CORE';

-- 테넌트 코드 그룹 (code_type = 'TENANT'): 각 테넌트에 할당
-- 실제로는 각 테넌트별로 마이그레이션 필요
UPDATE common_codes cc
INNER JOIN code_group_metadata cgm ON cc.code_group = cgm.group_name
SET cc.tenant_id = (SELECT tenant_id FROM tenants WHERE is_deleted = false LIMIT 1)
WHERE cgm.code_type = 'TENANT' AND cc.tenant_id IS NULL;
```

### Phase 2: 엔티티 수정

#### 2.1 CommonCode 엔티티 수정
```java
@Entity
@Table(name = "common_codes", indexes = {
    @Index(name = "idx_common_code_group", columnList = "codeGroup"),
    @Index(name = "idx_common_code_value", columnList = "codeValue"),
    @Index(name = "idx_common_code_active", columnList = "isActive"),
    @Index(name = "idx_common_code_tenant", columnList = "tenantId")
})
@UniqueConstraint(
    name = "uk_tenant_code_group_value",
    columnNames = {"tenantId", "codeGroup", "codeValue"}
)
public class CommonCode extends BaseEntity {
    
    @Column(name = "tenant_id", length = 36)
    private String tenantId; // NULL: 코어솔루션, 값 있음: 테넌트별
    
    @Column(name = "code_group", nullable = false, length = 50)
    private String codeGroup;
    
    // ... 기타 필드
    
    /**
     * 코어솔루션 코드인지 확인
     */
    public boolean isCoreCode() {
        return tenantId == null || tenantId.isEmpty();
    }
    
    /**
     * 테넌트별 코드인지 확인
     */
    public boolean isTenantCode() {
        return !isCoreCode();
    }
}
```

### Phase 3: Repository 수정

#### 3.1 CommonCodeRepository 수정
```java
@Repository
public interface CommonCodeRepository extends JpaRepository<CommonCode, Long> {
    
    // ==================== 코어솔루션 코드 조회 ====================
    
    /**
     * 코어솔루션 코드 그룹별 조회 (tenant_id = NULL)
     */
    @Query("SELECT c FROM CommonCode c WHERE c.tenantId IS NULL AND c.codeGroup = :codeGroup AND c.isActive = true ORDER BY c.sortOrder ASC")
    List<CommonCode> findCoreCodesByGroup(@Param("codeGroup") String codeGroup);
    
    /**
     * 코어솔루션 코드 그룹과 값으로 조회
     */
    @Query("SELECT c FROM CommonCode c WHERE c.tenantId IS NULL AND c.codeGroup = :codeGroup AND c.codeValue = :codeValue AND c.isActive = true")
    Optional<CommonCode> findCoreCodeByGroupAndValue(@Param("codeGroup") String codeGroup, @Param("codeValue") String codeValue);
    
    // ==================== 테넌트별 코드 조회 ====================
    
    /**
     * 테넌트별 코드 그룹별 조회
     */
    @Query("SELECT c FROM CommonCode c WHERE c.tenantId = :tenantId AND c.codeGroup = :codeGroup AND c.isActive = true ORDER BY c.sortOrder ASC")
    List<CommonCode> findTenantCodesByGroup(@Param("tenantId") String tenantId, @Param("codeGroup") String codeGroup);
    
    /**
     * 테넌트별 코드 그룹과 값으로 조회
     */
    @Query("SELECT c FROM CommonCode c WHERE c.tenantId = :tenantId AND c.codeGroup = :codeGroup AND c.codeValue = :codeValue AND c.isActive = true")
    Optional<CommonCode> findTenantCodeByGroupAndValue(@Param("tenantId") String tenantId, @Param("codeGroup") String codeGroup, @Param("codeValue") String codeValue);
    
    // ==================== 통합 조회 (하위 호환성) ====================
    
    /**
     * 현재 테넌트 컨텍스트 기반 코드 조회
     * 1. 테넌트별 코드 조회 시도
     * 2. 없으면 코어솔루션 코드 조회 (폴백)
     */
    @Query("SELECT c FROM CommonCode c WHERE " +
           "((c.tenantId = :tenantId AND c.codeGroup = :codeGroup) OR " +
           "(c.tenantId IS NULL AND c.codeGroup = :codeGroup)) " +
           "AND c.isActive = true " +
           "ORDER BY c.tenantId DESC NULLS LAST, c.sortOrder ASC")
    List<CommonCode> findCodesByGroupWithFallback(@Param("tenantId") String tenantId, @Param("codeGroup") String codeGroup);
    
    /**
     * 현재 테넌트 컨텍스트 기반 코드 조회 (값으로)
     */
    @Query("SELECT c FROM CommonCode c WHERE " +
           "((c.tenantId = :tenantId AND c.codeGroup = :codeGroup AND c.codeValue = :codeValue) OR " +
           "(c.tenantId IS NULL AND c.codeGroup = :codeGroup AND c.codeValue = :codeValue)) " +
           "AND c.isActive = true " +
           "ORDER BY c.tenantId DESC NULLS LAST")
    Optional<CommonCode> findCodeByGroupAndValueWithFallback(
        @Param("tenantId") String tenantId, 
        @Param("codeGroup") String codeGroup, 
        @Param("codeValue") String codeValue
    );
}
```

### Phase 4: Service 수정

#### 4.1 CommonCodeService 인터페이스 확장
```java
public interface CommonCodeService {
    
    // ==================== 기존 메서드 (하위 호환성 유지) ====================
    
    /**
     * 코드 그룹별 조회 (하위 호환성)
     * 현재 테넌트 컨텍스트 기반으로 조회
     */
    List<CommonCode> getCommonCodesByGroup(String codeGroup);
    
    // ==================== 코어솔루션 코드 조회 ====================
    
    /**
     * 코어솔루션 코드 그룹별 조회
     */
    List<CommonCode> getCoreCodesByGroup(String codeGroup);
    
    /**
     * 코어솔루션 코드 그룹과 값으로 조회
     */
    Optional<CommonCode> getCoreCodeByGroupAndValue(String codeGroup, String codeValue);
    
    // ==================== 테넌트별 코드 조회 ====================
    
    /**
     * 테넌트별 코드 그룹별 조회
     */
    List<CommonCode> getTenantCodesByGroup(String tenantId, String codeGroup);
    
    /**
     * 현재 테넌트의 코드 그룹별 조회
     */
    List<CommonCode> getCurrentTenantCodesByGroup(String codeGroup);
    
    /**
     * 테넌트별 코드 그룹과 값으로 조회
     */
    Optional<CommonCode> getTenantCodeByGroupAndValue(String tenantId, String codeGroup, String codeValue);
    
    // ==================== 통합 조회 (우선순위: 테넌트 > 코어) ====================
    
    /**
     * 코드 조회 (테넌트 코드 우선, 없으면 코어 코드)
     * 코드 그룹 타입은 공통코드에서 동적으로 조회
     */
    List<CommonCode> getCodesByGroupWithFallback(String tenantId, String codeGroup);
    
    /**
     * 현재 테넌트 컨텍스트 기반 코드 조회
     * 코드 그룹 타입은 공통코드에서 동적으로 조회
     */
    List<CommonCode> getCodesByGroupWithCurrentTenant(String codeGroup);
    
    /**
     * 코드 그룹이 코어솔루션 코드인지 확인 (공통코드에서 조회)
     * 하드코딩 금지
     */
    boolean isCoreCodeGroup(String codeGroup);
}
```

#### 4.2 CommonCodeServiceImpl 구현
```java
@Service
@RequiredArgsConstructor
@Transactional
public class CommonCodeServiceImpl implements CommonCodeService {
    
    private final CommonCodeRepository commonCodeRepository;
    private final TenantContextHolder tenantContextHolder;
    
    // ==================== 하위 호환성 메서드 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCommonCodesByGroup(String codeGroup) {
        // 현재 테넌트 컨텍스트 기반으로 조회 (하위 호환성)
        String tenantId = tenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return getCodesByGroupWithFallback(tenantId, codeGroup);
        }
        // 테넌트 컨텍스트가 없으면 코어 코드만 조회
        return getCoreCodesByGroup(codeGroup);
    }
    
    // ==================== 코어솔루션 코드 조회 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCoreCodesByGroup(String codeGroup) {
        log.info("🔍 코어솔루션 코드 그룹별 조회: {}", codeGroup);
        return commonCodeRepository.findCoreCodesByGroup(codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<CommonCode> getCoreCodeByGroupAndValue(String codeGroup, String codeValue) {
        log.info("🔍 코어솔루션 코드 조회: 그룹={}, 값={}", codeGroup, codeValue);
        return commonCodeRepository.findCoreCodeByGroupAndValue(codeGroup, codeValue);
    }
    
    // ==================== 테넌트별 코드 조회 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getTenantCodesByGroup(String tenantId, String codeGroup) {
        log.info("🔍 테넌트별 코드 그룹별 조회: 테넌트={}, 그룹={}", tenantId, codeGroup);
        return commonCodeRepository.findTenantCodesByGroup(tenantId, codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCurrentTenantCodesByGroup(String codeGroup) {
        String tenantId = tenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("⚠️ 테넌트 컨텍스트가 없어 코어 코드를 조회합니다: {}", codeGroup);
            return getCoreCodesByGroup(codeGroup);
        }
        return getTenantCodesByGroup(tenantId, codeGroup);
    }
    
    // ==================== 통합 조회 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCodesByGroupWithFallback(String tenantId, String codeGroup) {
        log.info("🔍 코드 조회 (테넌트 우선, 폴백): 테넌트={}, 그룹={}", tenantId, codeGroup);
        return commonCodeRepository.findCodesByGroupWithFallback(tenantId, codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCodesByGroupWithCurrentTenant(String codeGroup) {
        String tenantId = tenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return getCodesByGroupWithFallback(tenantId, codeGroup);
        }
        // 테넌트 컨텍스트가 없으면 코어 코드만
        return getCoreCodesByGroup(codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isCoreCodeGroup(String codeGroup) {
        // 공통코드에서 CODE_GROUP_TYPE 조회
        // CodeGroupMetadata에서 code_type 조회 후 공통코드와 비교
        // 하드코딩 금지: 모든 것은 공통코드에서 동적으로 조회
        CodeGroupMetadata metadata = codeGroupMetadataRepository.findByGroupName(codeGroup)
            .orElse(null);
        
        if (metadata == null) {
            return false; // 기본값: 테넌트별로 간주
        }
        
        // CODE_GROUP_TYPE 공통코드에서 조회
        Optional<CommonCode> codeType = getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE",
            metadata.getCodeType()
        );
        
        return codeType.isPresent() && "CORE".equals(metadata.getCodeType());
    }
}
```

### Phase 5: 코드 그룹 메타데이터 확장 (공통코드 기반)

#### 5.1 CodeGroupMetadata 엔티티 수정
```java
@Entity
@Table(name = "code_group_metadata")
public class CodeGroupMetadata extends BaseEntity {
    
    @Column(name = "group_name", nullable = false, length = 50)
    private String groupName; // 코드 그룹명
    
    @Column(name = "code_type", nullable = false, length = 20)
    private String codeType; // 'CORE' 또는 'TENANT' (공통코드에서 관리)
    
    // ... 기타 필드
    
    /**
     * 코어솔루션 코드 그룹인지 확인
     * 공통코드에서 동적으로 조회
     */
    public boolean isCoreCodeGroup(CommonCodeService commonCodeService) {
        // CODE_GROUP_TYPE 공통코드에서 'CORE' 값 조회
        Optional<CommonCode> codeType = commonCodeService.getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE", 
            this.codeType
        );
        return codeType.isPresent() && "CORE".equals(this.codeType);
    }
}
```

#### 5.2 CODE_GROUP_TYPE 공통코드 생성
```sql
-- 코드 그룹 타입 공통코드 그룹 생성
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, tenant_id)
VALUES 
('CODE_GROUP_TYPE', 'CORE', '코어솔루션 코드', '시스템 전역에서 사용하는 코어솔루션 코드 그룹', 1, true, NULL),
('CODE_GROUP_TYPE', 'TENANT', '테넌트별 코드', '각 테넌트가 자체적으로 관리하는 코드 그룹', 2, true, NULL);
```

#### 5.3 코드 그룹 타입 조회 서비스
```java
@Service
@RequiredArgsConstructor
public class CodeGroupMetadataService {
    
    private final CommonCodeService commonCodeService;
    private final CodeGroupMetadataRepository codeGroupMetadataRepository;
    
    /**
     * 코드 그룹이 코어솔루션 코드인지 확인 (공통코드에서 조회)
     * 하드코딩 절대 금지 - 모든 것은 공통코드에서 조회
     */
    public boolean isCoreCodeGroup(String codeGroup) {
        CodeGroupMetadata metadata = codeGroupMetadataRepository.findByGroupName(codeGroup)
            .orElse(null);
        
        if (metadata == null) {
            // 메타데이터가 없으면 기본값: 테넌트별로 간주
            return false;
        }
        
        // 공통코드에서 CODE_GROUP_TYPE 조회 (하드코딩 금지)
        Optional<CommonCode> codeType = commonCodeService.getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE",  // 이것도 공통코드에서 조회해야 하지만, 최소한의 시스템 코드는 허용
            metadata.getCodeType()
        );
        
        // 공통코드에서 'CORE' 값 조회
        Optional<CommonCode> coreType = commonCodeService.getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE",
            "CORE"
        );
        
        return codeType.isPresent() && coreType.isPresent() 
            && codeType.get().getCodeValue().equals(coreType.get().getCodeValue());
    }
    
    /**
     * 코드 그룹 타입 조회 (공통코드에서)
     * 하드코딩 절대 금지
     */
    public String getCodeGroupType(String codeGroup) {
        CodeGroupMetadata metadata = codeGroupMetadataRepository.findByGroupName(codeGroup)
            .orElse(null);
        
        if (metadata == null) {
            // 기본값도 공통코드에서 조회
            Optional<CommonCode> defaultType = commonCodeService.getCoreCodeByGroupAndValue(
                "CODE_GROUP_TYPE",
                "TENANT"
            );
            return defaultType.map(CommonCode::getCodeValue).orElse("TENANT");
        }
        
        // 메타데이터의 code_type도 공통코드에서 검증
        Optional<CommonCode> codeType = commonCodeService.getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE",
            metadata.getCodeType()
        );
        
        return codeType.map(CommonCode::getCodeValue)
            .orElse(metadata.getCodeType());
    }
}
```

**중요 원칙:**
- ❌ 하드코딩된 열거형 사용 금지
- ❌ 코드 그룹명, 코드값을 상수로 정의하지 않음
- ✅ 모든 코드 그룹 타입은 공통코드에서 관리
- ✅ 동적으로 조회하여 처리
- ✅ 백엔드는 무조건 공통코드에서 조회

### Phase 6: 관리자 UI 수정

#### 6.1 공통 코드 관리 화면 수정
- 코어솔루션 코드와 테넌트별 코드 구분 표시
- 테넌트별 코드는 현재 테넌트 컨텍스트 기반으로 필터링
- 코어솔루션 코드는 HQ 관리자만 수정 가능

#### 6.2 API 엔드포인트 분리
```java
@RestController
@RequestMapping("/api/common-codes")
public class CommonCodeController {
    
    // ==================== 코어솔루션 코드 ====================
    
    @GetMapping("/core/groups/{codeGroup}")
    public ResponseEntity<List<CommonCode>> getCoreCodesByGroup(@PathVariable String codeGroup) {
        // HQ 관리자 권한 확인 필요
        return ResponseEntity.ok(commonCodeService.getCoreCodesByGroup(codeGroup));
    }
    
    // ==================== 테넌트별 코드 ====================
    
    @GetMapping("/tenant/groups/{codeGroup}")
    public ResponseEntity<List<CommonCode>> getTenantCodesByGroup(@PathVariable String codeGroup) {
        // 현재 테넌트 컨텍스트 기반
        return ResponseEntity.ok(commonCodeService.getCurrentTenantCodesByGroup(codeGroup));
    }
    
    // ==================== 통합 조회 (하위 호환성) ====================
    
    @GetMapping("/groups/{codeGroup}")
    public ResponseEntity<List<CommonCode>> getCodesByGroup(@PathVariable String codeGroup) {
        // 테넌트 코드 우선, 없으면 코어 코드
        return ResponseEntity.ok(commonCodeService.getCodesByGroupWithCurrentTenant(codeGroup));
    }
}
```

## 📝 마이그레이션 전략

### 단계별 마이그레이션

1. **Phase 1: 스키마 변경**
   - `tenant_id` 컬럼 추가
   - 기존 데이터 분류 (코어/테넌트)

2. **Phase 2: 코드 분류**
   - 코드 그룹별로 코어/테넌트 구분
   - 코어 코드는 `tenant_id = NULL`
   - 테넌트 코드는 각 테넌트에 할당

3. **Phase 3: Repository/Service 수정**
   - 새로운 메서드 추가
   - 기존 메서드는 하위 호환성 유지

4. **Phase 4: 점진적 마이그레이션**
   - 새로운 코드는 분리된 메서드 사용
   - 기존 코드는 점진적으로 마이그레이션

5. **Phase 5: 관리자 UI 업데이트**
   - 코어/테넌트 구분 표시
   - 권한별 접근 제어

## 🔒 권한 관리

### 코어솔루션 코드
- **조회**: 모든 사용자 가능
- **생성/수정/삭제**: HQ 관리자만 가능

### 테넌트별 코드
- **조회**: 해당 테넌트 사용자만 가능
- **생성/수정/삭제**: 해당 테넌트 관리자만 가능

## 📊 성능 고려사항

1. **인덱스 최적화**
   - `(tenant_id, code_group, code_value)` 복합 인덱스
   - `tenant_id` 단일 인덱스

2. **캐싱 전략**
   - 코어 코드: 전역 캐시 (모든 테넌트 공유)
   - 테넌트 코드: 테넌트별 캐시

3. **쿼리 최적화**
   - 테넌트 컨텍스트가 있을 때만 테넌트 코드 조회
   - 코어 코드는 별도 조회로 분리

## ✅ 체크리스트

### Phase 1: 데이터베이스 ✅ 완료
- [x] `tenant_id` 컬럼 추가
- [x] 인덱스 생성
- [x] `code_group_metadata`에 `code_type` 필드 추가
- [x] `CODE_GROUP_TYPE` 공통코드 그룹 생성
- [x] `korean_name` 컬럼을 필수로 변경 (한국 사용 필수)
- [x] 기존 데이터 분류 (마이그레이션 스크립트)
- [ ] 마이그레이션 스크립트 테스트 (실제 DB에서 테스트 필요)

### Phase 2: 백엔드 ✅ 완료
- [x] `CommonCode` 엔티티 수정 (tenantId 활용, 인덱스 추가)
- [x] `CodeGroupMetadata` 엔티티에 `code_type` 필드 추가
- [x] `CommonCodeRepository` 메서드 추가 (코어/테넌트 조회)
- [x] `CodeGroupMetadataRepository` 메서드 추가
- [x] `CommonCodeService` 인터페이스 확장
- [x] `CommonCodeServiceImpl` 구현
- [x] `CodeGroupMetadataService` 생성 (공통코드 기반 타입 조회)
- [x] `CodeGroupMetadataServiceImpl` 구현
- [ ] 하드코딩된 코드 그룹명 제거 (기존 코드 점진적 마이그레이션 필요)

### Phase 3: API ✅ 완료
- [x] 코어 코드 조회 API (`/api/common-codes/core/groups/{codeGroup}`)
- [x] 테넌트 코드 조회 API (`/api/common-codes/tenant/groups/{codeGroup}`)
- [x] 통합 조회 API (`/api/common-codes/groups/{codeGroup}`)
- [x] 기존 API 하위 호환성 유지
- [ ] 권한 검증 로직 (HQ 관리자 권한 확인 추가 필요)

### Phase 4: 프론트엔드
- [ ] 공통 코드 관리 UI 수정
- [ ] 코어/테넌트 구분 표시
- [ ] 권한별 UI 제어

### Phase 5: 테스트
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] 마이그레이션 테스트
- [ ] 성능 테스트

## 🚨 주의사항

### CoreSolution 백엔드 규칙 (플랫폼 전체 적용)

**이 규칙은 CoreSolution 플랫폼의 모든 백엔드 코드에 적용됩니다.**

1. **하드코딩 절대 금지**
   - ❌ 코드 그룹명을 하드코딩하지 않음
   - ❌ 코드 그룹 타입을 열거형으로 정의하지 않음
   - ❌ 코드값을 상수 클래스에 정의하지 않음
   - ✅ 모든 것은 공통코드에서 동적으로 조회
   - ✅ 코드 그룹 메타데이터도 공통코드 기반으로 관리
   - ✅ **CoreSolution 플랫폼의 모든 프로젝트에 적용**

2. **공통코드 조회 원칙**
   - 모든 코드 그룹명, 코드값은 `CommonCodeService`를 통해 조회
   - 코드 그룹 타입은 `CODE_GROUP_TYPE` 공통코드에서 조회
   - 코드 그룹 메타데이터는 `CodeGroupMetadata`에서 조회
   - **플랫폼 레벨에서 일관되게 적용**

3. **기존 상수 클래스 제거**
   - `CommonCodeConstants.java` 같은 상수 클래스는 프론트엔드용으로만 사용
   - 백엔드에서는 완전히 제거하거나 deprecated 처리
   - **CoreSolution 플랫폼 전체에서 제거**

### 프론트엔드 규칙

1. **상수 사용 허용**
   - ✅ 성능 및 타입 안정성을 위해 상수 사용 가능
   - ✅ API 응답을 받아서 상수로 매핑하여 사용 가능
   - ✅ 코드 그룹명, 코드값을 상수로 정의 가능

2. **API 기반 동작**
   - 백엔드에서 공통코드로 조회한 결과를 API로 받아서 사용
   - 프론트엔드에서 직접 공통코드 조회 API 호출 가능

### 공통 규칙

1. **하위 호환성 유지**
   - 기존 API는 계속 동작해야 함
   - 기존 코드는 점진적으로 마이그레이션

2. **데이터 무결성**
   - 코어 코드는 `tenant_id = NULL`로 고정
   - 테넌트 코드는 유효한 `tenant_id` 필수
   - 코드 그룹 타입은 공통코드에서 관리

3. **권한 관리**
   - 코어 코드 수정은 HQ 관리자만 가능
   - 테넌트 코드는 해당 테넌트 관리자만 가능
   - 코드 그룹 타입 변경은 HQ 관리자만 가능

4. **성능**
   - 인덱스 최적화 필수
   - 캐싱 전략 수립
   - 공통코드 조회 최적화

## 📚 관련 문서

- [멀티테넌트 시스템 설계](./MULTI_TENANT_SYSTEM_DESIGN.md)
- [공통 코드 시스템](./DYNAMIC_CODE_SYSTEM_IMPLEMENTATION.md)
- [테넌트 관리 시스템](./TENANT_MANAGEMENT_SYSTEM.md)

