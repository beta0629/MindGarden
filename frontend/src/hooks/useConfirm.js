import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../components/common/modals/UnifiedModal';
import MGButton from '../components/common/MGButton';

/**
 * 확인 모달 훅
 *
 * 사용 예시:
 *   const [confirm, ConfirmModal] = useConfirm();
 *
 *   // 컴포넌트 JSX 안에서:
 *   <ConfirmModal />
 *
 *   // 이벤트 핸들러 안에서:
 *   const confirmed = await confirm({ messageKey: 'admin.consultant.confirmSuspend.message', variant: 'warning' });
 *   if (confirmed) { ... }
 *
 * @param {Object} [defaultOptions]
 * @param {string} [defaultOptions.titleKey='common.modal.confirm.defaultTitle']
 * @param {string} [defaultOptions.messageKey='common.modal.confirm.defaultMessage']
 * @param {string} [defaultOptions.confirmLabelKey='common.modal.confirm.defaultConfirmButton']
 * @param {string} [defaultOptions.cancelLabelKey='common.modal.confirm.defaultCancelButton']
 * @param {'info'|'warning'|'danger'|'success'} [defaultOptions.variant='info']
 * @param {Record<string, unknown>} [defaultOptions.interpolation]
 * @returns {[function(options?): Promise<boolean>, React.FC]}
 */
function useConfirm(defaultOptions = {}) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({});
  const resolverRef = useRef(null);

  /**
   * @param {Object} [callOptions]
   * @param {string} [callOptions.titleKey]
   * @param {string} [callOptions.title] 직접 타이틀(키보다 우선)
   * @param {string} [callOptions.messageKey]
   * @param {import('react').ReactNode} [callOptions.message] 직접 메시지(키보다 우선, ReactNode 가능)
   * @param {string} [callOptions.confirmLabelKey]
   * @param {string} [callOptions.confirmLabel] 직접 확인 라벨(키보다 우선)
   * @param {string} [callOptions.cancelLabelKey]
   * @param {string} [callOptions.cancelLabel] 직접 취소 라벨(키보다 우선)
   * @param {'info'|'warning'|'danger'|'success'} [callOptions.variant]
   * @param {Record<string, unknown>} [callOptions.interpolation]
   * @returns {Promise<boolean>}
   */
  const confirm = useCallback((callOptions = {}) => {
    const merged = { ...defaultOptions, ...callOptions };
    setOptions(merged);
    setIsOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, [defaultOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolverRef.current?.(true);
    resolverRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, []);

  const getVariantTitleKey = (variant) => {
    const map = {
      info: 'modal.info.defaultTitle',
      warning: 'modal.warning.defaultTitle',
      danger: 'modal.danger.defaultTitle',
      success: 'modal.success.defaultTitle'
    };
    return map[variant] || 'modal.confirm.defaultTitle';
  };

  const getVariantConfirmLabelKey = (variant) => {
    const map = {
      info: 'modal.confirm.defaultConfirmButton',
      warning: 'modal.warning.defaultConfirmButton',
      danger: 'modal.danger.defaultConfirmButton',
      success: 'modal.confirm.defaultConfirmButton'
    };
    return map[variant] || 'modal.confirm.defaultConfirmButton';
  };

  const variant = options.variant || 'info';

  const titleKey = options.titleKey || getVariantTitleKey(variant);
  const messageKey = options.messageKey || 'modal.confirm.defaultMessage';
  const confirmLabelKey = options.confirmLabelKey || getVariantConfirmLabelKey(variant);
  const cancelLabelKey = options.cancelLabelKey || 'modal.confirm.defaultCancelButton';
  const interpolation = options.interpolation || {};

  const title = options.title != null ? options.title : t(titleKey, { ...interpolation });
  const message = options.message != null ? options.message : t(messageKey, { ...interpolation });
  const confirmLabel = options.confirmLabel != null
    ? options.confirmLabel
    : t(confirmLabelKey, { ...interpolation });
  const cancelLabel = options.cancelLabel != null
    ? options.cancelLabel
    : t(cancelLabelKey, { ...interpolation });

  const ConfirmModal = useCallback(() => (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="small"
      variant="confirm"
      backdropClick={false}
      actions={
        <>
          <MGButton
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            {cancelLabel}
          </MGButton>
          <MGButton
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </MGButton>
        </>
      }
    >
      <div className="confirm-modal-body">{message}</div>
    </UnifiedModal>
  ), [isOpen, title, message, confirmLabel, cancelLabel, variant, handleConfirm, handleCancel]);

  return [confirm, ConfirmModal];
}

export { useConfirm };
export default useConfirm;
