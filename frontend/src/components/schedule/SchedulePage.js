/**
 * 스케줄 관리 메인 페이지 - 아토믹 구조 래퍼
 * AdminDashboardV2와 동일한 레이아웃(GNB+LNB) 사용
 *
 * @author MindGarden
 * @since 2024-12-19
 * @updated 2025-02-22 - AdminDashboardV2 레이아웃 및 아토믹 디자인 적용
 */

import React, { useState, useEffect } from 'react';
import UnifiedScheduleComponent from './UnifiedScheduleComponent';
import ConsultantStatus from './ConsultantStatus';
import TodayStats from './TodayStats';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ScheduleB0KlA.css';
import './SchedulePage.css';

const SchedulePage = ({ user: propUser }) => {
  const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();
  
  const [userRole, setUserRole] = useState('CLIENT');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  // 사용자 정보 결정 (prop > session > null)
  const displayUser = propUser || sessionUser;

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    if (displayUser) {
      setUserRole(displayUser.role || 'CLIENT');
      setUserId(displayUser.id);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [displayUser, sessionLoading]);

  /**
   * 권한 확인 (동적 권한 시스템 사용)
   */
  const hasSchedulePermission = () => {
    return hasPermission('REGISTER_SCHEDULER') || userRole === 'CONSULTANT';
  };

  /**
   * 관리자 권한 확인 (동적 권한 시스템 사용)
   */
  const isAdmin = () => {
    return hasPermission('REGISTER_SCHEDULER');
  };

  if (loading || sessionLoading) {
    return (
      <AdminCommonLayout
        title="스케줄 관리"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        loading={true}
        loadingText="스케줄을 불러오는 중..."
      />
    );
  }

  if (!displayUser) {
    return (
      <AdminCommonLayout
        title="스케줄 관리"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      >
        <div className="schedule-page mg-v2-ad-b0kla">
          <div className="access-denied">
            <div className="access-denied-icon">🔐</div>
            <h2>로그인이 필요합니다</h2>
            <p>스케줄 관리 기능을 사용하려면 로그인해주세요.</p>
            <button 
              className="btn schedule-page-btn-primary"
              onClick={() => window.location.href = '/login'}
            >
              로그인하기
            </button>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (!hasSchedulePermission()) {
    return (
      <AdminCommonLayout
        title="스케줄 관리"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      >
        <div className="schedule-page mg-v2-ad-b0kla">
          <div className="access-denied">
            <div className="access-denied-icon">🚫</div>
            <h2>접근 권한이 없습니다</h2>
            <p>스케줄 관리 기능은 상담사 이상의 권한이 필요합니다.</p>
            <div className="current-role">
              현재 역할: <span className="role-badge">{userRole}</span>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  const pageContent = (
    <ContentArea>
      <ContentHeader 
        title="스케줄 통합 관리" 
        subtitle="전체 상담사 및 내담자의 일정을 한눈에 확인하고 관리하세요."
      />
      
      {isAdmin() && (
        <div className="mg-v2-mb-lg">
          <TodayStats />
        </div>
      )}

      <div className="mg-v2-schedule-grid" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* 좌측 캘린더 영역 (메인) */}
        <div className="mg-v2-schedule-grid__main" style={{ flex: '1', minWidth: 0 }}>
          <ContentSection noCard={true}>
            <UnifiedScheduleComponent 
              user={displayUser}
              userRole={userRole}
              userId={isAdmin() ? 0 : userId}
            />
          </ContentSection>
        </div>

        {/* 우측 통계/현황 영역 (사이드바) */}
        {isAdmin() && (
          <div className="mg-v2-schedule-grid__sidebar" style={{ width: '320px', flexShrink: 0 }}>
            <ContentSection title="상담사 현황" noCard={true}>
              <ConsultantStatus />
            </ContentSection>
          </div>
        )}
      </div>
    </ContentArea>
  );

  return (
    <AdminCommonLayout
      title="스케줄 관리"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
    >
      {pageContent}
    </AdminCommonLayout>
  );
};

export default SchedulePage;
