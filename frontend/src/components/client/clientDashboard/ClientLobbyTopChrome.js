/**
 * Client Lobby — 상단 editorial 크롬 (shared ClientWebTopChrome + CLIENT_WEB_NAV)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CLIENT_WEB_LOGOUT } from '../../../constants/clientWebChromeConstants';
import ClientWebTopChrome from '../ClientWebTopChrome';

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
}) => (
  <ClientWebTopChrome
    className="client-lobby__topchrome"
    brandWord={brandWord}
    brandCenter={brandCenter}
    userName={userName}
    activeNavId={activeNavId}
    onLogout={onLogout}
    logoutLabel={logoutLabel}
  />
);

ClientLobbyTopChrome.propTypes = {
  userName: PropTypes.string,
  activeNavId: PropTypes.string,
  brandWord: PropTypes.string,
  brandCenter: PropTypes.string,
  onLogout: PropTypes.func,
  logoutLabel: PropTypes.string
};

export default ClientLobbyTopChrome;
