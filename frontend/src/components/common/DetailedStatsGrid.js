/**
 * 상세 통계 그리드 컴포넌트
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
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
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7B68EE -> var(--mg-custom-7B68EE)
            backgroundColor: '#7B68EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: 'var(--mg-white)',
            marginRight: '16px'
          }}>
            <i className="bi bi-people-fill detailed-stats-card-icon-svg"></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
            color: '#495057'
          }}>내담자 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7B68EE -> var(--mg-custom-7B68EE)
          color: '#7B68EE',
          marginBottom: '8px'
        }}>
          {statistics.thisMonthClients || 0}
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: 'var(--mg-secondary-500)'
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
          color: 'var(--mg-secondary-500)',
          marginBottom: '4px'
        }}>
          {statistics.clientGrowthRate || 0}% 증감률
        </div>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)',
          marginBottom: '4px'
        }}>
          {statistics.lastMonthClients || 0} 지난 달
        </div>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)'
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
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7B68EE -> var(--mg-custom-7B68EE)
            backgroundColor: '#7B68EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: 'var(--mg-white)',
            marginRight: '16px'
          }}>
            <i className="bi bi-person-badge-fill detailed-stats-card-icon-svg"></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
            color: '#495057'
          }}>상담사 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7B68EE -> var(--mg-custom-7B68EE)
          color: '#7B68EE',
          marginBottom: '8px'
        }}>
          {statistics.thisMonthConsultants || 0}
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: 'var(--mg-secondary-500)'
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
          color: 'var(--mg-secondary-500)',
          marginBottom: '4px'
        }}>
          {statistics.consultantGrowthRate || 0}% 증감률
        </div>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)',
          marginBottom: '4px'
        }}>
          {statistics.lastMonthConsultants || 0} 지난 달
        </div>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)'
        }}>
          지난 달 대비 지난 달 대비 상담사 변화
        </div>
      </div>

      {/* 완료율 */}
      <div className="detailed-stats-completion-rate">
        <div className="detailed-stats-card-header">
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div className="detailed-stats-card-icon">
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--mg-success-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: 'var(--mg-white)',
            marginRight: '16px'
          }}>
            <i className="bi bi-check-circle-fill mg-v2-text-xl"></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
            color: '#495057'
          }}>완료율</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: 'var(--mg-success-500)',
          marginBottom: '8px'
        }}>
          {statistics.completionRate || 0}%
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: 'var(--mg-secondary-500)'
        }}>이번 달 완료율</p>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)',
          marginBottom: '4px'
        }}>
          {statistics.completedSchedulesInPeriod || 0} / {statistics.totalSchedulesInPeriod || 0} 완료/전체
        </div>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)'
        }}>
          이번 달 기준 이번 달 기준 상담 완료율
        </div>
      </div>

      {/* 취소율 */}
      <div style={{
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFE0DB -> var(--mg-custom-FFE0DB)
        backgroundColor: '#FFE0DB',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px var(--mg-shadow-light)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFCDD2 -> var(--mg-custom-FFCDD2)
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
            backgroundColor: 'var(--mg-error-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: 'var(--mg-white)',
            marginRight: '16px'
          }}>
            <i className="bi bi-x-circle-fill mg-v2-text-xl"></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
            color: '#495057'
          }}>취소율</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: 'var(--mg-error-500)',
          marginBottom: '8px'
        }}>
          {statistics.cancellationRate || 0}%
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: 'var(--mg-secondary-500)'
        }}>이번 달 취소율</p>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)',
          marginBottom: '4px'
        }}>
          {statistics.cancelledSchedulesInPeriod || 0} / {statistics.totalSchedulesInPeriod || 0} 취소/전체
        </div>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)'
        }}>
          이번 달 기준 이번 달 기준 상담 취소율
        </div>
      </div>

      {/* 주간 현황 */}
      <div style={{
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFE8D1 -> var(--mg-custom-FFE8D1)
        backgroundColor: '#FFE8D1',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px var(--mg-shadow-light)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFCCBC -> var(--mg-custom-FFCCBC)
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
            backgroundColor: 'var(--mg-warning-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: 'var(--mg-white)',
            marginRight: '16px'
          }}>
            <i className="bi bi-calendar-week-fill mg-v2-text-xl"></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
            color: '#495057'
          }}>주간 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: 'var(--mg-warning-500)',
          marginBottom: '8px'
        }}>
          {statistics.weeklySchedules || 0}
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: 'var(--mg-secondary-500)'
        }}>최근 7일 상담</p>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)',
          marginBottom: '4px'
        }}>
          완료: {statistics.weeklyCompleted || 0}, 취소: {statistics.weeklyCancelled || 0}
        </div>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)'
        }}>
          최근 7일간 최근 7일간 상담 현황
        </div>
      </div>

      {/* 오늘 현황 */}
      <div style={{
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #E3F2FD -> var(--mg-custom-E3F2FD)
        backgroundColor: '#E3F2FD',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px var(--mg-shadow-light)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #BBDEFB -> var(--mg-custom-BBDEFB)
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
            backgroundColor: 'var(--mg-primary-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            color: 'var(--mg-white)',
            marginRight: '16px'
          }}>
            <i className="bi bi-calendar-day-fill mg-v2-text-xl"></i>
          </div>
          <h3 className="detailed-stats-card-title">
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
            color: '#495057'
          }}>오늘 현황</h3>
        </div>
        <div className="detailed-stats-card-value">
          fontWeight: '700',
          color: 'var(--mg-primary-500)',
          marginBottom: '8px'
        }}>
          {statistics.totalToday || 0}
        </div>
        <p className="detailed-stats-card-description">
          fontSize: 'var(--font-size-sm)',
          color: 'var(--mg-secondary-500)'
        }}>오늘 상담</p>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)',
          marginBottom: '4px'
        }}>
          완료: {statistics.completedToday || 0}, 예약: {statistics.bookedToday || 0}
        </div>
        <div className="detailed-stats-card-growth-label">
          color: 'var(--mg-secondary-500)'
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

export default DetailedStatsGrid;
