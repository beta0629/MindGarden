/**
 * ClientAppShell — 내담자 중첩 라우트 레이아웃 (Template)
 *
 * Clinic-OS client web SSOT: common header only (ClientWebPageShell).
 * No ops LNB / desktop sidebar / app-fill tab bar.
 * `/client/dashboard`(커버 홈) — 셸 TopChrome 숨김 · stage full-bleed
 * (커버 내부 client-cover__chrome 이 헤더 ☰ 1개 SSOT).
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation } from 'react-router-dom';
import { CLIENT_DASHBOARD_ROUTES } from '../../constants/clientDashboardRoutes';
import ClientWebPageShell from '../client/ClientWebPageShell';
import './ClientAppShell.css';

/**
 * @param {string} pathname
 * @returns {boolean}
 */
const isClientCoverHomePath = (pathname) => {
  const path = typeof pathname === 'string' ? pathname : '';
  if (path === CLIENT_DASHBOARD_ROUTES.DASHBOARD) {
    return true;
  }
  // trailing slash 허용
  return path === `${CLIENT_DASHBOARD_ROUTES.DASHBOARD}/`;
};

/**
 * Thin wrapper around ClientWebPageShell + Outlet for /client/* nested routes
 * (dashboard cover · community · renewals · more · wellness-hub · …).
 *
 * title / showBack / onBack are accepted for call-site compatibility but unused
 * (header SSOT lives in ClientWebTopChrome — cover home은 커버 chrome만).
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {boolean} [props.showBack]
 * @param {() => void} [props.onBack]
 * @param {import('react').ReactNode} [props.children]
 */
const ClientAppShell = ({ title: _title, showBack: _showBack, onBack: _onBack, children }) => {
  const { pathname } = useLocation();
  const coverHome = useMemo(() => isClientCoverHomePath(pathname), [pathname]);

  return (
    <ClientWebPageShell
      activeNavId="home"
      className="mg-app-shell--client"
      hideChrome={coverHome}
      fullBleed={coverHome}
    >
      {children || <Outlet />}
    </ClientWebPageShell>
  );
};

ClientAppShell.propTypes = {
  title: PropTypes.string,
  showBack: PropTypes.bool,
  onBack: PropTypes.func,
  children: PropTypes.node
};

export default ClientAppShell;
