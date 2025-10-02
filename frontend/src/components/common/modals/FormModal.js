import React from 'react';
import BaseModal from './BaseModal';
import '../../styles/main.css';

/**
 * 폼 모달 컴포넌트
 * 입력 폼이 있는 모달에 사용
 */
const FormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  title, 
  children, 
  size = "medium",
  submitText = "저장",
  cancelText = "취소",
  loading = false,
  submitType = "primary"
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      onSubmit?.(e);
    }
  };

  const getSubmitButtonClass = () => {
    const baseClass = 'mg-btn';
    const typeClass = `mg-btn--${submitType}`;
    const loadingClass = loading ? 'mg-btn--loading' : '';
    return [baseClass, typeClass, loadingClass].filter(Boolean).join(' ');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      type="form"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          {children}
        </div>
        
        <div className="mg-modal__actions">
          <button 
            type="button"
            className="mg-btn mg-btn--secondary" 
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            type="submit"
            className={getSubmitButtonClass()}
            disabled={loading}
          >
            {loading ? '저장중...' : submitText}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default FormModal;
