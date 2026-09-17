/**
 * Client Lobby — 예정 목록 패널 (read-only)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SafeText from '../../common/SafeText';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import {
  CLIENT_LOBBY_CTA_VIEW_ALL,
  CLIENT_LOBBY_EMPTY_UPCOMING,
  CLIENT_LOBBY_PANEL_UPCOMING
} from './constants';

const ClientLobbyUpcomingPanel = ({ items }) => {
  const list = Array.isArray(items) ? items : [];

  return (
    <section data-testid="client-lobby-upcoming-panel">
      <div className="client-lobby__section-head">
        <h2>{CLIENT_LOBBY_PANEL_UPCOMING}</h2>
        <Link className="client-lobby__section-link" to={CLIENT_DASHBOARD_ROUTES.SCHEDULE}>
          {CLIENT_LOBBY_CTA_VIEW_ALL}
        </Link>
      </div>
      <div className="client-lobby__card">
        {list.length === 0 ? (
          <p className="client-lobby__list-empty">{CLIENT_LOBBY_EMPTY_UPCOMING}</p>
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className={`client-lobby__list-item${item.isNext ? ' client-lobby__list-item--next' : ''}`}
            >
              <div className="client-lobby__date-col">
                <div className="client-lobby__date-d">
                  <SafeText>{item.day}</SafeText>
                </div>
                <div className="client-lobby__date-m">
                  <SafeText>{item.month}</SafeText>
                </div>
              </div>
              <div className="client-lobby__list-body">
                <div className="client-lobby__list-t">
                  <SafeText>{item.title}</SafeText>
                </div>
                <div className="client-lobby__list-s">
                  <SafeText>{item.subtitle}</SafeText>
                </div>
                {item.memo ? (
                  <div className="client-lobby__list-note">
                    <SafeText>{item.memo}</SafeText>
                  </div>
                ) : null}
              </div>
              <span className="client-lobby__badge">
                <SafeText>{item.badge}</SafeText>
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

ClientLobbyUpcomingPanel.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object)
};

export default ClientLobbyUpcomingPanel;
