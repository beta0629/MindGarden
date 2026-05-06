/**
 * 스케줄 관리 메인 페이지 - 아토믹 구조 래퍼
 * AdminDashboardV2와 동일한 레이아웃(GNB+LNB) 사용
 *
 * @author Core Solution
 * @since 2024-12-19
 * @updated 2025-02-22 - AdminDashboardV2 레이아웃 및 아토믹 디자인 적용
 */

import React, { useState, useEffect } from 'react';
import UnifiedScheduleComponent from './UnifiedScheduleComponent';
import ConsultantStatus from './ConsultantStatus';
import TodayStats from './TodayStats';
import { useSession } from '../../contexts/SessionContext';
import { redirectToLoginPageOnce } from '../../utils/sessionRedirect';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ScheduleB0KlA.css';
import './SchedulePage.css';
import { USER_ROLES } from '../../constants/roles';
import { canRegisterSchedulerByRoleString } from '../../utils/scheduleRoleGuards';

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
   * 스케줄 페이지 조회 권한. 상담사는 역할만으로 진입 가능.
   * REGISTER_SCHEDULER 미부여여도 SCHEDULE_MODIFY 등 스케줄 권한이 있으면 진입 가능.
   */
  const hasSchedulePermission = () => {
    if (userRole === USER_ROLES.CONSULTANT) {
      return true;
    }
    if (userRole === USER_ROLES.CLIENT) {
      return false;
    }
    return (
      hasPermission('REGISTER_SCHEDULER')
      || hasPermission('SCHEDULE_MODIFY')
      || hasPermission('SCHEDULE_MANAGE')
      || hasPermission('ACCESS_SCHEDULE_MANAGEMENT')
    );
  };

  /**
   * 스케줄 신규 등록·전역 뷰(관리자형) UX — 역할 문자열 기준.
   * REGISTER_SCHEDULER 동적 권한과 별개로 STAFF 등은 백엔드 canRegisterScheduler와 동일하게 허용.
   */
  const isScheduleRegisterActor = () => canRegisterSchedulerByRoleString(userRole);

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
            <MGButton
              variant="primary"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading: false,
                className: 'schedule-page-btn-primary'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => redirectToLoginPageOnce()}
              preventDoubleClick={false}
            >
              로그인하기
            </MGButton>
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
      
      {isScheduleRegisterActor() && (
        <div className="mg-v2-mb-lg">
          <TodayStats />
        </div>
      )}

      <div className="mg-v2-schedule-grid">
        {/* 좌측 캘린더 영역 (메인) */}
        <div className="mg-v2-schedule-grid__main">
          <ContentSection noCard={true} className="mg-v2-schedule-content-section">
            <div className="mg-v2-schedule-grid__main-inner">
              <UnifiedScheduleComponent 
                user={displayUser}
                userRole={userRole}
                userId={isScheduleRegisterActor() ? 0 : userId}
              />
            </div>
          </ContentSection>
        </div>

        {/* 우측 통계/현황 영역 (사이드바) */}
        {isScheduleRegisterActor() && (
          <div className="mg-v2-schedule-grid__sidebar">
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
