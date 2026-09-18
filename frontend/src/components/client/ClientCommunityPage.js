/**
 * 내담자 커뮤니티 — v4 ClientWebTopChrome 셸
 * `/client/community` · ClientAppShell(`/client/more`) 밖 · LNB/sidebar 없음
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React, { useMemo } from 'react';
import { Outlet, Navigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSession } from '../../contexts/SessionContext';
import { useBranding } from '../../hooks/useBranding';
import { useClientWebLogoutConfirm } from '../../hooks/useClientWebLogoutConfirm';
import ConfirmModal from '../common/ConfirmModal';
import { CLIENT_DASHBOARD_ROUTES } from '../../constants/clientDashboardRoutes';
import {
  CLIENT_COMMUNITY_ARIA_LABEL,
  CLIENT_COMMUNITY_MAIN_ID,
  CLIENT_COMMUNITY_TEST_ID,
  CLIENT_LOBBY_FOOTER
} from './clientDashboard/constants';
import ClientLobbyTopChrome from './clientDashboard/ClientLobbyTopChrome';
import { resolveLobbyBrandLabels } from './clientDashboard/lobbyViewModel';
import './clientDashboard/ClientLobby.css';

/**
 * `/client/more/community/:postId` → `/client/community/:postId` 리다이렉트
 * @returns {JSX.Element}
 */
export const ClientCommunityMorePostRedirect = () => {
  const { postId } = useParams();
  const target = postId
    ? `${CLIENT_DASHBOARD_ROUTES.COMMUNITY}/${postId}`
    : CLIENT_DASHBOARD_ROUTES.COMMUNITY;
  return <Navigate to={target} replace />;
};

/**
 * @param {object} props
 * @param {React.ReactNode} [props.children] - Outlet 대신 직접 자식 전달 시
 */
const ClientCommunityPage = ({ children }) => {
  const { user } = useSession();
  const { brandingInfo } = useBranding({ autoLoad: Boolean(user) });
  const { brandWord, brandCenter } = useMemo(
    () => resolveLobbyBrandLabels(user, brandingInfo),
    [user, brandingInfo]
  );
  const {
    logoutLabel,
    openConfirm,
    confirmProps
  } = useClientWebLogoutConfirm();

  return (
    <div className="client-lobby" data-testid={CLIENT_COMMUNITY_TEST_ID}>
      <div className="client-lobby__shell">
        <ClientLobbyTopChrome
          userName={user?.name}
          activeNavId=""
          brandWord={brandWord}
          brandCenter={brandCenter}
          onLogout={openConfirm}
          logoutLabel={logoutLabel}
        />
        <main
          id={CLIENT_COMMUNITY_MAIN_ID}
          className="client-lobby__stage"
          aria-label={CLIENT_COMMUNITY_ARIA_LABEL}
        >
          {children != null ? children : <Outlet />}
          <p className="client-lobby__shell-foot">{CLIENT_LOBBY_FOOTER}</p>
        </main>
      </div>
      <ConfirmModal {...confirmProps} />
    </div>
  );
};

ClientCommunityPage.propTypes = {
  children: PropTypes.node
};

export default ClientCommunityPage;
