/**
 * Client Dashboard — 핵심 블록 섹션 (ListTableView · v1.4)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SafeText from '../../common/SafeText';
import ClientPersonalizedMessages from '../../dashboard/ClientPersonalizedMessages';
import { CLIENT_DASHBOARD_KPI_ROUTES } from '../../../constants/clientDashboardRoutes';
import ClientDashboardListSection from './ClientDashboardListSection';
import { toDisplayString } from '../../../utils/safeDisplay';
import { renderCompactPackageName } from '../../../utils/packagePricing';
import {
  CLIENT_CORE_ACTIVE_TITLE,
  CLIENT_CORE_RECORDS_BODY,
  CLIENT_CORE_RECORDS_TITLE,
  CLIENT_CORE_SECTION_DESC,
  CLIENT_CORE_SECTION_TITLE,
  CLIENT_DASHBOARD_CORE_COLUMNS,
  CLIENT_DASHBOARD_LIST_ERROR_LABEL,
  CLIENT_SCHEDULE_LOAD_ERROR_LABEL
} from './constants';

const ClientDashboardCoreSection = ({
  user,
  consultationData,
  clientStatus,
  primaryActiveMapping,
  loading = false,
  error = false,
  onRetry = null
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const coreConsultationSummary = useMemo(() => {
    const ms = clientStatus?.mappingStatus;
    if (ms === 'PENDING') {
      return t('common:client.ClientDashboard.t_d7f3f1d4');
    }
    if (primaryActiveMapping) {
      const namePart = toDisplayString(primaryActiveMapping.consultantName, '');
      const pkg = primaryActiveMapping.packageName 
        ? renderCompactPackageName(primaryActiveMapping.packageName) 
        : t('common:client.ClientDashboard.t_17cef764');
      const rem = toDisplayString(primaryActiveMapping.remainingSessions, '0');
      
      // t_d23413ca: "{{namePart}} 상담사님과의 {{pkg}} 상담이 {{rem}}회 남았습니다."
      // pkg가 React Node일 수 있으므로 안전하게 렌더링하기 위해 분리해서 반환
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
          <span>{namePart} 상담사님과의</span>
          {pkg}
          <span>상담이 {rem}회 남았습니다.</span>
        </span>
      );
    }
    return t('common:client.ClientDashboard.t_6d8a0e47');
  }, [clientStatus, primaryActiveMapping, t]);

  const isActive = clientStatus?.mappingStatus === 'ACTIVE';

  const tableData = useMemo(() => [
    {
      id: 'core-active',
      titleLabel: CLIENT_CORE_ACTIVE_TITLE,
      summaryLabel: coreConsultationSummary,
      statusLabel: isActive ? t('common.labels.active') : t('common.labels.pending'),
      route: CLIENT_DASHBOARD_KPI_ROUTES.REMAINING_SESSIONS
    },
    {
      id: 'core-records',
      titleLabel: CLIENT_CORE_RECORDS_TITLE,
      summaryLabel: CLIENT_CORE_RECORDS_BODY,
      statusLabel: '—',
      route: CLIENT_DASHBOARD_KPI_ROUTES.UNREAD_MESSAGES
    }
  ], [coreConsultationSummary, isActive, t]);

  const handleRowClick = (item) => {
    if (item?.route) {
      navigate(item.route);
    }
  };

  return (
    <>
      <ClientDashboardListSection
        title={CLIENT_CORE_SECTION_TITLE}
        subtitle={CLIENT_CORE_SECTION_DESC}
        accentVariant="secondary"
        columns={CLIENT_DASHBOARD_CORE_COLUMNS}
        data={tableData}
        renderCell={(columnKey, item) => {
          const val = item[columnKey];
          return React.isValidElement(val) ? val : <SafeText tag="span">{val}</SafeText>;
        }}
        onRowClick={handleRowClick}
        emptyText={CLIENT_DASHBOARD_LIST_ERROR_LABEL}
        dataTestId="client-dashboard-core-section"
        className="client-dashboard__section client-dashboard__section--core"
        loading={loading}
        error={error ? CLIENT_SCHEDULE_LOAD_ERROR_LABEL : ''}
        onRetry={onRetry}
      />

      {!loading && !error ? (
        <div className="client-dashboard__personalized">
          <ClientPersonalizedMessages
            user={user}
            consultationData={consultationData}
            clientStatus={clientStatus}
          />
        </div>
      ) : null}
    </>
  );
};

ClientDashboardCoreSection.propTypes = {
  user: PropTypes.object,
  consultationData: PropTypes.object,
  clientStatus: PropTypes.object,
  primaryActiveMapping: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  onRetry: PropTypes.func
};

export default ClientDashboardCoreSection;
