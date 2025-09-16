import React from 'react';
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
  const { user } = useSession();

  return (
    <UnifiedScheduleComponent 
      user={user}
      userRole="CONSULTANT"
      userId={user?.id}
    />
  );
};

export default ConsultantSchedule;