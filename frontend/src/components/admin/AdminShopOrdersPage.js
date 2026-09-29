/**
 * 테넌트 어드민 — 온라인 주문 (돈·회기 쌍장부)
 * 요약 스트립 · 상태 세그먼트 · 표(회기 ▸ 금액) · 합계 · 주문 상세 · 전액 환불 2단계
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import MGPagination from '../common/MGPagination';
import SegmentedTabs from '../common/SegmentedTabs';
import UnifiedLoading from '../common/UnifiedLoading';
import EntityRowActions from '../common/molecules/EntityRowActions';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import {
  ADMIN_SHOP_ORDER_CASH_DUE_LABEL,
  ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT,
  ADMIN_SHOP_ORDER_POINTS_LABEL,
  ADMIN_SHOP_RECONCILE_REFUND_COPY,
  isAdminShopOrderDeletable,
  resolveAdminShopRefundErrorCopy
} from '../../constants/adminShopApi';
import {
  ADMIN_SHOP_LEDGER_CHIP,
  ADMIN_SHOP_LEDGER_STATE,
  ADMIN_SHOP_ORDER_DELETE_VISIBLE_STATES,
  ADMIN_SHOP_ORDER_ENRICH_CONCURRENCY,
  ADMIN_SHOP_ORDER_MODAL_COPY,
  ADMIN_SHOP_ORDER_PERIOD,
  ADMIN_SHOP_ORDER_PERIOD_OPTIONS,
  ADMIN_SHOP_ORDER_SEGMENTS,
  ADMIN_SHOP_ORDERS_COPY,
  ADMIN_SHOP_ORDERS_FETCH_SIZE,
  ADMIN_SHOP_PRODUCT_ROUTES,
  ADMIN_SHOP_REFUND_CONFIRM_COPY,
  ADMIN_SHOP_STATE_COPY,
  ADMIN_SHOP_SUITE_PAGE_SIZE,
  ADMIN_SHOP_SUITE_TEST_IDS
} from '../../constants/adminShopSuite';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import useConfirm from '../../hooks/useConfirm';
import notificationManager from '../../utils/notification';
import { formatShopDateTime, formatShopMoney, formatShopPoints } from '../../utils/clientShopFormat';
import {
  hasShopFulfillmentRetryableLine,
  resolveShopFulfillmentLines,
  SHOP_FULFILLMENT_RETRY_COPY
} from '../../constants/clientShopConstants';
import {
  deleteAdminShopOrder,
  getAdminShopOrder,
  listAdminShopOrders,
  refundAdminShopOrder,
  reconcileShopOrderRefund,
  retryAdminShopOrderFulfillment
} from '../../services/adminShopOrderService';
import {
  buildAdminShopOrderLedgerItem,
  buildAdminShopOrdersCsv,
  filterAdminShopOrdersByPeriod,
  matchesAdminShopOrderSearch,
  needsAdminShopOrderEnrich,
  paginateAdminShopItems,
  resolveAdminShopOrderSessionCount,
  runAdminShopWithConcurrency,
  summarizeAdminShopOrders
} from '../../utils/adminShopSuite';
import { runResourceLoad, softRefresh } from '../../utils/softRefresh';
import AdminShopOrderDetailModal, {
  AdminShopOrderDetailFooter,
  AdminShopOrderDetailTitle
} from './shop/AdminShopOrderDetailModal';
import AdminShopRefundConfirmModal from './shop/AdminShopRefundConfirmModal';
import {
  AdminShopLedgerChip,
  AdminShopSessionDelta,
  AdminShopSuiteToast,
  AdminShopTableSkeleton,
  useAdminShopSuiteToast
} from './shop/AdminShopSuiteParts';
import '../../styles/unified-design-tokens.css';
import '../../styles/shop/AdminShopClinicOs.css';
import '../../styles/shop/AdminShopSuite.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import { useTranslation } from 'react-i18next';

const PAGE_TITLE_ID = 'admin-shop-orders-title';
const SEGMENT_ALL = 'ALL';
const TABLE_COLUMN_COUNT = 9;
const RELOAD_OPTIONS = Object.freeze({ announce: true });
const CSV_MIME = 'text/csv;charset=utf-8';
const CSV_BOM = '\uFEFF';

const STATE_LABELS = Object.fromEntries(
  Object.entries(ADMIN_SHOP_LEDGER_CHIP).map(([state, chip]) => [state, chip.label])
);

/**
 * @param {string} text
 * @param {string} filename
 */
function downloadCsv(text, filename) {
  const blob = new Blob([CSV_BOM, text], { type: CSV_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * @param {object} item
 * @returns {string}
 */
function buildAmountTitle(item) {
  const raw = item.raw || {};
  const cash = raw.cashDueMinor != null ? formatShopMoney(raw.cashDueMinor) : '';
  const points = raw.pointsRedeemMinor != null ? formatShopPoints(raw.pointsRedeemMinor) : '';
  return [
    cash ? `${ADMIN_SHOP_ORDER_CASH_DUE_LABEL} ${cash}` : '',
    points ? `${ADMIN_SHOP_ORDER_POINTS_LABEL} ${points}` : ''
  ].filter(Boolean).join(ADMIN_SHOP_ORDERS_COPY.AMOUNT_TITLE_SEPARATOR);
}

const AdminShopOrdersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);
  const [confirm, ConfirmModal] = useConfirm();
  const { toast, showToast, hideToast } = useAdminShopSuiteToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [rows, setRows] = useState([]);
  const [detailMap, setDetailMap] = useState({});
  const detailCacheRef = useRef(new Set());
  const mountedRef = useRef(true);

  const [period, setPeriod] = useState(ADMIN_SHOP_ORDER_PERIOD.THIS_MONTH);
  const [segment, setSegment] = useState(SEGMENT_ALL);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fulfillRetrying, setFulfillRetrying] = useState(false);
  const [reconcileRefunding, setReconcileRefunding] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * @param {{ silent?: boolean, announce?: boolean }} [options]
   *   silent=true 이면 AdminCommonLayout loading 미사용 (mutation 후 갱신)
   */
  const loadOrders = useCallback(async(options = {}) => {
    if (options.announce) {
      setReloading(true);
    }
    try {
      await runResourceLoad(options, setLoading, async() => {
        const result = await listAdminShopOrders({ page: 0, size: ADMIN_SHOP_ORDERS_FETCH_SIZE });
        setRows(Array.isArray(result?.orders) ? result.orders : []);
        setLoadError(false);
      });
      if (options.announce) {
        showToast(ADMIN_SHOP_ORDERS_COPY.RELOADED_TOAST);
      }
    } catch (e) {
      setLoadError(true);
    } finally {
      if (options.announce) {
        setReloading(false);
      }
    }
  }, [showToast]);

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
  }, [sessionLoading, isLoggedIn, user?.id, allowed, navigate, loadOrders]);

  const invalidateDetail = useCallback((orderPublicId) => {
    detailCacheRef.current.delete(orderPublicId);
    setDetailMap((prev) => {
      if (!(orderPublicId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[orderPublicId];
      return next;
    });
  }, []);

  const ledgerItems = useMemo(
    () => rows.map((row) => buildAdminShopOrderLedgerItem(row, detailMap[row.orderPublicId])),
    [rows, detailMap]
  );
  const periodItems = useMemo(
    () => filterAdminShopOrdersByPeriod(ledgerItems, period),
    [ledgerItems, period]
  );
  const summary = useMemo(() => summarizeAdminShopOrders(periodItems), [periodItems]);
  const segmentItems = useMemo(() => ADMIN_SHOP_ORDER_SEGMENTS.map((seg) => ({
    value: seg.value,
    label: seg.label,
    badge: seg.value === SEGMENT_ALL
      ? periodItems.length
      : periodItems.filter((item) => item.state === seg.value).length
  })), [periodItems]);
  const filteredItems = useMemo(() => periodItems.filter((item) => (
    (segment === SEGMENT_ALL || item.state === segment) && matchesAdminShopOrderSearch(item, query)
  )), [periodItems, segment, query]);
  const pageInfo = useMemo(
    () => paginateAdminShopItems(filteredItems, page, ADMIN_SHOP_SUITE_PAGE_SIZE),
    [filteredItems, page]
  );

  useEffect(() => {
    setPage(1);
  }, [period, segment, query]);

  const pageEnrichKey = pageInfo.pageItems
    .filter((item) => needsAdminShopOrderEnrich(item.raw))
    .map((item) => item.orderPublicId)
    .join('|');

  useEffect(() => {
    const ids = pageEnrichKey
      ? pageEnrichKey.split('|').filter((id) => !detailCacheRef.current.has(id))
      : [];
    if (ids.length === 0) {
      return;
    }
    ids.forEach((id) => detailCacheRef.current.add(id));
    runAdminShopWithConcurrency(ids, ADMIN_SHOP_ORDER_ENRICH_CONCURRENCY, async(id) => {
      try {
        const data = await getAdminShopOrder(id);
        if (mountedRef.current && data) {
          setDetailMap((prev) => ({ ...prev, [id]: data }));
        }
      } catch {
        detailCacheRef.current.delete(id);
      }
    });
  }, [pageEnrichKey]);

  const copyOrderId = useCallback(async(orderPublicId) => {
    try {
      await navigator.clipboard.writeText(String(orderPublicId));
      showToast(ADMIN_SHOP_ORDERS_COPY.COPIED_TOAST);
    } catch {
      notificationManager.error(String(orderPublicId));
    }
  }, [showToast]);

  const openDetail = async(orderPublicId) => {
    if (!orderPublicId) {
      return;
    }
    setRefundError('');
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(detailMap[orderPublicId] || null);
    try {
      const data = await getAdminShopOrder(orderPublicId);
      setDetail(data);
      if (data) {
        setDetailMap((prev) => ({ ...prev, [orderPublicId]: data }));
      }
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : '주문 상세를 불러오지 못했습니다.'
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const busy = refunding || deleting || fulfillRetrying || reconcileRefunding;

  const closeDetail = () => {
    if (detailLoading || busy) {
      return;
    }
    setDetailOpen(false);
    setDetail(null);
    setRefundError('');
  };

  const openRefund = () => {
    setRefundError('');
    setRefundOpen(true);
  };

  const closeRefund = () => {
    if (refunding) {
      return;
    }
    setRefundOpen(false);
  };

  const handleRefund = async(reasonCode) => {
    const orderPublicId = detail?.orderPublicId;
    if (!orderPublicId || !reasonCode) {
      return;
    }
    setRefunding(true);
    try {
      await refundAdminShopOrder(orderPublicId, reasonCode);
      setRefundOpen(false);
      setDetailOpen(false);
      setDetail(null);
      invalidateDetail(orderPublicId);
      showToast(ADMIN_SHOP_REFUND_CONFIRM_COPY.SUCCESS);
      await softRefresh(loadOrders);
    } catch (e) {
      const dedicated = resolveAdminShopRefundErrorCopy(e);
      setRefundOpen(false);
      setRefundError(dedicated || (e?.message != null ? String(e.message) : ''));
    } finally {
      setRefunding(false);
    }
  };

  const handleFulfillRetry = async() => {
    const orderPublicId = detail?.orderPublicId;
    if (!orderPublicId || fulfillRetrying) {
      return;
    }
    setFulfillRetrying(true);
    try {
      const updated = await retryAdminShopOrderFulfillment(orderPublicId);
      let nextDetail = updated;
      if (updated) {
        setDetail(updated);
      } else {
        const refreshed = await getAdminShopOrder(orderPublicId);
        setDetail(refreshed);
        nextDetail = refreshed;
      }
      invalidateDetail(orderPublicId);
      const events = resolveShopFulfillmentLines(nextDetail);
      // 여전히 FAILED+retryable 이면 SUCCESS 토스트 금지 — 버튼은 canFulfillRetry 로 재노출
      if (hasShopFulfillmentRetryableLine(events)) {
        notificationManager.error(SHOP_FULFILLMENT_RETRY_COPY.FAILED);
      } else {
        notificationManager.success(SHOP_FULFILLMENT_RETRY_COPY.SUCCESS);
      }
      await softRefresh(loadOrders);
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : SHOP_FULFILLMENT_RETRY_COPY.FAILED
      );
      try {
        const refreshed = await getAdminShopOrder(orderPublicId);
        setDetail(refreshed);
      } catch {
        // 상태 동기화 실패는 무시 (이미 오류 알림 표시)
      }
    } finally {
      setFulfillRetrying(false);
    }
  };

  const handleReconcileRefund = async(force = false) => {
    const orderPublicId = detail?.orderPublicId;
    if (!orderPublicId || reconcileRefunding) {
      return;
    }
    const confirmed = await confirm({
      title: force
        ? ADMIN_SHOP_RECONCILE_REFUND_COPY.FORCE_BUTTON
        : ADMIN_SHOP_RECONCILE_REFUND_COPY.BUTTON,
      message: force
        ? ADMIN_SHOP_RECONCILE_REFUND_COPY.FORCE_HINT
        : ADMIN_SHOP_RECONCILE_REFUND_COPY.HINT,
      confirmLabel: force
        ? ADMIN_SHOP_RECONCILE_REFUND_COPY.FORCE_BUTTON
        : ADMIN_SHOP_RECONCILE_REFUND_COPY.BUTTON,
      cancelLabel: t('admin.actions.cancel'),
      variant: 'warning'
    });
    if (!confirmed) {
      return;
    }
    setReconcileRefunding(true);
    try {
      await reconcileShopOrderRefund(orderPublicId, { force: force === true });
      notificationManager.success(ADMIN_SHOP_RECONCILE_REFUND_COPY.SUCCESS);
      setRefundError('');
      const refreshed = await getAdminShopOrder(orderPublicId);
      setDetail(refreshed);
      invalidateDetail(orderPublicId);
      await softRefresh(loadOrders);
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_SHOP_RECONCILE_REFUND_COPY.FAILED
      );
    } finally {
      setReconcileRefunding(false);
    }
  };

  const handleDeleteOrder = async(item) => {
    const raw = item?.raw;
    const orderPublicId = raw?.orderPublicId;
    if (!orderPublicId || !isAdminShopOrderDeletable(raw.status, raw.deletable)) {
      return;
    }
    const confirmed = await confirm({
      title: ADMIN_SHOP_ORDERS_COPY.DELETE_TITLE,
      message: ADMIN_SHOP_ORDERS_COPY.DELETE_IMPACT,
      confirmLabel: ADMIN_SHOP_ORDERS_COPY.DELETE_CONFIRM,
      cancelLabel: t('admin.actions.cancel'),
      variant: 'warning'
    });
    if (!confirmed) {
      return;
    }
    setDeleting(true);
    try {
      await deleteAdminShopOrder(orderPublicId);
      invalidateDetail(orderPublicId);
      showToast(ADMIN_SHOP_ORDERS_COPY.DELETE_DONE);
      await softRefresh(loadOrders);
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_SHOP_ORDERS_COPY.DELETE_FAILED
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const csv = buildAdminShopOrdersCsv(filteredItems, {
      headers: ADMIN_SHOP_ORDERS_COPY.CSV_HEADERS,
      stateLabels: STATE_LABELS
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `${ADMIN_SHOP_ORDERS_COPY.CSV_FILENAME_PREFIX}-${stamp}.csv`);
  };

  const checkCount = summary.pendingCount + summary.reconcileCount;
  const firstReconcile = periodItems.find((item) => item.state === ADMIN_SHOP_LEDGER_STATE.RECONCILE);
  const detailEvents = resolveShopFulfillmentLines(detail);
  const detailLines = Array.isArray(detail?.lines) ? detail.lines : [];
  const refundAmountItem = detail ? buildAdminShopOrderLedgerItem(detail, detail) : null;
  const usedRaw = detail?.usedCount ?? detail?.usedSessionCount;

  const renderRowMenu = (item) => (
    <EntityRowActions
      ariaLabel={ADMIN_SHOP_ORDERS_COPY.COL_MENU}
      items={[
        {
          id: 'detail',
          label: ADMIN_SHOP_ORDERS_COPY.MENU_DETAIL,
          onClick: () => openDetail(item.orderPublicId)
        },
        {
          id: 'copy',
          label: ADMIN_SHOP_ORDERS_COPY.MENU_COPY_ID,
          onClick: () => copyOrderId(item.orderPublicId)
        },
        {
          id: 'delete',
          label: ADMIN_SHOP_ORDERS_COPY.MENU_DELETE,
          variant: 'destructive',
          disabled: busy,
          hidden: !ADMIN_SHOP_ORDER_DELETE_VISIBLE_STATES.includes(item.state)
            || !isAdminShopOrderDeletable(item.raw?.status, item.raw?.deletable),
          onClick: () => handleDeleteOrder(item)
        }
      ]}
    />
  );

  const renderTableBody = () => {
    if (loading && rows.length === 0) {
      return (
        <AdminShopTableSkeleton
          columnCount={TABLE_COLUMN_COUNT}
          testId={ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_SKELETON}
        />
      );
    }
    if (pageInfo.pageItems.length === 0) {
      return (
        <tbody>
          <tr className="admin-shop-suite__row--static">
            <td colSpan={TABLE_COLUMN_COUNT}>
              <EmptyState
                title={periodItems.length === 0
                  ? ADMIN_SHOP_ORDERS_COPY.EMPTY_TITLE_PERIOD
                  : ADMIN_SHOP_ORDERS_COPY.EMPTY_FILTERED}
                description={periodItems.length === 0 ? ADMIN_SHOP_ORDERS_COPY.EMPTY_DESC : undefined}
                action={periodItems.length === 0 ? (
                  <MGButton
                    type="button"
                    variant="secondary"
                    className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
                    onClick={() => navigate(ADMIN_SHOP_PRODUCT_ROUTES.LIST)}
                  >
                    {ADMIN_SHOP_ORDERS_COPY.EMPTY_ACTION}
                  </MGButton>
                ) : undefined}
              />
            </td>
          </tr>
        </tbody>
      );
    }
    return (
      <tbody>
        {pageInfo.pageItems.map((item) => {
          const dim = item.state === ADMIN_SHOP_LEDGER_STATE.EXPIRED;
          return (
            <tr
              key={item.orderPublicId}
              className={dim ? 'admin-shop-suite__row--dim' : undefined}
              data-testid={ADMIN_SHOP_SUITE_TEST_IDS.ORDER_ROW}
              onClick={() => openDetail(item.orderPublicId)}
            >
              <td className="admin-shop-suite__num">
                <SafeText>{formatShopDateTime(item.createdAt) || '—'}</SafeText>
              </td>
              <td className="admin-shop-suite__mono">
                <SafeText>{item.shortId || '—'}</SafeText>
              </td>
              <td><SafeText>{item.clientMasked || '—'}</SafeText></td>
              <td><SafeText>{item.productTitle || '—'}</SafeText></td>
              <td className="admin-shop-suite__cell--right">
                <AdminShopSessionDelta delta={item.delta} />
              </td>
              <td
                className="admin-shop-suite__cell--right admin-shop-suite__cell--band admin-shop-suite__num"
                title={buildAmountTitle(item)}
              >
                <SafeText>{item.amount != null ? formatShopMoney(item.amount) : '—'}</SafeText>
              </td>
              <td className="admin-shop-suite__cell--right admin-shop-suite__num">
                <SafeText>{item.points > 0 ? formatShopPoints(item.points) : '—'}</SafeText>
              </td>
              <td><AdminShopLedgerChip state={item.state} /></td>
              <td>{renderRowMenu(item)}</td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  return (
    <AdminCommonLayout title={ADMIN_SHOP_ORDERS_COPY.TITLE}>
      <ContentArea className="admin-shop-clinic-os admin-shop-suite" ariaLabel={ADMIN_SHOP_ORDERS_COPY.TITLE}>
        <div data-testid={ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_PAGE} className="admin-shop-suite">
          <ContentHeader
            titleId={PAGE_TITLE_ID}
            title={ADMIN_SHOP_ORDERS_COPY.TITLE}
            subtitle={ADMIN_SHOP_ORDERS_COPY.SUBTITLE}
            actions={(
              <div className="admin-shop-suite__header-actions">
                <select
                  className="admin-shop-suite__select"
                  aria-label={ADMIN_SHOP_ORDERS_COPY.PERIOD_LABEL}
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  {ADMIN_SHOP_ORDER_PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <MGButton
                  type="button"
                  variant="secondary"
                  className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
                  onClick={handleExportCsv}
                  disabled={filteredItems.length === 0}
                >
                  {ADMIN_SHOP_ORDERS_COPY.CSV}
                </MGButton>
              </div>
            )}
          />

          {loadError ? (
            <EmptyState
              title={ADMIN_SHOP_ORDERS_COPY.LOAD_FAILED_TITLE}
              description={ADMIN_SHOP_ORDERS_COPY.LOAD_FAILED_DESC}
              action={(
                <MGButton
                  type="button"
                  variant="secondary"
                  className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
                  onClick={() => loadOrders()}
                >
                  {ADMIN_SHOP_ORDERS_COPY.RETRY}
                </MGButton>
              )}
            />
          ) : (
            <>
              <div className="admin-shop-suite__strip" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_STRIP}>
                <div className="admin-shop-suite__strip-cell">
                  <span className="admin-shop-suite__strip-label">{ADMIN_SHOP_ORDERS_COPY.STRIP_IN_LABEL}</span>
                  <span className="admin-shop-suite__strip-value admin-shop-suite__strip-value--in">
                    <SafeText>{formatShopMoney(summary.inAmount)}</SafeText>
                    <span className="admin-shop-suite__strip-delta">
                      <SafeText>{`+${summary.inSessions}${ADMIN_SHOP_ORDERS_COPY.SESSION_GRANTED}`}</SafeText>
                    </span>
                  </span>
                  <span className="admin-shop-suite__strip-caption">
                    <SafeText>
                      {`${summary.inCount}${ADMIN_SHOP_ORDERS_COPY.STRIP_IN_CAPTION} ${formatShopPoints(summary.inPoints)}`}
                    </SafeText>
                  </span>
                </div>
                <div className="admin-shop-suite__strip-cell">
                  <span className="admin-shop-suite__strip-label">{ADMIN_SHOP_ORDERS_COPY.STRIP_OUT_LABEL}</span>
                  <span className="admin-shop-suite__strip-value admin-shop-suite__strip-value--out">
                    <SafeText>{`−${formatShopMoney(summary.outAmount)}`}</SafeText>
                    <span className="admin-shop-suite__strip-delta">
                      <SafeText>{`−${summary.outSessions} ${ADMIN_SHOP_ORDERS_COPY.SESSION_RESTORED}`}</SafeText>
                    </span>
                  </span>
                  <span className="admin-shop-suite__strip-caption">
                    <SafeText>{`${summary.outCount}${ADMIN_SHOP_ORDERS_COPY.STRIP_OUT_CAPTION}`}</SafeText>
                  </span>
                </div>
                <div className="admin-shop-suite__strip-cell">
                  <span className="admin-shop-suite__strip-label">{ADMIN_SHOP_ORDERS_COPY.STRIP_CHECK_LABEL}</span>
                  <span className="admin-shop-suite__strip-value">
                    <SafeText>{`${checkCount}${ADMIN_SHOP_ORDERS_COPY.PAGINATION_UNIT}`}</SafeText>
                  </span>
                  <span className="admin-shop-suite__strip-caption">
                    <SafeText>
                      {`${ADMIN_SHOP_ORDERS_COPY.STRIP_CHECK_CAPTION_PENDING} ${summary.pendingCount} · ${ADMIN_SHOP_ORDERS_COPY.STRIP_CHECK_CAPTION_RECONCILE} ${summary.reconcileCount}`}
                    </SafeText>
                    {checkCount > 0 ? (
                      <>
                        {' '}
                        <button
                          type="button"
                          className="admin-shop-suite__link-btn"
                          onClick={() => setSegment(summary.reconcileCount > 0
                            ? ADMIN_SHOP_LEDGER_STATE.RECONCILE
                            : ADMIN_SHOP_LEDGER_STATE.PENDING)}
                        >
                          {ADMIN_SHOP_ORDERS_COPY.STRIP_CHECK_VIEW}
                        </button>
                      </>
                    ) : null}
                  </span>
                </div>
              </div>

              {firstReconcile ? (
                <div className="admin-shop-suite__rail" role="status">
                  <span>
                    <strong>
                      {`${ADMIN_SHOP_ORDERS_COPY.STRIP_CHECK_CAPTION_RECONCILE} ${summary.reconcileCount}${ADMIN_SHOP_ORDERS_COPY.PAGINATION_UNIT} · ${formatShopMoney(summary.reconcileAmount)}`}
                    </strong>
                    {' '}
                    {ADMIN_SHOP_STATE_COPY.RECONCILE_RAIL}
                  </span>
                  <button
                    type="button"
                    className="admin-shop-suite__link-btn"
                    onClick={() => openDetail(firstReconcile.orderPublicId)}
                  >
                    {ADMIN_SHOP_STATE_COPY.RECONCILE_OPEN}
                  </button>
                </div>
              ) : null}

              <div className="admin-shop-suite__toolbar">
                <SegmentedTabs
                  items={segmentItems}
                  activeValue={segment}
                  onChange={setSegment}
                  ariaLabel={ADMIN_SHOP_ORDERS_COPY.SEGMENT_ARIA}
                  size="sm"
                />
                <span className="admin-shop-suite__toolbar-spacer" />
                <input
                  type="search"
                  className="admin-shop-suite__search"
                  placeholder={ADMIN_SHOP_ORDERS_COPY.SEARCH_PLACEHOLDER}
                  aria-label={ADMIN_SHOP_ORDERS_COPY.SEARCH_ARIA}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="admin-shop-suite__icon-btn"
                  aria-label={ADMIN_SHOP_ORDERS_COPY.RELOAD_ARIA}
                  title={ADMIN_SHOP_ORDERS_COPY.RELOAD_ARIA}
                  disabled={reloading}
                  data-testid={ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_RELOAD}
                  onClick={() => softRefresh(loadOrders, RELOAD_OPTIONS)}
                >
                  <RotateCw size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="admin-shop-suite__table-wrap">
                <table className="admin-shop-suite__table" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_TABLE}>
                  <colgroup>
                    <col className="admin-shop-suite__col-date" />
                    <col className="admin-shop-suite__col-order" />
                    <col className="admin-shop-suite__col-client" />
                    <col />
                    <col className="admin-shop-suite__col-sessions" />
                    <col className="admin-shop-suite__col-amount" />
                    <col className="admin-shop-suite__col-points" />
                    <col className="admin-shop-suite__col-status" />
                    <col className="admin-shop-suite__col-menu" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">{ADMIN_SHOP_ORDERS_COPY.COL_ORDERED_AT}</th>
                      <th scope="col">{ADMIN_SHOP_ORDERS_COPY.COL_ORDER_NO}</th>
                      <th scope="col">{ADMIN_SHOP_ORDERS_COPY.COL_CLIENT}</th>
                      <th scope="col">{ADMIN_SHOP_ORDERS_COPY.COL_PRODUCT}</th>
                      <th scope="col" className="admin-shop-suite__cell--right">
                        {ADMIN_SHOP_ORDERS_COPY.COL_SESSIONS}
                        <span className="admin-shop-suite__arrow" aria-hidden="true">▸</span>
                      </th>
                      <th scope="col" className="admin-shop-suite__cell--right admin-shop-suite__cell--band">
                        {ADMIN_SHOP_ORDERS_COPY.COL_AMOUNT}
                      </th>
                      <th scope="col" className="admin-shop-suite__cell--right">{ADMIN_SHOP_ORDER_POINTS_LABEL}</th>
                      <th scope="col">{ADMIN_SHOP_ORDERS_COPY.COL_STATUS}</th>
                      <th scope="col"><span className="sr-only">{ADMIN_SHOP_ORDERS_COPY.COL_MENU}</span></th>
                    </tr>
                  </thead>
                  {renderTableBody()}
                  {periodItems.length > 0 ? (
                    <tfoot data-testid={ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_TOTAL}>
                      <tr className="admin-shop-suite__row--static">
                        <td colSpan={4}>
                          {ADMIN_SHOP_ORDERS_COPY.TOTAL_LABEL}
                          <span className="admin-shop-suite__total-caption">{ADMIN_SHOP_ORDERS_COPY.TOTAL_CAPTION}</span>
                        </td>
                        <td className="admin-shop-suite__cell--right admin-shop-suite__num">
                          <SafeText>
                            {`+${summary.inSessions} / −${summary.outSessions}`}
                          </SafeText>
                        </td>
                        <td className="admin-shop-suite__cell--right admin-shop-suite__cell--band admin-shop-suite__num admin-shop-suite__total-amount">
                          <SafeText>{formatShopMoney(summary.netAmount)}</SafeText>
                        </td>
                        <td className="admin-shop-suite__cell--right admin-shop-suite__num">
                          <SafeText>{summary.inPoints > 0 ? formatShopPoints(summary.inPoints) : '—'}</SafeText>
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>

              {pageInfo.total > 0 ? (
                <div className="admin-shop-suite__pagination">
                  <span>
                    <SafeText>
                      {`${pageInfo.from}–${pageInfo.to} / ${pageInfo.total}${ADMIN_SHOP_ORDERS_COPY.PAGINATION_UNIT}`}
                    </SafeText>
                  </span>
                  {pageInfo.totalPages > 1 ? (
                    <MGPagination
                      currentPage={pageInfo.page}
                      totalPages={pageInfo.totalPages}
                      totalItems={pageInfo.total}
                      itemsPerPage={ADMIN_SHOP_SUITE_PAGE_SIZE}
                      onPageChange={setPage}
                      showInfo={false}
                      showItemsPerPage={false}
                      variant="compact"
                    />
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </ContentArea>

      <UnifiedModal
        isOpen={detailOpen}
        onClose={closeDetail}
        title={<AdminShopOrderDetailTitle detail={detail} />}
        size="large"
        closeOnEscape={!refundOpen && !busy}
        backdropClick={!refundOpen && !busy}
        className="admin-shop-suite"
        actions={(
          <AdminShopOrderDetailFooter
            detail={detailLoading ? null : detail}
            detailEvents={detailEvents}
            onClose={closeDetail}
            onRefund={openRefund}
            onReconcileRefund={handleReconcileRefund}
            closeLabel={ADMIN_SHOP_ORDER_MODAL_COPY.CLOSE}
            refunding={refunding}
            deleting={deleting}
            fulfillRetrying={fulfillRetrying}
            reconcileRefunding={reconcileRefunding}
          />
        )}
      >
        {detailLoading && !detail ? (
          <UnifiedLoading type="inline" />
        ) : detail ? (
          <AdminShopOrderDetailModal
            detail={detail}
            detailLines={detailLines}
            detailEvents={detailEvents}
            portOneHint={ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT}
            onFulfillRetry={handleFulfillRetry}
            onReconcileRefund={handleReconcileRefund}
            onCopyOrderId={copyOrderId}
            refunding={refunding}
            deleting={deleting}
            fulfillRetrying={fulfillRetrying}
            reconcileRefunding={reconcileRefunding}
            refundError={refundError}
          />
        ) : null}
      </UnifiedModal>

      <AdminShopRefundConfirmModal
        isOpen={refundOpen}
        onClose={closeRefund}
        onSubmit={handleRefund}
        submitting={refunding}
        amount={refundAmountItem?.amount ?? null}
        sessions={detail ? resolveAdminShopOrderSessionCount(detail, detail) : null}
        usedCount={usedRaw != null && Number.isFinite(Number(usedRaw)) ? Number(usedRaw) : null}
        paymentId={detail?.paymentId ? String(detail.paymentId) : ''}
      />
      <ConfirmModal />
      <AdminShopSuiteToast toast={toast} onDismiss={hideToast} />
    </AdminCommonLayout>
  );
};

export default AdminShopOrdersPage;
