import React from 'react';
import UnifiedModal from './modals/UnifiedModal';
import './IPhone17Modal.css';

const VARIANT_TO_SIZE = {
  default: 'auto',
  content: 'auto',
  fullscreen: 'fullscreen',
  'side-sheet': 'auto',
  alert: 'small'
};

const VARIANT_TO_UNIFIED_VARIANT = {
  alert: 'alert',
  default: 'default',
  content: 'default',
  fullscreen: 'default',
  'side-sheet': 'default'
};

/**
 * iPhone 17 디자인 언어를 적용한 모달 (오버레이는 UnifiedModal 단일 경로)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} props.children
 * @param {string} [props.variant] default | content | fullscreen | side-sheet | alert
 * @param {string} [props.className] UnifiedModal에 전달 (오버레이·쉘 공통)
 * @param {Object} [props.style] 오버레이(포털 루트)에 전달
 * @param {boolean} [props.closeOnOverlayClick]
 * @param {boolean} [props.showCloseButton]
 * @param {React.ReactNode} [props.footer] → UnifiedModal actions
 */
const IPhone17Modal = ({
  isOpen,
  onClose,
  title,
  subtitle = '',
  children,
  variant = 'default',
  className = '',
  style,
  closeOnOverlayClick = true,
  showCloseButton = true,
  footer,
  ...rest
}) => {
  const size = VARIANT_TO_SIZE[variant] || 'auto';
  const unifiedVariant = VARIANT_TO_UNIFIED_VARIANT[variant] || 'default';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      variant={unifiedVariant}
      backdropClick={closeOnOverlayClick}
      showCloseButton={showCloseButton}
      actions={footer}
      className={className}
      style={style}
      data-iphone17-modal="true"
      data-iphone17-variant={variant}
      {...rest}
    >
      {children}
    </UnifiedModal>
  );
};

export default IPhone17Modal;
