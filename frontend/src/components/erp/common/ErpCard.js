import React from 'react';

/**
 * ERP 공통 카드 컴포넌트
 */
const ErpCard = ({ title, children, style = {}, className = '' }) => {
  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #e0e0e0',
    ...style
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333333',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid #f0f0f0'
  };

  return (
    <div style={cardStyle} className={className}>
      {title && <div style={titleStyle}>{title}</div>}
      {children}
    </div>
  );
};

export default ErpCard;
