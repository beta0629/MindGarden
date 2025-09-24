import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { API_BASE_URL } from '../../constants/api';

const ActivityHistory = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, consultation, payment, system
  const [dateRange, setDateRange] = useState('all'); // all, week, month, year

  useEffect(() => {
    loadActivities();
  }, [filter, dateRange]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // 실제 API 호출 (현재는 목업 데이터)
      const mockActivities = generateMockActivities();
      setActivities(mockActivities);
    } catch (error) {
      console.error('활동 내역 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockActivities = () => {
    const baseActivities = [
      {
        id: 1,
        type: 'consultation',
        title: '김선희 상담사와의 상담 일정 등록',
        description: '2025년 1월 15일 오후 2시 상담 예약이 완료되었습니다.',
        date: '2025-01-10',
        time: '14:30',
        status: 'completed',
        icon: 'bi-calendar-check',
        color: '#28a745'
      },
      {
        id: 2,
        type: 'consultation',
        title: '상담 일정 확정',
        description: '김선희 상담사와의 상담이 확정되었습니다.',
        date: '2025-01-10',
        time: '09:15',
        status: 'completed',
        icon: 'bi-check-circle',
        color: '#007bff'
      },
      {
        id: 3,
        type: 'payment',
        title: '상담 패키지 결제 완료',
        description: '5회 상담 패키지 (150,000원) 결제가 완료되었습니다.',
        date: '2025-01-09',
        time: '16:45',
        status: 'completed',
        icon: 'bi-credit-card',
        color: '#6f42c1'
      },
      {
        id: 4,
        type: 'system',
        title: '상담 리마인더 알림',
        description: '내일 오후 2시 상담 일정이 있습니다.',
        date: '2025-01-09',
        time: '18:00',
        status: 'info',
        icon: 'bi-bell',
        color: '#ffc107'
      },
      {
        id: 5,
        type: 'consultation',
        title: '상담사 피드백 수신',
        description: '김선희 상담사님으로부터 상담 후 피드백을 받았습니다.',
        date: '2025-01-08',
        time: '20:30',
        status: 'completed',
        icon: 'bi-chat-dots',
        color: '#17a2b8'
      },
      {
        id: 6,
        type: 'system',
        title: '프로필 정보 업데이트',
        description: '연락처 정보가 성공적으로 변경되었습니다.',
        date: '2025-01-07',
        time: '11:20',
        status: 'completed',
        icon: 'bi-person-gear',
        color: '#6c757d'
      },
      {
        id: 7,
        type: 'payment',
        title: '환불 요청 접수',
        description: '미사용 상담 회기에 대한 환불 요청이 접수되었습니다.',
        date: '2025-01-06',
        time: '14:15',
        status: 'pending',
        icon: 'bi-arrow-clockwise',
        color: '#fd7e14'
      },
      {
        id: 8,
        type: 'consultation',
        title: '상담 일정 변경',
        description: '기존 상담 일정이 1월 20일 오후 3시로 변경되었습니다.',
        date: '2025-01-05',
        time: '10:30',
        status: 'completed',
        icon: 'bi-calendar-event',
        color: '#20c997'
      }
    ];

    return baseActivities;
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
              style={{ fontSize: '14px', padding: '6px 12px' }}
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
                  <i className={`bi ${activity.icon}`} style={{ color: 'white', fontSize: '18px' }}></i>
                </div>

                {/* 내용 */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '5px'
                  }}>
                    <h5 style={{ margin: 0, color: '#2c3e50', fontSize: '16px' }}>
                      {activity.title}
                    </h5>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
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
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {activity.description}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    fontSize: '12px', 
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
            <i className="bi bi-inbox" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
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
  );
};

export default ActivityHistory;
