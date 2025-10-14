/**
 * MindGarden 디자인 시스템 v2.0 - Toast Notification Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 * @reference http://localhost:3000/design-system (NotificationShowcase)
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast 알림 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.type - 알림 타입 ('success'|'error'|'warning'|'info')
 * @param {string} props.title - 알림 제목
 * @param {string} props.message - 알림 메시지
 * @param {Function} [props.onClose] - 닫기 콜백
 * @param {number} [props.duration=3000] - 자동 닫힘 시간 (ms), 0이면 수동 닫기만
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <Toast
 *   type="success"
 *   title="성공!"
 *   message="작업이 완료되었습니다."
 *   onClose={() => handleClose()}
 * />
 */
const Toast = ({
  type = 'info',
  title,
  message,
  onClose,
  duration = 3000,
  className = ''
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // 애니메이션 시간
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={24} />;
      case 'error': return <XCircle size={24} />;
      case 'warning': return <AlertTriangle size={24} />;
      case 'info': return <Info size={24} />;
      default: return <Info size={24} />;
    }
  };

  return (
    <div 
      className={`mg-notification mg-notification-${type} ${isClosing ? 'closing' : ''} ${className}`.trim()}
    >
      <div className="mg-notification-icon">
        {getIcon()}
      </div>
      <div className="mg-notification-content">
        <div className="mg-notification-title">{title}</div>
        <div className="mg-notification-message">{message}</div>
      </div>
      <button 
        className="mg-notification-close"
        onClick={handleClose}
        aria-label="닫기"
      >
        <X size={16} />
      </button>
    </div>
  );
};

/**
 * Toast Container 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.toasts - Toast 배열
 * @param {Function} props.onRemove - Toast 제거 콜백
 */
export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="mg-notification-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;

