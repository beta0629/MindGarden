/**
 * 내담자 예정 — suite stage: upcoming list + mini month · aside next-1
 * Read-only · no booking CTA · no UnifiedScheduleComponent / B0KlA
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { DASHBOARD_API } from '../../constants/api';
import { USER_ROLES } from '../../constants/roles';
import { normalizeScheduleListPayload } from '../../utils/apiResponseNormalize';
import SafeText from '../common/SafeText';
import UnifiedLoading from '../common/UnifiedLoading';
import ClientWebPageShell from './ClientWebPageShell';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../constants/clientWebSuiteConstants';
import {
  buildLobbyUpcomingList,
  formatLobbyDateTime
} from './clientDashboard/lobbyViewModel';
import { selectClientUpcomingSchedules } from './clientDashboard/scheduleUtils';
import { toDisplayString } from '../../utils/safeDisplay';
import './ClientSchedule.css';

const CLIENT_SCHEDULE_TITLE_ID = 'client-schedule-page-title';
const WEEKDAY_LABELS = Object.freeze(['일', '월', '화', '수', '목', '금', '토']);

/**
 * @param {Date} cursor
 * @param {Set<string>} markedIsoDates
 * @returns {import('react').ReactNode}
 */
function buildMiniMonthCells(cursor, markedIsoDates) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) {
    cells.push(<span key={`pad-${i}`} className="client-schedule-mini__cell client-schedule-mini__cell--pad" />);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const marked = markedIsoDates.has(iso);
    cells.push(
      <span
        key={iso}
        className={`client-schedule-mini__cell${marked ? ' client-schedule-mini__cell--marked' : ''}`}
      >
        {day}
      </span>
    );
  }
  return cells;
}

const ClientSchedule = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [monthCursor] = useState(() => new Date());

  const loadSchedules = useCallback(async() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await StandardizedApi.get(DASHBOARD_API.CLIENT_SCHEDULES, {
        userId: user.id,
        userRole: USER_ROLES.CLIENT
      });
      const list = normalizeScheduleListPayload(raw);
      setSchedules(selectClientUpcomingSchedules(list));
    } catch (err) {
      setError(err?.message || CLIENT_WEB_SUITE_COPY.SCHEDULE_ERROR_TITLE);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!sessionLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }
    if (user?.id) {
      loadSchedules();
    }
  }, [user?.id, isLoggedIn, sessionLoading, navigate, loadSchedules]);

  const listItems = useMemo(() => buildLobbyUpcomingList(schedules), [schedules]);
  const nextSchedule = schedules[0] || null;
  const markedDates = useMemo(() => {
    const set = new Set();
    schedules.forEach((s) => {
      const iso = String(s?.date || '').slice(0, 10);
      if (iso) set.add(iso);
    });
    return set;
  }, [schedules]);

  const monthLabel = monthCursor.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long'
  });

  const mainSlot = (
    <>
      {loading || sessionLoading ? (
        <div aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text={CLIENT_WEB_SUITE_COPY.SCHEDULE_LOADING} />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="client-web-page-shell__card client-schedule-error" role="alert">
          <h3 className="client-schedule-error__title">{CLIENT_WEB_SUITE_COPY.SCHEDULE_ERROR_TITLE}</h3>
          <p className="client-schedule-error__message">
            <SafeText>{error}</SafeText>
          </p>
          <button
            type="button"
            className="client-web-page-shell__cta"
            onClick={loadSchedules}
          >
            {CLIENT_WEB_SUITE_COPY.SCHEDULE_RETRY}
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <section
          className="client-web-page-shell__card client-schedule-list"
          aria-label={CLIENT_WEB_SUITE_COPY.SCHEDULE_TITLE}
        >
          {listItems.length === 0 ? (
            <p className="client-schedule-list__empty">{CLIENT_WEB_SUITE_COPY.SCHEDULE_EMPTY}</p>
          ) : (
            listItems.map((item) => (
              <article
                key={item.id}
                className={`client-schedule-list__item${item.isNext ? ' client-schedule-list__item--next' : ''}`}
              >
                <div className="client-schedule-list__date">
                  <span className="client-schedule-list__day">
                    <SafeText>{item.day}</SafeText>
                  </span>
                  <span className="client-schedule-list__month">
                    <SafeText>{item.month}</SafeText>
                  </span>
                </div>
                <div className="client-schedule-list__body">
                  <p className="client-schedule-list__title">
                    <SafeText>{item.title}</SafeText>
                  </p>
                  <p className="client-schedule-list__sub">
                    <SafeText>{item.subtitle}</SafeText>
                  </p>
                </div>
                <span className="client-schedule-list__badge">
                  <SafeText>{item.badge}</SafeText>
                </span>
              </article>
            ))
          )}
        </section>
      ) : null}

      {!loading && !error ? (
        <section
          className="client-web-page-shell__card client-schedule-mini"
          data-testid={CLIENT_WEB_SUITE_TEST_IDS.SCHEDULE_MINI_MONTH}
          aria-label={CLIENT_WEB_SUITE_COPY.SCHEDULE_MINI_MONTH_LABEL}
        >
          <div className="client-schedule-mini__head">
            <h2 className="client-schedule-mini__title">
              {CLIENT_WEB_SUITE_COPY.SCHEDULE_MINI_MONTH_LABEL}
            </h2>
            <span className="client-schedule-mini__meta">
              <SafeText>{monthLabel}</SafeText>
            </span>
          </div>
          <div className="client-schedule-mini__weekdays" aria-hidden="true">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="client-schedule-mini__weekday">{w}</span>
            ))}
          </div>
          <div className="client-schedule-mini__grid">
            {buildMiniMonthCells(monthCursor, markedDates)}
          </div>
        </section>
      ) : null}
    </>
  );

  const asideSlot = (
    <section className="client-web-page-shell__card client-schedule-next">
      <h2 className="client-schedule-next__title">{CLIENT_WEB_SUITE_COPY.SCHEDULE_ASIDE_TITLE}</h2>
      {nextSchedule ? (
        <>
          <p className="client-schedule-next__when">
            <SafeText>{formatLobbyDateTime(nextSchedule)}</SafeText>
          </p>
          <p className="client-schedule-next__who">
            <SafeText>
              {toDisplayString(
                nextSchedule.consultantName || nextSchedule.consultant?.name,
                ''
              )}
            </SafeText>
          </p>
        </>
      ) : (
        <p className="client-schedule-next__empty">{CLIENT_WEB_SUITE_COPY.SCHEDULE_EMPTY}</p>
      )}
    </section>
  );

  return (
    <ClientWebPageShell
      activeNavId="schedule"
      title={CLIENT_WEB_SUITE_COPY.SCHEDULE_TITLE}
      titleId={CLIENT_SCHEDULE_TITLE_ID}
      testId={CLIENT_WEB_SUITE_TEST_IDS.SCHEDULE_PAGE}
      main={mainSlot}
      aside={asideSlot}
    />
  );
};

export default ClientSchedule;
