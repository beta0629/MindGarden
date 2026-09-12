/**
 * MenuPermissionIosReviewBar — iOS에서 커뮤니티 숨기기/다시 보이기 원버튼
 * SSOT: docs/project-management/MENU_VISIBILITY_IOS_REVIEW_ONE_BUTTON_ORCHESTRATION_20260912.md
 *
 * @author CoreSolution
 * @since 2026-09-12
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { MENU_PERM_IOS_REVIEW } from '../../../constants/menuPermissionManagementStrings';

/**
 * QuietHeader 아래 1줄 — CLIENT/CONSULTANT 커뮤니티 canViewIos 일괄.
 *
 * @param {object} props
 * @param {boolean} props.enabled 심사 모드(iOS 숨김) 여부
 * @param {boolean} props.pending 요청 중
 * @param {(nextEnabled: boolean) => void} props.onToggle
 */
const MenuPermissionIosReviewBar = ({ enabled, pending, onToggle }) => {
  const nextEnabled = !enabled;
  const label = enabled ? MENU_PERM_IOS_REVIEW.SHOW : MENU_PERM_IOS_REVIEW.HIDE;
  const status = enabled
    ? MENU_PERM_IOS_REVIEW.STATUS_ON
    : MENU_PERM_IOS_REVIEW.STATUS_OFF;

  return (
    <section
      className="menu-permission-ios-review"
      aria-label={MENU_PERM_IOS_REVIEW.ARIA}
      data-testid="menu-permission-ios-review"
    >
      <div className="menu-permission-ios-review__copy">
        <p className="menu-permission-ios-review__title">
          {MENU_PERM_IOS_REVIEW.TITLE}
        </p>
        <p className="menu-permission-ios-review__hint">
          {MENU_PERM_IOS_REVIEW.HINT}
        </p>
        <p
          className="menu-permission-ios-review__status"
          data-testid="menu-permission-ios-review-status"
        >
          {status}
        </p>
      </div>
      <MGButton
        type="button"
        variant={enabled ? 'outline' : 'primary'}
        size="small"
        disabled={pending}
        loading={pending}
        className="menu-permission-ios-review__btn"
        onClick={() => onToggle(nextEnabled)}
        aria-label={label}
        data-testid="menu-permission-ios-review-btn"
      >
        {label}
      </MGButton>
    </section>
  );
};

MenuPermissionIosReviewBar.propTypes = {
  enabled: PropTypes.bool,
  pending: PropTypes.bool,
  onToggle: PropTypes.func.isRequired
};

MenuPermissionIosReviewBar.defaultProps = {
  enabled: false,
  pending: false
};

export default MenuPermissionIosReviewBar;
