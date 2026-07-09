/**
 * 긴급 확인 필요 내담자 섹션 — ListTableView (v2.1 · ProfileCard 오용 금지)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ListTableView } from '../../common';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import StatusBadge from '../../common/StatusBadge';
import Icon from '../../ui/Icon/Icon';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import { ContentSection } from '../content';
import {
  CONSULTANT_DASHBOARD_LIST_MAX_ROWS,
  CONSULTANT_DASHBOARD_LIST_SKELETON_ROWS,
  CONSULTANT_DASHBOARD_LIST_LOADING_LABEL,
  CONSULTANT_DASHBOARD_LIST_ERROR_LABEL,
  CONSULTANT_DASHBOARD_LIST_RETRY_LABEL,
  CONSULTANT_DASHBOARD_URGENT_SECTION_TITLE,
  CONSULTANT_DASHBOARD_VIEW_ALL_URGENT_CLIENTS_LABEL,
  CONSULTANT_DASHBOARD_URGENT_SECTION_TEST_ID,
  CONSULTANT_URGENT_CLIENT_COLUMNS,
  CONSULTANT_URGENT_CLIENT_RISK_LABELS,
  CONSULTANT_URGENT_CLIENT_RISK_VARIANTS
} from '../../../constants/consultantDashboardConstants';
import './UrgentClientsSection.css';
import './ConsultantDashboardListSection.css';

const formatUrgentClientDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
};

const UrgentListSkeleton = () => (
  <div
    className="consultant-dashboard-list-section__skeleton"
    aria-busy="true"
    aria-live="polite"
    data-testid="consultant-dashboard-urgent-skeleton"
  >
    {Array.from({ length: CONSULTANT_DASHBOARD_LIST_SKELETON_ROWS }).map((_, rowIdx) => (
      <div
        key={`urgent-skeleton-row-${rowIdx}`}
        className="consultant-dashboard-list-section__skeleton-row"
      >
        {Array.from({ length: 5 }).map((__, colIdx) => (
          <div
            key={`urgent-skeleton-cell-${rowIdx}-${colIdx}`}
            className="consultant-dashboard-list-section__skeleton-cell"
          />
        ))}
      </div>
    ))}
    <span className="sr-only">{CONSULTANT_DASHBOARD_LIST_LOADING_LABEL}</span>
  </div>
);

const UrgentClientsSection = ({
  clients = [],
  loading = false,
  error = '',
  onRetry = null,
  onViewAllClients,
  onViewClientDetails,
  className = ''
}) => {
  const displayClients = useMemo(
    () => (Array.isArray(clients) ? clients.slice(0, CONSULTANT_DASHBOARD_LIST_MAX_ROWS) : []),
    [clients]
  );

  const tableRows = useMemo(() => (
    displayClients.map((client) => ({
      id: client.clientId,
      clientId: client.clientId,
      clientName: client.clientName,
      sessionLabel: `${client.sessionNumber}회기`,
      lastDateLabel: formatUrgentClientDate(client.lastConsultationDate),
      riskLevel: client.riskLevel,
      riskLabel: CONSULTANT_URGENT_CLIENT_RISK_LABELS[client.riskLevel]
        || CONSULTANT_URGENT_CLIENT_RISK_LABELS.MEDIUM,
      mainIssue: client.mainIssue
    }))
  ), [displayClients]);

  const renderCell = useCallback((columnKey, item) => {
    if (columnKey === 'riskLabel') {
      const variant = CONSULTANT_URGENT_CLIENT_RISK_VARIANTS[item.riskLevel]
        || CONSULTANT_URGENT_CLIENT_RISK_VARIANTS.MEDIUM;
      return (
        <StatusBadge variant={variant}>
          <SafeText tag="span">{toDisplayString(item.riskLabel, '—')}</SafeText>
        </StatusBadge>
      );
    }
    return <SafeText tag="span">{toDisplayString(item[columnKey], '—')}</SafeText>;
  }, []);

  if (!loading && !error && displayClients.length === 0) {
    return null;
  }

  const titleNode = (
    <span className="urgent-clients-section__title">
      <Icon name="ALERT_CIRCLE" size="MD" color="TRANSPARENT" aria-hidden />
      <SafeText tag="span">{CONSULTANT_DASHBOARD_URGENT_SECTION_TITLE}</SafeText>
    </span>
  );

  const renderBody = () => {
    if (loading) {
      return <UrgentListSkeleton />;
    }

    if (error) {
      return (
        <div className="consultant-dashboard-list-section__error-block" role="alert">
          <p className="consultant-dashboard-list-section__error">
            <SafeText tag="span">{error || CONSULTANT_DASHBOARD_LIST_ERROR_LABEL}</SafeText>
          </p>
          {typeof onRetry === 'function' ? (
            <MGButton
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: 'mg-v2-btn mg-v2-btn-outline mg-v2-btn-sm consultant-dashboard-list-section__retry'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onRetry}
              preventDoubleClick={false}
              aria-label={CONSULTANT_DASHBOARD_LIST_RETRY_LABEL}
            >
              <Icon name="REFRESH" size="SM" color="TRANSPARENT" aria-hidden />
              <SafeText tag="span">{CONSULTANT_DASHBOARD_LIST_RETRY_LABEL}</SafeText>
            </MGButton>
          ) : null}
        </div>
      );
    }

    return (
      <ListTableView
        columns={CONSULTANT_URGENT_CLIENT_COLUMNS}
        data={tableRows}
        renderCell={renderCell}
        onRowClick={(item) => onViewClientDetails(item.clientId)}
        className="consultant-dashboard-list-section__table mg-v2-ad-b0kla__data-table--comfortable"
        rowKeyField="id"
      />
    );
  };

  return (
    <ContentSection
      title={titleNode}
      actions={
        !loading && !error ? (
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onViewAllClients}
            preventDoubleClick={false}
            aria-label={CONSULTANT_DASHBOARD_VIEW_ALL_URGENT_CLIENTS_LABEL}
          >
            <SafeText tag="span">{CONSULTANT_DASHBOARD_VIEW_ALL_URGENT_CLIENTS_LABEL}</SafeText>
          </MGButton>
        ) : null
      }
      className={`mg-v2-urgent-clients-section ${className}`.trim()}
      dataTestId={CONSULTANT_DASHBOARD_URGENT_SECTION_TEST_ID}
    >
      {renderBody()}
    </ContentSection>
  );
};

UrgentClientsSection.propTypes = {
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      clientId: PropTypes.number.isRequired,
      clientName: PropTypes.string.isRequired,
      sessionNumber: PropTypes.number.isRequired,
      lastConsultationDate: PropTypes.string.isRequired,
      riskLevel: PropTypes.oneOf(['CRITICAL', 'HIGH', 'MEDIUM']).isRequired,
      mainIssue: PropTypes.string.isRequired
    })
  ).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  onViewAllClients: PropTypes.func.isRequired,
  onViewClientDetails: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default UrgentClientsSection;
