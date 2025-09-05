/**
 * 통계 카드 그리드 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import StatsCard from './StatsCard';
import { STATS_CARD_GRID_CSS } from '../../constants/css';
import { STATS_CARD, STATS_CARD_GRID } from '../../constants/charts';
import './StatsCardGrid.css';

const StatsCardGrid = ({ 
  statistics = {}, 
  loading = false, 
  error = false,
  showChange = true 
}) => {
  // 로딩 상태
  if (loading) {
    return (
      <div className={STATS_CARD_GRID_CSS.CONTAINER}>
        {Array.from({ length: 4 }, (_, index) => (
          <StatsCard
            key={index}
            icon="fas fa-chart-bar"
            title="로딩 중..."
            value="0"
            label="데이터를 불러오는 중"
            loading={true}
          />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={STATS_CARD_GRID_CSS.CONTAINER}>
        {Array.from({ length: 4 }, (_, index) => (
          <StatsCard
            key={index}
            icon="fas fa-exclamation-triangle"
            title="에러"
            value="0"
            label="데이터를 불러올 수 없습니다"
            error={true}
          />
        ))}
      </div>
    );
  }

  // 통계 데이터가 없으면 빈 그리드 반환
  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <div className={STATS_CARD_GRID_CSS.CONTAINER}>
        <div className={STATS_CARD_GRID_CSS.EMPTY}>
          <i className="fas fa-chart-bar"></i>
          <p>통계 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 증감 타입 결정
  const getChangeType = (value) => {
    if (value > 0) return STATS_CARD.CHANGE_TYPES.POSITIVE;
    if (value < 0) return STATS_CARD.CHANGE_TYPES.NEGATIVE;
    return STATS_CARD.CHANGE_TYPES.NEUTRAL;
  };

  return (
    <div className={STATS_CARD_GRID_CSS.CONTAINER}>
      {/* 총 상담 수 */}
      <StatsCard
        icon={STATS_CARD.ICONS.TOTAL_SCHEDULES}
        title={STATS_CARD.TITLES.TOTAL_SCHEDULES}
        value={statistics.totalSchedules || 0}
        label={STATS_CARD.LABELS.TOTAL_SCHEDULES}
        change={showChange ? (statistics.totalSchedules || 0) : undefined}
        changeType={showChange ? getChangeType(statistics.totalSchedules || 0) : undefined}
        changeLabel={showChange ? STATS_CARD.LABELS.CHANGE : undefined}
        color={STATS_CARD.COLORS.PRIMARY}
      />

      {/* 예약된 상담 */}
      <StatsCard
        icon={STATS_CARD.ICONS.BOOKED_SCHEDULES}
        title={STATS_CARD.TITLES.BOOKED_SCHEDULES}
        value={statistics.bookedSchedules || 0}
        label={STATS_CARD.LABELS.BOOKED_SCHEDULES}
        change={showChange ? (statistics.bookedSchedules || 0) : undefined}
        changeType={showChange ? getChangeType(statistics.bookedSchedules || 0) : undefined}
        changeLabel={showChange ? STATS_CARD.LABELS.CHANGE : undefined}
        color={STATS_CARD.COLORS.INFO}
      />

      {/* 완료된 상담 */}
      <StatsCard
        icon={STATS_CARD.ICONS.COMPLETED_SCHEDULES}
        title={STATS_CARD.TITLES.COMPLETED_SCHEDULES}
        value={statistics.completedSchedules || 0}
        label={STATS_CARD.LABELS.COMPLETED_SCHEDULES}
        change={showChange ? (statistics.completedSchedules || 0) : undefined}
        changeType={showChange ? getChangeType(statistics.completedSchedules || 0) : undefined}
        changeLabel={showChange ? STATS_CARD.LABELS.CHANGE : undefined}
        color={STATS_CARD.COLORS.SUCCESS}
      />

      {/* 취소된 상담 */}
      <StatsCard
        icon={STATS_CARD.ICONS.CANCELLED_SCHEDULES}
        title={STATS_CARD.TITLES.CANCELLED_SCHEDULES}
        value={statistics.cancelledSchedules || 0}
        label={STATS_CARD.LABELS.CANCELLED_SCHEDULES}
        change={showChange ? (statistics.cancelledSchedules || 0) : undefined}
        changeType={showChange ? getChangeType(statistics.cancelledSchedules || 0) : undefined}
        changeLabel={showChange ? STATS_CARD.LABELS.CHANGE : undefined}
        color={STATS_CARD.COLORS.DANGER}
      />
    </div>
  );
};

StatsCardGrid.propTypes = {
  statistics: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  showChange: PropTypes.bool
};

StatsCardGrid.defaultProps = {
  statistics: {},
  loading: false,
  error: false,
  showChange: true
};

export default StatsCardGrid;
