/**
 * Client Dashboard — 환영 카드 섹션
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from '../../common/SafeText';
import { ContentSection } from '../../dashboard-v2/content';
import {
  MAPPING_STATUS,
  MAPPING_STATUS_LABELS,
  isAssignedMappingStatus,
  resolveMappingConsultantDisplayName
} from '../../../constants/mapping';
import { CLIENT_EYEBROW_TEXT, CLIENT_WELCOME_LEDE } from './constants';
import { getGreetingPrefix } from './scheduleUtils';

const ClientDashboardWelcomeSection = ({ user, clientStatus, primaryActiveMapping }) => {
  const { t } = useTranslation();

  const consultantDisplayName = useMemo(
    () => resolveMappingConsultantDisplayName(primaryActiveMapping),
    [primaryActiveMapping]
  );

  const welcomeMetaBadges = useMemo(() => {
    const ms = clientStatus?.mappingStatus;
    const badges = [];
    if (ms === MAPPING_STATUS.PENDING_PAYMENT) {
      badges.push({
        key: 'pending-payment',
        className: 'mg-v2-status-badge mg-v2-badge--warning',
        label: MAPPING_STATUS_LABELS[MAPPING_STATUS.PENDING_PAYMENT]
      });
    } else if (ms === MAPPING_STATUS.PAYMENT_CONFIRMED) {
      badges.push({
        key: 'payment-confirmed',
        className: 'mg-v2-status-badge mg-v2-badge--info',
        label: MAPPING_STATUS_LABELS[MAPPING_STATUS.PAYMENT_CONFIRMED]
      });
    } else if (ms === MAPPING_STATUS.ACTIVE) {
      badges.push({
        key: 'active',
        className: 'mg-v2-status-badge mg-v2-badge--success',
        label: t('common:client.ClientDashboard.t_07de2f32')
      });
    }
    if (
      clientStatus?.paymentStatus === 'PENDING'
      && ms !== MAPPING_STATUS.PENDING_PAYMENT
    ) {
      badges.push({
        key: 'pay',
        className: 'mg-v2-status-badge mg-v2-badge--warning',
        label: t('common:client.ClientDashboard.t_db16bb78')
      });
    }
    return badges;
  }, [clientStatus, t]);

  const isAssigned = isAssignedMappingStatus(clientStatus?.mappingStatus)
    || Boolean(consultantDisplayName);

  return (
    <ContentSection noCard className="client-dashboard__section client-dashboard__section--welcome">
      <article
        className="client-dashboard__welcome-card mg-v2-card-container"
        aria-labelledby="client-dashboard-welcome-heading"
        aria-describedby="client-dashboard-welcome-lede"
      >
        <div className="client-dashboard__welcome-inner">
          <p className="client-dashboard__eyebrow">{CLIENT_EYEBROW_TEXT}</p>
          <h2 id="client-dashboard-welcome-heading" className="client-dashboard__welcome-title">
            {getGreetingPrefix(t)},{' '}
            <SafeText>{user?.name}</SafeText>
            {' '}님
          </h2>
          <p id="client-dashboard-welcome-lede" className="client-dashboard__welcome-lede">
            {CLIENT_WELCOME_LEDE}
          </p>
          <div className="client-dashboard__welcome-meta" role="status" aria-live="polite">
            {welcomeMetaBadges.length > 0 ? (
              <ul className="client-dashboard__meta-chip-list" aria-label="상담 상태">
                {welcomeMetaBadges.map((badge) => (
                  <li key={badge.key}>
                    <span className={badge.className}>{badge.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <span className="client-dashboard__meta-text">
              {isAssigned && consultantDisplayName ? (
                <>
                  담당 상담사 · <SafeText>{consultantDisplayName}</SafeText>
                </>
              ) : (
                t('common:client.ClientDashboard.t_e85b3406')
              )}
            </span>
          </div>
        </div>
      </article>
    </ContentSection>
  );
};

ClientDashboardWelcomeSection.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string
  }),
  clientStatus: PropTypes.shape({
    mappingStatus: PropTypes.string,
    paymentStatus: PropTypes.string
  }),
  primaryActiveMapping: PropTypes.shape({
    consultantName: PropTypes.string,
    consultant: PropTypes.shape({
      consultantName: PropTypes.string,
      name: PropTypes.string
    })
  })
};

export default ClientDashboardWelcomeSection;
