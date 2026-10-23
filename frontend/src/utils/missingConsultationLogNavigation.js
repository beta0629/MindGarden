/**
 * 상담일지 누락 칩 → 작성 진입 네비게이션 SSOT.
 *
 * scheduleId 가 있어도 최소 객체만 열지 않고, 일정 조회로
 * sessionSequence(및 메타)를 채워 폼 sessionNumber 에 넣는다.
 * 없으면 consultantId+date 로 목록 조회 후 스케줄을 고른다.
 * 조회 실패 시 역할별 deep-link 로 폴백한다
 * (어드민: 상담일지 조회, 상담사: 상담일지 목록 incomplete 필터).
 *
 * @author Core Solution
 * @since 2026-07-29
 */

import StandardizedApi from './standardizedApi';
import { SCHEDULE_API } from '../constants/api';
import { ADMIN_ROUTES } from '../constants/adminRoutes';
import { buildConsultantConsultationRecordsRoute } from '../constants/consultantDashboardRoutes';
import { STATUS } from '../constants/schedule';
import { resolveSessionNumberFromSchedule } from './consultationRecordSessionNumber';

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
 * 일정 단건 조회 엔드포인트.
 *
 * @param {number|string} scheduleId
 * @returns {string}
 */
export const buildScheduleDetailEndpoint = (scheduleId) => (
  `${SCHEDULE_API.SCHEDULE_DETAIL}/${encodeURIComponent(String(scheduleId))}`
);

/**
 * @param {{ consultantId?: number|string|null, date?: string|null, scheduleId?: number|string|null, clientId?: number|string|null }} params
 * @param {{ basePath?: string }} [options]
 * @returns {string}
 */
export const buildMissingConsultationLogFallbackRoute = ({
  consultantId,
  date,
  scheduleId,
  clientId
} = {}, options = {}) => {
  const basePath = options.basePath || ADMIN_ROUTES.CONSULTATION_LOGS;
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
  return query ? `${basePath}?${query}` : basePath;
};

/**
 * 상담사 대시보드 — 누락 칩 폴백 (본인 미작성 일지 목록).
 *
 * @param {{ date?: string|null, scheduleId?: number|string|null, clientId?: number|string|null }} [params]
 * @returns {string}
 */
export const buildConsultantMissingConsultationLogFallbackRoute = ({
  date,
  scheduleId,
  clientId
} = {}) => buildConsultantConsultationRecordsRoute({
  filter: 'incomplete',
  date: date || undefined,
  scheduleId: scheduleId || undefined,
  clientId: clientId || undefined
});

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
 * 스케줄에 일지 미작성 신호가 있는지 (날짜-only 폴백 우선순위용).
 * 목록 표시를 숨기지 않으며, hasConsultationRecord / consultationRecordId 등이
 * 있으면 «없는 쪽»을 우선한다.
 *
 * @param {object} item
 * @returns {boolean}
 */
const looksLikeMissingConsultationRecord = (item) => {
  if (!item || typeof item !== 'object') {
    return false;
  }
  if (item.hasConsultationRecord === false
      || item.hasRecord === false
      || item.consultationRecordExists === false) {
    return true;
  }
  if (Object.prototype.hasOwnProperty.call(item, 'consultationRecordId')
      && (item.consultationRecordId == null || item.consultationRecordId === '')) {
    return true;
  }
  return false;
};

/**
 * 누락 일지 작성에 쓸 스케줄 1건 선택.
 * 취소·휴가 등 제외 후, 일지 미작성 필드가 있으면 그 건을 우선한다.
 * (목록에서 완료 건을 숨기지 않음 — 날짜-only 폴백 시에만 우선순위.)
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
  const pool = eligible.length > 0 ? eligible : schedules;
  const withoutRecord = pool.filter(looksLikeMissingConsultationRecord);
  if (withoutRecord.length > 0) {
    return withoutRecord[0];
  }
  return pool[0] ?? null;
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
 * 단건 조회 응답을 스케줄 객체로 정규화.
 *
 * @param {unknown} response
 * @returns {object|null}
 */
export const unwrapScheduleDetail = (response) => {
  if (!response || typeof response !== 'object') {
    return null;
  }
  if (response.id != null) {
    return response;
  }
  if (response.data && typeof response.data === 'object' && response.data.id != null) {
    return response.data;
  }
  return null;
};

/**
 * scheduleId 문자열에서 숫자 id 추출 (`schedule-386` → 386).
 *
 * @param {number|string|null|undefined} scheduleId
 * @returns {number|null}
 */
export const normalizeMissingLogScheduleId = (scheduleId) => {
  if (scheduleId == null || scheduleId === '') {
    return null;
  }
  const raw = String(scheduleId).trim();
  const stripped = raw.startsWith('schedule-') ? raw.slice('schedule-'.length) : raw;
  const n = Number(stripped);
  return Number.isFinite(n) ? n : null;
};

/**
 * @param {object} picked
 * @param {{ consultantId?: *, clientId?: *, date?: string|null }} defaults
 * @returns {object}
 */
const normalizeResolvedSchedule = (picked, defaults = {}) => {
  const {
    consultantId = undefined,
    clientId = undefined,
    date = undefined
  } = defaults;
  const sessionNumber = resolveSessionNumberFromSchedule(picked);
  return {
    ...picked,
    id: picked.id,
    consultantId: picked.consultantId ?? consultantId,
    clientId: picked.clientId ?? clientId ?? undefined,
    date: picked.date ?? date,
    sessionDate: picked.sessionDate ?? picked.date ?? date,
    sessionSequence: picked.sessionSequence ?? sessionNumber ?? undefined,
    sessionNumber: sessionNumber ?? picked.sessionNumber ?? undefined
  };
};

/**
 * 동일 id 스케줄을 목록에서 찾는다.
 *
 * @param {Array<object>} list
 * @param {number|string} scheduleId
 * @returns {object|null}
 */
export const findScheduleInListById = (list, scheduleId) => {
  const target = normalizeMissingLogScheduleId(scheduleId);
  if (target == null || !Array.isArray(list)) {
    return null;
  }
  return list.find((item) => {
    const id = normalizeMissingLogScheduleId(item?.id ?? item?.scheduleId);
    return id != null && id === target;
  }) ?? null;
};

/**
 * scheduleId 기준 일정 메타(sessionSequence 포함) 조회.
 * 1) consultantId+date 목록에서 id 매칭 2) 단건 GET (userId·userRole 필요)
 *
 * @param {{
 *   scheduleId: number|string,
 *   consultantId?: number|string|null,
 *   date?: string|null,
 *   clientId?: number|string|null,
 *   userId?: number|string|null,
 *   userRole?: string|null
 * }} params
 * @returns {Promise<object|null>}
 */
export const fetchScheduleMetaForMissingLog = async({
  scheduleId,
  consultantId = null,
  date = null,
  clientId = null,
  userId = null,
  userRole = null
}) => {
  const numericId = normalizeMissingLogScheduleId(scheduleId);
  if (numericId == null) {
    return null;
  }

  if (consultantId != null && consultantId !== '' && date) {
    const endpoint = buildConsultantSchedulesByDateEndpoint(consultantId);
    const response = await StandardizedApi.get(endpoint, { date: String(date) });
    const list = unwrapScheduleList(response);
    const matched = findScheduleInListById(list, numericId);
    if (matched) {
      return normalizeResolvedSchedule(matched, { consultantId, clientId, date });
    }
  }

  if (userId != null && userId !== '' && userRole) {
    const detailEndpoint = buildScheduleDetailEndpoint(numericId);
    const detailResponse = await StandardizedApi.get(detailEndpoint, {
      userId: String(userId),
      userRole: String(userRole)
    });
    const detail = unwrapScheduleDetail(detailResponse);
    if (detail) {
      return normalizeResolvedSchedule(detail, {
        consultantId: detail.consultantId ?? consultantId,
        clientId: detail.clientId ?? clientId,
        date: detail.date ?? date
      });
    }
  }

  return null;
};

/**
 * 칩 클릭용 스케줄 해석.
 * scheduleId 가 있으면 일정 조회로 sessionSequence 등 메타를 채운다.
 * 없으면 consultantId+date 로 API 조회한다.
 *
 * <p>API 실패는 catch 로 null 을 삼키지 않고 throw 한다. 호출부
 * (AdminDashboard / ConsultantDashboard / UnifiedSchedule) 가
 * fallback navigate 한다. 조회 성공·후보 없음만 null.</p>
 *
 * @param {{
 *   consultantId: number|string,
 *   date: string,
 *   scheduleId?: number|string|null,
 *   clientId?: number|string|null,
 *   userId?: number|string|null,
 *   userRole?: string|null
 * }} params
 * @returns {Promise<object|null>}
 */
export const resolveMissingLogSchedule = async({
  consultantId,
  date,
  scheduleId = null,
  clientId = null,
  userId = null,
  userRole = null
}) => {
  if (scheduleId != null && scheduleId !== '') {
    const enriched = await fetchScheduleMetaForMissingLog({
      scheduleId,
      consultantId,
      date,
      clientId,
      userId,
      userRole
    });
    if (enriched) {
      return enriched;
    }
    // 조회 실패 시 메타 없는 최소 객체로 열지 않음 — 호출부 fallback
    return null;
  }

  if (consultantId == null || consultantId === '' || !date) {
    return null;
  }

  const endpoint = buildConsultantSchedulesByDateEndpoint(consultantId);
  // 실패 시 throw — 호출부 catch 에서 fallback navigate (null 삼킴 금지)
  const response = await StandardizedApi.get(endpoint, { date: String(date) });
  const list = unwrapScheduleList(response);
  const picked = pickMissingLogScheduleFromList(list);
  if (!picked) {
    return null;
  }

  return normalizeResolvedSchedule(picked, { consultantId, clientId, date });
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
