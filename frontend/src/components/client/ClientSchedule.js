import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import ScheduleCalendar from '../schedule/ScheduleCalendar';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ClientSchedule.css';

const CLIENT_SCHEDULE_TITLE_ID = 'client-schedule-page-title';

/**
 * 내담자 일정 페이지 (디자인 시스템 적용)
 */
const ClientSchedule = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      setLoading(false);
    }
  }, [user, isLoggedIn, sessionLoading, navigate]);

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="내담자 일정">
          <ContentHeader
            title="내 일정"
            subtitle="예약된 상담 일정을 확인하고 관리할 수 있습니다."
            titleId={CLIENT_SCHEDULE_TITLE_ID}
          />
          <main aria-labelledby={CLIENT_SCHEDULE_TITLE_ID}>
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  if (sessionLoading || loading) {
    return (
      <AdminCommonLayout title="스케줄">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="로딩중..." />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (error) {
    return (
      <AdminCommonLayout title="스케줄">
        {pageShell(
          <div className="client-schedule-error">
            <div className="client-schedule-error__icon">
              <AlertTriangle size={48} />
            </div>
            <h3 className="client-schedule-error__title">오류가 발생했습니다</h3>
            <p className="client-schedule-error__message">{error}</p>
            <MGButton
              variant="primary"
              onClick={() => window.location.reload()}
              preventDoubleClick={false}
            >
              다시 시도
            </MGButton>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="스케줄">
      {pageShell(
        <div className="client-schedule-calendar-wrapper">
          <ScheduleCalendar
            userRole={user?.role || 'CLIENT'}
            userId={user?.id || null}
            readOnly={false}
            showClientView={true}
          />
        </div>
      )}
    </AdminCommonLayout>
  );
};

export default ClientSchedule;
