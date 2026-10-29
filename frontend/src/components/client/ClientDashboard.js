/**
 * 내담자 대시보드 — Clinic-OS 커버+챕터 홈 (`/client/dashboard`)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React, { useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { MAPPING_STATUS, selectPrimaryAssignedMapping } from '../../constants/mapping';
import { useClientSessionBootstrap } from './clientDashboard/useClientSessionBootstrap';
import { useClientDashboardData } from './clientDashboard/useClientDashboardData';
import {
  buildSessionChipAndBalance,
  hasAssignedConsultant,
  resolveHeroPriority,
  resolvePaymentStatusSummary
} from './clientDashboard/lobbyViewModel';
import ClientCoverChapterHome from './clientDashboard/coverChapter/ClientCoverChapterHome';

const ClientDashboard = ({ user: userFromRoute }) => {
  const {
    user,
    isLoggedIn,
    isLoading: sessionLoading,
    checkSession
  } = useSession();
  const { sessionUser, sessionIsLoggedIn } = useClientSessionBootstrap(checkSession);

  const currentUser = sessionUser || user || userFromRoute;
  const currentIsLoggedIn = sessionIsLoggedIn || isLoggedIn;

  const {
    consultationData,
    clientStatus,
    sharedClientMappings,
    isLoading,
    sectionError,
    reload
  } = useClientDashboardData(currentUser, sessionLoading, currentIsLoggedIn);

  const primaryActiveMapping = useMemo(
    () => selectPrimaryAssignedMapping(sharedClientMappings),
    [sharedClientMappings]
  );

  const sectionLoading = isLoading || sessionLoading || !currentIsLoggedIn || !currentUser?.id;

  const nextSchedule = consultationData?.upcomingSchedules?.[0] || null;
  const remainingSessions = consultationData?.remainingSessions ?? 0;

  const assigned = useMemo(
    () => hasAssignedConsultant(primaryActiveMapping, clientStatus),
    [primaryActiveMapping, clientStatus]
  );

  const hasPendingPayment = useMemo(
    () => clientStatus?.mappingStatus === MAPPING_STATUS.PENDING_PAYMENT
      || clientStatus?.paymentStatus === 'PENDING'
      || (Array.isArray(sharedClientMappings)
        && sharedClientMappings.some((m) => m?.status === MAPPING_STATUS.PENDING_PAYMENT)),
    [clientStatus, sharedClientMappings]
  );

  const heroPriority = useMemo(
    () => resolveHeroPriority({
      nextSchedule,
      remainingSessions,
      hasAssignedConsultant: assigned,
      hasPendingPayment
    }),
    [nextSchedule, remainingSessions, assigned, hasPendingPayment]
  );

  const sessionMeta = useMemo(
    () => buildSessionChipAndBalance(sharedClientMappings),
    [sharedClientMappings]
  );

  const paymentSummary = useMemo(
    () => resolvePaymentStatusSummary(sharedClientMappings),
    [sharedClientMappings]
  );

  return (
    <ClientCoverChapterHome
      user={currentUser}
      heroPriority={heroPriority}
      nextSchedule={nextSchedule}
      remainingSessions={remainingSessions}
      sessionMeta={sessionMeta}
      paymentSummary={paymentSummary}
      mappings={sharedClientMappings}
      consultationData={consultationData}
      isLoading={sectionLoading}
      hasError={Boolean(sectionError)}
      onRetry={reload}
    />
  );
};

export default ClientDashboard;
