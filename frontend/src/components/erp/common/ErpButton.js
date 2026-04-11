import React from 'react';

import MGButton from '../../common/MGButton';

const VARIANT_TO_MG = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  info: 'info',
  outline: 'outline',
  ghost: 'outline'
};

const SIZE_TO_MG = {
  sm: 'small',
  md: 'medium',
  lg: 'large'
};

/**
 * ERP 공통 버튼 컴포넌트 — MGButton 기반, `mg-v2-button` 클래스 호환
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Function} [props.onClick]
 * @param {string} [props.variant] - primary, secondary, success, danger, warning, info, outline, ghost
 * @param {string} [props.size] - sm, md, lg
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loading]
 * @param {string} [props.className]
 * @param {string} [props.type]
 * @param {boolean} [props['aria-busy']]
 */
const ErpButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  'aria-busy': ariaBusy,
  ...rest
}) => {
  const mgVariant = VARIANT_TO_MG[variant] ?? 'primary';
  const mgSize = SIZE_TO_MG[size] ?? SIZE_TO_MG.md;

  const mergedClassName = [
    'mg-v2-button',
    `mg-v2-button-${variant}`,
    size !== 'md' && `mg-v2-button-${size}`,
    loading && 'mg-v2-button-loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <MGButton
      variant={mgVariant}
      size={mgSize}
      disabled={disabled}
      loading={loading}
      loadingText="처리중..."
      className={mergedClassName}
      type={type}
      onClick={onClick}
      preventDoubleClick={false}
      aria-busy={ariaBusy}
      {...rest}
    >
      {children}
    </MGButton>
  );
};

export default ErpButton;
