/**
 * ConsultantFilterChips — 상담사 스위트 필터·뷰 토글 칩 (selection = slate)
 * 선택: slate fill + 1px slate 테두리. teal fill/ring 금지(LNB active만 teal).
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { CONSULTANT_SUITE_CLASS } from '../../../constants/consultantSuite';
import './ConsultantSuite.css';

const ConsultantFilterChips = ({ items, activeKey, onChange, ariaLabel, className, testIdPrefix }) => {
  const rootClass = [CONSULTANT_SUITE_CLASS.CHIPS, className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} role="group" aria-label={ariaLabel}>
      {items.map((item) => {
        const isSelected = item.key === activeKey;
        const chipClass = [
          CONSULTANT_SUITE_CLASS.CHIP,
          isSelected ? CONSULTANT_SUITE_CLASS.CHIP_SELECTED : ''
        ].filter(Boolean).join(' ');
        return (
          <MGButton
            key={item.key}
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: chipClass
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            aria-pressed={isSelected}
            onClick={() => onChange(item.key)}
            preventDoubleClick={false}
            data-testid={testIdPrefix ? `${testIdPrefix}-${item.key}` : undefined}
          >
            {item.label}
          </MGButton>
        );
      })}
    </div>
  );
};

ConsultantFilterChips.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  activeKey: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  className: PropTypes.string,
  testIdPrefix: PropTypes.string
};

ConsultantFilterChips.defaultProps = {
  className: '',
  testIdPrefix: undefined
};

export default ConsultantFilterChips;
