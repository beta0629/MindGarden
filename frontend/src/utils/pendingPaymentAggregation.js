/**
 * PENDING_PAYMENT(결제 대기) 집계·미결제 soft 매핑 병합 SSOT
 *
 * Admin 대시보드 KPI · 통합 스케줄 사이드바 · ERP Money Cockpit 가 동일 공식으로
 * 건수·대기 금액을 계산한다. PAYMENT_CONFIRMED / 회기추가 입금대기는 포함하지 않는다.
 *
 * unpaid soft (mapping 축) = {@link MAPPING_STATUS.PENDING_PAYMENT}
 * — pending-payment 전체 목록 ∪ dirty(age 부분집합) ∪ base 목록에 이미 있는 행.
 * page/size=20 목록만으로는 dirty·후순위 PENDING_PAYMENT 가 빠질 수 있어
 * {@link mergeUnpaidSoftMappings} 로 병합한다.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import { MAPPING_STATUS, MAPPING_STATUS_LABELS } from '../constants/mapping';
import { isScheduleSoftUnpaidStatus } from '../constants/schedule';
import { toSafeNumber } from './safeDisplay';

/** 사이드바 STATUS_FILTER_OPTIONS · KPI 공통 라벨 */
export const PENDING_PAYMENT_KPI_LABEL =
  MAPPING_STATUS_LABELS[MAPPING_STATUS.PENDING_PAYMENT];

/**
 * dirty pending-payment 조회 기본 ageHours (정리 화면 기본 옵션과 동일).
 * 호출부 매직 넘버 금지용 SSOT.
 */
export const PENDING_PAYMENT_DIRTY_DEFAULT_AGE_HOURS = 24;

/**
 * pending-payment API 응답 등에서 매핑 배열을 꺼낸다.
 * 파싱 불가면 null (호출부에서 hide/0 처리).
 *
 * @param {unknown} raw
 * @returns {Array<object>|null}
 */
export function unwrapPendingPaymentMappings(raw) {
  if (raw == null) {
    return null;
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== 'object') {
    return null;
  }
  if (Array.isArray(raw.mappings)) {
    return raw.mappings;
  }
  const data = raw.data ?? raw;
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.mappings)) {
      return data.mappings;
    }
    if (Array.isArray(data.content)) {
      return data.content;
    }
    if (Array.isArray(data.items)) {
      return data.items;
    }
  }
  return null;
}

/**
 * dirty pending-payment page 응답에서 매핑 배열을 꺼낸다.
 * 형태: `{ items }` / ApiResponse `{ data: { items } }` / 배열.
 * mappingId-only 행은 카드·리스트 키용 `id` 를 보강한다 (행을 새로 만들지 않음).
 *
 * @param {unknown} raw
 * @returns {Array<object>|null}
 */
export function unwrapDirtyPendingPaymentMappings(raw) {
  if (raw == null) {
    return null;
  }
  let items = null;
  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === 'object') {
    if (Array.isArray(raw.items)) {
      items = raw.items;
    } else {
      const data = raw.data;
      if (Array.isArray(data)) {
        items = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.items)) {
        items = data.items;
      }
    }
  }
  if (items == null) {
    return null;
  }
  return items.map(normalizeUnpaidSoftMappingIdentity);
}

/**
 * mapping 축 unpaid soft 여부 — {@link MAPPING_STATUS.PENDING_PAYMENT} 만.
 *
 * @param {unknown} status
 * @returns {boolean}
 */
export function isUnpaidSoftMappingStatus(status) {
  if (status == null || status === '') {
    return false;
  }
  return String(status) === MAPPING_STATUS.PENDING_PAYMENT;
}

/**
 * PENDING_PAYMENT 집합만 유지.
 * status 부재 시 pending-payment API 스코프 응답으로 간주해 포함.
 * PAYMENT_CONFIRMED 등 다른 status는 제외.
 *
 * @param {unknown} list
 * @returns {Array<object>}
 */
export function selectPendingPaymentMappings(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter((item) => {
    if (item == null || typeof item !== 'object') {
      return false;
    }
    const status = item.status;
    if (status == null || status === '') {
      return true;
    }
    return isUnpaidSoftMappingStatus(status);
  });
}

/**
 * @param {unknown} list
 * @returns {number}
 */
export function countPendingPaymentMappings(list) {
  return selectPendingPaymentMappings(list).length;
}

/**
 * packagePrice ?? paymentAmount 합 (사이드바·KPI·Money Cockpit 동일).
 *
 * @param {unknown} list
 * @returns {number}
 */
export function sumPendingPaymentAmount(list) {
  return selectPendingPaymentMappings(list).reduce(
    (sum, item) => sum + toSafeNumber(item?.packagePrice ?? item?.paymentAmount, 0),
    0
  );
}

/**
 * raw 응답 → { count, totalAmount }. 파싱 불가면 count/amount 0.
 *
 * @param {unknown} raw
 * @returns {{ count: number, totalAmount: number, mappings: Array<object> }}
 */
export function aggregatePendingPaymentStats(raw) {
  const unwrapped = unwrapPendingPaymentMappings(raw);
  const mappings = selectPendingPaymentMappings(unwrapped ?? []);
  return {
    mappings,
    count: mappings.length,
    totalAmount: sumPendingPaymentAmount(mappings)
  };
}

/**
 * 매핑 행 identity — `id` 또는 dirty 응답의 `mappingId`.
 * 둘 다 없으면 null (행을 발명하지 않음).
 *
 * @param {object} row
 * @returns {string|null}
 */
function resolveUnpaidSoftMappingId(row) {
  if (row == null || typeof row !== 'object') {
    return null;
  }
  if (row.id != null && row.id !== '') {
    return String(row.id);
  }
  if (row.mappingId != null && row.mappingId !== '') {
    return String(row.mappingId);
  }
  return null;
}

/**
 * dirty 행 등 mappingId-only → 카드 키용 id 보강.
 *
 * @param {object} row
 * @returns {object}
 */
function normalizeUnpaidSoftMappingIdentity(row) {
  if (row == null || typeof row !== 'object') {
    return row;
  }
  if (row.id != null && row.id !== '') {
    return row;
  }
  if (row.mappingId != null && row.mappingId !== '') {
    return { ...row, id: row.mappingId };
  }
  return row;
}

/**
 * 필드가 더 채워진 행을 선호해 shallow merge.
 *
 * @param {object} a
 * @param {object} b
 * @returns {object}
 */
function preferRicherUnpaidSoftMapping(a, b) {
  const score = (row) => Object.keys(row).filter((k) => {
    const v = row[k];
    return v != null && v !== '';
  }).length;
  if (score(b) > score(a)) {
    return { ...a, ...b };
  }
  return { ...b, ...a };
}

/**
 * pending/dirty raw → PENDING_PAYMENT 행 배열.
 * 배열이면 그대로 select, 아니면 dirty unwrap 후 pending unwrap.
 *
 * @param {unknown} raw
 * @returns {Array<object>}
 */
function coercePendingPaymentList(raw) {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return selectPendingPaymentMappings(raw.map(normalizeUnpaidSoftMappingIdentity));
  }
  const dirty = unwrapDirtyPendingPaymentMappings(raw);
  if (dirty != null) {
    return selectPendingPaymentMappings(dirty);
  }
  const pending = unwrapPendingPaymentMappings(raw);
  return selectPendingPaymentMappings(
    (pending ?? []).map(normalizeUnpaidSoftMappingIdentity)
  );
}

/**
 * pending/dirty unpaid soft 행의 status SSOT.
 * status 부재(API 스코프)는 {@link MAPPING_STATUS.PENDING_PAYMENT}.
 *
 * @param {object} row
 * @returns {string}
 */
function resolveUnpaidSoftStatus(row) {
  const status = row?.status;
  if (status == null || status === '') {
    return MAPPING_STATUS.PENDING_PAYMENT;
  }
  return String(status);
}

/**
 * base 목록에 pending-payment·dirty 등 unpaid soft 행을 병합한다.
 * - dedupe: id 또는 mappingId
 * - 동일 id 는 필드가 더 많은(richer) 행을 선호
 * - identity 없는 행은 버림 (발명 금지)
 * - base 의 비-PENDING 행은 유지하고, pendingLists 의 PENDING_PAYMENT 만 추가·갱신
 * - pendingOnly 병합 시 richer ACTIVE base 가 status 를 덮어쓰지 않음 (결제대기 CTA SSOT)
 *
 * @param {unknown} baseList
 * @param {...unknown} pendingLists pending-payment / dirty raw 또는 배열
 * @returns {Array<object>}
 */
export function mergeUnpaidSoftMappings(baseList, ...pendingLists) {
  const byId = new Map();

  const upsert = (row, { pendingOnly = false } = {}) => {
    if (row == null || typeof row !== 'object') {
      return;
    }
    const normalized = normalizeUnpaidSoftMappingIdentity(row);
    const id = resolveUnpaidSoftMappingId(normalized);
    if (id == null) {
      return;
    }
    if (pendingOnly) {
      const status = normalized.status;
      if (status != null && status !== '' && !isUnpaidSoftMappingStatus(status)) {
        return;
      }
    }
    const existing = byId.get(id);
    if (!existing) {
      if (pendingOnly) {
        byId.set(id, {
          ...normalized,
          status: resolveUnpaidSoftStatus(normalized)
        });
        return;
      }
      byId.set(id, normalized);
      return;
    }
    if (pendingOnly) {
      // pending-payment/dirty SSOT: 필드 보강 + unpaid status 강제 (ACTIVE richer overwrite 방지)
      const preferred = preferRicherUnpaidSoftMapping(existing, {
        ...existing,
        ...normalized
      });
      byId.set(id, {
        ...preferred,
        status: resolveUnpaidSoftStatus(normalized)
      });
      return;
    }
    byId.set(id, preferRicherUnpaidSoftMapping(existing, normalized));
  };

  if (Array.isArray(baseList)) {
    baseList.forEach((row) => upsert(row, { pendingOnly: false }));
  }

  pendingLists.forEach((raw) => {
    coercePendingPaymentList(raw).forEach((row) => upsert(row, { pendingOnly: true }));
  });

  return Array.from(byId.values());
}

/**
 * Admin schedules 목록 응답에서 스케줄 배열을 꺼낸다.
 * content / schedules / data / list / 배열 등 공통 형태.
 * 파싱 불가면 빈 배열 (발명 금지).
 *
 * @param {unknown} raw
 * @returns {Array<object>}
 */
export function unwrapAdminSchedulesList(raw) {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== 'object') {
    return [];
  }
  if (Array.isArray(raw.content)) {
    return raw.content;
  }
  if (Array.isArray(raw.schedules)) {
    return raw.schedules;
  }
  if (Array.isArray(raw.list)) {
    return raw.list;
  }
  if (Array.isArray(raw.items)) {
    return raw.items;
  }
  const data = raw.data;
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.content)) {
      return data.content;
    }
    if (Array.isArray(data.schedules)) {
      return data.schedules;
    }
    if (Array.isArray(data.list)) {
      return data.list;
    }
    if (Array.isArray(data.items)) {
      return data.items;
    }
  }
  return [];
}

/**
 * 가예약(soft unpaid) 스케줄 행에서 mappingId 집합.
 * status 는 {@link isScheduleSoftUnpaidStatus} (TENTATIVE_PENDING_PAYMENT) 만.
 * mappingId 우선, 없으면 id. 둘 다 없으면 스킵.
 *
 * @param {unknown} schedules
 * @returns {Set<string>}
 */
export function selectScheduleSoftUnpaidMappingIds(schedules) {
  const ids = new Set();
  if (!Array.isArray(schedules)) {
    return ids;
  }
  schedules.forEach((row) => {
    if (row == null || typeof row !== 'object') {
      return;
    }
    if (!isScheduleSoftUnpaidStatus(row.status)) {
      return;
    }
    let key = null;
    if (row.mappingId != null && row.mappingId !== '') {
      key = row.mappingId;
    } else if (row.id != null && row.id !== '') {
      key = row.id;
    }
    if (key == null) {
      return;
    }
    ids.add(String(key));
  });
  return ids;
}

/**
 * TENTATIVE_PENDING_PAYMENT 스케줄이 가리키는 기존 매핑에 unpaid soft status 를 입힌다.
 * 행을 발명하지 않으며, 이미 PENDING_PAYMENT 인 행은 그대로 둔다.
 *
 * @param {unknown} mergedMappings
 * @param {unknown} schedulesRaw
 * @returns {Array<object>}
 */
export function applyUnpaidSoftStatusFromSchedules(mergedMappings, schedulesRaw) {
  if (!Array.isArray(mergedMappings)) {
    return [];
  }
  const softIds = selectScheduleSoftUnpaidMappingIds(
    unwrapAdminSchedulesList(schedulesRaw)
  );
  if (softIds.size === 0) {
    return mergedMappings;
  }
  return mergedMappings.map((row) => {
    if (row == null || typeof row !== 'object') {
      return row;
    }
    const id = resolveUnpaidSoftMappingId(row);
    if (id == null || !softIds.has(String(id))) {
      return row;
    }
    if (isUnpaidSoftMappingStatus(row.status)) {
      return row;
    }
    return {
      ...row,
      status: MAPPING_STATUS.PENDING_PAYMENT
    };
  });
}

/**
 * 가예약 사이드바 카드 SSOT: pending/dirty unpaid soft ∪
 * TENTATIVE_PENDING_PAYMENT 스케줄이 가리키는 기존 매핑 행.
 *
 * - 기본: {@link selectPendingPaymentMappings}(mergedMappings)
 * - 스케줄 soft unpaid mappingId 가 merged 에 있으면(status drift 포함) 기존 행만 패스스루
 *   (카드 CTA용으로 unpaid status 강제 — ACTIVE 잔존 시 회기남음 액션만 보이는 회귀 방지)
 * - merged 에 매핑 행이 없으면 스킵 (clientName 등 발명 금지)
 *
 * @param {unknown} mergedMappings
 * @param {unknown} schedulesRaw
 * @returns {Array<object>}
 */
export function mergeUnpaidSoftWithScheduleMappingIds(mergedMappings, schedulesRaw) {
  const cardById = new Map();

  const putCardRow = (row) => {
    if (row == null || typeof row !== 'object') {
      return;
    }
    const normalized = normalizeUnpaidSoftMappingIdentity(row);
    const id = resolveUnpaidSoftMappingId(normalized);
    if (id == null) {
      return;
    }
    const unpaidRow = isUnpaidSoftMappingStatus(normalized.status)
      ? normalized
      : { ...normalized, status: MAPPING_STATUS.PENDING_PAYMENT };
    if (!cardById.has(id)) {
      cardById.set(id, unpaidRow);
    }
  };

  selectPendingPaymentMappings(mergedMappings).forEach(putCardRow);

  const mergedById = new Map();
  if (Array.isArray(mergedMappings)) {
    mergedMappings.forEach((row) => {
      if (row == null || typeof row !== 'object') {
        return;
      }
      const normalized = normalizeUnpaidSoftMappingIdentity(row);
      const id = resolveUnpaidSoftMappingId(normalized);
      if (id == null) {
        return;
      }
      if (!mergedById.has(id)) {
        mergedById.set(id, normalized);
      }
    });
  }

  const softIds = selectScheduleSoftUnpaidMappingIds(
    unwrapAdminSchedulesList(schedulesRaw)
  );
  softIds.forEach((id) => {
    const existing = mergedById.get(String(id));
    if (!existing) {
      return;
    }
    putCardRow(existing);
  });

  return Array.from(cardById.values());
}
