/**
 * 어드민 주문 상세 모달 — 본문(UnifiedModal children) + 하단(actions)
 * 돈·회기 쌍 패널, 정보 4×2, 미니 원장, 처리 기록, PortOne 안내.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Info } from 'lucide-react';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import {
  ADMIN_SHOP_ORDER_DETAIL_COPY,
  ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT,
  ADMIN_SHOP_ORDER_DETAIL_TEST_IDS,
  ADMIN_SHOP_ORDER_STATUS_PAID,
  ADMIN_SHOP_REFUND_PG_HINT,
  ADMIN_SHOP_RECONCILE_REFUND_COPY,
  ADMIN_SHOP_RECONCILE_REFUND_TEST_IDS,
  canAdminShopOrderPrimaryRefund,
  isAdminShopPgCancelled,
  resolveAdminShopOrderAmount
} from '../../../constants/adminShopApi';
import {
  formatShopFulfillmentBadge,
  hasShopFulfillmentRetryableLine,
  SHOP_FULFILLMENT_RETRY_COPY,
  SHOP_FULFILLMENT_RETRY_TEST_IDS
} from '../../../constants/clientShopConstants';
import {
  ADMIN_SHOP_LEDGER_STATE,
  ADMIN_SHOP_ORDER_EVENT_LABELS,
  ADMIN_SHOP_ORDER_EXTENDABLE_STATES,
  ADMIN_SHOP_ORDER_MODAL_COPY,
  ADMIN_SHOP_PAY_METHOD_LABELS,
  ADMIN_SHOP_SUITE_TEST_IDS,
  formatAdminShopCopy
} from '../../../constants/adminShopSuite';
import { toDisplayString } from '../../../utils/safeDisplay';
import { formatShopDateTime, formatShopMoney } from '../../../utils/clientShopFormat';
import {
  ADMIN_SHOP_SESSION_DELTA_KIND,
  formatAdminShopDate,
  formatAdminShopOrderShortId,
  maskAdminShopClientName,
  resolveAdminShopClientName,
  resolveAdminShopLedgerState,
  resolveAdminShopOrderSessionCount,
  resolveAdminShopSessionDelta
} from '../../../utils/adminShopSuite';
import { AdminShopLedgerChip, AdminShopNotice, AdminShopPairPanel } from './AdminShopSuiteParts';

const EMPTY = ADMIN_SHOP_ORDER_MODAL_COPY.EMPTY_VALUE;
const EVENT_NOTE_SEPARATOR = ' · ';

/** 결제된 돈이 잡히는 상태 (결제 완료·만료 임박·기한 만료) */
const COLLECTED_STATES = Object.freeze([
  ADMIN_SHOP_LEDGER_STATE.PAID,
  ADMIN_SHOP_LEDGER_STATE.EXPIRING_SOON,
  ADMIN_SHOP_LEDGER_STATE.EXPIRED
]);

/**
 * 주문 상세에서 파생되는 표시·동작 게이트 (본문·하단 공유).
 *
 * @param {object} detail
 * @param {Array<object>} detailEvents
 * @returns {object}
 */
export function resolveAdminShopOrderDetailGates(detail, detailEvents) {
  const state = resolveAdminShopLedgerState(detail, detail);
  const canRefund = canAdminShopOrderPrimaryRefund(detail);
  const canFulfillRetry =
    detail.status === ADMIN_SHOP_ORDER_STATUS_PAID
    && hasShopFulfillmentRetryableLine(detailEvents);
  const canReconcileRefund =
    detail.status === ADMIN_SHOP_ORDER_STATUS_PAID
    && detail.paymentStatus === 'APPROVED';
  const usedRaw = detail.usedCount ?? detail.usedSessionCount;
  const usedCount = usedRaw != null && Number.isFinite(Number(usedRaw)) ? Number(usedRaw) : null;
  return {
    state,
    isCollected: COLLECTED_STATES.includes(state),
    isReconcile: state === ADMIN_SHOP_LEDGER_STATE.RECONCILE,
    canRefund: canRefund && COLLECTED_STATES.includes(state),
    canExtend: ADMIN_SHOP_ORDER_EXTENDABLE_STATES.includes(state) && Boolean(detail.expireDate),
    canFulfillRetry,
    canReconcileRefund,
    usedCount
  };
}

/**
 * 모달 제목 (주문 상세 · 짧은 주문번호 · 상태 칩).
 *
 * @param {{ detail: object|null }} props
 * @returns {JSX.Element}
 */
export function AdminShopOrderDetailTitle({ detail }) {
  if (!detail) {
    return <span>{ADMIN_SHOP_ORDER_MODAL_COPY.TITLE}</span>;
  }
  return (
    <span className="admin-shop-suite__modal-title">
      <span>{ADMIN_SHOP_ORDER_MODAL_COPY.TITLE}</span>
      <span className="admin-shop-suite__mono">
        <SafeText>{formatAdminShopOrderShortId(detail.orderPublicId)}</SafeText>
      </span>
      <AdminShopLedgerChip
        state={resolveAdminShopLedgerState(detail, detail)}
        daysLeft={detail.daysLeft != null ? Number(detail.daysLeft) : null}
      />
      <span className="admin-shop-suite__muted">
        <SafeText>{formatShopDateTime(detail.paidAt ?? detail.createdAt) || ''}</SafeText>
      </span>
    </span>
  );
}

AdminShopOrderDetailTitle.propTypes = {
  detail: PropTypes.object
};

AdminShopOrderDetailTitle.defaultProps = {
  detail: null
};

/**
 * @param {{ label: string, children: React.ReactNode, testId?: string }} props
 * @returns {JSX.Element}
 */
function InfoCard({ label, children, testId, wide }) {
  return (
    <div
      className={`admin-shop-order-detail__info-card${wide ? ' admin-shop-order-detail__info-card--wide' : ''}`}
      data-testid={testId}
    >
      <span className="admin-shop-order-detail__info-label">
        <SafeText>{label}</SafeText>
      </span>
      <span className="admin-shop-order-detail__info-value">{children}</span>
    </div>
  );
}

InfoCard.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  testId: PropTypes.string,
  wide: PropTypes.bool
};

InfoCard.defaultProps = {
  testId: undefined
};

/**
 * @param {object} detail
 * @returns {string}
 */
function resolveClientDisplay(detail) {
  const masked = maskAdminShopClientName(resolveAdminShopClientName(detail));
  if (masked) {
    return masked;
  }
  if (detail.clientId != null) {
    return String(detail.clientId);
  }
  return EMPTY;
}

/**
 * @param {object} detail
 * @returns {string}
 */
function resolvePayMethod(detail) {
  const method = toDisplayString(detail.payMethod ?? detail.paymentMethod, '').toUpperCase();
  if (method) {
    return ADMIN_SHOP_PAY_METHOD_LABELS[method] || method;
  }
  return toDisplayString(detail.paymentProvider, '') || EMPTY;
}

/**
 * @param {{ kind: string, count: number|null }} delta
 * @returns {{ text: string, tone: string|null }}
 */
function resolvePairSessions(delta) {
  if (delta.count == null) {
    return { text: EMPTY, tone: 'dim' };
  }
  switch (delta.kind) {
    case ADMIN_SHOP_SESSION_DELTA_KIND.GRANT:
      return { text: `+${delta.count} ${ADMIN_SHOP_ORDER_MODAL_COPY.SESSION_GRANTED_SUFFIX}`, tone: null };
    case ADMIN_SHOP_SESSION_DELTA_KIND.RESTORE:
      return { text: `−${delta.count} ${ADMIN_SHOP_ORDER_MODAL_COPY.SESSION_RESTORED_SUFFIX}`, tone: 'out' };
    case ADMIN_SHOP_SESSION_DELTA_KIND.WAITING:
    case ADMIN_SHOP_SESSION_DELTA_KIND.UNREFLECTED:
      return { text: `(+${delta.count}) ${ADMIN_SHOP_ORDER_MODAL_COPY.SESSION_WAITING_SUFFIX}`, tone: 'dim' };
    default:
      return { text: EMPTY, tone: 'dim' };
  }
}

/**
 * @param {object} ev
 * @returns {string}
 */
function resolveEventLabel(ev) {
  const status = toDisplayString(ev.status, '').toUpperCase();
  return ADMIN_SHOP_ORDER_EVENT_LABELS[status] || formatShopFulfillmentBadge(ev);
}

/**
 * 처리 기록 행 — 이행 이벤트(한글 라벨) + 기한 연장 이력.
 *
 * @param {Array<object>} detailEvents
 * @param {Array<object>} extensions 최신 먼저
 * @returns {Array<{ key: string, at: string, label: string, note: string }>}
 */
export function buildAdminShopOrderTimeline(detailEvents, extensions) {
  const events = (Array.isArray(detailEvents) ? detailEvents : []).map((ev, index) => ({
    key: `fulfill-${ev.skuCode}-${ev.status}-${index}`,
    at: formatShopDateTime(ev.createdAt) || EMPTY,
    label: resolveEventLabel(ev),
    note: toDisplayString(ev.skuCode, '')
  }));
  const extended = (Array.isArray(extensions) ? [...extensions] : []).reverse().map((ext) => ({
    key: `extend-${ext.id}`,
    at: formatShopDateTime(ext.extendedAt) || EMPTY,
    label: ADMIN_SHOP_ORDER_MODAL_COPY.EVENT_EXTENDED,
    note: [
      formatAdminShopCopy(ADMIN_SHOP_ORDER_MODAL_COPY.EVENT_EXTENDED_NOTE, {
        previous: formatAdminShopDate(ext.previousExpireDate) || EMPTY,
        next: formatAdminShopDate(ext.newExpireDate) || EMPTY
      }),
      toDisplayString(ext.extendedByName, ''),
      toDisplayString(ext.reason, '')
    ].filter(Boolean).join(EVENT_NOTE_SEPARATOR)
  }));
  return [...events, ...extended];
}

/**
 * 사용 기한 칸 값.
 *
 * @param {object} detail
 * @param {string} state
 * @returns {string}
 */
function resolveExpiryText(detail, state) {
  const date = formatAdminShopDate(detail.expireDate);
  if (!date) {
    return COLLECTED_STATES.includes(state) ? ADMIN_SHOP_ORDER_MODAL_COPY.EXPIRES_AT_NONE : EMPTY;
  }
  const template = state === ADMIN_SHOP_LEDGER_STATE.EXPIRED
    ? ADMIN_SHOP_ORDER_MODAL_COPY.EXPIRES_AT_EXPIRED
    : ADMIN_SHOP_ORDER_MODAL_COPY.EXPIRES_AT_VALUE;
  return formatAdminShopCopy(template, { date });
}

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
function AdminShopOrderDetailModal({
  detail,
  detailLines,
  detailEvents,
  onFulfillRetry,
  onReconcileRefund,
  onCopyOrderId,
  onExtend,
  canManageExpiry,
  refunding,
  deleting,
  fulfillRetrying,
  reconcileRefunding,
  refundError,
  portOneHint
}) {
  const { state, isCollected, isReconcile, canExtend, canFulfillRetry, canReconcileRefund, usedCount } =
    resolveAdminShopOrderDetailGates(detail, detailEvents);
  const pgAlreadyCancelled = isAdminShopPgCancelled(detail.pgStatus);
  const anyBusy = refunding || deleting || fulfillRetrying || reconcileRefunding;

  const orderAmount = resolveAdminShopOrderAmount(detail);
  const amountText = orderAmount != null ? formatShopMoney(orderAmount) : EMPTY;
  const sessionCount = resolveAdminShopOrderSessionCount(detail, detail);
  const pairSessions = resolvePairSessions(resolveAdminShopSessionDelta(state, sessionCount));
  const paymentIdText = detail.paymentId ? toDisplayString(detail.paymentId, '') : EMPTY;
  const consultant = toDisplayString(detail.consultantName, '') || EMPTY;
  const mapping = detail.mappingId != null ? `#${toDisplayString(detail.mappingId, '')}` : EMPTY;
  const payMethod = resolvePayMethod(detail);
  const extendCount = Number(detail.extensionCount) || 0;
  const extendText = extendCount > 0 && detail.originalExpireDate
    ? formatAdminShopCopy(ADMIN_SHOP_ORDER_MODAL_COPY.EXTEND_INFO, {
      count: extendCount,
      date: formatAdminShopDate(detail.originalExpireDate)
    })
    : '';
  const expiresText = resolveExpiryText(detail, state);
  const timeline = buildAdminShopOrderTimeline(detailEvents, detail.expiryExtensions);
  const showExtend = canManageExpiry && canExtend && typeof onExtend === 'function';
  const quietHint = isReconcile
    ? ADMIN_SHOP_ORDER_MODAL_COPY.RECONCILE_BOX
    : (portOneHint || ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT);
  const reconcileHint = pgAlreadyCancelled
    ? ADMIN_SHOP_RECONCILE_REFUND_COPY.ALREADY_PG_CANCELLED_SYNC
    : ADMIN_SHOP_RECONCILE_REFUND_COPY.HINT;

  return (
    <div
      className="admin-shop-order-detail admin-shop-suite admin-shop-clinic-os"
      data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.ROOT}
    >
      {refundError ? (
        <AdminShopNotice tone="error" testId={ADMIN_SHOP_SUITE_TEST_IDS.ORDER_REFUND_ERROR}>
          <p>
            <strong>{ADMIN_SHOP_ORDER_MODAL_COPY.REFUND_FAILED_TITLE}</strong>
            {' '}
            <SafeText>{refundError}</SafeText>
            {' '}
            <SafeText>{ADMIN_SHOP_ORDER_MODAL_COPY.REFUND_FAILED_TAIL}</SafeText>
          </p>
          {canReconcileRefund ? (
            <button
              type="button"
              className="admin-shop-suite__link-btn"
              disabled={anyBusy}
              onClick={() => onReconcileRefund(false)}
            >
              {ADMIN_SHOP_ORDER_MODAL_COPY.REFUND_FAILED_ACTION}
            </button>
          ) : null}
        </AdminShopNotice>
      ) : null}

      <AdminShopPairPanel
        amountLabel={ADMIN_SHOP_ORDER_MODAL_COPY.PAIR_AMOUNT}
        amountText={amountText}
        amountTone={isCollected ? null : 'dim'}
        amountCaption={payMethod === EMPTY ? '' : payMethod}
        sessionsLabel={ADMIN_SHOP_ORDER_MODAL_COPY.PAIR_SESSIONS}
        sessionsText={pairSessions.text}
        sessionsTone={pairSessions.tone}
      />

      <div
        className="admin-shop-order-detail__info-grid admin-shop-suite__info-grid"
        data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.INFO_GRID}
      >
        <InfoCard label={ADMIN_SHOP_ORDER_DETAIL_COPY.ORDER_ID}>
          <span className="admin-shop-suite__mono">
            <SafeText>{toDisplayString(detail.orderPublicId, '') || EMPTY}</SafeText>
          </span>
          {onCopyOrderId ? (
            <button
              type="button"
              className="admin-shop-suite__copy-btn"
              onClick={() => onCopyOrderId(detail.orderPublicId)}
            >
              {ADMIN_SHOP_ORDER_MODAL_COPY.COPY}
            </button>
          ) : null}
        </InfoCard>
        <InfoCard label={ADMIN_SHOP_ORDER_DETAIL_COPY.CLIENT}>
          <SafeText>{resolveClientDisplay(detail)}</SafeText>
        </InfoCard>
        <InfoCard
          label={ADMIN_SHOP_ORDER_DETAIL_COPY.PAYMENT_ID}
          testId={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.PAYMENT_ID}
        >
          <span className="admin-shop-suite__mono"><SafeText>{paymentIdText}</SafeText></span>
        </InfoCard>
        <InfoCard label={ADMIN_SHOP_ORDER_DETAIL_COPY.ORDER_STATUS}>
          <AdminShopLedgerChip state={state} daysLeft={detail.daysLeft != null ? Number(detail.daysLeft) : null} />
        </InfoCard>
        <InfoCard label={ADMIN_SHOP_ORDER_MODAL_COPY.EXPIRES_AT} wide testId={ADMIN_SHOP_SUITE_TEST_IDS.ORDER_EXPIRY_CELL}>
          <span className="admin-shop-suite__expiry-cell">
            <span className="admin-shop-suite__cell-stack">
              <SafeText>{expiresText}</SafeText>
              {extendText ? <span className="admin-shop-suite__muted"><SafeText>{extendText}</SafeText></span> : null}
            </span>
            {showExtend ? (
              <MGButton
                type="button"
                variant="secondary"
                className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm' })}
                disabled={anyBusy}
                onClick={onExtend}
                data-testid={ADMIN_SHOP_SUITE_TEST_IDS.ORDER_EXTEND_BUTTON}
              >
                {ADMIN_SHOP_ORDER_MODAL_COPY.EXTEND_BUTTON}
              </MGButton>
            ) : null}
          </span>
        </InfoCard>
        <InfoCard label={ADMIN_SHOP_ORDER_MODAL_COPY.CONSULTANT}>
          <SafeText>{consultant}</SafeText>
        </InfoCard>
        <InfoCard label={ADMIN_SHOP_ORDER_MODAL_COPY.MAPPING}>
          <span className="admin-shop-suite__mono"><SafeText>{mapping}</SafeText></span>
        </InfoCard>
      </div>

      <section className="admin-shop-order-detail__section">
        <div className="admin-shop-suite__section-head">
          <h3 className="admin-shop-order-detail__section-title">
            {ADMIN_SHOP_ORDER_DETAIL_COPY.LINES_TITLE}
          </h3>
          <span className="admin-shop-suite__muted">{ADMIN_SHOP_ORDER_MODAL_COPY.LINES_HINT}</span>
        </div>
        {detailLines.length === 0 ? (
          <p className="admin-shop-suite__muted">{ADMIN_SHOP_ORDER_DETAIL_COPY.LINES_EMPTY}</p>
        ) : (
          <table className="admin-shop-suite__ledger">
            <thead>
              <tr>
                <th scope="col">{ADMIN_SHOP_ORDER_MODAL_COPY.LINE_COL_PRODUCT}</th>
                <th scope="col" className="admin-shop-suite__cell--right">{ADMIN_SHOP_ORDER_MODAL_COPY.LINE_COL_SESSIONS}</th>
                <th scope="col" className="admin-shop-suite__cell--right">{ADMIN_SHOP_ORDER_MODAL_COPY.LINE_COL_QTY}</th>
                <th scope="col" className="admin-shop-suite__cell--right">{ADMIN_SHOP_ORDER_MODAL_COPY.LINE_COL_AMOUNT}</th>
              </tr>
            </thead>
            <tbody>
              {detailLines.map((line) => {
                const productName = line.title || line.skuCode || EMPTY;
                return (
                  <tr key={`line-${line.lineNo}-${line.skuCode}`}>
                    <td><SafeText>{productName}</SafeText></td>
                    <td className="admin-shop-suite__cell--right admin-shop-suite__num">
                      <SafeText>{line.sessionCount != null ? String(line.sessionCount) : EMPTY}</SafeText>
                    </td>
                    <td className="admin-shop-suite__cell--right admin-shop-suite__num">
                      <SafeText>{toDisplayString(line.quantity, '0')}</SafeText>
                    </td>
                    <td className="admin-shop-suite__cell--right admin-shop-suite__num">
                      <SafeText>{formatShopMoney(line.lineTotalMinor)}</SafeText>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-shop-order-detail__section">
        <div className="admin-shop-suite__section-head">
          <h3 className="admin-shop-order-detail__section-title">
            {ADMIN_SHOP_ORDER_MODAL_COPY.EVENTS_TITLE}
          </h3>
          <span className="admin-shop-suite__muted">{ADMIN_SHOP_ORDER_MODAL_COPY.EVENTS_HINT}</span>
        </div>
        {timeline.length === 0 ? (
          <p className="admin-shop-suite__muted">{ADMIN_SHOP_ORDER_DETAIL_COPY.FULFILLMENT_EMPTY}</p>
        ) : (
          <ol
            className="admin-shop-order-detail__timeline"
            data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.TIMELINE}
          >
            {timeline.map((row, index) => {
              const isFirst = index === 0;
              return (
                <li
                  key={row.key}
                  className="admin-shop-order-detail__timeline-item"
                >
                  <span
                    className={
                      isFirst
                        ? 'admin-shop-order-detail__timeline-dot admin-shop-order-detail__timeline-dot--first'
                        : 'admin-shop-order-detail__timeline-dot'
                    }
                    data-testid={isFirst ? ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.TIMELINE_DOT_FIRST : undefined}
                    aria-hidden="true"
                  />
                  <div className="admin-shop-suite__events">
                    <span className="admin-shop-suite__events-at"><SafeText>{row.at}</SafeText></span>
                    <span className="admin-shop-order-detail__timeline-type">
                      <SafeText>{row.label}</SafeText>
                    </span>
                    <span className="admin-shop-suite__events-note">
                      <SafeText>{row.note}</SafeText>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {canFulfillRetry ? (
        <div className="admin-shop-suite__header-actions">
          <MGButton
            type="button"
            variant="ghost"
            className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md' })}
            disabled={anyBusy}
            loading={fulfillRetrying}
            loadingText={SHOP_FULFILLMENT_RETRY_COPY.BUTTON}
            preventDoubleClick
            onClick={onFulfillRetry}
            data-testid={SHOP_FULFILLMENT_RETRY_TEST_IDS.ADMIN_BUTTON}
          >
            {SHOP_FULFILLMENT_RETRY_COPY.BUTTON}
          </MGButton>
          <span className="admin-shop-suite__muted" data-testid={SHOP_FULFILLMENT_RETRY_TEST_IDS.HINT}>
            {SHOP_FULFILLMENT_RETRY_COPY.HINT}
          </span>
        </div>
      ) : null}

      {usedCount != null && usedCount > 0 && isCollected ? (
        <AdminShopNotice tone="amber" icon={<AlertTriangle size={14} aria-hidden="true" />}>
          <p>
            <strong>
              {formatAdminShopCopy(ADMIN_SHOP_ORDER_MODAL_COPY.USED_WARNING_LEAD, { usedCount })}
            </strong>
            {' '}
            {ADMIN_SHOP_ORDER_MODAL_COPY.USED_WARNING_TAIL}
          </p>
        </AdminShopNotice>
      ) : null}

      {isCollected || isReconcile ? (
        <div
          className="admin-shop-order-detail__portone"
          data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.PORTONE_HINT}
          title={ADMIN_SHOP_REFUND_PG_HINT}
        >
          <Info size={14} aria-hidden="true" className="admin-shop-order-detail__portone-icon" />
          <p className="admin-shop-order-detail__portone-text">
            <SafeText>{quietHint}</SafeText>
          </p>
        </div>
      ) : null}

      {canReconcileRefund ? (
        <p className="admin-shop-suite__muted" data-testid={ADMIN_SHOP_RECONCILE_REFUND_TEST_IDS.HINT}>
          <SafeText>{reconcileHint}</SafeText>
        </p>
      ) : null}
    </div>
  );
}

AdminShopOrderDetailModal.propTypes = {
  detail: PropTypes.object.isRequired,
  detailLines: PropTypes.array,
  detailEvents: PropTypes.array,
  onFulfillRetry: PropTypes.func,
  onReconcileRefund: PropTypes.func,
  onCopyOrderId: PropTypes.func,
  onExtend: PropTypes.func,
  canManageExpiry: PropTypes.bool,
  refunding: PropTypes.bool,
  deleting: PropTypes.bool,
  fulfillRetrying: PropTypes.bool,
  reconcileRefunding: PropTypes.bool,
  refundError: PropTypes.string,
  portOneHint: PropTypes.string
};

AdminShopOrderDetailModal.defaultProps = {
  detailLines: [],
  detailEvents: [],
  onFulfillRetry: undefined,
  onReconcileRefund: undefined,
  onCopyOrderId: undefined,
  onExtend: undefined,
  canManageExpiry: false,
  refunding: false,
  deleting: false,
  fulfillRetrying: false,
  reconcileRefunding: false,
  refundError: '',
  portOneHint: ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT
};

/**
 * 모달 하단 — 왼쪽 강제 정합 링크, 오른쪽 닫기·환불 정합·전액 환불(벽돌 외곽선).
 * 정합 필요: 환불 정합이 주 버튼, 전액 환불 숨김. 대기·만료·환불 완료: 닫기만.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export function AdminShopOrderDetailFooter({
  detail,
  detailEvents,
  onClose,
  onRefund,
  onReconcileRefund,
  closeLabel,
  refunding,
  deleting,
  fulfillRetrying,
  reconcileRefunding
}) {
  const anyBusy = refunding || deleting || fulfillRetrying || reconcileRefunding;
  const gates = detail
    ? resolveAdminShopOrderDetailGates(detail, detailEvents)
    : { isReconcile: false, canRefund: false, canReconcileRefund: false };
  const showRefund = Boolean(detail) && canAdminShopOrderPrimaryRefund(detail) && gates.canRefund;
  const reconcileVariant = gates.isReconcile ? 'primary' : 'secondary';
  return (
    <div className="admin-shop-suite__modal-footer" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.ORDER_MODAL_FOOTER}>
      {gates.canReconcileRefund ? (
        <button
          type="button"
          className="admin-shop-suite__force-link admin-shop-order-detail__force-reconcile"
          disabled={anyBusy}
          title={ADMIN_SHOP_RECONCILE_REFUND_COPY.FORCE_BUTTON}
          onClick={() => onReconcileRefund(true)}
          data-testid={ADMIN_SHOP_RECONCILE_REFUND_TEST_IDS.FORCE_BUTTON}
        >
          {ADMIN_SHOP_ORDER_MODAL_COPY.FORCE_RECONCILE_LINK}
        </button>
      ) : <span />}
      <div className="admin-shop-suite__modal-footer-right">
        <MGButton
          type="button"
          variant="outline"
          className={buildErpMgButtonClassName({ variant: 'outline', size: 'md' })}
          onClick={onClose}
          disabled={anyBusy}
        >
          {closeLabel}
        </MGButton>
        {gates.canReconcileRefund ? (
          <MGButton
            type="button"
            variant={reconcileVariant}
            className={buildErpMgButtonClassName({ variant: reconcileVariant, size: 'md' })}
            disabled={anyBusy}
            loading={reconcileRefunding}
            loadingText={ADMIN_SHOP_RECONCILE_REFUND_COPY.BUTTON}
            preventDoubleClick
            onClick={() => onReconcileRefund(false)}
            data-testid={ADMIN_SHOP_RECONCILE_REFUND_TEST_IDS.BUTTON}
          >
            {ADMIN_SHOP_RECONCILE_REFUND_COPY.BUTTON}
          </MGButton>
        ) : null}
        {showRefund ? (
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              className: 'admin-shop-suite__btn-brick-outline'
            })}
            disabled={anyBusy}
            onClick={onRefund}
            data-testid={ADMIN_SHOP_SUITE_TEST_IDS.ORDER_REFUND_OUTLINE}
          >
            {ADMIN_SHOP_ORDER_MODAL_COPY.REFUND_OUTLINE}
          </MGButton>
        ) : null}
      </div>
    </div>
  );
}

AdminShopOrderDetailFooter.propTypes = {
  detail: PropTypes.object,
  detailEvents: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onRefund: PropTypes.func.isRequired,
  onReconcileRefund: PropTypes.func.isRequired,
  closeLabel: PropTypes.string,
  refunding: PropTypes.bool,
  deleting: PropTypes.bool,
  fulfillRetrying: PropTypes.bool,
  reconcileRefunding: PropTypes.bool
};

AdminShopOrderDetailFooter.defaultProps = {
  detail: null,
  detailEvents: [],
  closeLabel: ADMIN_SHOP_ORDER_MODAL_COPY.CLOSE,
  refunding: false,
  deleting: false,
  fulfillRetrying: false,
  reconcileRefunding: false
};

export default AdminShopOrderDetailModal;
