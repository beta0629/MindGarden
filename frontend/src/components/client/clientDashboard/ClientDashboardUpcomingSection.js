/**
 * Client Dashboard — 다음 일정 섹션 (ListTableView)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import SafeText from '../../common/SafeText';
import ClientDashboardListSection from './ClientDashboardListSection';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CLIENT_DASHBOARD_UPCOMING_SCHEDULE_TEST_ID,
  CLIENT_NEXT_SECTION_DESC,
  CLIENT_NEXT_SECTION_TITLE,
  CLIENT_SCHEDULE_VIEW_LABEL,
  CLIENT_UPCOMING_COLUMNS,
  CLIENT_UPCOMING_CTA_LABEL,
  CLIENT_UPCOMING_EMPTY_TEXT
} from './constants';
import { buildUpcomingRows } from './scheduleUtils';

const ClientDashboardUpcomingSection = ({ schedules, loading, error, onRetry }) => {
  const navigate = useNavigate();
  const rows = useMemo(() => buildUpcomingRows(schedules), [schedules]);
  const goSchedule = useCallback(() => navigate(CLIENT_DASHBOARD_ROUTES.SCHEDULE), [navigate]);

  const renderCell = useCallback((columnKey, item) => {
    if (columnKey === 'cta') {
      return (
        <span className="client-dashboard-list__cta" aria-hidden>
          {CLIENT_UPCOMING_CTA_LABEL}
        </span>
      );
    }
    return <SafeText tag="span">{toDisplayString(item[columnKey], '—')}</SafeText>;
  }, []);

  return (
    <ClientDashboardListSection
      title={CLIENT_NEXT_SECTION_TITLE}
      subtitle={CLIENT_NEXT_SECTION_DESC}
      columns={CLIENT_UPCOMING_COLUMNS}
      data={rows}
      renderCell={renderCell}
      onRowClick={goSchedule}
      emptyText={CLIENT_UPCOMING_EMPTY_TEXT}
      loading={loading}
      error={error}
      onRetry={onRetry}
      viewAllHref={CLIENT_DASHBOARD_ROUTES.SCHEDULE}
      viewAllLabel={CLIENT_SCHEDULE_VIEW_LABEL}
      dataTestId={CLIENT_DASHBOARD_UPCOMING_SCHEDULE_TEST_ID}
      sectionClassName="client-dashboard__section--upcoming"
    />
  );
};

ClientDashboardUpcomingSection.propTypes = {
  schedules: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func
};

export default ClientDashboardUpcomingSection;
