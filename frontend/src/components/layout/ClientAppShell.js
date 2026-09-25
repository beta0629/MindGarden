/**
 * ClientAppShell — 내담자 중첩 라우트 레이아웃 (Template)
 *
 * Clinic-OS client web SSOT: common header only (ClientWebPageShell).
 * No ops LNB / desktop sidebar / app-fill tab bar.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import ClientWebPageShell from '../client/ClientWebPageShell';
import './ClientAppShell.css';

/**
 * Thin wrapper around ClientWebPageShell + Outlet for /client/* nested routes
 * (community · renewals · more · wellness-hub · …).
 *
 * title / showBack / onBack are accepted for call-site compatibility but unused
 * (header SSOT lives in ClientWebTopChrome).
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {boolean} [props.showBack]
 * @param {() => void} [props.onBack]
 * @param {import('react').ReactNode} [props.children]
 */
const ClientAppShell = ({ title: _title, showBack: _showBack, onBack: _onBack, children }) => (
  <ClientWebPageShell
    activeNavId="home"
    className="mg-app-shell--client"
  >
    {children || <Outlet />}
  </ClientWebPageShell>
);

ClientAppShell.propTypes = {
  title: PropTypes.string,
  showBack: PropTypes.bool,
  onBack: PropTypes.func,
  children: PropTypes.node
};

export default ClientAppShell;
