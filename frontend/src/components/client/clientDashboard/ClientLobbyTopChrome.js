/**
 * Client Lobby — 상단 editorial 크롬 (shared ClientWebTopChrome 조합)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import { CLIENT_WEB_LOGOUT } from '../../../constants/clientWebChromeConstants';
import ClientWebTopChrome from '../ClientWebTopChrome';
import { CLIENT_LOBBY_NAV } from './constants';

const ROUTE_MAP = {
  DASHBOARD: CLIENT_DASHBOARD_ROUTES.DASHBOARD,
  SCHEDULE: CLIENT_DASHBOARD_ROUTES.SCHEDULE,
  SESSION_MANAGEMENT: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
  PAYMENT_HISTORY: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY
};

/**
 * @param {object} props
 * @param {string} [props.userName]
 * @param {string} [props.activeNavId]
 * @param {string} [props.brandWord] - branding.companyNameEn (없을 때 생략)
 * @param {string} [props.brandCenter] - tenant/center display name (없을 때 생략)
 * @param {() => void} [props.onLogout]
 * @param {string} [props.logoutLabel]
 */
const ClientLobbyTopChrome = ({
  userName,
  activeNavId = 'home',
  brandWord = '',
  brandCenter = '',
  onLogout,
  logoutLabel = CLIENT_WEB_LOGOUT
}) => {
  const lobbyNav = (
    <nav className="client-lobby__nav" aria-label="주요">
      {CLIENT_LOBBY_NAV.map((item) => {
        const href = ROUTE_MAP[item.routeKey];
        const isOn = item.id === activeNavId;
        return (
          <Link
            key={item.id}
            to={href}
            className={`client-lobby__nav-link${isOn ? ' client-lobby__nav-link--on' : ''}`}
            aria-current={isOn ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <ClientWebTopChrome
      className="client-lobby__topchrome"
      brandWord={brandWord}
      brandCenter={brandCenter}
      userName={userName}
      onLogout={onLogout}
      logoutLabel={logoutLabel}
      nav={lobbyNav}
    />
  );
};

ClientLobbyTopChrome.propTypes = {
  userName: PropTypes.string,
  activeNavId: PropTypes.string,
  brandWord: PropTypes.string,
  brandCenter: PropTypes.string,
  onLogout: PropTypes.func,
  logoutLabel: PropTypes.string
};

export default ClientLobbyTopChrome;
