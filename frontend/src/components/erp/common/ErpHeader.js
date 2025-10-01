import React from 'react';
import './ErpHeader.css';

/**
 * ERP 공통 헤더 컴포넌트
 */
const ErpHeader = ({ 
  title, 
  subtitle, 
  actions, 
  className = ''
}) => {
  return (
    <div className={`erp-header ${className}`}>
      <div className="erp-header-content">
        <h1 className={`erp-header-title ${subtitle ? 'erp-header-title--with-subtitle' : ''}`}>
          {title}
        </h1>
        {subtitle && <p className="erp-header-subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div className="erp-header-actions">
          {actions}
        </div>
      )}
    </div>
  );
};

export default ErpHeader;
