/**
 * Client Dashboard — 결제 요약 섹션 (ListTableView)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import SafeText from '../../common/SafeText';
import ClientDashboardListSection from './ClientDashboardListSection';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CLIENT_DASHBOARD_PAYMENT_SECTION_TEST_ID,
  CLIENT_PAYMENT_COLUMNS,
  CLIENT_PAYMENT_EMPTY_TEXT,
  CLIENT_PAYMENT_SECTION_DESC,
  CLIENT_PAYMENT_SECTION_TITLE
} from './constants';

const ClientDashboardPaymentSection = ({ recentPayments, loading, error, onRetry }) => {
  const navigate = useNavigate();
  const goPaymentHistory = useCallback(
    () => navigate(CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY),
    [navigate]
  );

  const renderCell = useCallback((columnKey, item) => {
    if (columnKey === 'statusLabel') {
      return (
        <span className="mg-v2-status-badge mg-v2-badge--neutral">
          <SafeText tag="span">{toDisplayString(item[columnKey], '—')}</SafeText>
        </span>
      );
    }
    return <SafeText tag="span">{toDisplayString(item[columnKey], '—')}</SafeText>;
  }, []);

  return (
    <ClientDashboardListSection
      title={CLIENT_PAYMENT_SECTION_TITLE}
      subtitle={CLIENT_PAYMENT_SECTION_DESC}
      columns={CLIENT_PAYMENT_COLUMNS}
      data={recentPayments}
      renderCell={renderCell}
      onRowClick={goPaymentHistory}
      emptyText={CLIENT_PAYMENT_EMPTY_TEXT}
      loading={loading}
      error={error}
      onRetry={onRetry}
      viewAllHref={CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY}
      viewAllLabel="결제 내역"
      dataTestId={CLIENT_DASHBOARD_PAYMENT_SECTION_TEST_ID}
      sectionClassName="client-dashboard__section--payment"
    />
  );
};

ClientDashboardPaymentSection.propTypes = {
  recentPayments: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func
};

export default ClientDashboardPaymentSection;
