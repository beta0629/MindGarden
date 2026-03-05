import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  MessageSquare,
  Star,
  Clock,
  Bell,
  BarChart3,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import StandardizedApi from '../../../utils/standardizedApi';
import { DASHBOARD_API } from '../../../constants/api';
import './ConsultantDashboard.css';

const ConsultantDashboardV2 = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      todaySchedules: 0,
      newClients: 0,
      unreadMessages: 0,
      averageRating: 0
    },
    todaySchedules: [],
    recentNotifications: [],
    weeklyStats: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // 1. 통계 데이터 조회
      const statsResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_STATS, {
        userRole: 'CONSULTANT'
      });
      
      // 2. 오늘의 일정 조회
      const scheduleResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_SCHEDULES, {
        userId: user.id,
        userRole: 'CONSULTANT'
      });

      // 데이터 가공
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let schedules = [];
      if (scheduleResponse?.success && scheduleResponse?.data) {
        schedules = scheduleResponse.data.filter(schedule => {
          const scheduleDate = new Date(schedule.startTime);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate.getTime() === today.getTime();
        }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      }

      const stats = statsResponse?.success && statsResponse?.data ? statsResponse.data : {};

      // 주간 통계 모의 데이터 (실제 API가 있다면 교체)
      const mockWeeklyStats = [
        { day: '월', count: 3 },
        { day: '화', count: 5 },
        { day: '수', count: 2 },
        { day: '목', count: 6 },
        { day: '금', count: 4 },
        { day: '토', count: 8 },
        { day: '일', count: 1 }
      ];

      // 알림 모의 데이터
      const mockNotifications = [
        { id: 1, text: '새로운 상담 예약이 접수되었습니다.', time: '10분 전' },
        { id: 2, text: '김민수 내담자가 메시지를 보냈습니다.', time: '1시간 전' },
        { id: 3, text: '주간 상담 리포트가 생성되었습니다.', time: '어제' }
      ];

      setDashboardData({
        stats: {
          todaySchedules: schedules.length || stats.todaySchedules || 0,
          newClients: stats.newClients || 0,
          unreadMessages: stats.unreadMessages || 0,
          averageRating: stats.averageRating || 4.8
        },
        todaySchedules: schedules,
        recentNotifications: mockNotifications,
        weeklyStats: mockWeeklyStats
      });
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return { time: '', meridiem: '' };
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return { time: `${hours}:${minutes}`, meridiem };
  };

  const maxChartValue = Math.max(...(dashboardData.weeklyStats.map(s => s.count) || [1]));

  const renderSchedules = () => {
    if (loading) {
      return (
        <div className="empty-state">
          <div className="mg-v2-spinner"></div>
          <span className="empty-state-text">일정을 불러오는 중...</span>
        </div>
      );
    }
    
    if (dashboardData.todaySchedules.length > 0) {
      return (
        <div className="schedule-list">
          {dashboardData.todaySchedules.slice(0, 5).map((schedule, idx) => {
            const { time, meridiem } = formatTime(schedule.startTime);
            return (
              <div key={schedule.id || `schedule-${idx}`} className="schedule-item">
                <div className="schedule-time">
                  <span>{time}</span>
                  <span className="schedule-time-meridiem">{meridiem}</span>
                </div>
                <div className="schedule-details">
                  <div className="schedule-client">{schedule.clientName || '내담자'}</div>
                  <div className="schedule-type">
                    <Users size={12} />
                    {schedule.consultationType || '개인상담'}
                  </div>
                </div>
                <div className={`schedule-status ${schedule.status === 'CONFIRMED' ? 'status-confirmed' : 'status-pending'}`}>
                  {schedule.status === 'CONFIRMED' ? '확정' : '대기'}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    return (
      <div className="empty-state">
        <Calendar size={32} className="empty-state-icon" />
        <span className="empty-state-text">오늘 예정된 일정이 없습니다.</span>
      </div>
    );
  };

  return (
    <AdminCommonLayout title="상담사 대시보드">
      <div className="consultant-dashboard-v2">
        
        {/* Hero Area: 주요 통계 */}
        <section className="consultant-hero-grid">
          <div className="consultant-stat-card">
            <div className="stat-icon-wrapper primary">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">오늘의 상담</span>
              <span className="stat-value">{dashboardData.stats.todaySchedules}건</span>
            </div>
          </div>
          
          <div className="consultant-stat-card">
            <div className="stat-icon-wrapper success">
              <UserPlus size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">신규 내담자</span>
              <span className="stat-value">{dashboardData.stats.newClients}명</span>
            </div>
          </div>
          
          <div className="consultant-stat-card">
            <div className="stat-icon-wrapper warning">
              <MessageSquare size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">안읽은 메시지</span>
              <span className="stat-value">{dashboardData.stats.unreadMessages}건</span>
            </div>
          </div>
          
          <div className="consultant-stat-card">
            <div className="stat-icon-wrapper info">
              <Star size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">평균 평점</span>
              <span className="stat-value">{dashboardData.stats.averageRating.toFixed(1)}</span>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="consultant-main-grid">
          
          {/* Section A: 오늘의 일정 */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <Clock size={18} className="card-title-icon" />
                오늘의 일정
              </h2>
              <button 
                className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
                onClick={() => navigate('/consultant/schedule')}
              >
                전체보기 <ChevronRight size={16} />
              </button>
            </div>
            <div className="card-body">
              {renderSchedules()}
            </div>
          </div>

          {/* Section B: 최근 알림 */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <Bell size={18} className="card-title-icon" />
                최근 알림
              </h2>
              <button 
                className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
                onClick={() => navigate('/notifications')}
              >
                전체보기 <ChevronRight size={16} />
              </button>
            </div>
            <div className="card-body">
              {dashboardData.recentNotifications.length > 0 ? (
                <div className="notification-list">
                  {dashboardData.recentNotifications.map((noti) => (
                    <div key={noti.id} className="notification-item">
                      <div className="notification-icon">
                        <div className="mg-v2-badge-dot mg-v2-badge-primary"></div>
                      </div>
                      <div className="notification-content">
                        <div className="notification-text">{noti.text}</div>
                        <div className="notification-time">{noti.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Bell size={32} className="empty-state-icon" />
                  <span className="empty-state-text">새로운 알림이 없습니다.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section C: 주간 상담 현황 */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <BarChart3 size={18} className="card-title-icon" />
                주간 상담 현황
              </h2>
            </div>
            <div className="card-body">
              <div className="chart-container">
                {dashboardData.weeklyStats.map((stat, idx) => {
                  const heightPercent = maxChartValue > 0 ? (stat.count / maxChartValue) * 100 : 0;
                  const isToday = new Date().getDay() === (idx === 6 ? 0 : idx + 1); // 0=일, 1=월...
                  
                  return (
                    <div key={`stat-${stat.day}`} className="chart-bar-wrapper">
                      <div 
                        className={`chart-bar ${isToday ? 'active' : ''}`} 
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        title={`${stat.count}건`}
                      ></div>
                      <span className="chart-label">{stat.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </section>
      </div>
    </AdminCommonLayout>
  );
};

ConsultantDashboardV2.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
};

export default ConsultantDashboardV2;
