/**
 * 관리자 레이아웃 컨테이너 (Container Component)
 * 
 * 비즈니스 로직 담당:
/**
 * - API 호출
/**
 * - 상태 관리
/**
 * - 이벤트 핸들러
/**
 * 
/**
 * UI 렌더링은 AdminMenuSidebarUI에 위임
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getAdminMenus } from '../../utils/menuApi';
import AdminMenuSidebarUI from '../ui/AdminMenuSidebarUI';

const AdminLayout = () => {
    const [adminMenus, setAdminMenus] = useState([]);
    const [expandedMenus, setExpandedMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

/**
     * 초기 로드: 관리자 메뉴 조회
     */
    useEffect(() => {
        fetchAdminMenus();
    }, []);

/**
     * 현재 경로 변경 시 메뉴 자동 확장
     */
    useEffect(() => {
        if (adminMenus.length > 0) {
            const expanded = findExpandedMenus(adminMenus, location.pathname);
            setExpandedMenus(expanded);
        }
    }, [location.pathname, adminMenus]);

/**
     * 관리자 메뉴 조회
     */
    const fetchAdminMenus = async () => {
        try {
            setLoading(true);
            const response = await getAdminMenus();
            
            if (response.success) {
                setAdminMenus(response.data || []);
            } else {
                console.error('관리자 메뉴 조회 실패:', response.message);
                // 권한 없으면 대시보드로 리다이렉트
                if (response.message && response.message.includes('관리자만')) {
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            console.error('관리자 메뉴 조회 오류:', error);
            // 403 에러면 대시보드로 리다이렉트
            if (error.response?.status === 403) {
                navigate('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

/**
     * 현재 경로에 해당하는 메뉴 자동 확장 (재귀)
     */
    const findExpandedMenus = (menus, path, parentCodes = []) => {
        let expanded = [];

        for (const menu of menus) {
            const currentCodes = [...parentCodes, menu.menuCode];

            if (menu.menuPath === path) {
                // 현재 경로와 일치하는 메뉴 발견
                expanded = currentCodes;
                break;
            }

            if (menu.children && menu.children.length > 0) {
                const childExpanded = findExpandedMenus(menu.children, path, currentCodes);
                if (childExpanded.length > 0) {
                    // 하위 메뉴 중 일치하는 경로 발견
                    expanded = childExpanded;
                    break;
                }
            }
        }

        return expanded;
    };

/**
     * 메뉴 확장/축소 토글
     */
    const handleToggleMenu = (menuCode) => {
        setExpandedMenus(prev => 
            prev.includes(menuCode)
                ? prev.filter(code => code !== menuCode)
                : [...prev, menuCode]
        );
    };

/**
     * 메뉴 클릭 핸들러
     */
    const handleMenuClick = (menu) => {
        // 메뉴 클릭 시 추가 로직 (예: 로그, 분석 등)
        console.log('메뉴 클릭:', menu.menuName);
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                color: 'var(--mg-gray-600)'
            }}>
                로딩 중...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* 좌측 사이드바 */}
            <AdminMenuSidebarUI
                menus={adminMenus}
                expandedMenus={expandedMenus}
                currentPath={location.pathname}
                onToggleMenu={handleToggleMenu}
                onMenuClick={handleMenuClick}
            />

            {/* 우측 컨텐츠 영역 */}
            <main style={{
                flex: 1,
                marginLeft: '280px',
                background: 'var(--mg-gray-50)',
                overflowY: 'auto',
                padding: 'var(--mg-spacing-6)'
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;

