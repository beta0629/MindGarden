import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { API_BASE_URL } from '../../constants/api';
import SimpleLayout from '../../components/layout/SimpleLayout';

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
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">로딩중...</span>
        </div>
        <p style={{ marginTop: '10px' }}>활동 내역을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <SimpleLayout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#2c3e50' }}>
              <i className="bi bi-clock-history" style={{ marginRight: '10px', color: '#007bff' }}></i>
              활동 내역
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>
              최근 활동과 시스템 알림을 확인하세요
            </p>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/client/dashboard')}
            style={{ padding: '8px 16px' }}
          >
            <i className="bi bi-arrow-left" style={{ marginRight: '5px' }}></i>
            대시보드로
          </button>
        </div>

      {/* 필터 */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <div className="btn-group" role="group">
          {['all', 'consultation', 'payment', 'system'].map(type => (
            <button
              key={type}
              className={`btn ${filter === type ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter(type)}
              style={{ fontSize: 'var(--font-size-sm)', padding: '6px 12px' }}
            >
              {getActivityTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* 활동 목록 */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        {filteredActivities.length > 0 ? (
          <div>
            {filteredActivities.map((activity, index) => (
              <div 
                key={activity.id}
                style={{
                  padding: '20px',
                  borderBottom: index < filteredActivities.length - 1 ? '1px solid #e9ecef' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {/* 아이콘 */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: activity.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className={`bi ${activity.icon}`} style={{ color: 'white', fontSize: 'var(--font-size-lg)' }}></i>
                </div>

                {/* 내용 */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '5px'
                  }}>
                    <h5 style={{ margin: 0, color: '#2c3e50', fontSize: 'var(--font-size-base)' }}>
                      {activity.title}
                    </h5>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      backgroundColor: getStatusColor(activity.status) + '20',
                      color: getStatusColor(activity.status)
                    }}>
                      {getStatusLabel(activity.status)}
                    </span>
                  </div>
                  
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#6c757d', 
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: '1.4'
                  }}>
                    {activity.description}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    fontSize: 'var(--font-size-xs)', 
                    color: '#adb5bd' 
                  }}>
                    <span>
                      <i className="bi bi-calendar3" style={{ marginRight: '4px' }}></i>
                      {activity.date}
                    </span>
                    <span>
                      <i className="bi bi-clock" style={{ marginRight: '4px' }}></i>
                      {activity.time}
                    </span>
                    <span>
                      <i className="bi bi-hourglass-split" style={{ marginRight: '4px' }}></i>
                      {getTimeAgo(activity.date, activity.time)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '60px 20px', 
            textAlign: 'center',
            color: '#6c757d'
          }}>
            <i className="bi bi-inbox" style={{ fontSize: 'var(--font-size-xxxl)', marginBottom: '15px' }}></i>
            <h5>활동 내역이 없습니다</h5>
            <p>선택한 조건에 해당하는 활동이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div style={{ 
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#1976d2' }}>
            {activities.filter(a => a.type === 'consultation').length}
          </h4>
          <p style={{ margin: 0, color: '#666' }}>상담 관련</p>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: '#f3e5f5',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#7b1fa2' }}>
            {activities.filter(a => a.type === 'payment').length}
          </h4>
          <p style={{ margin: 0, color: '#666' }}>결제 관련</p>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#388e3c' }}>
            {activities.filter(a => a.status === 'completed').length}
          </h4>
          <p style={{ margin: 0, color: '#666' }}>완료된 활동</p>
        </div>
      </div>
      </div>
    </SimpleLayout>
  );
};

export default ActivityHistory;
