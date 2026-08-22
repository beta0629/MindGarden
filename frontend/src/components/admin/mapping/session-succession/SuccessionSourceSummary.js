/**
 * 회기 승계 — 소스 매핑 요약 블록 (좌측 primary 악센트).
 *
 * @author CoreSolution
 * @since 2026-08-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_SUCCESSION_UI } from '../../../../constants/sessionSuccession';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';

const SuccessionSourceSummary = ({
  packageName,
  usedSessions,
  remainingSessions,
  totalSessions,
  transferableSessions,
  occupyingScheduleCount,
  loading,
  showZeroBanner
}) => {
  if (loading) {
    return (
      <section
        className="session-succession-wizard__summary session-succession-wizard__summary--skeleton"
        aria-busy="true"
        aria-label="소스 요약 로딩"
      >
        <div className="session-succession-wizard__skeleton-line" />
        <div className="session-succession-wizard__skeleton-line session-succession-wizard__skeleton-line--short" />
        <div className="session-succession-wizard__skeleton-line" />
      </section>
    );
  }

  const transferable = toSafeNumber(transferableSessions, 0);
  const occupying = toSafeNumber(occupyingScheduleCount, 0);

  return (
    <section className="session-succession-wizard__summary" aria-label="소스 요약">
      <span className="session-succession-wizard__summary-accent" aria-hidden="true" />
      <div className="session-succession-wizard__summary-body">
        <p className="session-succession-wizard__summary-package">
          {toDisplayString(packageName, '—')}
        </p>
        <p className="session-succession-wizard__summary-row">
          <span>{SESSION_SUCCESSION_UI.USED_REMAINING_TOTAL_LABEL}</span>
          <strong>
            {toSafeNumber(usedSessions, 0)}
            {' / '}
            {toSafeNumber(remainingSessions, 0)}
            {' / '}
            {toSafeNumber(totalSessions, 0)}
          </strong>
        </p>
        <p className="session-succession-wizard__summary-transferable">
          {SESSION_SUCCESSION_UI.TRANSFERABLE_LABEL}
          {': '}
          {transferable}
          회
        </p>
        {occupying > 0 && (
          <p className="session-succession-wizard__summary-occupying">
            {SESSION_SUCCESSION_UI.OCCUPYING_EXCLUDE_PREFIX}
            {' '}
            {occupying}
            {SESSION_SUCCESSION_UI.OCCUPYING_EXCLUDE_SUFFIX}
          </p>
        )}
        {showZeroBanner && (
          <p className="session-succession-wizard__zero" role="status">
            {SESSION_SUCCESSION_UI.ZERO_TRANSFERABLE}
          </p>
        )}
      </div>
    </section>
  );
};

SuccessionSourceSummary.propTypes = {
  packageName: PropTypes.string,
  usedSessions: PropTypes.number,
  remainingSessions: PropTypes.number,
  totalSessions: PropTypes.number,
  transferableSessions: PropTypes.number,
  occupyingScheduleCount: PropTypes.number,
  loading: PropTypes.bool,
  showZeroBanner: PropTypes.bool
};

SuccessionSourceSummary.defaultProps = {
  packageName: '',
  usedSessions: 0,
  remainingSessions: 0,
  totalSessions: 0,
  transferableSessions: 0,
  occupyingScheduleCount: 0,
  loading: false,
  showZeroBanner: false
};

export default SuccessionSourceSummary;
