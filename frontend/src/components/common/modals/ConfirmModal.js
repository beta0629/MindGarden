import React from 'react';
import BaseModal from './BaseModal';
import '../../styles/main.css';

/**
 * 확인 모달 컴포넌트
 * 사용자 확인이 필요한 작업에 사용
 */
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "확인", 
  message = "정말로 진행하시겠습니까?",
  confirmText = "확인",
  cancelText = "취소",
  type = "primary", // primary, danger, warning, success
  size = "small",
  loading = false
}) => {
  const handleConfirm = () => {
    if (!loading) {
      onConfirm?.();
      onClose?.();
    }
  };

  const getButtonClass = () => {
    const baseClass = 'mg-btn';
    const typeClass = `mg-btn--${type}`;
    const loadingClass = loading ? 'mg-btn--loading' : '';
    return [baseClass, typeClass, loadingClass].filter(Boolean).join(' ');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      type="confirm"
      stackLevel={2}
      showCloseButton={false}
    >
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-base)', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      
      <div className="mg-modal__actions">
        <button 
          className="mg-btn mg-btn--secondary" 
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </button>
        <button 
          className={getButtonClass()}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? '처리중...' : confirmText}
        </button>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;
