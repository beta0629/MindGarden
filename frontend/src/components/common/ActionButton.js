/**
 * ActionButton - 카드 액션용 버튼
 * hover 시 transform 미사용, box-shadow만 변경
 *
 * @author MindGarden
 * @since 2025-03-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from './MGButton';
import './ActionButton.css';

const VALID_VARIANTS = new Set(['primary', 'success', 'outline', 'secondary', 'danger']);
const VALID_SIZES = new Set(['small', 'medium', 'large']);

function ActionButton({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}) {
  const resolvedVariant = VALID_VARIANTS.has(variant) ? variant : 'primary';
  const resolvedSize = VALID_SIZES.has(size) ? size : 'medium';
  const classNames = [
    'mg-v2-button',
    `mg-v2-button--${resolvedVariant}`,
    `mg-v2-button--${resolvedSize}`,
    disabled && 'mg-v2-button--disabled',
    className
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <MGButton
      type={type}
      variant={resolvedVariant}
      size={resolvedSize}
      disabled={disabled}
      onClick={onClick}
      className={classNames}
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
  type: 'button',
  onClick: undefined,
  className: '',
  'aria-label': undefined
};

export default ActionButton;
