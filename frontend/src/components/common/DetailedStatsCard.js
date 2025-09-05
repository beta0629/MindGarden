/**
 * 상세 통계 카드 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import { DETAILED_STATS_CARD_CSS, DETAILED_STATS } from '../../constants/css';
import { DETAILED_STATS as DETAILED_STATS_CONSTANTS } from '../../constants/charts';
import './DetailedStatsCard.css';

const DetailedStatsCard = ({
  icon,
  title,
  mainValue,
  mainLabel,
  subValue,
  subLabel,
  changeValue,
  changeType,
  changeLabel,
  rateValue,
  rateLabel,
  detailValue,
  detailLabel,
  descValue,
  descLabel
}) => {
  // 증감 타입에 따른 클래스 결정
  const getChangeClass = () => {
    if (changeType === DETAILED_STATS_CONSTANTS.CHANGE_TYPES.POSITIVE) {
      return DETAILED_STATS_CARD_CSS.CHANGE_POSITIVE;
    }
    if (changeType === DETAILED_STATS_CONSTANTS.CHANGE_TYPES.NEGATIVE) {
      return DETAILED_STATS_CARD_CSS.CHANGE_NEGATIVE;
    }
    return DETAILED_STATS_CARD_CSS.CHANGE;
  };

  // 증감 화살표 아이콘
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
          <i className={icon}></i>
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
                {changeLabel && ` ${changeLabel}`}
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
};

DetailedStatsCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  mainValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  mainLabel: PropTypes.string.isRequired,
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

DetailedStatsCard.defaultProps = {
  changeType: 'neutral'
};

export default DetailedStatsCard;
