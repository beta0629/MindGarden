import React from 'react';
import { BaseCard } from '../../base';

const StatCard = ({ 
  title,
  value,
  icon,
  color = 'primary',
  change = null,
  className = '',
  onClick,
  ...props 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick({ title, value, icon, color, change });
    }
  };

  return (
    <BaseCard
      variant="stat"
      className={className}
      onClick={handleClick}
      {...props}
    >
      <div className={`card__icon card__icon--small card__icon--${color}`}>
        <span className="card__icon-emoji">{icon}</span>
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{title}</div>
      {change && (
        <div className={`stat-card__change stat-card__change--${change.type}`}>
          {change.value > 0 ? '↗' : '↘'} {Math.abs(change.value)}%
        </div>
      )}
    </BaseCard>
  );
};

export default StatCard;
