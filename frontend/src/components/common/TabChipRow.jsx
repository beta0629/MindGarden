/**
 * TabChipRow — MGButton tab/chip row SSOT (solid primary + outline inactive pills)
 *
 * ModalFormActions와 동일한 row-level equal-height 계약으로 primary/outline 단차(단차) 재발 방지.
 * per-page `.operator-ledger-tax__tabs` 원오프 CSS 금지 — TabChipRow.css 잠금만 사용.
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from './MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT,
  mapErpSizeToMg
} from '../erp/common/erpMgButtonProps';
import './TabChipRow.css';

const SIZE_TO_ERP = {
  sm: 'sm',
  small: 'sm',
  md: 'md',
  medium: 'md'
};

const SIZE_TO_MG = {
  sm: 'small',
  small: 'small',
  md: 'medium',
  medium: 'medium'
};

/**
 * @param {Object} props
 * @param {Array<{key: string, label: string}>} props.items
 * @param {string} props.activeKey
 * @param {Function} props.onChange
 * @param {string} props.ariaLabel
 * @param {'sm'|'small'|'md'|'medium'} [props.size='sm']
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
const TabChipRow = ({
  items,
  activeKey,
  onChange,
  ariaLabel,
  size = 'sm',
  className = ''
}) => {
  const erpSize = SIZE_TO_ERP[size] ?? 'sm';
  const mgSize = SIZE_TO_MG[size] ?? mapErpSizeToMg(erpSize);

  const rootClass = [
    'mg-tab-chip-row',
    erpSize === 'md' ? 'mg-tab-chip-row--md' : 'mg-tab-chip-row--sm',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="tablist" aria-label={ariaLabel} data-testid="tab-chip-row">
      {items.map((item) => {
        const isActive = activeKey === item.key;
        const variant = isActive ? 'primary' : 'outline';

        return (
          <MGButton
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            variant={variant}
            size={mgSize}
            className={buildErpMgButtonClassName({
              variant,
              size: erpSize,
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => onChange(item.key)}
            preventDoubleClick={false}
            data-testid={`tab-chip-row-${item.key}`}
          >
            {item.label}
          </MGButton>
        );
      })}
    </div>
  );
};

TabChipRow.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  activeKey: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'small', 'md', 'medium']),
  className: PropTypes.string
};

export default TabChipRow;
