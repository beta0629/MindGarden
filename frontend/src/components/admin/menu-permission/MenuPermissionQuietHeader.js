/**
 * MenuPermissionQuietHeader — title + subtitle only (no batch Save CTA)
 * Twin: RefundQuietHeader / SalaryQuietHeader
 * SSOT: docs/design-system/clinic-os-app-menu-visibility-spec.md
 * Orchestration: MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md §2
 *
 * @author CoreSolution
 * @since 2026-09-08
 * @updated 2026-09-12 — 일괄 저장 CTA 제거 (iOS|Android Switch 즉시 적용)
 */

import { MENU_PERM_PAGE } from '../../../constants/menuPermissionManagementStrings';

/**
 * Quiet header for 앱 메뉴 노출 — title/subtitle only.
 */
const MenuPermissionQuietHeader = () => (
  <header
    className="menu-permission-header"
    aria-label={MENU_PERM_PAGE.TITLE}
  >
    <div className="menu-permission-header__titles">
      <h1
        id={MENU_PERM_PAGE.TITLE_ID}
        className="menu-permission-header__title"
      >
        {MENU_PERM_PAGE.TITLE}
      </h1>
      <p className="menu-permission-header__subtitle">
        {MENU_PERM_PAGE.SUBTITLE}
      </p>
    </div>
  </header>
);

export default MenuPermissionQuietHeader;
