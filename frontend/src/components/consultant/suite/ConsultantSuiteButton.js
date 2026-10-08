/**
 * ConsultantSuiteButton — 상담사 스위트 버튼 (MGButton h36 r8)
 * primary 는 화면당 1개(헤더 행동 CTA)만 쓰고, 나머지는 ghost(흰 + slate 테두리).
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { CONSULTANT_SUITE_BUTTON_VARIANT } from '../../../constants/consultantSuite';

const ConsultantSuiteButton = ({
  variant,
  icon,
  onClick,
  disabled,
  className,
  ariaLabel,
  testId,
  children
}) => {
  const extraClass = [icon ? 'mg-button--with-icon' : '', className].filter(Boolean).join(' ');

  return (
    <MGButton
      type="button"
      variant={variant}
      size="medium"
      className={buildErpMgButtonClassName({
        variant,
        size: 'md',
        loading: false,
        className: extraClass
      })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testId}
      preventDoubleClick={false}
    >
      {icon}
      {children}
    </MGButton>
  );
};

ConsultantSuiteButton.propTypes = {
  variant: PropTypes.oneOf(Object.values(CONSULTANT_SUITE_BUTTON_VARIANT)),
  icon: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  testId: PropTypes.string,
  children: PropTypes.node.isRequired
};

ConsultantSuiteButton.defaultProps = {
  variant: CONSULTANT_SUITE_BUTTON_VARIANT.GHOST,
  icon: null,
  disabled: false,
  className: '',
  ariaLabel: undefined,
  testId: undefined
};

export default ConsultantSuiteButton;
