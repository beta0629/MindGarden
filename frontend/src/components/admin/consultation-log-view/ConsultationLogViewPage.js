/**
 * 상담일지 조회.
 * 관리자 표면은 조회 버튼·서버 페이지·읽기 전용 상세.
 * 상담사 표면은 즉시 필터·칩·카드 목록을 유지한다.
 *
 * @author Core Solution
 * @since 2025-03-02
 * @updated 2026-10-10 — 403 폴백 제거, 표 서버 페이지네이션
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { buildAdminListParams } from '../../../api/adminListFetch';
import { useSearchParams } from 'react-router-dom';
import StandardizedApi from '../../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { useSession } from '../../../contexts/SessionContext';
import { RoleUtils } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import {
  CONSULTATION_LOG_BODY_ACCESS_STRINGS,
  canAccessConsultationLogBody
} from '../../../utils/consultationLogBodyAccess';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import ConsultationLogFilterSection from './ConsultationLogFilterSection';
import ConsultationLogCalendarBlock from './ConsultationLogCalendarBlock';
import ConsultationLogTableBlock from './ConsultationLogTableBlock';
import ConsultationLogDetailPanel from './ConsultationLogDetailPanel';
import ConsultationLogResultsState from './ConsultationLogResultsState';
import ConsultationLogModal from '../../consultant/ConsultationLogModal';
import { getAllConsultantsWithStats, getAllClientsWithStats } from '../../../utils/consultantHelper';
import SaveViewModal from '../ClientComprehensiveManagement/molecules/SaveViewModal';
import { useSavedViewPreference } from '../../../hooks/useSavedViewPreference';
import {
  CONSULTATION_LOG_VIEW_DEFAULT_VIEW_MODE,
  CONSULTATION_LOG_VIEW_SAVED_VIEW_PAGE_ID,
  CONSULTATION_LOG_VIEW_SAVED_VIEW_PERSIST_DEBOUNCE_MS,
  buildConsultationLogViewDefaultSavedView
} from '../../../constants/consultationLogSavedViewConstants';
import EmptyState from '../../common/EmptyState';
import ConsultantSuitePage from '../../consultant/suite/ConsultantSuitePage';
import ConsultantFilterChips from '../../consultant/suite/ConsultantFilterChips';
import ConsultantSuiteButton from '../../consultant/suite/ConsultantSuiteButton';
import ConsultantRecordCard from '../../consultant/suite/ConsultantRecordCard';
import {
  CONSULTANT_SUITE_BUTTON_VARIANT,
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_PAGE_SIZE,
  CONSULTANT_SUITE_TEST_ID,
  CONSULTATION_LOG_VIEW_SURFACE
} from '../../../constants/consultantSuite';
import {
  clampUiPage,
  fetchConsultantSuitePagedList,
  toServerPageIndex
} from '../../../utils/consultantSuiteListApi';
import MGPagination from '../../common/MGPagination';
import {
  API_ADMIN_CONSULTATION_RECORDS,
  CONSULTATION_LOG_STATUS_ALL,
  CONSULTATION_LOG_TABLE_PAGE_SIZE,
  buildConsultationLogQueryParams,
  computeDefaultDateRange,
  fetchAllAdminConsultationRecords,
  fetchConsultationRecordPages,
  fetchConsultationRecordsPage,
  formatDisplayDate,
  intersectDateRanges,
  monthBounds,
  resolveContentText,
  resolvePersonName,
  resolveSummaryText,
  shiftIsoDate,
  visibleSessionNumber
} from './consultationLogQuery';
import '../../../i18n';
import '../ConsultationLogViewPage.css';

export {
  computeDefaultDateRange,
  normalizeAdminConsultationRecordsPage,
  fetchAllAdminConsultationRecords,
  fetchConsultationRecordPages,
  ADMIN_CONSULTATION_RECORDS_PAGE_SIZE,
  ADMIN_CONSULTATION_RECORDS_MAX_PAGES
} from './consultationLogQuery';

const NS = 'adminConsultationLogs';
const PAGE_TITLE = '상담일지 조회';
const PAGE_SUBTITLE = '상담일지를 검색하고 목록에서 클릭해 수정할 수 있습니다.';
const VIEW_MODE_LIST = 'list';
const VIEW_MODE_CALENDAR = 'calendar';
const VIEW_MODE_TABLE = 'table';
const VIEW_MODES = [VIEW_MODE_CALENDAR, VIEW_MODE_LIST, VIEW_MODE_TABLE];
const CONSULTANT_EMPTY_ICON_SIZE = 40;
const DETAIL_TITLE_ID = 'consultation-log-detail-title';

/**
 * URL `?date=yyyy-mm-dd` 등 deep link 쿼리에서 시작·종료 일자를 추출.
 *
 * @param {URLSearchParams|null|undefined} searchParams
 * @returns {{ startDate: string, endDate: string }|null}
 */
export const computeRangeFromQuery = (searchParams) => {
  if (!searchParams || typeof searchParams.get !== 'function') {
    return null;
  }
  const dateRaw = searchParams.get('date');
  if (!dateRaw) {
    return null;
  }
  const match = String(dateRaw).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    return null;
  }
  const iso = `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
  return { startDate: iso, endDate: iso };
};

/**
 * URL 쿼리에서 숫자 ID 파라미터 추출. 정수가 아닌 경우 null.
 *
 * @param {URLSearchParams|null|undefined} searchParams
 * @param {string} key
 * @returns {number|null}
 */
export const parseNumericQueryParam = (searchParams, key) => {
  if (!searchParams || typeof searchParams.get !== 'function') {
    return null;
  }
  const raw = searchParams.get(key);
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
};

/**
 * Deep link 쿼리가 있으면 saved view 복원을 건너뛴다.
 *
 * @param {{ startDate?: string|null, endDate?: string|null, clientId?: number|null, consultantId?: number|null, scheduleId?: number|null }} queryFilter
 * @returns {boolean}
 */
export const hasConsultationLogDeepLinkQuery = (queryFilter) => Boolean(
  queryFilter?.startDate
  || queryFilter?.endDate
  || queryFilter?.clientId
  || queryFilter?.consultantId
  || queryFilter?.scheduleId
);

/**
 * Deep link `scheduleId` 와 목록 레코드를 매칭해 record id 를 반환.
 *
 * @param {Array<object>|null|undefined} records
 * @param {number|null|undefined} scheduleId
 * @returns {number|string|null}
 */
export const findRecordIdByScheduleDeepLink = (records, scheduleId) => {
  if (scheduleId == null || !Array.isArray(records) || records.length === 0) {
    return null;
  }
  const target = Number(scheduleId);
  if (!Number.isFinite(target) || !Number.isInteger(target) || target <= 0) {
    return null;
  }
  const matched = records.find((r) => {
    if (!r || typeof r !== 'object') {
      return false;
    }
    const consultationId = r.consultationId != null ? Number(r.consultationId) : null;
    const recordScheduleId = r.scheduleId != null ? Number(r.scheduleId) : null;
    return consultationId === target || recordScheduleId === target;
  });
  return matched?.id != null ? matched.id : null;
};

const emptyFilters = (range, query) => ({
  consultantId: query?.consultantId ?? null,
  clientId: query?.clientId ?? null,
  startDate: query?.startDate ?? range.startDate,
  endDate: query?.endDate ?? range.endDate,
  status: CONSULTATION_LOG_STATUS_ALL,
  keyword: ''
});

const readStoredFilters = (storedFilters, fallback) => {
  if (!storedFilters || typeof storedFilters !== 'object') {
    return fallback;
  }
  const next = { ...fallback };
  ['consultantId', 'clientId', 'startDate', 'endDate', 'status', 'keyword'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(storedFilters, key)) {
      next[key] = storedFilters[key];
    }
  });
  return next;
};

const consultantRecordsEndpoint = (consultantId) => (
  `/api/v1/admin/consultant-records/${consultantId}/consultation-records`
);

const ConsultationLogViewPage = ({ surface }) => {
  const { t } = useTranslation(NS);
  const { t: tSuite } = useTranslation(CONSULTANT_SUITE_NS);
  const { user } = useSession();
  const isAdmin = RoleUtils.isAdmin(user);
  const canOpenConsultationLog = canAccessConsultationLogBody(user);
  const isConsultantSurface = surface === CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT;
  const [searchParams] = useSearchParams();

  const initialQueryFilter = useMemo(() => {
    const range = computeRangeFromQuery(searchParams);
    return {
      startDate: range?.startDate ?? null,
      endDate: range?.endDate ?? null,
      clientId: parseNumericQueryParam(searchParams, 'clientId'),
      consultantId: parseNumericQueryParam(searchParams, 'consultantId'),
      scheduleId: parseNumericQueryParam(searchParams, 'scheduleId')
    };
  // 초기 마운트 시 1회만 계산 (deep link 의도).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultDateRange = useMemo(() => computeDefaultDateRange(), []);
  const consultationLogDefaultSavedView = useMemo(
    () => buildConsultationLogViewDefaultSavedView(
      CONSULTATION_LOG_VIEW_DEFAULT_VIEW_MODE,
      defaultDateRange
    ),
    [defaultDateRange]
  );
  const initialFilters = useMemo(
    () => emptyFilters(defaultDateRange, initialQueryFilter),
    [defaultDateRange, initialQueryFilter]
  );

  const [consultants, setConsultants] = useState([]);
  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [calendarTruncated, setCalendarTruncated] = useState(false);
  const [consultantId, setConsultantId] = useState(initialFilters.consultantId);
  const [clientId, setClientId] = useState(initialFilters.clientId);
  const [startDate, setStartDate] = useState(initialFilters.startDate);
  const [endDate, setEndDate] = useState(initialFilters.endDate);
  const [status, setStatus] = useState(initialFilters.status);
  const [keyword, setKeyword] = useState(initialFilters.keyword);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [queryVersion, setQueryVersion] = useState(0);
  const [calendarRange, setCalendarRange] = useState(null);
  const [modalRecordId, setModalRecordId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saveViewModalOpen, setSaveViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODE_LIST);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const deepLinkAutoOpenedRef = useRef(false);
  const clientsRef = useRef(clients);
  clientsRef.current = clients;

  const {
    savedView,
    setSavedView,
    views,
    activeViewId,
    saveNamedView,
    loadNamedView,
    resetToDefaultView,
    deleteNamedView
  } = useSavedViewPreference({
    pageId: CONSULTATION_LOG_VIEW_SAVED_VIEW_PAGE_ID,
    defaultView: consultationLogDefaultSavedView,
    namedViews: true
  });
  const savedViewFiltersRestoredRef = useRef(false);
  const savedViewPersistReadyRef = useRef(false);
  const savedViewPersistTimerRef = useRef(null);
  const savedViewMetaRef = useRef({
    sort: consultationLogDefaultSavedView.sort,
    density: consultationLogDefaultSavedView.density
  });
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const loadRecordsRequestIdRef = useRef(0);
  const loadRecordsAbortRef = useRef(null);
  const hasDeepLinkQuery = useMemo(
    () => hasConsultationLogDeepLinkQuery(initialQueryFilter),
    [initialQueryFilter]
  );

  const toAdminViewMode = useCallback((mode) => (
    mode === VIEW_MODE_CALENDAR ? VIEW_MODE_CALENDAR : VIEW_MODE_LIST
  ), []);

  const loadConsultants = useCallback(async() => {
    if (!isAdmin) return;
    try {
      const list = await getAllConsultantsWithStats();
      const arr = Array.isArray(list) ? list : [];
      setConsultants(arr.map((item) => {
        const c = item.consultant || item;
        return { ...item, id: c.id, name: c.name ?? c.userName, userName: c.userName ?? c.name };
      }));
    } catch (e) {
      console.error('상담사 목록 로드 실패:', e);
      setConsultants([]);
    }
  }, [isAdmin]);

  const loadClients = useCallback(async() => {
    try {
      if (!isAdmin) {
        if (!user?.id) {
          setClients([]);
          return;
        }
        const res = await StandardizedApi.get(
          API_ENDPOINTS.CONSULTANT_RECORDS.ASSIGNED_CLIENTS(user.id)
        );
        const arr = Array.isArray(res) ? res : (res?.data ?? []);
        setClients(arr.map((c) => ({ ...c, id: c.id, name: c.name, userName: c.name })));
        return;
      }
      const list = await getAllClientsWithStats();
      const arr = Array.isArray(list) ? list : [];
      setClients(arr.map((item) => {
        const c = item.client || item;
        return { ...item, id: c.id, name: c.name ?? c.userName, userName: c.userName ?? c.name };
      }));
    } catch (e) {
      console.error('내담자 목록 로드 실패:', e);
      setClients([]);
    }
  }, [isAdmin, user?.id]);

  const normalizeConsultantRecords = useCallback((list, consultantDisplayName) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.map((r) => ({
      id: r.id,
      sessionDate: r.consultationDate ?? r.sessionDate,
      consultationDate: r.consultationDate,
      sessionNumber: r.sessionNumber,
      clientName: r.clientName,
      consultantName: consultantDisplayName ?? r.consultantName,
      isSessionCompleted: r.isSessionCompleted,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      clientId: r.clientId,
      consultantId: r.consultantId,
      consultationId: r.consultationId,
      scheduleId: r.scheduleId,
      summaryPreview: r.summaryPreview,
      summary: r.summary,
      mainIssues: r.mainIssues
    }));
  }, []);

  const beginRequest = useCallback(() => {
    if (loadRecordsAbortRef.current) {
      loadRecordsAbortRef.current.abort();
    }
    const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    loadRecordsAbortRef.current = abortController;
    const requestId = loadRecordsRequestIdRef.current + 1;
    loadRecordsRequestIdRef.current = requestId;
    const isStale = () => (
      requestId !== loadRecordsRequestIdRef.current
      || Boolean(abortController?.signal?.aborted)
    );
    setLoading(true);
    return { isStale };
  }, []);

  const loadConsultantRecords = useCallback(async() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const { isStale } = beginRequest();
    try {
      if (isAdmin) {
        const params = {};
        if (consultantId != null) params.consultantId = consultantId;
        if (clientId != null) params.clientId = clientId;
        const fallbackRange = computeDefaultDateRange();
        params.startDate = startDate || fallbackRange.startDate;
        params.endDate = endDate || fallbackRange.endDate;
        const list = await fetchAllAdminConsultationRecords(StandardizedApi.get, params);
        if (isStale()) return;
        setRecords(Array.isArray(list) ? list : []);
        setTotalElements(Array.isArray(list) ? list.length : 0);
        setLoadError(false);
      } else {
        const endpoint = consultantRecordsEndpoint(user.id);
        const fallbackRange = computeDefaultDateRange();
        const baseParams = {
          startDate: startDate || fallbackRange.startDate,
          endDate: endDate || fallbackRange.endDate
        };
        if (clientId != null) {
          baseParams.clientId = clientId;
        }
        if (viewMode === VIEW_MODE_CALENDAR) {
          const list = await fetchAllAdminConsultationRecords(StandardizedApi.get, baseParams, {
            endpoint
          });
          if (isStale()) return;
          const normalized = normalizeConsultantRecords(list, user?.name);
          setRecords(normalized);
          setTotalElements(normalized.length);
          setLoadError(false);
        } else {
          const result = await fetchConsultantSuitePagedList(endpoint, baseParams, {
            page: toServerPageIndex(page),
            size: CONSULTANT_SUITE_PAGE_SIZE,
            itemKeys: ['data', 'content', 'items', 'records']
          });
          if (isStale()) return;
          const nextTotal = result.totalElements != null
            ? result.totalElements
            : (result.items || []).length;
          const nextTotalPages = result.totalPages != null && result.totalPages > 0
            ? result.totalPages
            : Math.max(1, Math.ceil(nextTotal / CONSULTANT_SUITE_PAGE_SIZE));
          const clamped = clampUiPage(page, nextTotalPages);
          if (clamped !== page) {
            setPage(clamped);
            return;
          }
          const normalized = normalizeConsultantRecords(result.items || [], user?.name);
          setRecords(normalized);
          setTotalElements(nextTotal);
          setLoadError(false);
        }
      }
    } catch (e) {
      if (isStale()) return;
      console.error('상담일지 목록 로드 실패:', e);
      setRecords([]);
      setTotalElements(0);
      const message = e?.status === 403
        ? '관리자 권한이 필요합니다. 권한을 확인해주세요.'
        : '상담일지 목록을 불러오는데 실패했습니다.';
      notificationManager.error(message);
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, [
    user?.id,
    user?.name,
    isAdmin,
    consultantId,
    clientId,
    startDate,
    endDate,
    normalizeConsultantRecords,
    viewMode,
    page,
    beginRequest
  ]);

  const loadAdminRecords = useCallback(async() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const { isStale } = beginRequest();
    setLoadError(false);
    try {
      const endpoint = isAdmin
        ? API_ADMIN_CONSULTATION_RECORDS
        : consultantRecordsEndpoint(user.id);
      const fallbackRange = computeDefaultDateRange();
      const query = buildConsultationLogQueryParams({
        ...appliedFilters,
        startDate: appliedFilters.startDate || fallbackRange.startDate,
        endDate: appliedFilters.endDate || fallbackRange.endDate,
        clients: clientsRef.current
      });
      const adminMode = viewMode === VIEW_MODE_CALENDAR ? VIEW_MODE_CALENDAR : VIEW_MODE_LIST;
      if (adminMode === VIEW_MODE_CALENDAR) {
        const visibleEnd = calendarRange?.endDate
          ? (shiftIsoDate(calendarRange.endDate, -1) || calendarRange.endDate)
          : null;
        const seed = calendarRange
          ? { startDate: calendarRange.startDate, endDate: visibleEnd }
          : monthBounds(query.startDate);
        const range = seed
          ? intersectDateRanges(query.startDate, query.endDate, seed.startDate, seed.endDate)
          : null;
        if (!range) {
          if (isStale()) return;
          setRecords([]);
          setTotalElements(0);
          setCalendarTruncated(false);
          return;
        }
        const result = await fetchConsultationRecordPages(StandardizedApi.get, endpoint, {
          ...query,
          startDate: range.startDate,
          endDate: range.endDate
        });
        if (isStale()) return;
        const rows = isAdmin
          ? result.records
          : normalizeConsultantRecords(result.records, user?.name);
        setRecords(rows);
        setTotalElements(result.totalCount);
        setCalendarTruncated(result.truncated);
      } else {
        const result = await fetchConsultationRecordsPage(
          StandardizedApi.get,
          endpoint,
          buildAdminListParams({
            ...query,
            page: toServerPageIndex(page),
            size: CONSULTATION_LOG_TABLE_PAGE_SIZE
          })
        );
        if (isStale()) return;
        const clamped = clampUiPage(page, result.totalPages);
        if (clamped !== page) {
          setPage(clamped);
          return;
        }
        const rows = isAdmin
          ? result.data
          : normalizeConsultantRecords(result.data, user?.name);
        setRecords(rows);
        setTotalElements(result.totalCount);
        setCalendarTruncated(false);
      }
    } catch (e) {
      if (isStale()) return;
      console.error('상담일지 목록 로드 실패:', e);
      setRecords([]);
      setTotalElements(0);
      setCalendarTruncated(false);
      setLoadError(true);
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, [
    user?.id,
    user?.name,
    isAdmin,
    appliedFilters,
    viewMode,
    page,
    queryVersion,
    calendarRange,
    normalizeConsultantRecords,
    beginRequest
  ]);

  const loadRecords = isConsultantSurface ? loadConsultantRecords : loadAdminRecords;

  useEffect(() => {
    loadConsultants();
    loadClients();
  }, [loadConsultants, loadClients]);

  useEffect(() => {
    if (!filtersHydrated) {
      return undefined;
    }
    loadRecords();
    return () => {
      if (loadRecordsAbortRef.current) {
        loadRecordsAbortRef.current.abort();
      }
    };
  }, [filtersHydrated, loadRecords]);

  const resetPageAnd = useCallback((updater) => {
    setPage(1);
    updater();
  }, []);

  const handleConsultantFilterChange = useCallback((value) => {
    if (isConsultantSurface) {
      resetPageAnd(() => setConsultantId(value));
      return;
    }
    setConsultantId(value);
  }, [isConsultantSurface, resetPageAnd]);

  const handleClientFilterChange = useCallback((value) => {
    if (isConsultantSurface) {
      resetPageAnd(() => setClientId(value));
      return;
    }
    setClientId(value);
  }, [isConsultantSurface, resetPageAnd]);

  const handleStartDateChange = useCallback((value) => {
    if (isConsultantSurface) {
      resetPageAnd(() => setStartDate(value));
      return;
    }
    setStartDate(value);
  }, [isConsultantSurface, resetPageAnd]);

  const handleEndDateChange = useCallback((value) => {
    if (isConsultantSurface) {
      resetPageAnd(() => setEndDate(value));
      return;
    }
    setEndDate(value);
  }, [isConsultantSurface, resetPageAnd]);

  const handleStatusChange = useCallback((value) => {
    setStatus(value || CONSULTATION_LOG_STATUS_ALL);
  }, []);

  const handleKeywordChange = useCallback((value) => {
    setKeyword(value);
  }, []);

  const currentFormFilters = useCallback((withFallback) => {
    const fallbackRange = computeDefaultDateRange();
    return {
      consultantId,
      clientId,
      startDate: withFallback ? (startDate || fallbackRange.startDate) : startDate,
      endDate: withFallback ? (endDate || fallbackRange.endDate) : endDate,
      status: status || CONSULTATION_LOG_STATUS_ALL,
      keyword: keyword || ''
    };
  }, [consultantId, clientId, startDate, endDate, status, keyword]);

  const applyFormFilters = useCallback((next) => {
    setConsultantId(next.consultantId ?? null);
    setClientId(next.clientId ?? null);
    setStartDate(next.startDate || '');
    setEndDate(next.endDate || '');
    setStatus(next.status || CONSULTATION_LOG_STATUS_ALL);
    setKeyword(next.keyword || '');
    setAppliedFilters({
      consultantId: next.consultantId ?? null,
      clientId: next.clientId ?? null,
      startDate: next.startDate || '',
      endDate: next.endDate || '',
      status: next.status || CONSULTATION_LOG_STATUS_ALL,
      keyword: next.keyword || ''
    });
  }, []);

  const handleSearch = useCallback(() => {
    const next = currentFormFilters(true);
    setStartDate(next.startDate);
    setEndDate(next.endDate);
    setPage(1);
    setAppliedFilters(next);
    setQueryVersion((value) => value + 1);
    setSelectedLogId(null);
  }, [currentFormFilters]);

  const handleResetFilters = useCallback(() => {
    const fallbackRange = computeDefaultDateRange();
    const next = emptyFilters(fallbackRange, {});
    setPage(1);
    applyFormFilters(next);
    setQueryVersion((value) => value + 1);
    setSelectedLogId(null);
  }, [applyFormFilters]);

  const handleViewModeChange = useCallback((mode) => {
    const nextMode = isConsultantSurface ? mode : toAdminViewMode(mode);
    resetPageAnd(() => setViewMode(nextMode));
    if (!isConsultantSurface) {
      setSelectedLogId(null);
    }
  }, [isConsultantSurface, resetPageAnd, toAdminViewMode]);

  const handleCalendarRange = useCallback((range) => {
    if (!range?.startDate || !range?.endDate) {
      return;
    }
    setCalendarRange((prev) => {
      if (prev && prev.startDate === range.startDate && prev.endDate === range.endDate) {
        return prev;
      }
      return { startDate: range.startDate, endDate: range.endDate };
    });
  }, []);

  const clientNameMap = {};
  const consultantNameMap = {};
  (clients || []).forEach((c) => {
    const id = Number((c.client || c).id ?? c.id);
    const name = (c.client || c).name ?? (c.client || c).userName ?? c.name ?? c.userName ?? '';
    if (!Number.isNaN(id)) clientNameMap[id] = name;
  });
  (consultants || []).forEach((c) => {
    const id = Number((c.consultant || c).id ?? c.id);
    const name = (c.consultant || c).name ?? (c.consultant || c).userName ?? c.name ?? c.userName ?? '';
    if (!Number.isNaN(id)) consultantNameMap[id] = name;
  });

  const filteredRecords = records;
  const unknownName = t('people.unknownName');

  const handleOpenModal = (recordId) => {
    if (!canOpenConsultationLog) {
      notificationManager.info(CONSULTATION_LOG_BODY_ACCESS_STRINGS.RESTRICTED);
      return;
    }
    setModalRecordId(recordId);
    setModalOpen(true);
  };

  const handleOpenRow = (recordId) => {
    if (!canOpenConsultationLog) {
      notificationManager.info(CONSULTATION_LOG_BODY_ACCESS_STRINGS.RESTRICTED);
      return;
    }
    setSelectedLogId((current) => (current === recordId ? null : recordId));
  };

  const handleCloseDetail = useCallback(() => {
    setSelectedLogId(null);
  }, []);

  const handleEditDetail = () => {
    if (!canOpenConsultationLog || selectedLogId == null) {
      notificationManager.info(CONSULTATION_LOG_BODY_ACCESS_STRINGS.RESTRICTED);
      return;
    }
    setModalRecordId(selectedLogId);
    setModalOpen(true);
  };

  useEffect(() => {
    if (deepLinkAutoOpenedRef.current || loading || !canOpenConsultationLog) {
      return;
    }
    const scheduleId = initialQueryFilter.scheduleId;
    if (scheduleId == null) {
      return;
    }
    const recordId = findRecordIdByScheduleDeepLink(records, scheduleId);
    if (recordId == null) {
      return;
    }
    deepLinkAutoOpenedRef.current = true;
    if (isConsultantSurface) {
      handleOpenModal(recordId);
      return;
    }
    setSelectedLogId(recordId);
  }, [loading, records, initialQueryFilter.scheduleId, canOpenConsultationLog, isConsultantSurface]);

  useEffect(() => {
    if (isConsultantSurface || selectedLogId == null || !canOpenConsultationLog || !user?.id) {
      setDetailRecord(null);
      setDetailLoading(false);
      return undefined;
    }
    let cancelled = false;
    setDetailLoading(true);
    const endpoint = isAdmin
      ? `${API_ADMIN_CONSULTATION_RECORDS}/${selectedLogId}`
      : `${consultantRecordsEndpoint(user.id)}/${selectedLogId}`;
    StandardizedApi.get(endpoint)
      .then((response) => {
        if (cancelled) return;
        const payload = response?.success === true && response.data && typeof response.data === 'object'
          ? response.data
          : response;
        setDetailRecord(payload && typeof payload === 'object' ? payload : null);
      })
      .catch(() => {
        if (!cancelled) setDetailRecord(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isConsultantSurface, selectedLogId, canOpenConsultationLog, isAdmin, user?.id]);

  const handleModalClose = () => {
    setModalOpen(false);
    setModalRecordId(null);
  };

  const handleModalSave = () => {
    setQueryVersion((value) => value + 1);
    if (isConsultantSurface) {
      loadConsultantRecords();
    }
    setModalOpen(false);
    setModalRecordId(null);
  };

  const applySavedViewPayload = useCallback((payload) => {
    setPage(1);
    if (payload?.viewMode) {
      setViewMode(isConsultantSurface ? payload.viewMode : toAdminViewMode(payload.viewMode));
    }
    const next = readStoredFilters(payload?.filters, emptyFilters(defaultDateRange, {}));
    applyFormFilters(next);
    if (!isConsultantSurface) {
      setQueryVersion((value) => value + 1);
      setSelectedLogId(null);
    }
    savedViewMetaRef.current = {
      sort: payload?.sort ?? consultationLogDefaultSavedView.sort,
      density: payload?.density ?? consultationLogDefaultSavedView.density
    };
  }, [
    consultationLogDefaultSavedView,
    isConsultantSurface,
    toAdminViewMode,
    defaultDateRange,
    applyFormFilters
  ]);

  const handleSelectSavedView = useCallback((viewId) => {
    const payload = loadNamedView(viewId);
    applySavedViewPayload(payload);
  }, [loadNamedView, applySavedViewPayload]);

  const handleResetSavedView = useCallback(() => {
    const payload = resetToDefaultView();
    applySavedViewPayload(payload);
  }, [resetToDefaultView, applySavedViewPayload]);

  const handleSaveNamedView = useCallback((label) => {
    saveNamedView(label, {
      viewMode: isConsultantSurface ? viewMode : toAdminViewMode(viewMode),
      filters: currentFormFilters(false),
      sort: savedViewMetaRef.current.sort,
      density: savedViewMetaRef.current.density
    });
  }, [saveNamedView, viewMode, currentFormFilters, isConsultantSurface, toAdminViewMode]);

  const handleDeleteSavedView = useCallback((viewId) => {
    const fallbackPayload = deleteNamedView(viewId);
    if (fallbackPayload) {
      applySavedViewPayload(fallbackPayload);
    }
  }, [deleteNamedView, applySavedViewPayload]);

  useEffect(() => {
    if (savedViewFiltersRestoredRef.current) {
      return;
    }
    savedViewFiltersRestoredRef.current = true;
    savedViewMetaRef.current = {
      sort: savedView.sort ?? consultationLogDefaultSavedView.sort,
      density: savedView.density ?? consultationLogDefaultSavedView.density
    };
    if (!hasDeepLinkQuery) {
      if (savedView?.viewMode) {
        setViewMode(isConsultantSurface ? savedView.viewMode : toAdminViewMode(savedView.viewMode));
      }
      const storedFilters = savedView?.filters;
      if (storedFilters && Object.keys(storedFilters).length > 0) {
        const next = readStoredFilters(storedFilters, initialFilters);
        applyFormFilters(next);
      }
    }
    savedViewPersistReadyRef.current = !hasDeepLinkQuery;
    setFiltersHydrated(true);
  }, [
    savedView,
    hasDeepLinkQuery,
    consultationLogDefaultSavedView,
    isConsultantSurface,
    toAdminViewMode,
    initialFilters,
    applyFormFilters
  ]);

  useEffect(() => {
    if (!savedViewPersistReadyRef.current || hasDeepLinkQuery) {
      return undefined;
    }

    if (savedViewPersistTimerRef.current) {
      clearTimeout(savedViewPersistTimerRef.current);
    }

    savedViewPersistTimerRef.current = setTimeout(() => {
      savedViewPersistTimerRef.current = null;
      setSavedView({
        viewMode: isConsultantSurface ? viewMode : toAdminViewMode(viewMode),
        filters: {
          consultantId,
          clientId,
          startDate,
          endDate,
          status,
          keyword
        },
        sort: savedViewMetaRef.current.sort,
        density: savedViewMetaRef.current.density
      });
    }, CONSULTATION_LOG_VIEW_SAVED_VIEW_PERSIST_DEBOUNCE_MS);

    return () => {
      if (savedViewPersistTimerRef.current) {
        clearTimeout(savedViewPersistTimerRef.current);
        savedViewPersistTimerRef.current = null;
      }
    };
  }, [
    viewMode,
    consultantId,
    clientId,
    startDate,
    endDate,
    status,
    keyword,
    setSavedView,
    hasDeepLinkQuery,
    isConsultantSurface,
    toAdminViewMode
  ]);

  const pageClassName = 'mg-v2-consultation-log-view consultation-log-view--clinic-os';
  const showListLoading = loading && records.length === 0;
  const adminViewMode = toAdminViewMode(viewMode);
  const selectedRecord = filteredRecords.find((record) => record.id === selectedLogId) || null;
  const detailSource = detailRecord || selectedRecord;

  const filterSection = (
    <ConsultationLogFilterSection
      layout={isConsultantSurface ? 'legacy' : 'query'}
      isAdmin={isAdmin}
      consultantId={consultantId}
      consultants={consultants}
      onConsultantChange={handleConsultantFilterChange}
      clientId={clientId}
      clients={clients}
      onClientChange={handleClientFilterChange}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
      status={status}
      onStatusChange={handleStatusChange}
      keyword={keyword}
      onKeywordChange={handleKeywordChange}
      onSearch={handleSearch}
      onReset={handleResetFilters}
      savedViews={views}
      activeViewId={activeViewId}
      onSelectSavedView={handleSelectSavedView}
      onSaveCurrentView={() => setSaveViewModalOpen(true)}
      onDeleteSavedView={handleDeleteSavedView}
    />
  );

  const adminViewToggle = (
    <div className="mg-v2-consultation-log-view-toggle" role="group" aria-label={t('view.label')}>
      <MGButton
        type="button"
        variant="outline"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'outline',
          size: 'sm',
          loading: false,
          className: 'mg-v2-consultation-log-view-toggle__button'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => handleViewModeChange(VIEW_MODE_LIST)}
        aria-pressed={adminViewMode === VIEW_MODE_LIST}
        preventDoubleClick={false}
      >
        {t('view.list')}
      </MGButton>
      <MGButton
        type="button"
        variant="outline"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'outline',
          size: 'sm',
          loading: false,
          className: 'mg-v2-consultation-log-view-toggle__button'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => handleViewModeChange(VIEW_MODE_CALENDAR)}
        aria-pressed={adminViewMode === VIEW_MODE_CALENDAR}
        preventDoubleClick={false}
      >
        {t('view.calendar')}
      </MGButton>
    </div>
  );

  const consultantViewChips = (
    <ConsultantFilterChips
      items={VIEW_MODES.map((mode) => ({ key: mode, label: tSuite(`logs.view.${mode}`) }))}
      activeKey={viewMode}
      onChange={handleViewModeChange}
      ariaLabel={tSuite('logs.viewToggleAria')}
      testIdPrefix="consultant-logs-view"
    />
  );

  const renderConsultantPager = (totalPages) => {
    if (!(totalElements > CONSULTANT_SUITE_PAGE_SIZE || totalPages > 1)) {
      return null;
    }
    return (
      <nav className={CONSULTANT_SUITE_CLASS.PAGINATION} aria-label={tSuite('records.listAria')}>
        <MGPagination
          currentPage={clampUiPage(page, totalPages)}
          totalPages={totalPages}
          totalItems={totalElements}
          itemsPerPage={CONSULTANT_SUITE_PAGE_SIZE}
          onPageChange={setPage}
          showInfo
          showItemsPerPage={false}
          variant="compact"
        />
      </nav>
    );
  };

  const renderListView = () => {
    const totalPages = Math.max(1, Math.ceil((totalElements || 0) / CONSULTANT_SUITE_PAGE_SIZE));
    return (
      <>
        {filteredRecords.length === 0 ? (
          <section className={CONSULTANT_SUITE_CLASS.PANEL}>
            <EmptyState
              className={CONSULTANT_SUITE_CLASS.EMPTY}
              icon={<FileText size={CONSULTANT_EMPTY_ICON_SIZE} aria-hidden />}
              title={tSuite('logs.emptyTitle')}
              description={tSuite('logs.emptyDescription')}
            />
          </section>
        ) : (
          <section className={CONSULTANT_SUITE_CLASS.CARD_GRID} aria-label={tSuite('records.listAria')}>
            {filteredRecords.map((record) => (
              <ConsultantRecordCard
                key={record.id}
                record={{
                  ...record,
                  clientName: record.clientName
                    ?? (record.clientId != null ? clientNameMap[Number(record.clientId)] : undefined)
                }}
                onOpen={handleOpenModal}
              />
            ))}
          </section>
        )}
        {renderConsultantPager(totalPages)}
      </>
    );
  };

  const renderConsultantTableWithPager = () => {
    const totalPages = Math.max(1, Math.ceil((totalElements || 0) / CONSULTANT_SUITE_PAGE_SIZE));
    return (
      <>
        <ConsultationLogTableBlock
          records={filteredRecords}
          clientNameMap={clientNameMap}
          consultantNameMap={consultantNameMap}
          onOpenRow={handleOpenModal}
        />
        {renderConsultantPager(totalPages)}
      </>
    );
  };

  const consultantResults = showListLoading ? (
    <ConsultationLogResultsState
      phase="loading"
      loadingTitle={t('states.loadingTitle')}
      loadingDesc={t('states.loadingDesc')}
      emptyTitle={t('states.emptyTitle')}
      emptyDesc={t('states.emptyDesc')}
      emptyActionLabel={t('states.emptyAction')}
      errorTitle={t('states.errorTitle')}
      errorDesc={t('states.errorDesc')}
      errorActionLabel={t('states.errorAction')}
    />
  ) : (
    <>
      {viewMode === VIEW_MODE_CALENDAR && (
        <ConsultationLogCalendarBlock
          records={filteredRecords}
          clientNameMap={clientNameMap}
          consultantNameMap={consultantNameMap}
          onOpenModal={handleOpenModal}
          startDate={startDate}
          endDate={endDate}
        />
      )}
      {viewMode === VIEW_MODE_LIST && renderListView()}
      {viewMode === VIEW_MODE_TABLE && renderConsultantTableWithPager()}
    </>
  );

  const adminPhase = loading
    ? 'loading'
    : loadError
      ? 'error'
      : adminViewMode === VIEW_MODE_LIST && totalElements === 0
        ? 'empty'
        : null;

  const adminTotalPages = Math.max(
    1,
    Math.ceil((totalElements || 0) / CONSULTATION_LOG_TABLE_PAGE_SIZE)
  );

  const detailLabels = {
    title: t('detail.title'),
    close: t('detail.close'),
    back: t('detail.back'),
    date: t('detail.date'),
    session: t('detail.session'),
    client: t('detail.client'),
    consultant: t('detail.consultant'),
    status: t('detail.status'),
    writtenAt: t('detail.writtenAt'),
    summary: t('detail.summary'),
    content: t('detail.content'),
    edit: t('detail.edit'),
    done: t('status.done'),
    pending: t('status.pending'),
    loading: t('states.loadingTitle')
  };

  const sessionCount = visibleSessionNumber(detailSource?.sessionNumber);
  const detailClientName = resolvePersonName(
    detailSource?.clientName,
    detailSource?.clientId,
    clientNameMap,
    unknownName
  );
  const detailConsultantName = resolvePersonName(
    detailSource?.consultantName,
    detailSource?.consultantId,
    consultantNameMap,
    unknownName
  );

  const adminResults = (
    <div
      className={`mg-v2-consultation-log-results${
        selectedLogId != null && canOpenConsultationLog ? ' mg-v2-consultation-log-results--with-panel' : ''
      }`}
    >
      <div className="mg-v2-consultation-log-results__main">
        {adminPhase ? (
          <ConsultationLogResultsState
            phase={adminPhase}
            loadingTitle={t('states.loadingTitle')}
            loadingDesc={t('states.loadingDesc')}
            emptyTitle={t('states.emptyTitle')}
            emptyDesc={t('states.emptyDesc')}
            emptyActionLabel={t('states.emptyAction')}
            errorTitle={t('states.errorTitle')}
            errorDesc={t('states.errorDesc')}
            errorActionLabel={t('states.errorAction')}
            onReset={handleResetFilters}
            onRetry={() => setQueryVersion((value) => value + 1)}
          />
        ) : null}
        {!adminPhase && adminViewMode === VIEW_MODE_LIST ? (
          <>
            <ConsultationLogTableBlock
              records={filteredRecords}
              clientNameMap={clientNameMap}
              consultantNameMap={consultantNameMap}
              selectedLogId={selectedLogId}
              onOpenRow={handleOpenRow}
            />
            <nav className="mg-v2-consultation-log-pagination" aria-label={t('pagination.label')}>
              <MGPagination
                currentPage={clampUiPage(page, adminTotalPages)}
                totalPages={adminTotalPages}
                totalItems={totalElements}
                itemsPerPage={CONSULTATION_LOG_TABLE_PAGE_SIZE}
                onPageChange={setPage}
                showInfo
                showItemsPerPage={false}
                variant="compact"
                summaryLabel={t('table.summaryTotal', { n: totalElements })}
                prevLabel={t('pagination.prev')}
                nextLabel={t('pagination.next')}
                activePageTone="neutral"
                pageAriaLabel={(pageNumber, isCurrent) => (
                  isCurrent
                    ? t('pagination.current', { n: pageNumber })
                    : t('pagination.page', { n: pageNumber })
                )}
              />
            </nav>
          </>
        ) : null}
        {!adminPhase && adminViewMode === VIEW_MODE_CALENDAR ? (
          <>
            {calendarTruncated ? (
              <p className="mg-v2-consultation-log-calendar-note" role="status">
                {t('calendar.truncated')}
              </p>
            ) : null}
            <ConsultationLogCalendarBlock
              records={filteredRecords}
              clientNameMap={clientNameMap}
              consultantNameMap={consultantNameMap}
              onOpenModal={handleOpenRow}
              startDate={appliedFilters.startDate}
              endDate={appliedFilters.endDate}
              onVisibleRangeChange={handleCalendarRange}
            />
          </>
        ) : null}
      </div>
      {selectedLogId != null && canOpenConsultationLog ? (
        <ConsultationLogDetailPanel
          titleId={DETAIL_TITLE_ID}
          labels={detailLabels}
          dateText={formatDisplayDate(detailSource?.sessionDate ?? detailSource?.consultationDate)}
          sessionText={sessionCount == null ? '' : t('table.sessionN', { n: sessionCount })}
          clientName={detailClientName}
          consultantName={detailConsultantName}
          done={detailSource?.isSessionCompleted === true}
          writtenAt={formatDisplayDate(detailSource?.createdAt || detailSource?.updatedAt)}
          summary={resolveSummaryText(detailSource)}
          content={resolveContentText(detailRecord)}
          loading={detailLoading}
          onClose={handleCloseDetail}
          onEdit={handleEditDetail}
          returnFocusId={`consultation-log-row-${selectedLogId}`}
        />
      ) : null}
    </div>
  );

  const logModal = (
    <ConsultationLogModal
      isOpen={modalOpen && canOpenConsultationLog}
      onClose={handleModalClose}
      onSave={handleModalSave}
      recordId={modalRecordId}
      isAdmin={isAdmin}
      editOnly={!isConsultantSurface}
    />
  );

  if (isConsultantSurface) {
    const consultantHeaderActions = (
      <>
        <ConsultantSuiteButton
          variant={CONSULTANT_SUITE_BUTTON_VARIANT.GHOST}
          onClick={handleResetSavedView}
        >
          {tSuite('logs.resetView')}
        </ConsultantSuiteButton>
        <ConsultantSuiteButton
          variant={CONSULTANT_SUITE_BUTTON_VARIANT.GHOST}
          onClick={() => setSaveViewModalOpen(true)}
        >
          {tSuite('logs.saveView')}
        </ConsultantSuiteButton>
        <ConsultantSuiteButton
          variant={CONSULTANT_SUITE_BUTTON_VARIANT.GHOST}
          onClick={loadRecords}
        >
          {tSuite('logs.search')}
        </ConsultantSuiteButton>
      </>
    );
    return (
      <>
        <ConsultantSuitePage
          title={PAGE_TITLE}
          subtitle={PAGE_SUBTITLE}
          titleId="consultation-log-view-page-title"
          ariaLabel={t('page.regionLabel')}
          className={`${pageClassName} consultant-logs`}
          testId={CONSULTANT_SUITE_TEST_ID.LOGS_PAGE}
          actions={consultantHeaderActions}
        >
          {consultantViewChips}
          {filterSection}
          {consultantResults}
        </ConsultantSuitePage>
        {saveViewModalOpen ? (
          <SaveViewModal
            isOpen={saveViewModalOpen}
            onClose={() => setSaveViewModalOpen(false)}
            onSave={handleSaveNamedView}
          />
        ) : null}
        {logModal}
      </>
    );
  }

  return (
    <>
      <ContentArea ariaLabel={t('page.regionLabel')} className={pageClassName}>
        <ContentHeader
          title={t('page.title')}
          subtitle=""
          titleId="consultation-log-view-page-title"
          actions={adminViewToggle}
        />
        {filterSection}
        {adminResults}
      </ContentArea>
      {saveViewModalOpen ? (
        <SaveViewModal
          isOpen={saveViewModalOpen}
          onClose={() => setSaveViewModalOpen(false)}
          onSave={handleSaveNamedView}
        />
      ) : null}
      {logModal}
    </>
  );
};

ConsultationLogViewPage.propTypes = {
  surface: PropTypes.oneOf(Object.values(CONSULTATION_LOG_VIEW_SURFACE))
};

ConsultationLogViewPage.defaultProps = {
  surface: CONSULTATION_LOG_VIEW_SURFACE.ADMIN
};

export default ConsultationLogViewPage;
