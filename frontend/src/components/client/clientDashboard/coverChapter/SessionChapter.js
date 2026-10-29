/**
 * 챕터 01 회기 — 잔여 · 결제 SoftChip
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SafeText from '../../../common/SafeText';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';
import { CLIENT_DASHBOARD_ROUTES } from '../../../../constants/clientDashboardRoutes';
import {
  CLIENT_COVER_CHAPTER_MORE,
  CLIENT_COVER_CHAPTER_NUM_01,
  CLIENT_COVER_CHAPTER_SESSION,
  CLIENT_COVER_CHIP_DONE_PREFIX,
  CLIENT_COVER_CHIP_DONE_SUFFIX,
  CLIENT_COVER_CHIP_MONTH_PREFIX,
  CLIENT_COVER_CHIP_MONTH_SUFFIX,
  CLIENT_COVER_CHIP_REMAIN_PREFIX,
  CLIENT_COVER_CHIP_UNPAID_PREFIX,
  CLIENT_COVER_NO_PACKAGE,
  CLIENT_COVER_RECENT_PAYMENT_PREFIX,
  CLIENT_COVER_ROW_HISTORY,
  CLIENT_COVER_ROW_PAYMENT,
  CLIENT_COVER_ROW_REMAIN_SHORT,
  CLIENT_COVER_ROW_REMAINING,
  CLIENT_COVER_ROW_UNPAID,
  CLIENT_COVER_ROW_WAITING,
  CLIENT_COVER_SHEET_MODE
} from '../constants';

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const CardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

/**
 * @param {object} props
 * @param {string} props.sheetMode
 * @param {number} props.remainingSessions
 * @param {string} props.packageLabel
 * @param {number} props.pendingPaymentCount
 * @param {string|null} props.pendingLabel
 * @param {string|null} props.recentPaymentLabel
 * @param {number} props.thisMonthCompleted
 * @param {number} props.completedCount
 */
const SessionChapter = ({
  sheetMode,
  remainingSessions,
  packageLabel,
  pendingPaymentCount,
  pendingLabel,
  recentPaymentLabel,
  thisMonthCompleted,
  completedCount
}) => {
  const remain = toSafeNumber(remainingSessions);
  const pending = toSafeNumber(pendingPaymentCount);
  const isZero = sheetMode === CLIENT_COVER_SHEET_MODE.ZERO;
  const pkg = toDisplayString(packageLabel, CLIENT_COVER_NO_PACKAGE);
  const remainTitle = isZero ? CLIENT_COVER_ROW_REMAIN_SHORT : CLIENT_COVER_ROW_REMAINING;
  const remainSub = remain > 0 ? pkg : CLIENT_COVER_NO_PACKAGE;

  return (
    <section className="client-cover__chapter" aria-labelledby="client-cover-chap-session">
      <div className="client-cover__chap-head">
        <span className="client-cover__chap-num">{CLIENT_COVER_CHAPTER_NUM_01}</span>
        <h2 className="client-cover__chap-title" id="client-cover-chap-session">
          {CLIENT_COVER_CHAPTER_SESSION}
        </h2>
        {!isZero ? (
          <Link
            className="client-cover__chap-more"
            to={CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT}
          >
            {CLIENT_COVER_CHAPTER_MORE}
          </Link>
        ) : null}
      </div>
      <div className="client-cover__dense">
        <Link
          className="client-cover__row"
          to={CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT}
        >
          <span className="client-cover__row-ico" aria-hidden="true">
            <ClockIcon />
          </span>
          <span className="client-cover__row-txt">
            <span className="client-cover__row-t">{remainTitle}</span>
            <span className="client-cover__row-s">
              <SafeText>{remainSub}</SafeText>
            </span>
          </span>
          <span className="client-cover__row-val">
            <SafeText>{remain}</SafeText>
          </span>
          <span className="client-cover__row-chev" aria-hidden="true">›</span>
        </Link>
        <Link
          className="client-cover__row"
          to={CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY}
        >
          <span className="client-cover__row-ico" aria-hidden="true">
            <CardIcon />
          </span>
          <span className="client-cover__row-txt">
            <span className="client-cover__row-t">
              {pending > 0 ? CLIENT_COVER_ROW_UNPAID : CLIENT_COVER_ROW_PAYMENT}
            </span>
            <span className="client-cover__row-s">
              {pending > 0 ? (
                <SafeText>{pendingLabel || CLIENT_COVER_ROW_WAITING}</SafeText>
              ) : recentPaymentLabel ? (
                <SafeText>
                  {`${CLIENT_COVER_RECENT_PAYMENT_PREFIX} ${recentPaymentLabel}`}
                </SafeText>
              ) : (
                <SafeText fallback="—">—</SafeText>
              )}
            </span>
          </span>
          {pending > 0 ? (
            <span className="client-cover__row-val client-cover__row-val--amber">
              {CLIENT_COVER_ROW_WAITING}
            </span>
          ) : (
            <span className="client-cover__row-val client-cover__row-val--mute">
              {CLIENT_COVER_ROW_HISTORY}
            </span>
          )}
          <span className="client-cover__row-chev" aria-hidden="true">›</span>
        </Link>
        <div className="client-cover__chips">
          {pending > 0 ? (
            <span className="client-cover__chip client-cover__chip--amber">
              {CLIENT_COVER_CHIP_UNPAID_PREFIX}
              {' '}
              <span className="client-cover__chip-n">{pending}</span>
            </span>
          ) : (
            <span className="client-cover__chip client-cover__chip--teal">
              {CLIENT_COVER_CHIP_REMAIN_PREFIX}
              {' '}
              <span className="client-cover__chip-n">{remain}</span>
            </span>
          )}
          {isZero ? (
            <span className="client-cover__chip">
              {CLIENT_COVER_CHIP_DONE_PREFIX}
              {' '}
              <span className="client-cover__chip-n">{toSafeNumber(completedCount)}</span>
              {CLIENT_COVER_CHIP_DONE_SUFFIX}
            </span>
          ) : (
            <span className="client-cover__chip">
              {CLIENT_COVER_CHIP_MONTH_PREFIX}
              {' '}
              <span className="client-cover__chip-n">{toSafeNumber(thisMonthCompleted)}</span>
              {CLIENT_COVER_CHIP_MONTH_SUFFIX}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

SessionChapter.propTypes = {
  sheetMode: PropTypes.string.isRequired,
  remainingSessions: PropTypes.number,
  packageLabel: PropTypes.string,
  pendingPaymentCount: PropTypes.number,
  pendingLabel: PropTypes.string,
  recentPaymentLabel: PropTypes.string,
  thisMonthCompleted: PropTypes.number,
  completedCount: PropTypes.number
};

export default SessionChapter;
