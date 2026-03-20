/**
 * NotificationBadge - 알림 개수 배지 단일 소스 (Atom)
 * common/NotificationBadge는 레거시(모달 연동). 개수만 표시 시 본 컴포넌트 사용.
 * @author CoreSolution
 * @since 2026-03-09
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toSafeNumber } from '../../../utils/safeDisplay';
import './NotificationBadge.css';

const NotificationBadge = ({ count = 0 }) => {
  const n = toSafeNumber(count, 0);
  if (n <= 0) {
    return null;
  }

  const displayCount = n > 99 ? '99+' : n;
  const ariaLabel = n >= 100
    ? '읽지 않은 알림 99개 이상'
    : `읽지 않은 알림 ${n}개`;

  return (
    <span 
      className="mg-v2-notification-badge"
      aria-label={ariaLabel}
    >
      {displayCount}
    </span>
  );
};

NotificationBadge.propTypes = {
  count: PropTypes.number
};

export default NotificationBadge;
