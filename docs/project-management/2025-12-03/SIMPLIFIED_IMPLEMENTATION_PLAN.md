# 그룹 기반 권한 시스템 구현 계획 (단순화)

**작성일**: 2025-12-03  
**목적**: 구매 기능 없이 그룹 기반 권한 시스템만 먼저 구현

---

## 🎯 핵심 목표

### 현재 구현 범위 (Phase 1)
```
✅ 그룹 기반 권한 시스템
✅ 컴포넌트 레지스트리
✅ 역할별 자동 대시보드 생성
✅ 동적 섹션 표시/숨김
```

### 향후 확장 (Phase 2 - 나중에)
```
⏳ 마켓플레이스 UI
⏳ 패키지 구매 기능
⏳ 결제 연동
⏳ 구독 관리
```

---

## 📊 데이터베이스 구조 (현재 구현)

### 1. permission_groups 테이블
```sql
CREATE TABLE permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 그룹 정보
    permission_group_code VARCHAR(50) NOT NULL UNIQUE COMMENT '권한 그룹 코드',
    group_name VARCHAR(100) NOT NULL COMMENT '그룹명',
    group_name_en VARCHAR(100) COMMENT '영문 그룹명',
    description TEXT COMMENT '설명',
    
    -- 분류
    category VARCHAR(50) NOT NULL COMMENT 'STATISTICS, MANAGEMENT, ERP, SPECIALIZED',
    business_type VARCHAR(50) NULL COMMENT '업종 (NULL=공통, CONSULTATION, ACADEMY)',
    
    -- 메타데이터
    icon VARCHAR(50) COMMENT '아이콘',
    sort_order INT DEFAULT 0,
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false COMMENT '기본 제공 여부',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_business_type (business_type),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. group_components 테이블
```sql
CREATE TABLE group_components (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    permission_group_code VARCHAR(50) NOT NULL COMMENT '권한 그룹 코드',
    component_code VARCHAR(100) NOT NULL COMMENT '컴포넌트 코드',
    component_name VARCHAR(100) NOT NULL COMMENT '컴포넌트명',
    component_path VARCHAR(200) NOT NULL COMMENT '컴포넌트 경로',
    
    -- 메타데이터
    props JSON COMMENT '컴포넌트 기본 props',
    sort_order INT DEFAULT 0,
    is_required BOOLEAN DEFAULT false COMMENT '필수 컴포넌트 여부',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_group_component (permission_group_code, component_code),
    INDEX idx_group (permission_group_code),
    INDEX idx_component (component_code),
    
    FOREIGN KEY (permission_group_code) 
        REFERENCES permission_groups(permission_group_code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. role_permission_groups 테이블
```sql
CREATE TABLE role_permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 역할-그룹 매핑
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '역할 ID',
    permission_group_code VARCHAR(50) NOT NULL COMMENT '권한 그룹 코드',
    
    -- 권한 레벨
    access_level VARCHAR(20) DEFAULT 'READ' COMMENT 'READ, WRITE, FULL',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    
    -- 메타데이터
    assigned_by VARCHAR(100) COMMENT '부여자',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_role_group (tenant_id, tenant_role_id, permission_group_code),
    INDEX idx_tenant (tenant_id),
    INDEX idx_role (tenant_role_id),
    INDEX idx_group (permission_group_code),
    
    FOREIGN KEY (permission_group_code) 
        REFERENCES permission_groups(permission_group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📋 기본 데이터 (현재 구현)

### 1. 공통 권한 그룹 (모든 업종)
```sql
-- ========================================
-- 통계 섹션
-- ========================================
INSERT INTO permission_groups VALUES
(NULL, 'DASHBOARD_STATISTICS', '통계 대시보드', 'Statistics Dashboard', 
 '기본 통계 및 현황', 'STATISTICS', NULL, 
 'bi-graph-up', 1, true, true, NOW(), NOW());

-- 통계 섹션 컴포넌트
INSERT INTO group_components VALUES
(NULL, 'DASHBOARD_STATISTICS', 'TODAY_STATS', '오늘의 통계', 
 'components/dashboard/sections/TodayStats', 
 '{"showChart": true}', 1, true, NOW(), NOW()),

(NULL, 'DASHBOARD_STATISTICS', 'MONTHLY_CHART', '월별 차트', 
 'components/dashboard/sections/MonthlyChart', 
 '{"chartType": "line"}', 2, true, NOW(), NOW()),

(NULL, 'DASHBOARD_STATISTICS', 'QUICK_STATS', '빠른 통계', 
 'components/dashboard/sections/QuickStats', 
 '{}', 3, false, NOW(), NOW());

-- ========================================
-- 관리 섹션
-- ========================================
INSERT INTO permission_groups VALUES
(NULL, 'DASHBOARD_MANAGEMENT', '관리 기능', 'Management', 
 '기본 관리 기능', 'MANAGEMENT', NULL, 
 'bi-gear', 10, true, true, NOW(), NOW());

-- 관리 섹션 컴포넌트
INSERT INTO group_components VALUES
(NULL, 'DASHBOARD_MANAGEMENT', 'USER_MANAGEMENT', '사용자 관리', 
 'components/dashboard/sections/UserManagement', 
 '{}', 1, true, NOW(), NOW()),

(NULL, 'DASHBOARD_MANAGEMENT', 'ROLE_MANAGEMENT', '역할 관리', 
 'components/dashboard/sections/RoleManagement', 
 '{}', 2, true, NOW(), NOW()),

(NULL, 'DASHBOARD_MANAGEMENT', 'SETTINGS', '설정', 
 'components/dashboard/sections/Settings', 
 '{}', 3, false, NOW(), NOW());

-- ========================================
-- ERP 섹션 (관리자만)
-- ========================================
INSERT INTO permission_groups VALUES
(NULL, 'DASHBOARD_ERP', 'ERP 관리', 'ERP Management', 
 'ERP 통합 관리 기능', 'ERP', NULL, 
 'bi-building', 20, true, false, NOW(), NOW());

-- ERP 섹션 컴포넌트
INSERT INTO group_components VALUES
(NULL, 'DASHBOARD_ERP', 'ERP_PURCHASE', '구매 관리', 
 'components/dashboard/sections/erp/PurchaseManagement', 
 '{}', 1, true, NOW(), NOW()),

(NULL, 'DASHBOARD_ERP', 'ERP_FINANCIAL', '재무 관리', 
 'components/dashboard/sections/erp/FinancialManagement', 
 '{}', 2, true, NOW(), NOW()),

(NULL, 'DASHBOARD_ERP', 'ERP_BUDGET', '예산 관리', 
 'components/dashboard/sections/erp/BudgetManagement', 
 '{}', 3, true, NOW(), NOW());
```

### 2. 상담소 전문 그룹
```sql
-- ========================================
-- 상담 관리 섹션
-- ========================================
INSERT INTO permission_groups VALUES
(NULL, 'CONSULT_MANAGEMENT', '상담 관리', 'Consultation Management', 
 '상담 일정 및 기록 관리', 'SPECIALIZED', 'CONSULTATION', 
 'bi-calendar-check', 30, true, true, NOW(), NOW());

-- 상담 관리 컴포넌트
INSERT INTO group_components VALUES
(NULL, 'CONSULT_MANAGEMENT', 'CONSULT_SCHEDULE', '상담 일정', 
 'components/dashboard/sections/consultation/Schedule', 
 '{}', 1, true, NOW(), NOW()),

(NULL, 'CONSULT_MANAGEMENT', 'CONSULT_RECORDS', '상담 기록', 
 'components/dashboard/sections/consultation/Records', 
 '{}', 2, true, NOW(), NOW()),

(NULL, 'CONSULT_MANAGEMENT', 'CLIENT_MANAGEMENT', '내담자 관리', 
 'components/dashboard/sections/consultation/ClientManagement', 
 '{}', 3, true, NOW(), NOW());

-- ========================================
-- 심리평가 섹션 (향후 유료)
-- ========================================
INSERT INTO permission_groups VALUES
(NULL, 'CONSULT_ASSESSMENT', '심리평가', 'Psychological Assessment', 
 '심리검사 및 평가 도구', 'SPECIALIZED', 'CONSULTATION', 
 'bi-clipboard-data', 31, true, false, NOW(), NOW());

-- 심리평가 컴포넌트
INSERT INTO group_components VALUES
(NULL, 'CONSULT_ASSESSMENT', 'ASSESSMENT_TOOLS', '평가 도구', 
 'components/dashboard/sections/consultation/AssessmentTools', 
 '{}', 1, true, NOW(), NOW()),

(NULL, 'CONSULT_ASSESSMENT', 'ASSESSMENT_RESULTS', '평가 결과', 
 'components/dashboard/sections/consultation/AssessmentResults', 
 '{}', 2, true, NOW(), NOW());
```

### 3. 학원 전문 그룹 (향후 확장)
```sql
-- ========================================
-- 학원 관리 섹션
-- ========================================
INSERT INTO permission_groups VALUES
(NULL, 'ACADEMY_MANAGEMENT', '학원 관리', 'Academy Management', 
 '학생 및 수업 관리', 'SPECIALIZED', 'ACADEMY', 
 'bi-mortarboard', 40, true, true, NOW(), NOW());

-- 학원 관리 컴포넌트
INSERT INTO group_components VALUES
(NULL, 'ACADEMY_MANAGEMENT', 'STUDENT_MANAGEMENT', '학생 관리', 
 'components/dashboard/sections/academy/StudentManagement', 
 '{}', 1, true, NOW(), NOW()),

(NULL, 'ACADEMY_MANAGEMENT', 'CLASS_MANAGEMENT', '수업 관리', 
 'components/dashboard/sections/academy/ClassManagement', 
 '{}', 2, true, NOW(), NOW()),

(NULL, 'ACADEMY_MANAGEMENT', 'ATTENDANCE', '출결 관리', 
 'components/dashboard/sections/academy/Attendance', 
 '{}', 3, true, NOW(), NOW());

-- ========================================
-- 성적 분석 섹션 (향후 유료)
-- ========================================
INSERT INTO permission_groups VALUES
(NULL, 'EXAM_ANALYSIS', '성적 분석', 'Exam Analysis', 
 '시험 및 성적 분석 시스템', 'SPECIALIZED', 'ACADEMY', 
 'bi-graph-up-arrow', 41, true, false, NOW(), NOW());

-- 성적 분석 컴포넌트
INSERT INTO group_components VALUES
(NULL, 'EXAM_ANALYSIS', 'EXAM_MANAGEMENT', '시험 관리', 
 'components/dashboard/sections/academy/ExamManagement', 
 '{}', 1, true, NOW(), NOW()),

(NULL, 'EXAM_ANALYSIS', 'GRADE_ANALYSIS', '성적 분석', 
 'components/dashboard/sections/academy/GradeAnalysis', 
 '{}', 2, true, NOW(), NOW());
```

### 4. 역할별 기본 권한 매핑
```sql
-- ========================================
-- ADMIN 역할 (모든 권한)
-- ========================================
INSERT INTO role_permission_groups 
SELECT NULL, t.tenant_id, tr.tenant_role_id, pg.permission_group_code, 
       'FULL', 'SYSTEM', NOW(), NOW(), NOW()
FROM tenants t
CROSS JOIN tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'ADMIN'
  AND tr.tenant_id = t.tenant_id
  AND (pg.business_type IS NULL OR pg.business_type = t.business_type);

-- ========================================
-- STAFF 역할 (ERP 제외)
-- ========================================
INSERT INTO role_permission_groups 
SELECT NULL, t.tenant_id, tr.tenant_role_id, pg.permission_group_code, 
       'WRITE', 'SYSTEM', NOW(), NOW(), NOW()
FROM tenants t
CROSS JOIN tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'STAFF'
  AND tr.tenant_id = t.tenant_id
  AND pg.category != 'ERP'
  AND (pg.business_type IS NULL OR pg.business_type = t.business_type);

-- ========================================
-- CONSULTANT 역할 (상담 전문 기능)
-- ========================================
INSERT INTO role_permission_groups 
SELECT NULL, t.tenant_id, tr.tenant_role_id, pg.permission_group_code, 
       'WRITE', 'SYSTEM', NOW(), NOW(), NOW()
FROM tenants t
CROSS JOIN tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'CONSULTANT'
  AND tr.tenant_id = t.tenant_id
  AND (pg.permission_group_code LIKE 'CONSULT_%' OR pg.is_default = true)
  AND (pg.business_type IS NULL OR pg.business_type = 'CONSULTATION');

-- ========================================
-- CLIENT 역할 (기본 조회만)
-- ========================================
INSERT INTO role_permission_groups 
SELECT NULL, t.tenant_id, tr.tenant_role_id, pg.permission_group_code, 
       'READ', 'SYSTEM', NOW(), NOW(), NOW()
FROM tenants t
CROSS JOIN tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'CLIENT'
  AND tr.tenant_id = t.tenant_id
  AND pg.is_default = true
  AND (pg.business_type IS NULL OR pg.business_type = t.business_type);
```

---

## 💻 백엔드 구현 (현재 구현)

### 1. PermissionGroupService.java
```java
@Service
public class PermissionGroupService {
    
    /**
     * 사용자의 권한 그룹 조회
     */
    public List<PermissionGroupDTO> getUserPermissionGroups(String userId) {
        // 1. 사용자 정보 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다"));
        
        String tenantId = user.getTenantId();
        String roleId = user.getTenantRoleId();
        
        // 2. 역할에 할당된 권한 그룹 조회
        List<RolePermissionGroup> rolePermissions = rolePermissionGroupRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, roleId);
        
        // 3. 권한 그룹 상세 정보 조회
        List<String> groupCodes = rolePermissions.stream()
            .map(RolePermissionGroup::getPermissionGroupCode)
            .collect(Collectors.toList());
        
        List<PermissionGroup> groups = permissionGroupRepository
            .findByPermissionGroupCodeInAndIsActiveTrue(groupCodes);
        
        // 4. DTO 변환
        return groups.stream()
            .map(group -> PermissionGroupDTO.builder()
                .permissionGroupCode(group.getPermissionGroupCode())
                .groupName(group.getGroupName())
                .category(group.getCategory())
                .icon(group.getIcon())
                .sortOrder(group.getSortOrder())
                .accessLevel(getAccessLevel(rolePermissions, group.getPermissionGroupCode()))
                .build())
            .sorted(Comparator.comparing(PermissionGroupDTO::getSortOrder))
            .collect(Collectors.toList());
    }
    
    /**
     * 권한 그룹의 컴포넌트 조회
     */
    public List<ComponentDTO> getGroupComponents(String permissionGroupCode) {
        List<GroupComponent> components = groupComponentRepository
            .findByPermissionGroupCodeOrderBySortOrder(permissionGroupCode);
        
        return components.stream()
            .map(comp -> ComponentDTO.builder()
                .componentCode(comp.getComponentCode())
                .componentName(comp.getComponentName())
                .componentPath(comp.getComponentPath())
                .props(comp.getProps())
                .isRequired(comp.getIsRequired())
                .build())
            .collect(Collectors.toList());
    }
    
    /**
     * 대시보드 구조 조회 (그룹 + 컴포넌트)
     */
    public DashboardStructureDTO getDashboardStructure(String userId) {
        // 1. 권한 그룹 조회
        List<PermissionGroupDTO> groups = getUserPermissionGroups(userId);
        
        // 2. 각 그룹의 컴포넌트 조회
        Map<String, List<ComponentDTO>> groupComponents = new HashMap<>();
        for (PermissionGroupDTO group : groups) {
            List<ComponentDTO> components = getGroupComponents(
                group.getPermissionGroupCode()
            );
            groupComponents.put(group.getPermissionGroupCode(), components);
        }
        
        return DashboardStructureDTO.builder()
            .groups(groups)
            .components(groupComponents)
            .build();
    }
}
```

### 2. DashboardController.java
```java
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
    
    /**
     * 대시보드 구조 조회
     */
    @GetMapping("/structure")
    public ResponseEntity<DashboardStructureDTO> getDashboardStructure() {
        String userId = SecurityUtils.getCurrentUserId();
        DashboardStructureDTO structure = permissionGroupService
            .getDashboardStructure(userId);
        return ResponseEntity.ok(structure);
    }
    
    /**
     * 권한 그룹 목록 조회
     */
    @GetMapping("/permission-groups")
    public ResponseEntity<List<PermissionGroupDTO>> getPermissionGroups() {
        String userId = SecurityUtils.getCurrentUserId();
        List<PermissionGroupDTO> groups = permissionGroupService
            .getUserPermissionGroups(userId);
        return ResponseEntity.ok(groups);
    }
    
    /**
     * 그룹 컴포넌트 조회
     */
    @GetMapping("/permission-groups/{groupCode}/components")
    public ResponseEntity<List<ComponentDTO>> getGroupComponents(
            @PathVariable String groupCode) {
        List<ComponentDTO> components = permissionGroupService
            .getGroupComponents(groupCode);
        return ResponseEntity.ok(components);
    }
}
```

---

## 💻 프론트엔드 구현 (현재 구현)

### 1. useDashboardStructure Hook
```javascript
// hooks/useDashboardStructure.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useDashboardStructure = () => {
    const [structure, setStructure] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStructure();
    }, []);

    const fetchStructure = async () => {
        try {
            const response = await axios.get('/api/v1/dashboard/structure');
            setStructure(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { structure, loading, error, refetch: fetchStructure };
};
```

### 2. UnifiedDashboard 컴포넌트
```javascript
// components/dashboard/UnifiedDashboard.js
import React from 'react';
import { useDashboardStructure } from '../../hooks/useDashboardStructure';
import DashboardSection from './DashboardSection';
import './UnifiedDashboard.css';

const UnifiedDashboard = () => {
    const { structure, loading, error } = useDashboardStructure();

    if (loading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error">오류: {error}</div>;
    if (!structure) return null;

    return (
        <div className="unified-dashboard">
            {structure.groups.map(group => (
                <DashboardSection
                    key={group.permissionGroupCode}
                    group={group}
                    components={structure.components[group.permissionGroupCode]}
                />
            ))}
        </div>
    );
};

export default UnifiedDashboard;
```

### 3. DashboardSection 컴포넌트
```javascript
// components/dashboard/DashboardSection.js
import React, { lazy, Suspense } from 'react';
import './DashboardSection.css';

const DashboardSection = ({ group, components }) => {
    return (
        <section className="dashboard-section">
            <div className="section-header">
                <i className={`bi ${group.icon}`}></i>
                <h2>{group.groupName}</h2>
                <span className="access-level">{group.accessLevel}</span>
            </div>
            
            <div className="section-content">
                {components.map(comp => {
                    // 동적 컴포넌트 로딩
                    const Component = lazy(() => 
                        import(`../${comp.componentPath}`)
                    );
                    
                    return (
                        <Suspense key={comp.componentCode} fallback={<div>로딩...</div>}>
                            <Component {...comp.props} />
                        </Suspense>
                    );
                })}
            </div>
        </section>
    );
};

export default DashboardSection;
```

---

## ✅ 구현 순서

### Phase 1: DB 및 기본 데이터 (1일)
1. ✅ 테이블 생성 (permission_groups, group_components, role_permission_groups)
2. ✅ 기본 그룹 데이터 삽입
3. ✅ 역할별 권한 매핑

### Phase 2: 백엔드 (1일)
1. ✅ Entity, Repository 생성
2. ✅ Service 구현
3. ✅ Controller 구현
4. ✅ 테스트

### Phase 3: 프론트엔드 (2일)
1. ✅ Hook 구현
2. ✅ UnifiedDashboard 구현
3. ✅ DashboardSection 구현
4. ✅ 기존 컴포넌트 경로 정리
5. ✅ 테스트

### Phase 4: 통합 및 검증 (1일)
1. ✅ 역할별 대시보드 확인
2. ✅ 권한 레벨 동작 확인
3. ✅ 업종별 컴포넌트 확인
4. ✅ 문서화

---

## 🚀 향후 확장 (Phase 2 - 나중에)

### 1. 마켓플레이스 UI 추가
- 패키지 목록 페이지
- 패키지 상세 페이지
- 데모 기능

### 2. 구매 기능 추가
- component_packages 테이블
- tenant_subscriptions 테이블
- 결제 연동

### 3. 구독 관리
- 구독 현황 페이지
- 자동 갱신
- 취소 기능

---

**작성 완료**: 2025-12-03  
**핵심**: 지금은 그룹 기반 권한 시스템만, 나중에 마켓플레이스 확장!

