/**
 * Client Lobby — ONE hero (kicker 「다음 한 장」 + 우선순위 타이틀)
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
  CLIENT_LOBBY_CTA_DETAILS,
  CLIENT_LOBBY_HERO_COPY,
  CLIENT_LOBBY_HERO_KICKER,
  CLIENT_LOBBY_HERO_NOTE,
  CLIENT_LOBBY_HERO_PRIORITY,
  CLIENT_LOBBY_HERO_TEST_ID
} from './constants';
import {
  formatLobbyDateTime,
  resolveConsultationMethodLabel,
  resolveNameInitial,
  resolveScheduleConsultantName,
  resolveScheduleDurationMinutes
} from './lobbyViewModel';

const ROUTE_MAP = {
  SCHEDULE: CLIENT_DASHBOARD_ROUTES.SCHEDULE,
  SESSION_MANAGEMENT: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
  PAYMENT_HISTORY: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY
};

const ClientLobbyHero = ({ priority, nextSchedule }) => {
  const copy = CLIENT_LOBBY_HERO_COPY[priority] || CLIENT_LOBBY_HERO_COPY.QUIET_DAY;
  const ctaHref = ROUTE_MAP[copy.ctaRouteKey] || CLIENT_DASHBOARD_ROUTES.SCHEDULE;
  const isNext = priority === CLIENT_LOBBY_HERO_PRIORITY.NEXT_APPOINTMENT && nextSchedule;
  const amberClass = copy.amber ? ' client-lobby__hero--amber' : '';

  if (isNext) {
    const consultantName = resolveScheduleConsultantName(nextSchedule);
    const duration = resolveScheduleDurationMinutes(nextSchedule);
    const method = resolveConsultationMethodLabel(nextSchedule);
    const initial = resolveNameInitial(consultantName);

    return (
      <article
        className={`client-lobby__hero${amberClass}`}
        aria-labelledby="client-lobby-hero-title"
        data-testid={CLIENT_LOBBY_HERO_TEST_ID}
        data-priority={priority}
      >
        <div className="client-lobby__hero-label">{CLIENT_LOBBY_HERO_KICKER}</div>
        <div className="client-lobby__hero-row">
          <div className="client-lobby__hero-main">
            <div className="client-lobby__hero-title" id="client-lobby-hero-title">
              {copy.title}
            </div>
            <div className="client-lobby__datetime">
              <SafeText>{formatLobbyDateTime(nextSchedule)}</SafeText>
            </div>
            <div className="client-lobby__meta">
              <div className="client-lobby__counselor">
                <span className="client-lobby__counselor-ini" aria-hidden="true">
                  <SafeText fallback="·">{initial}</SafeText>
                </span>
                <span>
                  <SafeText>{consultantName}</SafeText>
                  {' '}상담사
                </span>
              </div>
              <span className="client-lobby__duration">
                <SafeText>{`${duration}분 · ${method}`}</SafeText>
              </span>
            </div>
          </div>
          <div className="client-lobby__hero-cta">
            <Link className="client-lobby__btn-primary" to={CLIENT_DASHBOARD_ROUTES.SCHEDULE}>
              {CLIENT_LOBBY_CTA_DETAILS}
            </Link>
          </div>
        </div>
        <p className="client-lobby__hero-note">{CLIENT_LOBBY_HERO_NOTE}</p>
      </article>
    );
  }

  return (
    <article
      className={`client-lobby__hero${amberClass}`}
      aria-labelledby="client-lobby-hero-title"
      data-testid={CLIENT_LOBBY_HERO_TEST_ID}
      data-priority={priority}
    >
      <div className="client-lobby__hero-label">{CLIENT_LOBBY_HERO_KICKER}</div>
      <div className="client-lobby__hero-row">
        <div className="client-lobby__hero-main">
          <div className="client-lobby__hero-title" id="client-lobby-hero-title">
            {copy.title}
          </div>
          <p className="client-lobby__hero-body">
            <SafeText>{copy.body}</SafeText>
          </p>
        </div>
        <div className="client-lobby__hero-cta">
          <Link className="client-lobby__btn-primary" to={ctaHref}>
            {copy.cta}
          </Link>
        </div>
      </div>
    </article>
  );
};

ClientLobbyHero.propTypes = {
  priority: PropTypes.string.isRequired,
  nextSchedule: PropTypes.object
};

export default ClientLobbyHero;
