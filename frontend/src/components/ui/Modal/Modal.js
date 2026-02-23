/**
 * Modals Component
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
/* 스타일: main.css → _unified-modals.css 공통 모달 사용 */

const UnifiedModal = ({ 
  isOpen = false,
  onClose,
  title = '',
  subtitle = '',
  children,
  size = 'medium',
  variant = 'default',
  backdropClick = true,
  showCloseButton = true,
  zIndex = null,
  className = '',
  actions = null,
  loading = false,
  ...props 
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

Modals.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool
};

Modals.defaultProps = {
  className: '',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
};

export default Modals;
