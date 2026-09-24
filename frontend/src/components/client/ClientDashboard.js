/**
 * 내담자 대시보드 — Clinic-OS v4 「상담실 로비」 under ClientWebPageShell
 * `/client/dashboard` · ONE suite skeleton · slots: hero(+strip) · session/pay glance
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React, { useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { MAPPING_STATUS, selectPrimaryAssignedMapping } from '../../constants/mapping';
import {
  CLIENT_DASHBOARD_ARIA_LABEL,
  CLIENT_DASHBOARD_MAIN_ID,
  CLIENT_LOBBY_FOOTER,
  CLIENT_LOBBY_LOAD_ERROR,
  CLIENT_LOBBY_RETRY,
  CLIENT_LOBBY_TEST_ID
} from './clientDashboard/constants';
import { useClientSessionBootstrap } from './clientDashboard/useClientSessionBootstrap';
import { useClientDashboardData } from './clientDashboard/useClientDashboardData';
import ClientLobbyPhotoStrip from './clientDashboard/ClientLobbyPhotoStrip';
import ClientLobbyGreeting from './clientDashboard/ClientLobbyGreeting';
import ClientLobbyHero from './clientDashboard/ClientLobbyHero';
import ClientLobbyStatusLine from './clientDashboard/ClientLobbyStatusLine';
import ClientLobbyUpcomingPanel from './clientDashboard/ClientLobbyUpcomingPanel';
import ClientLobbyBalancePanel from './clientDashboard/ClientLobbyBalancePanel';
import ClientWebPageShell from './ClientWebPageShell';
import {
  buildGreetingWhenLine,
  buildLobbyUpcomingList,
  buildSessionChipAndBalance,
  formatLobbyTodayEyebrow,
  hasAssignedConsultant,
  resolveHeroPriority,
  resolvePaymentStatusSummary
} from './clientDashboard/lobbyViewModel';
import './clientDashboard/ClientLobby.css';

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

  const upcomingItems = useMemo(
    () => buildLobbyUpcomingList(consultationData?.upcomingSchedules),
    [consultationData?.upcomingSchedules]
  );

  const eyebrow = useMemo(() => formatLobbyTodayEyebrow(), []);
  const whenLine = useMemo(
    () => buildGreetingWhenLine({ nextSchedule }),
    [nextSchedule]
  );

  const userName = currentUser?.name;

  const mainSlot = (
    <main
      id={CLIENT_DASHBOARD_MAIN_ID}
      aria-label={CLIENT_DASHBOARD_ARIA_LABEL}
    >
      <ClientLobbyGreeting
        userName={userName}
        eyebrow={eyebrow}
        whenLine={whenLine}
      />

      {sectionLoading ? (
        <p className="client-lobby__loading" role="status">불러오는 중…</p>
      ) : null}

      {!sectionLoading && sectionError ? (
        <div className="client-lobby__error" role="alert">
          <p>{CLIENT_LOBBY_LOAD_ERROR}</p>
          <button
            type="button"
            className="client-lobby__btn-ghost client-lobby__error-retry"
            onClick={reload}
          >
            {CLIENT_LOBBY_RETRY}
          </button>
        </div>
      ) : null}

      {!sectionLoading && !sectionError ? (
        <>
          <ClientLobbyHero priority={heroPriority} nextSchedule={nextSchedule} />
          <ClientLobbyStatusLine
            remainingSessions={remainingSessions}
            chips={sessionMeta.chips}
            paymentSummary={paymentSummary}
          />
          <ClientLobbyUpcomingPanel items={upcomingItems} />
        </>
      ) : null}

      <p className="client-lobby__shell-foot">{CLIENT_LOBBY_FOOTER}</p>
    </main>
  );

  const asideSlot = !sectionLoading && !sectionError ? (
    <ClientLobbyBalancePanel
      remainingSessions={remainingSessions}
      rows={sessionMeta.rows}
    />
  ) : null;

  return (
    <ClientWebPageShell
      activeNavId="home"
      className="client-lobby"
      testId={CLIENT_LOBBY_TEST_ID}
      beforeStage={<ClientLobbyPhotoStrip />}
      main={mainSlot}
      aside={asideSlot}
    />
  );
};

export default ClientDashboard;
