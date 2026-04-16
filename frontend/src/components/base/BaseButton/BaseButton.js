import React from 'react';

import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import styles from './BaseButton.module.css';

const MG_SIZE_TO_ERP = {
  small: 'sm',
  medium: 'md',
  large: 'lg'
};

/**
 * 기본 버튼 컴포넌트 (stub)
 * @param {Object} props
 * @param {string} [props.className] - 추가 클래스명
 * @param {React.ReactNode} props.children
 */
const BaseButton = ({
  className = '',
  children,
  preventDoubleClick = false,
  variant = 'primary',
  size = 'medium',
  loading = false,
  ...rest
}) => {
  const classNames = ['mg-btn', styles.button, className].filter(Boolean).join(' ');
  return (
    <MGButton
      type="button"
      variant={variant}
      size={size}
      loading={loading}
      className={buildErpMgButtonClassName({
        variant,
        size: MG_SIZE_TO_ERP[size] ?? 'md',
        loading,
        className: classNames
      })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      preventDoubleClick={preventDoubleClick}
      {...rest}
    >
      {children}
    </MGButton>
  );
};

export default BaseButton;
