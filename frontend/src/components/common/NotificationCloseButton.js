/**
 * NotificationCloseButton — 토스트·배너 전용 닫기(×) 아이콘 버튼
 *
 * MGButton 의 size/!important box model 과 좁은 화면 .mg-button 전폭 규칙을 받지 않도록
 * 일반 button + mg-notification-close 클래스만 쓴다.
 * data-gnb-chrome-free: 모바일 전역 button:not(...) { padding·min-height !important } 의 제외 훅.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

export const NOTIFICATION_CLOSE_ICON_SIZE = 16;
const NOTIFICATION_CLOSE_ICON_STROKE = 2;

const NotificationCloseButton = ({ label, onClick, className = '' }) => (
  <button
    type="button"
    className={['mg-notification-close', className].filter(Boolean).join(' ')}
    aria-label={label}
    data-gnb-chrome-free="true"
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(e);
    }}
  >
    <X
      size={NOTIFICATION_CLOSE_ICON_SIZE}
      strokeWidth={NOTIFICATION_CLOSE_ICON_STROKE}
      aria-hidden="true"
      focusable="false"
    />
  </button>
);

NotificationCloseButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default NotificationCloseButton;
