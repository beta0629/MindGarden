import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../components/common/modals/UnifiedModal';
import MGButton from '../components/common/MGButton';

/**
 * 알림 모달 훅
 *
 * 사용 예시:
 *   const [alert, AlertModal] = useAlert();
 *
 *   // 컴포넌트 JSX 안에서:
 *   <AlertModal />
 *
 *   // 이벤트 핸들러 안에서:
 *   await alert({ variant: 'success', messageKey: 'admin.permission.saveSuccess' });
 *
 * @param {Object} [defaultOptions]
 * @param {string} [defaultOptions.titleKey]                 미지정 시 variant 기본 제목 사용
 * @param {string} [defaultOptions.messageKey]               필수 (또는 message 문자열 직접)
 * @param {string} [defaultOptions.confirmLabelKey='common.modal.alert.defaultConfirmButton']
 * @param {'info'|'warning'|'danger'|'success'} [defaultOptions.variant='info']
 * @param {Record<string, unknown>} [defaultOptions.interpolation]
 * @returns {[function(options?): Promise<void>, React.FC]}
 */
function useAlert(defaultOptions = {}) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({});
  const resolverRef = useRef(null);

  /**
   * @param {Object} [callOptions]
   * @param {string} [callOptions.titleKey]
   * @param {string} [callOptions.messageKey]
   * @param {string} [callOptions.message]                   messageKey 대신 직접 문자열
   * @param {string} [callOptions.confirmLabelKey]
   * @param {'info'|'warning'|'danger'|'success'} [callOptions.variant]
   * @param {Record<string, unknown>} [callOptions.interpolation]
   * @returns {Promise<void>}
   */
  const alert = useCallback((callOptions = {}) => {
    const merged = { ...defaultOptions, ...callOptions };
    setOptions(merged);
    setIsOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, [defaultOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resolverRef.current?.();
    resolverRef.current = null;
  }, []);

  const getVariantTitleKey = (variant) => {
    const map = {
      info: 'modal.info.defaultTitle',
      warning: 'modal.warning.defaultTitle',
      danger: 'modal.danger.defaultTitle',
      success: 'modal.success.defaultTitle',
    };
    return map[variant] || 'modal.alert.defaultTitle';
  };

  const variant = options.variant || 'info';
  const titleKey = options.titleKey || getVariantTitleKey(variant);
  const messageKey = options.messageKey || 'modal.alert.defaultMessage';
  const confirmLabelKey = options.confirmLabelKey || 'modal.alert.defaultConfirmButton';
  const interpolation = options.interpolation || {};

  const title = t(titleKey, { ...interpolation });
  const message = options.message || t(messageKey, { ...interpolation });
  const confirmLabel = t(confirmLabelKey, { ...interpolation });

  const AlertModal = useCallback(() => (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="small"
      variant="alert"
      backdropClick={false}
      actions={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <MGButton
            type="button"
            variant="primary"
            onClick={handleClose}
          >
            {confirmLabel}
          </MGButton>
        </div>
      }
    >
      <p>{message}</p>
    </UnifiedModal>
  ), [isOpen, title, message, confirmLabel, handleClose]);

  return [alert, AlertModal];
}

export { useAlert };
export default useAlert;
