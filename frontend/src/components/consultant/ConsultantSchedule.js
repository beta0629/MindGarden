import React from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedScheduleComponent from '../schedule/UnifiedScheduleComponent';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import { useSession } from '../../contexts/SessionContext';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';

const CONSULTANT_SCHEDULE_TITLE_ID = 'consultant-schedule-page-title';

/**
 * 상담사 스케줄 관리 — UnifiedScheduleComponent + B0KlA 셸
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2025-09-16
 */
const ConsultantSchedule = () => {
  const { user, isLoading: sessionLoading } = useSession();

  console.log('📅 ConsultantSchedule 렌더링:', { user, sessionLoading });

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="상담사 스케줄">
          <ContentHeader
            title="스케줄"
            subtitle="상담 일정을 확인하고 관리합니다"
            titleId={CONSULTANT_SCHEDULE_TITLE_ID}
          />
          <main aria-labelledby={CONSULTANT_SCHEDULE_TITLE_ID}>
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  if (sessionLoading) {
    console.log('⏳ ConsultantSchedule: 세션 로딩 중...');
    return (
      <AdminCommonLayout title="스케줄">
        {pageShell(
          <UnifiedLoading type="inline" text="스케줄 정보를 불러오는 중..." />
        )}
      </AdminCommonLayout>
    );
  }

  if (!user) {
    console.log('❌ ConsultantSchedule: 사용자 정보 없음');
    return (
      <AdminCommonLayout title="스케줄">
        {pageShell(
          <UnifiedLoading type="inline" text="사용자 정보를 확인하는 중..." />
        )}
      </AdminCommonLayout>
    );
  }

  console.log('✅ ConsultantSchedule: UnifiedScheduleComponent 렌더링 시작', { userRole: 'CONSULTANT', userId: user.id });

  return (
    <AdminCommonLayout title="스케줄">
      {pageShell(
        <UnifiedScheduleComponent
          userRole="CONSULTANT"
          userId={user.id}
        />
      )}
    </AdminCommonLayout>
  );
};

export default ConsultantSchedule;
