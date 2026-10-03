/**
 * SettingsButton — 설정 화면 공통 버튼 (MGButton + ERP small 계약, h32·r8)
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT,
  mapErpVariantToMg
} from '../../erp/common/erpMgButtonProps';

const SettingsButton = ({
  variant = 'outline',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  preventDoubleClick = false,
  children,
  ...rest
}) => {
  const mgVariant = mapErpVariantToMg(variant);
  return (
    <MGButton
      type={type}
      variant={mgVariant}
      size="small"
      className={buildErpMgButtonClassName({
        variant: mgVariant,
        size: 'sm',
        loading,
        className: ['mg-v2-settings-button', className].filter(Boolean).join(' ')
      })}
      loading={loading}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      disabled={disabled}
      preventDoubleClick={preventDoubleClick}
      {...rest}
    >
      {children}
    </MGButton>
  );
};

SettingsButton.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning', 'info']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  preventDoubleClick: PropTypes.bool,
  children: PropTypes.node
};

export default SettingsButton;
