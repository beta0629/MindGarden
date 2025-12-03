# 컴포넌트 레지스트리 시스템 (자동 렌더링)

**작성일**: 2025-12-03  
**목적**: 그룹 코드에 컴포넌트만 추가하면 자동으로 대시보드에 렌더링

---

## 🎯 핵심 개념

### 기존 문제
```javascript
// ❌ 컴포넌트 추가 시마다 코드 수정 필요
{hasPermissionGroup('DASHBOARD_STATISTICS') && <StatisticsSection />}
{hasPermissionGroup('DASHBOARD_MANAGEMENT') && <ManagementSection />}
{hasPermissionGroup('DASHBOARD_ERP') && <ERPSection />}
{hasPermissionGroup('NEW_SECTION') && <NewSection />}  // 새로 추가해야 함!
```

### 새로운 방식
```javascript
// ✅ 컴포넌트 레지스트리에 등록만 하면 자동 렌더링
const COMPONENT_REGISTRY = {
    'DASHBOARD_STATISTICS': StatisticsSection,
    'DASHBOARD_MANAGEMENT': ManagementSection,
    'DASHBOARD_ERP': ERPSection,
    'NEW_SECTION': NewSection  // 여기만 추가!
};

// 자동 렌더링
permissionGroups.map(groupCode => {
    const Component = COMPONENT_REGISTRY[groupCode];
    return Component ? <Component key={groupCode} /> : null;
});
```

---

## 📊 데이터베이스 설계 (확장)

### permission_groups 테이블에 컴포넌트 정보 추가

```sql
ALTER TABLE permission_groups 
ADD COLUMN component_path VARCHAR(200) NULL COMMENT '컴포넌트 경로 (예: dashboard/StatisticsSection)' 
AFTER group_type;

ALTER TABLE permission_groups
ADD COLUMN component_props JSON NULL COMMENT '컴포넌트 기본 props (JSON)' 
AFTER component_path;

-- 인덱스 추가
CREATE INDEX idx_component_path ON permission_groups(component_path);
```

### 예시 데이터

```sql
INSERT INTO permission_groups (
    tenant_id, group_code, group_name, group_type, 
    component_path, component_props, 
    business_type, sort_order
) VALUES
-- 공통 섹션
(NULL, 'DASHBOARD_STATISTICS', '통계 섹션', 'DASHBOARD_SECTION', 
 'dashboard/sections/StatisticsSection', 
 '{"title": "통계", "icon": "bi-graph-up"}', 
 NULL, 1),

(NULL, 'DASHBOARD_MANAGEMENT', '관리 섹션', 'DASHBOARD_SECTION', 
 'dashboard/sections/ManagementSection', 
 '{"title": "관리", "icon": "bi-people"}', 
 NULL, 2),

(NULL, 'DASHBOARD_ERP', 'ERP 섹션', 'DASHBOARD_SECTION', 
 'dashboard/sections/ERPSection', 
 '{"title": "ERP 관리", "icon": "bi-building"}', 
 NULL, 3),

-- 상담소 전용
(NULL, 'CONSULTATION_MANAGEMENT', '상담 관리 섹션', 'DASHBOARD_SECTION', 
 'consultation/sections/ConsultationSection', 
 '{"title": "상담 관리", "icon": "bi-chat-heart"}', 
 'CONSULTATION', 100),

(NULL, 'CLIENT_MANAGEMENT', '내담자 관리 섹션', 'DASHBOARD_SECTION', 
 'consultation/sections/ClientSection', 
 '{"title": "내담자 관리", "icon": "bi-person-check"}', 
 'CONSULTATION', 110),

-- 학원 전용
(NULL, 'ACADEMY_CLASS_MANAGEMENT', '수업 관리 섹션', 'DASHBOARD_SECTION', 
 'academy/sections/ClassSection', 
 '{"title": "수업 관리", "icon": "bi-book"}', 
 'ACADEMY', 200),

(NULL, 'ACADEMY_STUDENT_MANAGEMENT', '학생 관리 섹션', 'DASHBOARD_SECTION', 
 'academy/sections/StudentSection', 
 '{"title": "학생 관리", "icon": "bi-mortarboard"}', 
 'ACADEMY', 210);
```

---

## 💻 프론트엔드 구현

### 1. 컴포넌트 레지스트리 (자동 import)

```javascript
// constants/componentRegistry.js

// 동적 import를 위한 컴포넌트 맵
const COMPONENT_MAP = {
    // 공통 섹션
    'dashboard/sections/StatisticsSection': () => import('../components/dashboard/sections/StatisticsSection'),
    'dashboard/sections/ManagementSection': () => import('../components/dashboard/sections/ManagementSection'),
    'dashboard/sections/ERPSection': () => import('../components/dashboard/sections/ERPSection'),
    'dashboard/sections/SystemSection': () => import('../components/dashboard/sections/SystemSection'),
    
    // 상담소 섹션
    'consultation/sections/ConsultationSection': () => import('../components/consultation/sections/ConsultationSection'),
    'consultation/sections/ClientSection': () => import('../components/consultation/sections/ClientSection'),
    'consultation/sections/ConsultantSection': () => import('../components/consultation/sections/ConsultantSection'),
    
    // 학원 섹션
    'academy/sections/ClassSection': () => import('../components/academy/sections/ClassSection'),
    'academy/sections/StudentSection': () => import('../components/academy/sections/StudentSection'),
    'academy/sections/TeacherSection': () => import('../components/academy/sections/TeacherSection'),
    'academy/sections/ExamSection': () => import('../components/academy/sections/ExamSection'),
    
    // 위젯
    'dashboard/widgets/StatOverview': () => import('../components/dashboard/widgets/StatOverview'),
    'dashboard/widgets/StatUsers': () => import('../components/dashboard/widgets/StatUsers'),
    'dashboard/widgets/StatRevenue': () => import('../components/dashboard/widgets/StatRevenue'),
    
    // 추가 컴포넌트는 여기에만 등록하면 됨!
};

/**
 * 컴포넌트 경로로 컴포넌트 동적 로드
 */
export const loadComponent = async (componentPath) => {
    const loader = COMPONENT_MAP[componentPath];
    if (!loader) {
        console.warn(`Component not found: ${componentPath}`);
        return null;
    }
    
    try {
        const module = await loader();
        return module.default;
    } catch (error) {
        console.error(`Failed to load component: ${componentPath}`, error);
        return null;
    }
};

/**
 * 여러 컴포넌트 일괄 로드
 */
export const loadComponents = async (componentPaths) => {
    const promises = componentPaths.map(path => loadComponent(path));
    return Promise.all(promises);
};
```

### 2. 향상된 usePermissionGroups Hook

```javascript
// hooks/usePermissionGroups.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { loadComponent } from '../constants/componentRegistry';

export const usePermissionGroups = () => {
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [groupDetails, setGroupDetails] = useState([]); // 그룹 상세 정보
    const [components, setComponents] = useState({}); // 로드된 컴포넌트
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermissionGroups = async () => {
            try {
                // 1. 권한 그룹 조회 (상세 정보 포함)
                const response = await axios.get('/api/v1/permissions/groups/my/details');
                const groups = response.data;
                
                setGroupDetails(groups);
                setPermissionGroups(groups.map(g => g.groupCode));
                
                // 2. 컴포넌트 동적 로드
                const componentMap = {};
                for (const group of groups) {
                    if (group.componentPath) {
                        const Component = await loadComponent(group.componentPath);
                        if (Component) {
                            componentMap[group.groupCode] = Component;
                        }
                    }
                }
                setComponents(componentMap);
                
            } catch (error) {
                console.error('Failed to fetch permission groups:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissionGroups();
    }, []);

    const hasPermissionGroup = (groupCode) => {
        return permissionGroups.includes(groupCode);
    };

    const getGroupComponent = (groupCode) => {
        return components[groupCode];
    };

    const getGroupDetails = (groupCode) => {
        return groupDetails.find(g => g.groupCode === groupCode);
    };

    return { 
        permissionGroups, 
        groupDetails,
        components,
        hasPermissionGroup, 
        getGroupComponent,
        getGroupDetails,
        loading 
    };
};
```

### 3. 자동 렌더링 대시보드

```javascript
// components/dashboard/UnifiedDashboard.js
import React, { Suspense } from 'react';
import { usePermissionGroups } from '../../hooks/usePermissionGroups';
import { useTenant } from '../../hooks/useTenant';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';

const UnifiedDashboard = () => {
    const { groupDetails, components, loading: permLoading } = usePermissionGroups();
    const { tenant, loading: tenantLoading } = useTenant();
    
    if (permLoading || tenantLoading) {
        return <LoadingSpinner />;
    }

    // 섹션만 필터링 (위젯은 섹션 내부에서 렌더링)
    const sections = groupDetails.filter(g => g.groupType === 'DASHBOARD_SECTION');
    
    // 정렬
    const sortedSections = sections.sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="unified-dashboard">
            <div className="dashboard-header">
                <h1>{tenant?.name} 대시보드</h1>
                <p className="business-type">{tenant?.businessType}</p>
            </div>

            <div className="dashboard-content">
                {sortedSections.map(section => {
                    const Component = components[section.groupCode];
                    
                    if (!Component) {
                        console.warn(`Component not loaded: ${section.groupCode}`);
                        return null;
                    }

                    // component_props에서 props 파싱
                    const props = section.componentProps || {};

                    return (
                        <ErrorBoundary key={section.groupCode}>
                            <Suspense fallback={<LoadingSpinner />}>
                                <div className="dashboard-section" data-section={section.groupCode}>
                                    <Component {...props} />
                                </div>
                            </Suspense>
                        </ErrorBoundary>
                    );
                })}
            </div>
        </div>
    );
};

export default UnifiedDashboard;
```

### 4. 섹션 내부 위젯 자동 렌더링

```javascript
// components/dashboard/sections/StatisticsSection.js
import React from 'react';
import { usePermissionGroups } from '../../../hooks/usePermissionGroups';

const StatisticsSection = ({ title = '통계', icon = 'bi-graph-up' }) => {
    const { groupDetails, components } = usePermissionGroups();
    
    // 이 섹션의 하위 위젯만 필터링
    const widgets = groupDetails.filter(g => 
        g.groupType === 'DASHBOARD_WIDGET' && 
        g.parentGroupCode === 'DASHBOARD_STATISTICS'
    );
    
    const sortedWidgets = widgets.sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="statistics-section">
            <div className="section-header">
                <i className={icon}></i>
                <h2>{title}</h2>
            </div>
            
            <div className="section-content">
                <div className="widget-grid">
                    {sortedWidgets.map(widget => {
                        const WidgetComponent = components[widget.groupCode];
                        
                        if (!WidgetComponent) return null;
                        
                        const props = widget.componentProps || {};
                        
                        return (
                            <div key={widget.groupCode} className="widget-container">
                                <WidgetComponent {...props} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StatisticsSection;
```

---

## 🔄 백엔드 API 확장

### PermissionGroupController.java

```java
@RestController
@RequestMapping("/api/v1/permissions/groups")
public class PermissionGroupController {
    
    /**
     * 사용자의 권한 그룹 상세 정보 조회 (컴포넌트 정보 포함)
     */
    @GetMapping("/my/details")
    public ResponseEntity<List<PermissionGroupDetailDTO>> getMyPermissionGroupDetails() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        String tenantRoleId = SecurityUtils.getCurrentTenantRoleId();
        String businessType = SecurityUtils.getCurrentBusinessType();
        
        // 1. 권한 그룹 코드 조회
        List<String> groupCodes = permissionGroupService
            .getUserPermissionGroups(tenantId, tenantRoleId);
        
        // 2. 그룹 상세 정보 조회 (컴포넌트 경로 포함)
        List<PermissionGroupDetailDTO> details = permissionGroupService
            .getGroupDetails(groupCodes, businessType);
        
        return ResponseEntity.ok(details);
    }
}
```

### PermissionGroupDetailDTO.java

```java
@Data
@Builder
public class PermissionGroupDetailDTO {
    private String groupCode;
    private String groupName;
    private String groupType; // DASHBOARD_SECTION, DASHBOARD_WIDGET
    private String businessType;
    private String parentGroupCode;
    
    // 컴포넌트 정보
    private String componentPath;
    private Map<String, Object> componentProps;
    
    // 메타데이터
    private Integer sortOrder;
    private String icon;
    private String colorCode;
}
```

---

## 🎯 사용 시나리오

### 시나리오 1: 새 섹션 추가

```sql
-- 1. DB에만 추가
INSERT INTO permission_groups (
    tenant_id, group_code, group_name, group_type, 
    component_path, component_props, 
    business_type, sort_order
) VALUES
(NULL, 'DASHBOARD_REPORTS', '보고서 섹션', 'DASHBOARD_SECTION', 
 'dashboard/sections/ReportsSection', 
 '{"title": "보고서", "icon": "bi-file-earmark-text"}', 
 NULL, 5);

-- 2. 역할에 권한 부여
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT tenant_id, tenant_role_id, 'DASHBOARD_REPORTS', 'FULL'
FROM tenant_roles
WHERE name_en = 'Director';
```

```javascript
// 3. 컴포넌트 레지스트리에만 등록
// constants/componentRegistry.js
const COMPONENT_MAP = {
    // ... 기존 컴포넌트들
    'dashboard/sections/ReportsSection': () => import('../components/dashboard/sections/ReportsSection'),
};
```

```javascript
// 4. 컴포넌트 생성
// components/dashboard/sections/ReportsSection.js
const ReportsSection = ({ title, icon }) => {
    return (
        <div className="reports-section">
            <h2><i className={icon}></i> {title}</h2>
            <div>보고서 내용...</div>
        </div>
    );
};

export default ReportsSection;
```

**결과**: 자동으로 대시보드에 표시됨! 코드 수정 불필요!

### 시나리오 2: 학원 전용 출결 관리 추가

```sql
-- 1. DB에 추가
INSERT INTO permission_groups VALUES
(NULL, 'ACADEMY_ATTENDANCE', '출결 관리 섹션', 'DASHBOARD_SECTION', 
 'academy/sections/AttendanceSection', 
 '{"title": "출결 관리", "icon": "bi-calendar-check"}', 
 'ACADEMY', 250);

-- 2. 학원 원장/강사에게 권한 부여
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT tr.tenant_id, tr.tenant_role_id, 'ACADEMY_ATTENDANCE', 'FULL'
FROM tenant_roles tr
INNER JOIN tenants t ON tr.tenant_id = t.tenant_id
WHERE t.business_type = 'ACADEMY' 
  AND tr.name_en IN ('Director', 'Teacher');
```

```javascript
// 2. 레지스트리에 등록
const COMPONENT_MAP = {
    // ... 기존 컴포넌트들
    'academy/sections/AttendanceSection': () => import('../components/academy/sections/AttendanceSection'),
};
```

**결과**: 
- ✅ 학원 테넌트에만 표시
- ✅ 상담소 테넌트에는 숨김
- ✅ 원장/강사만 접근 가능
- ✅ 코드 수정 불필요!

---

## ✅ 장점 요약

### 1. 완전 자동화
```
SQL 추가 → 컴포넌트 등록 → 자동 렌더링
(UnifiedDashboard.js 수정 불필요!)
```

### 2. 확장성 극대화
```
새 섹션 추가: 3단계 (SQL + 레지스트리 + 컴포넌트)
새 위젯 추가: 3단계 (SQL + 레지스트리 + 컴포넌트)
새 업종 추가: 3단계 (SQL + 레지스트리 + 컴포넌트)
```

### 3. 유지보수성
```
컴포넌트 위치: 한 곳에만 등록 (componentRegistry.js)
권한 관리: DB에서만 관리
렌더링 로직: 자동 처리
```

### 4. 성능 최적화
```
동적 import: 필요한 컴포넌트만 로드
Lazy loading: 초기 로딩 속도 향상
Code splitting: 번들 크기 감소
```

---

## 📋 마이그레이션 단계

### 1. DB 스키마 업데이트
```sql
ALTER TABLE permission_groups 
ADD COLUMN component_path VARCHAR(200) NULL,
ADD COLUMN component_props JSON NULL;
```

### 2. 기존 그룹에 컴포넌트 경로 업데이트
```sql
UPDATE permission_groups SET 
    component_path = 'dashboard/sections/StatisticsSection',
    component_props = '{"title": "통계", "icon": "bi-graph-up"}'
WHERE group_code = 'DASHBOARD_STATISTICS';

UPDATE permission_groups SET 
    component_path = 'dashboard/sections/ManagementSection',
    component_props = '{"title": "관리", "icon": "bi-people"}'
WHERE group_code = 'DASHBOARD_MANAGEMENT';

-- ... 나머지 그룹들도 동일하게
```

### 3. 컴포넌트 레지스트리 생성
```javascript
// constants/componentRegistry.js 파일 생성
```

### 4. UnifiedDashboard 업데이트
```javascript
// 자동 렌더링 로직으로 교체
```

---

**작성 완료**: 2025-12-03  
**핵심**: 그룹 코드 + 컴포넌트 경로만 추가하면 자동 렌더링!

