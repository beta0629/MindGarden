# 표준화 준수 체크리스트

**작성일**: 2025-12-02  
**버전**: 1.0.0  
**목적**: 위젯 그룹화 및 멀티 비즈니스 타입 시스템 표준 준수 확인

---

## 📋 표준 문서 참조

### 필수 준수 표준 (21개)

1. ⭐⭐⭐⭐⭐ [테넌트 역할 시스템 표준](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md)
2. ⭐⭐⭐⭐⭐ [데이터베이스 스키마 표준](../../standards/DATABASE_SCHEMA_STANDARD.md)
3. ⭐⭐⭐⭐⭐ [API 설계 표준](../../standards/API_DESIGN_STANDARD.md)
4. ⭐⭐⭐⭐⭐ [디자인 중앙화 표준](../../standards/DESIGN_CENTRALIZATION_STANDARD.md)
5. ⭐⭐⭐⭐⭐ [테스트 표준](../../standards/TESTING_STANDARD.md)
6. ⭐⭐⭐⭐ [공통코드 시스템 표준](../../standards/COMMON_CODE_SYSTEM_STANDARD.md)
7. ⭐⭐⭐⭐ [로깅 표준](../../standards/LOGGING_STANDARD.md)
8. ⭐⭐⭐⭐ [DTO 네이밍 표준](../../standards/DTO_NAMING_STANDARD.md)
9. ⭐⭐⭐⭐ [Stored Procedure 표준](../../standards/STORED_PROCEDURE_STANDARD.md)

---

## 🎯 표준 준수 원칙

### 필수 준수 사항
1. ✅ **테넌트 기반 개발** - 모든 데이터는 테넌트별로 격리
2. ✅ **브랜치 개념 금지** - `branchCode`, `branchId` 사용 금지
3. ✅ **역할 동적 관리** - 테넌트별 역할 생성/수정/삭제
4. ✅ **소프트 삭제 원칙** - 하드 삭제 금지
5. ✅ **API 버전 관리** - `/api/v1/` 필수
6. ✅ **하드코딩 금지** - 모든 설정은 DB 또는 환경변수
7. ✅ **공통코드 사용** - 상수 대신 공통코드 테이블 조회
8. ✅ **CSS 변수 사용** - 인라인 스타일 및 하드코딩 금지

### 금지 사항
- ❌ `branchCode`, `branchId` 변수 사용
- ❌ 지점별 필터링 로직
- ❌ 전역 역할 (테넌트 무관)
- ❌ 하드 삭제
- ❌ 하드코딩된 값 (URL, 색상, 크기 등)
- ❌ 인라인 스타일
- ❌ 상수 클래스 (공통코드로 대체)

---

## 📊 위젯 그룹화 시스템 표준 준수 체크

### 1. 데이터베이스 설계 (DATABASE_SCHEMA_STANDARD.md)

#### ✅ widget_groups 테이블

```sql
CREATE TABLE widget_groups (
    -- ✅ 필수 컬럼
    group_id VARCHAR(50) PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    display_order INT NOT NULL,
    description TEXT,
    
    -- ✅ 표준: 활성화 플래그
    is_active BOOLEAN DEFAULT TRUE,
    
    -- ✅ 표준: 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    
    -- ✅ 표준: 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(100),
    
    -- ✅ 표준: 인덱스
    INDEX idx_business_type_role (business_type, role_code),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
);
```

**준수 사항**:
- ✅ 감사 필드 (created_at, created_by, updated_at, updated_by)
- ✅ 소프트 삭제 (is_deleted, deleted_at, deleted_by)
- ✅ 적절한 인덱스
- ✅ 명명 규칙 (snake_case)
- ⚠️ **추가 필요**: tenant_id 컬럼 (테넌트 격리)

#### ✅ widget_definitions 테이블

```sql
CREATE TABLE widget_definitions (
    -- ✅ 필수 컬럼
    widget_id VARCHAR(50) PRIMARY KEY,
    widget_type VARCHAR(100) NOT NULL,
    widget_name VARCHAR(100) NOT NULL,
    group_id VARCHAR(50),
    business_type VARCHAR(50) NOT NULL,
    role_code VARCHAR(50),
    default_config JSON,
    display_order INT NOT NULL,
    
    -- ✅ 권한 관리 필드
    is_system_managed BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT FALSE,
    is_deletable BOOLEAN DEFAULT FALSE,
    is_movable BOOLEAN DEFAULT TRUE,
    is_configurable BOOLEAN DEFAULT TRUE,
    
    -- ✅ 표준: 활성화 플래그
    is_active BOOLEAN DEFAULT TRUE,
    
    -- ✅ 표준: 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    
    -- ✅ 표준: 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(100),
    
    -- ✅ 표준: 외래키
    FOREIGN KEY (group_id) REFERENCES widget_groups(group_id),
    
    -- ✅ 표준: 인덱스
    INDEX idx_group_id (group_id),
    INDEX idx_business_type_role (business_type, role_code),
    INDEX idx_is_system_managed (is_system_managed),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
);
```

**준수 사항**:
- ✅ 감사 필드
- ✅ 소프트 삭제
- ✅ 적절한 인덱스
- ✅ 외래키 제약조건
- ⚠️ **추가 필요**: tenant_id 컬럼 (테넌트별 커스텀 위젯 지원)

---

### 2. API 설계 (API_DESIGN_STANDARD.md)

#### ✅ 위젯 추가 API

```java
@PostMapping("/api/v1/dashboards/{dashboardId}/widgets")
public ResponseEntity<?> addWidget(
        @PathVariable String dashboardId,
        @RequestBody AddWidgetRequest request,
        @RequestHeader("X-Tenant-ID") String tenantId,  // ✅ 표준: 테넌트 ID 헤더
        @AuthenticationPrincipal UserDetails userDetails) {
    
    // ✅ 표준: 권한 검증
    if (!widgetPermissionService.canAddWidget(
            request.getWidgetType(), 
            request.getBusinessType(), 
            request.getRoleCode())) {
        // ✅ 표준: 표준 에러 응답
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("WIDGET_ADD_FORBIDDEN", 
                      "이 위젯은 추가할 수 없습니다 (시스템 관리 위젯)"));
    }
    
    // ✅ 표준: 테넌트 격리
    widgetService.addWidget(tenantId, dashboardId, request);
    
    // ✅ 표준: 표준 성공 응답
    return ResponseEntity.ok(ApiResponse.success("위젯이 추가되었습니다"));
}
```

**준수 사항**:
- ✅ `/api/v1/` 버전 관리
- ✅ RESTful 설계 (POST /dashboards/{id}/widgets)
- ✅ 테넌트 ID 헤더 전달
- ✅ 표준 응답 구조 (ApiResponse)
- ✅ 에러 코드 체계
- ✅ 인증/인가 검증

#### ✅ 위젯 삭제 API

```java
@DeleteMapping("/api/v1/dashboards/{dashboardId}/widgets/{widgetId}")
public ResponseEntity<?> deleteWidget(
        @PathVariable String dashboardId,
        @PathVariable String widgetId,
        @RequestHeader("X-Tenant-ID") String tenantId,  // ✅ 표준: 테넌트 ID 헤더
        @AuthenticationPrincipal UserDetails userDetails) {
    
    // ✅ 표준: 권한 검증
    if (!widgetPermissionService.canDeleteWidget(widgetId, userDetails.getUsername())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("WIDGET_DELETE_FORBIDDEN", 
                      "이 위젯은 삭제할 수 없습니다 (시스템 관리 위젯)"));
    }
    
    // ✅ 표준: 소프트 삭제
    widgetService.softDeleteWidget(tenantId, widgetId, userDetails.getUsername());
    
    return ResponseEntity.ok(ApiResponse.success("위젯이 삭제되었습니다"));
}
```

**준수 사항**:
- ✅ RESTful 설계 (DELETE)
- ✅ 테넌트 격리
- ✅ 소프트 삭제 (하드 삭제 금지)
- ✅ 감사 로깅 (deleted_by)

---

### 3. 백엔드 구현

#### ✅ WidgetGroup 엔티티

```java
@Entity
@Table(name = "widget_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WidgetGroup extends BaseEntity {  // ✅ 표준: BaseEntity 상속
    
    @Id
    @Column(name = "group_id", length = 50)
    private String groupId;
    
    @Column(name = "group_name", length = 100, nullable = false)
    private String groupName;
    
    @Column(name = "business_type", length = 50, nullable = false)
    private String businessType;
    
    @Column(name = "role_code", length = 50, nullable = false)
    private String roleCode;
    
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    // ⚠️ 추가 필요: tenant_id 컬럼
    @Column(name = "tenant_id", length = 50)
    private String tenantId;
    
    // ✅ 표준: BaseEntity에 포함됨
    // - created_at, created_by
    // - updated_at, updated_by
    // - is_deleted, deleted_at, deleted_by
    // - is_active
}
```

**준수 사항**:
- ✅ BaseEntity 상속 (감사 필드, 소프트 삭제)
- ✅ Lombok 어노테이션
- ✅ JPA 어노테이션
- ⚠️ **추가 필요**: tenant_id 컬럼

#### ✅ WidgetGroupService

```java
@Service
@Slf4j  // ✅ 표준: @Slf4j 사용
@Transactional(readOnly = true)
public class WidgetGroupService {
    
    @Autowired
    private WidgetGroupRepository widgetGroupRepository;
    
    @Autowired
    private AccessControlService accessControlService;
    
    /**
     * 업종 + 역할별 위젯 그룹 조회
     */
    public List<WidgetGroup> getWidgetGroups(
            String tenantId,  // ✅ 표준: 테넌트 ID 파라미터
            String businessType, 
            String roleCode) {
        
        // ✅ 표준: 테넌트 접근 권한 검증
        accessControlService.validateTenantAccess(tenantId);
        
        // ✅ 표준: 구조화된 로깅
        log.debug("위젯 그룹 조회: tenantId={}, businessType={}, roleCode={}", 
                tenantId, businessType, roleCode);
        
        // ✅ 표준: 소프트 삭제 제외
        return widgetGroupRepository.findByTenantIdAndBusinessTypeAndRoleCodeAndIsDeletedFalse(
                tenantId, businessType, roleCode);
    }
    
    /**
     * 위젯 그룹 생성
     */
    @Transactional
    public WidgetGroup createWidgetGroup(
            String tenantId,
            WidgetGroupCreateRequest request,
            String createdBy) {
        
        accessControlService.validateTenantAccess(tenantId);
        
        log.info("위젯 그룹 생성: tenantId={}, groupName={}, createdBy={}", 
                tenantId, request.getGroupName(), createdBy);
        
        WidgetGroup group = WidgetGroup.builder()
                .groupId(UUID.randomUUID().toString())
                .tenantId(tenantId)  // ✅ 표준: 테넌트 격리
                .groupName(request.getGroupName())
                .businessType(request.getBusinessType())
                .roleCode(request.getRoleCode())
                .displayOrder(request.getDisplayOrder())
                .description(request.getDescription())
                .build();
        
        // ✅ 표준: BaseEntity에서 자동 설정
        // - created_at, created_by
        // - is_deleted = false
        // - is_active = true
        
        return widgetGroupRepository.save(group);
    }
    
    /**
     * 위젯 그룹 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteWidgetGroup(
            String tenantId,
            String groupId,
            String deletedBy) {
        
        accessControlService.validateTenantAccess(tenantId);
        
        WidgetGroup group = widgetGroupRepository
                .findByGroupIdAndTenantIdAndIsDeletedFalse(groupId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("위젯 그룹을 찾을 수 없습니다"));
        
        log.info("위젯 그룹 삭제: tenantId={}, groupId={}, deletedBy={}", 
                tenantId, groupId, deletedBy);
        
        // ✅ 표준: 소프트 삭제
        group.setIsDeleted(true);
        group.setDeletedAt(LocalDateTime.now());
        group.setDeletedBy(deletedBy);
        
        widgetGroupRepository.save(group);
    }
}
```

**준수 사항**:
- ✅ @Slf4j 로깅
- ✅ 구조화된 로깅 (키-값 쌍)
- ✅ 테넌트 격리
- ✅ 소프트 삭제
- ✅ 트랜잭션 관리
- ✅ 접근 권한 검증

---

### 4. 프론트엔드 구현 (DESIGN_CENTRALIZATION_STANDARD.md)

#### ✅ DashboardWidgetManager.js

```javascript
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Lock } from 'lucide-react';
// ✅ 표준: CSS 변수 사용
import { MG_DESIGN_TOKENS } from '../../../constants/designTokens';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import '../../../styles/unified-design-tokens.css';
import './DashboardWidgetManager.css';  // ✅ 표준: 별도 CSS 파일

const DashboardWidgetManager = ({ dashboard, user }) => {
  const [widgets, setWidgets] = useState([]);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  
  // ✅ 표준: 테넌트 ID 사용
  const tenantId = user?.tenantId;
  
  // 독립 위젯 목록 조회
  const fetchAvailableWidgets = async () => {
    try {
      // ✅ 표준: API 버전 관리
      const response = await fetch(
        `/api/v1/dashboards/available-widgets?businessType=${user.businessType}&roleCode=${user.roleCode}`,
        {
          headers: {
            // ✅ 표준: 테넌트 ID 헤더
            'X-Tenant-ID': tenantId,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailableWidgets(data);
      }
    } catch (error) {
      // ✅ 표준: 에러 로깅
      console.error('위젯 목록 조회 실패:', error);
    }
  };
  
  return (
    // ✅ 표준: BEM 네이밍 규칙 (mg-{component}-{element}--{modifier})
    <div className="mg-dashboard-widget-manager">
      {/* 위젯 목록 */}
      <div className="mg-widget-list">
        {widgets.map(widget => (
          <div 
            key={widget.id} 
            className="mg-widget-item"
            // ❌ 금지: 인라인 스타일 사용 금지
            // style={{ backgroundColor: '#fff' }}  ← 이렇게 하면 안됨
          >
            <div className="mg-widget-header">
              <h4 className="mg-widget-title">{widget.title}</h4>
              
              {/* 시스템 관리 위젯 표시 */}
              {widget.isSystemManaged && (
                <span className="mg-badge mg-badge--system">
                  <Lock size={MG_DESIGN_TOKENS.ICON_SIZE_SM} /> 시스템 위젯
                </span>
              )}
              
              {/* 필수 위젯 표시 */}
              {widget.isRequired && (
                <span className="mg-badge mg-badge--required">필수</span>
              )}
            </div>
            
            <div className="mg-widget-actions">
              {/* 설정 버튼 */}
              {widget.isConfigurable && (
                <button
                  onClick={() => handleConfigureWidget(widget.id)}
                  className="mg-btn mg-btn--sm mg-btn--secondary"
                >
                  <Settings size={MG_DESIGN_TOKENS.ICON_SIZE_SM} /> 설정
                </button>
              )}
              
              {/* 삭제 버튼 (독립 위젯만) */}
              {widget.isDeletable ? (
                <button
                  onClick={() => handleDeleteWidget(widget.id)}
                  className="mg-btn mg-btn--sm mg-btn--danger"
                >
                  <Trash2 size={MG_DESIGN_TOKENS.ICON_SIZE_SM} /> 삭제
                </button>
              ) : (
                <span className="mg-text--muted">
                  <Lock size={MG_DESIGN_TOKENS.ICON_SIZE_SM} /> 삭제 불가
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardWidgetManager;
```

#### ✅ DashboardWidgetManager.css

```css
/* ✅ 표준: CSS 변수 사용 (하드코딩 금지) */
.mg-dashboard-widget-manager {
  padding: var(--mg-spacing-lg);
  background-color: var(--mg-color-background);
  border-radius: var(--mg-border-radius-md);
}

.mg-widget-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--mg-spacing-md);
}

.mg-widget-item {
  background-color: var(--mg-color-surface);
  border: 1px solid var(--mg-color-border);
  border-radius: var(--mg-border-radius-sm);
  padding: var(--mg-spacing-md);
  transition: var(--mg-transition-base);
}

.mg-widget-item:hover {
  box-shadow: var(--mg-shadow-md);
  transform: translateY(-2px);
}

.mg-widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--mg-spacing-sm);
}

.mg-widget-title {
  font-size: var(--mg-font-size-md);
  font-weight: var(--mg-font-weight-semibold);
  color: var(--mg-color-text-primary);
  margin: 0;
}

.mg-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--mg-spacing-xs);
  padding: var(--mg-spacing-xs) var(--mg-spacing-sm);
  border-radius: var(--mg-border-radius-sm);
  font-size: var(--mg-font-size-sm);
  font-weight: var(--mg-font-weight-medium);
}

.mg-badge--system {
  background-color: var(--mg-color-info-light);
  color: var(--mg-color-info-dark);
}

.mg-badge--required {
  background-color: var(--mg-color-warning-light);
  color: var(--mg-color-warning-dark);
}

/* ❌ 금지: 하드코딩된 값 사용 금지 */
/* 
.mg-widget-item {
  padding: 16px;  ← 이렇게 하면 안됨
  color: #333;    ← 이렇게 하면 안됨
}
*/
```

**준수 사항**:
- ✅ CSS 변수 사용 (하드코딩 금지)
- ✅ BEM 네이밍 규칙
- ✅ 인라인 스타일 금지
- ✅ 별도 CSS 파일
- ✅ 디자인 토큰 사용

---

### 5. DTO 네이밍 (DTO_NAMING_STANDARD.md)

#### ✅ WidgetGroupCreateRequest

```java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WidgetGroupCreateRequest {
    
    @NotBlank(message = "그룹명은 필수입니다")
    @Size(max = 100, message = "그룹명은 100자 이하여야 합니다")
    private String groupName;
    
    @NotBlank(message = "업종은 필수입니다")
    private String businessType;
    
    @NotBlank(message = "역할 코드는 필수입니다")
    private String roleCode;
    
    @NotNull(message = "표시 순서는 필수입니다")
    @Min(value = 1, message = "표시 순서는 1 이상이어야 합니다")
    private Integer displayOrder;
    
    private String description;
}
```

**준수 사항**:
- ✅ {Entity}CreateRequest 네이밍
- ✅ 검증 어노테이션 (@NotBlank, @Size, @Min)
- ✅ Lombok 어노테이션

#### ✅ WidgetGroupResponse

```java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WidgetGroupResponse {
    
    private String groupId;
    private String groupName;
    private String businessType;
    private String roleCode;
    private Integer displayOrder;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private String createdBy;
    
    // ✅ 표준: 정적 팩토리 메서드
    public static WidgetGroupResponse from(WidgetGroup entity) {
        return WidgetGroupResponse.builder()
                .groupId(entity.getGroupId())
                .groupName(entity.getGroupName())
                .businessType(entity.getBusinessType())
                .roleCode(entity.getRoleCode())
                .displayOrder(entity.getDisplayOrder())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .createdBy(entity.getCreatedBy())
                .build();
    }
    
    // ✅ 표준: 리스트 변환 메서드
    public static List<WidgetGroupResponse> fromList(List<WidgetGroup> entities) {
        return entities.stream()
                .map(WidgetGroupResponse::from)
                .collect(Collectors.toList());
    }
}
```

**준수 사항**:
- ✅ {Entity}Response 네이밍
- ✅ 정적 팩토리 메서드 (from(), fromList())
- ✅ Lombok 어노테이션

---

## 🔍 표준 위반 사항 및 개선 필요 항목

### ⚠️ 중요: 즉시 수정 필요

#### 1. 테넌트 격리 누락

**문제**:
```sql
-- ❌ 현재 설계 (tenant_id 없음)
CREATE TABLE widget_groups (
    group_id VARCHAR(50) PRIMARY KEY,
    business_type VARCHAR(50) NOT NULL,
    role_code VARCHAR(50) NOT NULL
);
```

**수정**:
```sql
-- ✅ 표준 준수 (tenant_id 추가)
CREATE TABLE widget_groups (
    group_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),  -- ✅ 추가: 테넌트 격리
    business_type VARCHAR(50) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_tenant_business_role (tenant_id, business_type, role_code)
);
```

**이유**:
- 테넌트별 커스텀 위젯 그룹 지원
- 시스템 위젯 그룹은 `tenant_id = NULL`
- 테넌트 위젯 그룹은 `tenant_id = {UUID}`

#### 2. 공통코드 미사용

**문제**:
```java
// ❌ 하드코딩
if ("CONSULTATION".equals(businessType)) {
    // ...
}
```

**수정**:
```java
// ✅ 공통코드 사용
String consultationCode = commonCodeService.getCodeValue("BUSINESS_TYPE", "CONSULTATION");
if (consultationCode.equals(businessType)) {
    // ...
}
```

---

## ✅ 최종 체크리스트

### 데이터베이스 설계
- [x] 감사 필드 (created_at, created_by, updated_at, updated_by)
- [x] 소프트 삭제 (is_deleted, deleted_at, deleted_by)
- [x] 적절한 인덱스
- [x] 외래키 제약조건
- [ ] **tenant_id 컬럼 추가** ⚠️

### API 설계
- [x] `/api/v1/` 버전 관리
- [x] RESTful 설계
- [x] 테넌트 ID 헤더
- [x] 표준 응답 구조 (ApiResponse)
- [x] 에러 코드 체계
- [x] 인증/인가 검증

### 백엔드 구현
- [x] BaseEntity 상속
- [x] @Slf4j 로깅
- [x] 구조화된 로깅
- [x] 테넌트 격리
- [x] 소프트 삭제
- [x] 트랜잭션 관리
- [ ] **공통코드 사용** ⚠️

### 프론트엔드 구현
- [x] CSS 변수 사용
- [x] BEM 네이밍 규칙
- [x] 인라인 스타일 금지
- [x] 별도 CSS 파일
- [x] 디자인 토큰 사용
- [x] 테넌트 ID 헤더

### DTO 네이밍
- [x] {Entity}CreateRequest
- [x] {Entity}Response
- [x] 검증 어노테이션
- [x] 정적 팩토리 메서드

---

## 📈 다음 단계

### Phase 0: 표준 준수 개선 (1일)
1. [ ] widget_groups, widget_definitions 테이블에 tenant_id 추가
2. [ ] 공통코드 테이블에 BUSINESS_TYPE, WIDGET_TYPE 등록
3. [ ] 하드코딩된 업종 코드를 공통코드로 변경
4. [ ] 테넌트 격리 로직 추가

### Phase 1: 구현 (6일)
- 표준을 준수하며 구현 진행

---

**최종 업데이트**: 2025-12-02  
**작성자**: CoreSolution Team  
**상태**: ✅ 체크리스트 완료, 개선 사항 식별

---

## 📎 관련 문서

1. [위젯 그룹화 및 자동 생성 시스템](./WIDGET_GROUPING_AND_AUTO_GENERATION.md)
2. [통합 개선 계획서](./INTEGRATED_IMPROVEMENT_PLAN.md)
3. [표준 문서 모음](../../standards/README.md)

