/**
 * GnbRight - GNB 우측 영역: 알림 + 빠른액션 + 프로필 (검색은 DesktopLayout 본문)
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import NotificationDropdown from './NotificationDropdown';
import QuickActionsDropdown from './QuickActionsDropdown';
import ProfileDropdown from './ProfileDropdown';
import './GnbRight.css';

const GnbRight = ({
  onLogout,
  onModalAction,
  navigateQuickActionsFromLnb
}) => {
  return (
    <div className="mg-v2-gnb-right">
      <div className="mg-v2-gnb-right__icons">
        <NotificationDropdown />
        <QuickActionsDropdown
          onModalAction={onModalAction}
          navigateQuickActionsFromLnb={navigateQuickActionsFromLnb}
        />
        <ProfileDropdown onLogout={onLogout} />
      </div>
    </div>
  );
};

GnbRight.propTypes = {
  onLogout: PropTypes.func,
  onModalAction: PropTypes.func,
  navigateQuickActionsFromLnb: PropTypes.array
};

export default GnbRight;
