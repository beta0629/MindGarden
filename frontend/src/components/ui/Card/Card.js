/**
 * Card Component
 * 
 * MindGarden 디자인 시스템 표준 컴포넌트
 * 
 * @author MindGarden Team
 * @version 2.0.0
 * @since 2025-11-28
 */

import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  shadow = 'medium',
  className = '',
  onClick,
  ...props
}) => {
  // 베이지/크림/올리브 그린 색상 시스템
  const variantClasses = {
    default: "mg-card mg-card--default",
    elevated: "mg-card mg-card--elevated",
    outlined: "mg-card mg-card--outlined",
    glass: "mg-card mg-card--glass",
  };

  const paddingClasses = {
    small: "mg-card--padding-sm",
    medium: "mg-card--padding-md",
    large: "mg-card--padding-lg"
  };

  const cardClasses = [
    variantClasses[variant] || variantClasses.default,
    paddingClasses[padding] || paddingClasses.medium,
    onClick ? 'mg-card--clickable' : '',
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

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'glass']),
  padding: PropTypes.oneOf(['small', 'medium', 'large']),
  shadow: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
  onClick: PropTypes.func
};

Card.defaultProps = {
  className: '',
  variant: 'default',
  padding: 'medium',
  shadow: 'medium'
};

export default Card;
