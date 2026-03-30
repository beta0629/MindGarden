import React from 'react';
import UnifiedModal from './UnifiedModal';

/**
 * 기본 모달 컴포넌트 - UnifiedModal 래퍼
 * 기존 BaseModal API 호환 (사용 권장: UnifiedModal 직접 사용)
 *
 * @deprecated UnifiedModal을 직접 사용하세요.
 */
const BaseModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  type = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  stackLevel = 1
}) => {
  const zIndex = stackLevel > 1 ? 1000 + stackLevel * 10 : undefined;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      variant={type !== 'default' ? type : 'default'}
      showCloseButton={showCloseButton}
      backdropClick={closeOnOverlayClick}
      className={className}
      zIndex={zIndex}
    >
      {children}
    </UnifiedModal>
  );
};

export default BaseModal;
