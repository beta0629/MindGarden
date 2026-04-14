import React from 'react';
import PropTypes from 'prop-types';

import { RoleUtils } from '../../../constants/roles';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import './ConsultantRatingWidget.css';
const ConsultantRatingWidget = ({ widget, user }) => {
  // 데이터 소스 설정 (상담사 전용)
  const getDataSourceConfig = () => {
    // RATING_API import 필요
    const RATING_API = {
      CONSULTANT_STATS: (consultantId) => `/api/v1/ratings/consultant/${consultantId}/stats`
    };
    
    return {
      type: 'api',
      cache: true,
      refreshInterval: 300000, // 5분마다 새로고침 (평가 변경)
      url: RATING_API.CONSULTANT_STATS(user.id),
      params: {
        includeRecentRatings: true,
        recentLimit: 5
      }
    };
  };

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (평가 통계 데이터)
  const {
    data: ratingStats,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isConsultant(user),
    cache: true,
    retryCount: 3
  });

  // 상담사 전용 위젯 (다른 역할은 표시하지 않음)
  if (!RoleUtils.isConsultant(user)) {
    return null;
  }

  // 하트 점수 렌더링
  const renderHeartScore = (score) => {
    if (!score || score < 1 || score > 5) return '🤍🤍🤍🤍🤍';
    return '💖'.repeat(score) + '🤍'.repeat(5 - score);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  // 위젯 헤더 설정
  const headerConfig = {
    title: (
      <div className="consultant-rating-header-title">
        💖 내담자 평가
        {hasData && ratingStats?.totalRatingCount > 0 && (
          <span className="consultant-rating-badge">
            {ratingStats.totalRatingCount}개
          </span>
        )}
      </div>
    )
  };

  // 위젯 콘텐츠
  const renderContent = () => {
    // 빈 상태 (평가 없음)
    if (isEmpty || !ratingStats || ratingStats.totalRatingCount === 0) {
      return (
        <div className="consultant-rating-empty">
          <div className="consultant-rating-empty-icon">💖</div>
          <div className="consultant-rating-empty-text">
            아직 받은 평가가 없습니다.
          </div>
          <div className="consultant-rating-empty-hint">
            상담을 완료하면 내담자님들이 평가를 남겨주실 거예요!
          </div>
        </div>
      );
    }

    return (
      <div className="consultant-rating-content">
        {/* 평가 통계 그리드 */}
        <div className="consultant-rating-stats">
          {/* 평균 점수 */}
          <div className="consultant-rating-stat-card primary">
            <div className="consultant-rating-stat-icon" />
            <div className="consultant-rating-stat-content">
              <div className="consultant-rating-stat-value">
                {ratingStats.averageHeartScore || '0.0'}
              </div>
              <div className="consultant-rating-stat-label">평균 하트 점수</div>
            </div>
          </div>

          {/* 총 평가 수 */}
          <div className="consultant-rating-stat-card secondary">
            <div className="consultant-rating-stat-icon" />
            <div className="consultant-rating-stat-content">
              <div className="consultant-rating-stat-value">
                {ratingStats.totalRatingCount || 0}
              </div>
              <div className="consultant-rating-stat-label">총 평가 수</div>
            </div>
          </div>
        </div>

        {/* 점수별 분포 */}
        <div className="consultant-rating-distribution">
          <h4 className="consultant-rating-section-title">
            
            하트 점수 분포
          </h4>
          <div className="consultant-rating-distribution-grid">
            {[5, 4, 3, 2, 1].map(score => {
              const count = ratingStats.heartScoreDistribution?.[score] || 0;
              const percentage = ratingStats.totalRatingCount > 0 
                ? Math.round((count / ratingStats.totalRatingCount) * 100) 
                : 0;

              return (
                <div key={score} className="consultant-rating-distribution-item">
                  <div className="consultant-rating-hearts">
                    {renderHeartScore(score)}
                  </div>
                  <div className="consultant-rating-count">
                    {count}개
                  </div>
                  <div className="consultant-rating-percentage">
                    ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 최근 평가 */}
        {ratingStats.recentRatings && ratingStats.recentRatings.length > 0 && (
          <div className="consultant-rating-recent">
            <h4 className="consultant-rating-section-title">
              💭 최근 평가
            </h4>
            <div className="consultant-rating-recent-list">
              {ratingStats.recentRatings.slice(0, 5).map(rating => (
                <div
                  key={rating.id}
                  className="consultant-rating-recent-item"
                >
                  <div className="consultant-rating-recent-header">
                    <div className="consultant-rating-recent-hearts">
                      {renderHeartScore(rating.heartScore)}
                    </div>
                    <div className="consultant-rating-recent-meta">
                      {rating.clientName} • {formatDate(rating.ratedAt)}
                    </div>
                  </div>
                  
                  {rating.comment && (
                    <div className="consultant-rating-recent-comment">
                      "{rating.comment}"
                    </div>
                  )}
                  
                  {rating.tags && rating.tags.length > 0 && (
                    <div className="consultant-rating-recent-tags">
                      {rating.tags.map(tag => (
                        <span
                          key={tag}
                          className="consultant-rating-tag"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      hasData={hasData}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="consultant-rating-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

ConsultantRatingWidget.propTypes = {
  widget: PropTypes.shape({
    config: PropTypes.object
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired
};

export default ConsultantRatingWidget;
