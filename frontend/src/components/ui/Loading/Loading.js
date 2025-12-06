/**
 * Loading Component
/**
 * 
/**
 * MindGarden 디자인 시스템 표준 컴포넌트
/**
 * 
/**
 * @author MindGarden Team
/**
 * @version 2.0.0
/**
 * @since 2025-11-28
 */

import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../utils/classNames';
import './styles.css';

const UnifiedLoading = ({ 
  text = "로딩 중...",
  size = "medium",
  variant = "spinner",
  type = "inline",
  showText = true,
  className = "",
  centered = true,
  logoType = "text", // text, image, custom
  logoImage = "",
  logoAlt = "MindGarden",
  logoRotate = true,
  ...props 
}) => {
  // 로고 렌더링
  const renderLogo = () => {
    const logoClasses = [
      'mg-loading-logo',
      `mg-loading-logo--${size}`,
      logoRotate ? 'mg-loading-logo--rotating' : '',
      `mg-loading-logo--${logoType}`
    ].filter(Boolean).join(' ');

    switch (logoType) {
      case 'image':
        return (
          <img 
            src={logoImage || '/logo.png'} 
            alt={logoAlt}
            className={logoClasses}
          />
        );
      case 'custom':
        return (
          <div 
            className={logoClasses}
            dangerouslySetInnerHTML={{ __html: logoImage }}
          />
        );
      case 'text':
      default:
        return (
          <div className={logoClasses}>
            <span className="mg-loading-logo-text">
              MindGarden
            </span>
          </div>
        );
    }
  };

Loading.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool
};

Loading.defaultProps = {
  className: '',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
};

export default Loading;
