/**
 * Client Dashboard — 결제 요약 섹션
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ContentSection } from '../../dashboard-v2/content';
import ClientPaymentSessionsSection from '../../dashboard/ClientPaymentSessionsSection';
import {
  CLIENT_PAYMENT_SECTION_DESC,
  CLIENT_PAYMENT_SECTION_TITLE
} from './constants';

const ClientDashboardPaymentSection = ({
  userId,
  sharedClientMappings,
  mappingsLoadFailed
}) => (
  <ContentSection
    title={CLIENT_PAYMENT_SECTION_TITLE}
    subtitle={CLIENT_PAYMENT_SECTION_DESC}
    className="client-dashboard__section client-dashboard__section--payment"
    noCard
  >
    <div className="client-dashboard__payment-wrap">
      <ClientPaymentSessionsSection
        userId={userId}
        supplyMappingsFromParent
        parentMappings={sharedClientMappings}
        parentMappingsFetchFailed={mappingsLoadFailed}
      />
    </div>
  </ContentSection>
);

ClientDashboardPaymentSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sharedClientMappings: PropTypes.array,
  mappingsLoadFailed: PropTypes.bool
};

export default ClientDashboardPaymentSection;
