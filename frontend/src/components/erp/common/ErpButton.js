import React from 'react';

/**
 * ERP 공통 버튼 컴포넌트
 */
const ErpButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false,
  style = {},
  className = '',
  type = 'button'
}) => {
  const getVariantStyle = () => {
    const variants = {
      primary: {
        backgroundColor: '#007bff',
        color: '#ffffff',
        border: '1px solid #007bff'
      },
      secondary: {
        backgroundColor: '#6c757d',
        color: '#ffffff',
        border: '1px solid #6c757d'
      },
      success: {
        backgroundColor: '#28a745',
        color: '#ffffff',
        border: '1px solid #28a745'
      },
      danger: {
        backgroundColor: '#dc3545',
        color: '#ffffff',
        border: '1px solid #dc3545'
      },
      warning: {
        backgroundColor: '#ffc107',
        color: '#212529',
        border: '1px solid #ffc107'
      },
      info: {
        backgroundColor: '#17a2b8',
        color: '#ffffff',
        border: '1px solid #17a2b8'
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#007bff',
        border: '1px solid #007bff'
      }
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyle = () => {
    const sizes = {
      small: {
        padding: '6px 12px',
        fontSize: '12px'
      },
      medium: {
        padding: '8px 16px',
        fontSize: '14px'
      },
      large: {
        padding: '12px 24px',
        fontSize: '16px'
      }
    };
    return sizes[size] || sizes.medium;
  };

  const buttonStyle = {
    ...getVariantStyle(),
    ...getSizeStyle(),
    borderRadius: '4px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.2s ease',
    fontWeight: '500',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    ...style
  };

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      style={buttonStyle}
      className={className}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? '처리중...' : children}
    </button>
  );
};

export default ErpButton;
