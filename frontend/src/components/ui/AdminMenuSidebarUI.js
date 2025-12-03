/**
 * 관리자 메뉴 사이드바 UI (Presentational Component)
 * 
 * 순수 UI 컴포넌트 - 비즈니스 로직 없음
 * Props를 통해 데이터와 이벤트 핸들러를 받아 렌더링만 수행
 * 
 * 표준화 준수:
 * - BEM 네이밍 (mg-{component}-{element}--{modifier})
 * - CSS 변수 사용 (--mg-* 접두사)
 * - 하드코딩 금지
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './AdminMenuSidebarUI.css';

const AdminMenuSidebarUI = ({
    menus,
    expandedMenus,
    currentPath,
    onToggleMenu,
    onMenuClick
}) => {
    /**
     * 메뉴 렌더링 (재귀)
     */
    const renderMenu = (menu) => {
        const hasChildren = menu.children && menu.children.length > 0;
        const isExpanded = expandedMenus.includes(menu.menuCode);
        const isActive = currentPath === menu.menuPath;

        if (hasChildren) {
            return (
                <li key={menu.menuCode} className="mg-menu-item">
                    <div
                        className={`mg-menu-header ${isExpanded ? 'mg-expanded' : ''}`}
                        onClick={() => onToggleMenu(menu.menuCode)}
                    >
                        {menu.icon && (
                            <i className={`bi bi-${menu.icon} mg-menu-icon`}></i>
                        )}
                        <span className="mg-menu-name">{menu.menuName}</span>
                        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} mg-menu-arrow`}></i>
                    </div>
                    {isExpanded && (
                        <ul className="mg-submenu">
                            {menu.children.map(child => renderMenu(child))}
                        </ul>
                    )}
                </li>
            );
        } else {
            return (
                <li key={menu.menuCode} className="mg-menu-item">
                    <Link
                        to={menu.menuPath}
                        className={`mg-menu-link ${isActive ? 'mg-active' : ''}`}
                        onClick={() => onMenuClick(menu)}
                    >
                        {menu.icon && (
                            <i className={`bi bi-${menu.icon} mg-menu-icon`}></i>
                        )}
                        <span className="mg-menu-name">{menu.menuName}</span>
                    </Link>
                </li>
            );
        }
    };

    return (
        <aside className="mg-admin-sidebar">
            <div className="mg-sidebar-header">
                <i className="bi bi-gear-fill mg-header-icon"></i>
                <h2 className="mg-header-title">시스템 관리</h2>
            </div>

            <nav className="mg-admin-nav">
                <ul className="mg-menu-list">
                    {menus.map(menu => renderMenu(menu))}
                </ul>
            </nav>
        </aside>
    );
};

export default AdminMenuSidebarUI;

