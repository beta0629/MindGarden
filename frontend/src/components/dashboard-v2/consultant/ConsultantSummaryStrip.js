/**
 * ConsultantSummaryStrip — Clinic-OS summary strip (MoneyHeroBand 기하 재사용)
 * 아이콘 타일·좌측 accent bar 금지. 라벨 caption + 값 h2.
 *
 * @author CoreSolution
 * @since 2026-09-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * @param {object} props
 * @param {Array<{ id: string, label: string, value: string, onClick?: Function }>} props.items
 * @param {boolean} [props.loading]
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
const ConsultantSummaryStrip = ({
  items = [],
  loading = false,
  className = '',
  ariaLabel = '핵심 지표'
}) => {
  const rootClass = [
    'consultant-summary-strip',
    loading ? 'consultant-summary-strip--loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <section
      className={rootClass}
      aria-label={ariaLabel}
      aria-busy={loading ? 'true' : undefined}
      data-testid="consultant-summary-strip"
    >
      {items.map((item) => {
        const label = toDisplayString(item.label, '');
        const value = toDisplayString(item.value, '—');
        const cellClass = 'consultant-summary-strip__cell';
        if (typeof item.onClick === 'function') {
          return (
            <MGButton
              key={item.id}
              type="button"
              variant="ghost"
              size="medium"
              className={buildErpMgButtonClassName({
                variant: 'ghost',
                size: 'md',
                loading: false,
                className: `${cellClass} consultant-summary-strip__cell--clickable`
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={item.onClick}
              preventDoubleClick={false}
              aria-label={label}
            >
              <span className="consultant-summary-strip__label">
                <SafeText tag="span">{label}</SafeText>
              </span>
              <span className="consultant-summary-strip__value">
                <SafeText tag="span">{value}</SafeText>
              </span>
            </MGButton>
          );
        }
        return (
          <article key={item.id} className={cellClass}>
            <p className="consultant-summary-strip__label">
              <SafeText tag="span">{label}</SafeText>
            </p>
            <p className="consultant-summary-strip__value">
              <SafeText tag="span">{value}</SafeText>
            </p>
          </article>
        );
      })}
    </section>
  );
};

ConsultantSummaryStrip.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      onClick: PropTypes.func
    })
  ),
  loading: PropTypes.bool,
  className: PropTypes.string,
  ariaLabel: PropTypes.string
};

export default ConsultantSummaryStrip;
