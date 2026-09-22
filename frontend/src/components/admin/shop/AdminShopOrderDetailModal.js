/**
 * Clinic-OS 어드민 주문 상세 모달 본문 (UnifiedModal children).
 * SSOT: docs/design-system/clinic-os-admin-order-detail-modal/
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Info } from 'lucide-react';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import {
  ADMIN_SHOP_ORDER_DETAIL_COPY,
  ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT,
  ADMIN_SHOP_ORDER_DETAIL_TEST_IDS,
  ADMIN_SHOP_ORDER_LINE_SESSION_LABEL,
  ADMIN_SHOP_ORDER_STATUS_LABELS,
  ADMIN_SHOP_ORDER_STATUS_PAID,
  ADMIN_SHOP_REFUND_PG_HINT,
  ADMIN_SHOP_RECONCILE_REFUND_COPY,
  ADMIN_SHOP_RECONCILE_REFUND_TEST_IDS,
  canAdminShopOrderPrimaryRefund,
  isAdminShopOrderDeletable,
  isAdminShopPgCancelled,
  resolveAdminShopOrderAmount
} from '../../../constants/adminShopApi';
import {
  formatShopFulfillmentBadge,
  formatShopSessionCountDisplay,
  hasShopFulfillmentRetryableLine,
  SHOP_FULFILLMENT_RETRY_COPY,
  SHOP_FULFILLMENT_RETRY_TEST_IDS
} from '../../../constants/clientShopConstants';
import { toDisplayString } from '../../../utils/safeDisplay';
import { formatShopDateTime, formatShopMoney } from '../../../utils/clientShopFormat';

/**
 * @param {string|null|undefined} status
 * @returns {string}
 */
function statusLabel(status) {
  const key = toDisplayString(status, '');
  return ADMIN_SHOP_ORDER_STATUS_LABELS[key] || key || '-';
}

/**
 * @param {object} detail
 * @returns {string}
 */
function resolveClientDisplay(detail) {
  if (detail?.clientName != null && String(detail.clientName).trim()) {
    return toDisplayString(detail.clientName, '');
  }
  if (detail?.clientId != null) {
    return String(detail.clientId);
  }
  return '-';
}

/**
 * @param {{ label: string, value: string, testId?: string }} props
 * @returns {JSX.Element}
 */
function InfoCard({ label, value, testId }) {
  return (
    <div className="admin-shop-order-detail__info-card" data-testid={testId}>
      <span className="admin-shop-order-detail__info-label">
        <SafeText>{label}</SafeText>
      </span>
      <span className="admin-shop-order-detail__info-value">
        <SafeText>{value}</SafeText>
      </span>
    </div>
  );
}

InfoCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  testId: PropTypes.string
};

InfoCard.defaultProps = {
  testId: undefined
};

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
function AdminShopOrderDetailModal({
  detail,
  detailLines,
  detailEvents,
  onRefund,
  onDelete,
  onFulfillRetry,
  onReconcileRefund,
  refunding,
  deleting,
  fulfillRetrying,
  reconcileRefunding,
  portOneHint
}) {
  const canRefund = canAdminShopOrderPrimaryRefund(detail);
  const canDelete = isAdminShopOrderDeletable(detail.status, detail.deletable);
  const canFulfillRetry =
    detail.status === ADMIN_SHOP_ORDER_STATUS_PAID
    && hasShopFulfillmentRetryableLine(detailEvents);
  const canReconcileRefund =
    detail.status === ADMIN_SHOP_ORDER_STATUS_PAID
    && detail.paymentStatus === 'APPROVED';
  const pgAlreadyCancelled = isAdminShopPgCancelled(detail.pgStatus);
  const reconcileHint = pgAlreadyCancelled
    ? ADMIN_SHOP_RECONCILE_REFUND_COPY.ALREADY_PG_CANCELLED_SYNC
    : ADMIN_SHOP_RECONCILE_REFUND_COPY.HINT;
  const anyBusy = refunding || deleting || fulfillRetrying || reconcileRefunding;

  const orderAmount = resolveAdminShopOrderAmount(detail);
  const amountText = orderAmount != null ? formatShopMoney(orderAmount) : '-';
  const paymentIdText = detail.paymentId
    ? toDisplayString(detail.paymentId, '')
    : '-';
  const paymentStatusText = detail.paymentStatus
    ? toDisplayString(detail.paymentStatus, '')
    : '-';
  const quietHint = portOneHint || ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT;
  const hintTitle = ADMIN_SHOP_REFUND_PG_HINT;

  return (
    <div
      className="admin-shop-order-detail admin-shop-clinic-os"
      data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.ROOT}
    >
      <div
        className="admin-shop-order-detail__info-grid"
        data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.INFO_GRID}
      >
        <InfoCard
          label={ADMIN_SHOP_ORDER_DETAIL_COPY.ORDER_ID}
          value={toDisplayString(detail.orderPublicId, '') || '-'}
        />
        <InfoCard
          label={ADMIN_SHOP_ORDER_DETAIL_COPY.ORDER_STATUS}
          value={statusLabel(detail.status)}
        />
        <InfoCard
          label={ADMIN_SHOP_ORDER_DETAIL_COPY.CLIENT}
          value={resolveClientDisplay(detail)}
        />
        <InfoCard
          label={ADMIN_SHOP_ORDER_DETAIL_COPY.PAYMENT_ID}
          value={paymentIdText}
          testId={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.PAYMENT_ID}
        />
        <InfoCard
          label={ADMIN_SHOP_ORDER_DETAIL_COPY.PAYMENT_STATUS}
          value={paymentStatusText}
        />
        <InfoCard
          label={ADMIN_SHOP_ORDER_DETAIL_COPY.ORDER_AMOUNT}
          value={amountText}
        />
        <InfoCard
          label={ADMIN_SHOP_ORDER_DETAIL_COPY.ORDERED_AT}
          value={formatShopDateTime(detail.createdAt) || '-'}
        />
      </div>

      <div
        className="admin-shop-order-detail__portone"
        data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.PORTONE_HINT}
        title={hintTitle}
      >
        <Info
          size={14}
          aria-hidden="true"
          className="admin-shop-order-detail__portone-icon"
        />
        <p className="admin-shop-order-detail__portone-text">
          <SafeText>{quietHint}</SafeText>
        </p>
      </div>

      {(canRefund || canDelete || canFulfillRetry || canReconcileRefund) ? (
        <div
          className="admin-shop-order-detail__actions"
          data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.ACTIONS}
        >
          <div className="admin-shop-order-detail__actions-row">
            {canRefund ? (
              <MGButton
                type="button"
                variant="danger"
                className={`${buildErpMgButtonClassName({
                  variant: 'danger',
                  size: 'md'
                })} admin-shop-order-detail__action--refund-primary`}
                disabled={anyBusy}
                onClick={onRefund}
                data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.REFUND_PRIMARY}
              >
                {ADMIN_SHOP_ORDER_DETAIL_COPY.REFUND_PRIMARY}
              </MGButton>
            ) : null}
            {canReconcileRefund ? (
              <MGButton
                type="button"
                variant="ghost"
                className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md' })}
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
            {canFulfillRetry ? (
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
            ) : null}
            {canDelete ? (
              <MGButton
                type="button"
                variant="danger"
                className={buildErpMgButtonClassName({ variant: 'danger', size: 'md' })}
                disabled={anyBusy}
                onClick={onDelete}
              >
                {ADMIN_SHOP_ORDER_DETAIL_COPY.DELETE}
              </MGButton>
            ) : null}
          </div>
          {canReconcileRefund ? (
            <div className="admin-shop-order-detail__actions-force">
              <MGButton
                type="button"
                variant="ghost"
                className={`${buildErpMgButtonClassName({
                  variant: 'ghost',
                  size: 'sm'
                })} admin-shop-order-detail__force-reconcile`}
                disabled={anyBusy}
                loading={reconcileRefunding}
                loadingText={ADMIN_SHOP_RECONCILE_REFUND_COPY.FORCE_BUTTON}
                preventDoubleClick
                onClick={() => onReconcileRefund(true)}
                data-testid={ADMIN_SHOP_RECONCILE_REFUND_TEST_IDS.FORCE_BUTTON}
              >
                {ADMIN_SHOP_RECONCILE_REFUND_COPY.FORCE_BUTTON}
              </MGButton>
            </div>
          ) : null}
        </div>
      ) : null}

      {canFulfillRetry ? (
        <p className="mg-v2-muted" data-testid={SHOP_FULFILLMENT_RETRY_TEST_IDS.HINT}>
          {SHOP_FULFILLMENT_RETRY_COPY.HINT}
        </p>
      ) : null}
      {canReconcileRefund ? (
        <p className="mg-v2-muted" data-testid={ADMIN_SHOP_RECONCILE_REFUND_TEST_IDS.HINT}>
          <SafeText>{reconcileHint}</SafeText>
          {pgAlreadyCancelled ? null : (
            <>
              {' '}
              <SafeText>{ADMIN_SHOP_RECONCILE_REFUND_COPY.FORCE_HINT}</SafeText>
            </>
          )}
        </p>
      ) : null}

      <section className="admin-shop-order-detail__section">
        <h3 className="admin-shop-order-detail__section-title">
          {ADMIN_SHOP_ORDER_DETAIL_COPY.LINES_TITLE}
        </h3>
        {detailLines.length === 0 ? (
          <p className="mg-v2-muted">{ADMIN_SHOP_ORDER_DETAIL_COPY.LINES_EMPTY}</p>
        ) : (
          <ul className="admin-shop-order-detail__lines">
            {detailLines.map((line) => {
              const productName = line.title || line.skuCode || '-';
              return (
                <li
                  key={`line-${line.lineNo}-${line.skuCode}`}
                  className="admin-shop-order-detail__line"
                >
                  <span className="admin-shop-order-detail__line-name">
                    <SafeText>{productName}</SafeText>
                  </span>
                  <span className="admin-shop-order-detail__line-meta">
                    <SafeText>
                      {`${ADMIN_SHOP_ORDER_DETAIL_COPY.QTY_PREFIX} ${toDisplayString(line.quantity, '0')} · ${ADMIN_SHOP_ORDER_LINE_SESSION_LABEL} ${formatShopSessionCountDisplay(line.sessionCount)} · ${ADMIN_SHOP_ORDER_DETAIL_COPY.AMOUNT_PREFIX} ${formatShopMoney(line.lineTotalMinor)}`}
                    </SafeText>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="admin-shop-order-detail__section">
        <h3 className="admin-shop-order-detail__section-title">
          {ADMIN_SHOP_ORDER_DETAIL_COPY.FULFILLMENT_TITLE}
        </h3>
        {detailEvents.length === 0 ? (
          <p className="mg-v2-muted">{ADMIN_SHOP_ORDER_DETAIL_COPY.FULFILLMENT_EMPTY}</p>
        ) : (
          <ol
            className="admin-shop-order-detail__timeline"
            data-testid={ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.TIMELINE}
          >
            {detailEvents.map((ev, index) => {
              const isFirst = index === 0;
              const eventType = formatShopFulfillmentBadge(ev);
              const eventAt = formatShopDateTime(ev.createdAt) || '-';
              const eventNote = ev.message != null ? toDisplayString(ev.message, '') : '';
              return (
                <li
                  key={`fulfill-${ev.skuCode}-${ev.status}-${index}`}
                  className="admin-shop-order-detail__timeline-item"
                >
                  <span
                    className={
                      isFirst
                        ? 'admin-shop-order-detail__timeline-dot admin-shop-order-detail__timeline-dot--first'
                        : 'admin-shop-order-detail__timeline-dot'
                    }
                    data-testid={
                      isFirst
                        ? ADMIN_SHOP_ORDER_DETAIL_TEST_IDS.TIMELINE_DOT_FIRST
                        : undefined
                    }
                    aria-hidden="true"
                  />
                  <div className="admin-shop-order-detail__timeline-body">
                    <span className="admin-shop-order-detail__timeline-at">
                      <SafeText>{eventAt}</SafeText>
                    </span>
                    <span className="admin-shop-order-detail__timeline-type">
                      <SafeText>
                        {`${toDisplayString(ev.skuCode, '')} · ${eventType}`}
                      </SafeText>
                    </span>
                    {eventNote ? (
                      <span className="admin-shop-order-detail__timeline-note">
                        <SafeText>{eventNote}</SafeText>
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

AdminShopOrderDetailModal.propTypes = {
  detail: PropTypes.object.isRequired,
  detailLines: PropTypes.array,
  detailEvents: PropTypes.array,
  onRefund: PropTypes.func,
  onDelete: PropTypes.func,
  onFulfillRetry: PropTypes.func,
  onReconcileRefund: PropTypes.func,
  refunding: PropTypes.bool,
  deleting: PropTypes.bool,
  fulfillRetrying: PropTypes.bool,
  reconcileRefunding: PropTypes.bool,
  portOneHint: PropTypes.string
};

AdminShopOrderDetailModal.defaultProps = {
  detailLines: [],
  detailEvents: [],
  onRefund: undefined,
  onDelete: undefined,
  onFulfillRetry: undefined,
  onReconcileRefund: undefined,
  refunding: false,
  deleting: false,
  fulfillRetrying: false,
  reconcileRefunding: false,
  portOneHint: ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT
};

export default AdminShopOrderDetailModal;
