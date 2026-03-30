# 그룹 기반 권한 시스템 설계

**작성일**: 2025-12-03  
**목적**: 대시보드 섹션별 그룹 권한 관리 시스템 설계

---

## 🎯 1. 핵심 아이디어

### 문제 상황
```
관리자 대시보드 = 사무원 대시보드 (동일 화면)
BUT
- 사무원: ERP 섹션 숨김 ❌
- 관리자: ERP 섹션 표시 ✅
```

### 해결 방안
**그룹 코드 기반 권한 체크**
```javascript
// ❌ 기존 방식 (하드코딩)
{role === 'ADMIN' && <ERPSection />}

// ✅ 새로운 방식 (그룹 코드)
{hasPermissionGroup('ERP_MANAGEMENT') && <ERPSection />}
```

---

## 📊 2. 데이터베이스 설계

### 2.1 permission_groups 테이블 (신규)

```sql
CREATE TABLE permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NULL COMMENT '테넌트 ID (NULL = 시스템 그룹)',
    
    -- 그룹 정보
    group_code VARCHAR(50) NOT NULL COMMENT '그룹 코드 (예: ERP_MANAGEMENT)',
    group_name VARCHAR(100) NOT NULL COMMENT '그룹명 (예: ERP 관리)',
    group_name_en VARCHAR(100) COMMENT '영문 그룹명',
    description TEXT COMMENT '그룹 설명',
    
    -- 그룹 타입
    group_type VARCHAR(20) NOT NULL COMMENT 'DASHBOARD_SECTION, MENU, FEATURE',
    parent_group_code VARCHAR(50) COMMENT '상위 그룹 코드',
    
    -- 메타데이터
    sort_order INT DEFAULT 0,
    icon VARCHAR(50) COMMENT '아이콘',
    color_code VARCHAR(7) COMMENT '색상 코드',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tenant_group_code (tenant_id, group_code),
    INDEX idx_group_type (group_type),
    INDEX idx_parent_group (parent_group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 role_permission_groups 테이블 (신규)

```sql
CREATE TABLE role_permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '테넌트 역할 ID',
    
    -- 그룹 권한
    permission_group_code VARCHAR(50) NOT NULL COMMENT '권한 그룹 코드',
    
    -- 권한 레벨
    access_level VARCHAR(20) DEFAULT 'READ' COMMENT 'READ, WRITE, FULL',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_role_group (tenant_id, tenant_role_id, permission_group_code),
    INDEX idx_tenant_role (tenant_id, tenant_role_id),
    INDEX idx_group_code (permission_group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🏗️ 3. 그룹 구조 설계

### 3.1 대시보드 섹션 그룹

```
ADMIN_DASHBOARD (관리자 대시보드)
├─ DASHBOARD_STATISTICS (통계 섹션)
│  ├─ STAT_USERS (사용자 통계)
│  ├─ STAT_CONSULTATIONS (상담 통계)
│  └─ STAT_REVENUE (매출 통계)
│
├─ DASHBOARD_MANAGEMENT (관리 섹션)
│  ├─ MGMT_USERS (사용자 관리)
│  ├─ MGMT_SCHEDULES (일정 관리)
│  └─ MGMT_CONSULTANTS (상담사 관리)
│
├─ DASHBOARD_ERP (ERP 섹션) ⭐ 핵심!
│  ├─ ERP_PURCHASE (구매 관리)
│  ├─ ERP_FINANCIAL (재무 관리)
│  ├─ ERP_BUDGET (예산 관리)
│  └─ ERP_INVENTORY (재고 관리)
│
└─ DASHBOARD_SYSTEM (시스템 섹션)
   ├─ SYS_SETTINGS (설정)
   ├─ SYS_CODES (공통코드)
   └─ SYS_LOGS (로그)
```

### 3.2 역할별 그룹 권한 매핑

| 그룹 코드 | 관리자 | 사무원 | 상담사 | 내담자 |
|----------|--------|--------|--------|--------|
| DASHBOARD_STATISTICS | ✅ FULL | ✅ READ | ✅ READ | ❌ |
| DASHBOARD_MANAGEMENT | ✅ FULL | ✅ WRITE | ✅ READ | ❌ |
| DASHBOARD_ERP | ✅ FULL | ❌ NONE | ❌ NONE | ❌ |
| DASHBOARD_SYSTEM | ✅ FULL | ✅ READ | ❌ NONE | ❌ |

---

## 💻 4. 구현 방안

### 4.1 백엔드 API

#### PermissionGroupService.java
```java
@Service
public class PermissionGroupService {
    
    /**
     * 사용자의 그룹 권한 조회
     */
    public List<String> getUserPermissionGroups(String tenantId, String tenantRoleId) {
        return rolePermissionGroupRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, tenantRoleId)
            .stream()
            .map(RolePermissionGroup::getPermissionGroupCode)
            .collect(Collectors.toList());
    }
    
    /**
     * 특정 그룹 권한 체크
     */
    public boolean hasPermissionGroup(String tenantId, String tenantRoleId, String groupCode) {
        return rolePermissionGroupRepository
            .existsByTenantIdAndTenantRoleIdAndPermissionGroupCodeAndIsActiveTrue(
                tenantId, tenantRoleId, groupCode
            );
    }
    
    /**
     * 그룹 권한 레벨 조회
     */
    public String getPermissionGroupLevel(String tenantId, String tenantRoleId, String groupCode) {
        return rolePermissionGroupRepository
            .findByTenantIdAndTenantRoleIdAndPermissionGroupCodeAndIsActiveTrue(
                tenantId, tenantRoleId, groupCode
            )
            .map(RolePermissionGroup::getAccessLevel)
            .orElse("NONE");
    }
}
```

#### PermissionGroupController.java
```java
@RestController
@RequestMapping("/api/v1/permissions/groups")
public class PermissionGroupController {
    
    @GetMapping("/my")
    public ResponseEntity<List<String>> getMyPermissionGroups() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        String tenantRoleId = SecurityUtils.getCurrentTenantRoleId();
        
        List<String> groups = permissionGroupService
            .getUserPermissionGroups(tenantId, tenantRoleId);
        
        return ResponseEntity.ok(groups);
    }
    
    @GetMapping("/check/{groupCode}")
    public ResponseEntity<Boolean> checkPermissionGroup(@PathVariable String groupCode) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        String tenantRoleId = SecurityUtils.getCurrentTenantRoleId();
        
        boolean hasPermission = permissionGroupService
            .hasPermissionGroup(tenantId, tenantRoleId, groupCode);
        
        return ResponseEntity.ok(hasPermission);
    }
}
```

### 4.2 프론트엔드 구현

#### usePermissionGroups Hook
```javascript
// hooks/usePermissionGroups.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export const usePermissionGroups = () => {
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermissionGroups = async () => {
            try {
                const response = await axios.get('/api/v1/permissions/groups/my');
                setPermissionGroups(response.data);
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

    return { permissionGroups, hasPermissionGroup, loading };
};
```

#### AdminDashboard.js 적용
```javascript
import React from 'react';
import { usePermissionGroups } from '../../hooks/usePermissionGroups';

const AdminDashboard = () => {
    const { hasPermissionGroup, loading } = usePermissionGroups();

    if (loading) return <LoadingSpinner />;

    return (
        <div className="admin-dashboard">
            {/* 통계 섹션 - 모두 접근 가능 */}
            {hasPermissionGroup('DASHBOARD_STATISTICS') && (
                <StatisticsSection />
            )}

            {/* 관리 섹션 - 모두 접근 가능 */}
            {hasPermissionGroup('DASHBOARD_MANAGEMENT') && (
                <ManagementSection />
            )}

            {/* ERP 섹션 - 관리자만 접근 ⭐ */}
            {hasPermissionGroup('DASHBOARD_ERP') && (
                <ERPSection />
            )}

            {/* 시스템 섹션 - 관리자만 접근 */}
            {hasPermissionGroup('DASHBOARD_SYSTEM') && (
                <SystemSection />
            )}
        </div>
    );
};
```

#### PermissionGroupGuard 컴포넌트
```javascript
// components/common/PermissionGroupGuard.js
import React from 'react';
import { usePermissionGroups } from '../../hooks/usePermissionGroups';

export const PermissionGroupGuard = ({ groupCode, fallback = null, children }) => {
    const { hasPermissionGroup, loading } = usePermissionGroups();

    if (loading) return null;
    if (!hasPermissionGroup(groupCode)) return fallback;

    return <>{children}</>;
};

// 사용 예시
<PermissionGroupGuard groupCode="DASHBOARD_ERP">
    <ERPSection />
</PermissionGroupGuard>
```

---

## 🔄 5. 대시보드 자동 생성 로직

### 5.1 대시보드 템플릿 정의

```javascript
// constants/dashboardTemplates.js
export const DASHBOARD_TEMPLATES = {
    ADMIN: {
        name: '관리자 대시보드',
        sections: [
            { 
                code: 'DASHBOARD_STATISTICS', 
                component: 'StatisticsSection',
                order: 1 
            },
            { 
                code: 'DASHBOARD_MANAGEMENT', 
                component: 'ManagementSection',
                order: 2 
            },
            { 
                code: 'DASHBOARD_ERP', 
                component: 'ERPSection',
                order: 3 
            },
            { 
                code: 'DASHBOARD_SYSTEM', 
                component: 'SystemSection',
                order: 4 
            }
        ]
    },
    STAFF: {
        name: '사무원 대시보드',
        sections: [
            { 
                code: 'DASHBOARD_STATISTICS', 
                component: 'StatisticsSection',
                order: 1 
            },
            { 
                code: 'DASHBOARD_MANAGEMENT', 
                component: 'ManagementSection',
                order: 2 
            }
            // ERP 섹션 없음!
        ]
    }
};
```

### 5.2 동적 대시보드 렌더링

```javascript
// components/dashboard/DynamicDashboard.js
import React from 'react';
import { usePermissionGroups } from '../../hooks/usePermissionGroups';
import { DASHBOARD_TEMPLATES } from '../../constants/dashboardTemplates';
import { SECTION_COMPONENTS } from '../../constants/sectionComponents';

const DynamicDashboard = ({ templateKey }) => {
    const { hasPermissionGroup, loading } = usePermissionGroups();
    const template = DASHBOARD_TEMPLATES[templateKey];

    if (loading) return <LoadingSpinner />;
    if (!template) return <div>대시보드를 찾을 수 없습니다.</div>;

    // 권한이 있는 섹션만 필터링
    const visibleSections = template.sections
        .filter(section => hasPermissionGroup(section.code))
        .sort((a, b) => a.order - b.order);

    return (
        <div className="dynamic-dashboard">
            <h1>{template.name}</h1>
            {visibleSections.map(section => {
                const SectionComponent = SECTION_COMPONENTS[section.component];
                return (
                    <div key={section.code} className="dashboard-section">
                        <SectionComponent />
                    </div>
                );
            })}
        </div>
    );
};

// 사용 예시
// 관리자: <DynamicDashboard templateKey="ADMIN" />
// 사무원: <DynamicDashboard templateKey="STAFF" />
```

---

## 📋 6. 마이그레이션 계획

### 6.1 Phase 1: 테이블 생성 및 기본 데이터

```sql
-- 1. permission_groups 테이블 생성
CREATE TABLE permission_groups (...);

-- 2. role_permission_groups 테이블 생성
CREATE TABLE role_permission_groups (...);

-- 3. 기본 그룹 데이터 삽입
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_type, sort_order) VALUES
(NULL, 'DASHBOARD_STATISTICS', '통계 섹션', 'DASHBOARD_SECTION', 1),
(NULL, 'DASHBOARD_MANAGEMENT', '관리 섹션', 'DASHBOARD_SECTION', 2),
(NULL, 'DASHBOARD_ERP', 'ERP 섹션', 'DASHBOARD_SECTION', 3),
(NULL, 'DASHBOARD_SYSTEM', '시스템 섹션', 'DASHBOARD_SECTION', 4);

-- 4. 역할별 그룹 권한 매핑
-- 관리자: 모든 그룹 접근
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'Director' AND pg.tenant_id IS NULL;

-- 사무원: ERP 제외
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'WRITE'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'Staff' 
  AND pg.tenant_id IS NULL
  AND pg.group_code != 'DASHBOARD_ERP';
```

### 6.2 Phase 2: 백엔드 구현

1. Entity 생성 (PermissionGroup, RolePermissionGroup)
2. Repository 생성
3. Service 구현
4. Controller 구현
5. 단위 테스트

### 6.3 Phase 3: 프론트엔드 구현

1. Hook 생성 (usePermissionGroups)
2. Guard 컴포넌트 생성
3. 기존 대시보드에 적용
4. 통합 테스트

---

## ✅ 7. 장점

### 7.1 확장성
```javascript
// 새로운 섹션 추가 시
// 1. permission_groups에 데이터만 추가
INSERT INTO permission_groups VALUES (..., 'DASHBOARD_REPORTS', '보고서 섹션', ...);

// 2. 역할별 권한 매핑
INSERT INTO role_permission_groups VALUES (..., 'ADMIN', 'DASHBOARD_REPORTS', 'FULL');

// 3. 프론트엔드에서 자동 적용
{hasPermissionGroup('DASHBOARD_REPORTS') && <ReportsSection />}
```

### 7.2 유지보수성
- ✅ 권한 로직 중앙화
- ✅ 하드코딩 제거
- ✅ 역할 추가 시 코드 수정 불필요

### 7.3 유연성
- ✅ 테넌트별 커스터마이징 가능
- ✅ 그룹 단위 권한 관리
- ✅ 계층 구조 지원

---

## 🎯 8. 다음 단계

### 즉시 실행 가능
1. ✅ 테이블 생성 SQL 작성
2. ✅ 기본 데이터 삽입 SQL 작성
3. ⏳ 백엔드 Entity/Repository 생성
4. ⏳ 프론트엔드 Hook 구현

### 사용자 승인 필요
- [ ] 그룹 구조 승인
- [ ] 역할별 권한 매핑 승인
- [ ] 마이그레이션 일정 확정

---

**작성 완료**: 2025-12-03  
**다음 작업**: 사용자 승인 대기 → 테이블 생성 SQL 실행

