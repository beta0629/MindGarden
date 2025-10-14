/**
 * MindGarden 디자인 시스템 v2.0 - Button Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 * @reference /docs/design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md (Button 섹션)
 * @reference http://localhost:3000/design-system (ButtonShowcase)
 * @reference /frontend/src/components/mindgarden/ButtonShowcase.js
 */

import React from 'react';

/**
 * 재사용 가능한 버튼 컴포넌트
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 버튼 텍스트 또는 아이콘
 * @param {string} [props.variant='primary'] - 버튼 스타일 ('primary'|'secondary'|'danger'|'outline'|'ghost')
 * @param {string} [props.size='medium'] - 버튼 크기 ('small'|'medium'|'large')
 * @param {boolean} [props.disabled=false] - 비활성화 여부
 * @param {boolean} [props.loading=false] - 로딩 상태
 * @param {Function} [props.onClick] - 클릭 핸들러
 * @param {string} [props.type='button'] - 버튼 타입
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * // Primary 버튼
 * <Button variant="primary" onClick={handleClick}>
 *   저장
 * </Button>
 * 
 * @example
 * // 아이콘 버튼
 * <Button variant="outline">
 *   <Download size={20} />
 *   다운로드
 * </Button>
 * 
 * @example
 * // 크기 변형
 * <Button size="small">Small</Button>
 * <Button size="large">Large</Button>
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // 기본 클래스 (mg- 접두사 사용)
  const baseClass = 'mg-button';
  
  // variant 클래스
  const variantClass = variant ? `mg-button-${variant}` : '';
  
  // size 클래스
  const sizeClass = size && size !== 'medium' ? `mg-button-${size}` : '';
  
  // 모든 클래스 조합
  const allClasses = [
    baseClass,
    variantClass,
    sizeClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={type}
      className={allClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="mg-spinner"></span>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

