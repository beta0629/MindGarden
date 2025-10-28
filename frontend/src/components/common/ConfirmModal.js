import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XCircle, AlertTriangle, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';

/**
 * 확인 모달 컴포넌트
 * 알럿창 대신 사용할 커스텀 모달
 */
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "확인", 
  message = "정말로 진행하시겠습니까?", 
  confirmText = "확인", 
  cancelText = "취소",
  type = "default" // default, danger, warning, success
}) => {
  const { setModalOpen } = useSession();

  useEffect(() => {
    if (isOpen) {
      setModalOpen(true);
      console.log('📱 확인 모달 열림 - 세션 체크 일시 중단');
    } else {
      setModalOpen(false);
      console.log('📱 확인 모달 닫힘 - 세션 체크 재개');
    }

    return () => {
      setModalOpen(false);
      console.log('📱 확인 모달 언마운트 - 세션 체크 재개');
    };
  }, [isOpen]); // setModalOpen 제거하여 무한 리렌더링 방지

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
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
        return 'mg-v2-btn--danger';
      case 'warning':
        return 'mg-v2-btn--warning';
      case 'success':
        return 'mg-v2-btn--success';
      default:
        return 'mg-v2-btn--primary';
    }
  };

  const portalTarget = document.body || document.createElement('div');

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={handleOverlayClick}>
      <div className="mg-v2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <h2 className="mg-v2-modal-title">{title}</h2>
          </div>
          <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="mg-v2-modal-body">
          <div className="mg-v2-empty-state">
            {getIcon()}
            <p className="mg-v2-text-base mg-v2-mt-md">{message}</p>
          </div>
        </div>
        
        <div className="mg-v2-modal-footer">
          <button 
            className="mg-v2-btn mg-v2-btn--secondary"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`mg-v2-btn ${getConfirmButtonClass()}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default ConfirmModal;
