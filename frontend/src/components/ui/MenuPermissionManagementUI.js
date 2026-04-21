/**
 * 메뉴 권한 관리 UI (Presentational Component)
 * 
 * 순수 UI 컴포넌트 - 비즈니스 로직 없음
 * Props를 통해 데이터와 이벤트 핸들러를 받아 렌더링만 수행
/**
 * 
/**
 * 표준화 준수:
/**
 * - BEM 네이밍 (mg-{component}-{element}--{modifier})
/**
 * - CSS 변수 사용 (--mg-* 접두사)
/**
 * - 하드코딩 금지
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGCard from '../common/MGCard';
import { MENU_PERM_LOCATION, MENU_PERM_UI } from '../../constants/menuPermissionManagementStrings';
import './MenuPermissionManagementUI.css';

const MenuPermissionManagementUI = ({
    roles,
    selectedRole,
    menuPermissions,
    loading,
    error,
    onRoleSelect,
    onPermissionChange,
    onBatchSave
}) => {
/**
     * 위치명 한글 변환
     */
    const getLocationName = (location) => MENU_PERM_LOCATION[location] || location;

/**
     * 권한 부여 가능 여부 확인
     */
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

    return (
        <div className="mg-menu-permission-management">
            {error && (
                <div className="mg-error-message">
                    <span className="mg-error-icon">⚠️</span>
                    {error}
                </div>
            )}

            <div className="mg-content">
                {/* 좌측: 역할 목록 */}
                <div className="mg-sidebar">
                    <h3 className="mg-sidebar-title">{MENU_PERM_UI.SIDEBAR_ROLE_TITLE}</h3>
                    {loading && !selectedRole ? (
                        <UnifiedLoading type="inline" text={MENU_PERM_UI.LOADING_INLINE} />
                    ) : (
                        <ul className="mg-role-list">
                            {roles.map(role => (
                                <li
                                    key={role.tenantRoleId}
                                    className={`mg-role-item ${selectedRole?.tenantRoleId === role.tenantRoleId ? 'mg-active' : ''}`}
                                    onClick={() => onRoleSelect(role)}
                                >
                                    <i className="bi bi-person-badge mg-role-icon" />
                                    <div className="mg-role-info">
                                        <span className="mg-role-name">{role.nameKo || role.nameEn}</span>
                                        <span className="mg-role-code">({role.nameEn})</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* 우측: 메뉴 권한 목록 */}
                <div className="mg-main-content">
                    {selectedRole ? (
                        <>
                            <div className="mg-role-header">
                                <h3 className="mg-role-title">
                                    {(selectedRole.nameKo || selectedRole.nameEn) + MENU_PERM_UI.ROLE_MENU_TITLE_SUFFIX}
                                </h3>
                                <p className="mg-role-description">
                                    {MENU_PERM_UI.ROLE_DESCRIPTION}
                                </p>
                            </div>

                            {loading ? (
                                <UnifiedLoading type="inline" text={MENU_PERM_UI.LOADING_INLINE} />
                            ) : (
                                <>
                                    <div className="mg-permission-cards-grid">
                                        {menuPermissions.map(menu => {
                                            const canGrant = canGrantPermission(selectedRole.nameEn, menu.minRequiredRole);
                                            
                                            return (
                                                <MGCard key={menu.menuId} variant="default" className="mg-permission-card">
                                                    {/* 카드 헤더 */}
                                                    <div className="mg-permission-card__header">
                                                        <div className="mg-permission-card__title-section">
                                                            <strong className="mg-menu-name">{menu.menuName}</strong>
                                                            <small className="mg-menu-code">{menu.menuCode}</small>
                                                        </div>
                                                        <div className="mg-permission-card__badges">
                                                            <span className={`mg-badge mg-location-${menu.menuLocation.toLowerCase()}`}>
                                                                {getLocationName(menu.menuLocation)}
                                                            </span>
                                                            <span className="mg-badge mg-role-badge">
                                                                {menu.minRequiredRole}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* 카드 본문 */}
                                                    <div className="mg-permission-card__content">
                                                        <div className="mg-permission-card__path">
                                                            <code className="mg-menu-path">{menu.menuPath}</code>
                                                        </div>
                                                        
                                                        {/* 권한 체크박스 그리드 */}
                                                        <div className="mg-permission-card__permissions">
                                                            <div className="mg-permission-item">
                                                                <label className="mg-permission-label">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={menu.canView || false}
                                                                        onChange={e => onPermissionChange(menu.menuId, 'canView', e.target.checked)}
                                                                        disabled={!canGrant}
                                                                        className="mg-checkbox"
                                                                    />
                                                                    <span>{MENU_PERM_UI.PERM_VIEW}</span>
                                                                </label>
                                                            </div>
                                                            <div className="mg-permission-item">
                                                                <label className="mg-permission-label">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={menu.canCreate || false}
                                                                        onChange={e => onPermissionChange(menu.menuId, 'canCreate', e.target.checked)}
                                                                        disabled={!menu.canView || !canGrant}
                                                                        className="mg-checkbox"
                                                                    />
                                                                    <span>{MENU_PERM_UI.PERM_CREATE}</span>
                                                                </label>
                                                            </div>
                                                            <div className="mg-permission-item">
                                                                <label className="mg-permission-label">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={menu.canUpdate || false}
                                                                        onChange={e => onPermissionChange(menu.menuId, 'canUpdate', e.target.checked)}
                                                                        disabled={!menu.canView || !canGrant}
                                                                        className="mg-checkbox"
                                                                    />
                                                                    <span>{MENU_PERM_UI.PERM_UPDATE}</span>
                                                                </label>
                                                            </div>
                                                            <div className="mg-permission-item">
                                                                <label className="mg-permission-label">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={menu.canDelete || false}
                                                                        onChange={e => onPermissionChange(menu.menuId, 'canDelete', e.target.checked)}
                                                                        disabled={!menu.canView || !canGrant}
                                                                        className="mg-checkbox"
                                                                    />
                                                                    <span>{MENU_PERM_UI.PERM_DELETE}</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </MGCard>
                                            );
                                        })}
                                    </div>

                                    <div className="mg-help-text">
                                        <i className="bi bi-info-circle mg-help-icon" />
                                        <div className="mg-help-content">
                                            <p className="mg-help-title">{MENU_PERM_UI.HELP_TITLE}</p>
                                            <ul className="mg-help-list">
                                                <li>{MENU_PERM_UI.HELP_RULE_MIN_ROLE}</li>
                                                <li>{MENU_PERM_UI.HELP_RULE_VIEW_FIRST}</li>
                                                <li>{MENU_PERM_UI.HELP_RULE_ADMIN}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="mg-empty-state">
                            <i className="bi bi-shield-lock mg-empty-icon" />
                            <p className="mg-empty-text">{MENU_PERM_UI.EMPTY_SELECT_ROLE}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MenuPermissionManagementUI;

