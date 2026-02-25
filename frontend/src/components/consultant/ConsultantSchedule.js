import React from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { CONSULTANT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import UnifiedScheduleComponent from '../schedule/UnifiedScheduleComponent';
import { useSession } from '../../contexts/SessionContext';

/**
 * 상담사 스케줄 관리 컴포넌트 (통합 버전)
/**
 * - UnifiedScheduleComponent를 사용하여 중복 제거
/**
 * - 상담사 전용 권한으로 제한
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-09-16
 */
const ConsultantSchedule = () => {
  const { user, isLoading: sessionLoading } = useSession();

  console.log('📅 ConsultantSchedule 렌더링:', { user, sessionLoading });

  // 세션 로딩 중이면 로딩 표시
  if (sessionLoading) {
    console.log('⏳ ConsultantSchedule: 세션 로딩 중...');
    return (
      <AdminCommonLayout title="스케줄">
        <UnifiedLoading type="page" text="스케줄 정보를 불러오는 중..." />
      </AdminCommonLayout>
    );
  }

  if (!user) {
    console.log('❌ ConsultantSchedule: 사용자 정보 없음');
    return (
      <AdminCommonLayout title="스케줄">
        <UnifiedLoading type="page" text="사용자 정보를 확인하는 중..." />
      </AdminCommonLayout>
    );
  }

  console.log('✅ ConsultantSchedule: UnifiedScheduleComponent 렌더링 시작', { userRole: 'CONSULTANT', userId: user.id });

  return (
    <AdminCommonLayout title="스케줄">
      <UnifiedScheduleComponent 
        userRole="CONSULTANT"
        userId={user.id}
      />
    </AdminCommonLayout>
  );
};

export default ConsultantSchedule;