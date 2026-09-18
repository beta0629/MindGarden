/**
 * 테넌트 어드민 — 온라인 주문 목록·전액 환불 (P2-admin)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import { ListTableView } from '../common';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import UnifiedModal from '../common/modals/UnifiedModal';
import ModalFormActions from '../common/modals/ModalFormActions';
import BadgeSelect from '../common/BadgeSelect';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import {
  ADMIN_SHOP_ORDER_LINE_SESSION_LABEL,
  ADMIN_SHOP_ORDER_PAYMENT_ID_LABEL,
  ADMIN_SHOP_ORDER_PAYMENT_STATUS_LABEL,
  ADMIN_SHOP_ORDER_STATUS_LABELS,
  ADMIN_SHOP_REFUND_PG_HINT,
  ADMIN_SHOP_REFUND_REASON_CODES,
  ADMIN_SHOP_REFUND_REASON_OPTIONS,
  isAdminShopOrderDeletable
} from '../../constants/adminShopApi';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import useConfirm from '../../hooks/useConfirm';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import { formatShopDateTime, formatShopMoney, formatShopPoints } from '../../utils/clientShopFormat';
import { formatShopSessionCountDisplay } from '../../constants/clientShopConstants';
import {
  deleteAdminShopOrder,
  getAdminShopOrder,
  listAdminShopOrders,
  refundAdminShopOrder
} from '../../services/adminShopOrderService';
import '../../styles/unified-design-tokens.css';
import '../../styles/shop/AdminShopClinicOs.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import { useTranslation } from 'react-i18next';

const PAGE_TITLE_ID = 'admin-shop-orders-title';
const ORDER_STATUS_PAID = 'PAID';

function normalizeListPayload(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && raw.success === true && Array.isArray(raw.data)) {
    return raw.data;
  }
  if (raw && Array.isArray(raw.data)) {
    return raw.data;
  }
  return [];
}

function statusLabel(status) {
  const key = toDisplayString(status, '');
  return ADMIN_SHOP_ORDER_STATUS_LABELS[key] || key || '-';
}

function paymentStatusLabel(paymentStatus) {
  const key = toDisplayString(paymentStatus, '');
  if (!key) {
    return '';
  }
  return ADMIN_SHOP_ORDER_STATUS_LABELS[key] || key;
}

/**
 * 목록 표시 금액: pgAmount → cashDueMinor → subtotalMinor.
 *
 * @param {object} row
 * @returns {number|null}
 */
function resolveAdminShopOrderListAmount(row) {
  if (row == null || typeof row !== 'object') {
    return null;
  }
  if (row.pgAmount != null && row.pgAmount !== '') {
    return Number(row.pgAmount);
  }
  if (row.cashDueMinor != null && row.cashDueMinor !== '') {
    return Number(row.cashDueMinor);
  }
  if (row.subtotalMinor != null && row.subtotalMinor !== '') {
    return Number(row.subtotalMinor);
  }
  return null;
}

/**
 * 주문 상태 + 결제 상태(환불 등) 표시.
 *
 * @param {object} row
 * @returns {string}
 */
function resolveAdminShopOrderStatusDisplay(row) {
  const orderPart = statusLabel(row?.status);
  const payPart = paymentStatusLabel(row?.paymentStatus);
  if (payPart && payPart !== orderPart) {
    return `${orderPart} · ${payPart}`;
  }
  return orderPart;
}

function shortenPublicId(id) {
  const s = toDisplayString(id, '');
  if (s.length <= 12) {
    return s;
  }
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function OrderDetailBody({ detail, detailLines, detailEvents, onRefund, onDelete, refunding, deleting }) {
  const canRefund = detail.status === ORDER_STATUS_PAID;
  const canDelete = isAdminShopOrderDeletable(detail.status, detail.deletable);
  return (
    <div className="mg-v2-form-stack">
      <p>
        <SafeText>{`주문 ID: ${toDisplayString(detail.orderPublicId, '')}`}</SafeText>
      </p>
      <p>
        <SafeText>
          {`상태: ${statusLabel(detail.status)} · 내담자 ID: ${detail.clientId != null ? String(detail.clientId) : '-'}`}
        </SafeText>
      </p>
      {detail.paymentId ? (
        <p data-testid="admin-shop-order-payment-id">
          <SafeText>
            {`${ADMIN_SHOP_ORDER_PAYMENT_ID_LABEL}: ${toDisplayString(detail.paymentId, '')} · ${ADMIN_SHOP_ORDER_PAYMENT_STATUS_LABEL}: ${toDisplayString(detail.paymentStatus, '')}`}
          </SafeText>
        </p>
      ) : null}
      <p>
        <SafeText>
          {`합계 ${formatShopMoney(detail.subtotalMinor)} · 현금 ${formatShopMoney(detail.cashDueMinor)} · 포인트 ${formatShopPoints(detail.pointsRedeemMinor)}`}
        </SafeText>
      </p>
      <p className="mg-v2-muted">
        <SafeText>{formatShopDateTime(detail.createdAt) || '-'}</SafeText>
      </p>
      {(canRefund || canDelete) ? (
        <div className="mg-v2-button-group">
          {canRefund ? (
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md' })}
              disabled={refunding || deleting}
              onClick={onRefund}
            >
              전액 환불
            </MGButton>
          ) : null}
          {canDelete ? (
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'danger', size: 'md' })}
              disabled={refunding || deleting}
              onClick={onDelete}
            >
              삭제
            </MGButton>
          ) : null}
        </div>
      ) : null}
      <section>
        <h3 className="mg-v2-section-title">주문 라인</h3>
        {detailLines.length === 0 ? (
          <p className="mg-v2-muted">라인 없음</p>
        ) : (
          <ul className="mg-v2-list-plain">
            {detailLines.map((line) => (
              <li key={`line-${line.lineNo}-${line.skuCode}`}>
                <SafeText>
                  {`${line.title || line.skuCode} × ${line.quantity} — ${formatShopMoney(line.lineTotalMinor)} · ${ADMIN_SHOP_ORDER_LINE_SESSION_LABEL} ${formatShopSessionCountDisplay(line.sessionCount)}`}
                </SafeText>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="mg-v2-section-title">이행 이벤트</h3>
        {detailEvents.length === 0 ? (
          <p className="mg-v2-muted">이행 이벤트 없음</p>
        ) : (
          <ul className="mg-v2-list-plain">
            {detailEvents.map((ev) => (
              <li key={`fulfill-${ev.skuCode}-${ev.status}`}>
                <SafeText>
                  {`${ev.skuCode} · ${ev.category}/${ev.status}${ev.message ? ` — ${ev.message}` : ''}`}
                </SafeText>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RefundModalBody({ baseId, refundTarget, refundReason, onReasonChange }) {
  return (
    <div className="mg-v2-form-stack">
      <p>
        <SafeText>
          {`주문 ${shortenPublicId(refundTarget?.orderPublicId)} — ${statusLabel(refundTarget?.status)}`}
        </SafeText>
      </p>
      {refundTarget?.paymentId ? (
        <p data-testid="admin-shop-refund-payment-id">
          <SafeText>
            {`${ADMIN_SHOP_ORDER_PAYMENT_ID_LABEL}: ${toDisplayString(refundTarget.paymentId, '')}`}
          </SafeText>
        </p>
      ) : null}
      <p className="mg-v2-muted">
        <SafeText>{ADMIN_SHOP_REFUND_PG_HINT}</SafeText>
      </p>
      <label className="mg-v2-label" htmlFor={`${baseId}-refund-reason`}>
        환불 사유
      </label>
      <BadgeSelect
        id={`${baseId}-refund-reason`}
        aria-label="환불 사유"
        options={ADMIN_SHOP_REFUND_REASON_OPTIONS}
        value={refundReason}
        onChange={onReasonChange}
      />
    </div>
  );
}

const AdminShopOrdersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const baseId = useId();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);
  const [confirm, ConfirmModal] = useConfirm();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState(ADMIN_SHOP_REFUND_REASON_CODES.CUSTOMER_REQUEST);
  const [refunding, setRefunding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadOrders = useCallback(async() => {
    setLoading(true);
    try {
      const list = await listAdminShopOrders();
      setRows(normalizeListPayload(list));
    } catch (e) {
      setRows([]);
      notificationManager.error(
        e?.message != null ? String(e.message) : '주문 목록을 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!allowed) {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      navigate('/', { replace: true });
      return;
    }
    loadOrders();
  }, [sessionLoading, isLoggedIn, user, allowed, navigate, loadOrders]);

  const openDetail = async(row) => {
    const orderPublicId = row?.orderPublicId ?? row?.__raw?.orderPublicId;
    if (!orderPublicId) {
      return;
    }
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await getAdminShopOrder(orderPublicId);
      setDetail(data);
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : '주문 상세를 불러오지 못했습니다.'
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (detailLoading) {
      return;
    }
    setDetailOpen(false);
    setDetail(null);
  };

  const openRefund = (row, ev) => {
    if (ev) {
      ev.stopPropagation();
    }
    const raw = row?.__raw ?? row;
    if (raw?.status !== ORDER_STATUS_PAID) {
      return;
    }
    setRefundTarget(raw);
    setRefundReason(ADMIN_SHOP_REFUND_REASON_CODES.CUSTOMER_REQUEST);
    setRefundOpen(true);
  };

  const closeRefund = () => {
    if (refunding) {
      return;
    }
    setRefundOpen(false);
    setRefundTarget(null);
  };

  const handleRefund = async() => {
    const orderPublicId = refundTarget?.orderPublicId;
    if (!orderPublicId || !refundReason) {
      notificationManager.show('환불 사유를 선택해 주세요.', 'warning');
      return;
    }
    setRefunding(true);
    try {
      const result = await refundAdminShopOrder(orderPublicId, refundReason);
      const restored = result?.pointsRestoredMinor ?? 0;
      const clawed = result?.pointsClawedBackMinor ?? 0;
      notificationManager.show(
        `전액 환불이 반영되었습니다. (포인트 복원 ${formatShopPoints(restored)}, 회수 ${formatShopPoints(clawed)})`,
        'success'
      );
      setRefundOpen(false);
      setRefundTarget(null);
      if (detailOpen && detail?.orderPublicId === orderPublicId) {
        setDetailOpen(false);
        setDetail(null);
      }
      await loadOrders();
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : '환불 처리에 실패했습니다.');
    } finally {
      setRefunding(false);
    }
  };

  const handleDeleteOrder = async(row, ev) => {
    if (ev) {
      ev.stopPropagation();
    }
    const raw = row?.__raw ?? row;
    const orderPublicId = raw?.orderPublicId;
    if (!orderPublicId) {
      return;
    }
    if (!isAdminShopOrderDeletable(raw.status, raw.deletable)) {
      notificationManager.show('현재 상태의 주문은 삭제할 수 없습니다.', 'warning');
      return;
    }
    const confirmed = await confirm({
      title: '주문 삭제',
      message: `주문 ${shortenPublicId(orderPublicId)} (${statusLabel(raw.status)})을(를) 삭제할까요? 목록에서 숨겨지며 복구할 수 없습니다.`,
      confirmLabel: '삭제',
      cancelLabel: t('admin.actions.cancel'),
      variant: 'danger'
    });
    if (!confirmed) {
      return;
    }
    setDeleting(true);
    try {
      await deleteAdminShopOrder(orderPublicId);
      notificationManager.show('주문이 삭제되었습니다.', 'success');
      if (detailOpen && detail?.orderPublicId === orderPublicId) {
        setDetailOpen(false);
        setDetail(null);
      }
      await loadOrders();
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : '주문 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const tableRows = useMemo(() => {
    return (Array.isArray(rows) ? rows : []).map((row, idx) => {
      const listAmount = resolveAdminShopOrderListAmount(row);
      const amountText = listAmount != null ? formatShopMoney(listAmount) : '';
      const cash = row.cashDueMinor != null ? formatShopMoney(row.cashDueMinor) : '';
      const points = row.pointsRedeemMinor != null ? formatShopPoints(row.pointsRedeemMinor) : '';
      return {
        __rowKey: row.orderPublicId != null ? `order-${String(row.orderPublicId)}` : `order-idx-${idx}`,
        colId: shortenPublicId(row.orderPublicId),
        colStatus: resolveAdminShopOrderStatusDisplay(row),
        colAmount: amountText,
        colPay: cash || points ? `현금 ${cash || '0원'} · 포인트 ${points || '0 P'}` : '',
        colDate: formatShopDateTime(row.createdAt) || '-',
        __raw: row
      };
    });
  }, [rows]);

  const columns = [
    { key: 'colId', label: '주문 ID' },
    { key: 'colStatus', label: '상태' },
    { key: 'colAmount', label: '주문 금액' },
    { key: 'colPay', label: '결제 구성' },
    { key: 'colDate', label: '주문 일시' },
    { key: 'colActions', label: '동작', hideOnMobile: true }
  ];

  const renderCell = (columnKey, item) => {
    if (columnKey !== 'colActions') {
      const value = item[columnKey];
      return value != null && value !== '' ? String(value) : '-';
    }
    const raw = item.__raw ?? item;
    const canRefund = raw.status === ORDER_STATUS_PAID;
    const canDelete = isAdminShopOrderDeletable(raw.status, raw.deletable);
    if (!canRefund && !canDelete) {
      return '-';
    }
    return (
      <div className="mg-v2-button-group">
        {canRefund ? (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName('secondary')}
            disabled={refunding || deleting}
            onClick={(ev) => openRefund(raw, ev)}
          >
            전액 환불
          </MGButton>
        ) : null}
        {canDelete ? (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'danger' })}
            disabled={refunding || deleting}
            onClick={(ev) => handleDeleteOrder(raw, ev)}
          >
            삭제
          </MGButton>
        ) : null}
      </div>
    );
  };

  const detailLines = Array.isArray(detail?.lines) ? detail.lines : [];
  const detailEvents = Array.isArray(detail?.fulfillmentEvents) ? detail.fulfillmentEvents : [];

  return (
    <AdminCommonLayout title="온라인 주문" loading={loading}>
      <ContentArea className="admin-shop-clinic-os" ariaLabel="온라인 주문">
        <ContentHeader
          titleId={PAGE_TITLE_ID}
          title="온라인 주문"
          description="테넌트 내담자 온라인 주문을 조회하고, 결제 완료(PAID) 건 전액 환불 및 허용 상태 주문을 삭제합니다."
          actions={(
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
              onClick={loadOrders}
              disabled={loading}
            >
              {t('admin.actions.refresh')}
            </MGButton>
          )}
        />
        <ContentSection>
          {tableRows.length === 0 ? (
            <EmptyState message="조회된 주문이 없습니다." />
          ) : (
            <ListTableView
              columns={columns}
              data={tableRows}
              rowKeyField="__rowKey"
              renderCell={renderCell}
              onRowClick={(row) => openDetail(row.__raw ?? row)}
            />
          )}
        </ContentSection>
      </ContentArea>

      <UnifiedModal
        isOpen={detailOpen}
        onClose={closeDetail}
        title="주문 상세"
        size="medium"
        actions={(
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md' })}
            onClick={closeDetail}
            disabled={detailLoading}
          >
            {t('common.actions.close')}
          </MGButton>
        )}
      >
        {detailLoading ? (
          <UnifiedLoading type="inline" />
        ) : detail ? (
          <OrderDetailBody
            detail={detail}
            detailLines={detailLines}
            detailEvents={detailEvents}
            onRefund={(ev) => {
              closeDetail();
              openRefund(detail, ev);
            }}
            onDelete={(ev) => handleDeleteOrder(detail, ev)}
            refunding={refunding}
            deleting={deleting}
          />
        ) : (
          <p className="mg-v2-muted">상세 정보가 없습니다.</p>
        )}
      </UnifiedModal>

      <UnifiedModal
        isOpen={refundOpen}
        onClose={closeRefund}
        title="전액 환불"
        size="small"
        actions={(
          <ModalFormActions
            cancelText={t('admin.actions.cancel')}
            submitText="환불 실행"
            onCancel={closeRefund}
            onSubmit={handleRefund}
            loading={refunding}
            disabled={refunding}
            cancelVariant="ghost"
            submitVariant="primary"
          />
        )}
      >
        <RefundModalBody
          baseId={baseId}
          refundTarget={refundTarget}
          refundReason={refundReason}
          onReasonChange={setRefundReason}
        />
      </UnifiedModal>
      <ConfirmModal />
    </AdminCommonLayout>
  );
};

export default AdminShopOrdersPage;
