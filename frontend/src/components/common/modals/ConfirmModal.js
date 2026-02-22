import React from 'react';
import UnifiedModal from './UnifiedModal';
import '../../styles/main.css';

/**
 * 확인 모달 컴포넌트 (modals 패키지)
 * BaseModal 대신 UnifiedModal 사용
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message = '정말로 진행하시겠습니까?',
  confirmText = '확인',
  cancelText = '취소',
  type = 'primary',
  size = 'small',
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
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      variant="confirm"
      loading={loading}
      actions={
        <>
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
        </>
      }
    >
      <div className="mg-v2-mb-lg">
        <p className="mg-v2-text-base mg-v2-m-0" style={{ lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
    </UnifiedModal>
  );
};

export default ConfirmModal;
