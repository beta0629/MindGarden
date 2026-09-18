/**
 * 내담자 회기 — suite: remaining breakdown · aside shop CTA
 * No B0KlA / ContentArea / hamburger menu
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StandardizedApi from '../../utils/standardizedApi';
import {
  isApiGetNullFailure,
  normalizeMappingsListPayload
} from '../../utils/apiResponseNormalize';
import { calculateClientSessionTotalsFromMappings } from '../../utils/clientSessionTotals';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import UnifiedLoading from '../common/UnifiedLoading';
import ClientWebPageShell from './ClientWebPageShell';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../constants/clientWebSuiteConstants';
import { buildSessionChipAndBalance } from './clientDashboard/lobbyViewModel';
import './ClientSessionManagement.css';

const API_AUTH_CURRENT_USER = '/api/v1/auth/current-user';
const API_ADMIN_MAPPINGS_CLIENT = '/api/v1/admin/mappings/client';
const CLIENT_SESSION_MGMT_TITLE_ID = 'client-session-management-title';

const ClientSessionManagement = () => {
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSessionData = useCallback(async() => {
    setIsLoading(true);
    setError(null);
    try {
      const userResponse = await StandardizedApi.get(API_AUTH_CURRENT_USER);
      if (!userResponse || !userResponse.id) {
        throw new Error(CLIENT_WEB_SUITE_COPY.SESSIONS_ERROR_TITLE);
      }
      const mappingsResponse = await StandardizedApi.get(API_ADMIN_MAPPINGS_CLIENT, {
        clientId: userResponse.id
      });
      if (isApiGetNullFailure(mappingsResponse)) {
        throw new Error(CLIENT_WEB_SUITE_COPY.SESSIONS_ERROR_TITLE);
      }
      const mappings = normalizeMappingsListPayload(mappingsResponse);
      const sessionTotals = calculateClientSessionTotalsFromMappings(mappings);
      setSessionData({
        totalSessions: sessionTotals.totalSessions,
        usedSessions: sessionTotals.usedSessions,
        remainingSessions: sessionTotals.remainingSessions,
        mappings: mappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
    } catch (err) {
      setError(err.message || CLIENT_WEB_SUITE_COPY.SESSIONS_ERROR_TITLE);
      setSessionData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  const balanceMeta = useMemo(
    () => buildSessionChipAndBalance(sessionData?.mappings),
    [sessionData?.mappings]
  );

  const mainSlot = (
    <>
      {isLoading ? (
        <div aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text={CLIENT_WEB_SUITE_COPY.SESSIONS_LOADING} />
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="client-web-page-shell__card" role="alert">
          <h3 className="client-sessions__error-title">{CLIENT_WEB_SUITE_COPY.SESSIONS_ERROR_TITLE}</h3>
          <p className="client-sessions__mute">
            <SafeText>{error}</SafeText>
          </p>
          <button type="button" className="client-web-page-shell__cta" onClick={loadSessionData}>
            {CLIENT_WEB_SUITE_COPY.SESSIONS_RETRY}
          </button>
        </div>
      ) : null}

      {!isLoading && !error && (!sessionData || sessionData.mappings.length === 0) ? (
        <div className="client-web-page-shell__card">
          <h3 className="client-sessions__empty-title">{CLIENT_WEB_SUITE_COPY.SESSIONS_EMPTY_TITLE}</h3>
          <p className="client-sessions__mute">{CLIENT_WEB_SUITE_COPY.SESSIONS_EMPTY_BODY}</p>
        </div>
      ) : null}

      {!isLoading && !error && sessionData && sessionData.mappings.length > 0 ? (
        <section className="client-web-page-shell__card client-sessions-summary">
          <div className="client-sessions-summary__hero">
            <span className="client-sessions-summary__n">
              <SafeText>{toSafeNumber(sessionData.remainingSessions, 0)}</SafeText>
            </span>
            <span className="client-sessions-summary__u">
              {CLIENT_WEB_SUITE_COPY.SESSIONS_TOTAL_UNIT}
            </span>
          </div>
          <div className="client-sessions-summary__stats">
            <div className="client-sessions-summary__stat">
              <span className="client-sessions-summary__label">
                {CLIENT_WEB_SUITE_COPY.SESSIONS_BREAKDOWN_TOTAL}
              </span>
              <span className="client-sessions-summary__value">
                <SafeText>{`${toSafeNumber(sessionData.totalSessions, 0)}${CLIENT_WEB_SUITE_COPY.SESSIONS_TOTAL_UNIT}`}</SafeText>
              </span>
            </div>
            <div className="client-sessions-summary__stat">
              <span className="client-sessions-summary__label">
                {CLIENT_WEB_SUITE_COPY.SESSIONS_BREAKDOWN_USED}
              </span>
              <span className="client-sessions-summary__value">
                <SafeText>{`${toSafeNumber(sessionData.usedSessions, 0)}${CLIENT_WEB_SUITE_COPY.SESSIONS_TOTAL_UNIT}`}</SafeText>
              </span>
            </div>
            <div className="client-sessions-summary__stat">
              <span className="client-sessions-summary__label">
                {CLIENT_WEB_SUITE_COPY.SESSIONS_BREAKDOWN_REMAINING}
              </span>
              <span className="client-sessions-summary__value">
                <SafeText>{`${toSafeNumber(sessionData.remainingSessions, 0)}${CLIENT_WEB_SUITE_COPY.SESSIONS_TOTAL_UNIT}`}</SafeText>
              </span>
            </div>
          </div>
          {balanceMeta.rows.length > 0 ? (
            <ul className="client-sessions-breakdown">
              {balanceMeta.rows.map((row) => (
                <li key={row.id} className="client-sessions-breakdown__row">
                  <span className="client-sessions-breakdown__name">
                    <SafeText>{row.name}</SafeText>
                  </span>
                  <span className="client-sessions-breakdown__val">
                    <SafeText>{`${toSafeNumber(row.remaining, 0)}${CLIENT_WEB_SUITE_COPY.SESSIONS_TOTAL_UNIT}`}</SafeText>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <ul className="client-sessions-packages">
            {sessionData.mappings.map((mapping, index) => (
              <li key={mapping.id || index} className="client-sessions-packages__item">
                <span className="client-sessions-packages__name">
                  <SafeText>
                    {toDisplayString(
                      mapping.packageName || mapping.consultant?.consultantName,
                      CLIENT_WEB_SUITE_COPY.SESSIONS_BREAKDOWN_REMAINING
                    )}
                  </SafeText>
                </span>
                <span className="client-sessions-packages__meta">
                  <SafeText>
                    {`${toSafeNumber(mapping.remainingSessions, 0)} / ${toSafeNumber(mapping.totalSessions, 0)}${CLIENT_WEB_SUITE_COPY.SESSIONS_TOTAL_UNIT}`}
                  </SafeText>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );

  const asideSlot = (
    <section className="client-web-page-shell__card client-sessions-shop-cta">
      <h2 className="client-sessions-shop-cta__title">
        {CLIENT_WEB_SUITE_COPY.SESSIONS_SHOP_CTA_TITLE}
      </h2>
      <Link
        className="client-web-page-shell__cta"
        to={CLIENT_WEB_SUITE_COPY.SESSIONS_SHOP_HREF}
      >
        {CLIENT_WEB_SUITE_COPY.SESSIONS_SHOP_CTA}
      </Link>
    </section>
  );

  return (
    <ClientWebPageShell
      activeNavId="sessions"
      title={CLIENT_WEB_SUITE_COPY.SESSIONS_TITLE}
      titleId={CLIENT_SESSION_MGMT_TITLE_ID}
      testId={CLIENT_WEB_SUITE_TEST_IDS.SESSIONS_PAGE}
      main={mainSlot}
      aside={asideSlot}
    />
  );
};

export default ClientSessionManagement;
