/**
 * 상세 통계 카드. StatCard layout="detailed" 래퍼.
 * @see StatCard
 * @author Core Solution
 * @since 2025-09-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import StatCard from './StatCard';

const DetailedStatsCard = (props) => {
  return <StatCard {...props} layout="detailed" />;
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

export default DetailedStatsCard;
