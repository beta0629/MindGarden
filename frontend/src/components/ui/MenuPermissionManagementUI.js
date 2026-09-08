/**
 * Menu permission management UI (presentational) — Clinic-OS stage rows.
 * Props only; no business API calls.
 *
 * SSOT: docs/design-system/clinic-os-menu-permissions.md
 *
 * @author Core Solution
 * @since 2025-12-03
 * @updated 2026-09-08 — Clinic-OS rows (no cards / menuCode / path)
 */

import React from 'react';
import PropTypes from 'prop-types';
import UnifiedLoading from '../common/UnifiedLoading';
import {
  MENU_PERM_BADGE,
  MENU_PERM_EMPTY,
  MENU_PERM_LOADING,
  MENU_PERM_ROW
} from '../../constants/menuPermissionManagementStrings';
import {
  getMenuPermissionLock,
  isCenterCustomPermission,
  normalizeRoleCode
} from '../../utils/menuPermissionLockPolicy';
import { toDisplayString } from '../../utils/safeDisplay';

const MenuPermissionManagementUI = ({
  selectedRole,
  menuPermissions,
  loading,
  error,
  onVisibilityChange
}) => {
  const roleCode = normalizeRoleCode(selectedRole?.nameEn || selectedRole?.templateCode);

  if (!selectedRole) {
    return (
      <div className="menu-permission-empty" data-testid="menu-permission-empty">
        <p className="menu-permission-empty__text">{MENU_PERM_EMPTY.SELECT_ROLE}</p>
      </div>
    );
  }

  if (loading) {
    return <UnifiedLoading type="inline" text={MENU_PERM_LOADING.INLINE} />;
  }

  if (!menuPermissions || menuPermissions.length === 0) {
    return (
      <div className="menu-permission-empty">
        <p className="menu-permission-empty__text">{MENU_PERM_EMPTY.NO_MENUS}</p>
      </div>
    );
  }

  return (
    <div className="menu-permission-stage-body">
      {error ? (
        <div className="menu-permission-error" role="alert">
          {toDisplayString(error)}
        </div>
      ) : null}
      <ul className="menu-permission-rows" data-testid="menu-permission-rows">
        {menuPermissions.map((menu) => {
          const lock = getMenuPermissionLock(roleCode, menu);
          const centerCustom = isCenterCustomPermission(menu);
          const name = toDisplayString(menu.menuName) || '메뉴';
          const visible = Boolean(menu.canView || menu.hasPermission);

          return (
            <li
              key={menu.menuId}
              className={[
                'menu-permission-row',
                lock.locked ? 'menu-permission-row--locked' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              data-menu-id={menu.menuId}
            >
              <span className="menu-permission-row__name">{name}</span>
              <span className="menu-permission-row__badge-col">
                <span
                  className={[
                    'menu-permission-badge',
                    centerCustom
                      ? 'menu-permission-badge--center'
                      : 'menu-permission-badge--default'
                  ].join(' ')}
                >
                  {centerCustom ? MENU_PERM_BADGE.CENTER : MENU_PERM_BADGE.DEFAULT}
                </span>
              </span>
              <span className="menu-permission-row__action">
                {lock.locked ? (
                  <span
                    className="menu-permission-lock"
                    title={lock.reason}
                    aria-label={`${MENU_PERM_ROW.LOCK_ARIA}: ${lock.reason}`}
                  >
                    <i className="bi bi-lock-fill" aria-hidden="true" />
                    <span className="menu-permission-lock__reason">{lock.reason}</span>
                  </span>
                ) : (
                  <label className="menu-permission-toggle">
                    <span className="mg-sr-only">{MENU_PERM_ROW.VISIBILITY_ARIA(name)}</span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={visible}
                      onChange={(e) => onVisibilityChange(menu.menuId, e.target.checked)}
                      className="menu-permission-toggle__input"
                    />
                  </label>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

MenuPermissionManagementUI.propTypes = {
  selectedRole: PropTypes.object,
  menuPermissions: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onVisibilityChange: PropTypes.func.isRequired
};

export default MenuPermissionManagementUI;
