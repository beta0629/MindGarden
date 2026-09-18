/**
 * Client Lobby — 상단 editorial 크롬
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SafeText from '../../common/SafeText';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import butterflyLogo from '../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png';
import { CLIENT_LOBBY_LOGOUT, CLIENT_LOBBY_NAV } from './constants';
import { resolveNameInitial } from './lobbyViewModel';

const ROUTE_MAP = {
  DASHBOARD: CLIENT_DASHBOARD_ROUTES.DASHBOARD,
  SCHEDULE: CLIENT_DASHBOARD_ROUTES.SCHEDULE,
  SESSION_MANAGEMENT: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
  PAYMENT_HISTORY: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY,
  COMMUNITY: CLIENT_DASHBOARD_ROUTES.COMMUNITY
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
  logoutLabel = CLIENT_LOBBY_LOGOUT
}) => {
  const initial = resolveNameInitial(userName);
  const word = typeof brandWord === 'string' ? brandWord.trim() : '';
  const center = typeof brandCenter === 'string' ? brandCenter.trim() : '';
  const showSep = Boolean(word && center);
  const label = typeof logoutLabel === 'string' && logoutLabel.trim()
    ? logoutLabel.trim()
    : CLIENT_LOBBY_LOGOUT;

  return (
    <header className="client-lobby__topchrome">
      <Link className="client-lobby__brand" to={CLIENT_DASHBOARD_ROUTES.DASHBOARD}>
        <img
          className="client-lobby__brand-mark"
          src={butterflyLogo}
          alt=""
          width={28}
          height={21}
        />
        {word ? (
          <span className="client-lobby__brand-word">
            <SafeText fallback="">{word}</SafeText>
          </span>
        ) : null}
        {showSep ? (
          <span className="client-lobby__brand-sep" aria-hidden="true">·</span>
        ) : null}
        {center ? (
          <span className="client-lobby__brand-center">
            <SafeText fallback="">{center}</SafeText>
          </span>
        ) : null}
      </Link>
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
      <div className="client-lobby__top-meta">
        <span className="client-lobby__top-meta-name">
          <SafeText>{userName}</SafeText>
        </span>
        {typeof onLogout === 'function' ? (
          <button
            type="button"
            className="client-lobby__logout"
            onClick={onLogout}
            aria-label={label}
          >
            {label}
          </button>
        ) : null}
        <div className="client-lobby__avatar-sm" aria-hidden="true">
          <SafeText fallback="·">{initial}</SafeText>
        </div>
      </div>
    </header>
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
