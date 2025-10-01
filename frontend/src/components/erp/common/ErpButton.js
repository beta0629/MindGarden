import React from 'react';
import '../../../styles/glassmorphism.css';

/**
 * ERP 공통 버튼 컴포넌트 (리퀴드 글래스 효과 적용)
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
  type = 'button',
  glassEffect = true
}) => {
  const getVariantStyle = () => {
    if (glassEffect) {
      const glassVariants = {
        primary: {
          background: 'rgba(59, 130, 246, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#ffffff',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 4px 16px 0 rgba(59, 130, 246, 0.3)'
        },
        secondary: {
          background: 'rgba(107, 114, 128, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#ffffff',
          border: '1px solid rgba(107, 114, 128, 0.3)',
          boxShadow: '0 4px 16px 0 rgba(107, 114, 128, 0.3)'
        },
        success: {
          background: 'rgba(34, 197, 94, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#ffffff',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          boxShadow: '0 4px 16px 0 rgba(34, 197, 94, 0.3)'
        },
        danger: {
          background: 'rgba(239, 68, 68, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#ffffff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 4px 16px 0 rgba(239, 68, 68, 0.3)'
        },
        warning: {
          background: 'rgba(251, 191, 36, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#ffffff',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: '0 4px 16px 0 rgba(251, 191, 36, 0.3)'
        },
        info: {
          background: 'rgba(6, 182, 212, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#ffffff',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 4px 16px 0 rgba(6, 182, 212, 0.3)'
        },
        outline: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.1)'
        }
      };
      return glassVariants[variant] || glassVariants.primary;
    } else {
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
    }
  };

  const getSizeStyle = () => {
    const sizes = {
      small: {
        padding: '6px 12px',
        fontSize: 'var(--font-size-xs)'
      },
      medium: {
        padding: '8px 16px',
        fontSize: 'var(--font-size-sm)'
      },
      large: {
        padding: '12px 24px',
        fontSize: 'var(--font-size-base)'
      }
    };
    return sizes[size] || sizes.medium;
  };

  const buttonStyle = {
    ...getVariantStyle(),
    ...getSizeStyle(),
    borderRadius: glassEffect ? '8px' : '4px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.3s ease',
    fontWeight: '500',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    ...style
  };

  const handleMouseEnter = (e) => {
    if (!disabled && !loading && glassEffect) {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 8px 24px 0 rgba(31, 38, 135, 0.5)';
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled && !loading && glassEffect) {
      e.target.style.transform = 'translateY(0px)';
      e.target.style.boxShadow = getVariantStyle().boxShadow;
    }
  };

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  const glassClassName = glassEffect ? 'glass-button' : '';
  const finalClassName = `${glassClassName} ${className}`.trim();

  return (
    <button
      type={type}
      style={buttonStyle}
      className={finalClassName}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
    >
      {loading ? '처리중...' : children}
    </button>
  );
};

export default ErpButton;
