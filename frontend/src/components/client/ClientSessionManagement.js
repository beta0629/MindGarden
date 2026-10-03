/**
 * 내담자 회기 — suite: remaining breakdown · aside shop CTA
 * No B0KlA / ContentArea / hamburger menu
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClientSessionReady } from '../../hooks/useClientSessionReady';
import { useSoftResourceLoad } from '../../hooks/useSoftResourceLoad';
import { useUserIdScopedLoad } from '../../hooks/useUserIdScopedLoad';
import { DASHBOARD_API } from '../../constants/api';
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

const CLIENT_SESSION_MGMT_TITLE_ID = 'client-session-management-title';

/**
 * 로그인·역할 판단은 ClientRouteGuard 가 한다. 이 화면은 세션 준비 뒤 본인 매칭만 읽는다.
 */
const ClientSessionManagement = () => {
  const { ready, userId, userRef } = useClientSessionReady();
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessionData = useCallback(async() => {
    setError(null);
    const clientId = userRef.current?.id;
    const mappingsResponse = await StandardizedApi.get(DASHBOARD_API.CLIENT_CONSULTANT_INFO, {
      clientId
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
  }, [userRef]);

  const { load: loadSessionData } = useSoftResourceLoad(
    setIsLoading,
    async() => {
      try {
        await fetchSessionData();
      } catch (err) {
        setError(err?.message || CLIENT_WEB_SUITE_COPY.SESSIONS_ERROR_TITLE);
        setSessionData(null);
      }
    }
  );

  useUserIdScopedLoad({
    userId,
    loadFn: loadSessionData,
    enabled: ready
  });

  const handleRetry = useCallback(() => {
    void loadSessionData({ silent: false });
  }, [loadSessionData]);

  const balanceMeta = useMemo(
    () => buildSessionChipAndBalance(sessionData?.mappings),
    [sessionData?.mappings]
  );

  const showLoading = isLoading;

  const mainSlot = (
    <>
      {showLoading ? (
        <div aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text={CLIENT_WEB_SUITE_COPY.SESSIONS_LOADING} />
        </div>
      ) : null}

      {!showLoading && error ? (
        <div className="client-web-page-shell__card" role="alert">
          <h3 className="client-sessions__error-title">{CLIENT_WEB_SUITE_COPY.SESSIONS_ERROR_TITLE}</h3>
          <p className="client-sessions__mute">
            <SafeText>{error}</SafeText>
          </p>
          <button type="button" className="client-web-page-shell__cta" onClick={handleRetry}>
            {CLIENT_WEB_SUITE_COPY.SESSIONS_RETRY}
          </button>
        </div>
      ) : null}

      {!showLoading && !error && (!sessionData || sessionData.mappings.length === 0) ? (
        <div className="client-web-page-shell__card">
          <h3 className="client-sessions__empty-title">{CLIENT_WEB_SUITE_COPY.SESSIONS_EMPTY_TITLE}</h3>
          <p className="client-sessions__mute">{CLIENT_WEB_SUITE_COPY.SESSIONS_EMPTY_BODY}</p>
        </div>
      ) : null}

      {!showLoading && !error && sessionData && sessionData.mappings.length > 0 ? (
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
