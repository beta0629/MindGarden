/**
 * 스케줄 상세(과거 가예약) — 「당일 결제 + 활성화」 호스트 배선 훅.
 *
 * IntegratedMatchingSchedule 의 handleCheckoutSameDayFromDetail 과 동일 메시지·페이로드를
 * 사이드바 mappings 상태 없이 lazy fetch 로 재사용한다.
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import { useCallback, useState } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import notificationManager from '../../../utils/notification';
import RoleUtils from '../../../utils/RoleUtils';

/** IntegratedMatchingSchedule.handleOpenCheckoutSameDayFromCard 와 동일 */
export const SAME_DAY_CHECKOUT_MSG_MAPPING_INCOMPLETE =
  '이 매칭은 정보가 누락되어 당일 카드 결제를 진행할 수 없습니다. 매칭을 다시 생성해 주세요.';

/** IntegratedMatchingSchedule.handleCheckoutSameDayFromDetail 과 동일 */
export const SAME_DAY_CHECKOUT_MSG_MAPPING_NOT_FOUND =
  '연결된 매칭을 찾을 수 없어 당일 결제를 진행할 수 없습니다.';

export const SAME_DAY_CHECKOUT_MSG_MAPPING_LOAD_FAILED =
  '매칭 목록을 불러오는데 실패했습니다.';

/**
 * admin/staff(및 admin-like) 역할이면 당일결제 콜백을 활성화한다.
 * 순수 CONSULTANT 세션은 false → ScheduleDetailModal 확정 fallback.
 *
 * @param {{ role?: string|null }|null|undefined} user
 * @param {boolean} [explicitEnabled]
 * @returns {boolean}
 */
export function resolveSameDayCheckoutEnabled(user, explicitEnabled) {
  if (typeof explicitEnabled === 'boolean') {
    return explicitEnabled;
  }
  if (!user) {
    return false;
  }
  return RoleUtils.isAdmin(user) || RoleUtils.isStaff(user) || RoleUtils.isOps(user);
}

/**
 * @param {object|null|undefined} scheduleData
 * @returns {string|number|null}
 */
export function resolveScheduleMappingId(scheduleData) {
  if (!scheduleData || typeof scheduleData !== 'object') {
    return null;
  }
  const mappingId = scheduleData.mappingId
    ?? scheduleData.extendedProps?.mappingId
    ?? null;
  return mappingId == null || mappingId === '' ? null : mappingId;
}

/**
 * @param {*} response
 * @returns {object[]}
 */
export function normalizeMappingsListResponse(response) {
  if (response?.mappings && Array.isArray(response.mappings)) {
    return response.mappings;
  }
  if (Array.isArray(response)) {
    return response;
  }
  return [];
}

/**
 * @param {object} mapping
 * @param {string|number|null} scheduleId
 * @returns {object|null} CheckoutSameDayModal 용 페이로드 (가드 실패 시 null)
 */
export function buildCheckoutSameDayMappingPayload(mapping, scheduleId) {
  if (!mapping?.consultantId || !mapping?.packageName) {
    return null;
  }
  const resolvedScheduleId = scheduleId
    ?? mapping.sameDaySessionScheduleId
    ?? null;
  return {
    id: mapping.id,
    consultantId: mapping.consultantId,
    consultantName: mapping.consultantName,
    clientId: mapping.clientId,
    clientName: mapping.clientName,
    packageName: mapping.packageName,
    packagePrice: mapping.packagePrice ?? null,
    paymentAmount: mapping.paymentAmount ?? null,
    totalSessions: mapping.totalSessions ?? null,
    sameDaySessionScheduleId: resolvedScheduleId
  };
}

/**
 * @param {object|null|undefined} scheduleData
 * @param {object[]} mappings
 * @returns {{ ok: true, payload: object }|{ ok: false, reason: 'missing_mapping_id'|'not_found'|'incomplete' }}
 */
export function resolveCheckoutMappingFromSchedule(scheduleData, mappings) {
  const mappingId = resolveScheduleMappingId(scheduleData);
  if (mappingId == null) {
    return { ok: false, reason: 'missing_mapping_id' };
  }
  const list = Array.isArray(mappings) ? mappings : [];
  const mapping = list.find((m) => String(m.id) === String(mappingId));
  if (!mapping) {
    return { ok: false, reason: 'not_found' };
  }
  const scheduleId = scheduleData?.id ?? scheduleData?.scheduleId ?? null;
  const payload = buildCheckoutSameDayMappingPayload(mapping, scheduleId);
  if (!payload) {
    return { ok: false, reason: 'incomplete' };
  }
  return { ok: true, payload };
}

/**
 * @param {{
 *   enabled?: boolean,
 *   user?: { role?: string|null }|null,
 *   onCheckoutCompleted?: (() => void)|null
 * }} [options]
 * @returns {{
 *   onCheckoutSameDayFromDetail: ((scheduleData: object) => Promise<void>)|null,
 *   checkoutSameDayMapping: object|null,
 *   closeCheckoutSameDay: () => void,
 *   handleCheckoutSameDayCompleted: () => void,
 *   isCheckoutSameDayOpen: boolean
 * }}
 */
export default function useScheduleDetailSameDayCheckout(options = {}) {
  const {
    enabled: explicitEnabled,
    user = null,
    onCheckoutCompleted = null
  } = options;

  const enabled = resolveSameDayCheckoutEnabled(user, explicitEnabled);
  const [checkoutSameDayMapping, setCheckoutSameDayMapping] = useState(null);

  const closeCheckoutSameDay = useCallback(() => {
    setCheckoutSameDayMapping(null);
  }, []);

  const handleCheckoutSameDayCompleted = useCallback(() => {
    setCheckoutSameDayMapping(null);
    if (typeof onCheckoutCompleted === 'function') {
      onCheckoutCompleted();
    }
  }, [onCheckoutCompleted]);

  const onCheckoutSameDayFromDetail = useCallback(async(scheduleData) => {
    const mappingId = resolveScheduleMappingId(scheduleData);
    if (mappingId == null) {
      notificationManager.error(SAME_DAY_CHECKOUT_MSG_MAPPING_NOT_FOUND);
      return;
    }

    let list = [];
    try {
      const response = await StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.LIST);
      list = normalizeMappingsListResponse(response);
    } catch (error) {
      console.error('당일결제용 매칭 목록 로드 실패:', error);
      notificationManager.error(SAME_DAY_CHECKOUT_MSG_MAPPING_LOAD_FAILED);
      return;
    }

    const resolved = resolveCheckoutMappingFromSchedule(scheduleData, list);
    if (!resolved.ok) {
      if (resolved.reason === 'incomplete') {
        notificationManager.warning(SAME_DAY_CHECKOUT_MSG_MAPPING_INCOMPLETE);
        return;
      }
      notificationManager.error(SAME_DAY_CHECKOUT_MSG_MAPPING_NOT_FOUND);
      return;
    }

    setCheckoutSameDayMapping(resolved.payload);
  }, []);

  return {
    onCheckoutSameDayFromDetail: enabled ? onCheckoutSameDayFromDetail : null,
    checkoutSameDayMapping,
    closeCheckoutSameDay,
    handleCheckoutSameDayCompleted,
    isCheckoutSameDayOpen: !!checkoutSameDayMapping
  };
}
