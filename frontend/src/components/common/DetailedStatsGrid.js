/**
 * 상세 통계 그리드 컴포넌트
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-09-05
 *
 * T8 핫픽스 (2026-05-21): 이전 codemod 잔재로 JSX 텍스트 child 에
 * 객체 리터럴 내용(`alignItems: 'center', marginBottom: '20px' }}` 등)이
 * 그대로 노출되던 영역을 정상 JSX 로 복구. 인라인 의도 스타일은
 * `DetailedStatsGrid.css` 에 클래스로 이관(시각·동작 1:1 동등).
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
      <div className="detailed-stats-grid">
        <div className="detailed-stats-empty">
          <i className="fas fa-chart-line detailed-stats-empty-icon" />
          <p className="detailed-stats-empty-text">상세 통계 데이터를 불러오는 중입니다...</p>
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
    <div className="detailed-stats-grid">
      {/* 내담자 현황 */}
      <div className="detailed-stats-card detailed-stats-card--clients">
        <div className="detailed-stats-card-header">
          <div className="detailed-stats-card-icon">
            <i className="bi bi-people-fill detailed-stats-card-icon-svg" />
          </div>
          <h3 className="detailed-stats-card-title">내담자 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          {statistics.thisMonthClients || 0}
        </div>
        <p className="detailed-stats-card-description">이번 달 내담자: {statistics.thisMonthClients || 0}명</p>
        <div className="detailed-stats-card-growth-row">
          <span className="detailed-stats-card-growth-icon">↗</span>
          <span className="detailed-stats-card-growth-value">{statistics.clientGrowth || 0}명</span>
        </div>
        <div className="detailed-stats-card-growth-label">
          {statistics.clientGrowthRate || 0}% 증감률
        </div>
        <div className="detailed-stats-card-growth-label">
          {statistics.lastMonthClients || 0} 지난 달
        </div>
        <div className="detailed-stats-card-growth-label">
          지난 달 대비 지난 달 대비 내담자 변화
        </div>
      </div>

      {/* 상담사 현황 */}
      <div className="detailed-stats-card detailed-stats-card--consultants">
        <div className="detailed-stats-card-header">
          <div className="detailed-stats-card-icon">
            <i className="bi bi-person-badge-fill detailed-stats-card-icon-svg" />
          </div>
          <h3 className="detailed-stats-card-title">상담사 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          {statistics.thisMonthConsultants || 0}
        </div>
        <p className="detailed-stats-card-description">이번 달 상담사: {statistics.thisMonthConsultants || 0}명</p>
        <div className="detailed-stats-card-growth-row">
          <span className="detailed-stats-card-growth-icon">↗</span>
          <span className="detailed-stats-card-growth-value">{statistics.consultantGrowth || 0}명</span>
        </div>
        <div className="detailed-stats-card-growth-label">
          {statistics.consultantGrowthRate || 0}% 증감률
        </div>
        <div className="detailed-stats-card-growth-label">
          {statistics.lastMonthConsultants || 0} 지난 달
        </div>
        <div className="detailed-stats-card-growth-label">
          지난 달 대비 지난 달 대비 상담사 변화
        </div>
      </div>

      {/* 완료율 */}
      <div className="detailed-stats-completion-rate">
        <div className="detailed-stats-card-header">
          <div className="detailed-stats-card-icon">
            <i className="bi bi-check-circle-fill detailed-stats-card-icon-svg" />
          </div>
          <h3 className="detailed-stats-card-title">완료율</h3>
        </div>
        <div className="detailed-stats-card-value">
          {statistics.completionRate || 0}%
        </div>
        <p className="detailed-stats-card-description">이번 달 완료율</p>
        <div className="detailed-stats-card-growth-label">
          {statistics.completedSchedulesInPeriod || 0} / {statistics.totalSchedulesInPeriod || 0} 완료/전체
        </div>
        <div className="detailed-stats-card-growth-label">
          이번 달 기준 이번 달 기준 상담 완료율
        </div>
      </div>

      {/* 취소율 */}
      <div className="detailed-stats-card--cancellation">
        <div className="detailed-stats-card-header">
          <div className="detailed-stats-card-icon">
            <i className="bi bi-x-circle-fill detailed-stats-card-icon-svg" />
          </div>
          <h3 className="detailed-stats-card-title">취소율</h3>
        </div>
        <div className="detailed-stats-card-value">
          {statistics.cancellationRate || 0}%
        </div>
        <p className="detailed-stats-card-description">이번 달 취소율</p>
        <div className="detailed-stats-card-growth-label">
          {statistics.cancelledSchedulesInPeriod || 0} / {statistics.totalSchedulesInPeriod || 0} 취소/전체
        </div>
        <div className="detailed-stats-card-growth-label">
          이번 달 기준 이번 달 기준 상담 취소율
        </div>
      </div>

      {/* 주간 현황 */}
      <div className="detailed-stats-card--weekly">
        <div className="detailed-stats-card-header">
          <div className="detailed-stats-card-icon">
            <i className="bi bi-calendar-week-fill detailed-stats-card-icon-svg" />
          </div>
          <h3 className="detailed-stats-card-title">주간 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          {statistics.weeklySchedules || 0}
        </div>
        <p className="detailed-stats-card-description">최근 7일 상담</p>
        <div className="detailed-stats-card-growth-label">
          완료: {statistics.weeklyCompleted || 0}, 취소: {statistics.weeklyCancelled || 0}
        </div>
        <div className="detailed-stats-card-growth-label">
          최근 7일간 최근 7일간 상담 현황
        </div>
      </div>

      {/* 오늘 현황 */}
      <div className="detailed-stats-card--today">
        <div className="detailed-stats-card-header">
          <div className="detailed-stats-card-icon">
            <i className="bi bi-calendar-day-fill detailed-stats-card-icon-svg" />
          </div>
          <h3 className="detailed-stats-card-title">오늘 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          {statistics.totalToday || 0}
        </div>
        <p className="detailed-stats-card-description">오늘 상담</p>
        <div className="detailed-stats-card-growth-label">
          완료: {statistics.completedToday || 0}, 예약: {statistics.bookedToday || 0}
        </div>
        <div className="detailed-stats-card-growth-label">
          오늘 기준 오늘 기준 상담 현황
        </div>
      </div>
    </div>
  );
};

DetailedStatsGrid.propTypes = {
  statistics: PropTypes.object
};

export default DetailedStatsGrid;
