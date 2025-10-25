import React from 'react';

/**
 * ERP 공통 카드 컴포넌트 - MindGarden 디자인 시스템 mg-v2-card 활용
 * 
 * @param {string} title - 카드 제목
 * @param {React.ReactNode} children - 카드 내용
 * @param {string} className - 추가 CSS 클래스
 * @param {boolean} glassEffect - 글라스 효과 적용 여부 (기본: false, mg-glass-card 사용)
 */
const ErpCard = ({ title, children, className = '', glassEffect = false }) => {
  // MindGarden 디자인 시스템의 mg-v2-card 또는 mg-glass-card 활용
  const cardClasses = [
    glassEffect ? 'mg-glass-card' : 'mg-v2-card',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {title && <h3 className="mg-h4">{title}</h3>}
      <div className="mg-v2-card-body">
        {children}
      </div>
    </div>
  );
};

export default ErpCard;
