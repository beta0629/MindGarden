/**
 * 미니멀 독 — 홈 · 예정 · 마음 · 나
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { CLIENT_DASHBOARD_ROUTES } from '../../../../constants/clientDashboardRoutes';
import {
  CLIENT_COVER_DOCK_ARIA,
  CLIENT_COVER_DOCK_HOME,
  CLIENT_COVER_DOCK_ME,
  CLIENT_COVER_DOCK_SCHEDULE,
  CLIENT_COVER_DOCK_TEST_ID,
  CLIENT_COVER_DOCK_WELLNESS
} from '../constants';
import './ClientMinimalDock.css';

const DOCK_ITEMS = Object.freeze([
  {
    id: 'home',
    label: CLIENT_COVER_DOCK_HOME,
    path: CLIENT_DASHBOARD_ROUTES.DASHBOARD,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    )
  },
  {
    id: 'schedule',
    label: CLIENT_COVER_DOCK_SCHEDULE,
    path: CLIENT_DASHBOARD_ROUTES.SCHEDULE,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    )
  },
  {
    id: 'wellness',
    label: CLIENT_COVER_DOCK_WELLNESS,
    path: CLIENT_DASHBOARD_ROUTES.WELLNESS,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />
      </svg>
    )
  },
  {
    id: 'me',
    label: CLIENT_COVER_DOCK_ME,
    path: CLIENT_DASHBOARD_ROUTES.MYPAGE,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19a7 7 0 0 1 14 0" />
      </svg>
    )
  }
]);

/**
 * @param {object} props
 * @param {string} [props.activeId]
 */
const ClientMinimalDock = ({ activeId = 'home' }) => (
  <nav
    className="client-cover__dock"
    aria-label={CLIENT_COVER_DOCK_ARIA}
    data-testid={CLIENT_COVER_DOCK_TEST_ID}
  >
    {DOCK_ITEMS.map((item) => (
      <NavLink
        key={item.id}
        to={item.path}
        end={item.id === 'home'}
        className={({ isActive }) => {
          const on = isActive || activeId === item.id;
          return [
            'client-cover__dock-item',
            on ? 'client-cover__dock-item--on' : ''
          ].filter(Boolean).join(' ');
        }}
      >
        {item.icon}
        <span className="client-cover__dock-dot" aria-hidden="true" />
        <span className="client-cover__dock-label">{item.label}</span>
      </NavLink>
    ))}
  </nav>
);

ClientMinimalDock.propTypes = {
  activeId: PropTypes.string
};

export default ClientMinimalDock;
