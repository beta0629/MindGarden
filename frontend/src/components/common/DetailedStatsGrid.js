/**
 * 상세 통계 그리드 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import DetailedStatsCard from './DetailedStatsCard';
import { DETAILED_STATS_GRID_CSS } from '../../constants/css';
import { DETAILED_STATS, DETAILED_STATS_GRID } from '../../constants/charts';
import './DetailedStatsGrid.css';

const DetailedStatsGrid = ({ statistics = {} }) => {
  // 통계 데이터가 없으면 빈 그리드 반환
  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <div className={DETAILED_STATS_GRID_CSS.CONTAINER}>
        <div className={DETAILED_STATS_GRID_CSS.EMPTY}>
          <i className="fas fa-chart-line"></i>
          <p>상세 통계 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 내담자 증감 타입 결정
  const getClientChangeType = () => {
    const growth = statistics.clientGrowth || 0;
    if (growth > 0) return DETAILED_STATS.CHANGE_TYPES.POSITIVE;
    if (growth < 0) return DETAILED_STATS.CHANGE_TYPES.NEGATIVE;
    return DETAILED_STATS.CHANGE_TYPES.NEUTRAL;
  };

  // 상담사 증감 타입 결정
  const getConsultantChangeType = () => {
    const growth = statistics.consultantGrowth || 0;
    if (growth > 0) return DETAILED_STATS.CHANGE_TYPES.POSITIVE;
    if (growth < 0) return DETAILED_STATS.CHANGE_TYPES.NEGATIVE;
    return DETAILED_STATS.CHANGE_TYPES.NEUTRAL;
  };

  return (
    <div className={DETAILED_STATS_GRID_CSS.CONTAINER}>
      {/* 내담자 현황 */}
      <DetailedStatsCard
        icon={DETAILED_STATS.ICONS.CLIENT_STATUS}
        title={DETAILED_STATS.TITLES.CLIENT_STATUS}
        mainValue={statistics.thisMonthClients || 0}
        mainLabel={DETAILED_STATS.LABELS.THIS_MONTH_CLIENTS}
        subValue={statistics.clientGrowth || 0}
        subLabel={DETAILED_STATS.LABELS.CHANGE}
        changeValue={statistics.clientGrowth || 0}
        changeType={getClientChangeType()}
        changeLabel={DETAILED_STATS.LABELS.CHANGE}
        rateValue={`${statistics.clientGrowthRate || 0}${DETAILED_STATS.LABELS.PERCENTAGE}`}
        rateLabel={DETAILED_STATS.LABELS.GROWTH_RATE}
        detailValue={statistics.lastMonthClients || 0}
        detailLabel={DETAILED_STATS.LABELS.LAST_MONTH}
        descValue="지난 달 대비"
        descLabel={DETAILED_STATS.DESCRIPTIONS.CLIENT_CHANGE}
      />

      {/* 상담사 현황 */}
      <DetailedStatsCard
        icon={DETAILED_STATS.ICONS.CONSULTANT_STATUS}
        title={DETAILED_STATS.TITLES.CONSULTANT_STATUS}
        mainValue={statistics.thisMonthConsultants || 0}
        mainLabel={DETAILED_STATS.LABELS.THIS_MONTH_CONSULTANTS}
        subValue={statistics.consultantGrowth || 0}
        subLabel={DETAILED_STATS.LABELS.CHANGE}
        changeValue={statistics.consultantGrowth || 0}
        changeType={getConsultantChangeType()}
        changeLabel={DETAILED_STATS.LABELS.CHANGE}
        rateValue={`${statistics.consultantGrowthRate || 0}${DETAILED_STATS.LABELS.PERCENTAGE}`}
        rateLabel={DETAILED_STATS.LABELS.GROWTH_RATE}
        detailValue={statistics.lastMonthConsultants || 0}
        detailLabel={DETAILED_STATS.LABELS.LAST_MONTH}
        descValue="지난 달 대비"
        descLabel={DETAILED_STATS.DESCRIPTIONS.CONSULTANT_CHANGE}
      />

      {/* 완료율 */}
      <DetailedStatsCard
        icon={DETAILED_STATS.ICONS.COMPLETION_RATE}
        title={DETAILED_STATS.TITLES.COMPLETION_RATE}
        mainValue={`${statistics.completionRate || 0}${DETAILED_STATS.LABELS.PERCENTAGE}`}
        mainLabel={DETAILED_STATS.LABELS.COMPLETION_RATE}
        subValue={`${statistics.completedSchedulesInPeriod || 0} / ${statistics.totalSchedulesInPeriod || 0}`}
        subLabel={`${DETAILED_STATS.LABELS.COMPLETED}/전체`}
        detailValue={statistics.totalSchedulesInPeriod || 0}
        detailLabel={DETAILED_STATS.LABELS.TOTAL_CONSULTATIONS}
        descValue="이번 달 기준"
        descLabel={DETAILED_STATS.DESCRIPTIONS.COMPLETION_RATE_DESC}
      />

      {/* 취소율 */}
      <DetailedStatsCard
        icon={DETAILED_STATS.ICONS.CANCELLATION_RATE}
        title={DETAILED_STATS.TITLES.CANCELLATION_RATE}
        mainValue={`${statistics.cancellationRate || 0}${DETAILED_STATS.LABELS.PERCENTAGE}`}
        mainLabel={DETAILED_STATS.LABELS.CANCELLATION_RATE}
        subValue={`${statistics.cancelledSchedulesInPeriod || 0} / ${statistics.totalSchedulesInPeriod || 0}`}
        subLabel={`${DETAILED_STATS.LABELS.CANCELLED}/전체`}
        detailValue={statistics.totalSchedulesInPeriod || 0}
        detailLabel={DETAILED_STATS.LABELS.TOTAL_CONSULTATIONS}
        descValue="이번 달 기준"
        descLabel={DETAILED_STATS.DESCRIPTIONS.CANCELLATION_RATE_DESC}
      />

      {/* 주간 현황 */}
      <DetailedStatsCard
        icon={DETAILED_STATS.ICONS.WEEKLY_STATUS}
        title={DETAILED_STATS.TITLES.WEEKLY_STATUS}
        mainValue={statistics.weeklySchedules || 0}
        mainLabel={DETAILED_STATS.LABELS.WEEKLY_CONSULTATIONS}
        subValue={`${DETAILED_STATS.LABELS.COMPLETED}: ${statistics.weeklyCompleted || 0}, ${DETAILED_STATS.LABELS.CANCELLED}: ${statistics.weeklyCancelled || 0}`}
        subLabel=""
        detailValue={statistics.weeklyCompleted || 0}
        detailLabel={DETAILED_STATS.LABELS.COMPLETED}
        descValue="최근 7일간"
        descLabel={DETAILED_STATS.DESCRIPTIONS.WEEKLY_DESC}
      />

      {/* 오늘 현황 */}
      <DetailedStatsCard
        icon={DETAILED_STATS.ICONS.TODAY_STATUS}
        title={DETAILED_STATS.TITLES.TODAY_STATUS}
        mainValue={statistics.totalToday || 0}
        mainLabel={DETAILED_STATS.LABELS.TODAY_CONSULTATIONS}
        subValue={`${DETAILED_STATS.LABELS.COMPLETED}: ${statistics.completedToday || 0}, ${DETAILED_STATS.LABELS.BOOKED}: ${statistics.bookedToday || 0}`}
        subLabel=""
        detailValue={statistics.completedToday || 0}
        detailLabel={DETAILED_STATS.LABELS.COMPLETED}
        descValue="오늘 기준"
        descLabel={DETAILED_STATS.DESCRIPTIONS.TODAY_DESC}
      />
    </div>
  );
};

DetailedStatsGrid.propTypes = {
  statistics: PropTypes.object
};

DetailedStatsGrid.defaultProps = {
  statistics: {}
};

export default DetailedStatsGrid;
