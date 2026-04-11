/**
 * Recent Activities Widget - 표준화된 최근 활동 위젯
/**
 * RecentActivities 컴포넌트를 위젯으로 변환 + 실제 API 연동
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { RoleUtils } from '../../../constants/roles';
import { getStatusLabel } from '../../../utils/colorUtils';
import { RECENT_ACTIVITIES_CSS } from '../../../constants/css';
import './RecentActivitiesWidget.css';
import '../RecentActivities.css';
import MGButton from '../../common/MGButton';

const RecentActivitiesWidget = ({ widget, user }) => {
  // 역할별 API 엔드포인트 결정
  const getDataSourceConfig = () => {
    if (!user?.role) return { type: 'static' };
    
    const baseConfig = {
      type: 'api',
      cache: true,
      refreshInterval: 60000, // 1분마다 새로고침
      params: {
        userId: user.id,
        userRole: user.role,
        limit: 10 // 최대 10개 가져와서 5개만 표시
      }
    };
    
    switch (user.role) {
      case 'CLIENT':
        return {
          ...baseConfig,
          url: '/api/v1/schedules',
          transform: (data) => transformClientActivities(data)
        };
      case 'CONSULTANT':
        return {
          ...baseConfig,
          url: '/api/v1/schedules',
          transform: (data) => transformConsultantActivities(data)
        };
      case 'ADMIN':
      case 'BRANCH_SUPER_ADMIN':
      case 'HQ_MASTER':
        return {
          ...baseConfig,
          url: '/api/v1/schedules/admin/statistics',
          transform: (data) => transformAdminActivities(data)
        };
      default:
        return { type: 'static' };
    }
  };

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (실제 API 연동)
  const {
    data: rawData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: !!(user && user.id),
    cache: true,
    retryCount: 3
  });

  const navigate = useNavigate();

  // 내담자 활동 변환
  const transformClientActivities = (data) => {
    if (!data?.schedules) return [];
    
    const activities = [];
    const schedules = data.schedules || [];
    
    // 최근 스케줄을 활동으로 변환
    const recentSchedules = schedules
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    recentSchedules.forEach(schedule => {
      if (!schedule.createdAt || !schedule.consultantName) return;

      const createdDate = new Date(schedule.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - createdDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let timeAgo;
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        timeAgo = diffHours === 0 ? '방금 전' : `${diffHours}시간 전`;
      } else if (diffDays < 7) {
        timeAgo = `${diffDays}일 전`;
      } else {
        timeAgo = `${Math.floor(diffDays / 7)}주 전`;
      }
      
      activities.push({
        type: 'schedule',
        title: `${schedule.consultantName} 상담사와의 상담 일정 ${getStatusLabel(schedule.status)}`,
        time: timeAgo,
        details: `${schedule.date} ${schedule.startTime} - ${schedule.endTime}`
      });
    });

    return activities.length > 0 ? activities : [{
      type: 'info',
      title: '최근 활동이 없습니다',
      time: '현재',
      details: '아직 등록된 활동이 없습니다'
    }];
  };

  // 상담사 활동 변환
  const transformConsultantActivities = (data) => {
    if (!data?.schedules) return [];
    
    const activities = [];
    const schedules = data.schedules || [];
    
    // 최근 스케줄을 활동으로 변환
    const recentSchedules = schedules
      .filter(schedule => {
        return schedule.createdAt && (schedule.clientName || schedule.clientNickname || schedule.clientId);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    recentSchedules.forEach(schedule => {
      const createdDate = new Date(schedule.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - createdDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let timeAgo;
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        timeAgo = diffHours === 0 ? '방금 전' : `${diffHours}시간 전`;
      } else if (diffDays < 7) {
        timeAgo = `${diffDays}일 전`;
      } else {
        timeAgo = `${Math.floor(diffDays / 7)}주 전`;
      }

      let displayName = '내담자';
      if (schedule.clientName && !schedule.clientName.includes('==')) {
        displayName = schedule.clientName;
      } else if (schedule.clientNickname && !schedule.clientNickname.includes('==')) {
        displayName = schedule.clientNickname;
      } else if (schedule.title) {
        displayName = schedule.title;
      }

      if (displayName !== '내담자' || schedule.clientId) {
        activities.push({
          type: 'schedule',
          title: `${displayName}과의 상담 일정 ${getStatusLabel(schedule.status)}`,
          time: timeAgo,
          details: `${schedule.date} ${schedule.startTime} - ${schedule.endTime}`
        });
      }
    });

    return activities.length > 0 ? activities : [{
      type: 'info',
      title: '최근 활동이 없습니다',
      time: '현재',
      details: '아직 등록된 활동이 없습니다'
    }];
  };

  // 관리자 활동 변환
  const transformAdminActivities = (data) => {
    const activities = [];
    
    if (data?.totalUsers > 0) {
      activities.push({
        type: 'profile',
        title: `총 ${data.totalUsers}명의 사용자 관리`,
        time: '오늘',
        details: '전체 사용자 현황을 확인했습니다'
      });
    }
    
    if (data?.todayConsultations > 0) {
      activities.push({
        type: 'schedule',
        title: `오늘 ${data.todayConsultations}건의 상담 일정 관리`,
        time: '오늘',
        details: '오늘의 상담 일정을 확인했습니다'
      });
    }
    
    // 기본 활동 추가
    activities.push({
      type: 'consultation',
      title: '시스템 현황 점검',
      time: '1시간 전',
      details: '전체 시스템 상태를 점검했습니다'
    });

    return activities;
  };

  // 데이터 변환 적용
  const recentActivities = rawData || [];
  const displayActivities = recentActivities.slice(0, 5);
  const hasMoreActivities = recentActivities.length > 5;

  // 활동 아이콘 가져오기
  const getActivityIcon = (type) => {
    switch (type) {
      case 'profile':
        return 'bi-person-circle';
      case 'schedule':
        return 'bi-calendar-check';
      case 'consultation':
        return 'bi-chat-dots';
      case 'payment':
        return 'bi-credit-card';
      default:
        return 'bi-info-circle';
    }
  };

  // 전체보기 핸들러
  const handleViewAll = () => {
    const roleBasedPath = user?.role?.toLowerCase() || 'client';
    navigate(`/${roleBasedPath}/activity-history`);
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={!displayActivities.length}
      onRefresh={refresh}
    >
      <div className="recent-activities-widget-content">
        {/* 헤더 */}
        <div className="recent-activities-header">
          <h3 className={RECENT_ACTIVITIES_CSS.SECTION_TITLE}>
            <Clock size={20} />
            최근 활동
          </h3>
          {hasMoreActivities && (
            <MGButton
              className="mg-btn mg-btn--outline mg-btn--primary mg-btn--sm"
              variant="outline"
              size="small"
              type="button"
              onClick={handleViewAll}
            >
              <i className="bi bi-arrow-right" />
              전체보기
            </MGButton>
          )}
        </div>

        {/* 활동 리스트 */}
        <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_LIST}>
          {displayActivities.length > 0 ? (
            displayActivities.map((activity, index) => (
              <div 
                key={index} 
                className={RECENT_ACTIVITIES_CSS.ACTIVITY_ITEM}
                data-type={activity.type}
              >
                <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_ICON}>
                  <i className={`bi ${getActivityIcon(activity.type)}`} />
                </div>
                <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_CONTENT}>
                  <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_TITLE}>
                    {activity.title}
                  </div>
                  <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_TIME}>
                    {activity.time}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activities">
              <i className="bi bi-inbox" />
              <p>최근 활동이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </BaseWidget>
  );
};

export default RecentActivitiesWidget;
