/**
 * /client/* 미등록 catch-all — 빈화면 금지, 홈 복귀 CTA
 *
 * @author CoreSolution
 * @since 2026-09-25
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CLIENT_DASHBOARD_ROUTES } from '../../constants/clientDashboardRoutes';
import {
  CLIENT_UNKNOWN_ROUTE_COPY,
  CLIENT_UNKNOWN_ROUTE_TEST_IDS
} from '../../constants/clientLegacyRouteRedirects';
import ClientWebPageShell from './ClientWebPageShell';
import SafeText from '../common/SafeText';
import './ClientUnknownRoutePage.css';

const ClientUnknownRoutePage = () => {
  const location = useLocation();
  const pathLabel = typeof location.pathname === 'string' ? location.pathname : '';

  return (
    <ClientWebPageShell
      title={CLIENT_UNKNOWN_ROUTE_COPY.TITLE}
      titleId="client-unknown-route-title"
      testId={CLIENT_UNKNOWN_ROUTE_TEST_IDS.PAGE}
    >
      <div
        className="client-unknown-route"
        data-testid={CLIENT_UNKNOWN_ROUTE_TEST_IDS.BODY}
      >
        <p className="client-unknown-route__lead">
          <SafeText>{CLIENT_UNKNOWN_ROUTE_COPY.LEAD}</SafeText>
        </p>
        {pathLabel ? (
          <p className="client-unknown-route__path" data-testid={CLIENT_UNKNOWN_ROUTE_TEST_IDS.PATH}>
            <SafeText>{pathLabel}</SafeText>
          </p>
        ) : null}
        <Link
          className="client-unknown-route__cta"
          to={CLIENT_DASHBOARD_ROUTES.DASHBOARD}
          data-testid={CLIENT_UNKNOWN_ROUTE_TEST_IDS.HOME_CTA}
        >
          {CLIENT_UNKNOWN_ROUTE_COPY.HOME_CTA}
        </Link>
      </div>
    </ClientWebPageShell>
  );
};

export default ClientUnknownRoutePage;
