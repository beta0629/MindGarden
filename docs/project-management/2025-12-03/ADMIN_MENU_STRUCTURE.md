# 관리자 전용 메뉴 구조

**작성일**: 2025-12-03  
**목적**: 테넌트 관리자(ADMIN)만 접근 가능한 관리 메뉴 설계

---

## 🎯 메뉴 구조

### 일반 대시보드 (모든 역할)
```
📊 대시보드
├─ 통계 (모든 역할)
├─ 관리 (ADMIN, STAFF)
└─ ERP (ADMIN만) ⭐
```

### 관리자 전용 메뉴 (ADMIN만) ⭐
```
⚙️ 시스템 관리 (ADMIN만!)
├─ 📋 공통코드 관리
│  ├─ 상담 관련
│  │  ├─ 상담 패키지
│  │  ├─ 전문 분야
│  │  ├─ 상담 유형
│  │  └─ 평가 유형
│  ├─ 재무 관련
│  │  ├─ 결제 방법
│  │  ├─ 재무 카테고리
│  │  ├─ 세금 카테고리
│  │  └─ 예산 카테고리
│  ├─ 구매 관련
│  │  ├─ 품목 카테고리
│  │  └─ 공급업체
│  ├─ 인사 관련
│  │  ├─ 고용 형태
│  │  └─ 직급
│  └─ 마케팅 관련
│     └─ 마케팅 채널
│
├─ 👥 사용자 관리
│  ├─ 사용자 목록
│  ├─ 역할 관리
│  └─ 권한 설정
│
├─ 🏢 조직 관리
│  ├─ 조직 정보
│  ├─ 지점 관리 (다중 지점인 경우)
│  └─ 근무 시간 설정
│
├─ 💰 요금제 관리
│  ├─ 현재 요금제
│  ├─ 사용량 통계
│  └─ 결제 내역
│
└─ ⚙️ 시스템 설정
   ├─ 기본 설정
   ├─ 알림 설정
   ├─ 백업/복원
   └─ 로그 조회
```

---

## 📊 메뉴 데이터베이스 설계

### 1. menus 테이블

```sql
CREATE TABLE menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 메뉴 정보
    menu_code VARCHAR(50) NOT NULL UNIQUE COMMENT '메뉴 코드',
    menu_name VARCHAR(100) NOT NULL COMMENT '메뉴명',
    menu_name_en VARCHAR(100) COMMENT '영문 메뉴명',
    menu_path VARCHAR(200) COMMENT '경로',
    
    -- 계층 구조
    parent_menu_id BIGINT COMMENT '부모 메뉴 ID',
    depth INT DEFAULT 0 COMMENT '깊이 (0=최상위)',
    
    -- 권한
    required_role VARCHAR(50) NOT NULL COMMENT '필요 역할 (ADMIN, STAFF, etc)',
    is_admin_only BOOLEAN DEFAULT false COMMENT '관리자 전용 여부',
    
    -- 메타데이터
    icon VARCHAR(50) COMMENT '아이콘',
    description TEXT COMMENT '설명',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- 감사
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_parent (parent_menu_id),
    INDEX idx_role (required_role),
    INDEX idx_admin_only (is_admin_only),
    
    FOREIGN KEY (parent_menu_id) REFERENCES menus(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. 메뉴 데이터 삽입

```sql
-- ========================================
-- 일반 대시보드 메뉴 (모든 역할)
-- ========================================
INSERT INTO menus (menu_code, menu_name, menu_path, required_role, is_admin_only, icon, sort_order) VALUES
('DASHBOARD', '대시보드', '/dashboard', 'USER', false, 'bi-speedometer2', 1);

-- ========================================
-- 관리자 전용 메뉴 (ADMIN만!)
-- ========================================
-- 최상위: 시스템 관리
INSERT INTO menus (menu_code, menu_name, menu_path, required_role, is_admin_only, icon, sort_order) VALUES
('SYSTEM_ADMIN', '시스템 관리', '/admin', 'ADMIN', true, 'bi-gear', 100);

-- 1. 공통코드 관리
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order) VALUES
('COMMON_CODE_MGMT', '공통코드 관리', '/admin/common-codes', 
 (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN'), 
 'ADMIN', true, 'bi-list-ul', 1);

-- 2. 사용자 관리
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order) VALUES
('USER_MGMT', '사용자 관리', '/admin/users', 
 (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN'), 
 'ADMIN', true, 'bi-people', 2);

-- 2-1. 사용자 목록
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, required_role, is_admin_only, sort_order) VALUES
('USER_LIST', '사용자 목록', '/admin/users/list', 
 (SELECT id FROM menus WHERE menu_code = 'USER_MGMT'), 
 'ADMIN', true, 1);

-- 2-2. 역할 관리
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, required_role, is_admin_only, sort_order) VALUES
('ROLE_MGMT', '역할 관리', '/admin/users/roles', 
 (SELECT id FROM menus WHERE menu_code = 'USER_MGMT'), 
 'ADMIN', true, 2);

-- 2-3. 권한 설정
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, required_role, is_admin_only, sort_order) VALUES
('PERMISSION_MGMT', '권한 설정', '/admin/users/permissions', 
 (SELECT id FROM menus WHERE menu_code = 'USER_MGMT'), 
 'ADMIN', true, 3);

-- 3. 조직 관리
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order) VALUES
('ORG_MGMT', '조직 관리', '/admin/organization', 
 (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN'), 
 'ADMIN', true, 'bi-building', 3);

-- 4. 요금제 관리
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order) VALUES
('SUBSCRIPTION_MGMT', '요금제 관리', '/admin/subscription', 
 (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN'), 
 'ADMIN', true, 'bi-credit-card', 4);

-- 5. 시스템 설정
INSERT INTO menus (menu_code, menu_name, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order) VALUES
('SYSTEM_SETTINGS', '시스템 설정', '/admin/settings', 
 (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN'), 
 'ADMIN', true, 'bi-sliders', 5);
```

---

## 💻 백엔드 구현

### 1. MenuService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MenuService {
    
    private final MenuRepository menuRepository;
    
    /**
     * 사용자 역할에 따른 메뉴 조회
     */
    public List<MenuDTO> getUserMenus(String userId) {
        // 1. 사용자 정보 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다"));
        
        String role = user.getRole(); // ADMIN, STAFF, CONSULTANT, CLIENT
        
        // 2. 역할에 따른 메뉴 조회
        List<Menu> menus;
        
        if ("ADMIN".equals(role)) {
            // 관리자: 모든 메뉴 (일반 + 관리자 전용)
            menus = menuRepository.findByIsActiveTrueOrderBySortOrder();
        } else {
            // 일반 사용자: 관리자 전용 메뉴 제외
            menus = menuRepository.findByIsAdminOnlyFalseAndIsActiveTrueOrderBySortOrder();
        }
        
        // 3. 계층 구조로 변환
        return buildMenuTree(menus);
    }
    
    /**
     * 관리자 전용 메뉴만 조회
     */
    public List<MenuDTO> getAdminMenus() {
        List<Menu> menus = menuRepository
            .findByIsAdminOnlyTrueAndIsActiveTrueOrderBySortOrder();
        
        return buildMenuTree(menus);
    }
    
    /**
     * 메뉴 트리 구조 생성
     */
    private List<MenuDTO> buildMenuTree(List<Menu> menus) {
        Map<Long, MenuDTO> menuMap = new HashMap<>();
        List<MenuDTO> rootMenus = new ArrayList<>();
        
        // 1. 모든 메뉴를 DTO로 변환
        for (Menu menu : menus) {
            MenuDTO dto = toDTO(menu);
            menuMap.put(menu.getId(), dto);
        }
        
        // 2. 부모-자식 관계 설정
        for (Menu menu : menus) {
            MenuDTO dto = menuMap.get(menu.getId());
            
            if (menu.getParentMenuId() == null) {
                // 최상위 메뉴
                rootMenus.add(dto);
            } else {
                // 하위 메뉴
                MenuDTO parent = menuMap.get(menu.getParentMenuId());
                if (parent != null) {
                    if (parent.getChildren() == null) {
                        parent.setChildren(new ArrayList<>());
                    }
                    parent.getChildren().add(dto);
                }
            }
        }
        
        return rootMenus;
    }
    
    /**
     * Menu → DTO 변환
     */
    private MenuDTO toDTO(Menu menu) {
        return MenuDTO.builder()
            .id(menu.getId())
            .menuCode(menu.getMenuCode())
            .menuName(menu.getMenuName())
            .menuPath(menu.getMenuPath())
            .icon(menu.getIcon())
            .depth(menu.getDepth())
            .isAdminOnly(menu.getIsAdminOnly())
            .sortOrder(menu.getSortOrder())
            .children(new ArrayList<>())
            .build();
    }
}
```

### 2. MenuController.java

```java
@RestController
@RequestMapping("/api/v1/menus")
@RequiredArgsConstructor
public class MenuController {
    
    private final MenuService menuService;
    
    /**
     * 사용자 메뉴 조회
     */
    @GetMapping("/user")
    public ResponseEntity<List<MenuDTO>> getUserMenus() {
        String userId = SecurityUtils.getCurrentUserId();
        List<MenuDTO> menus = menuService.getUserMenus(userId);
        return ResponseEntity.ok(menus);
    }
    
    /**
     * 관리자 전용 메뉴 조회
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MenuDTO>> getAdminMenus() {
        List<MenuDTO> menus = menuService.getAdminMenus();
        return ResponseEntity.ok(menus);
    }
}
```

---

## 🌐 프론트엔드 구현

### 1. AdminLayout.js (관리자 레이아웃)

```javascript
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AdminLayout.css';

const AdminLayout = () => {
    const [adminMenus, setAdminMenus] = useState([]);
    const [expandedMenus, setExpandedMenus] = useState([]);
    const location = useLocation();

    useEffect(() => {
        fetchAdminMenus();
    }, []);

    const fetchAdminMenus = async () => {
        try {
            const response = await axios.get('/api/v1/menus/admin');
            setAdminMenus(response.data);
            
            // 현재 경로에 해당하는 메뉴 자동 확장
            const currentPath = location.pathname;
            const expanded = findExpandedMenus(response.data, currentPath);
            setExpandedMenus(expanded);
        } catch (error) {
            console.error('관리자 메뉴 조회 실패:', error);
        }
    };

    const findExpandedMenus = (menus, path, parentIds = []) => {
        let expanded = [];
        
        for (const menu of menus) {
            const currentIds = [...parentIds, menu.menuCode];
            
            if (menu.menuPath === path) {
                expanded = currentIds;
                break;
            }
            
            if (menu.children && menu.children.length > 0) {
                const childExpanded = findExpandedMenus(menu.children, path, currentIds);
                if (childExpanded.length > 0) {
                    expanded = childExpanded;
                    break;
                }
            }
        }
        
        return expanded;
    };

    const toggleMenu = (menuCode) => {
        setExpandedMenus(prev => 
            prev.includes(menuCode)
                ? prev.filter(code => code !== menuCode)
                : [...prev, menuCode]
        );
    };

    const renderMenu = (menu) => {
        const hasChildren = menu.children && menu.children.length > 0;
        const isExpanded = expandedMenus.includes(menu.menuCode);
        const isActive = location.pathname === menu.menuPath;

        return (
            <li key={menu.menuCode} className="menu-item">
                {hasChildren ? (
                    <>
                        <div 
                            className={`menu-header ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => toggleMenu(menu.menuCode)}
                        >
                            <i className={`bi ${menu.icon}`}></i>
                            <span>{menu.menuName}</span>
                            <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} arrow`}></i>
                        </div>
                        {isExpanded && (
                            <ul className="submenu">
                                {menu.children.map(child => renderMenu(child))}
                            </ul>
                        )}
                    </>
                ) : (
                    <Link 
                        to={menu.menuPath} 
                        className={`menu-link ${isActive ? 'active' : ''}`}
                    >
                        {menu.icon && <i className={`bi ${menu.icon}`}></i>}
                        <span>{menu.menuName}</span>
                    </Link>
                )}
            </li>
        );
    };

    return (
        <div className="admin-layout">
            {/* 좌측 사이드바 */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <i className="bi-gear-fill"></i>
                    <h2>시스템 관리</h2>
                </div>

                <nav className="admin-nav">
                    <ul className="menu-list">
                        {adminMenus.map(menu => renderMenu(menu))}
                    </ul>
                </nav>
            </aside>

            {/* 우측 컨텐츠 영역 */}
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
```

### 2. App.js (라우팅 설정)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// 관리자 전용 페이지
import TenantCommonCodeManagement from './pages/admin/TenantCommonCodeManagement';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';
import PermissionManagement from './pages/admin/PermissionManagement';
import OrganizationManagement from './pages/admin/OrganizationManagement';
import SubscriptionManagement from './pages/admin/SubscriptionManagement';
import SystemSettings from './pages/admin/SystemSettings';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 일반 대시보드 (모든 역할) */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Dashboard />} />
                    {/* ... 기타 대시보드 페이지 */}
                </Route>

                {/* 관리자 전용 영역 (ADMIN만!) */}
                <Route 
                    path="/admin" 
                    element={
                        <ProtectedRoute requiredRole="ADMIN">
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/admin/common-codes" replace />} />
                    
                    {/* 공통코드 관리 */}
                    <Route path="common-codes" element={<TenantCommonCodeManagement />} />
                    
                    {/* 사용자 관리 */}
                    <Route path="users/list" element={<UserManagement />} />
                    <Route path="users/roles" element={<RoleManagement />} />
                    <Route path="users/permissions" element={<PermissionManagement />} />
                    
                    {/* 조직 관리 */}
                    <Route path="organization" element={<OrganizationManagement />} />
                    
                    {/* 요금제 관리 */}
                    <Route path="subscription" element={<SubscriptionManagement />} />
                    
                    {/* 시스템 설정 */}
                    <Route path="settings" element={<SystemSettings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
```

### 3. ProtectedRoute.js (권한 확인)

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>로딩 중...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        // 권한 없음 - 대시보드로 리다이렉트
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
```

### 4. AdminLayout.css

```css
.admin-layout {
    display: flex;
    height: 100vh;
}

.admin-sidebar {
    width: 280px;
    background: #1e293b;
    color: white;
    overflow-y: auto;
}

.sidebar-header {
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 12px;
}

.sidebar-header i {
    font-size: 24px;
    color: #60a5fa;
}

.sidebar-header h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.admin-nav {
    padding: 16px 0;
}

.menu-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.menu-item {
    margin: 4px 12px;
}

.menu-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s;
}

.menu-header:hover {
    background: rgba(255, 255, 255, 0.05);
}

.menu-header .arrow {
    margin-left: auto;
    font-size: 12px;
}

.menu-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s;
}

.menu-link:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
}

.menu-link.active {
    background: #3b82f6;
    color: white;
}

.submenu {
    list-style: none;
    padding: 0;
    margin: 4px 0 4px 24px;
}

.admin-content {
    flex: 1;
    background: #f8fafc;
    overflow-y: auto;
}
```

---

## 🔒 보안 설정

### 1. Spring Security 설정

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // 관리자 전용 API
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/tenant/common-codes/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/menus/admin").hasRole("ADMIN")
                
                // 일반 API
                .requestMatchers("/api/v1/dashboard/**").authenticated()
                .requestMatchers("/api/v1/menus/user").authenticated()
                
                .anyRequest().permitAll()
            );
        
        return http.build();
    }
}
```

### 2. 프론트엔드 권한 확인

```javascript
// hooks/useAuth.js
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await axios.get('/api/v1/auth/me');
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = () => {
        return user?.role === 'ADMIN';
    };

    return { user, loading, isAdmin };
};
```

---

## ✅ 핵심 정리

### 메뉴 구조
```
일반 대시보드 (/dashboard)
- 모든 역할 접근 가능
- 역할별 섹션 차등 표시

관리자 전용 (/admin)
- ADMIN만 접근 가능
- 공통코드, 사용자, 조직, 요금제, 설정 관리
```

### 보안
```
백엔드: Spring Security (@PreAuthorize)
프론트엔드: ProtectedRoute 컴포넌트
데이터베이스: is_admin_only 플래그
```

### 사용자 경험
```
ADMIN:
- 일반 대시보드 + 관리자 메뉴 모두 표시
- 좌측 사이드바에 "시스템 관리" 메뉴

STAFF/CONSULTANT/CLIENT:
- 일반 대시보드만 표시
- 관리자 메뉴 숨김
- /admin 경로 접근 시 리다이렉트
```

---

**작성 완료**: 2025-12-03  
**핵심**: 관리자 전용 메뉴 분리, 권한 기반 접근 제어!

