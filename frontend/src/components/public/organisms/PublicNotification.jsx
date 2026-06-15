/**
 * PublicNotification — 공개 페이지 안내 토스트 알림 Organism
 *
 * 공개(Public) 페이지 전용 단일 인스턴스 토스트 SSOT.
 * props 외부 제어 방식 (queue 관리는 후속 확장).
 *
 * mg-v2-* 토큰 100% · 하드코딩 0 · 다크 모드 자동 지원
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './PublicNotification.css';

const NOTIFICATION_TYPES = Object.freeze({
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
});

const ICON_MAP = Object.freeze({
  [NOTIFICATION_TYPES.SUCCESS]: '✓',
  [NOTIFICATION_TYPES.WARNING]: '⚠',
  [NOTIFICATION_TYPES.ERROR]: '✕',
  [NOTIFICATION_TYPES.INFO]: 'ℹ',
});

const ARIA_ROLE_MAP = Object.freeze({
  [NOTIFICATION_TYPES.SUCCESS]: 'status',
  [NOTIFICATION_TYPES.WARNING]: 'alert',
  [NOTIFICATION_TYPES.ERROR]: 'alert',
  [NOTIFICATION_TYPES.INFO]: 'status',
});

const ARIA_LIVE_MAP = Object.freeze({
  [NOTIFICATION_TYPES.SUCCESS]: 'polite',
  [NOTIFICATION_TYPES.WARNING]: 'assertive',
  [NOTIFICATION_TYPES.ERROR]: 'assertive',
  [NOTIFICATION_TYPES.INFO]: 'polite',
});

const DEFAULT_AUTO_DISMISS_MS = 5000;

const PublicNotification = ({
  type = NOTIFICATION_TYPES.INFO,
  messageSlot,
  actionSlot,
  autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
  onClose,
}) => {
  const [phase, setPhase] = useState('entering');
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  const handleClose = useCallback(() => {
    setPhase('exiting');
    const duration = 300;
    setTimeout(() => {
      if (typeof onClose === 'function') {
        onClose();
      }
    }, duration);
  }, [onClose]);

  useEffect(() => {
    const enterTimeout = setTimeout(() => {
      setPhase('visible');
    }, 50);
    return () => clearTimeout(enterTimeout);
  }, []);

  useEffect(() => {
    if (autoDismissMs > 0 && phase === 'visible') {
      timerRef.current = setTimeout(handleClose, autoDismissMs);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [autoDismissMs, handleClose, phase]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const role = ARIA_ROLE_MAP[type] || 'status';
  const ariaLive = ARIA_LIVE_MAP[type] || 'polite';
  const icon = ICON_MAP[type] || 'ℹ';

  const containerClassName = [
    'mg-v2-public-notification',
    `mg-v2-public-notification--${type}`,
    phase === 'entering' ? 'mg-v2-public-notification--entering' : '',
    phase === 'exiting' ? 'mg-v2-public-notification--exiting' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      data-testid="mg-v2-public-notification"
    >
      <span className="mg-v2-public-notification__icon" aria-hidden="true">
        {icon}
      </span>

      <div className="mg-v2-public-notification__body">
        <div className="mg-v2-public-notification__message">
          {messageSlot}
        </div>
        {actionSlot && (
          <div className="mg-v2-public-notification__action">
            {actionSlot}
          </div>
        )}
      </div>

      <button
        type="button"
        className="mg-v2-public-notification__close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

PublicNotification.propTypes = {
  type: PropTypes.oneOf([
    NOTIFICATION_TYPES.SUCCESS,
    NOTIFICATION_TYPES.WARNING,
    NOTIFICATION_TYPES.ERROR,
    NOTIFICATION_TYPES.INFO,
  ]),
  messageSlot: PropTypes.node,
  actionSlot: PropTypes.node,
  autoDismissMs: PropTypes.number,
  onClose: PropTypes.func,
};


export default PublicNotification;
export { NOTIFICATION_TYPES, ICON_MAP, ARIA_ROLE_MAP };
