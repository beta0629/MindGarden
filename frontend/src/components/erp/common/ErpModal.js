import React from 'react';
import UnifiedModal from '../../common/modals/UnifiedModal';

/**
 * ERP 공통 모달 - UnifiedModal 래퍼
 * 기존 ErpModal API 호환을 위해 size sm/md/lg/xl → small/medium/large 매핑
 *
 * @param {boolean} isOpen - 모달 열림 상태
 * @param {function} onClose - 모달 닫기 핸들러
 * @param {string} title - 모달 제목
 * @param {React.ReactNode} children - 모달 내용
 * @param {string} size - 모달 크기 (sm, md, lg, xl)
 * @param {boolean} showCloseButton - 닫기 버튼 표시 여부
 * @param {string} className - 추가 CSS 클래스
 */
const ErpModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = ''
}) => {
  const sizeMap = { sm: 'small', md: 'medium', lg: 'large', xl: 'large' };
  const unifiedSize = sizeMap[size] || 'medium';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={unifiedSize}
      showCloseButton={showCloseButton}
      backdropClick={true}
      className={className}
    >
      {children}
    </UnifiedModal>
  );
};

export default ErpModal;
