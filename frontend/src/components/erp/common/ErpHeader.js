import React from 'react';

/**
 * ERP 공통 헤더 컴포넌트 - MindGarden 디자인 시스템 mg-dashboard-header 활용
 * 
 * @param {string} title - 헤더 제목
 * @param {string} subtitle - 헤더 부제목
 * @param {React.ReactNode} actions - 헤더 액션 버튼들
 * @param {React.ReactNode} icon - 헤더 아이콘 (선택사항)
 * @param {string} className - 추가 CSS 클래스
 */
const ErpHeader = ({ 
  title, 
  subtitle, 
  actions, 
  icon,
  className = ''
}) => {
  return (
    <div className={`mg-dashboard-header ${className}`}>
      <div className="mg-dashboard-header-content">
        <div className="mg-dashboard-header-left">
          {icon && <div className="mg-dashboard-header-icon">{icon}</div>}
          <div>
            <h1 className="mg-dashboard-title">{title}</h1>
            {subtitle && <p className="mg-dashboard-subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && (
          <div className="mg-dashboard-header-right">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErpHeader;
