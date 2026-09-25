/**
 * 내담자 커뮤니티 — ClientWebPageShell suite DNA
 * `/client/community` · #1107 keep · no CLT_COMMUNITY gate · no LNB
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import { Outlet, Navigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CLIENT_DASHBOARD_ROUTES } from '../../constants/clientDashboardRoutes';
import {
  CLIENT_COMMUNITY_ARIA_LABEL,
  CLIENT_COMMUNITY_MAIN_ID,
  CLIENT_COMMUNITY_TEST_ID,
  CLIENT_LOBBY_FOOTER
} from './clientDashboard/constants';
import {
  CLIENT_WEB_SUITE_COPY
} from '../../constants/clientWebSuiteConstants';
import ClientWebPageShell from './ClientWebPageShell';
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
const ClientCommunityPage = ({ children }) => (
  <ClientWebPageShell
    className="client-lobby"
    testId={CLIENT_COMMUNITY_TEST_ID}
    title={CLIENT_WEB_SUITE_COPY.COMMUNITY_TITLE}
    main={(
      <main
        id={CLIENT_COMMUNITY_MAIN_ID}
        aria-label={CLIENT_COMMUNITY_ARIA_LABEL}
      >
        {children != null ? children : <Outlet />}
        <p className="client-lobby__shell-foot">{CLIENT_LOBBY_FOOTER}</p>
      </main>
    )}
  />
);

ClientCommunityPage.propTypes = {
  children: PropTypes.node
};

export default ClientCommunityPage;
