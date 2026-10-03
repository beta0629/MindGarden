/**
 * NotificationToastItem — UnifiedNotification 토스트 한 건
 *
 * 자동 닫힘 타이머와 진행바를 같은 duration 으로 돌리고,
 * 마우스 hover·키보드 focus 동안 둘 다 멈춘다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../utils/safeDisplay';
import { resolveNotificationDuration } from '../../utils/notificationDuration';
import NotificationCloseButton from './NotificationCloseButton';

export const NOTIFICATION_PROGRESS_DURATION_VAR = '--notification-progress-duration';

const NotificationToastItem = ({
  notification,
  variant,
  icon,
  autoClose,
  closeLabel,
  onDismiss
}) => {
  const toastType = notification.type || variant;
  const duration = notification.duration > 0
    ? notification.duration
    : resolveNotificationDuration(notification.message, toastType);

  const [paused, setPaused] = useState(false);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!autoClose) return;
    clearTimer();
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onDismissRef.current(notification.id);
    }, remainingRef.current);
  }, [autoClose, clearTimer, notification.id]);

  const pauseTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearTimer();
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  }, [clearTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const syncPause = useCallback(() => {
    const shouldPause = hoveredRef.current || focusedRef.current;
    setPaused(shouldPause);
    if (shouldPause) {
      pauseTimer();
    } else if (!timerRef.current) {
      startTimer();
    }
  }, [pauseTimer, startTimer]);

  const handleBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    focusedRef.current = false;
    syncPause();
  };

  const className = [
    'mg-notification',
    'mg-notification--toast',
    `mg-notification--${toastType}`,
    paused ? 'mg-notification--paused' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      role={toastType === 'error' ? 'alert' : 'status'}
      data-testid="mg-notification-toast"
      onClick={() => onDismiss(notification.id)}
      onMouseEnter={() => {
        hoveredRef.current = true;
        syncPause();
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
        syncPause();
      }}
      onFocus={() => {
        focusedRef.current = true;
        syncPause();
      }}
      onBlur={handleBlur}
    >
      <div className="mg-notification-content">
        <div className="mg-notification-icon">{icon}</div>
        <div className="mg-notification-message">
          {toDisplayString(notification.message)}
        </div>
      </div>
      <NotificationCloseButton
        label={closeLabel}
        onClick={() => onDismiss(notification.id)}
      />
      <div className="mg-notification-progress">
        <div
          className="mg-notification-progress-bar"
          style={{ [NOTIFICATION_PROGRESS_DURATION_VAR]: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

NotificationToastItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    type: PropTypes.string,
    message: PropTypes.any,
    duration: PropTypes.number
  }).isRequired,
  variant: PropTypes.string,
  icon: PropTypes.node,
  autoClose: PropTypes.bool,
  closeLabel: PropTypes.string.isRequired,
  onDismiss: PropTypes.func.isRequired
};

export default NotificationToastItem;
