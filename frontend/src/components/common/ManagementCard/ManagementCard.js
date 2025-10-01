import React from 'react';
import { BaseCard } from '../../base';

const ManagementCard = ({ 
  title,
  description,
  icon,
  color,
  className = '',
  onClick,
  selected = false,
  ...props 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick({ title, description, icon, color });
    }
  };

  return (
    <BaseCard
      variant="management"
      className={`${className} ${selected ? 'mg-management-card--selected' : ''}`}
      onClick={handleClick}
      {...props}
    >
      <div className={`card__icon card__icon--large card__icon--${color}`}>
        <span className="card__icon-emoji">{icon}</span>
      </div>
      <div className="management-card__content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </BaseCard>
  );
};

export default ManagementCard;
