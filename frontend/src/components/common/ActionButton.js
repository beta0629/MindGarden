/**
 * ActionButton - 카드 액션용 버튼
 * hover 시 transform 미사용, box-shadow만 변경
 *
 * @author MindGarden
 * @since 2025-03-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import './ActionButton.css';

const VALID_VARIANTS = new Set(['primary', 'success', 'outline', 'secondary', 'danger']);
const VALID_SIZES = new Set(['small', 'medium', 'large']);

const SIZE_TO_ERP = {
  small: 'sm',
  medium: 'md',
  large: 'lg'
};

function ActionButton({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  children,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}) {
  const resolvedVariant = VALID_VARIANTS.has(variant) ? variant : 'primary';
  const resolvedSize = VALID_SIZES.has(size) ? size : 'medium';
  const erpSize = SIZE_TO_ERP[resolvedSize] || 'md';

  return (
    <MGButton
      type={type}
      variant={resolvedVariant}
      size={resolvedSize}
      disabled={disabled}
      loading={loading}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={onClick}
      className={buildErpMgButtonClassName({
        variant: resolvedVariant,
        size: erpSize,
        loading,
        className
      })}
      preventDoubleClick={false}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </MGButton>
  );
}

ActionButton.propTypes = {
  variant: PropTypes.oneOf(['primary', 'success', 'outline', 'secondary', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  'aria-label': PropTypes.string
};

ActionButton.defaultProps = {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  type: 'button',
  onClick: undefined,
  className: '',
  'aria-label': undefined
};

export default ActionButton;
