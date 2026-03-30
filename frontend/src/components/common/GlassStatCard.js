/**
 * 글래스모피즘 통계 카드. StatCard layout="glass" 래퍼.
 * @see StatCard
 */

import React from 'react';
import StatCard from './StatCard';

const GlassStatCard = (props) => {
  return <StatCard {...props} layout="glass" />;
};

export default GlassStatCard;
