/**
 * Ops Approval Center — cross-type inbox adapter (기존 API만 호출, 금액 SSOT 변경 없음)
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import StandardizedApi from '../../../utils/standardizedApi';
import { ERP_API } from '../../../constants/api';
import { SALARY_API_ENDPOINTS, SALARY_STATUS } from '../../../constants/salaryConstants';
import { OAC_TYPE_LABELS } from '../../../constants/opsApprovalCenterStrings';
import { toDisplayString } from '../../../utils/safeDisplay';

export const OAC_ITEM_TYPE = {
  PURCHASE: 'PURCHASE',
  SALARY: 'SALARY',
  REFUND: 'REFUND'
};

const REFUND_HISTORY_ENDPOINT = '/api/v1/admin/refund-history';

/**
 * @param {unknown} list
 * @returns {Array}
 */
function asArray(list) {
  if (Array.isArray(list)) return list;
  if (list && Array.isArray(list.data)) return list.data;
  if (list && Array.isArray(list.content)) return list.content;
  if (list && Array.isArray(list.items)) return list.items;
  return [];
}

/**
 * @param {string|Date|null|undefined} value
 * @returns {boolean}
 */
export function isSameLocalDay(value) {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
  );
}

/**
 * @param {object} request
 * @returns {object}
 */
function mapPurchaseItem(request) {
  const id = request?.id;
  const itemName = toDisplayString(request?.item?.name, '구매 요청');
  const amount = Number(request?.totalAmount ?? 0);
  return {
    key: `purchase-${id}`,
    id,
    type: OAC_ITEM_TYPE.PURCHASE,
    typeLabel: OAC_TYPE_LABELS.PURCHASE,
    title: toDisplayString(`구매 요청 #${id} · ${itemName}`, `구매 요청 #${id}`),
    requesterName: toDisplayString(request?.requester?.name, '알 수 없음'),
    amount,
    amountTone: 'expense',
    createdAt: request?.createdAt ?? null,
    raw: request,
    canApprove: true,
    canReject: true
  };
}

/**
 * @param {object} calc
 * @returns {object}
 */
function mapSalaryItem(calc) {
  const id = calc?.id;
  const net = Number(
    calc?.netAmount ?? calc?.netPay ?? calc?.netSalary ?? calc?.totalAmount ?? 0
  );
  const period = toDisplayString(calc?.calculationPeriod ?? calc?.period, '');
  const name = toDisplayString(
    calc?.consultantName ?? calc?.consultant?.name,
    `상담사 #${toDisplayString(calc?.consultantId, '')}`
  );
  return {
    key: `salary-${id}`,
    id,
    type: OAC_ITEM_TYPE.SALARY,
    typeLabel: OAC_TYPE_LABELS.SALARY,
    title: period ? `급여 ${period}` : '급여 승인 대기',
    requesterName: name,
    amount: net,
    amountTone: 'inflow',
    createdAt: calc?.createdAt ?? calc?.calculatedAt ?? null,
    raw: calc,
    canApprove: true,
    canReject: false
  };
}

/**
 * @param {object} row
 * @returns {object}
 */
function mapRefundItem(row) {
  const id = row?.id ?? row?.refundId ?? row?.mappingId;
  const amount = Number(row?.refundAmount ?? row?.amount ?? 0);
  const clientName = toDisplayString(
    row?.clientName ?? row?.client?.name,
    '환불 요청'
  );
  return {
    key: `refund-${id}`,
    id,
    type: OAC_ITEM_TYPE.REFUND,
    typeLabel: OAC_TYPE_LABELS.REFUND,
    title: toDisplayString(row?.reason ?? row?.packageName, `환불 #${id}`),
    requesterName: clientName,
    amount,
    amountTone: 'inflow',
    createdAt: row?.createdAt ?? row?.refundDate ?? null,
    raw: row,
    canApprove: false,
    canReject: false,
    openRefundManagement: true
  };
}

/**
 * @param {'admin'|'super'} mode
 * @returns {Promise<object[]>}
 */
async function fetchPurchasePending(mode) {
  const endpoint = mode === 'super'
    ? ERP_API.PURCHASE_REQUESTS_PENDING_SUPER_ADMIN
    : ERP_API.PURCHASE_REQUESTS_PENDING_ADMIN;
  const list = await StandardizedApi.get(endpoint);
  return asArray(list).map(mapPurchaseItem);
}

/**
 * @returns {Promise<object[]>}
 */
async function fetchSalaryPending() {
  const list = await StandardizedApi.get(SALARY_API_ENDPOINTS.CALCULATIONS);
  return asArray(list)
    .filter((row) => {
      const status = String(row?.status ?? row?.calculationStatus ?? '').toUpperCase();
      return status === SALARY_STATUS.CALCULATED;
    })
    .map(mapSalaryItem);
}

/**
 * @returns {Promise<object[]>}
 */
async function fetchRefundPending() {
  try {
    const result = await StandardizedApi.get(REFUND_HISTORY_ENDPOINT, {
      page: 0,
      size: 50,
      status: 'REQUESTED'
    });
    const rows = asArray(result?.history ?? result?.refunds ?? result?.content ?? result);
    return rows
      .filter((row) => {
        const status = String(row?.status ?? row?.refundStatus ?? 'REQUESTED').toUpperCase();
        return status === 'REQUESTED' || status === 'PENDING';
      })
      .map(mapRefundItem);
  } catch (err) {
    console.warn('환불 대기 목록 조회 생략:', err?.message || err);
    return [];
  }
}

/**
 * @returns {Promise<{ rejectedCount: number, todayProcessedCount: number }>}
 */
async function fetchPurchaseSummaryExtras() {
  try {
    const list = await StandardizedApi.get(ERP_API.PURCHASE_REQUESTS);
    const rows = asArray(list);
    let rejectedCount = 0;
    let todayProcessedCount = 0;
    rows.forEach((row) => {
      const status = String(row?.status ?? '').toUpperCase();
      if (status.includes('REJECT')) {
        rejectedCount += 1;
        if (isSameLocalDay(row?.adminApprovedAt ?? row?.updatedAt ?? row?.createdAt)) {
          todayProcessedCount += 1;
        }
      } else if (status.includes('APPROV') && isSameLocalDay(row?.adminApprovedAt ?? row?.updatedAt)) {
        todayProcessedCount += 1;
      }
    });
    return { rejectedCount, todayProcessedCount };
  } catch (err) {
    console.warn('구매 요약 보조 집계 생략:', err?.message || err);
    return { rejectedCount: 0, todayProcessedCount: 0 };
  }
}

/**
 * Cross-type pending inbox + summary KPIs.
 *
 * @param {{ mode?: 'admin'|'super' }} [options]
 * @returns {Promise<{ items: object[], pendingCount: number, todayCount: number, rejectedCount: number }>}
 */
export async function loadOpsApprovalInbox(options = {}) {
  const mode = options.mode === 'super' ? 'super' : 'admin';

  if (mode === 'super') {
    const purchaseItems = await fetchPurchasePending('super');
    const todayPending = purchaseItems.filter((item) => isSameLocalDay(item.createdAt)).length;
    const extras = await fetchPurchaseSummaryExtras();
    return {
      items: purchaseItems,
      pendingCount: purchaseItems.length,
      todayCount: todayPending + extras.todayProcessedCount,
      rejectedCount: extras.rejectedCount
    };
  }

  const [purchaseItems, salaryItems, refundItems, extras] = await Promise.all([
    fetchPurchasePending('admin'),
    fetchSalaryPending(),
    fetchRefundPending(),
    fetchPurchaseSummaryExtras()
  ]);

  const items = [...purchaseItems, ...salaryItems, ...refundItems].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const todayPending = items.filter((item) => isSameLocalDay(item.createdAt)).length;

  return {
    items,
    pendingCount: items.length,
    todayCount: todayPending + extras.todayProcessedCount,
    rejectedCount: extras.rejectedCount
  };
}

/**
 * @param {object} item
 * @param {{ adminId: number|string, comment?: string, mode?: 'admin'|'super' }} ctx
 * @returns {Promise<object>}
 */
export async function approveOpsApprovalItem(item, ctx) {
  const comment = ctx.comment ?? '';
  const adminId = ctx.adminId;
  const mode = ctx.mode === 'super' ? 'super' : 'admin';

  if (item.type === OAC_ITEM_TYPE.PURCHASE) {
    if (mode === 'super') {
      const endpoint = ERP_API.PURCHASE_REQUEST_APPROVE_SUPER_ADMIN(item.id);
      const url = `${endpoint}?superAdminId=${encodeURIComponent(adminId)}&comment=${encodeURIComponent(comment)}`;
      return StandardizedApi.post(url, {});
    }
    const endpoint = ERP_API.PURCHASE_REQUEST_APPROVE_ADMIN(item.id);
    const url = `${endpoint}?adminId=${encodeURIComponent(adminId)}&comment=${encodeURIComponent(comment)}`;
    return StandardizedApi.post(url, {});
  }

  if (item.type === OAC_ITEM_TYPE.SALARY) {
    return StandardizedApi.post(`${SALARY_API_ENDPOINTS.APPROVE}/${item.id}`, {});
  }

  throw new Error('이 유형은 인박스에서 직접 승인할 수 없습니다.');
}

/**
 * @param {object} item
 * @param {{ adminId: number|string, comment?: string, mode?: 'admin'|'super' }} ctx
 * @returns {Promise<object>}
 */
export async function rejectOpsApprovalItem(item, ctx) {
  const comment = ctx.comment ?? '';
  const adminId = ctx.adminId;
  const mode = ctx.mode === 'super' ? 'super' : 'admin';

  if (item.type !== OAC_ITEM_TYPE.PURCHASE) {
    throw new Error('이 유형은 인박스에서 직접 반려할 수 없습니다.');
  }

  if (mode === 'super') {
    const endpoint = ERP_API.PURCHASE_REQUEST_REJECT_SUPER_ADMIN(item.id);
    const url = `${endpoint}?superAdminId=${encodeURIComponent(adminId)}&comment=${encodeURIComponent(comment)}`;
    return StandardizedApi.post(url, {});
  }
  const endpoint = ERP_API.PURCHASE_REQUEST_REJECT_ADMIN(item.id);
  const url = `${endpoint}?adminId=${encodeURIComponent(adminId)}&comment=${encodeURIComponent(comment)}`;
  return StandardizedApi.post(url, {});
}
