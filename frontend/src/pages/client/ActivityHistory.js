import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { API_BASE_URL } from '../../constants/api';
import SimpleLayout from '../../components/layout/SimpleLayout';
import './ActivityHistory.css';

const ActivityHistory = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, consultation, payment, system
  const [dateRange, setDateRange] = useState('all'); // all, week, month, year
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    loadActivities();
    loadStatistics();
  }, [filter, dateRange]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // API 호출
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('type', filter);
      if (dateRange !== 'all') params.append('dateRange', dateRange);
      
      const response = await fetch(`${API_BASE_URL}/api/activities/history?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setActivities(result.data || []);
        } else {
          console.error('활동 내역 로드 실패:', result.message);
          setActivities([]);
        }
      } else {
        console.error('활동 내역 API 호출 실패:', response.status);
        setActivities([]);
      }
    } catch (error) {
      console.error('활동 내역 로드 실패:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/statistics`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStatistics(result.data || {});
        }
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const getActivityTypeLabel = (type) => {
    const labels = {
      consultation: '상담',
      payment: '결제',
      system: '시스템',
      all: '전체'
    };
    return labels[type] || '기타';
  };

  const getStatusLabel = (status) => {
    const labels = {
      completed: '완료',
      pending: '진행중',
      info: '알림',
      error: '오류'
    };
    return labels[status] || '알 수 없음';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#28a745',
      pending: '#ffc107',
      info: '#17a2b8',
      error: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const filteredActivities = activities.filter(activity => {
    if (filter !== 'all' && activity.type !== filter) return false;
    // 날짜 필터링 로직 추가 가능
    return true;
  });

  const getTimeAgo = (date, time) => {
    const now = new Date();
    const activityDate = new Date(`${date} ${time}`);
    const diffMs = now - activityDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}개월 전`;
  };

  if (loading) {
    return (
      <SimpleLayout>
        <div className="activity-history-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩중...</span>
          </div>
          <p className="activity-history-loading-text">활동 내역을 불러오는 중...</p>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="activity-history-container">
        {/* 헤더 */}
        <div className="activity-history-header">
          <div className="activity-history-header-content">
            <h2>
              <i className="bi bi-clock-history"></i>
              활동 내역
            </h2>
            <p>
              최근 활동과 시스템 알림을 확인하세요
            </p>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/client/dashboard')}
          >
            <i className="bi bi-arrow-left"></i>
            대시보드로
          </button>
        </div>

      {/* 필터 */}
      <div className="activity-history-filters">
        <div className="btn-group" role="group">
          {['all', 'consultation', 'payment', 'system'].map(type => (
            <button
              key={type}
              className={`btn ${filter === type ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter(type)}
            >
              {getActivityTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* 활동 목록 */}
      <div className="activity-history-list">
        {filteredActivities.length > 0 ? (
          <div>
            {filteredActivities.map((activity, index) => (
              <div 
                key={activity.id}
                className={`activity-history-item ${index < filteredActivities.length - 1 ? '' : 'last'}`}
              >
                {/* 아이콘 */}
                <div 
                  className="activity-history-icon"
                >
                  <i className={`bi ${activity.icon}`}></i>
                </div>

                {/* 내용 */}
                <div className="activity-history-content">
                  <div className="activity-history-header-content">
                    <h5 className="activity-history-title">
                      {activity.title}
                    </h5>
                    <span 
                      className="activity-history-badge"
                    >
                      {getStatusLabel(activity.status)}
                    </span>
                  </div>
                  
                  <p className="activity-history-description">
                    {activity.description}
                  </p>
                  
                  <div className="activity-history-footer">
                    <span>
                      <i className="bi bi-calendar3"></i>
                      {activity.date}
                    </span>
                    <span>
                      <i className="bi bi-clock"></i>
                      {activity.time}
                    </span>
                    <span>
                      <i className="bi bi-hourglass-split"></i>
                      {getTimeAgo(activity.date, activity.time)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="activity-history-empty">
            <i className="bi bi-inbox activity-history-empty-icon"></i>
            <h5 className="activity-history-empty-title">활동 내역이 없습니다</h5>
            <p className="activity-history-empty-description">선택한 조건에 해당하는 활동이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="activity-history-stats">
        <div className="activity-history-stat activity-history-stat-blue">
          <h4 className="activity-history-stat-title">
            {activities.filter(a => a.type === 'consultation').length}
          </h4>
          <p className="activity-history-stat-description">상담 관련</p>
        </div>
        <div className="activity-history-stat activity-history-stat-purple">
          <h4 className="activity-history-stat-title purple">
            {activities.filter(a => a.type === 'payment').length}
          </h4>
          <p className="activity-history-stat-description">결제 관련</p>
        </div>
        <div className="activity-history-stat activity-history-stat-green">
          <h4 className="activity-history-stat-title green">
            {activities.filter(a => a.status === 'completed').length}
          </h4>
          <p className="activity-history-stat-description">완료된 활동</p>
        </div>
      </div>
      </div>
    </SimpleLayout>
  );
};

export default ActivityHistory;
