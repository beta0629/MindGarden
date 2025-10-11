/**
 * MindGarden 공통 버튼 컴포넌트
 * v0.dev 디자인 시스템 기반의 새로운 버튼 디자인
 */

import React from 'react';

const MGButton = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  // 베이지/크림/올리브 그린 색상 시스템
  const variantClasses = {
    primary: "bg-[#D2B48C] text-white hover:bg-[#C19A6B] active:scale-[0.98]",
    secondary: "bg-transparent border-2 border-[#D2B48C] text-[#D2B48C] hover:bg-[#D2B48C]/10 active:scale-[0.98]",
    success: "bg-[#9CAF88] text-white hover:bg-[#8B9E77] active:scale-[0.98]",
    danger: "bg-[#CD5C5C] text-white hover:bg-[#B84C4C] active:scale-[0.98]",
    warning: "bg-[#6B7C32] text-white hover:bg-[#5A6B2A] active:scale-[0.98]",
    ghost: "bg-transparent text-[#8B8680] hover:bg-[#8B8680]/10 active:scale-[0.98]",
  };

  const sizeClasses = {
    small: "h-8 px-3 text-xs",
    medium: "h-10 px-4 text-sm",
    large: "h-12 px-6 text-base",
  };

  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D2B48C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  
  const allClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.medium,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={allClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <span className="animate-spin" aria-hidden="true">
          ⟳
        </span>
      )}
      {icon && !loading && (
        <span className="mg-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

export default MGButton;



