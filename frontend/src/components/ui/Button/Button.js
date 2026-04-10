/**
 * ui/Button — `common/MGButton` 단일 진실 원천 래퍼
 * - variant 별칭(error→danger, ghost/link→outline)
 * - 아이콘·테마 role(ui 레거시) 지원
 *
 * @author Core Solution Team
 * @since 2026-04-11
 */

/* eslint-disable no-restricted-syntax -- MGButton·MGButton.css 계약(mg-button *) */
import React from 'react';
import PropTypes from 'prop-types';

import MGButton from '../../common/MGButton';
import Icon from '../Icon/Icon';

/**
 * @typedef {Object} ButtonProps
 * @property {string} [variant] — MGButton variant + 별칭: error→danger, ghost|link→outline
 * @property {'small'|'medium'|'large'} [size]
 * @property {string} [icon] — Icon name (ICONS 레지스트리)
 * @property {'left'|'right'} [iconPosition]
 * @property {'CLIENT'|'CONSULTANT'|'ADMIN'} [role] — `data-role` 테마(HTML `role`과 별개)
 * @property {import('react').ReactNode} [children]
 * — 이하 MGButton과 동일: disabled, loading, loadingText, onClick, className, type, form, fullWidth, progress 등
 */

const VARIANT_ALIASES = {
  error: 'danger',
  ghost: 'outline',
  link: 'outline'
};

const THEME_ROLES = new Set(['CLIENT', 'CONSULTANT', 'ADMIN']);

const ICON_SIZE_BY_BUTTON = {
  small: 'SM',
  medium: 'MD',
  large: 'LG'
};

function buildIconModifierClasses(icon, iconPosition) {
  if (!icon) {
    return '';
  }
  const positionClass = iconPosition === 'right' ? 'mg-button--icon-right' : 'mg-button--icon-left';
  return ['mg-button--with-icon', positionClass].join(' ');
}

const Button = ({
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  role: themeRole,
  children,
  className = '',
  ...rest
}) => {
  const resolvedVariant = VARIANT_ALIASES[variant] || variant;
  const iconSize = ICON_SIZE_BY_BUTTON[size] || 'MD';

  const iconClasses = [buildIconModifierClasses(icon, iconPosition), className].filter(Boolean).join(' ');

  let content = children;
  if (icon) {
    const iconEl = <Icon name={icon} size={iconSize} />;
    if (iconPosition === 'right') {
      content = (
        <>
          {children}
          {iconEl}
        </>
      );
    } else {
      content = (
        <>
          {iconEl}
          {children}
        </>
      );
    }
  }

  const dataRoleProp =
    themeRole && THEME_ROLES.has(themeRole) ? { 'data-role': themeRole } : {};

  return (
    <MGButton
      {...rest}
      variant={resolvedVariant}
      size={size}
      className={iconClasses}
      {...dataRoleProp}
    >
      {content}
    </MGButton>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.string,
  icon: PropTypes.string,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  role: PropTypes.oneOf(['CLIENT', 'CONSULTANT', 'ADMIN'])
};

export default Button;
