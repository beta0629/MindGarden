import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import StatusBadge from '../../common/StatusBadge';
import { toDisplayString } from '../../../utils/safeDisplay';
import ConsultantDashboardListSection from './ConsultantDashboardListSection';
import {
  CONSULTANT_DASHBOARD_ROUTES,
  CONSULTANT_DASHBOARD_QUERY,
  CONSULTANT_DASHBOARD_SECTION_EMPTY
} from '../../../constants/consultantDashboardConstants';

const URGENT_CLIENT_COLUMNS = [
  { key: 'clientName', label: '내담자' },
  { key: 'lastConsultationLabel', label: '최근 상담일', hideOnMobile: true },
  { key: 'riskLabel', label: '위험도' }
];

const RISK_LABELS = {
  CRITICAL: '위험',
  HIGH: '높음',
  MEDIUM: '보통'
};

const RISK_VARIANTS = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'warning'
};

const formatLastConsultationDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return toDisplayString(dateString, '—');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
};

/**
 * 긴급 확인 필요 내담자 — ListTableView (§3.3)
 */
const UrgentClientsSection = ({
  clients = [],
  loading = false,
  error = '',
  onRetry = null,
  onViewClientDetails,
  className = ''
}) => {
  const rows = useMemo(() => (
    (Array.isArray(clients) ? clients : []).map((client, idx) => ({
      id: client.clientId ?? `urgent-client-${idx}`,
      clientName: client.clientName,
      lastConsultationLabel: formatLastConsultationDate(client.lastConsultationDate),
      riskLevel: client.riskLevel,
      riskLabel: RISK_LABELS[client.riskLevel] || RISK_LABELS.MEDIUM,
      clientId: client.clientId
    }))
  ), [clients]);

  const renderCell = useCallback((columnKey, item) => {
    if (columnKey === 'clientName') {
      return <SafeText tag="span">{toDisplayString(item.clientName, '—')}</SafeText>;
    }
    if (columnKey === 'lastConsultationLabel') {
      return <SafeText tag="span">{toDisplayString(item.lastConsultationLabel, '—')}</SafeText>;
    }
    if (columnKey === 'riskLabel') {
      return (
        <StatusBadge
          status={item.riskLevel}
          variant={RISK_VARIANTS[item.riskLevel] || 'warning'}
        >
          {toDisplayString(item.riskLabel, '—')}
        </StatusBadge>
      );
    }
    return <SafeText tag="span">{toDisplayString(item[columnKey], '—')}</SafeText>;
  }, []);

  return (
    <ConsultantDashboardListSection
      title="긴급 확인 필요 내담자"
      titleIconName="ALERT_CIRCLE"
      columns={URGENT_CLIENT_COLUMNS}
      data={rows}
      renderCell={renderCell}
      onRowClick={(item) => onViewClientDetails(item.clientId)}
      emptyText={CONSULTANT_DASHBOARD_SECTION_EMPTY.URGENT_CLIENTS}
      viewAllHref={`${CONSULTANT_DASHBOARD_ROUTES.CLIENTS}?${CONSULTANT_DASHBOARD_QUERY.CLIENTS_URGENT_FILTER}`}
      viewAllLabel="전체보기"
      viewAllAriaLabel="긴급 내담자 전체보기"
      rowKeyField="id"
      dataTestId="consultant-dashboard-urgent-clients"
      loading={loading}
      error={error}
      onRetry={onRetry}
      className={`mg-v2-urgent-clients-section ${className}`.trim()}
    />
  );
};

UrgentClientsSection.propTypes = {
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      clientId: PropTypes.number.isRequired,
      clientName: PropTypes.string.isRequired,
      sessionNumber: PropTypes.number,
      lastConsultationDate: PropTypes.string.isRequired,
      riskLevel: PropTypes.oneOf(['CRITICAL', 'HIGH', 'MEDIUM']).isRequired,
      mainIssue: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  onViewClientDetails: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default UrgentClientsSection;
