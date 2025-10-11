import React from 'react';
import IPhone17Card from './IPhone17Card';
import IPhone17Button from './IPhone17Button';
import IPhone17Modal from './IPhone17Modal';
import IPhone17PageHeader from './IPhone17PageHeader';
import './GlassStatCard.css';


/**
 * 글래스모피즘 통계 카드 컴포넌트
 * @param {Object} props
 * @param {string} props.icon - 아이콘 (이모지 또는 클래스명)
 * @param {string|number} props.value - 통계 값
 * @param {string} props.label - 라벨 텍스트
 * @param {string} props.color - 색상 변형 (primary, success, warning, danger, info)
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Function} props.onClick - 클릭 이벤트 핸들러
 */
const GlassStatCard = ({ 
  icon, 
  value, 
  label, 
  color = 'primary', 
  className = '', 
  onClick 
}) => {
  return (
    <div 
      className={`glass-stat-card ${className}`}
      onClick={onClick}
    >
      <div className={`glass-stat-card__icon glass-stat-card__icon--${color}`}>
        {icon}
      </div>
      <div className="glass-stat-card__value">
        {value}
      </div>
      <div className="glass-stat-card__label">
        {label}
      </div>
    </div>
  );
};

export default GlassStatCard;

