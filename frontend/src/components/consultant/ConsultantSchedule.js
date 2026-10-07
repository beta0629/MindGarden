import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarX2, RefreshCw } from 'lucide-react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedScheduleComponent from '../schedule/UnifiedScheduleComponent';
import CheckoutSameDayModal from '../admin/mapping/CheckoutSameDayModal';
import useScheduleDetailSameDayCheckout from '../schedule/hooks/useScheduleDetailSameDayCheckout';
import MGButton from '../common/MGButton';
import EmptyState from '../common/EmptyState';
import ConsultantSummaryStrip from '../dashboard-v2/consultant/ConsultantSummaryStrip';
import ConsultantSuitePage from './suite/ConsultantSuitePage';
import ConsultantFilterChips from './suite/ConsultantFilterChips';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import useConsultantIncompleteRecordCount from '../../hooks/useConsultantIncompleteRecordCount';
import { buildConsultantScheduleSummary } from '../../utils/consultantScheduleSummary';
import { useSession } from '../../contexts/SessionContext';
import { USER_ROLES } from '../../constants/roles';
import {
  CONSULTANT_SCHEDULE_STATUS_FILTER,
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_TEST_ID
} from '../../constants/consultantSuite';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../dashboard-v2/consultant/ConsultantSummaryStrip.css';
import './ConsultantScheduleSuite.css';

const CONSULTANT_SCHEDULE_TITLE_ID = 'consultant-schedule-page-title';
const REFRESH_ICON_SIZE = 16;
const EMPTY_ICON_SIZE = 32;

/**
 * 상담사 「내 일정」 — 본인 달력 전용 (신규 배정·등록 CTA 없음)
 *
 * 셸·패딩·카드는 /consultant/dashboard(mg-v2)와 공유하고, 월 달력은 관리자 통합 스케줄과 같은
 * UnifiedScheduleComponent(calendarSkin="integrated") 토큰을 그대로 쓴다.
 * 월|주|일·상태 칩 선택은 slate. 상태 칩은 이벤트 클래스(status-*)로만 거르며 조회 API는 바꾸지 않는다.
 *
 * @author Core Solution
 * @version 3.0.0
 * @since 2025-09-16
 */
const ConsultantSchedule = () => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const { user, isLoading: sessionLoading } = useSession();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState(CONSULTANT_SCHEDULE_STATUS_FILTER.ALL);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const { count: missingLogCount, reload: reloadMissingLogs } = useConsultantIncompleteRecordCount(user?.id);

  const handleCheckoutReload = useCallback(() => {
    setRefetchTrigger((n) => n + 1);
  }, []);
  const {
    onCheckoutSameDayFromDetail,
    checkoutSameDayMapping,
    closeCheckoutSameDay,
    handleCheckoutSameDayCompleted
  } = useScheduleDetailSameDayCheckout({
    user,
    onCheckoutCompleted: handleCheckoutReload
  });

  const handleRefresh = useCallback(() => {
    setRefetchTrigger((n) => n + 1);
    reloadMissingLogs();
  }, [reloadMissingLogs]);

  const summary = useMemo(
    () => buildConsultantScheduleSummary(scheduleEvents, new Date()),
    [scheduleEvents]
  );

  const formatCount = (count) => (count == null ? '—' : t('schedule.countUnit', { count }));

  const summaryItems = [
    { id: 'today', label: t('schedule.summaryToday'), value: formatCount(summary.todayCount) },
    { id: 'week', label: t('schedule.summaryWeek'), value: formatCount(summary.weekCount) },
    { id: 'missingLogs', label: t('schedule.summaryMissingLogs'), value: formatCount(missingLogCount) }
  ];

  const statusItems = [
    { key: CONSULTANT_SCHEDULE_STATUS_FILTER.ALL, label: t('schedule.statusAll') },
    { key: CONSULTANT_SCHEDULE_STATUS_FILTER.SCHEDULED, label: t('schedule.statusScheduled') },
    { key: CONSULTANT_SCHEDULE_STATUS_FILTER.COMPLETED, label: t('schedule.statusCompleted') },
    { key: CONSULTANT_SCHEDULE_STATUS_FILTER.CANCELLED, label: t('schedule.statusCancelled') }
  ];

  const refreshAction = (
    <MGButton
      type="button"
      variant="outline"
      size="medium"
      className={buildErpMgButtonClassName({
        variant: 'outline',
        size: 'md',
        loading: false,
        className: 'mg-button--with-icon'
      })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={handleRefresh}
      disabled={!user}
      preventDoubleClick={false}
    >
      <RefreshCw size={REFRESH_ICON_SIZE} aria-hidden />
      {t('actions.refresh')}
    </MGButton>
  );

  const renderPage = (body) => (
    <AdminCommonLayout className="mg-v2-dashboard-layout">
      <ConsultantSuitePage
        title={t('schedule.title')}
        subtitle={t('schedule.subtitle')}
        titleId={CONSULTANT_SCHEDULE_TITLE_ID}
        actions={refreshAction}
        ariaLabel={t('schedule.ariaLabel')}
        testId={CONSULTANT_SUITE_TEST_ID.SCHEDULE_PAGE}
      >
        {body}
      </ConsultantSuitePage>
      {checkoutSameDayMapping && (
        <CheckoutSameDayModal
          isOpen={!!checkoutSameDayMapping}
          onClose={closeCheckoutSameDay}
          mapping={checkoutSameDayMapping}
          onCheckoutCompleted={handleCheckoutSameDayCompleted}
        />
      )}
    </AdminCommonLayout>
  );

  if (sessionLoading || !user) {
    return renderPage(
      <section className={CONSULTANT_SUITE_CLASS.PANEL}>
        <UnifiedLoading
          type="inline"
          text={sessionLoading ? t('schedule.sessionLoading') : t('schedule.userLoading')}
        />
      </section>
    );
  }

  return renderPage(
    <>
      <ConsultantSummaryStrip
        items={summaryItems}
        className={CONSULTANT_SUITE_CLASS.SUMMARY}
        ariaLabel={t('schedule.summaryAria')}
      />
      <section
        className={`${CONSULTANT_SUITE_CLASS.PANEL} consultant-schedule__panel`}
        data-calendar-skin="integrated"
        data-layout-context="consultant-schedule"
        data-status-filter={statusFilter}
      >
        <ConsultantFilterChips
          items={statusItems}
          activeKey={statusFilter}
          onChange={setStatusFilter}
          ariaLabel={t('schedule.statusFilterAria')}
          className="consultant-schedule__status-chips"
          testIdPrefix="consultant-schedule-status"
        />
        <UnifiedScheduleComponent
          userRole={USER_ROLES.CONSULTANT}
          userId={user.id}
          hideScheduleTitle
          integratedMonthEventLayout
          calendarSkin="integrated"
          refetchTrigger={refetchTrigger}
          onScheduleEventsChange={setScheduleEvents}
          onCheckoutSameDayFromDetail={onCheckoutSameDayFromDetail}
        />
        <EmptyState
          className={`${CONSULTANT_SUITE_CLASS.EMPTY} consultant-schedule__empty`}
          icon={<CalendarX2 size={EMPTY_ICON_SIZE} aria-hidden />}
          title={t('schedule.emptyTitle')}
          description={t('schedule.emptyDescription')}
        />
        <p className={CONSULTANT_SUITE_CLASS.CAPTION}>{t('schedule.footCaption')}</p>
      </section>
    </>
  );
};

export default ConsultantSchedule;
