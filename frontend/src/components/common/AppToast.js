/**
 * AppToast — 전역 토스트 알림 컴포넌트
 *
 * 상단에서 슬라이드 다운, 타입별 좌측 컬러 바,
 * 자동 사라짐(progress bar), 수동 닫기.
 * ToastContext에서 토스트 목록을 구독하여 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import './AppToast.css';

const ICON_SIZE = 20;

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info
};

const AppToast = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="app-toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const [exiting, setExiting] = useState(false);
  const IconComponent = TOAST_ICONS[toast.type] || TOAST_ICONS.info;

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onClose(toast.id), 200);
  }, [toast.id, onClose]);

  useEffect(() => {
    const exitDelay = toast.duration - 200;
    if (exitDelay > 0) {
      const timer = setTimeout(() => setExiting(true), exitDelay);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  return (
    <div
      className={`app-toast app-toast--${toast.type} ${exiting ? 'app-toast--exit' : 'app-toast--enter'}`}
      role="alert"
    >
      <div className={`app-toast__accent app-toast__accent--${toast.type}`} />
      <div className="app-toast__body">
        <IconComponent size={ICON_SIZE} className={`app-toast__icon app-toast__icon--${toast.type}`} />
        <span className="app-toast__message">{toast.message}</span>
        <button
          type="button"
          className="app-toast__close"
          onClick={handleClose}
          aria-label="토스트 닫기"
        >
          <X size={16} />
        </button>
      </div>
      <div className="app-toast__progress-track">
        <div
          className={`app-toast__progress-bar app-toast__progress-bar--${toast.type}`}
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      </div>
    </div>
  );
};

export default AppToast;
