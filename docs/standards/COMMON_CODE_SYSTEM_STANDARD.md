# 공통코드 시스템 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 공통코드 시스템 표준입니다. 시스템 공통코드와 테넌트 공통코드를 명확히 구분하여 관리합니다.

### 참조 문서
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)

### 구현 위치
- **엔티티**: `src/main/java/com/coresolution/consultation/entity/CommonCode.java`
- **서비스**: `src/main/java/com/coresolution/consultation/service/CommonCodeService.java`
- **프론트엔드**: `frontend/src/utils/commonCodeApi.js`

---

## 🎯 공통코드 시스템 원칙

### 1. 단일 테이블 전략
```
common_codes 테이블 하나에 모든 코드 저장
tenant_id 컬럼으로 구분
```

**구분 기준**:
- `tenant_id = NULL`: 시스템 공통코드 (CoreSolution 전역)
- `tenant_id = UUID`: 테넌트 공통코드 (테넌트별 관리)

---

### 2. 코드 타입

#### CORE (시스템 공통코드)
- CoreSolution 플랫폼 전체에서 사용
- HQ Admin만 수정 가능
- 모든 테넌트가 공유
- `tenant_id = NULL`

**예시**:
- USER_STATUS (사용자 상태)
- USER_ROLE (사용자 역할)
- SYSTEM_STATUS (시스템 상태)
- NOTIFICATION_TYPE (알림 타입)
- GENDER (성별)
- BANK (은행)

#### TENANT (테넌트 공통코드)
- 각 테넌트가 자체적으로 관리
- Tenant Admin 수정 가능
- 테넌트별로 독립적
- `tenant_id = {테넌트 UUID}`

**예시**:
- CONSULTATION_PACKAGE (상담 패키지)
- PAYMENT_METHOD (결제 방법)
- SPECIALTY (전문 분야)
- CONSULTATION_TYPE (상담 유형)
- FINANCIAL_CATEGORY (재무 카테고리)

---

## 📊 데이터베이스 구조

### 1. CommonCode 엔티티

```java
@Entity
@Table(name = "common_codes", 
    indexes = {
        @Index(name = "idx_common_code_group", columnList = "codeGroup"),
        @Index(name = "idx_common_code_value", columnList = "codeValue"),
        @Index(name = "idx_common_code_active", columnList = "isActive"),
        @Index(name = "idx_common_code_tenant", columnList = "tenantId")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_tenant_code_group_value",
            columnNames = {"tenantId", "codeGroup", "codeValue"}
        )
    }
)
public class CommonCode extends BaseEntity {
    
    @Column(name = "tenant_id", length = 36)
    private String tenantId;  // NULL = 시스템 코드
    
    @Column(name = "code_group", nullable = false, length = 50)
    private String codeGroup;
    
    @Column(name = "code_value", nullable = false, length = 50)
    private String codeValue;
    
    @Column(name = "code_label", nullable = false, length = 100)
    private String codeLabel;
    
    @Column(name = "korean_name", nullable = false, length = 100)
    private String koreanName;  // 필수
    
    @Column(name = "code_description", columnDefinition = "TEXT")
    private String codeDescription;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @Column(name = "is_active")
    private Boolean isActive;
    
    @Column(name = "extra_data", columnDefinition = "JSON")
    private String extraData;  // 추가 데이터 (JSON)
}
```

---

### 2. CodeGroupMetadata 엔티티

```java
@Entity
@Table(name = "code_group_metadata")
public class CodeGroupMetadata extends BaseEntity {
    
    @Column(name = "code_group", nullable = false, unique = true, length = 50)
    private String codeGroup;
    
    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;
    
    @Column(name = "code_type", length = 20)
    private String codeType;  // CORE 또는 TENANT
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "is_active")
    private Boolean isActive;
}
```

---

## 💻 백엔드 구현

### 1. CommonCodeService 인터페이스

```java
public interface CommonCodeService {
    
    // ==================== 조회 메서드 ====================
    
    /**
     * 모든 공통코드 조회
     */
    List<CommonCode> getAllCommonCodes();
    
    /**
     * 코드 그룹별 조회
     * 
     * @param codeGroup 코드 그룹
     * @return 공통코드 목록
     */
    List<CommonCode> getCommonCodesByGroup(String codeGroup);
    
    /**
     * 활성 코드만 조회
     * 
     * @param codeGroup 코드 그룹
     * @return 활성 공통코드 목록
     */
    List<CommonCode> getActiveCommonCodesByGroup(String codeGroup);
    
    /**
     * 코드 그룹과 값으로 조회
     * 
     * @param codeGroup 코드 그룹
     * @param codeValue 코드 값
     * @return 공통코드
     */
    CommonCode getCommonCodeByGroupAndValue(String codeGroup, String codeValue);
    
    /**
     * 코드 값 조회 (한글명 반환)
     * 
     * @param codeGroup 코드 그룹
     * @param codeValue 코드 값
     * @return 한글명
     */
    String getCodeValue(String codeGroup, String codeValue);
    
    // ==================== CRUD 메서드 ====================
    
    /**
     * 공통코드 생성
     * 
     * @param request 생성 요청 DTO
     * @param createdBy 생성자
     * @return 생성된 공통코드 응답
     */
    CommonCodeResponse create(CommonCodeCreateRequest request, String createdBy);
    
    /**
     * 공통코드 수정
     * 
     * @param id 공통코드 ID
     * @param request 수정 요청 DTO
     * @param updatedBy 수정자
     * @return 수정된 공통코드 응답
     */
    CommonCodeResponse update(Long id, CommonCodeUpdateRequest request, String updatedBy);
    
    /**
     * 공통코드 삭제 (Soft Delete)
     * 
     * @param id 공통코드 ID
     * @param deletedBy 삭제자
     */
    void delete(Long id, String deletedBy);
    
    // ==================== 테넌트 관련 메서드 ====================
    
    /**
     * 테넌트별 공통코드 조회
     * 
     * @param tenantId 테넌트 ID
     * @param codeGroup 코드 그룹
     * @return 공통코드 목록
     */
    List<CommonCode> getTenantCommonCodes(String tenantId, String codeGroup);
    
    /**
     * 시스템 공통코드 조회 (tenant_id = NULL)
     * 
     * @param codeGroup 코드 그룹
     * @return 공통코드 목록
     */
    List<CommonCode> getSystemCommonCodes(String codeGroup);
    
    /**
     * 테넌트 생성 시 기본 공통코드 복사
     * 
     * @param tenantId 테넌트 ID
     */
    void copyDefaultCodesToTenant(String tenantId);
}
```

---

### 2. 공통코드 조회 로직

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CommonCodeServiceImpl implements CommonCodeService {
    
    private final CommonCodeRepository commonCodeRepository;
    
    @Override
    public List<CommonCode> getCommonCodesByGroup(String codeGroup) {
        String tenantId = TenantContextHolder.getTenantId();
        
        // 1. 테넌트 코드 조회
        List<CommonCode> tenantCodes = commonCodeRepository
            .findByTenantIdAndCodeGroupAndIsActiveOrderBySortOrder(
                tenantId, codeGroup, true
            );
        
        // 2. 테넌트 코드가 있으면 반환
        if (!tenantCodes.isEmpty()) {
            log.debug("테넌트 공통코드 조회: tenantId={}, codeGroup={}, count={}", 
                tenantId, codeGroup, tenantCodes.size());
            return tenantCodes;
        }
        
        // 3. 테넌트 코드가 없으면 시스템 코드 조회
        List<CommonCode> systemCodes = commonCodeRepository
            .findByTenantIdIsNullAndCodeGroupAndIsActiveOrderBySortOrder(
                codeGroup, true
            );
        
        log.debug("시스템 공통코드 조회: codeGroup={}, count={}", 
            codeGroup, systemCodes.size());
        
        return systemCodes;
    }
    
    @Override
    public String getCodeValue(String codeGroup, String codeValue) {
        String tenantId = TenantContextHolder.getTenantId();
        
        // 1. 테넌트 코드 조회
        CommonCode tenantCode = commonCodeRepository
            .findByTenantIdAndCodeGroupAndCodeValue(tenantId, codeGroup, codeValue)
            .orElse(null);
        
        if (tenantCode != null) {
            return tenantCode.getKoreanName();
        }
        
        // 2. 시스템 코드 조회
        CommonCode systemCode = commonCodeRepository
            .findByTenantIdIsNullAndCodeGroupAndCodeValue(codeGroup, codeValue)
            .orElse(null);
        
        return systemCode != null ? systemCode.getKoreanName() : codeValue;
    }
    
    @Override
    public void copyDefaultCodesToTenant(String tenantId) {
        log.info("테넌트 기본 공통코드 복사 시작: tenantId={}", tenantId);
        
        // 테넌트 타입 코드 그룹 목록
        List<String> tenantCodeGroups = Arrays.asList(
            "CONSULTATION_PACKAGE",
            "PAYMENT_METHOD",
            "SPECIALTY",
            "CONSULTATION_TYPE",
            "FINANCIAL_CATEGORY",
            "TAX_CATEGORY",
            "BUDGET_CATEGORY",
            "ITEM_CATEGORY"
        );
        
        for (String codeGroup : tenantCodeGroups) {
            // 시스템 기본 코드 조회
            List<CommonCode> systemCodes = commonCodeRepository
                .findByTenantIdIsNullAndCodeGroupAndIsActiveOrderBySortOrder(
                    codeGroup, true
                );
            
            // 테넌트 코드로 복사
            for (CommonCode systemCode : systemCodes) {
                CommonCode tenantCode = CommonCode.builder()
                    .tenantId(tenantId)
                    .codeGroup(systemCode.getCodeGroup())
                    .codeValue(systemCode.getCodeValue())
                    .codeLabel(systemCode.getCodeLabel())
                    .koreanName(systemCode.getKoreanName())
                    .codeDescription(systemCode.getCodeDescription())
                    .sortOrder(systemCode.getSortOrder())
                    .isActive(true)
                    .extraData(systemCode.getExtraData())
                    .build();
                
                commonCodeRepository.save(tenantCode);
            }
            
            log.info("코드 그룹 복사 완료: codeGroup={}, count={}", 
                codeGroup, systemCodes.size());
        }
        
        log.info("테넌트 기본 공통코드 복사 완료: tenantId={}", tenantId);
    }
}
```

---

## 🌐 프론트엔드 구현

### 1. commonCodeApi 유틸리티

```javascript
import { apiGet, apiPost, apiPut, apiDelete } from './ajax';

const API_BASE = '/api/v1/common-codes';

/**
 * 테넌트별 독립 코드 그룹 목록
 */
const TENANT_ISOLATED_CODE_GROUPS = [
    'CONSULTATION_PACKAGE',
    'PACKAGE_TYPE',
    'PAYMENT_METHOD',
    'SPECIALTY',
    'CONSULTATION_TYPE',
    'MAPPING_STATUS',
    'FINANCIAL_CATEGORY',
    'TAX_CATEGORY',
    'BUDGET_CATEGORY',
    'ITEM_CATEGORY'
];

/**
 * 코어 코드 그룹 목록 (시스템 전역)
 */
const CORE_CODE_GROUPS = [
    'USER_STATUS',
    'USER_ROLE',
    'ROLE',
    'CODE_GROUP_TYPE',
    'SYSTEM_STATUS',
    'NOTIFICATION_TYPE',
    'GENDER',
    'BANK',
    'ADDRESS_TYPE'
];

/**
 * 공통코드 목록 조회
 * 
 * @param {string} codeGroup - 코드 그룹 (선택)
 * @param {boolean} forceTenant - 테넌트 코드만 조회
 * @returns {Promise<Array>} 공통코드 목록
 */
export async function getCommonCodes(codeGroup = null, forceTenant = false) {
    try {
        let url = API_BASE;
        
        if (codeGroup) {
            url += `?codeGroup=${codeGroup}`;
            
            // 테넌트 독립 코드 그룹인 경우 forceTenant=true
            if (TENANT_ISOLATED_CODE_GROUPS.includes(codeGroup)) {
                url += '&forceTenant=true';
            }
        }
        
        if (forceTenant) {
            url += codeGroup ? '&forceTenant=true' : '?forceTenant=true';
        }
        
        const response = await apiGet(url);
        return response.success ? response.data : [];
    } catch (error) {
        console.error('공통코드 조회 실패:', error);
        return [];
    }
}

/**
 * 공통코드 생성
 * 
 * @param {Object} data - 공통코드 데이터
 * @returns {Promise<Object>} 생성된 공통코드
 */
export async function createCommonCode(data) {
    try {
        const response = await apiPost(API_BASE, data);
        return response;
    } catch (error) {
        console.error('공통코드 생성 실패:', error);
        throw error;
    }
}

/**
 * 공통코드 수정
 * 
 * @param {number} id - 공통코드 ID
 * @param {Object} data - 수정할 데이터
 * @returns {Promise<Object>} 수정된 공통코드
 */
export async function updateCommonCode(id, data) {
    try {
        const response = await apiPut(`${API_BASE}/${id}`, data);
        return response;
    } catch (error) {
        console.error('공통코드 수정 실패:', error);
        throw error;
    }
}

/**
 * 공통코드 삭제
 * 
 * @param {number} id - 공통코드 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export async function deleteCommonCode(id) {
    try {
        const response = await apiDelete(`${API_BASE}/${id}`);
        return response.success;
    } catch (error) {
        console.error('공통코드 삭제 실패:', error);
        throw error;
    }
}

/**
 * 코드 그룹이 테넌트 독립 코드인지 확인
 * 
 * @param {string} codeGroup - 코드 그룹
 * @returns {boolean} 테넌트 독립 코드 여부
 */
export function isTenantIsolatedCodeGroup(codeGroup) {
    return TENANT_ISOLATED_CODE_GROUPS.includes(codeGroup);
}

/**
 * 코드 그룹이 코어 코드인지 확인
 * 
 * @param {string} codeGroup - 코드 그룹
 * @returns {boolean} 코어 코드 여부
 */
export function isCoreCodeGroup(codeGroup) {
    return CORE_CODE_GROUPS.includes(codeGroup);
}
```

---

## 📋 API 엔드포인트

### 1. 공통코드 조회

```
GET /api/v1/common-codes
GET /api/v1/common-codes?codeGroup=USER_STATUS
GET /api/v1/common-codes?codeGroup=PAYMENT_METHOD&forceTenant=true
```

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenantId": null,
      "codeGroup": "USER_STATUS",
      "codeValue": "ACTIVE",
      "codeLabel": "활성",
      "koreanName": "활성",
      "codeDescription": "활성 상태",
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

---

### 2. 공통코드 생성

```
POST /api/v1/common-codes
```

**요청**:
```json
{
  "codeGroup": "PAYMENT_METHOD",
  "codeValue": "CREDIT_CARD",
  "codeLabel": "신용카드",
  "koreanName": "신용카드",
  "codeDescription": "신용카드 결제",
  "sortOrder": 1,
  "isActive": true
}
```

---

### 3. 공통코드 수정

```
PUT /api/v1/common-codes/{id}
```

**요청**:
```json
{
  "codeLabel": "신용/체크카드",
  "koreanName": "신용/체크카드",
  "codeDescription": "신용카드 또는 체크카드 결제"
}
```

---

### 4. 공통코드 삭제

```
DELETE /api/v1/common-codes/{id}
```

---

## ✅ 체크리스트

### 공통코드 생성 시
- [ ] korean_name 필수 입력
- [ ] 적절한 codeGroup 선택
- [ ] 고유한 codeValue 사용
- [ ] sortOrder 설정
- [ ] 테넌트 코드인 경우 tenantId 설정
- [ ] 시스템 코드인 경우 tenantId = NULL

### 공통코드 조회 시
- [ ] 테넌트 독립 코드는 forceTenant=true
- [ ] 코어 코드는 시스템 코드 조회
- [ ] 활성 코드만 조회 (isActive = true)
- [ ] sortOrder 순서로 정렬

### 테넌트 생성 시
- [ ] 기본 공통코드 복사 (copyDefaultCodesToTenant)
- [ ] 테넌트 독립 코드 그룹만 복사
- [ ] 코어 코드는 복사하지 않음

---

## 🚫 금지 사항

### 1. 백엔드 하드코딩 금지
```java
// ❌ 금지
if (codeGroup.equals("USER_STATUS")) { ... }

// ✅ 권장
CommonCode codeType = commonCodeService.getCodeByGroupAndValue(
    "CODE_GROUP_TYPE", codeGroup
);
if ("CORE".equals(codeType.getCodeValue())) { ... }
```

### 2. korean_name 누락 금지
```java
// ❌ 금지
CommonCode code = CommonCode.builder()
    .codeGroup("USER_STATUS")
    .codeValue("ACTIVE")
    .codeLabel("Active")
    // korean_name 누락
    .build();

// ✅ 권장
CommonCode code = CommonCode.builder()
    .codeGroup("USER_STATUS")
    .codeValue("ACTIVE")
    .codeLabel("Active")
    .koreanName("활성")  // 필수
    .build();
```

### 3. 직접 SQL 수정 금지
```sql
-- ❌ 금지 - 직접 수정
UPDATE common_codes SET code_label = '변경' WHERE id = 1;

-- ✅ 권장 - API 사용
PUT /api/v1/common-codes/1
```

---

## 💡 베스트 프랙티스

### 1. 코드 그룹 네이밍
```
형식: {DOMAIN}_{TYPE}

예시:
- USER_STATUS (사용자 상태)
- PAYMENT_METHOD (결제 방법)
- CONSULTATION_TYPE (상담 유형)
- FINANCIAL_CATEGORY (재무 카테고리)
```

### 2. 코드 값 네이밍
```
형식: {DESCRIPTIVE_NAME} (대문자, 언더스코어)

예시:
- ACTIVE (활성)
- CREDIT_CARD (신용카드)
- INDIVIDUAL (개인)
- MONTHLY (월별)
```

### 3. extraData 활용
```json
{
  "codeGroup": "PAYMENT_METHOD",
  "codeValue": "CREDIT_CARD",
  "koreanName": "신용카드",
  "extraData": {
    "icon": "credit-card",
    "color": "#3b82f6",
    "fee": 0.03,
    "minAmount": 1000
  }
}
```

---

## 📞 문의

공통코드 시스템 표준 관련 문의:
- 백엔드 팀
- 데이터베이스 팀

**최종 업데이트**: 2025-12-02

