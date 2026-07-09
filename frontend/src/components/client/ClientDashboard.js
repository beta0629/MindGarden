/**
 * 내담자 대시보드 — v1.4 Rebuild (B0KlA · ListTableView · KPI 4-grid)
 * `/client/dashboard` SSOT (AdminCommonLayout + B0KlA, ClientAppShell `/client` 와 분리)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/themes/client-theme.css';
import './ClientDashboard.css';

import {
  CLIENT_DASHBOARD_ARIA_LABEL,
  CLIENT_DASHBOARD_MAIN_ID,
  CLIENT_DASHBOARD_PAGE_TITLE,
  CLIENT_DASHBOARD_TITLE_ID
} from './clientDashboard/constants';
import { useClientSessionBootstrap } from './clientDashboard/useClientSessionBootstrap';
import { useClientDashboardData } from './clientDashboard/useClientDashboardData';
import ClientDashboardWelcomeSection from './clientDashboard/ClientDashboardWelcomeSection';
import ClientDashboardUpcomingSection from './clientDashboard/ClientDashboardUpcomingSection';
import ClientDashboardKpiSection from './clientDashboard/ClientDashboardKpiSection';
import ClientDashboardCoreSection from './clientDashboard/ClientDashboardCoreSection';
import ClientDashboardPaymentSection from './clientDashboard/ClientDashboardPaymentSection';
import ClientDashboardQuickMenuSection from './clientDashboard/ClientDashboardQuickMenuSection';

const ClientDashboard = ({ user: userFromRoute }) => {
  const { user, isLoggedIn, isLoading: sessionLoading, checkSession } = useSession();
  const { sessionUser, sessionIsLoggedIn } = useClientSessionBootstrap(checkSession);

  const currentUser = sessionUser || user || userFromRoute;
  const currentIsLoggedIn = sessionIsLoggedIn || isLoggedIn;

  const {
    consultationData,
    clientStatus,
    sharedClientMappings,
    mappingsLoadFailed,
    unreadMessageCount,
    isLoading,
    sectionError,
    reload
  } = useClientDashboardData(currentUser, sessionLoading, currentIsLoggedIn);

  const primaryActiveMapping = useMemo(() => {
    if (!Array.isArray(sharedClientMappings)) return null;
    return sharedClientMappings.find((x) => x.status === 'ACTIVE') || null;
  }, [sharedClientMappings]);

  const sectionLoading = isLoading || sessionLoading || !currentIsLoggedIn || !currentUser?.id;
  const quickMenuDisabled = sectionLoading || sectionError;

  const renderShell = (body) => (
    <div className="mg-v2-ad-b0kla client-dashboard">
      <div className="mg-v2-ad-b0kla__container client-dashboard__container">
        <ContentArea ariaLabel={CLIENT_DASHBOARD_ARIA_LABEL}>
          <ContentHeader
            title={CLIENT_DASHBOARD_PAGE_TITLE}
            subtitle={null}
            titleId={CLIENT_DASHBOARD_TITLE_ID}
          />
          {body}
        </ContentArea>
      </div>
    </div>
  );

  return (
    <AdminCommonLayout className="mg-v2-client-dashboard-layout">
      {renderShell(
        <main
          id={CLIENT_DASHBOARD_MAIN_ID}
          className="client-dashboard__body dashboard-client"
          aria-labelledby={CLIENT_DASHBOARD_TITLE_ID}
        >
          <ClientDashboardWelcomeSection
            user={currentUser}
            clientStatus={clientStatus}
            primaryActiveMapping={primaryActiveMapping}
          />

          <ClientDashboardKpiSection
            remainingSessions={consultationData.remainingSessions}
            thisMonthScheduleCount={consultationData.thisMonthScheduleCount}
            unreadMessageCount={unreadMessageCount}
            completedCount={consultationData.completedCount}
            loading={sectionLoading}
            error={sectionError}
          />

          <ClientDashboardUpcomingSection
            schedules={consultationData.upcomingSchedules}
            loading={sectionLoading}
            error={sectionError}
            onRetry={reload}
          />

          <ClientDashboardCoreSection
            user={currentUser}
            consultationData={consultationData}
            clientStatus={clientStatus}
            primaryActiveMapping={primaryActiveMapping}
            loading={sectionLoading}
            error={sectionError}
            onRetry={reload}
          />

          <ClientDashboardPaymentSection
            userId={currentUser?.id}
            sharedClientMappings={sharedClientMappings}
            mappingsLoadFailed={mappingsLoadFailed}
          />

          <ClientDashboardQuickMenuSection disabled={quickMenuDisabled} />
        </main>
      )}
    </AdminCommonLayout>
  );
};

export default ClientDashboard;
