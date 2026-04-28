/**
 * Menu permission management UI (presentational).
 * Renders from props only; no business logic.
 *
 * Standards: BEM mg-* classes, CSS variables (--mg-*), no hardcoded colors in JS.
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2025-12-03
 */

import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGCard from '../common/MGCard';
import {
    MENU_PERM_ACCESS,
    MENU_PERM_EMPTY,
    MENU_PERM_HELP,
    MENU_PERM_LOADING,
    MENU_PERM_LOCATION,
    MENU_PERM_ROLE_LEVEL,
    MENU_PERM_ROLE_PANEL,
    MENU_PERM_SIDEBAR
} from '../../constants/menuPermissionManagementStrings';
import './MenuPermissionManagementUI.css';

const MenuPermissionManagementUI = ({
    roles,
    selectedRole,
    menuPermissions,
    loading,
    error,
    onRoleSelect,
    onPermissionChange
}) => {
    const getLocationName = (location) => MENU_PERM_LOCATION[location] || MENU_PERM_LOCATION.UNKNOWN;

    const canGrantPermission = (userRole, minRequiredRole) => {
        const userLevel = MENU_PERM_ROLE_LEVEL[userRole] || 0;
        const requiredLevel = MENU_PERM_ROLE_LEVEL[minRequiredRole] || 0;
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
                <div className="mg-sidebar">
                    <h3 className="mg-sidebar-title">{MENU_PERM_SIDEBAR.TITLE}</h3>
                    {loading && !selectedRole ? (
                        <UnifiedLoading type="inline" text={MENU_PERM_LOADING.INLINE} />
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

                <div className="mg-main-content">
                    {selectedRole ? (
                        <>
                            <div className="mg-role-header">
                                <h3 className="mg-role-title">
                                    {(selectedRole.nameKo || selectedRole.nameEn) + MENU_PERM_ROLE_PANEL.MENU_TITLE_SUFFIX}
                                </h3>
                                <p className="mg-role-description">
                                    {MENU_PERM_ROLE_PANEL.DESCRIPTION}
                                </p>
                            </div>

                            {loading ? (
                                <UnifiedLoading type="inline" text={MENU_PERM_LOADING.INLINE} />
                            ) : (
                                <>
                                    <div className="mg-permission-cards-grid">
                                        {menuPermissions.map(menu => {
                                            const canGrant = canGrantPermission(selectedRole.nameEn, menu.minRequiredRole);

                                            return (
                                                <MGCard key={menu.menuId} variant="default" className="mg-permission-card">
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

                                                    <div className="mg-permission-card__content">
                                                        <div className="mg-permission-card__path">
                                                            <code className="mg-menu-path">{menu.menuPath}</code>
                                                        </div>

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
                                                                    <span>{MENU_PERM_ACCESS.VIEW}</span>
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
                                                                    <span>{MENU_PERM_ACCESS.CREATE}</span>
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
                                                                    <span>{MENU_PERM_ACCESS.UPDATE}</span>
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
                                                                    <span>{MENU_PERM_ACCESS.DELETE}</span>
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
                                            <p className="mg-help-title">{MENU_PERM_HELP.TITLE}</p>
                                            <ul className="mg-help-list">
                                                <li>{MENU_PERM_HELP.RULE_MIN_ROLE}</li>
                                                <li>{MENU_PERM_HELP.RULE_VIEW_FIRST}</li>
                                                <li>{MENU_PERM_HELP.RULE_ADMIN}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="mg-empty-state">
                            <i className="bi bi-shield-lock mg-empty-icon" />
                            <p className="mg-empty-text">{MENU_PERM_EMPTY.SELECT_ROLE}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MenuPermissionManagementUI;
