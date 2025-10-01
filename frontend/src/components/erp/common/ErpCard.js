import React from 'react';
import '../../../styles/glassmorphism.css';

/**
 * ERP 공통 카드 컴포넌트 (리퀴드 글래스 효과 적용)
 */
const ErpCard = ({ title, children, style = {}, className = '', glassEffect = true }) => {
  const cardStyle = {
    backgroundColor: glassEffect ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
    backdropFilter: glassEffect ? 'blur(10px)' : 'none',
    WebkitBackdropFilter: glassEffect ? 'blur(10px)' : 'none',
    borderRadius: '12px',
    boxShadow: glassEffect ? '0 8px 32px 0 rgba(31, 38, 135, 0.37)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    marginBottom: '20px',
    border: glassEffect ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #e0e0e0',
    ...style
  };

  const titleStyle = {
    fontSize: 'var(--font-size-xl)',
    fontWeight: '600',
    color: glassEffect ? '#ffffff' : '#333333',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: glassEffect ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid #f0f0f0',
    textShadow: glassEffect ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
  };

  const glassClassName = glassEffect ? 'glass-card' : '';
  const finalClassName = `${glassClassName} ${className}`.trim();

  return (
    <div style={cardStyle} className={finalClassName}>
      {title && <div style={titleStyle}>{title}</div>}
      {children}
    </div>
  );
};

export default ErpCard;
