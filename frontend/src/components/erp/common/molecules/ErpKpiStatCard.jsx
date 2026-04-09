/**
 * ERP KPI 통계 카드 Molecule — ErpSafeText / ErpSafeNumber 조합
 *
 * @author CoreSolution
 * @since 2026-04-09
 */

import React from 'react';
import PropTypes from 'prop-types';
import ErpSafeNumber, { ERP_NUMBER_FORMAT } from '../atoms/ErpSafeNumber';
import ErpSafeText from '../atoms/ErpSafeText';
import './ErpKpiStatCard.css';

const VARIANT = {
  DEFAULT: 'default',
  PRIMARY: 'primary',
  WARNING: 'warning'
};

const TREND_DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  NEUTRAL: 'neutral'
};

/**
 * @param {object} props
 * @param {unknown} props.title
 * @param {unknown} props.value
 * @param {unknown} [props.unit]
 * @param {'currency'|'count'|'percent'} [props.formatType='currency']
 * @param {{ direction: 'up'|'down'|'neutral', label?: unknown }} [props.trend]
 * @param {'default'|'primary'|'warning'} [props.variant='default']
 */
export default function ErpKpiStatCard({
  title,
  value,
  unit,
  formatType = ERP_NUMBER_FORMAT.CURRENCY,
  trend,
  variant = VARIANT.DEFAULT
}) {
  const rootClass = [
    'mg-v2-erp-stat-card',
    variant !== VARIANT.DEFAULT && `mg-v2-erp-stat-card--${variant}`
  ]
    .filter(Boolean)
    .join(' ');

  const trendDir = trend?.direction ?? TREND_DIRECTION.NEUTRAL;
  const trendClass = [
    'mg-v2-erp-stat-card__trend',
    `mg-v2-erp-stat-card__trend--${trendDir}`
  ].join(' ');

  return (
    <article className={rootClass}>
      <h3 className="mg-v2-erp-stat-card__title">
        <ErpSafeText value={title} />
      </h3>
      <div className="mg-v2-erp-stat-card__value-row">
        <p className="mg-v2-erp-stat-card__value">
          <ErpSafeNumber value={value} formatType={formatType} tag="span" />
        </p>
        {unit != null && unit !== '' && (
          <span className="mg-v2-erp-stat-card__unit">
            <ErpSafeText value={unit} />
          </span>
        )}
      </div>
      {trend?.label != null && trend.label !== '' && (
        <p className={trendClass}>
          <span aria-hidden="true">
            {trendDir === TREND_DIRECTION.UP && '▲ '}
            {trendDir === TREND_DIRECTION.DOWN && '▼ '}
            {trendDir === TREND_DIRECTION.NEUTRAL && '— '}
          </span>
          <ErpSafeText value={trend.label} />
        </p>
      )}
    </article>
  );
}

ErpKpiStatCard.propTypes = {
  title: PropTypes.any,
  value: PropTypes.any,
  unit: PropTypes.any,
  formatType: PropTypes.oneOf([
    ERP_NUMBER_FORMAT.CURRENCY,
    ERP_NUMBER_FORMAT.COUNT,
    ERP_NUMBER_FORMAT.PERCENT
  ]),
  trend: PropTypes.shape({
    direction: PropTypes.oneOf([
      TREND_DIRECTION.UP,
      TREND_DIRECTION.DOWN,
      TREND_DIRECTION.NEUTRAL
    ]),
    label: PropTypes.any
  }),
  variant: PropTypes.oneOf([VARIANT.DEFAULT, VARIANT.PRIMARY, VARIANT.WARNING])
};

export { VARIANT as ERP_KPI_STAT_VARIANT, TREND_DIRECTION as ERP_KPI_TREND_DIRECTION };
