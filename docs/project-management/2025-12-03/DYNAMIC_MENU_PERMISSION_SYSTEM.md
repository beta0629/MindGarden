# 동적 메뉴 권한 부여 시스템

**작성일**: 2025-12-03  
**목적**: 관리자가 역할별로 메뉴 접근 권한을 동적으로 설정

---

## 🎯 요구사항

### 문제점
```
현재: 메뉴가 역할별로 고정됨
- ADMIN: 모든 메뉴
- STAFF: 일부 메뉴 (고정)
- CONSULTANT: 상담 메뉴 (고정)
- CLIENT: 기본 메뉴 (고정)

문제:
- 유연성 부족
- 테넌트별 다른 정책 적용 불가
- 사무원(STAFF)에게 특정 메뉴만 허용하고 싶을 때 코드 수정 필요
```

### 해결 방안
```
동적 권한 부여:
- 관리자가 역할별로 메뉴 접근 권한 설정
- 테넌트별로 다른 정책 적용 가능
- 코드 수정 없이 UI에서 설정

예시:
- A 상담소: STAFF에게 "공통코드 관리" 허용
- B 상담소: STAFF에게 "공통코드 관리" 불허
```

---

## 📊 데이터베이스 설계

### 1. menus 테이블 (확장)

```sql
CREATE TABLE menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 메뉴 정보
    menu_code VARCHAR(50) NOT NULL UNIQUE COMMENT '메뉴 코드',
    menu_name VARCHAR(100) NOT NULL COMMENT '메뉴명',
    menu_path VARCHAR(200) COMMENT '경로',
    
    -- 계층 구조
    parent_menu_id BIGINT COMMENT '부모 메뉴 ID',
    depth INT DEFAULT 0 COMMENT '깊이',
    
    -- 기본 권한 (최소 요구 역할)
    min_required_role VARCHAR(50) NOT NULL COMMENT '최소 요구 역할 (ADMIN, STAFF, CONSULTANT, CLIENT)',
    
    -- 메뉴 위치
    menu_location VARCHAR(20) NOT NULL COMMENT 'DASHBOARD, ADMIN_ONLY, BOTH',
    
    -- 메타데이터
    icon VARCHAR(50),
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_parent (parent_menu_id),
    INDEX idx_min_role (min_required_role),
    INDEX idx_location (menu_location),
    
    FOREIGN KEY (parent_menu_id) REFERENCES menus(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. role_menu_permissions 테이블 (역할별 메뉴 권한)

```sql
CREATE TABLE role_menu_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 역할-메뉴 매핑
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '역할 ID',
    menu_id BIGINT NOT NULL COMMENT '메뉴 ID',
    
    -- 권한 설정
    can_view BOOLEAN DEFAULT true COMMENT '조회 권한',
    can_create BOOLEAN DEFAULT false COMMENT '생성 권한',
    can_update BOOLEAN DEFAULT false COMMENT '수정 권한',
    can_delete BOOLEAN DEFAULT false COMMENT '삭제 권한',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    
    -- 감사
    assigned_by VARCHAR(100) COMMENT '부여자',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tenant_role_menu (tenant_id, tenant_role_id, menu_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_role (tenant_role_id),
    INDEX idx_menu (menu_id),
    
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. 메뉴 데이터 삽입

```sql
-- ========================================
-- 일반 대시보드 메뉴
-- ========================================
INSERT INTO menus (menu_code, menu_name, menu_path, min_required_role, menu_location, icon, sort_order) VALUES
('DASHBOARD', '대시보드', '/dashboard', 'CLIENT', 'DASHBOARD', 'bi-speedometer2', 1),
('STATISTICS', '통계', '/dashboard/statistics', 'CLIENT', 'DASHBOARD', 'bi-graph-up', 2),
('MANAGEMENT', '관리', '/dashboard/management', 'STAFF', 'DASHBOARD', 'bi-folder', 3),
('ERP', 'ERP', '/dashboard/erp', 'ADMIN', 'DASHBOARD', 'bi-building', 4);

-- ========================================
-- 관리자 전용 메뉴 (기본은 ADMIN만)
-- ========================================
INSERT INTO menus (menu_code, menu_name, menu_path, min_required_role, menu_location, icon, sort_order) VALUES
('ADMIN_ROOT', '시스템 관리', '/admin', 'ADMIN', 'ADMIN_ONLY', 'bi-gear', 100);

-- 공통코드 관리 (STAFF에게 위임 가능)
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, min_required_role, menu_location, icon, sort_order) VALUES
('COMMON_CODE_MGMT', '공통코드 관리', '/admin/common-codes', 
 (SELECT id FROM menus WHERE menu_code = 'ADMIN_ROOT'), 
 'STAFF', 'ADMIN_ONLY', 'bi-list-ul', 1);

-- 사용자 관리 (ADMIN만)
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, min_required_role, menu_location, icon, sort_order) VALUES
('USER_MGMT', '사용자 관리', '/admin/users', 
 (SELECT id FROM menus WHERE menu_code = 'ADMIN_ROOT'), 
 'ADMIN', 'ADMIN_ONLY', 'bi-people', 2);

-- 역할 관리 (ADMIN만)
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, min_required_role, menu_location, icon, sort_order) VALUES
('ROLE_MGMT', '역할 관리', '/admin/roles', 
 (SELECT id FROM menus WHERE menu_code = 'ADMIN_ROOT'), 
 'ADMIN', 'ADMIN_ONLY', 'bi-shield', 3);

-- ⭐ 메뉴 권한 설정 (ADMIN만)
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, min_required_role, menu_location, icon, sort_order) VALUES
('MENU_PERMISSION_MGMT', '메뉴 권한 설정', '/admin/menu-permissions', 
 (SELECT id FROM menus WHERE menu_code = 'ADMIN_ROOT'), 
 'ADMIN', 'ADMIN_ONLY', 'bi-key', 4);

-- 조직 관리 (STAFF에게 위임 가능)
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, min_required_role, menu_location, icon, sort_order) VALUES
('ORG_MGMT', '조직 관리', '/admin/organization', 
 (SELECT id FROM menus WHERE menu_code = 'ADMIN_ROOT'), 
 'STAFF', 'ADMIN_ONLY', 'bi-building', 5);
```

---

## 💻 백엔드 구현

### 1. MenuPermissionService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MenuPermissionService {
    
    private final MenuRepository menuRepository;
    private final RoleMenuPermissionRepository roleMenuPermissionRepository;
    private final TenantRoleRepository tenantRoleRepository;
    
    /**
     * 사용자의 접근 가능한 메뉴 조회 (권한 기반)
     */
    public List<MenuDTO> getUserAccessibleMenus(String userId) {
        // 1. 사용자 정보 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다"));
        
        String tenantId = user.getTenantId();
        String roleId = user.getTenantRoleId();
        
        // 2. 모든 활성 메뉴 조회
        List<Menu> allMenus = menuRepository.findByIsActiveTrueOrderBySortOrder();
        
        // 3. 역할별 권한 조회
        List<RoleMenuPermission> permissions = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, roleId);
        
        Map<Long, RoleMenuPermission> permissionMap = permissions.stream()
            .collect(Collectors.toMap(
                RoleMenuPermission::getMenuId, 
                p -> p
            ));
        
        // 4. 접근 가능한 메뉴 필터링
        List<Menu> accessibleMenus = allMenus.stream()
            .filter(menu -> canAccessMenu(user, menu, permissionMap))
            .collect(Collectors.toList());
        
        // 5. 계층 구조로 변환
        return buildMenuTree(accessibleMenus, permissionMap);
    }
    
    /**
     * 메뉴 접근 가능 여부 확인
     */
    private boolean canAccessMenu(User user, Menu menu, 
                                   Map<Long, RoleMenuPermission> permissionMap) {
        // 1. 명시적 권한이 있는 경우
        RoleMenuPermission permission = permissionMap.get(menu.getId());
        if (permission != null) {
            return permission.getCanView();
        }
        
        // 2. 명시적 권한이 없는 경우 - 최소 요구 역할 확인
        return checkMinRequiredRole(user.getRole(), menu.getMinRequiredRole());
    }
    
    /**
     * 최소 요구 역할 확인
     */
    private boolean checkMinRequiredRole(String userRole, String minRequiredRole) {
        // 역할 계층: ADMIN > STAFF > CONSULTANT > CLIENT
        Map<String, Integer> roleHierarchy = Map.of(
            "ADMIN", 4,
            "STAFF", 3,
            "CONSULTANT", 2,
            "CLIENT", 1
        );
        
        int userLevel = roleHierarchy.getOrDefault(userRole, 0);
        int requiredLevel = roleHierarchy.getOrDefault(minRequiredRole, 0);
        
        return userLevel >= requiredLevel;
    }
    
    /**
     * 역할별 메뉴 권한 목록 조회 (관리자용)
     */
    public List<MenuPermissionDTO> getRoleMenuPermissions(String tenantId, String roleId) {
        // 1. 모든 메뉴 조회
        List<Menu> allMenus = menuRepository.findByIsActiveTrueOrderBySortOrder();
        
        // 2. 역할의 현재 권한 조회
        List<RoleMenuPermission> permissions = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, roleId);
        
        Map<Long, RoleMenuPermission> permissionMap = permissions.stream()
            .collect(Collectors.toMap(
                RoleMenuPermission::getMenuId, 
                p -> p
            ));
        
        // 3. DTO 변환
        return allMenus.stream()
            .map(menu -> {
                RoleMenuPermission permission = permissionMap.get(menu.getId());
                
                return MenuPermissionDTO.builder()
                    .menuId(menu.getId())
                    .menuCode(menu.getMenuCode())
                    .menuName(menu.getMenuName())
                    .menuPath(menu.getMenuPath())
                    .minRequiredRole(menu.getMinRequiredRole())
                    .menuLocation(menu.getMenuLocation())
                    .hasPermission(permission != null)
                    .canView(permission != null ? permission.getCanView() : false)
                    .canCreate(permission != null ? permission.getCanCreate() : false)
                    .canUpdate(permission != null ? permission.getCanUpdate() : false)
                    .canDelete(permission != null ? permission.getCanDelete() : false)
                    .build();
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 역할에 메뉴 권한 부여
     */
    @Transactional
    public void grantMenuPermission(String tenantId, String roleId, 
                                    MenuPermissionGrantRequest request) {
        // 1. 메뉴 조회
        Menu menu = menuRepository.findById(request.getMenuId())
            .orElseThrow(() -> new NotFoundException("메뉴를 찾을 수 없습니다"));
        
        // 2. 역할 조회
        TenantRole role = tenantRoleRepository.findById(roleId)
            .orElseThrow(() -> new NotFoundException("역할을 찾을 수 없습니다"));
        
        // 3. 권한 확인 (최소 요구 역할보다 낮은 역할에게는 부여 불가)
        if (!checkMinRequiredRole(role.getNameEn(), menu.getMinRequiredRole())) {
            throw new BusinessException(
                String.format("이 메뉴는 최소 %s 역할이 필요합니다", menu.getMinRequiredRole())
            );
        }
        
        // 4. 기존 권한 확인
        Optional<RoleMenuPermission> existing = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndMenuId(tenantId, roleId, request.getMenuId());
        
        if (existing.isPresent()) {
            // 수정
            RoleMenuPermission permission = existing.get();
            permission.setCanView(request.getCanView());
            permission.setCanCreate(request.getCanCreate());
            permission.setCanUpdate(request.getCanUpdate());
            permission.setCanDelete(request.getCanDelete());
            permission.setIsActive(true);
            
            roleMenuPermissionRepository.save(permission);
        } else {
            // 신규 생성
            RoleMenuPermission permission = RoleMenuPermission.builder()
                .tenantId(tenantId)
                .tenantRoleId(roleId)
                .menuId(request.getMenuId())
                .canView(request.getCanView())
                .canCreate(request.getCanCreate())
                .canUpdate(request.getCanUpdate())
                .canDelete(request.getCanDelete())
                .isActive(true)
                .assignedBy(SecurityUtils.getCurrentUsername())
                .build();
            
            roleMenuPermissionRepository.save(permission);
        }
        
        log.info("메뉴 권한 부여: tenantId={}, roleId={}, menuId={}", 
            tenantId, roleId, request.getMenuId());
    }
    
    /**
     * 역할의 메뉴 권한 회수
     */
    @Transactional
    public void revokeMenuPermission(String tenantId, String roleId, Long menuId) {
        RoleMenuPermission permission = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndMenuId(tenantId, roleId, menuId)
            .orElseThrow(() -> new NotFoundException("권한을 찾을 수 없습니다"));
        
        permission.setIsActive(false);
        roleMenuPermissionRepository.save(permission);
        
        log.info("메뉴 권한 회수: tenantId={}, roleId={}, menuId={}", 
            tenantId, roleId, menuId);
    }
    
    /**
     * 역할의 모든 메뉴 권한 일괄 설정
     */
    @Transactional
    public void batchUpdateMenuPermissions(String tenantId, String roleId, 
                                           List<MenuPermissionGrantRequest> requests) {
        for (MenuPermissionGrantRequest request : requests) {
            try {
                grantMenuPermission(tenantId, roleId, request);
            } catch (Exception e) {
                log.error("메뉴 권한 부여 실패: menuId={}", request.getMenuId(), e);
            }
        }
    }
}
```

### 2. MenuPermissionController.java

```java
@RestController
@RequestMapping("/api/v1/admin/menu-permissions")
@RequiredArgsConstructor
public class MenuPermissionController {
    
    private final MenuPermissionService menuPermissionService;
    
    /**
     * 역할별 메뉴 권한 목록 조회
     */
    @GetMapping("/roles/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MenuPermissionDTO>> getRoleMenuPermissions(
            @PathVariable String roleId) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        List<MenuPermissionDTO> permissions = menuPermissionService
            .getRoleMenuPermissions(tenantId, roleId);
        return ResponseEntity.ok(permissions);
    }
    
    /**
     * 메뉴 권한 부여
     */
    @PostMapping("/grant")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> grantMenuPermission(
            @RequestBody @Valid MenuPermissionGrantRequest request) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        menuPermissionService.grantMenuPermission(
            tenantId, 
            request.getRoleId(), 
            request
        );
        return ResponseEntity.ok().build();
    }
    
    /**
     * 메뉴 권한 회수
     */
    @DeleteMapping("/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> revokeMenuPermission(
            @RequestParam String roleId,
            @RequestParam Long menuId) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        menuPermissionService.revokeMenuPermission(tenantId, roleId, menuId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 역할의 메뉴 권한 일괄 설정
     */
    @PostMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> batchUpdateMenuPermissions(
            @RequestParam String roleId,
            @RequestBody @Valid List<MenuPermissionGrantRequest> requests) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        menuPermissionService.batchUpdateMenuPermissions(tenantId, roleId, requests);
        return ResponseEntity.ok().build();
    }
}
```

---

## 🌐 프론트엔드 구현

### 1. MenuPermissionManagement.js

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MenuPermissionManagement.css';

const MenuPermissionManagement = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [menuPermissions, setMenuPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        if (selectedRole) {
            fetchMenuPermissions(selectedRole.tenantRoleId);
        }
    }, [selectedRole]);

    const fetchRoles = async () => {
        try {
            const response = await axios.get('/api/v1/tenant/roles');
            setRoles(response.data);
            setLoading(false);
        } catch (error) {
            console.error('역할 조회 실패:', error);
            setLoading(false);
        }
    };

    const fetchMenuPermissions = async (roleId) => {
        try {
            const response = await axios.get(`/api/v1/admin/menu-permissions/roles/${roleId}`);
            setMenuPermissions(response.data);
        } catch (error) {
            console.error('메뉴 권한 조회 실패:', error);
        }
    };

    const handlePermissionChange = async (menuId, field, value) => {
        try {
            const menu = menuPermissions.find(m => m.menuId === menuId);
            
            await axios.post('/api/v1/admin/menu-permissions/grant', {
                roleId: selectedRole.tenantRoleId,
                menuId: menuId,
                canView: field === 'canView' ? value : menu.canView,
                canCreate: field === 'canCreate' ? value : menu.canCreate,
                canUpdate: field === 'canUpdate' ? value : menu.canUpdate,
                canDelete: field === 'canDelete' ? value : menu.canDelete
            });
            
            // 목록 새로고침
            fetchMenuPermissions(selectedRole.tenantRoleId);
        } catch (error) {
            alert('권한 변경 실패: ' + error.response?.data?.message);
        }
    };

    const handleBatchSave = async () => {
        if (!confirm('변경사항을 저장하시겠습니까?')) return;
        
        try {
            const requests = menuPermissions
                .filter(m => m.hasPermission)
                .map(m => ({
                    roleId: selectedRole.tenantRoleId,
                    menuId: m.menuId,
                    canView: m.canView,
                    canCreate: m.canCreate,
                    canUpdate: m.canUpdate,
                    canDelete: m.canDelete
                }));
            
            await axios.post(
                `/api/v1/admin/menu-permissions/batch?roleId=${selectedRole.tenantRoleId}`,
                requests
            );
            
            alert('저장되었습니다');
        } catch (error) {
            alert('저장 실패: ' + error.response?.data?.message);
        }
    };

    if (loading) return <div>로딩 중...</div>;

    return (
        <div className="menu-permission-management">
            <div className="header">
                <h2>메뉴 권한 설정</h2>
                {selectedRole && (
                    <button className="btn-primary" onClick={handleBatchSave}>
                        변경사항 저장
                    </button>
                )}
            </div>

            <div className="content">
                {/* 좌측: 역할 목록 */}
                <div className="sidebar">
                    <h3>역할 선택</h3>
                    <ul className="role-list">
                        {roles.map(role => (
                            <li 
                                key={role.tenantRoleId}
                                className={selectedRole?.tenantRoleId === role.tenantRoleId ? 'active' : ''}
                                onClick={() => setSelectedRole(role)}
                            >
                                <i className="bi-person-badge"></i>
                                <span>{role.nameKo}</span>
                                <span className="role-code">({role.nameEn})</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 우측: 메뉴 권한 목록 */}
                <div className="main-content">
                    {selectedRole ? (
                        <>
                            <div className="role-header">
                                <h3>{selectedRole.nameKo} 역할의 메뉴 권한</h3>
                                <p className="description">
                                    이 역할에 부여할 메뉴 접근 권한을 설정하세요.
                                </p>
                            </div>

                            <table className="permission-table">
                                <thead>
                                    <tr>
                                        <th>메뉴명</th>
                                        <th>경로</th>
                                        <th>위치</th>
                                        <th>최소 요구 역할</th>
                                        <th>조회</th>
                                        <th>생성</th>
                                        <th>수정</th>
                                        <th>삭제</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menuPermissions.map(menu => (
                                        <tr key={menu.menuId}>
                                            <td>
                                                <strong>{menu.menuName}</strong>
                                                <br />
                                                <small>{menu.menuCode}</small>
                                            </td>
                                            <td><code>{menu.menuPath}</code></td>
                                            <td>
                                                <span className={`badge ${menu.menuLocation.toLowerCase()}`}>
                                                    {getLocationName(menu.menuLocation)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="role-badge">
                                                    {menu.minRequiredRole}
                                                </span>
                                            </td>
                                            <td>
                                                <input 
                                                    type="checkbox"
                                                    checked={menu.canView}
                                                    onChange={e => handlePermissionChange(
                                                        menu.menuId, 
                                                        'canView', 
                                                        e.target.checked
                                                    )}
                                                    disabled={!canGrantPermission(selectedRole.nameEn, menu.minRequiredRole)}
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    type="checkbox"
                                                    checked={menu.canCreate}
                                                    onChange={e => handlePermissionChange(
                                                        menu.menuId, 
                                                        'canCreate', 
                                                        e.target.checked
                                                    )}
                                                    disabled={!menu.canView || !canGrantPermission(selectedRole.nameEn, menu.minRequiredRole)}
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    type="checkbox"
                                                    checked={menu.canUpdate}
                                                    onChange={e => handlePermissionChange(
                                                        menu.menuId, 
                                                        'canUpdate', 
                                                        e.target.checked
                                                    )}
                                                    disabled={!menu.canView || !canGrantPermission(selectedRole.nameEn, menu.minRequiredRole)}
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    type="checkbox"
                                                    checked={menu.canDelete}
                                                    onChange={e => handlePermissionChange(
                                                        menu.menuId, 
                                                        'canDelete', 
                                                        e.target.checked
                                                    )}
                                                    disabled={!menu.canView || !canGrantPermission(selectedRole.nameEn, menu.minRequiredRole)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="help-text">
                                <i className="bi-info-circle"></i>
                                <p>
                                    <strong>권한 부여 규칙:</strong><br />
                                    - 최소 요구 역할보다 낮은 역할에게는 권한을 부여할 수 없습니다.<br />
                                    - 조회 권한이 없으면 생성/수정/삭제 권한을 부여할 수 없습니다.<br />
                                    - ADMIN 역할은 모든 메뉴에 접근할 수 있습니다.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <i className="bi-shield-lock"></i>
                            <p>좌측에서 역할을 선택하세요</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 위치명 한글 변환
const getLocationName = (location) => {
    const names = {
        'DASHBOARD': '일반 대시보드',
        'ADMIN_ONLY': '관리자 전용',
        'BOTH': '양쪽 모두'
    };
    return names[location] || location;
};

// 권한 부여 가능 여부 확인
const canGrantPermission = (userRole, minRequiredRole) => {
    const roleHierarchy = {
        'ADMIN': 4,
        'STAFF': 3,
        'CONSULTANT': 2,
        'CLIENT': 1
    };
    
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[minRequiredRole] || 0;
    
    return userLevel >= requiredLevel;
};

export default MenuPermissionManagement;
```

---

## ✅ 사용 시나리오

### 시나리오 1: STAFF에게 공통코드 관리 권한 부여

```
1. 관리자 로그인
2. "시스템 관리" > "메뉴 권한 설정" 접속
3. 좌측에서 "사무원 (STAFF)" 역할 선택
4. "공통코드 관리" 메뉴 찾기
5. "조회" 체크박스 체크
6. "생성", "수정", "삭제" 체크박스 체크
7. "변경사항 저장" 클릭

결과:
- STAFF 역할 사용자가 "/admin/common-codes" 접근 가능
- 공통코드 등록/수정/삭제 가능
```

### 시나리오 2: CONSULTANT에게 조직 관리 조회만 허용

```
1. 관리자 로그인
2. "메뉴 권한 설정" 접속
3. "상담사 (CONSULTANT)" 역할 선택
4. "조직 관리" 메뉴 찾기
5. "조회"만 체크 (생성/수정/삭제는 체크 안 함)
6. "변경사항 저장" 클릭

결과:
- CONSULTANT 역할 사용자가 "/admin/organization" 접근 가능
- 조직 정보 조회만 가능 (수정 불가)
```

---

## 🎯 핵심 정리

### 동적 권한 부여
```
관리자가 UI에서 설정:
- 역할 선택
- 메뉴별 권한 체크
- 저장

코드 수정 없음!
```

### 권한 계층
```
ADMIN (4) > STAFF (3) > CONSULTANT (2) > CLIENT (1)

규칙:
- 최소 요구 역할보다 낮은 역할에게는 권한 부여 불가
- 예: "사용자 관리" (min: ADMIN) → STAFF에게 부여 불가
- 예: "공통코드 관리" (min: STAFF) → STAFF에게 부여 가능
```

### 테넌트별 독립
```
A 상담소:
- STAFF에게 "공통코드 관리" 허용

B 상담소:
- STAFF에게 "공통코드 관리" 불허

→ 테넌트별로 다른 정책!
```

---

**작성 완료**: 2025-12-03  
**핵심**: 관리자가 UI에서 역할별 메뉴 권한 동적 설정!

