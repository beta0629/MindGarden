import React from 'react';

/**
 * ERP 공통 헤더 컴포넌트
 */
const ErpHeader = ({ 
  title, 
  subtitle, 
  actions, 
  style = {},
  className = ''
}) => {
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '24px',
    ...style
  };

  const titleContainerStyle = {
    flex: 1
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333333',
    margin: 0,
    marginBottom: subtitle ? '4px' : '0'
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: '#666666',
    margin: 0
  };

  const actionsStyle = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  };

  return (
    <div style={headerStyle} className={className}>
      <div style={titleContainerStyle}>
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {actions && (
        <div style={actionsStyle}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default ErpHeader;
