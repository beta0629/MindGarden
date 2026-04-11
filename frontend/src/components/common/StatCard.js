/**
 * 통계 카드 단일 진입점
 * layout: default | glass | detailed. GlassStatCard/DetailedStatsCard는 layout으로 흡수.
 * StatsCard·StatisticsCard는 용도별 호환용으로 동일 common에서 re-export.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { DETAILED_STATS_CARD_CSS } from '../../constants/css';
import { DETAILED_STATS as DETAILED_STATS_CONSTANTS } from '../../constants/charts';
import './StatCard.css';
import './GlassStatCard.css';
import './DetailedStatsCard.css';

const StatCard = ({
  layout = 'default',
  icon,
  title,
  value,
  description,
  variant = 'default',
  onClick,
  // glass layout
  label,
  color = 'primary',
  className = '',
  // detailed layout
  mainValue,
  mainLabel,
  subValue,
  subLabel,
  changeValue,
  changeType = 'neutral',
  changeLabel,
  rateValue,
  rateLabel,
  detailValue,
  detailLabel,
  descValue,
  descLabel,
  ...rest
}) => {
  if (layout === 'glass') {
    return (
      <div
        className={`glass-stat-card ${className}`.trim()}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        {...rest}
      >
        <div className={`glass-stat-card__icon glass-stat-card__icon--${color}`}>
          {icon}
        </div>
        <div className="glass-stat-card__value">{value}</div>
        <div className="glass-stat-card__label">{label}</div>
      </div>
    );
  }

  if (layout === 'detailed') {
    const getChangeClass = () => {
      if (changeType === DETAILED_STATS_CONSTANTS.CHANGE_TYPES.POSITIVE) {
        return DETAILED_STATS_CARD_CSS.CHANGE_POSITIVE;
      }
      if (changeType === DETAILED_STATS_CONSTANTS.CHANGE_TYPES.NEGATIVE) {
        return DETAILED_STATS_CARD_CSS.CHANGE_NEGATIVE;
      }
      return DETAILED_STATS_CARD_CSS.CHANGE;
    };
    const getChangeIcon = () => {
      if (changeType === DETAILED_STATS_CONSTANTS.CHANGE_TYPES.POSITIVE) {
        return DETAILED_STATS_CONSTANTS.CHANGE_ICONS.POSITIVE;
      }
      if (changeType === DETAILED_STATS_CONSTANTS.CHANGE_TYPES.NEGATIVE) {
        return DETAILED_STATS_CONSTANTS.CHANGE_ICONS.NEGATIVE;
      }
      return DETAILED_STATS_CONSTANTS.CHANGE_ICONS.NEUTRAL;
    };
    return (
      <div className={DETAILED_STATS_CARD_CSS.CONTAINER}>
        <div className={DETAILED_STATS_CARD_CSS.HEADER}>
          <div className={DETAILED_STATS_CARD_CSS.ICON}>
            <i className={icon} aria-hidden="true" />
          </div>
          <div className={DETAILED_STATS_CARD_CSS.TITLE}>{title}</div>
        </div>
        <div className={DETAILED_STATS_CARD_CSS.CONTENT}>
          <div className={DETAILED_STATS_CARD_CSS.MAIN}>
            <div className={DETAILED_STATS_CARD_CSS.NUMBER}>{mainValue}</div>
            <div className={DETAILED_STATS_CARD_CSS.LABEL}>{mainLabel}</div>
          </div>
          {subValue !== undefined && (
            <div className={DETAILED_STATS_CARD_CSS.SUB}>
              <div className={DETAILED_STATS_CARD_CSS.DETAIL}>
                {subValue} {subLabel}
              </div>
              {changeValue !== undefined && (
                <div className={getChangeClass()}>
                  {getChangeIcon()} {changeValue}
                  {changeLabel ? ` ${changeLabel}` : ''}
                </div>
              )}
            </div>
          )}
          {rateValue !== undefined && (
            <div className={DETAILED_STATS_CARD_CSS.SUB}>
              <div className={DETAILED_STATS_CARD_CSS.RATE}>
                {rateValue} {rateLabel}
              </div>
              {detailValue !== undefined && (
                <div className={DETAILED_STATS_CARD_CSS.DETAIL}>
                  {detailValue} {detailLabel}
                </div>
              )}
            </div>
          )}
          {descValue && (
            <div className={DETAILED_STATS_CARD_CSS.DESC}>
              {descValue} {descLabel}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`stat-card stat-card-${variant} ${onClick ? 'stat-card-clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-description">{description}</div>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  layout: PropTypes.oneOf(['default', 'glass', 'detailed']),
  icon: PropTypes.node,
  title: PropTypes.node,
  value: PropTypes.node,
  description: PropTypes.node,
  variant: PropTypes.string,
  onClick: PropTypes.func,
  label: PropTypes.node,
  color: PropTypes.string,
  className: PropTypes.string,
  mainValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mainLabel: PropTypes.string,
  subValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  subLabel: PropTypes.string,
  changeValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  changeType: PropTypes.oneOf(['positive', 'negative', 'neutral']),
  changeLabel: PropTypes.string,
  rateValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rateLabel: PropTypes.string,
  detailValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  detailLabel: PropTypes.string,
  descValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  descLabel: PropTypes.string
};

export default StatCard;
export { default as StatsCard } from './StatsCard';
export { default as StatisticsCard } from './StatisticsCard';

