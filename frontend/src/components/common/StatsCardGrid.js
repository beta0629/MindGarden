/**
 * 통계 카드 그리드 컴포넌트
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
      <div className="mg-v2-form-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="mg-v2-card">
            <div className="mg-v2-icon-container">
              <i className="fas fa-chart-bar" />
            </div>
            <div>
              <h3 className="mg-v2-text-sm mg-v2-font-weight-semibold mg-v2-text-secondary">
                로딩 중...
              </h3>
              <div className="mg-v2-text-xxl mg-v2-font-weight-bold mg-v2-text-primary">
                0
              </div>
              <p className="mg-v2-text-xs mg-v2-text-secondary">
                데이터를 불러오는 중
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="mg-v2-form-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="mg-v2-card">
            <div className="mg-v2-icon-container mg-v2-icon-container--error">
              <i className="fas fa-exclamation-triangle" />
            </div>
            <div>
              <h3 className="mg-v2-text-sm mg-v2-font-weight-semibold mg-v2-text-secondary">
                에러
              </h3>
              <div className="mg-v2-text-xxl mg-v2-font-weight-bold mg-v2-text-primary">
                0
              </div>
              <p className="mg-v2-text-xs mg-v2-text-secondary">
                데이터를 불러올 수 없습니다
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 통계 데이터가 없으면 빈 그리드 반환
  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <div className="stats-card-grid__empty">
        <div className="stats-card-grid__empty-inner">
          <i className="fas fa-chart-bar stats-card-grid__empty-icon" />
          <p className="stats-card-grid__empty-text">
            통계 데이터를 불러오는 중입니다...
          </p>
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
    <div className="stats-card-grid__layout">
      {/* 총 상담 수 */}
      <div className="stats-card-grid__card stats-card-grid__card--primary">
        <div className="stats-card-grid__card-icon stats-card-grid__card-icon--primary">
          <i className="bi bi-graph-up stats-card-grid__card-icon-svg" />
        </div>
        <div>
          <h3 className="stats-card-grid__card-title">
            총 상담 수
          </h3>
          <div className="stats-card-grid__card-value stats-card-grid__card-value--primary">
            {statistics.totalSchedules || 0}
          </div>
          <p className="stats-card-grid__card-subtitle">
            전체 상담
          </p>
        </div>
      </div>

      {/* 예약된 상담 */}
      <div className="stats-card-grid__card stats-card-grid__card--warning">
        <div className="stats-card-grid__card-icon stats-card-grid__card-icon--warning">
          <i className="bi bi-calendar-check stats-card-grid__card-icon-svg" />
        </div>
        <div>
          <h3 className="stats-card-grid__card-title">
            예약된 상담
          </h3>
          <div className="stats-card-grid__card-value stats-card-grid__card-value--warning">
            {statistics.bookedSchedules || 0}
          </div>
          <p className="stats-card-grid__card-subtitle">
            예약 대기
          </p>
        </div>
      </div>

      {/* 완료된 상담 */}
      <div className="stats-card-grid__card stats-card-grid__card--success">
        <div className="stats-card-grid__card-icon stats-card-grid__card-icon--success">
          <i className="bi bi-check-circle-fill stats-card-grid__card-icon-svg" />
        </div>
        <div>
          <h3 className="stats-card-grid__card-title">
            완료된 상담
          </h3>
          <div className="stats-card-grid__card-value stats-card-grid__card-value--success">
            {statistics.completedSchedules || 0}
          </div>
          <p className="stats-card-grid__card-subtitle">
            상담 완료
          </p>
        </div>
      </div>

      {/* 취소된 상담 */}
      <div className="stats-card-grid__card stats-card-grid__card--error">
        <div className="stats-card-grid__card-icon stats-card-grid__card-icon--error">
          <i className="bi bi-x-circle-fill stats-card-grid__card-icon-svg" />
        </div>
        <div>
          <h3 className="stats-card-grid__card-title">
            취소된 상담
          </h3>
          <div className="stats-card-grid__card-value stats-card-grid__card-value--error">
            {statistics.cancelledSchedules || 0}
          </div>
          <p className="stats-card-grid__card-subtitle">
            상담 취소
          </p>
        </div>
      </div>
    </div>
  );
};

StatsCardGrid.propTypes = {
  statistics: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  showChange: PropTypes.bool
};

export default StatsCardGrid;
