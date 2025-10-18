/**
 * MindGarden 디자인 시스템 v2.0 - Card Component (Compound Component Pattern)
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 * @reference /docs/design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md (Card 섹션)
 * @reference /design-system (CardShowcase)
 * @reference /frontend/src/components/mindgarden/CardShowcase.js
 */

import React from 'react';

/**
 * 재사용 가능한 카드 컴포넌트 (Compound Component Pattern)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 카드 내용
 * @param {string} [props.variant='default'] - 카드 스타일 ('default'|'glass'|'gradient'|'floating'|'border')
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * // 기본 카드
 * <Card>
 *   <Card.Header>
 *     <h3>제목</h3>
 *   </Card.Header>
 *   <Card.Body>
 *     내용
 *   </Card.Body>
 *   <Card.Footer>
 *     <Button>확인</Button>
 *   </Card.Footer>
 * </Card>
 * 
 * @example
 * // Glass 카드
 * <Card variant="glass">
 *   <h4>Glass Card</h4>
 *   <p>글라스모피즘 효과</p>
 * </Card>
 */
const Card = ({ children, variant = 'default', className = '', ...props }) => {
  const baseClass = 'mg-card';
  const variantClass = variant && variant !== 'default' ? `mg-card-${variant}` : '';
  
  const allClasses = [
    baseClass,
    variantClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={allClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Header 컴포넌트
 */
const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`mg-card__header ${className}`.trim()}>
      {children}
    </div>
  );
};

/**
 * Card Body 컴포넌트
 */
const CardBody = ({ children, className = '' }) => {
  return (
    <div className={`mg-card__body ${className}`.trim()}>
      {children}
    </div>
  );
};

/**
 * Card Footer 컴포넌트
 */
const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`mg-card__footer ${className}`.trim()}>
      {children}
    </div>
  );
};

// Compound Component 패턴
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;

