/**
 * ERP 대시보드 — 구매·운영 최근 활동 피드 (구매 요청·주문 타임라인, 금액 거래와 목적 분리)
 *
 * @author CoreSolution
 * @since 2026-04-18
 */

import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, ShoppingCart } from 'lucide-react';
import StandardizedApi from '../../../utils/standardizedApi';
import { ERP_API } from '../../../constants/api';
import { toDisplayString, toErrorMessage } from '../../../utils/safeDisplay';
import { normalizeErpListResponse } from '../purchase/PurchaseHubSections';
import UnifiedLoading from '../../common/UnifiedLoading';
import { ErpEmptyState, ErpSafeText } from '../common';
import './ErpRecentActivityFeed.css';

const ERP_RECENT_ACTIVITY_ICON_SIZE = 22;
const ERP_RECENT_ACTIVITY_MAX_ITEMS = 8;

/** Playwright / E2E용 data-testid (대시보드 섹션 루트는 ErpDashboard 래퍼) */
const ERP_RECENT_ACTIVITY_TEST = {
  LOADING: 'erp-recent-activity-loading',
  EMPTY: 'erp-recent-activity-empty',
  LIST: 'erp-recent-activity-list',
  ITEM: 'erp-recent-activity-item'
};

const ERP_ACTIVITY_TYPE_LABEL_REQUEST = '구매 요청';
const ERP_ACTIVITY_TYPE_LABEL_ORDER = '구매 주문';

const PURCHASE_REQUEST_STATUS_LABEL = {
  PENDING: '대기중',
  ADMIN_APPROVED: '관리자 승인',
  ADMIN_REJECTED: '관리자 거부',
  COMPLETED: '완료',
  CANCELLED: '취소'
};

const PURCHASE_ORDER_STATUS_LABEL = {
  PENDING: '대기중',
  ORDERED: '주문완료',
  IN_TRANSIT: '배송중',
  DELIVERED: '배송완료',
  CANCELLED: '취소',
  RETURNED: '반품'
};

/**
 * @param {string|number|undefined|null} raw
 * @returns {number}
 */
function parseActivityTimeMs(raw) {
  if (raw == null || raw === '') {
    return 0;
  }
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * @param {object} request
 * @returns {number}
 */
function getPurchaseRequestActivityMs(request) {
  if (!request || typeof request !== 'object') {
    return 0;
  }
  const candidates = [
    request.updatedAt,
    request.adminApprovedAt,
    request.superAdminApprovedAt,
    request.createdAt
  ];
  let max = 0;
  for (const c of candidates) {
    max = Math.max(max, parseActivityTimeMs(c));
  }
  return max;
}

/**
 * @param {object} order
 * @returns {number}
 */
function getPurchaseOrderActivityMs(order) {
  if (!order || typeof order !== 'object') {
    return 0;
  }
  const candidates = [
    order.updatedAt,
    order.deliveredAt,
    order.orderedAt,
    order.createdAt
  ];
  let max = 0;
  for (const c of candidates) {
    max = Math.max(max, parseActivityTimeMs(c));
  }
  return max;
}

/**
 * @param {number} ms
 * @returns {string}
 */
function formatActivityTrailingTime(ms) {
  if (!ms) {
    return '—';
  }
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * @param {object} request
 * @returns {string}
 */
function getRequestItemLabel(request) {
  if (!request || typeof request !== 'object') {
    return '—';
  }
  const name = request.itemName ?? request.item?.name;
  return toDisplayString(name, '품목 미상');
}

/**
 * @param {string|undefined} status
 * @param {Record<string, string>} map
 * @returns {string}
 */
function mapStatusLabel(status, map) {
  if (status == null || status === '') {
    return '—';
  }
  const key = String(status).trim();
  return map[key] ?? toDisplayString(status);
}

/**
 * @param {Array<object>} requests
 * @param {Array<object>} orders
 * @returns {Array<object>}
 */
function buildActivityRows(requests, orders) {
  const rows = [];

  for (const request of requests) {
    if (!request || request.id == null) {
      continue;
    }
    const t = getPurchaseRequestActivityMs(request);
    rows.push({
      key: `pr-${request.id}`,
      kind: 'purchase_request',
      sortMs: t,
      typeLabel: ERP_ACTIVITY_TYPE_LABEL_REQUEST,
      title: `구매 요청 #${toDisplayString(request.id)}`,
      statusLabel: mapStatusLabel(request.status, PURCHASE_REQUEST_STATUS_LABEL),
      subline: getRequestItemLabel(request),
      trailing: formatActivityTrailingTime(t)
    });
  }

  for (const order of orders) {
    if (!order || order.id == null) {
      continue;
    }
    const t = getPurchaseOrderActivityMs(order);
    const supplier = toDisplayString(order.supplier, '—');
    rows.push({
      key: `po-${order.id}`,
      kind: 'purchase_order',
      sortMs: t,
      typeLabel: ERP_ACTIVITY_TYPE_LABEL_ORDER,
      title: `주문 ${toDisplayString(order.orderNumber, `#${order.id}`)}`,
      statusLabel: mapStatusLabel(order.status, PURCHASE_ORDER_STATUS_LABEL),
      subline: supplier,
      trailing: formatActivityTrailingTime(t)
    });
  }

  rows.sort((a, b) => (b.sortMs || 0) - (a.sortMs || 0));
  return rows.slice(0, ERP_RECENT_ACTIVITY_MAX_ITEMS);
}

/**
 * @param {object} props
 * @param {boolean} props.hasPurchaseRequestView
 * @param {number} [props.refreshNonce]
 */
const ErpRecentActivityFeed = ({ hasPurchaseRequestView, refreshNonce = 0 }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const load = useCallback(async() => {
    if (!hasPurchaseRequestView) {
      setLoading(false);
      setError(null);
      setRows([]);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        StandardizedApi.get(ERP_API.PURCHASE_REQUESTS),
        StandardizedApi.get(ERP_API.PURCHASE_ORDERS)
      ]);
      const reqSettled = settled[0];
      const ordSettled = settled[1];

      if (reqSettled.status === 'rejected' && ordSettled.status === 'rejected') {
        setRows([]);
        setError(toErrorMessage(reqSettled.reason));
        return;
      }

      if (reqSettled.status === 'rejected') {
        console.warn('[ErpRecentActivityFeed] 구매 요청 목록 실패:', reqSettled.reason);
      }
      if (ordSettled.status === 'rejected') {
        console.warn('[ErpRecentActivityFeed] 구매 주문 목록 실패:', ordSettled.reason);
      }

      const requests =
        reqSettled.status === 'fulfilled' ? normalizeErpListResponse(reqSettled.value) : [];
      const orders =
        ordSettled.status === 'fulfilled' ? normalizeErpListResponse(ordSettled.value) : [];

      setRows(buildActivityRows(requests, orders));
    } catch (e) {
      setRows([]);
      setError(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [hasPurchaseRequestView]);

  useEffect(() => {
    load();
  }, [load, refreshNonce]);

  return (
    <section
      className="mg-v2-ad-b0kla__card erp-recent-activity-feed"
      aria-labelledby="erp-recent-activity-heading"
      aria-busy={loading}
    >
      <h2 id="erp-recent-activity-heading" className="mg-v2-ad-b0kla__section-title">
        최근 활동
      </h2>

      {!hasPurchaseRequestView && (
        <div data-testid={ERP_RECENT_ACTIVITY_TEST.EMPTY}>
          <ErpEmptyState
            title="최근 활동 내역이 없습니다."
            description="구매 요청·주문 타임라인을 보려면 조회 권한이 필요합니다."
          />
        </div>
      )}

      {hasPurchaseRequestView && loading && (
        <div
          className="erp-recent-activity-feed__loading"
          data-testid={ERP_RECENT_ACTIVITY_TEST.LOADING}
        >
          <UnifiedLoading type="inline" text="활동을 불러오는 중..." />
        </div>
      )}

      {hasPurchaseRequestView && !loading && error && (
        <p className="erp-recent-activity-feed__error" role="alert">
          <ErpSafeText value={error} />
        </p>
      )}

      {hasPurchaseRequestView && !loading && !error && rows.length === 0 && (
        <div data-testid={ERP_RECENT_ACTIVITY_TEST.EMPTY}>
          <ErpEmptyState
            title="최근 활동 내역이 없습니다."
            description="구매 요청이나 주문이 생기면 여기에 표시됩니다."
          />
        </div>
      )}

      {hasPurchaseRequestView && !loading && !error && rows.length > 0 && (
        <ul
          className="erp-recent-activity-feed__list"
          data-testid={ERP_RECENT_ACTIVITY_TEST.LIST}
        >
          {rows.map((row) => (
            <li
              key={row.key}
              className="erp-recent-activity-feed__row"
              data-testid={`${ERP_RECENT_ACTIVITY_TEST.ITEM}-${row.key}`}
            >
              <div
                className={`erp-recent-activity-feed__leading mg-v2-ad-b0kla__admin-icon ${
                  row.kind === 'purchase_order'
                    ? 'mg-v2-ad-b0kla__admin-icon--blue'
                    : 'mg-v2-ad-b0kla__admin-icon--green'
                }`}
                aria-hidden
              >
                {row.kind === 'purchase_order' ? (
                  <ClipboardList size={ERP_RECENT_ACTIVITY_ICON_SIZE} strokeWidth={1.75} />
                ) : (
                  <ShoppingCart size={ERP_RECENT_ACTIVITY_ICON_SIZE} strokeWidth={1.75} />
                )}
              </div>
              <div className="erp-recent-activity-feed__body">
                <div className="erp-recent-activity-feed__title-line">
                  <span className="erp-recent-activity-feed__title">
                    <ErpSafeText value={row.title} />
                  </span>
                  <span className="erp-recent-activity-feed__badge">
                    <ErpSafeText value={row.typeLabel} />
                  </span>
                </div>
                <p className="erp-recent-activity-feed__meta">
                  <ErpSafeText value={row.subline} />
                  <span className="erp-recent-activity-feed__meta-sep" aria-hidden>
                    ·
                  </span>
                  <ErpSafeText value={row.statusLabel} />
                </p>
              </div>
              <div className="erp-recent-activity-feed__trailing">
                <time dateTime={row.sortMs ? new Date(row.sortMs).toISOString() : undefined}>
                  <ErpSafeText value={row.trailing} />
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ErpRecentActivityFeed;
