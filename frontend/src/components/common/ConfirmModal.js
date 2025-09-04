import React, { useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import './ConfirmModal.css';

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

  return (
    <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div className="confirm-modal-container">
        <div className="confirm-modal-header">
          <h3 className="confirm-modal-title">{title}</h3>
          <button className="confirm-modal-close" onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </div>
        
        <div className="confirm-modal-body">
          <div className="confirm-modal-icon">
            {type === 'danger' && <i className="bi bi-exclamation-triangle-fill"></i>}
            {type === 'warning' && <i className="bi bi-exclamation-circle-fill"></i>}
            {type === 'success' && <i className="bi bi-check-circle-fill"></i>}
            {type === 'default' && <i className="bi bi-question-circle-fill"></i>}
          </div>
          <p className="confirm-modal-message">{message}</p>
        </div>
        
        <div className="confirm-modal-footer">
          <button 
            className="confirm-modal-btn confirm-modal-btn-cancel" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-modal-btn confirm-modal-btn-confirm confirm-modal-btn-${type}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
