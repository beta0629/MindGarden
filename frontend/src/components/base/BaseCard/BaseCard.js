import React from 'react';
import styles from './BaseCard.module.css';

const BaseCard = ({ 
  children, 
  className = '', 
  onClick, 
  variant = 'default',
  size = 'medium',
  type = 'card',
  ...props 
}) => {
  const baseClasses = type === 'card' ? 'card' : `card-${type}`;
  const variantClasses = {
    default: '',
    glass: 'card-glass',
    stat: 'stat-card',
    management: 'management-card',
    success: 'card-success',
    warning: 'card-warning',
    danger: 'card-danger',
    info: 'card-info'
  };
  const sizeClasses = {
    small: 'card-sm',
    medium: 'card-md',
    large: 'card-lg'
  };

  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default BaseCard;
