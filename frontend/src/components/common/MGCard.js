/**
 * MindGarden 공통 카드 컴포넌트
 * v0.dev 디자인 시스템 기반의 새로운 카드 디자인
 */

import React from 'react';

const MGCard = ({
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
    default: "bg-[#F5F5DC] shadow-sm border border-[#D2B48C]/20",
    elevated: "bg-[#F5F5DC] shadow-lg border border-[#D2B48C]/20",
    outlined: "bg-[#F5F5DC] border-2 border-[#D2B48C]",
    glass: "bg-[#F5F5DC]/25 backdrop-blur-md border border-[#D2B48C]/18",
  };

  const paddingClasses = {
    small: "p-4",
    medium: "p-6",
    large: "p-8",
  };

  const clickableClasses = onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : "";
  
  const allClasses = [
    "rounded-xl transition-all duration-300",
    variantClasses[variant] || variantClasses.default,
    paddingClasses[padding] || paddingClasses.medium,
    clickableClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={allClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default MGCard;



