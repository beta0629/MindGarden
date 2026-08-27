/**
 * TenantHeaderCluster - GNB 테넌트 헤더 우측 클러스터 (Molecule)
 * identity(비버튼 표시) + chevron 메뉴 트리거만 분리 — NavIcon/EntityRowActions 미사용
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import PropTypes from 'prop-types';
import { ProfileAvatar } from '../atoms';
import SafeText from '../../common/SafeText';
import SessionRemainingLabel from '../../common/SessionRemainingLabel';
import { SESSION_REMAINING_DISPLAY } from '../../../constants/session';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import './TenantHeaderCluster.css';

const PROFILE_MENU_TRIGGER_ARIA_LABEL = '프로필 메뉴';

const handleMenuTriggerKeyDown = (event, onToggle) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onToggle();
  }
};

const TenantHeaderCluster = ({
  userName,
  avatarImageUrl,
  isOpen,
  onToggle,
  triggerRef,
  panelId
}) => {
  const ChevronDown = ICONS.CHEVRON_DOWN;

  return (
    <div className="mg-v2-tenant-header-cluster">
      <div className="mg-v2-tenant-header-cluster__identity">
        <ProfileAvatar name={userName} imageUrl={avatarImageUrl} size="small" />
        <div className="mg-v2-tenant-header-cluster__text">
          <span className="mg-v2-tenant-header-cluster__name">
            <SafeText fallback="사용자">{userName}</SafeText>
          </span>
          <SessionRemainingLabel
            className={`${SESSION_REMAINING_DISPLAY.CLASS_NAME}--gnb-trigger`}
          />
        </div>
      </div>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        className="mg-v2-tenant-header-cluster__menu-trigger"
        data-gnb-chrome-free="true"
        aria-label={PROFILE_MENU_TRIGGER_ARIA_LABEL}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={(event) => handleMenuTriggerKeyDown(event, onToggle)}
      >
        <ChevronDown size={ICON_SIZES.MD} strokeWidth={2} aria-hidden="true" />
      </span>
    </div>
  );
};

TenantHeaderCluster.propTypes = {
  userName: PropTypes.string.isRequired,
  avatarImageUrl: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  triggerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]),
  panelId: PropTypes.string.isRequired
};

export default TenantHeaderCluster;
