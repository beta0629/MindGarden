/**
 * NotificationBadge - 알림 개수 배지 단일 소스 (Atom)
 * common/NotificationBadge는 레거시(모달 연동). 개수만 표시 시 본 컴포넌트 사용.
 * @author CoreSolution
 * @since 2026-03-09
 */

import React from 'react';
import PropTypes from 'prop-types';
import './NotificationBadge.css';

const NotificationBadge = ({ count = 0 }) => {
  if (count <= 0) {
    return null;
  }

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span 
      className="mg-v2-notification-badge"
      aria-label={`읽지 않은 알림 ${count}개`}
    >
      {displayCount}
    </span>
  );
};

NotificationBadge.propTypes = {
  count: PropTypes.number
};

export default NotificationBadge;
