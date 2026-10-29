/**
 * 플로팅 next-sheet — has / zero / quiet (직접예약 CTA 금지)
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import MGButton from '../../../common/MGButton';
import SafeText from '../../../common/SafeText';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';
import { CLIENT_DASHBOARD_ROUTES } from '../../../../constants/clientDashboardRoutes';
import { CLIENT_SHOP_ROUTES } from '../../../../constants/clientShopConstants';
import {
  CLIENT_COVER_BADGE_UNPAID_PREFIX,
  CLIENT_COVER_CONSULTANT_SUFFIX,
  CLIENT_COVER_CTA_PAY,
  CLIENT_COVER_CTA_PICK_SESSION,
  CLIENT_COVER_CTA_VIEW_SCHEDULE,
  CLIENT_COVER_NEXT_SHEET_TEST_ID,
  CLIENT_COVER_QUIET_META,
  CLIENT_COVER_SESSION_UNIT,
  CLIENT_COVER_SHEET_KICKER_NEXT,
  CLIENT_COVER_SHEET_KICKER_REMAINING,
  CLIENT_COVER_SHEET_MODE,
  CLIENT_COVER_ZERO_META,
  CLIENT_SCHEDULE_STATUS_LABELS
} from '../constants';
import {
  formatCoverSheetDomTime,
  resolveCenterMemo,
  resolveConsultationMethodLabel,
  resolveScheduleConsultantName,
  resolveScheduleDurationMinutes
} from '../lobbyViewModel';

/**
 * @param {object} props
 * @param {string} props.sheetMode
 * @param {object|null} props.nextSchedule
 * @param {number} props.remainingSessions
 * @param {number} props.pendingPaymentCount
 * @param {string} [props.className]
 */
const NextSheet = ({
  sheetMode,
  nextSchedule,
  remainingSessions,
  pendingPaymentCount,
  className = ''
}) => {
  const navigate = useNavigate();
  const remain = toSafeNumber(remainingSessions);
  const pending = toSafeNumber(pendingPaymentCount);
  const rootClass = ['client-cover__sheet', className].filter(Boolean).join(' ');

  if (sheetMode === CLIENT_COVER_SHEET_MODE.HAS && nextSchedule) {
    const consultantName = resolveScheduleConsultantName(nextSchedule);
    const duration = resolveScheduleDurationMinutes(nextSchedule);
    const method = resolveConsultationMethodLabel(nextSchedule);
    const memo = resolveCenterMemo(nextSchedule);
    const statusCode = toDisplayString(nextSchedule.status, 'CONFIRMED').toUpperCase();
    const statusLabel = CLIENT_SCHEDULE_STATUS_LABELS[statusCode]
      || CLIENT_SCHEDULE_STATUS_LABELS.CONFIRMED;
    const body = `${consultantName} ${CLIENT_COVER_CONSULTANT_SUFFIX} · ${method} ${duration}분`;

    return (
      <article
        className={rootClass}
        data-testid={CLIENT_COVER_NEXT_SHEET_TEST_ID}
        data-sheet-mode={CLIENT_COVER_SHEET_MODE.HAS}
      >
        <div className="client-cover__sheet-kicker">
          <span className="client-cover__sheet-lab">{CLIENT_COVER_SHEET_KICKER_NEXT}</span>
          <span className="client-cover__badge client-cover__badge--ok">{statusLabel}</span>
        </div>
        <p className="client-cover__sheet-dom">
          <SafeText>{formatCoverSheetDomTime(nextSchedule)}</SafeText>
        </p>
        <p className="client-cover__sheet-body">
          <SafeText>{body}</SafeText>
        </p>
        {memo ? (
          <p className="client-cover__sheet-meta">
            <SafeText>{memo}</SafeText>
          </p>
        ) : (
          <p className="client-cover__sheet-meta" aria-hidden="true">&nbsp;</p>
        )}
        <div className="client-cover__cta-row">
          <MGButton
            variant="primary"
            className="client-cover__cta client-cover__cta--primary"
            preventDoubleClick={false}
            onClick={() => navigate(CLIENT_DASHBOARD_ROUTES.SCHEDULE)}
          >
            {CLIENT_COVER_CTA_VIEW_SCHEDULE}
          </MGButton>
        </div>
      </article>
    );
  }

  if (sheetMode === CLIENT_COVER_SHEET_MODE.ZERO) {
    return (
      <article
        className={rootClass}
        data-testid={CLIENT_COVER_NEXT_SHEET_TEST_ID}
        data-sheet-mode={CLIENT_COVER_SHEET_MODE.ZERO}
      >
        <div className="client-cover__sheet-kicker">
          <span className="client-cover__sheet-lab">{CLIENT_COVER_SHEET_KICKER_REMAINING}</span>
          {pending > 0 ? (
            <span className="client-cover__badge client-cover__badge--amber">
              {CLIENT_COVER_BADGE_UNPAID_PREFIX}
              {' '}
              {pending}
            </span>
          ) : null}
        </div>
        <p className="client-cover__sheet-dom client-cover__sheet-dom--zero">
          <SafeText>{remain}</SafeText>
          <span className="client-cover__sheet-unit">{CLIENT_COVER_SESSION_UNIT}</span>
        </p>
        <p className="client-cover__sheet-meta">{CLIENT_COVER_ZERO_META}</p>
        <div className="client-cover__cta-row">
          <MGButton
            variant="primary"
            className="client-cover__cta client-cover__cta--primary"
            preventDoubleClick={false}
            onClick={() => navigate(CLIENT_SHOP_ROUTES.CATALOG)}
          >
            {CLIENT_COVER_CTA_PICK_SESSION}
          </MGButton>
          <MGButton
            variant="outline"
            className="client-cover__cta client-cover__cta--ghost"
            preventDoubleClick={false}
            onClick={() => navigate(CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY)}
          >
            {CLIENT_COVER_CTA_PAY}
          </MGButton>
        </div>
      </article>
    );
  }

  return (
    <article
      className={rootClass}
      data-testid={CLIENT_COVER_NEXT_SHEET_TEST_ID}
      data-sheet-mode={CLIENT_COVER_SHEET_MODE.QUIET}
    >
      <div className="client-cover__sheet-kicker">
        <span className="client-cover__sheet-lab">{CLIENT_COVER_SHEET_KICKER_REMAINING}</span>
        {pending > 0 ? (
          <span className="client-cover__badge client-cover__badge--amber">
            {CLIENT_COVER_BADGE_UNPAID_PREFIX}
            {' '}
            {pending}
          </span>
        ) : null}
      </div>
      <p className="client-cover__sheet-dom client-cover__sheet-dom--zero">
        <SafeText>{remain}</SafeText>
        <span className="client-cover__sheet-unit">{CLIENT_COVER_SESSION_UNIT}</span>
      </p>
      <p className="client-cover__sheet-meta">{CLIENT_COVER_QUIET_META}</p>
      <div className="client-cover__cta-row">
        <MGButton
          variant="primary"
          className="client-cover__cta client-cover__cta--primary"
          preventDoubleClick={false}
          onClick={() => navigate(CLIENT_DASHBOARD_ROUTES.SCHEDULE)}
        >
          {CLIENT_COVER_CTA_VIEW_SCHEDULE}
        </MGButton>
      </div>
    </article>
  );
};

NextSheet.propTypes = {
  sheetMode: PropTypes.string.isRequired,
  nextSchedule: PropTypes.object,
  remainingSessions: PropTypes.number,
  pendingPaymentCount: PropTypes.number,
  className: PropTypes.string
};

export default NextSheet;
