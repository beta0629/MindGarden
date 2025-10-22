/**
 * 통계 그리드 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import StatisticsCard from './StatisticsCard';
import { STATS_TYPES, STATS_LABELS, STATS_ICONS, STATS_COLORS } from '../../constants/stats';
import './StatisticsGrid.css';

const StatisticsGrid = ({ 
  statistics, 
  loading = false, 
  error = false, 
  onCardClick,
  showOverall = true,
  showToday = true 
}) => {
  // 통계 데이터를 카드 형태로 변환
  const getStatisticsCards = () => {
    const cards = [];
    
    if (showOverall && statistics) {
      // 전체 통계 카드들
      const overallStats = [
        { type: STATS_TYPES.TOTAL_SCHEDULES, value: statistics.totalSchedules || 0 },
        { type: STATS_TYPES.BOOKED_SCHEDULES, value: statistics.bookedSchedules || 0 },
        { type: STATS_TYPES.CONFIRMED_SCHEDULES, value: statistics.confirmedSchedules || 0 },
        { type: STATS_TYPES.COMPLETED_SCHEDULES, value: statistics.completedSchedules || 0 },
        { type: STATS_TYPES.CANCELLED_SCHEDULES, value: statistics.cancelledSchedules || 0 },
        { type: STATS_TYPES.IN_PROGRESS_SCHEDULES, value: statistics.inProgressSchedules || 0 }
      ];
      
      overallStats.forEach(stat => {
        cards.push({
          key: stat.type,
          title: STATS_LABELS[stat.type],
          value: stat.value,
          icon: STATS_ICONS[stat.type],
          color: STATS_COLORS[stat.type],
          onClick: () => onCardClick && onCardClick(stat.type, stat.value)
        });
      });
    }
    
    if (showToday && statistics) {
      // 오늘 통계 카드들
      const todayStats = [
        { type: STATS_TYPES.TODAY_TOTAL, value: statistics.totalToday || 0 },
        { type: STATS_TYPES.TODAY_BOOKED, value: statistics.bookedToday || 0 },
        { type: STATS_TYPES.TODAY_CONFIRMED, value: statistics.confirmedToday || 0 },
        { type: STATS_TYPES.TODAY_IN_PROGRESS, value: statistics.inProgressToday || 0 },
        { type: STATS_TYPES.TODAY_COMPLETED, value: statistics.completedToday || 0 },
        { type: STATS_TYPES.TODAY_CANCELLED, value: statistics.cancelledToday || 0 }
      ];
      
      todayStats.forEach(stat => {
        cards.push({
          key: stat.type,
          title: STATS_LABELS[stat.type],
          value: stat.value,
          icon: STATS_ICONS[stat.type],
          color: STATS_COLORS[stat.type],
          onClick: () => onCardClick && onCardClick(stat.type, stat.value)
        });
      });
    }
    
    return cards;
  };

  const cards = getStatisticsCards();

  if (error) {
    return (
      <div className="statistics-grid">
        <div className="statistics-error">
          <i className="bi bi-exclamation-triangle"></i>
          <p>통계를 불러오는데 실패했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-grid">
      {cards.map(card => (
        <StatisticsCard
          key={card.key}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          loading={loading}
          onClick={card.onClick}
        />
      ))}
    </div>
  );
};

StatisticsGrid.propTypes = {
  statistics: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  onCardClick: PropTypes.func,
  showOverall: PropTypes.bool,
  showToday: PropTypes.bool
};

export default StatisticsGrid;
