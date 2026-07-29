/**
 * 상담일지 누락 칩 → 작성 진입 네비게이션 SSOT.
 *
 * 데이터에 scheduleId 가 있으면 바로 사용하고, 없으면
 * GET /api/v1/schedules/consultant/{id}/date?date= 로 최소 조회 후 스케줄을 고른다.
 * 조회 실패 시 어드민 상담일지 조회 deep-link(consultantId·date) 로 폴백한다.
 *
 * @author Core Solution
 * @since 2026-07-29
 */

import StandardizedApi from './standardizedApi';
import { SCHEDULE_API } from '../constants/api';
import { ADMIN_ROUTES } from '../constants/adminRoutes';
import { STATUS } from '../constants/schedule';

/** 누락 일지 작성 대상에서 제외할 스케줄 상태 */
const EXCLUDED_SCHEDULE_STATUSES = new Set([
  STATUS.CANCELLED,
  STATUS.VACATION,
  STATUS.AVAILABLE,
  'NO_SHOW'
]);

/**
 * @param {number|string} consultantId
 * @returns {string}
 */
export const buildConsultantSchedulesByDateEndpoint = (consultantId) => (
  `${SCHEDULE_API.SCHEDULES_BY_CONSULTANT}/${encodeURIComponent(String(consultantId))}/date`
);

/**
 * @param {{ consultantId?: number|string|null, date?: string|null, scheduleId?: number|string|null, clientId?: number|string|null }} params
 * @returns {string}
 */
export const buildMissingConsultationLogFallbackRoute = ({
  consultantId,
  date,
  scheduleId,
  clientId
} = {}) => {
  const params = new URLSearchParams();
  if (date) {
    params.set('date', String(date));
  }
  if (consultantId != null && consultantId !== '') {
    params.set('consultantId', String(consultantId));
  }
  if (scheduleId != null && scheduleId !== '') {
    params.set('scheduleId', String(scheduleId));
  }
  if (clientId != null && clientId !== '') {
    params.set('clientId', String(clientId));
  }
  const query = params.toString();
  return query
    ? `${ADMIN_ROUTES.CONSULTATION_LOGS}?${query}`
    : ADMIN_ROUTES.CONSULTATION_LOGS;
};

/**
 * @param {unknown} schedule
 * @returns {string}
 */
const resolveStatusCode = (schedule) => {
  if (!schedule || typeof schedule !== 'object') {
    return '';
  }
  const raw = schedule.statusCode ?? schedule.status ?? '';
  if (raw && typeof raw === 'object' && raw.name) {
    return String(raw.name).toUpperCase();
  }
  return String(raw).toUpperCase();
};

/**
 * 누락 일지 작성에 쓸 스케줄 1건 선택 (취소·휴가 등 제외, 첫 건).
 *
 * @param {Array<object>|null|undefined} schedules
 * @returns {object|null}
 */
export const pickMissingLogScheduleFromList = (schedules) => {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return null;
  }
  const eligible = schedules.filter((item) => {
    const code = resolveStatusCode(item);
    if (!code) {
      return true;
    }
    return !EXCLUDED_SCHEDULE_STATUSES.has(code);
  });
  return eligible[0] ?? schedules[0] ?? null;
};

/**
 * StandardizedApi 응답을 스케줄 배열로 정규화.
 *
 * @param {unknown} response
 * @returns {Array<object>}
 */
export const unwrapScheduleList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === 'object') {
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.success === true && Array.isArray(response.data)) {
      return response.data;
    }
  }
  return [];
};

/**
 * 칩 클릭용 스케줄 해석. scheduleId 가 있으면 최소 객체만 반환하고,
 * 없으면 consultantId+date 로 API 조회한다.
 *
 * @param {{ consultantId: number|string, date: string, scheduleId?: number|string|null, clientId?: number|string|null }} params
 * @returns {Promise<object|null>}
 */
export const resolveMissingLogSchedule = async({
  consultantId,
  date,
  scheduleId = null,
  clientId = null
}) => {
  if (scheduleId != null && scheduleId !== '') {
    return {
      id: Number(scheduleId) || scheduleId,
      consultantId,
      clientId: clientId ?? undefined,
      date,
      sessionDate: date
    };
  }

  if (consultantId == null || consultantId === '' || !date) {
    return null;
  }

  const endpoint = buildConsultantSchedulesByDateEndpoint(consultantId);
  const response = await StandardizedApi.get(endpoint, { date: String(date) });
  const list = unwrapScheduleList(response);
  const picked = pickMissingLogScheduleFromList(list);
  if (!picked) {
    return null;
  }

  return {
    ...picked,
    id: picked.id,
    consultantId: picked.consultantId ?? consultantId,
    clientId: picked.clientId ?? clientId ?? undefined,
    date: picked.date ?? date,
    sessionDate: picked.sessionDate ?? picked.date ?? date
  };
};

/**
 * item 의 선택적 scheduleIdsByDate / missingEntries 에서 해당 일자 scheduleId 추출.
 *
 * @param {object|null|undefined} item
 * @param {string} date
 * @returns {{ scheduleId: number|string|null, clientId: number|string|null }}
 */
export const lookupMissingLogIdsForDate = (item, date) => {
  if (!item || !date) {
    return { scheduleId: null, clientId: null };
  }

  const byDate = item.scheduleIdsByDate;
  if (byDate && typeof byDate === 'object' && byDate[date] != null) {
    const raw = byDate[date];
    if (raw && typeof raw === 'object') {
      return {
        scheduleId: raw.scheduleId ?? raw.id ?? null,
        clientId: raw.clientId ?? null
      };
    }
    return { scheduleId: raw, clientId: null };
  }

  if (Array.isArray(item.missingEntries)) {
    const entry = item.missingEntries.find((e) => String(e?.date ?? '') === String(date));
    if (entry) {
      return {
        scheduleId: entry.scheduleId ?? entry.id ?? null,
        clientId: entry.clientId ?? null
      };
    }
  }

  return { scheduleId: null, clientId: null };
};
