import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import UnifiedModal from './modals/UnifiedModal';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';

/**
 * 확인 모달 컴포넌트 (단일 소스)
 * 알럿창 대신 사용할 커스텀 모달 (UnifiedModal 기반)
 * common/modals/ConfirmModal.js는 본 파일 re-export만 제공.
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message = '정말로 진행하시겠습니까?',
  confirmText = '확인',
  cancelText = '취소',
  type = 'default' // default, danger, warning, success
}) => {
  const { setModalOpen } = useSession();
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen !== prevIsOpenRef.current) {
      setModalOpen(isOpen);
      prevIsOpenRef.current = isOpen;
    }
  }, [isOpen, setModalOpen]);

  useEffect(() => {
    return () => setModalOpen(false);
  }, []);

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={48} className="mg-v2-color-danger" />;
      case 'warning':
        return <AlertCircle size={48} className="mg-v2-color-warning" />;
      case 'success':
        return <CheckCircle size={48} className="mg-v2-color-success" />;
      default:
        return <HelpCircle size={48} className="mg-v2-color-primary" />;
    }
  };

  const getConfirmVariant = () => {
    switch (type) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  const confirmVariant = getConfirmVariant();
  const confirmMgV2ClassName =
    confirmVariant === 'warning'
      ? buildErpMgButtonClassName({
        variant: 'primary',
        size: 'md',
        loading: false,
        className: 'mg-v2-button--warning'
      })
      : buildErpMgButtonClassName({ variant: confirmVariant, size: 'md', loading: false });

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      showCloseButton={true}
      backdropClick={true}
      actions={
        <>
          <MGButton
            type="button"
            variant="secondary"
            size="medium"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onClose}
          >
            {cancelText}
          </MGButton>
          <MGButton
            type="button"
            variant={confirmVariant}
            size="medium"
            className={confirmMgV2ClassName}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleConfirm}
          >
            {confirmText}
          </MGButton>
        </>
      }
    >
      <div className="mg-v2-empty-state">
        {getIcon()}
        <p className="mg-v2-text-base mg-v2-mt-md">{message}</p>
      </div>
    </UnifiedModal>
  );
};

export default ConfirmModal;
