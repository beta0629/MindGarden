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
import BadgeSelect from '../common/BadgeSelect';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import {
  ADMIN_SHOP_ORDER_STATUS_LABELS,
  ADMIN_SHOP_REFUND_REASON_CODES,
  ADMIN_SHOP_REFUND_REASON_OPTIONS
} from '../../constants/adminShopApi';
import { USER_ROLES } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import { formatShopDateTime, formatShopMoney, formatShopPoints } from '../../utils/clientShopFormat';
import {
  getAdminShopOrder,
  listAdminShopOrders,
  refundAdminShopOrder
} from '../../services/adminShopOrderService';
import '../../styles/unified-design-tokens.css';
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

function shortenPublicId(id) {
  const s = toDisplayString(id, '');
  if (s.length <= 12) {
    return s;
  }
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function OrderDetailBody({ detail, detailLines, detailEvents, onRefund, refunding }) {
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
      <p>
        <SafeText>
          {`합계 ${formatShopMoney(detail.subtotalMinor)} · 현금 ${formatShopMoney(detail.cashDueMinor)} · 포인트 ${formatShopPoints(detail.pointsRedeemMinor)}`}
        </SafeText>
      </p>
      <p className="mg-v2-muted">
        <SafeText>{formatShopDateTime(detail.createdAt) || '-'}</SafeText>
      </p>
      {detail.status === ORDER_STATUS_PAID ? (
        <MGButton
          type="button"
          className={buildErpMgButtonClassName('primary')}
          disabled={refunding}
          onClick={onRefund}
        >
          전액 환불
        </MGButton>
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
                  {`${line.title || line.skuCode} × ${line.quantity} — ${formatShopMoney(line.lineTotalMinor)}`}
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
      <p className="mg-v2-muted">
        <SafeText>
          PG 실환불은 연동되지 않았습니다(MVP). 포인트 복원·적립 회수·주문 상태만 반영됩니다.
        </SafeText>
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
  const allowed = user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState(ADMIN_SHOP_REFUND_REASON_CODES.CUSTOMER_REQUEST);
  const [refunding, setRefunding] = useState(false);

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

  const tableRows = useMemo(() => {
    return (Array.isArray(rows) ? rows : []).map((row, idx) => {
      const subtotal = row.subtotalMinor != null ? formatShopMoney(row.subtotalMinor) : '';
      const cash = row.cashDueMinor != null ? formatShopMoney(row.cashDueMinor) : '';
      const points = row.pointsRedeemMinor != null ? formatShopPoints(row.pointsRedeemMinor) : '';
      return {
        __rowKey: row.orderPublicId != null ? `order-${String(row.orderPublicId)}` : `order-idx-${idx}`,
        colId: shortenPublicId(row.orderPublicId),
        colStatus: statusLabel(row.status),
        colAmount: subtotal ? `합계 ${subtotal}` : '',
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
    if (raw.status !== ORDER_STATUS_PAID) {
      return '-';
    }
    return (
      <MGButton
        type="button"
        className={buildErpMgButtonClassName('secondary')}
        disabled={refunding}
        onClick={(ev) => openRefund(raw, ev)}
      >
        전액 환불
      </MGButton>
    );
  };

  const detailLines = Array.isArray(detail?.lines) ? detail.lines : [];
  const detailEvents = Array.isArray(detail?.fulfillmentEvents) ? detail.fulfillmentEvents : [];

  return (
    <AdminCommonLayout title="온라인 주문">
      <ContentArea>
        <ContentHeader
          titleId={PAGE_TITLE_ID}
          title="온라인 주문"
          description="테넌트 내담자 온라인 주문을 조회하고, 결제 완료(PAID) 건에 대해 전액 환불(MVP)을 처리합니다."
          actions={(
            <MGButton
              type="button"
              className={buildErpMgButtonClassName('secondary')}
              onClick={loadOrders}
              disabled={loading}
            >
              {t('admin.actions.refresh', '새로고침')}
            </MGButton>
          )}
        />
        <ContentSection>
          {loading ? (
            <UnifiedLoading message="주문 목록을 불러오는 중…" />
          ) : tableRows.length === 0 ? (
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
        footer={(
          <MGButton
            type="button"
            className={buildErpMgButtonClassName('secondary')}
            onClick={closeDetail}
            disabled={detailLoading}
          >
            {t('common.actions.close', '닫기')}
          </MGButton>
        )}
      >
        {detailLoading ? (
          <UnifiedLoading message="상세를 불러오는 중…" />
        ) : detail ? (
          <OrderDetailBody
            detail={detail}
            detailLines={detailLines}
            detailEvents={detailEvents}
            onRefund={(ev) => {
              closeDetail();
              openRefund(detail, ev);
            }}
            refunding={refunding}
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
        footer={(
          <>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName('secondary')}
              onClick={closeRefund}
              disabled={refunding}
            >
              {t('admin.actions.cancel', '취소')}
            </MGButton>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName('primary')}
              onClick={handleRefund}
              disabled={refunding}
            >
              {refunding ? ERP_MG_BUTTON_LOADING_TEXT : '환불 실행'}
            </MGButton>
          </>
        )}
      >
        <RefundModalBody
          baseId={baseId}
          refundTarget={refundTarget}
          refundReason={refundReason}
          onReasonChange={setRefundReason}
        />
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default AdminShopOrdersPage;
