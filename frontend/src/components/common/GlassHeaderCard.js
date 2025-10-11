import React from 'react';
import IPhone17Card from './IPhone17Card';
import IPhone17Button from './IPhone17Button';
import IPhone17Modal from './IPhone17Modal';
import IPhone17PageHeader from './IPhone17PageHeader';
import './GlassHeaderCard.css';


/**
 * 글래스모피즘 헤더 카드 컴포넌트
 * @param {Object} props
 * @param {string} props.icon - 아이콘 (이모지 또는 클래스명)
 * @param {string} props.title - 제목
 * @param {string} props.subtitle - 부제목
 * @param {string} props.color - 아이콘 색상 (primary, success, warning, info)
 * @param {React.ReactNode} props.actions - 액션 버튼들
 * @param {string} props.className - 추가 CSS 클래스
 */
const GlassHeaderCard = ({ 
  icon, 
  title, 
  subtitle, 
  color = 'primary', 
  actions,
  className = '' 
}) => {
  return (
    <div className={`glass-header-card ${className}`}>
      <div className="glass-header-card__content">
        <div className="glass-header-card__left">
          <div className={`glass-header-card__icon glass-header-card__icon--${color}`}>
            {icon}
          </div>
          <div className="glass-header-card__text">
            <h2 className="glass-header-card__title">
              {title}
            </h2>
            <p className="glass-header-card__subtitle">
              {subtitle}
            </p>
          </div>
        </div>
        {actions && (
          <div className="glass-header-card__actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlassHeaderCard;

