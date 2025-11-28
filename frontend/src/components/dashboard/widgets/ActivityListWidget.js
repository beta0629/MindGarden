/**
 * Activity List Widget - 표준화된 위젯
 * 활동 목록을 표시하는 위젯
 * 
 * @author CoreSolution
 * @version 2.0.0 (표준화 업그레이드)
 * @since 2025-11-21
 */

import React from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './Widget.css';

const ActivityListWidget = ({ widget, user }) => {
  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 활동 목록 렌더링
  const renderActivityList = () => {
    if (isEmpty) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 활동이 없습니다.
        </div>
      );
    }
    
    if (!hasData || !Array.isArray(data)) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    return (
      <div className="activity-list-container">
        <div className="activity-list">
          {data.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">
                <i className={`bi bi-${activity.icon || 'circle'}`}></i>
              </div>
              <div className="activity-content">
                <div className="activity-title">
                  {activity.title || activity.name || `활동 ${index + 1}`}
                </div>
                {activity.description && (
                  <div className="activity-description">
                    {activity.description}
                  </div>
                )}
                <div className="activity-meta">
                  {activity.timestamp && (
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleString('ko-KR')}
                    </span>
                  )}
                  {activity.user && (
                    <span className="activity-user">
                      {activity.user}
                    </span>
                  )}
                  {activity.type && (
                    <span className={`activity-type activity-type-${activity.type}`}>
                      {activity.type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="activity-footer">
          <span className="activity-count">총 {data.length}개 활동</span>
          {widget.config?.showMoreButton && (
            <button className="show-more-btn">
              더 보기
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.ACTIVITY_LIST}
      subtitle={widget.config?.subtitle || ''}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderActivityList()}
      </div>
    </BaseWidget>
  );
};

export default ActivityListWidget;