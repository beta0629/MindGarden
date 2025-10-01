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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e9ecef',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-xxl)',
              color: '#6c757d'
            }}>
              <i className="fas fa-chart-bar"></i>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
                로딩 중...
              </h3>
              <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: '700', color: '#2c3e50', margin: '0 0 4px 0' }}>
                0
              </div>
              <p style={{ margin: '0', fontSize: 'var(--font-size-xs)', color: '#6c757d' }}>
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e9ecef',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              backgroundColor: '#fff5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-xxl)',
              color: '#e53e3e'
            }}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
                에러
              </h3>
              <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: '700', color: '#2c3e50', margin: '0 0 4px 0' }}>
                0
              </div>
              <p style={{ margin: '0', fontSize: 'var(--font-size-xs)', color: '#6c757d' }}>
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e9ecef',
        marginBottom: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-chart-bar" style={{ fontSize: 'var(--font-size-xxxl)', color: '#6c757d', marginBottom: '16px' }}></i>
          <p style={{ margin: '0', fontSize: 'var(--font-size-base)', color: '#6c757d' }}>
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
      padding: '0 8px'
    }}>
      {/* 총 상담 수 */}
      <div style={{
        backgroundColor: '#E8E0FF',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #D1C4E9',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          backgroundColor: '#7B68EE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-xxl)',
          color: '#ffffff'
        }}>
          <i className="bi bi-graph-up" style={{ fontSize: 'var(--font-size-xxl)' }}></i>
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
            총 상담 수
          </h3>
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: '700', color: '#7B68EE', margin: '0 0 4px 0' }}>
            {statistics.totalSchedules || 0}
          </div>
          <p style={{ margin: '0', fontSize: 'var(--font-size-xs)', color: '#6c757d' }}>
            전체 상담
          </p>
        </div>
      </div>

      {/* 예약된 상담 */}
      <div style={{
        backgroundColor: '#FFE8D1',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #FFCCBC',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          backgroundColor: '#FF9800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-xxl)',
          color: '#ffffff'
        }}>
          <i className="bi bi-calendar-check" style={{ fontSize: 'var(--font-size-xxl)' }}></i>
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
            예약된 상담
          </h3>
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: '700', color: '#FF9800', margin: '0 0 4px 0' }}>
            {statistics.bookedSchedules || 0}
          </div>
          <p style={{ margin: '0', fontSize: 'var(--font-size-xs)', color: '#6c757d' }}>
            예약 대기
          </p>
        </div>
      </div>

      {/* 완료된 상담 */}
      <div style={{
        backgroundColor: '#D4F1E0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #C8E6C9',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          backgroundColor: '#4CAF50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-xxl)',
          color: '#ffffff'
        }}>
          <i className="bi bi-check-circle-fill" style={{ fontSize: 'var(--font-size-xxl)' }}></i>
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
            완료된 상담
          </h3>
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: '700', color: '#4CAF50', margin: '0 0 4px 0' }}>
            {statistics.completedSchedules || 0}
          </div>
          <p style={{ margin: '0', fontSize: 'var(--font-size-xs)', color: '#6c757d' }}>
            상담 완료
          </p>
        </div>
      </div>

      {/* 취소된 상담 */}
      <div style={{
        backgroundColor: '#FFE0DB',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #FFCDD2',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          backgroundColor: '#F44336',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-xxl)',
          color: '#ffffff'
        }}>
          <i className="bi bi-x-circle-fill" style={{ fontSize: 'var(--font-size-xxl)' }}></i>
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
            취소된 상담
          </h3>
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: '700', color: '#F44336', margin: '0 0 4px 0' }}>
            {statistics.cancelledSchedules || 0}
          </div>
          <p style={{ margin: '0', fontSize: 'var(--font-size-xs)', color: '#6c757d' }}>
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

StatsCardGrid.defaultProps = {
  statistics: {},
  loading: false,
  error: false,
  showChange: true
};

export default StatsCardGrid;
