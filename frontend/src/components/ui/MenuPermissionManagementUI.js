/**
 * Menu permission management UI (presentational) — Clinic-OS stage rows.
 * Props only; no business API calls.
 *
 * SSOT: docs/design-system/clinic-os-app-menu-visibility-spec.md
 *
 * @author Core Solution
 * @since 2025-12-03
 * @updated 2026-09-12 — 앱/웹 뱃지 + Switch 노출 토글
 */

import React from 'react';
import PropTypes from 'prop-types';
import UnifiedLoading from '../common/UnifiedLoading';
import Switch from '../common/Switch';
import {
  MENU_PERM_BADGE,
  MENU_PERM_EMPTY,
  MENU_PERM_LOADING,
  MENU_PERM_ROW,
  MENU_PERM_STATUS
} from '../../constants/menuPermissionManagementStrings';
import {
  getMenuPermissionLock,
  isCenterCustomPermission,
  normalizeRoleCode
} from '../../utils/menuPermissionLockPolicy';
import { MENU_PERM_SURFACE_FILTER } from '../../utils/menuPermissionSurface';
import { toDisplayString } from '../../utils/safeDisplay';

const MenuPermissionManagementUI = ({
  selectedRole,
  menuPermissions,
  loading,
  error,
  pendingMenuIds,
  onVisibilityChange
}) => {
  const roleCode = normalizeRoleCode(selectedRole?.nameEn || selectedRole?.templateCode);
  const pending = pendingMenuIds instanceof Set ? pendingMenuIds : new Set();

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
          // canView만 — hasPermission OR 시 숨김(canView=false)이 노출로 보이는 버그 방지
          const visible = Boolean(menu.canView);
          const isApp = menu.surface === MENU_PERM_SURFACE_FILTER.APP;
          const rowPending = pending.has(menu.menuId);

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
                    isApp
                      ? 'menu-permission-badge--app'
                      : 'menu-permission-badge--web'
                  ].join(' ')}
                >
                  {isApp ? MENU_PERM_BADGE.APP : MENU_PERM_BADGE.WEB}
                </span>
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
                {menu.reviewCaution ? (
                  <span className="menu-permission-badge menu-permission-badge--review">
                    {MENU_PERM_BADGE.REVIEW}
                  </span>
                ) : null}
              </span>
              <span className="menu-permission-row__action">
                <span
                  className={[
                    'menu-permission-badge',
                    visible
                      ? 'menu-permission-badge--on'
                      : 'menu-permission-badge--off'
                  ].join(' ')}
                >
                  {visible ? MENU_PERM_STATUS.VISIBLE : MENU_PERM_STATUS.HIDDEN}
                </span>
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
                  <Switch
                    checked={visible}
                    disabled={rowPending}
                    onCheckedChange={(next) => onVisibilityChange(menu.menuId, next)}
                    ariaLabel={MENU_PERM_ROW.VISIBILITY_ARIA(name)}
                    className="menu-permission-toggle"
                  />
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
  pendingMenuIds: PropTypes.instanceOf(Set),
  onVisibilityChange: PropTypes.func.isRequired
};

MenuPermissionManagementUI.defaultProps = {
  pendingMenuIds: undefined
};

export default MenuPermissionManagementUI;
