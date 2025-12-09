import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';

/**
 * 컴팩트 확인 모달 컴포넌트
 * 로그아웃 같은 간단한 확인 작업에 사용하는 작은 크기 모달
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림/닫힘 상태
 * @param {function} props.onClose - 모달 닫기 핸들러
 * @param {function} props.onConfirm - 확인 버튼 클릭 핸들러
 * @param {string} props.title - 모달 제목
 * @param {string} props.message - 확인 메시지
 * @param {string} props.confirmText - 확인 버튼 텍스트
 * @param {string} props.cancelText - 취소 버튼 텍스트
 * @param {string} props.type - 모달 타입 (default, danger)
 */
const CompactConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "확인", 
  message = "정말로 진행하시겠습니까?", 
  confirmText = "확인", 
  cancelText = "취소",
  type = "default" // default, danger
}) => {
  const { setModalOpen } = useSession();
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    // isOpen이 변경되었을 때만 setModalOpen 호출 (무한 루프 방지)
    if (isOpen !== prevIsOpenRef.current) {
      setModalOpen(isOpen);
      if (isOpen) {
        console.log('📱 컴팩트 확인 모달 열림 - 세션 체크 일시 중단');
      } else {
        console.log('📱 컴팩트 확인 모달 닫힘 - 세션 체크 재개');
      }
      prevIsOpenRef.current = isOpen;
    }
  }, [isOpen, setModalOpen]);

  // 컴포넌트 언마운트 시에만 세션 체크 재개
  useEffect(() => {
    return () => {
      setModalOpen(false);
      console.log('📱 컴팩트 확인 모달 언마운트 - 세션 체크 재개');
    };
  }, []);

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

  const getConfirmButtonClass = () => {
    return type === 'danger' 
      ? 'mg-v2-button mg-v2-button--danger'
      : 'mg-v2-button mg-v2-button--primary';
  };

  const portalTarget = document.body || document.createElement('div');

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={handleOverlayClick}>
      <div 
        className="mg-v2-modal" 
        style={{
          maxWidth: '360px',
          width: 'auto',
          padding: '20px',
          minWidth: '280px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mg-v2-modal-header" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border-light)' }}>
          <h2 className="mg-v2-modal-title" style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
            {title}
          </h2>
          <button 
            className="mg-v2-modal-close" 
            onClick={onClose} 
            aria-label="닫기"
            style={{ padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="mg-v2-modal-body" style={{ marginBottom: '16px', padding: '8px 0' }}>
          <p style={{ 
            textAlign: 'center', 
            margin: 0, 
            fontSize: '14px', 
            color: 'var(--color-text-secondary)',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>
        
        <div className="mg-v2-modal-footer" style={{ marginTop: 0, paddingTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button 
            className="mg-v2-button mg-v2-button--secondary"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            {cancelText}
          </button>
          <button 
            className={getConfirmButtonClass()}
            onClick={handleConfirm}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default CompactConfirmModal;

