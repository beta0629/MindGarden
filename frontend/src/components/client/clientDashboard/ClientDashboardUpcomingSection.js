/**
 * Client Dashboard — 다음 일정 섹션 (ListTableView · v1.4)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SafeText from '../../common/SafeText';
import {
  CLIENT_DASHBOARD_KPI_ROUTES,
  CLIENT_DASHBOARD_ROUTES
} from '../../../constants/clientDashboardRoutes';
import ClientDashboardListSection from './ClientDashboardListSection';
import {
  CLIENT_DASHBOARD_UPCOMING_COLUMNS,
  CLIENT_DASHBOARD_UPCOMING_SCHEDULE_TEST_ID,
  CLIENT_NEXT_SECTION_DESC,
  CLIENT_NEXT_SECTION_TITLE,
  CLIENT_SCHEDULE_EMPTY_BODY,
  CLIENT_SCHEDULE_LOAD_ERROR_LABEL,
  CLIENT_SCHEDULE_VIEW_ALL_LABEL
} from './constants';
import { formatScheduleCardDateTime } from './scheduleUtils';

const ClientDashboardUpcomingSection = ({
  schedules,
  loading = false,
  error = false,
  onRetry = null
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tableData = useMemo(
    () => (Array.isArray(schedules) ? schedules : []).map((schedule, idx) => ({
      id: `${schedule.date}-${schedule.startTime}-${idx}`,
      datetimeLabel: formatScheduleCardDateTime(schedule),
      titleLabel: schedule.title || t('common:client.ClientDashboard.t_4968e29c'),
      statusLabel: idx === 0
        ? '다음 일정'
        : t('common:client.ClientDashboard.t_7ba9542c')
    })),
    [schedules, t]
  );

  const goSchedule = () => navigate(CLIENT_DASHBOARD_KPI_ROUTES.THIS_MONTH_SESSIONS);

  return (
    <ClientDashboardListSection
      title={CLIENT_NEXT_SECTION_TITLE}
      subtitle={CLIENT_NEXT_SECTION_DESC}
      accentVariant="primary"
      columns={CLIENT_DASHBOARD_UPCOMING_COLUMNS}
      data={tableData}
      renderCell={(columnKey, item) => <SafeText tag="span">{item[columnKey]}</SafeText>}
      onRowClick={goSchedule}
      emptyText={CLIENT_SCHEDULE_EMPTY_BODY}
      viewAllHref={CLIENT_DASHBOARD_ROUTES.SCHEDULE}
      viewAllLabel={CLIENT_SCHEDULE_VIEW_ALL_LABEL}
      dataTestId={CLIENT_DASHBOARD_UPCOMING_SCHEDULE_TEST_ID}
      className="client-dashboard__section client-dashboard__section--upcoming"
      loading={loading}
      error={error ? CLIENT_SCHEDULE_LOAD_ERROR_LABEL : ''}
      onRetry={onRetry}
    />
  );
};

ClientDashboardUpcomingSection.propTypes = {
  schedules: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.bool,
  onRetry: PropTypes.func
};

export default ClientDashboardUpcomingSection;
