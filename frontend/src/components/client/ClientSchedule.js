import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import ClientWebPageShell from './ClientWebPageShell';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import UnifiedScheduleComponent from '../schedule/UnifiedScheduleComponent';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/unified-design-tokens.css';
import './ClientSchedule.css';
import { USER_ROLES } from '../../constants/roles';
import { CLIENT_WEB_SUITE_COPY } from '../../constants/clientWebSuiteConstants';
import { useTranslation } from 'react-i18next';

const CLIENT_SCHEDULE_TITLE_ID = 'client-schedule-page-title';

/**
 * 내담자 일정 페이지 — ClientWebPageShell (v4)
 */
const ClientSchedule = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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
      const returnTo = `${location.pathname}${location.search || ''}`;
      navigate(`/login?redirect=${encodeURIComponent(returnTo)}`, { replace: true });
      return;
    }

    if (user) {
      setLoading(false);
    }
  }, [user, isLoggedIn, sessionLoading, navigate, location.pathname, location.search]);

  const pageShell = (body) => (
    <ClientWebPageShell
      activeNavId="schedule"
      title={CLIENT_WEB_SUITE_COPY.SCHEDULE_TITLE}
      titleId={CLIENT_SCHEDULE_TITLE_ID}
      testId="client-schedule-page"
    >
      <main
        className="client-schedule__main"
        aria-labelledby={CLIENT_SCHEDULE_TITLE_ID}
      >
        {body}
      </main>
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
