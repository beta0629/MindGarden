/**
 * Client Lobby — 회기 잔량 패널
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SafeText from '../../common/SafeText';
import { toSafeNumber } from '../../../utils/safeDisplay';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import {
  CLIENT_LOBBY_CTA_BALANCE_DETAIL,
  CLIENT_LOBBY_CTA_PAYMENT,
  CLIENT_LOBBY_CTA_PICK_SESSION,
  CLIENT_LOBBY_PANEL_BALANCE,
  CLIENT_LOBBY_SESSION_UNIT
} from './constants';

const ClientLobbyBalancePanel = ({ remainingSessions, rows }) => {
  const remain = toSafeNumber(remainingSessions);
  const list = Array.isArray(rows) ? rows : [];

  return (
    <section data-testid="client-lobby-balance-panel">
      <div className="client-lobby__section-head">
        <h2>{CLIENT_LOBBY_PANEL_BALANCE}</h2>
        <Link
          className="client-lobby__section-link"
          to={CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT}
        >
          {CLIENT_LOBBY_CTA_BALANCE_DETAIL}
        </Link>
      </div>
      <div className="client-lobby__card client-lobby__balance">
        <div className="client-lobby__balance-big">
          <span className="client-lobby__balance-n">
            <SafeText>{remain}</SafeText>
          </span>
          <span className="client-lobby__balance-u">{CLIENT_LOBBY_SESSION_UNIT}</span>
        </div>
        {list.length > 0 ? (
          <div className="client-lobby__balance-rows">
            {list.map((row) => (
              <div key={row.id} className="client-lobby__balance-row">
                <span className="client-lobby__balance-name">
                  <SafeText>{row.name}</SafeText>
                </span>
                <span className="client-lobby__balance-val">
                  <SafeText>{`${toSafeNumber(row.remaining)}회`}</SafeText>
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="client-lobby__balance-foot">
          <Link
            className="client-lobby__btn-ghost client-lobby__btn-ghost--primary-soft"
            to={CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT}
          >
            {CLIENT_LOBBY_CTA_PICK_SESSION}
          </Link>
          <Link
            className="client-lobby__btn-ghost"
            to={CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY}
          >
            {CLIENT_LOBBY_CTA_PAYMENT}
          </Link>
        </div>
      </div>
    </section>
  );
};

ClientLobbyBalancePanel.propTypes = {
  remainingSessions: PropTypes.number,
  rows: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    remaining: PropTypes.number
  }))
};

export default ClientLobbyBalancePanel;
