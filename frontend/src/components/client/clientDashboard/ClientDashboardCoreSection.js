/**
 * Client Dashboard — 핵심 블록 섹션 (웰니스 + 최근 상담일지 2단 grid)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { ContentSection } from '../../dashboard-v2/content';
import ClientPersonalizedMessages from '../../dashboard/ClientPersonalizedMessages';
import ClientDashboardListSection from './ClientDashboardListSection';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CLIENT_COMPLETED_COLUMNS,
  CLIENT_CORE_COMPLETED_EMPTY_TEXT,
  CLIENT_CORE_COMPLETED_TITLE,
  CLIENT_CORE_SECTION_DESC,
  CLIENT_CORE_SECTION_TITLE,
  CLIENT_CORE_WELLNESS_TITLE,
  CLIENT_DASHBOARD_CORE_SECTION_TEST_ID
} from './constants';
import { buildCompletedRows } from './scheduleUtils';

const ClientDashboardCoreSection = ({
  user,
  consultationData,
  clientStatus,
  loading,
  error,
  onRetry
}) => {
  const completedRows = useMemo(
    () => buildCompletedRows(consultationData?.completedConsultations),
    [consultationData]
  );

  const renderCompletedCell = useCallback(
    (columnKey, item) => <SafeText tag="span">{toDisplayString(item[columnKey], '—')}</SafeText>,
    []
  );

  return (
    <ContentSection
      title={CLIENT_CORE_SECTION_TITLE}
      subtitle={CLIENT_CORE_SECTION_DESC}
      className="client-dashboard__section client-dashboard__section-block client-dashboard__section--core"
      dataTestId={CLIENT_DASHBOARD_CORE_SECTION_TEST_ID}
    >
      <div className="client-dashboard__core-grid">
        <article
          className="mg-v2-card-container client-dashboard__core-card client-dashboard__core-card--wellness"
          aria-labelledby="client-dashboard-core-wellness"
        >
          <header className="client-dashboard__core-card-head">
            <h3 id="client-dashboard-core-wellness" className="client-dashboard__card-title">
              {CLIENT_CORE_WELLNESS_TITLE}
            </h3>
          </header>
          <ClientPersonalizedMessages
            user={user}
            consultationData={consultationData}
            clientStatus={clientStatus}
          />
        </article>

        <article
          className="mg-v2-card-container client-dashboard__core-card client-dashboard__core-card--records"
          aria-labelledby="client-dashboard-core-records"
        >
          <ClientDashboardListSection
            title={(
              <span id="client-dashboard-core-records" className="client-dashboard__card-title">
                {CLIENT_CORE_COMPLETED_TITLE}
              </span>
            )}
            columns={CLIENT_COMPLETED_COLUMNS}
            data={completedRows}
            renderCell={renderCompletedCell}
            emptyText={CLIENT_CORE_COMPLETED_EMPTY_TEXT}
            loading={loading}
            error={error}
            onRetry={onRetry}
            noCard
            sectionClassName="client-dashboard__section--completed"
          />
        </article>
      </div>
    </ContentSection>
  );
};

ClientDashboardCoreSection.propTypes = {
  user: PropTypes.object,
  consultationData: PropTypes.object,
  clientStatus: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func
};

export default ClientDashboardCoreSection;
