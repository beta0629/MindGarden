import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import UnifiedModal from './modals/UnifiedModal';

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

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'mg-v2-button--danger';
      case 'warning':
        return 'mg-v2-button--warning';
      case 'success':
        return 'mg-v2-button--success';
      default:
        return 'mg-v2-button--primary';
    }
  };

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
          <button
            className="mg-v2-button mg-v2-button--secondary"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={`mg-v2-button ${getConfirmButtonClass()}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
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
