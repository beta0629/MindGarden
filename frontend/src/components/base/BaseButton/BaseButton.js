import React from 'react';
import styles from './BaseButton.module.css';

const BaseButton = ({ 
  children, 
  className = '', 
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'mg-btn';
  const variantClasses = {
    primary: 'mg-btn--primary',
    secondary: 'mg-btn--secondary',
    success: 'mg-btn--success',
    warning: 'mg-btn--warning',
    danger: 'mg-btn--danger',
    info: 'mg-btn--info',
    glass: 'mg-btn--glass'
  };
  const sizeClasses = {
    small: 'mg-btn--small',
    medium: 'mg-btn--medium',
    large: 'mg-btn--large'
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled ? 'mg-btn--disabled' : '',
    loading ? 'mg-btn--loading' : '',
    icon && !children ? 'mg-btn--icon' : '',
    icon && !children && size === 'small' ? 'mg-btn--icon--small' : '',
    icon && !children && size === 'large' ? 'mg-btn--icon--large' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? null : icon}
      {children}
    </button>
  );
};

export default BaseButton;
