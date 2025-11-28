import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedScheduleComponent from '../schedule/UnifiedScheduleComponent';
import { useSession } from '../../contexts/SessionContext';

/**
 * 상담사 스케줄 관리 컴포넌트 (통합 버전)
 * - UnifiedScheduleComponent를 사용하여 중복 제거
 * - 상담사 전용 권한으로 제한
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-09-16
 */
const ConsultantSchedule = () => {
  const { user, isLoading: sessionLoading } = useSession();

  console.log('📅 ConsultantSchedule 렌더링:', { user, sessionLoading });

  // 세션 로딩 중이면 로딩 표시
  if (sessionLoading) {
    console.log('⏳ ConsultantSchedule: 세션 로딩 중...');
    return (
      <SimpleLayout>
        <UnifiedLoading />
      </SimpleLayout>
    );
  }

  if (!user) {
    console.log('❌ ConsultantSchedule: 사용자 정보 없음');
    return (
      <SimpleLayout>
        <UnifiedLoading />
      </SimpleLayout>
    );
  }

  console.log('✅ ConsultantSchedule: UnifiedScheduleComponent 렌더링 시작', { userRole: 'CONSULTANT', userId: user.id });

  return (
    <SimpleLayout>
      <UnifiedScheduleComponent 
        userRole="CONSULTANT"
        userId={user.id}
      />
    </SimpleLayout>
  );
};

export default ConsultantSchedule;