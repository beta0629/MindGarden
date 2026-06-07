/**
 * PushMonitorKpiCard — KPI 4분류 카드 atom.
 *
 * 디자이너 핸드오프 §4.3 / §5.1. 좌측 4px 세로 악센트 바 + label / value / subtitle / 분포
 * inline pill list 구조. `variant` 별 색은 CSS 변수만 사용(D11 하드코딩 0).
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import './PushMonitorKpiCard.css';

const VARIANTS = Object.freeze({
  QUEUE: 'queue',
  SUCCESS: 'success',
  FAILURE: 'failure',
  SKIP: 'skip'
});

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return '—';
    }
    return value.toLocaleString('ko-KR');
  }
  return String(value);
};

const PushMonitorKpiCard = ({
  variant,
  label,
  value = 0,
  unit = '',
  subtitle = '',
  distribution = null,
  ariaLabel = '',
  loading = false
}) => {
  const className = [
    'mg-push-monitor__kpi-card',
    `mg-push-monitor__kpi-card--${variant}`,
    loading ? 'mg-push-monitor__kpi-card--loading' : ''
  ].filter(Boolean).join(' ');

  const valueText = `${formatValue(value)}${unit ? ` ${unit}` : ''}`;
  const composedAria = ariaLabel
    || `${label}: ${valueText}${subtitle ? `, ${subtitle}` : ''}`;

  return (
    <div
      className={className}
      role="figure"
      aria-label={composedAria}
      data-testid={`push-monitor-kpi-card-${variant}`}
    >
      <div className="mg-push-monitor__kpi-card__label">{label}</div>
      <div className="mg-push-monitor__kpi-card__value">{valueText}</div>
      {subtitle ? (
        <div className="mg-push-monitor__kpi-card__subtitle">{subtitle}</div>
      ) : null}
      {Array.isArray(distribution) && distribution.length > 0 ? (
        <ul className="mg-push-monitor__kpi-card__distribution" aria-hidden="true">
          {distribution.map((item, idx) => (
            <li
              key={`${variant}-dist-${idx}-${item.label}`}
              className="mg-push-monitor__kpi-card__distribution-item"
            >
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

PushMonitorKpiCard.propTypes = {
  variant: PropTypes.oneOf(Object.values(VARIANTS)).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unit: PropTypes.string,
  subtitle: PropTypes.string,
  distribution: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired
  })),
  ariaLabel: PropTypes.string,
  loading: PropTypes.bool
};

export default PushMonitorKpiCard;
export { VARIANTS as PUSH_MONITOR_KPI_VARIANTS };
