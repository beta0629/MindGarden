/**
 * 상담일지 조회 — 기간·페이지·이름 매칭. UI와 분리한 순수 함수.
 *
 * @author CoreSolution
 * @since 2026-10-10
 */

import { ADMIN_LIST_DRAIN_PAGE_SIZE, buildAdminListParams } from '../../../api/adminListFetch';
import { CONSULTANT_SUITE_PAGE_SIZE } from '../../../constants/consultantSuite';

export const API_ADMIN_CONSULTATION_RECORDS = '/api/v1/admin/consultation-records';

/** 표 한 페이지. 상담사 스위트 목록과 같은 크기. */
export const CONSULTATION_LOG_TABLE_PAGE_SIZE = CONSULTANT_SUITE_PAGE_SIZE;

/** 캘린더 월 범위 한 번에 받는 크기. 공통 목록 상한. */
export const CONSULTATION_LOG_CALENDAR_PAGE_SIZE = ADMIN_LIST_DRAIN_PAGE_SIZE;

/**
 * 캘린더 월 조회가 무한 루프가 되지 않게 두는 안전 페이지 수.
 * 이전 10페이지 침묵 절단 대신, 넘치면 화면에서 안내한다.
 */
export const CONSULTATION_LOG_CALENDAR_SAFETY_MAX_PAGES = 25;

export const CONSULTATION_LOG_STATUS_ALL = '';
export const CONSULTATION_LOG_STATUS_DONE = 'done';
export const CONSULTATION_LOG_STATUS_PENDING = 'pending';

const DEFAULT_RANGE_MONTHS_BEFORE = 1;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const UNMATCHED_CLIENT_ID = '-1';

/**
 * @param {Date} date
 * @returns {string}
 */
export const formatIsoDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * 기본 기간 (지난 달 1일 ~ 이번 달 말일).
 *
 * @param {Date} [now]
 * @returns {{ startDate: string, endDate: string }}
 */
export const computeDefaultDateRange = (now = new Date()) => {
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month - DEFAULT_RANGE_MONTHS_BEFORE, 1);
  const end = new Date(year, month + 1, 0);
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
};

/**
 * @param {string} iso
 * @param {number} days
 * @returns {string|null}
 */
export const shiftIsoDate = (iso, days) => {
  const match = String(iso || '').match(ISO_DATE_PATTERN);
  if (!match) {
    return null;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
};

/**
 * ISO 날짜가 속한 달의 1일~말일.
 *
 * @param {string} iso
 * @returns {{ startDate: string, endDate: string }|null}
 */
export const monthBounds = (iso) => {
  const match = String(iso || '').match(ISO_DATE_PATTERN);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const last = new Date(year, month, 0).getDate();
  return {
    startDate: `${match[1]}-${match[2]}-01`,
    endDate: `${match[1]}-${match[2]}-${String(last).padStart(2, '0')}`
  };
};

/**
 * 두 기간의 교집합. 없으면 null.
 *
 * @param {string} aStart
 * @param {string} aEnd
 * @param {string} bStart
 * @param {string} bEnd
 * @returns {{ startDate: string, endDate: string }|null}
 */
export const intersectDateRanges = (aStart, aEnd, bStart, bEnd) => {
  if (!aStart || !aEnd || !bStart || !bEnd) {
    return null;
  }
  const startDate = aStart > bStart ? aStart : bStart;
  const endDate = aEnd < bEnd ? aEnd : bEnd;
  if (startDate > endDate) {
    return null;
  }
  return { startDate, endDate };
};

/**
 * @param {*} response
 * @param {number} [pageSize]
 * @returns {{ data: Array, totalCount: number, totalPages: number }}
 */
export const normalizeAdminConsultationRecordsPage = (
  response,
  pageSize = CONSULTATION_LOG_TABLE_PAGE_SIZE
) => {
  if (Array.isArray(response)) {
    return {
      data: response,
      totalCount: response.length,
      totalPages: 1
    };
  }
  if (!response || typeof response !== 'object') {
    return { data: [], totalCount: 0, totalPages: 1 };
  }
  const data = Array.isArray(response.data) ? response.data : [];
  const parsedTotalCount = Number(
    response.totalCount ?? response.totalElements ?? response.total
  );
  const totalCount = Number.isFinite(parsedTotalCount) ? parsedTotalCount : data.length;
  const parsedTotalPages = Number(response.totalPages);
  let totalPages;
  if (Number.isFinite(parsedTotalPages) && parsedTotalPages > 0) {
    totalPages = parsedTotalPages;
  } else if (totalCount > 0 && pageSize > 0) {
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  } else {
    totalPages = 1;
  }
  return { data, totalCount, totalPages };
};

/**
 * 한 페이지. 표 조회용. 전 페이지를 모으지 않는다.
 *
 * @param {Function} apiGet
 * @param {string} endpoint
 * @param {Object} params page/size 포함
 * @returns {Promise<{ data: Array, totalCount: number, totalPages: number }>}
 */
export const fetchConsultationRecordsPage = async(apiGet, endpoint, params) => {
  const response = await apiGet(endpoint, params, { unwrapApiEnvelope: false });
  const pageSize = Number(params?.size) || CONSULTATION_LOG_TABLE_PAGE_SIZE;
  return normalizeAdminConsultationRecordsPage(response, pageSize);
};

/**
 * 캘린더 월 범위. totalPages 까지 모으고, 안전 상한을 넘으면 truncated.
 *
 * @param {Function} apiGet
 * @param {string} endpoint
 * @param {Object} baseParams
 * @param {{ pageSize?: number, maxPages?: number }} [options]
 * @returns {Promise<{ records: Array, totalCount: number, truncated: boolean }>}
 */
export const fetchConsultationRecordPages = async(apiGet, endpoint, baseParams = {}, options = {}) => {
  const pageSize = options.pageSize ?? CONSULTATION_LOG_CALENDAR_PAGE_SIZE;
  const maxPages = options.maxPages ?? CONSULTATION_LOG_CALENDAR_SAFETY_MAX_PAGES;
  const accumulated = [];
  let page = 0;
  let totalCount = 0;

  while (page < maxPages) {
    const params = buildAdminListParams({
      ...(baseParams || {}),
      page,
      size: pageSize
    });
    const normalized = await fetchConsultationRecordsPage(apiGet, endpoint, params);
    totalCount = normalized.totalCount;
    accumulated.push(...normalized.data);
    const reachedEnd = page + 1 >= normalized.totalPages
      || normalized.data.length === 0
      || (totalCount > 0 && accumulated.length >= totalCount);
    if (reachedEnd) {
      return { records: accumulated, totalCount, truncated: false };
    }
    page += 1;
  }

  return {
    records: accumulated,
    totalCount,
    truncated: totalCount > accumulated.length
  };
};

/**
 * 캘린더 수집 호환 래퍼. 배열만 반환한다.
 *
 * @param {Function} apiGet
 * @param {Object} [baseParams]
 * @param {Object} [options]
 * @returns {Promise<Array>}
 */
export const fetchAllAdminConsultationRecords = async(apiGet, baseParams = {}, options = {}) => {
  const endpoint = options.endpoint ?? API_ADMIN_CONSULTATION_RECORDS;
  const result = await fetchConsultationRecordPages(apiGet, endpoint, baseParams, options);
  return result.records;
};

/** @deprecated 안전 상한 이름. 표 조회에는 쓰지 않는다. */
export const ADMIN_CONSULTATION_RECORDS_PAGE_SIZE = CONSULTATION_LOG_CALENDAR_PAGE_SIZE;

/** @deprecated 침묵 절단이 아니다. 넘치면 truncated 로 알린다. */
export const ADMIN_CONSULTATION_RECORDS_MAX_PAGES = CONSULTATION_LOG_CALENDAR_SAFETY_MAX_PAGES;

/**
 * 복호화된 내담자 명단에서 이름에 검색어가 들어간 id.
 *
 * @param {Array<{ id?: number|string, name?: string, userName?: string }>} clients
 * @param {string} keyword
 * @returns {number[]}
 */
export const findClientIdsByName = (clients, keyword) => {
  const query = String(keyword || '').trim().toLowerCase();
  if (!query) {
    return [];
  }
  return (clients || []).reduce((ids, client) => {
    const id = Number(client?.id);
    const name = String(client?.name || client?.userName || '').trim().toLowerCase();
    if (Number.isInteger(id) && id > 0 && name.includes(query)) {
      ids.push(id);
    }
    return ids;
  }, []);
};

/**
 * 목록 API 쿼리. 검색어가 있으면 이름 매칭 id 와 keyword 를 함께 보낸다.
 *
 * @param {Object} filters
 * @returns {Object}
 */
export const buildConsultationLogQueryParams = (filters) => {
  const params = {
    startDate: filters.startDate,
    endDate: filters.endDate
  };
  if (filters.consultantId != null) {
    params.consultantId = filters.consultantId;
  }
  if (filters.clientId != null) {
    params.clientId = filters.clientId;
  }
  if (filters.status === CONSULTATION_LOG_STATUS_DONE) {
    params.sessionCompleted = true;
  } else if (filters.status === CONSULTATION_LOG_STATUS_PENDING) {
    params.sessionCompleted = false;
  }
  const keyword = String(filters.keyword || '').trim();
  if (keyword) {
    params.keyword = keyword;
    const ids = findClientIdsByName(filters.clients, keyword);
    params.matchedClientIds = ids.length > 0 ? ids.join(',') : UNMATCHED_CLIENT_ID;
  }
  return params;
};

/**
 * @param {string|null|undefined} recordName
 * @param {number|string|null|undefined} id
 * @param {Object|null|undefined} nameMap
 * @param {string} unknownLabel
 * @returns {string}
 */
export const resolvePersonName = (recordName, id, nameMap, unknownLabel) => {
  const direct = String(recordName || '').trim();
  if (direct) {
    return direct;
  }
  if (id != null && nameMap) {
    const mapped = String(nameMap[Number(id)] || '').trim();
    if (mapped) {
      return mapped;
    }
  }
  return unknownLabel;
};

/**
 * 회기. 없거나 0 이하면 빈 문자열.
 *
 * @param {number|string|null|undefined} sessionNumber
 * @returns {number|null}
 */
export const visibleSessionNumber = (sessionNumber) => {
  const value = Number(sessionNumber);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
};

/**
 * 목록 행의 요약. 미리보기 → summary → mainIssues 첫 줄.
 *
 * @param {Object|null|undefined} record
 * @returns {string}
 */
export const resolveSummaryText = (record) => {
  if (!record || typeof record !== 'object') {
    return '';
  }
  const raw = record.summaryPreview ?? record.summary ?? record.mainIssues ?? '';
  return String(raw).split(/\r?\n/)[0].trim();
};

/**
 * 상세 본문. 주요 이슈, 내담자 반응, 관찰 순으로 첫 비어 있지 않은 값.
 *
 * @param {Object|null|undefined} record
 * @returns {string}
 */
export const resolveContentText = (record) => {
  if (!record || typeof record !== 'object') {
    return '';
  }
  const candidates = [record.mainIssues, record.clientResponse, record.consultantObservations, record.content];
  const found = candidates.find((value) => String(value || '').trim());
  return found ? String(found).trim() : '';
};

/**
 * @param {string|null|undefined} value
 * @returns {string}
 */
export const formatDisplayDate = (value) => {
  if (!value) {
    return '';
  }
  return String(value).split('T')[0];
};
