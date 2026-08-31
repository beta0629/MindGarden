import React from 'react';
import UnifiedModal from './UnifiedModal';
import ModalFormActions from './ModalFormActions';
import '../../../styles/main.css';
import './FormModal.css';

const SUBMIT_VARIANTS = new Set(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'outline']);

/**
 * 폼 모달 컴포넌트 - UnifiedModal 기반
 * 입력 폼이 있는 모달에 사용. 푸터는 ModalFormActions(ghost+primary) SSOT.
 */
const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  size = 'auto',
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

  const submitVariant = SUBMIT_VARIANTS.has(submitType) ? submitType : 'primary';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      variant="form"
      loading={loading}
      actions={(
        <ModalFormActions
          cancelText={cancelText}
          submitText={submitText}
          onCancel={onClose}
          onSubmit={handleSubmit}
          loading={loading}
          cancelVariant="ghost"
          submitVariant={submitVariant}
        />
      )}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-modal__body">
          {children}
        </div>
      </form>
    </UnifiedModal>
  );
};

export default FormModal;
