/**
 * 상담일지 조회 본문 - ContentArea + ContentHeader + 필터 + 목록
 * 역할별: 관리자 전체/상담사 본인만. 필터 변경 시 목록 재호출.
 * Clinic-OS chrome: consultation-log-view--clinic-os (B0KlA 제거).
 *
 * @author Core Solution
 * @since 2025-03-02
 * @updated 2026-09-08 — admin consultation-records 전 페이지 수집(early-month truncation 수정)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import StandardizedApi from '../../../utils/standardizedApi';
import { useSession } from '../../../contexts/SessionContext';
import { RoleUtils } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import UnifiedLoading from '../../common/UnifiedLoading';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import ConsultationLogFilterSection from './ConsultationLogFilterSection';
import { toDateStr } from '../../../utils/dateUtils';
import ConsultationLogListBlock from './ConsultationLogListBlock';
import ConsultationLogCalendarBlock from './ConsultationLogCalendarBlock';
import ConsultationLogTableBlock from './ConsultationLogTableBlock';
import ConsultationLogModal from '../../consultant/ConsultationLogModal';
import { getAllConsultantsWithStats, getAllClientsWithStats } from '../../../utils/consultantHelper';
import SavedViewControls from '../ClientComprehensiveManagement/molecules/SavedViewControls';
import { useSavedViewPreference } from '../../../hooks/useSavedViewPreference';
import {
  CONSULTATION_LOG_VIEW_DEFAULT_VIEW_MODE,
  CONSULTATION_LOG_VIEW_SAVED_VIEW_PAGE_ID,
  CONSULTATION_LOG_VIEW_SAVED_VIEW_PERSIST_DEBOUNCE_MS,
  CONSULTATION_LOG_VIEW_SAVED_VIEW_ROW_ARIA_LABEL,
  buildConsultationLogViewDefaultSavedView
} from '../../../constants/consultationLogSavedViewConstants';
import '../ConsultationLogViewPage.css';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_CONSULTATION_RECORDS = '/api/v1/admin/consultation-records';


const PAGE_TITLE = '상담일지 조회';
const PAGE_SUBTITLE = '상담일지를 검색하고 목록에서 클릭해 수정할 수 있습니다.';
const CONTENT_AREA_ARIA_LABEL = '상담일지 조회 콘텐츠';
const VIEW_MODE_LIST = 'list';
const VIEW_MODE_CALENDAR = 'calendar';
const VIEW_MODE_TABLE = 'table';
const TAB_LABELS = {
  [VIEW_MODE_CALENDAR]: '캘린더',
  [VIEW_MODE_LIST]: '목록',
  [VIEW_MODE_TABLE]: '테이블'
};
// BE AdminController.ADMIN_CONSULTATION_RECORDS_MAX_PAGE_SIZE 와 동일 (size 상한 200).
// 단일 페이지만 요청하면 DESC 정렬 때문에 월 초 데이터가 잘릴 수 있음 → 전 페이지 수집 필수.
// 참고: docs/project-management/2026-05-29/CONSULTATION_LOG_VIEW_APRIL_MISSING_DEBUG.md
export const ADMIN_CONSULTATION_RECORDS_PAGE_SIZE = 200;
/** 전체 모드 안전 상한: 50 pages × 200 = 10_000 rows */
export const ADMIN_CONSULTATION_RECORDS_MAX_PAGES = 50;
// 진입 시 기본 표시 기간 = "지난 달 1일 ~ 이번 달 말일".
// 사용자가 startDate/endDate 를 직접 비우면 null 전송 → 백엔드 전체 모드 (페이지네이션).
const DEFAULT_RANGE_MONTHS_BEFORE = 1;

/**
 * 기본 기간 (지난 달 1일 ~ 이번 달 말일) 을 ISO yyyy-MM-dd 문자열로 계산.
 *
 * @param {Date} [now] 기준 일시 (테스트에서 주입 가능, 기본값: 현재 시각)
 * @returns {{ startDate: string, endDate: string }}
 */
export const computeDefaultDateRange = (now = new Date()) => {
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month - DEFAULT_RANGE_MONTHS_BEFORE, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: fmt(start), endDate: fmt(end) };
};

/**
 * 어드민 상담일지 페이지 응답을 { data, totalCount, totalPages } 로 정규화.
 * envelope `{ success, data, totalCount, totalPages }` 와 배열-only 응답 모두 허용.
 *
 * @param {*} response StandardizedApi.get 응답 (unwrapApiEnvelope:false 권장)
 * @param {number} [pageSize=ADMIN_CONSULTATION_RECORDS_PAGE_SIZE]
 * @returns {{ data: Array, totalCount: number, totalPages: number }}
 */
export const normalizeAdminConsultationRecordsPage = (
  response,
  pageSize = ADMIN_CONSULTATION_RECORDS_PAGE_SIZE
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
  const parsedTotalCount = Number(response.totalCount);
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
 * 어드민 상담일지 목록을 page/size 로 전 페이지 수집.
 * DESC 정렬 + 단일 페이지 캡으로 월 초 데이터가 누락되는 회귀를 방지한다.
 *
 * @param {Function} apiGet StandardizedApi.get 호환 (endpoint, params, options) => Promise
 * @param {Object} [baseParams] page/size 를 제외한 필터 (startDate, endDate, consultantId, clientId 등)
 * @param {Object} [options]
 * @param {string} [options.endpoint]
 * @param {number} [options.pageSize]
 * @param {number} [options.maxPages]
 * @returns {Promise<Array>}
 */
export const fetchAllAdminConsultationRecords = async(
  apiGet,
  baseParams = {},
  options = {}
) => {
  const endpoint = options.endpoint ?? API_ADMIN_CONSULTATION_RECORDS;
  const pageSize = options.pageSize ?? ADMIN_CONSULTATION_RECORDS_PAGE_SIZE;
  const maxPages = options.maxPages ?? ADMIN_CONSULTATION_RECORDS_MAX_PAGES;
  const accumulated = [];
  let page = 0;

  while (page < maxPages) {
    const params = {
      ...(baseParams || {}),
      page,
      size: pageSize
    };
    const response = await apiGet(endpoint, params, { unwrapApiEnvelope: false });
    const normalized = normalizeAdminConsultationRecordsPage(response, pageSize);
    accumulated.push(...normalized.data);

    if (page + 1 >= normalized.totalPages) {
      break;
    }
    if (accumulated.length >= normalized.totalCount) {
      break;
    }
    if (normalized.data.length === 0) {
      break;
    }
    page += 1;
  }

  return accumulated;
};

/**
 * URL `?date=yyyy-mm-dd` 등 deep link 쿼리에서 시작·종료 일자를 추출.
 * 단일 날짜만 있을 때는 startDate=endDate=해당일.
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
 * Deep link `scheduleId` 와 목록 레코드를 매칭해 모달용 record id 를 반환.
 * 백엔드 레코드는 일정 ID를 `consultationId`(또는 `scheduleId`)로 담는다.
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

const ConsultationLogViewPage = () => {
  const { user } = useSession();
  const isAdmin = RoleUtils.isAdmin(user);
  const [searchParams] = useSearchParams();

  /**
   * Deep link 쿼리(`?date=...&clientId=...&consultantId=...&scheduleId=...`)를
   * 페이지 초기 필터로 1회 적용. 이후 사용자가 필터를 변경하면 그대로 유지.
   */
  const initialQueryFilter = useMemo(() => {
    const range = computeRangeFromQuery(searchParams);
    return {
      startDate: range?.startDate ?? null,
      endDate: range?.endDate ?? null,
      clientId: parseNumericQueryParam(searchParams, 'clientId'),
      consultantId: parseNumericQueryParam(searchParams, 'consultantId'),
      scheduleId: parseNumericQueryParam(searchParams, 'scheduleId')
    };
  // 초기 마운트 시 1회만 계산 (deep link 의도). 이후 검색 변화 시 사용자 필터 우선.
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

  const [consultants, setConsultants] = useState([]);
  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultantId, setConsultantId] = useState(initialQueryFilter.consultantId);
  const [clientId, setClientId] = useState(initialQueryFilter.clientId);
  const [startDate, setStartDate] = useState(
    () => initialQueryFilter.startDate ?? computeDefaultDateRange().startDate
  );
  const [endDate, setEndDate] = useState(
    () => initialQueryFilter.endDate ?? computeDefaultDateRange().endDate
  );
  const [modalRecordId, setModalRecordId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODE_LIST);
  /** Deep link scheduleId 모달 자동 오픈 1회 가드 */
  const deepLinkAutoOpenedRef = useRef(false);

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
  /** mount 시 saved view(또는 deep-link) 적용 전에는 list fetch 스킵 */
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const loadRecordsRequestIdRef = useRef(0);
  const loadRecordsAbortRef = useRef(null);
  const hasDeepLinkQuery = useMemo(
    () => hasConsultationLogDeepLinkQuery(initialQueryFilter),
    [initialQueryFilter]
  );

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
  }, []);

  /** 상담사 본인 목록 응답을 목록 뷰 형식으로 정규화 */
  const normalizeConsultantRecords = useCallback((list, consultantDisplayName) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.map((r) => ({
      id: r.id,
      sessionDate: r.consultationDate ?? r.sessionDate,
      consultationDate: r.consultationDate,
      sessionNumber: r.sessionNumber,
      clientName: r.clientName,
      consultantName: consultantDisplayName ?? '본인',
      isSessionCompleted: r.isSessionCompleted,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      clientId: r.clientId,
      consultantId: r.consultantId,
      consultationId: r.consultationId,
      scheduleId: r.scheduleId
    }));
  }, []);

  const loadRecords = useCallback(async() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
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
    try {
      if (isAdmin) {
        try {
          const params = {};
          if (consultantId != null) params.consultantId = consultantId;
          if (clientId != null) params.clientId = clientId;
          // P0 핫픽스 2026-05-29: 기간 필터를 백엔드로 전달.
          // (이전: 클라이언트 사이드 필터만 사용 → MAX_PAGE_SIZE=20 캡으로 4월 데이터 미노출)
          if (startDate) params.startDate = startDate;
          if (endDate) params.endDate = endDate;
          // 전 페이지 수집 (size=200). 단일 page0 만 받으면 DESC 정렬로 월 초 누락.
          const list = await fetchAllAdminConsultationRecords(StandardizedApi.get, params);
          if (isStale()) return;
          setRecords(Array.isArray(list) ? list : []);
        } catch (adminErr) {
          if (isStale() || abortController?.signal?.aborted) return;
          if (adminErr?.status === 403 || (adminErr?.message && adminErr.message.includes('관리자 권한'))) {
            const consultantResponse = await StandardizedApi.get(
              `/api/v1/admin/consultant-records/${user.id}/consultation-records`
            );
            if (isStale()) return;
            const list = Array.isArray(consultantResponse) ? consultantResponse : (consultantResponse?.data ?? []);
            setRecords(normalizeConsultantRecords(list, user?.name));
          } else {
            throw adminErr;
          }
        }
      } else {
        const response = await StandardizedApi.get(
          `/api/v1/admin/consultant-records/${user.id}/consultation-records`
        );
        if (isStale()) return;
        const list = Array.isArray(response) ? response : (response?.data ?? []);
        setRecords(normalizeConsultantRecords(list, user?.name));
      }
    } catch (e) {
      if (isStale() || abortController?.signal?.aborted) return;
      console.error('상담일지 목록 로드 실패:', e);
      setRecords([]);
      const message = e?.status === 403
        ? '관리자 권한이 필요합니다. 권한을 확인해주세요.'
        : '상담일지 목록을 불러오는데 실패했습니다.';
      notificationManager.error(message);
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, [user?.id, user?.name, isAdmin, consultantId, clientId, startDate, endDate, normalizeConsultantRecords]);

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

  let filteredRecords = records;
  if (startDate || endDate) {
    filteredRecords = records.filter((r) => {
      const sd = r.sessionDate ?? r.consultationDate;
      const d = toDateStr(sd);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }

  const handleOpenModal = (recordId) => {
    setModalRecordId(recordId);
    setModalOpen(true);
  };

  /**
   * Deep link `?scheduleId=` 매칭 시 ConsultationLogModal 1회 자동 오픈.
   * (스케줄 상세 → navigate fallback / 북마크 UX)
   */
  useEffect(() => {
    if (deepLinkAutoOpenedRef.current || loading) {
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
    handleOpenModal(recordId);
  }, [loading, records, initialQueryFilter.scheduleId]);

  const handleModalClose = () => {
    setModalOpen(false);
    setModalRecordId(null);
  };

  const handleModalSave = () => {
    loadRecords();
    setModalOpen(false);
    setModalRecordId(null);
  };

  const applySavedViewPayload = useCallback((payload) => {
    if (payload?.viewMode) {
      setViewMode(payload.viewMode);
    }
    const storedFilters = payload?.filters ?? {};
    if (Object.prototype.hasOwnProperty.call(storedFilters, 'consultantId')) {
      setConsultantId(storedFilters.consultantId);
    }
    if (Object.prototype.hasOwnProperty.call(storedFilters, 'clientId')) {
      setClientId(storedFilters.clientId);
    }
    if (Object.prototype.hasOwnProperty.call(storedFilters, 'startDate')) {
      setStartDate(storedFilters.startDate);
    }
    if (Object.prototype.hasOwnProperty.call(storedFilters, 'endDate')) {
      setEndDate(storedFilters.endDate);
    }
    savedViewMetaRef.current = {
      sort: payload?.sort ?? consultationLogDefaultSavedView.sort,
      density: payload?.density ?? consultationLogDefaultSavedView.density
    };
  }, [consultationLogDefaultSavedView]);

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
      viewMode,
      filters: { consultantId, clientId, startDate, endDate },
      sort: savedViewMetaRef.current.sort,
      density: savedViewMetaRef.current.density
    });
  }, [saveNamedView, viewMode, consultantId, clientId, startDate, endDate]);

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
        setViewMode(savedView.viewMode);
      }
      const storedFilters = savedView?.filters;
      if (storedFilters && Object.keys(storedFilters).length > 0) {
        if (Object.prototype.hasOwnProperty.call(storedFilters, 'consultantId')) {
          setConsultantId(storedFilters.consultantId);
        }
        if (Object.prototype.hasOwnProperty.call(storedFilters, 'clientId')) {
          setClientId(storedFilters.clientId);
        }
        if (Object.prototype.hasOwnProperty.call(storedFilters, 'startDate')) {
          setStartDate(storedFilters.startDate);
        }
        if (Object.prototype.hasOwnProperty.call(storedFilters, 'endDate')) {
          setEndDate(storedFilters.endDate);
        }
      }
    }
    // deep link 세션은 auto-persist로 일반 진입을 오염시키지 않음
    savedViewPersistReadyRef.current = !hasDeepLinkQuery;
    setFiltersHydrated(true);
  }, [savedView, hasDeepLinkQuery, consultationLogDefaultSavedView]);

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
        viewMode,
        filters: { consultantId, clientId, startDate, endDate },
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
  }, [viewMode, consultantId, clientId, startDate, endDate, setSavedView, hasDeepLinkQuery]);

  const pageClassName = 'mg-v2-consultation-log-view consultation-log-view--clinic-os';
  const showListLoading = loading && records.length === 0;

  return (
    <>
      <ContentArea ariaLabel={CONTENT_AREA_ARIA_LABEL} className={pageClassName}>
        <ContentHeader
          title={PAGE_TITLE}
          subtitle={PAGE_SUBTITLE}
          titleId="consultation-log-view-page-title"
        />

        <section
          className="mg-v2-session-saved-view-row"
          aria-label={CONSULTATION_LOG_VIEW_SAVED_VIEW_ROW_ARIA_LABEL}
        >
          <SavedViewControls
            views={views}
            activeViewId={activeViewId}
            onSelectView={handleSelectSavedView}
            onSaveView={handleSaveNamedView}
            onResetToDefault={handleResetSavedView}
            onDeleteView={handleDeleteSavedView}
          />
        </section>

        <ConsultationLogFilterSection
          isAdmin={isAdmin}
          consultantId={consultantId}
          consultants={consultants}
          onConsultantChange={setConsultantId}
          clientId={clientId}
          clients={clients}
          onClientChange={setClientId}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        <nav className="mg-v2-consultation-log-view-tabs" aria-label="뷰 전환">
          {[VIEW_MODE_CALENDAR, VIEW_MODE_LIST, VIEW_MODE_TABLE].map((mode) => {
            const isActive = viewMode === mode;
            const tabVariant = isActive ? 'primary' : 'outline';
            return (
              <MGButton
                key={mode}
                type="button"
                variant={tabVariant}
                size="small"
                className={buildErpMgButtonClassName({
                  variant: tabVariant === 'primary' ? 'primary' : 'outline',
                  size: 'sm',
                  loading: false,
                  className: `mg-v2-consultation-log-view-tabs__tab ${isActive ? 'mg-v2-consultation-log-view-tabs__tab--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setViewMode(mode)}
                aria-pressed={isActive}
                aria-current={isActive ? 'true' : undefined}
                preventDoubleClick={false}
              >
                {TAB_LABELS[mode]}
              </MGButton>
            );
          })}
        </nav>

        {showListLoading ? (
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="데이터를 불러오는 중..." variant="pulse" />
          </div>
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
            {viewMode === VIEW_MODE_LIST && (
              <ConsultationLogListBlock
                records={filteredRecords}
                clientNameMap={clientNameMap}
                consultantNameMap={consultantNameMap}
                onCardClick={handleOpenModal}
              />
            )}
            {viewMode === VIEW_MODE_TABLE && (
              <ConsultationLogTableBlock
                records={filteredRecords}
                clientNameMap={clientNameMap}
                consultantNameMap={consultantNameMap}
                onRowClick={handleOpenModal}
              />
            )}
          </>
        )}
      </ContentArea>

      <ConsultationLogModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        recordId={modalRecordId}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default ConsultationLogViewPage;
