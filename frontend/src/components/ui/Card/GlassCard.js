/**
 * MindGarden 디자인 시스템 v2.0 - Glass Card Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 */

import React from 'react';
import Card from './Card';

/**
 * 글라스모피즘 효과가 적용된 카드 컴포넌트
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 카드 내용
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <GlassCard>
 *   <h4>Glass Card</h4>
 *   <p>글라스모피즘 효과</p>
 * </GlassCard>
 */
const GlassCard = ({ children, className = '', ...props }) => {
  return (
    <Card variant="glass" className={className} {...props}>
      {children}
    </Card>
  );
};

export default GlassCard;

