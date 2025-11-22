/**
 * Activity List Widget
 * 최근 활동 목록을 표시하는 범용 위젯
 * RecentActivities를 기반으로 범용화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedLoading from '../../common/UnifiedLoading';
import { apiGet } from '../../../utils/ajax';
import './Widget.css';
import '../RecentActivities.css';

const ActivityListWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const maxItems = config.maxItems || 5;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadActivities();
      
      // 자동 새로고침 설정
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadActivities, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.activities && Array.isArray(config.activities)) {
      // 정적 활동 목록 사용
      setActivities(config.activities.slice(0, maxItems));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(dataSource.url, dataSource.params || {});
      
      if (response) {
        // 응답 구조에 따라 조정 필요
        const activityList = response.activities || response.data || response || [];
        setActivities(Array.isArray(activityList) ? activityList.slice(0, maxItems) : []);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('ActivityListWidget 데이터 로드 실패:', err);
      setError(err.message);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };
  
  const getActivityIcon = (type) => {
    // config에서 아이콘 매핑 가져오기
    const iconMap = config.iconMap || {
      'profile': 'bi-person-circle',
      'schedule': 'bi-calendar-check',
      'payment': 'bi-credit-card',
      'message': 'bi-chat-dots',
      'document': 'bi-file-text',
      'default': 'bi-info-circle'
    };
    
    return iconMap[type] || iconMap.default || 'bi-info-circle';
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else if (config.viewAllAction) {
      // 커스텀 액션 실행
      if (typeof config.viewAllAction === 'function') {
        config.viewAllAction();
      }
    }
  };
  
  const formatTime = (time) => {
    if (!time) return '';
    
    // 이미 포맷된 문자열이면 그대로 반환
    if (typeof time === 'string' && time.includes('전') || time.includes('ago')) {
      return time;
    }
    
    // Date 객체나 타임스탬프인 경우 포맷팅
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };
  
  if (loading && activities.length === 0) {
    return (
      <div className="widget widget-activity-list">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  if (error && activities.length === 0) {
    return (
      <div className="widget widget-activity-list widget-error">
        <div className="widget-title">{config.title || '최근 활동'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  const displayActivities = activities.slice(0, maxItems);
  const hasMore = activities.length > maxItems || (config.viewAllUrl || config.viewAllAction);
  
  return (
    <div className="widget widget-activity-list">
      <div className="widget-header">
        <div className="recent-activities-header">
          <h3 className="widget-title">
            <i className="bi bi-clock-history"></i>
            {config.title || '최근 활동'}
          </h3>
          {hasMore && (
            <button 
              className="mg-btn mg-btn--outline mg-btn--primary mg-btn--sm"
              onClick={handleViewAll}
            >
              <i className="bi bi-arrow-right"></i>
              {config.viewAllLabel || '전체보기'}
            </button>
          )}
        </div>
      </div>
      <div className="widget-body">
        <div className="recent-activities-list">
          {displayActivities.length > 0 ? (
            displayActivities.map((activity, index) => (
              <div key={activity.id || index} className="recent-activities-item">
                <div className="recent-activities-icon">
                  <i className={`bi ${getActivityIcon(activity.type || activity.category)}`}></i>
                </div>
                <div className="recent-activities-content">
                  <div className="recent-activities-title">
                    {activity.title || activity.message || activity.description}
                  </div>
                  <div className="recent-activities-time">
                    {formatTime(activity.time || activity.timestamp || activity.createdAt)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activities">
              <i className="bi bi-inbox"></i>
              <p>{config.emptyMessage || '최근 활동이 없습니다'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityListWidget;



