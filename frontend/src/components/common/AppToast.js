/**
 * AppToast — 전역 토스트 알림 컴포넌트
 *
 * 우상단 카드. 아이콘 타일은 알림 카드와 같은 중립색, 상태는 왼쪽 띠만.
 * 자동 사라짐, 수동 닫기.
 * ToastContext에서 토스트 목록을 구독하여 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import '../notifications/NotificationListCard.css';
import './AppToast.css';

const ICON_SIZE = 20;
const EXIT_ANIMATION_MS = 200;

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info
};

const AppToast = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="app-toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const [exiting, setExiting] = useState(false);
  const IconComponent = TOAST_ICONS[toast.type] || TOAST_ICONS.info;
  const toneClass = TOAST_ICONS[toast.type] ? toast.type : 'info';

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onClose(toast.id), EXIT_ANIMATION_MS);
  }, [toast.id, onClose]);

  useEffect(() => {
    const exitDelay = toast.duration - EXIT_ANIMATION_MS;
    if (exitDelay > 0) {
      const timer = setTimeout(() => setExiting(true), exitDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast.duration]);

  return (
    <div
      className={`app-toast app-toast--${toneClass} ${exiting ? 'app-toast--exit' : 'app-toast--enter'}`}
      role={toneClass === 'error' ? 'alert' : 'status'}
    >
      <span className="notif-card__icon" aria-hidden="true">
        <IconComponent size={ICON_SIZE} />
      </span>
      <div className="app-toast__body">
        <span className="notif-card__title">{toast.message}</span>
      </div>
      <button
        type="button"
        className="app-toast__close"
        onClick={handleClose}
        aria-label="토스트 닫기"
      >
        <X size={ICON_SIZE} />
      </button>
    </div>
  );
};

export default AppToast;
