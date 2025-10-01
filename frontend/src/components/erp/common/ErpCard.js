import React from 'react';
import '../../../styles/glassmorphism.css';
import './ErpCard.css';

/**
 * ERP 공통 카드 컴포넌트 (리퀴드 글래스 효과 적용)
 */
const ErpCard = ({ title, children, className = '', glassEffect = true }) => {
  const finalClassName = `erp-card ${glassEffect ? 'erp-card--glass' : 'erp-card--solid'} ${className}`.trim();

  return (
    <div className={finalClassName}>
      {title && <div className="erp-card-title">{title}</div>}
      <div className="erp-card-body">
        {children}
      </div>
    </div>
  );
};

export default ErpCard;
