/**
 * 기본 통계 카드 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import { STATS_CARD_CSS } from '../../constants/css';
import { STATS_CARD } from '../../constants/charts';
import './StatsCard.css';

const StatsCard = ({
  icon,
  title,
  value,
  label,
  change,
  changeType,
  changeLabel,
  color,
  loading = false,
  error = false
}) => {
  // 증감 타입에 따른 클래스 결정
  const getChangeClass = () => {
    if (changeType === STATS_CARD.CHANGE_TYPES.POSITIVE) {
      return STATS_CARD_CSS.CHANGE_POSITIVE;
    }
    if (changeType === STATS_CARD.CHANGE_TYPES.NEGATIVE) {
      return STATS_CARD_CSS.CHANGE_NEGATIVE;
    }
    return STATS_CARD_CSS.CHANGE;
  };

  // 증감 아이콘
  const getChangeIcon = () => {
    if (changeType === STATS_CARD.CHANGE_TYPES.POSITIVE) {
      return STATS_CARD.CHANGE_ICONS.POSITIVE;
    }
    if (changeType === STATS_CARD.CHANGE_TYPES.NEGATIVE) {
      return STATS_CARD.CHANGE_ICONS.NEGATIVE;
    }
    return STATS_CARD.CHANGE_ICONS.NEUTRAL;
  };

  // 카드 색상 클래스
  const getCardColorClass = () => {
    if (color === STATS_CARD.COLORS.PRIMARY) return STATS_CARD_CSS.CARD_PRIMARY;
    if (color === STATS_CARD.COLORS.SUCCESS) return STATS_CARD_CSS.CARD_SUCCESS;
    if (color === STATS_CARD.COLORS.WARNING) return STATS_CARD_CSS.CARD_WARNING;
    if (color === STATS_CARD.COLORS.DANGER) return STATS_CARD_CSS.CARD_DANGER;
    if (color === STATS_CARD.COLORS.INFO) return STATS_CARD_CSS.CARD_INFO;
    return STATS_CARD_CSS.CARD_DEFAULT;
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className={`${STATS_CARD_CSS.CONTAINER} ${STATS_CARD_CSS.LOADING}`}>
        <div className={STATS_CARD_CSS.LOADING_SPINNER}>
          <div className="spinner-border" role="status">
            <span className="sr-only">로딩 중...</span>
          </div>
        </div>
        <div className={STATS_CARD_CSS.LOADING_TEXT}>데이터를 불러오는 중...</div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`${STATS_CARD_CSS.CONTAINER} ${STATS_CARD_CSS.ERROR}`}>
        <div className={STATS_CARD_CSS.ERROR_ICON}>
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <div className={STATS_CARD_CSS.ERROR_TEXT}>데이터를 불러올 수 없습니다</div>
      </div>
    );
  }

  return (
    <div className={`${STATS_CARD_CSS.CONTAINER} ${getCardColorClass()}`}>
      <div className={STATS_CARD_CSS.HEADER}>
        <div className={STATS_CARD_CSS.ICON}>
          <i className={icon}></i>
        </div>
        <div className={STATS_CARD_CSS.TITLE}>{title}</div>
      </div>
      
      <div className={STATS_CARD_CSS.CONTENT}>
        <div className={STATS_CARD_CSS.VALUE}>{value}</div>
        <div className={STATS_CARD_CSS.LABEL}>{label}</div>
        
        {change !== undefined && (
          <div className={STATS_CARD_CSS.CHANGE_CONTAINER}>
            <div className={getChangeClass()}>
              {getChangeIcon()} {change}
              {changeLabel && ` ${changeLabel}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

StatsCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  change: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  changeType: PropTypes.oneOf(['positive', 'negative', 'neutral']),
  changeLabel: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info', 'default']),
  loading: PropTypes.bool,
  error: PropTypes.bool
};

StatsCard.defaultProps = {
  changeType: 'neutral',
  color: 'default',
  loading: false,
  error: false
};

export default StatsCard;
