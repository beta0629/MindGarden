import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Users, Clock } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import StatCard from '../../../ui/Card/StatCard';
import '../Widget.css';

/**
 * 오늘의 통계 위젯 - 표준화된 위젯
/**
 * 오늘의 예약, 완료, 진행중, 취소된 상담 통계를 표시
 */
const TodayStatsWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  
  // 표준화된 위젯 훅 사용
  const {
    data: todayStats,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 기본 데이터 구조
  const defaultStats = {
    totalToday: 0,
    completedToday: 0,
    inProgressToday: 0,
    cancelledToday: 0
  };
  
  // 실제 데이터 또는 기본값 사용
  const stats = todayStats || defaultStats;

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

  // 총 사용자 수 계산
  const totalUsers = stats.totalToday;

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
    >
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
          value={stats.totalToday}
          label="예약된 상담"
          change="+8.2%"
          changeType="positive"
          loading={loading}
          onClick={() => handleStatClick('schedules')}
        />
        <StatCard
          icon={<CheckCircle />}
          value={stats.completedToday}
          label="완료된 상담"
          change="+15.3%"
          changeType="positive"
          loading={loading}
          onClick={() => handleStatClick('sessions')}
        />
      </div>
      
      {/* 추가 통계 (진행중, 취소) */}
      {(stats.inProgressToday > 0 || stats.cancelledToday > 0) && (
        <div className="mg-stats-grid mg-mt-md">
          <StatCard
            icon={<Clock />}
            value={stats.inProgressToday}
            label="진행중 상담"
            loading={loading}
            onClick={() => handleStatClick('schedules')}
          />
          <StatCard
            icon={<Calendar />}
            value={stats.cancelledToday}
            label="취소된 상담"
            loading={loading}
            onClick={() => handleStatClick('schedules')}
          />
        </div>
      )}
    </BaseWidget>
  );
};

export default TodayStatsWidget;
