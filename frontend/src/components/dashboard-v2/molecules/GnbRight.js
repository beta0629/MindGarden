/**
 * GnbRight - GNB 우측 영역: 검색바 + 알림 + 빠른액션 + 프로필
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SearchInput } from '../atoms';
import NotificationDropdown from './NotificationDropdown';
import QuickActionsDropdown from './QuickActionsDropdown';
import ProfileDropdown from './ProfileDropdown';
import './GnbRight.css';

const GnbRight = ({
  searchValue = '',
  onSearchChange,
  onLogout,
  onModalAction,
  navigateQuickActionsFromLnb
}) => {
  return (
    <div className="mg-v2-gnb-right">
      <SearchInput value={searchValue} onChange={onSearchChange} />
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
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  onLogout: PropTypes.func,
  onModalAction: PropTypes.func,
  navigateQuickActionsFromLnb: PropTypes.array
};

export default GnbRight;
