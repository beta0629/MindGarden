/**
 * Welcome Widget - 표준화된 환영 위젯
 * WelcomeSection을 위젯으로 변환 + 하드코딩 제거
 * 
 * @author CoreSolution
 * @version 2.0.0 (위젯 표준화 업그레이드)
 * @since 2025-11-29
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { RoleUtils } from '../../../constants/roles';
import { WELCOME_SECTION_CSS } from '../../../constants/css';
import { DASHBOARD_MESSAGES } from '../../../constants/dashboard';
import { DASHBOARD_API } from '../../../constants/api';
import { apiGet } from '../../../utils/ajax';
import WeatherCard from '../WeatherCard';
import { getStatusLabel } from '../../../utils/colorUtils';
import './WelcomeWidget.css';

const WelcomeWidget = ({ widget, user }) => {
  // 역할별 API 엔드포인트 결정
  const getDataSourceConfig = () => {
    if (!user?.role) return { type: 'static' };
    
    const baseConfig = {
      type: 'api',
      cache: true,
      refreshInterval: 30000, // 30초마다 새로고침
      params: {
        userId: user.id,
        userRole: user.role
      }
    };
    
    switch (user.role) {
      case 'CLIENT':
        return {
          ...baseConfig,
          url: '/api/schedules',
          params: { ...baseConfig.params, userRole: 'CLIENT' }
        };
      case 'CONSULTANT':
        return {
          ...baseConfig,
          url: '/api/schedules',
          params: { ...baseConfig.params, userRole: 'CONSULTANT' }
        };
      case 'ADMIN':
      case 'BRANCH_SUPER_ADMIN':
      case 'HQ_MASTER':
        return {
          ...baseConfig,
          url: '/api/schedules/admin/statistics',
          params: { ...baseConfig.params, userRole: 'ADMIN' }
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
    data: consultationData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  const [imageLoadError, setImageLoadError] = useState(false);
  const [consultantStats, setConsultantStats] = useState(null);
  const navigate = useNavigate();

  // 상담사 추가 통계 데이터 로드 (상담사만)
  useEffect(() => {
    const loadConsultantStats = async () => {
      if (user?.role !== 'CONSULTANT') return;
      
      try {
        const statsResponse = await apiGet(DASHBOARD_API.CONSULTANT_STATS, {
          userRole: 'CONSULTANT'
        });
        
        if (statsResponse?.success && statsResponse?.data) {
          setConsultantStats({
            rating: statsResponse.data.averageRating || 0,
            todayStats: statsResponse.data.todayStats || {}
          });
        }
      } catch (error) {
        console.warn('⚠️ 상담사 통계 로드 실패:', error);
        setConsultantStats({ rating: 0, todayStats: {} });
      }
    };

    if (RoleUtils.isConsultant(user)) {
      loadConsultantStats();
    }
  }, [user?.role, user?.id]);
  
  // 현재 시간 (위젯 설정에서 가져오거나 기본값)
  const currentTime = widget?.config?.currentTime || new Date();

  // 프로필 이미지 URL 가져오기
  const getProfileImageUrl = () => {
    if (user?.profileImageUrl && !imageLoadError) {
      return user.profileImageUrl;
    }
    if (user?.socialProfileImage && !imageLoadError) {
      return user.socialProfileImage;
    }
    return '/default-avatar.svg';
  };

  // 사용자 이름 가져오기
  const getUserDisplayName = () => {
    if (user?.name && !user.name.includes('==')) {
      return user.name;
    }
    if (user?.nickname && !user.nickname.includes('==')) {
      return user.nickname;
    }
    if (user?.username) {
      return user.username;
    }
    return '사용자';
  };

  const getWelcomeTitle = () => {
    if (!user?.role) {
      return DASHBOARD_MESSAGES.WELCOME.DEFAULT;
    }
    
    switch (user.role) {
      case 'CLIENT':
        return DASHBOARD_MESSAGES.WELCOME.CLIENT;
      case 'CONSULTANT':
        return DASHBOARD_MESSAGES.WELCOME.CONSULTANT;
      case 'ADMIN':
      case 'BRANCH_SUPER_ADMIN':
      case 'HQ_MASTER':
        return DASHBOARD_MESSAGES.WELCOME.ADMIN;
      default:
        return DASHBOARD_MESSAGES.WELCOME.DEFAULT;
    }
  };

  const getWelcomeSubtitle = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '좋은 아침입니다!';
    if (hour < 18) return '오늘 하루도 화이팅!';
    return '오늘 하루 고생하셨습니다!';
  };

  // 역할별 데이터 처리
  const processConsultationData = () => {
    if (!consultationData) return { todayConsultations: [], stats: null };
    
    let todayConsultations = [];
    let stats = null;
    
    if (RoleUtils.isClient(user)) {
      // 내담자: 오늘의 상담 필터링
      todayConsultations = consultationData.schedules?.filter(schedule => {
        if (!schedule.scheduledAt) return false;
        const scheduleDate = new Date(schedule.scheduledAt);
        const today = new Date();
        return scheduleDate.toDateString() === today.toDateString();
      }) || [];
    } else if (RoleUtils.isConsultant(user)) {
      // 상담사: 오늘의 상담 + 통계
      todayConsultations = consultationData.schedules?.filter(schedule => {
        if (!schedule.scheduledAt) return false;
        const scheduleDate = new Date(schedule.scheduledAt);
        const today = new Date();
        return scheduleDate.toDateString() === today.toDateString();
      }) || [];
      
      // 기본 일정 데이터와 추가 통계 데이터 병합
      stats = {
        todayConsultations: todayConsultations.length,
        monthlyConsultations: consultationData.monthlyConsultations || 0,
        rating: consultantStats?.rating || 0,
        ...consultantStats?.todayStats
      };
    } else if (RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, 'HQ_MASTER')) {
      // 관리자: 시스템 통계
      stats = {
        totalUsers: consultationData.totalUsers || 0,
        todayConsultations: consultationData.todayConsultations || 0,
        pendingMappings: consultationData.pendingMappings || 0,
        activeMappings: consultationData.activeMappings || 0
      };
    }
    
    return { todayConsultations, stats };
  };

  const { todayConsultations, stats } = processConsultationData();

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={false} // 환영 메시지는 항상 표시
      onRefresh={refresh}
    >
      <div className="welcome-widget-content">
        {/* 메인 환영 섹션 */}
        <div className="welcome-main-section">
          <div className="welcome-profile-container">
            <div className="welcome-profile-image-wrapper">
              <img
                src={getProfileImageUrl()}
                alt="프로필"
                className="welcome-profile-image"
                onError={() => setImageLoadError(true)}
              />
            </div>
            <div className="welcome-text-content">
              <h2 className="welcome-title">{getWelcomeTitle()}</h2>
              <h3 className="welcome-user-name">{getUserDisplayName()}</h3>
              <p className="welcome-subtitle">{getWelcomeSubtitle()}</p>
            </div>
          </div>
        </div>

        {/* 내담자 전용 - 오늘의 상담 정보 */}
        {RoleUtils.isClient(user) && (
          <div className="welcome-info-cards">
            <div className="welcome-info-card today-consultation-card">
              <div className="info-icon info-icon--consultation">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="info-content">
                <h3 className="info-title">오늘의 상담</h3>
                <p className="info-value">
                  {todayConsultations.length > 0 ? (
                    <span>
                      <span className="consultation-count">{todayConsultations.length}</span>
                      건의 상담이 오늘 예정되어 있습니다
                    </span>
                  ) : (
                    <span className="no-consultation">오늘 예정된 상담이 없습니다</span>
                  )}
                </p>
                {todayConsultations.length > 0 && (
                  <div className="consultation-details">
                    {todayConsultations.slice(0, 2).map((consultation, index) => (
                      <div key={consultation.id || index} className="consultation-item">
                        <span className="consultation-time">
                          {new Date(consultation.scheduledAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="consultation-consultant">
                          {consultation.consultantName || '상담사'}님과 상담
                        </span>
                        <span className={`consultation-status ${consultation.status?.toLowerCase()}`}>
                          {getStatusLabel(consultation.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 날씨 카드 */}
        <WeatherCard />
      </div>
    </BaseWidget>
  );
};

export default WelcomeWidget;