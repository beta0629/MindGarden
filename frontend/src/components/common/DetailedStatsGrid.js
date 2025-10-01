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
      <div className="detailed-stats-grid">
        <div className="detailed-stats-empty">
          <i className="fas fa-chart-line detailed-stats-empty-icon"></i>
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
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div className="detailed-stats-card-icon">
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#7B68EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: '#ffffff',
            marginRight: '16px'
          }}>
            <i className="bi bi-people-fill detailed-stats-card-icon-svg"></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: '#495057'
          }}>내담자 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: '#7B68EE',
          marginBottom: '8px'
        }}>
          {statistics.thisMonthClients || 0}
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: '#6c757d'
        }}>이번 달 내담자: {statistics.thisMonthClients || 0}명</p>
        <div className="detailed-stats-card-header">
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <span className="detailed-stats-card-growth-icon">↗</span>
          <span className="detailed-stats-card-growth-value">{statistics.clientGrowth || 0}명</span>
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d',
          marginBottom: '4px'
        }}>
          {statistics.clientGrowthRate || 0}% 증감률
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d',
          marginBottom: '4px'
        }}>
          {statistics.lastMonthClients || 0} 지난 달
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d'
        }}>
          지난 달 대비 지난 달 대비 내담자 변화
        </div>
      </div>

      {/* 상담사 현황 */}
      <div className="detailed-stats-card detailed-stats-card--consultants">
        <div className="detailed-stats-card-header">
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div className="detailed-stats-card-icon">
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#7B68EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: '#ffffff',
            marginRight: '16px'
          }}>
            <i className="bi bi-person-badge-fill detailed-stats-card-icon-svg"></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: '#495057'
          }}>상담사 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: '#7B68EE',
          marginBottom: '8px'
        }}>
          {statistics.thisMonthConsultants || 0}
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: '#6c757d'
        }}>이번 달 상담사: {statistics.thisMonthConsultants || 0}명</p>
        <div className="detailed-stats-card-header">
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <span className="detailed-stats-card-growth-icon">↗</span>
          <span className="detailed-stats-card-growth-value">{statistics.consultantGrowth || 0}명</span>
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d',
          marginBottom: '4px'
        }}>
          {statistics.consultantGrowthRate || 0}% 증감률
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d',
          marginBottom: '4px'
        }}>
          {statistics.lastMonthConsultants || 0} 지난 달
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d'
        }}>
          지난 달 대비 지난 달 대비 상담사 변화
        </div>
      </div>

      {/* 완료율 */}
      <div style={{
        backgroundColor: '#D4F1E0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #C8E6C9',
        transition: 'all 0.3s ease'
      }}>
        <div className="detailed-stats-card-header">
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div className="detailed-stats-card-icon">
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#4CAF50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: '#ffffff',
            marginRight: '16px'
          }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: 'var(--font-size-xl)' }}></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: '#495057'
          }}>완료율</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: '#4CAF50',
          marginBottom: '8px'
        }}>
          {statistics.completionRate || 0}%
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: '#6c757d'
        }}>이번 달 완료율</p>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d',
          marginBottom: '4px'
        }}>
          {statistics.completedSchedulesInPeriod || 0} / {statistics.totalSchedulesInPeriod || 0} 완료/전체
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d'
        }}>
          이번 달 기준 이번 달 기준 상담 완료율
        </div>
      </div>

      {/* 취소율 */}
      <div style={{
        backgroundColor: '#FFE0DB',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #FFCDD2',
        transition: 'all 0.3s ease'
      }}>
        <div className="detailed-stats-card-header">
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div className="detailed-stats-card-icon">
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#F44336',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: '#ffffff',
            marginRight: '16px'
          }}>
            <i className="bi bi-x-circle-fill" style={{ fontSize: 'var(--font-size-xl)' }}></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: '#495057'
          }}>취소율</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: '#F44336',
          marginBottom: '8px'
        }}>
          {statistics.cancellationRate || 0}%
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: '#6c757d'
        }}>이번 달 취소율</p>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d',
          marginBottom: '4px'
        }}>
          {statistics.cancelledSchedulesInPeriod || 0} / {statistics.totalSchedulesInPeriod || 0} 취소/전체
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d'
        }}>
          이번 달 기준 이번 달 기준 상담 취소율
        </div>
      </div>

      {/* 주간 현황 */}
      <div style={{
        backgroundColor: '#FFE8D1',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #FFCCBC',
        transition: 'all 0.3s ease'
      }}>
        <div className="detailed-stats-card-header">
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div className="detailed-stats-card-icon">
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#FF9800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: '#ffffff',
            marginRight: '16px'
          }}>
            <i className="bi bi-calendar-week-fill" style={{ fontSize: 'var(--font-size-xl)' }}></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: '#495057'
          }}>주간 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: '#FF9800',
          marginBottom: '8px'
        }}>
          {statistics.weeklySchedules || 0}
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: '#6c757d'
        }}>최근 7일 상담</p>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d',
          marginBottom: '4px'
        }}>
          완료: {statistics.weeklyCompleted || 0}, 취소: {statistics.weeklyCancelled || 0}
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d'
        }}>
          최근 7일간 최근 7일간 상담 현황
        </div>
      </div>

      {/* 오늘 현황 */}
      <div style={{
        backgroundColor: '#E3F2FD',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #BBDEFB',
        transition: 'all 0.3s ease'
      }}>
        <div className="detailed-stats-card-header">
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div className="detailed-stats-card-icon">
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#2196F3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: '#ffffff',
            marginRight: '16px'
          }}>
            <i className="bi bi-calendar-day-fill" style={{ fontSize: 'var(--font-size-xl)' }}></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: '#495057'
          }}>오늘 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: '#2196F3',
          marginBottom: '8px'
        }}>
          {statistics.totalToday || 0}
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: '#6c757d'
        }}>오늘 상담</p>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d',
          marginBottom: '4px'
        }}>
          완료: {statistics.completedToday || 0}, 예약: {statistics.bookedToday || 0}
        </div>
        <div className="detailed-stats-card-growth-label">
          color: '#6c757d'
        }}>
          오늘 기준 오늘 기준 상담 현황
        </div>
      </div>
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
