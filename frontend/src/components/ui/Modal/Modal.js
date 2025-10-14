/**
 * MindGarden 디자인 시스템 v2.0 - Modal Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 * @reference /docs/design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md (Modal 섹션)
 * @reference http://localhost:3000/design-system (ModalShowcase)
 * 
 * ⚠️ 중요: ReactDOM.createPortal 사용 필수 (z-index 문제 방지)
 */

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

/**
 * 재사용 가능한 모달 컴포넌트 (Portal 사용)
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 표시 여부
 * @param {Function} props.onClose - 모달 닫기 콜백
 * @param {string} [props.title] - 모달 제목
 * @param {React.ReactNode} props.children - 모달 내용
 * @param {React.ReactNode} [props.footer] - 모달 푸터 (버튼 등)
 * @param {boolean} [props.showCloseButton=true] - 닫기 버튼 표시 여부
 * @param {boolean} [props.closeOnOverlay=true] - Overlay 클릭 시 닫기
 * @param {string} [props.size='medium'] - 모달 크기 ('small'|'medium'|'large')
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="모달 제목"
 *   footer={<>
 *     <Button variant="outline" onClick={onCancel}>취소</Button>
 *     <Button variant="primary" onClick={onConfirm}>확인</Button>
 *   </>}
 * >
 *   모달 내용
 * </Modal>
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  showCloseButton = true,
  closeOnOverlay = true,
  size = 'medium',
  className = '',
}) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = size !== 'medium' ? `mg-modal--${size}` : '';

  return ReactDOM.createPortal(
    <div 
      className="mg-modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div 
        className={`mg-modal ${sizeClass} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="mg-modal-header">
            {title && <h3 className="mg-modal-title">{title}</h3>}
            {showCloseButton && (
              <button 
                className="mg-modal-close"
                onClick={onClose}
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="mg-modal-body">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="mg-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;

