/**
 * Client Dashboard — 핵심 블록 섹션
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import MGButton from '../../common/MGButton';
import { ContentSection } from '../../dashboard-v2/content';
import ClientPersonalizedMessages from '../../dashboard/ClientPersonalizedMessages';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CLIENT_CORE_ACTIVE_TITLE,
  CLIENT_CORE_RECORDS_BODY,
  CLIENT_CORE_RECORDS_TITLE,
  CLIENT_CORE_SECTION_DESC,
  CLIENT_CORE_SECTION_TITLE
} from './constants';

const outlineBtnClass = buildErpMgButtonClassName({ variant: 'outline', loading: false });

const ClientDashboardCoreSection = ({
  user,
  consultationData,
  clientStatus,
  primaryActiveMapping,
  onNavigateSessions,
  onNavigateMessages
}) => {
  const { t } = useTranslation();

  const coreConsultationSummary = useMemo(() => {
    const ms = clientStatus?.mappingStatus;
    if (ms === 'PENDING') {
      return t('common:client.ClientDashboard.t_d7f3f1d4');
    }
    if (primaryActiveMapping) {
      return t('common:client.ClientDashboard.t_d23413ca');
    }
    return t('common:client.ClientDashboard.t_6d8a0e47');
  }, [clientStatus, primaryActiveMapping, t]);

  const isActive = clientStatus?.mappingStatus === 'ACTIVE';

  return (
    <ContentSection
      title={CLIENT_CORE_SECTION_TITLE}
      subtitle={CLIENT_CORE_SECTION_DESC}
      className="client-dashboard__section client-dashboard__section--core"
      noCard
    >
      <ul className="client-dashboard__core-grid">
        <li>
          <article
            className="mg-v2-card-container client-dashboard__core-card"
            aria-labelledby="client-dashboard-core-active"
          >
            <header className="client-dashboard__core-card-head">
              <h3 id="client-dashboard-core-active" className="client-dashboard__card-title">
                {CLIENT_CORE_ACTIVE_TITLE}
              </h3>
              <span
                className={
                  isActive
                    ? 'mg-v2-status-badge mg-v2-badge--success'
                    : 'mg-v2-status-badge mg-v2-badge--neutral'
                }
              >
                {isActive ? t('common.labels.active') : t('common.labels.pending')}
              </span>
            </header>
            <p className="client-dashboard__card-text">{coreConsultationSummary}</p>
            {primaryActiveMapping?.consultantName ? (
              <p className="client-dashboard__card-subtext">
                {toDisplayString(primaryActiveMapping.consultantName, '')}
                {' · '}
                {toDisplayString(primaryActiveMapping.packageName, t('common:client.ClientDashboard.t_17cef764'))}
              </p>
            ) : null}
            <div className="mg-v2-card-actions client-dashboard__card-actions">
              <MGButton
                variant="outline"
                className={outlineBtnClass}
                onClick={onNavigateSessions}
                preventDoubleClick={false}
              >
                상세
              </MGButton>
            </div>
          </article>
        </li>
        <li>
          <article
            className="mg-v2-card-container client-dashboard__core-card"
            aria-labelledby="client-dashboard-core-records"
          >
            <header className="client-dashboard__core-card-head">
              <h3 id="client-dashboard-core-records" className="client-dashboard__card-title">
                {CLIENT_CORE_RECORDS_TITLE}
              </h3>
            </header>
            <p className="client-dashboard__card-text">{CLIENT_CORE_RECORDS_BODY}</p>
            <div className="mg-v2-card-actions client-dashboard__card-actions">
              <MGButton
                variant="outline"
                className={outlineBtnClass}
                onClick={onNavigateMessages}
                preventDoubleClick={false}
              >
                목록
              </MGButton>
            </div>
          </article>
        </li>
      </ul>

      <div className="client-dashboard__personalized">
        <ClientPersonalizedMessages
          user={user}
          consultationData={consultationData}
          clientStatus={clientStatus}
        />
      </div>
    </ContentSection>
  );
};

ClientDashboardCoreSection.propTypes = {
  user: PropTypes.object,
  consultationData: PropTypes.object,
  clientStatus: PropTypes.object,
  primaryActiveMapping: PropTypes.object,
  onNavigateSessions: PropTypes.func.isRequired,
  onNavigateMessages: PropTypes.func.isRequired
};

export default ClientDashboardCoreSection;
