import React from 'react';
import UnifiedModal from './UnifiedModal';
import '../../styles/main.css';

/**
 * 폼 모달 컴포넌트 - UnifiedModal 기반
 * 입력 폼이 있는 모달에 사용
 */
const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  size = 'medium',
  submitText = '저장',
  cancelText = '취소',
  loading = false,
  submitType = 'primary'
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
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      variant="form"
      loading={loading}
      actions={
        <>
          <button
            type="button"
            className="mg-btn mg-btn--secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={getSubmitButtonClass()}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '저장중...' : submitText}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          {children}
        </div>
      </form>
    </UnifiedModal>
  );
};

export default FormModal;
