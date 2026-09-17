/**
 * Client Lobby — 인사 (이름 = ink)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { CLIENT_DASHBOARD_TITLE_ID } from './constants';

const ClientLobbyGreeting = ({ userName, eyebrow, whenLine }) => (
  <header className="client-lobby__greet">
    <div className="client-lobby__eyebrow">
      <SafeText>{eyebrow}</SafeText>
    </div>
    <h1 id={CLIENT_DASHBOARD_TITLE_ID} className="client-lobby__hi">
      안녕하세요,{' '}
      <em className="client-lobby__hi-name">
        <SafeText>{userName}</SafeText>
      </em>
      {' '}님
    </h1>
    <p className="client-lobby__when">
      <SafeText>{whenLine}</SafeText>
    </p>
  </header>
);

ClientLobbyGreeting.propTypes = {
  userName: PropTypes.string,
  eyebrow: PropTypes.string,
  whenLine: PropTypes.string
};

export default ClientLobbyGreeting;
