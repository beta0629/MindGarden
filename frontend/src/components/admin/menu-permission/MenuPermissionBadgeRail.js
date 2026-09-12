/**
 * MenuPermissionBadgeRail — 기본 / 센터 맞춤 summary strip
 * Twin density: RefundActionRail (no MoneyTodoList import)
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import { MENU_PERM_RAIL } from '../../../constants/menuPermissionManagementStrings';
import { toSafeNumber } from '../../../utils/safeDisplay';

/**
 * @param {object} props
 * @param {number} props.defaultCount
 * @param {number} props.centerCount
 * @param {number} [props.visibleCount]
 * @param {number} [props.totalCount]
 */
const MenuPermissionBadgeRail = ({
  defaultCount = 0,
  centerCount = 0,
  visibleCount = 0,
  totalCount = 0
}) => {
  const defaults = toSafeNumber(defaultCount);
  const centers = toSafeNumber(centerCount);
  const visible = toSafeNumber(visibleCount);
  const total = toSafeNumber(totalCount);

  return (
    <section
      className="menu-permission-rail"
      data-testid="menu-permission-rail"
      aria-label={MENU_PERM_RAIL.ARIA}
    >
      <div className="menu-permission-rail__body">
        <span className="menu-permission-rail__badge menu-permission-rail__badge--summary">
          {MENU_PERM_RAIL.VISIBLE_SUMMARY(visible, total)}
        </span>
        <span className="menu-permission-rail__sep" aria-hidden="true">
          ·
        </span>
        <span className="menu-permission-rail__badge menu-permission-rail__badge--default">
          {MENU_PERM_RAIL.DEFAULT_COUNT(defaults)}
        </span>
        <span className="menu-permission-rail__sep" aria-hidden="true">
          ·
        </span>
        <span className="menu-permission-rail__badge menu-permission-rail__badge--center">
          {MENU_PERM_RAIL.CENTER_COUNT(centers)}
        </span>
      </div>
    </section>
  );
};

MenuPermissionBadgeRail.propTypes = {
  defaultCount: PropTypes.number,
  centerCount: PropTypes.number,
  visibleCount: PropTypes.number,
  totalCount: PropTypes.number
};

export default MenuPermissionBadgeRail;
