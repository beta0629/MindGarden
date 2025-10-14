/**
 * 통계 카드 컴포넌트
 * Phase 3.1: 관리자 대시보드 핵심 컴포넌트
 * 
 * 재사용 가능한 통계 카드 (상담사 수, 내담자 수, 매핑 수 등)
 */

import React from 'react';
import './StatCard.css';

const StatCard = ({ 
  icon, 
  title, 
  value, 
  description, 
  variant = 'default',
  onClick 
}) => {
  return (
    <div 
      className={`stat-card stat-card-${variant} ${onClick ? 'stat-card-clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-icon">
        {icon}
      </div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-description">{description}</div>
      </div>
    </div>
  );
};

export default StatCard;

