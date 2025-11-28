import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Users, Clock } from 'lucide-react';
import { apiGet } from '../../../../utils/ajax';
import { API_BASE_URL } from '../../../../constants/api';
import StatCard from '../../../ui/Card/StatCard';
import '../Widget.css';

/**
 * 오늘의 통계 위젯
 * 오늘의 예약, 완료, 진행중, 취소된 상담 통계를 표시
 */
const TodayStatsWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const config = widget.config || {};
  
  const [todayStats, setTodayStats] = useState({
    totalToday: 0,
    completedToday: 0,
    inProgressToday: 0,
    cancelledToday: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 오늘의 통계 데이터 로드
  const loadTodayStats = useCallback(async () => {
    if (!user?.role) {
      console.log('⚠️ TodayStatsWidget: 사용자 역할 정보 없음');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 TodayStatsWidget: 오늘의 통계 로드 시작');
      
      const response = await fetch(`${API_BASE_URL}/api/schedules/today/statistics?userRole=${user.role}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTodayStats({
          totalToday: data.totalToday || 0,
          completedToday: data.completedToday || 0,
          inProgressToday: data.inProgressToday || 0,
          cancelledToday: data.cancelledToday || 0
        });
        console.log('✅ TodayStatsWidget: 오늘의 통계 로드 완료', data);
      } else {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ TodayStatsWidget: 오늘의 통계 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadTodayStats();
    
    // 자동 새로고침 설정 (기본 5분)
    const refreshInterval = config.refreshInterval || 300000; // 5분
    const interval = setInterval(loadTodayStats, refreshInterval);
    return () => clearInterval(interval);
  }, [loadTodayStats, config.refreshInterval]);

  // 통계 카드 클릭 핸들러
  const handleStatClick = (statType) => {
    switch (statType) {
      case 'schedules':
        navigate('/admin/schedules');
        break;
      case 'sessions':
        navigate('/admin/sessions');
        break;
      default:
        navigate('/admin/schedules');
        break;
    }
  };

  // 총 사용자 수 계산 (임시)
  const totalUsers = todayStats.totalToday; // 실제로는 다른 API에서 가져와야 함

  return (
    <div className="widget widget-today-stats">
      <div className="widget-header">
        <div className="mg-card-header mg-flex mg-align-center mg-gap-sm">
          <Calendar size={20} className="finance-icon-inline" />
          <h3 className="mg-h4 mg-mb-0">{config.title || '오늘의 현황'}</h3>
        </div>
        {config.subtitle && (
          <p className="mg-text-sm mg-color-text-secondary mg-mb-0">
            {config.subtitle}
          </p>
        )}
      </div>
      
      <div className="widget-body">
        <div className="mg-card-body">
          {error && (
            <div className="mg-alert mg-alert-danger mg-mb-md">
              <strong>오류:</strong> {error}
            </div>
          )}
          
          <div className="mg-stats-grid">
            <StatCard
              icon={<Users />}
              value={totalUsers}
              label="총 사용자"
              change="+12.5%"
              changeType="positive"
              loading={loading}
              onClick={() => handleStatClick('users')}
            />
            <StatCard
              icon={<Calendar />}
              value={todayStats.totalToday}
              label="예약된 상담"
              change="+8.2%"
              changeType="positive"
              loading={loading}
              onClick={() => handleStatClick('schedules')}
            />
            <StatCard
              icon={<CheckCircle />}
              value={todayStats.completedToday}
              label="완료된 상담"
              change="+15.3%"
              changeType="positive"
              loading={loading}
              onClick={() => handleStatClick('sessions')}
            />
          </div>
          
          {/* 추가 통계 (진행중, 취소) */}
          {(todayStats.inProgressToday > 0 || todayStats.cancelledToday > 0) && (
            <div className="mg-stats-grid mg-mt-md">
              <StatCard
                icon={<Clock />}
                value={todayStats.inProgressToday}
                label="진행중 상담"
                loading={loading}
                onClick={() => handleStatClick('schedules')}
              />
              <StatCard
                icon={<Calendar />}
                value={todayStats.cancelledToday}
                label="취소된 상담"
                loading={loading}
                onClick={() => handleStatClick('schedules')}
              />
            </div>
          )}
          
          {loading && (
            <div className="mg-text-center mg-mt-md">
              <div className="mg-spinner mg-spinner-sm"></div>
              <span className="mg-ml-sm">데이터 로드 중...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayStatsWidget;
