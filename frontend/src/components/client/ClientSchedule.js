import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import ClientWebPageShell from './ClientWebPageShell';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import UnifiedScheduleComponent from '../schedule/UnifiedScheduleComponent';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ClientSchedule.css';
import { USER_ROLES } from '../../constants/roles';
import { useTranslation } from 'react-i18next';

const CLIENT_SCHEDULE_TITLE_ID = 'client-schedule-page-title';

/**
 * 내담자 일정 페이지 (디자인 시스템 적용)
 * ClientWebPageShell — header SSOT · no AdminCommonLayout / no LNB
 */
const ClientSchedule = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading, checkSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarKey, setCalendarKey] = useState(0);

  const handleRetry = async() => {
    setError(null);
    setLoading(true);
    try {
      await checkSession(true);
      setCalendarKey((k) => k + 1);
    } catch (retryErr) {
      setError(retryErr?.message || '세션을 다시 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
    <ClientWebPageShell activeNavId="schedule">
      <ContentArea ariaLabel="내담자 일정">
        <ContentHeader
          title="내 일정"
          subtitle="예약된 상담 일정을 확인하고 관리할 수 있습니다."
          titleId={CLIENT_SCHEDULE_TITLE_ID}
        />
        <main
          className="client-schedule__main"
          data-testid="client-schedule-page"
          aria-labelledby={CLIENT_SCHEDULE_TITLE_ID}
        >
          {body}
        </main>
      </ContentArea>
    </ClientWebPageShell>
  );

  if (sessionLoading || loading) {
    return pageShell(
      <div aria-busy="true" aria-live="polite">
        <UnifiedLoading type="inline" text="로딩중..." />
      </div>
    );
  }

  if (error) {
    return pageShell(
      <div className="client-schedule-error">
        <div className="client-schedule-error__icon">
          <AlertTriangle size={48} />
        </div>
        <h3 className="client-schedule-error__title">오류가 발생했습니다</h3>
        <p className="client-schedule-error__message">{error}</p>
        <MGButton
          variant="primary"
          className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
          onClick={handleRetry}
          preventDoubleClick={false}
        >
          {t('common.labels.retry')}
        </MGButton>
      </div>
    );
  }

  return pageShell(
    <div
      className="client-schedule-calendar-wrapper"
      data-calendar-skin="integrated"
      data-layout-context="client-schedule"
    >
      <UnifiedScheduleComponent
        key={calendarKey}
        userRole={user?.role || USER_ROLES.CLIENT}
        userId={user?.id || null}
        integratedMonthEventLayout
        calendarSkin="integrated"
        hideScheduleTitle
      />
    </div>
  );
};

export default ClientSchedule;
