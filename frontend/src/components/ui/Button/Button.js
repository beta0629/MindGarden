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
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../Icon/Icon';

const ERP_VARIANT_SET = new Set(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'outline', 'progress']);

const SIZE_TO_ERP = {
  small: 'sm',
  medium: 'md',
  large: 'lg'
};

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
  loading,
  loadingText,
  ...rest
}) => {
  const resolvedVariant = VARIANT_ALIASES[variant] || variant;
  const erpVariant = ERP_VARIANT_SET.has(resolvedVariant) ? resolvedVariant : 'primary';
  const erpSize = SIZE_TO_ERP[size] || 'md';
  const iconSize = ICON_SIZE_BY_BUTTON[size] || 'MD';

  const iconClasses = [buildIconModifierClasses(icon, iconPosition), className].filter(Boolean).join(' ');
  const mergedClassName = buildErpMgButtonClassName({
    variant: erpVariant,
    size: erpSize,
    loading: Boolean(loading),
    className: iconClasses
  });

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
      className={mergedClassName}
      loading={loading}
      loadingText={loadingText ?? ERP_MG_BUTTON_LOADING_TEXT}
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
  loadingText: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.string,
  icon: PropTypes.string,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  role: PropTypes.oneOf(['CLIENT', 'CONSULTANT', 'ADMIN'])
};

export default Button;
