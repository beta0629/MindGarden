/**
 * 내담자 커뮤니티 — v4 로비 크롬 셸
 * `/client/community` · ClientAppShell(`/client/more`) 밖 · ClientDashboard 톤 유지
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Outlet, Navigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSession } from '../../contexts/SessionContext';
import { useBranding } from '../../hooks/useBranding';
import ConfirmModal from '../common/ConfirmModal';
import { CLIENT_DASHBOARD_ROUTES } from '../../constants/clientDashboardRoutes';
import {
  CLIENT_COMMUNITY_ARIA_LABEL,
  CLIENT_COMMUNITY_MAIN_ID,
  CLIENT_COMMUNITY_TEST_ID,
  CLIENT_LOBBY_FOOTER,
  CLIENT_LOBBY_LOGOUT,
  CLIENT_LOBBY_LOGOUT_CANCEL,
  CLIENT_LOBBY_LOGOUT_CONFIRM
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
  const { user, logout } = useSession();
  const { brandingInfo } = useBranding({ autoLoad: Boolean(user) });
  const { brandWord, brandCenter } = useMemo(
    () => resolveLobbyBrandLabels(user, brandingInfo),
    [user, brandingInfo]
  );
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const handleLogoutConfirm = useCallback(async() => {
    // sessionManager.logout()가 로그인 리다이렉트를 처리함 — navigate 금지
    await logout();
  }, [logout]);

  const handleLogoutModalClose = useCallback(() => {
    setShowLogoutModal(false);
  }, []);

  return (
    <div className="client-lobby" data-testid={CLIENT_COMMUNITY_TEST_ID}>
      <div className="client-lobby__shell">
        <ClientLobbyTopChrome
          userName={user?.name}
          activeNavId="community"
          brandWord={brandWord}
          brandCenter={brandCenter}
          onLogout={handleLogoutClick}
          logoutLabel={CLIENT_LOBBY_LOGOUT}
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
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={handleLogoutModalClose}
        onConfirm={handleLogoutConfirm}
        title={CLIENT_LOBBY_LOGOUT}
        message={CLIENT_LOBBY_LOGOUT_CONFIRM}
        confirmText={CLIENT_LOBBY_LOGOUT}
        cancelText={CLIENT_LOBBY_LOGOUT_CANCEL}
        type="danger"
      />
    </div>
  );
};

ClientCommunityPage.propTypes = {
  children: PropTypes.node
};

export default ClientCommunityPage;
