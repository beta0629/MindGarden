import React from 'react';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import UnifiedModal from './UnifiedModal';
import MGButton from '../MGButton';
import '../../../styles/main.css';

const SUBMIT_VARIANTS = new Set(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'outline']);

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
      actions={
        <>
          <MGButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className={buildErpMgButtonClassName({
              variant: 'secondary',
              size: 'md',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            {cancelText}
          </MGButton>
          <MGButton
            type="button"
            variant={submitVariant}
            onClick={handleSubmit}
            disabled={loading}
            loading={loading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            className={buildErpMgButtonClassName({
              variant: submitVariant,
              size: 'md',
              loading
            })}
          >
            {submitText}
          </MGButton>
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
