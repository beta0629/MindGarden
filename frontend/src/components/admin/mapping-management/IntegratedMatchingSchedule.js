/**
 * IntegratedMatchingSchedule - 매칭·스케줄 통합 원스톱 화면
 * 좌: 매칭 목록(실 API /api/v1/admin/mappings), 우: 스케줄 캘린더(실 API)
 * 카드 드래그 → 캘린더 드롭 시 ScheduleModal 상담사·내담자 Pre-filled로 오픈
 *
 * @author Core Solution
 * @since 2025-02-25
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import { runResourceLoad, softRefresh } from '../../../utils/softRefresh';
import { useSession } from '../../../contexts/SessionContext';
import useMonthlyConsultantCounts from '../../../hooks/useMonthlyConsultantCounts';
import useMissingConsultationLogs from '../../../hooks/useMissingConsultationLogs';
import UnifiedScheduleComponent from '../../schedule/UnifiedScheduleComponent';
import ScheduleModal from '../../schedule/ScheduleModal';
import MappingCreationModal from '../MappingCreationModal';
import SessionExtensionModal from '../mapping/SessionExtensionModal';
import SessionSuccessionWizardModal from '../mapping/SessionSuccessionWizardModal';
import SessionExtensionPaymentConfirmModal from '../mapping/SessionExtensionPaymentConfirmModal';
import PackagePaymentHistoryModal from '../package-payment-history/PackagePaymentHistoryModal';
import { PACKAGE_PAYMENT_HISTORY_UI } from '../../../constants/packagePaymentHistory';
import MappingPaymentModal from '../mapping/MappingPaymentModal';
import MappingDepositModal from '../mapping/MappingDepositModal';
import CheckoutSameDayModal, {
  CHECKOUT_MODAL_MODE_CONFIRM_ACTIVATE,
  CHECKOUT_MODAL_MODE_SAME_DAY
} from '../mapping/CheckoutSameDayModal';
import MappingCancelModal from './molecules/MappingCancelModal';
import MappingDesyncConfirmModal from './integrated-schedule/molecules/MappingDesyncConfirmModal';
import PendingPackageEditModal from './PendingPackageEditModal';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import MGButton from '../../common/MGButton';
import IntegratedScheduleSummaryStrip from './integrated-schedule/molecules/IntegratedScheduleSummaryStrip';
import MatchingScheduleSidebar from './integrated-schedule/organisms/MatchingScheduleSidebar';
import SidePeekShell from '../../common/organisms/SidePeekShell';
import MappingScheduleSidePeekContent from './integrated-schedule/molecules/MappingScheduleSidePeekContent';
import SavedViewControls from '../ClientComprehensiveManagement/molecules/SavedViewControls';
import {
  buildViewModeStorageKey,
  resolveViewModeStorageScope,
  useViewModePreference
} from '../../../hooks/useViewModePreference';
import { useSavedViewPreference } from '../../../hooks/useSavedViewPreference';
import {
  INTEGRATED_SCHEDULE_DEFAULT_SELECTED_CLIENT_IDS,
  INTEGRATED_SCHEDULE_DEFAULT_STATUS_FILTER,
  INTEGRATED_SCHEDULE_DEFAULT_VIEW_FILTER,
  INTEGRATED_SCHEDULE_SAVED_VIEW_PAGE_ID,
  INTEGRATED_SCHEDULE_SAVED_VIEW_PERSIST_DEBOUNCE_MS,
  buildIntegratedScheduleDefaultSavedView
} from '../../../constants/integratedScheduleSavedViewConstants';
import {
  SIDEBAR_DENSITY_COMFORTABLE,
  SIDEBAR_DENSITY_MODES,
  SIDEBAR_DENSITY_PAGE_ID
} from './constants/integratedScheduleSidebarDensityConstants';
import {
  SCHEDULE_NOTES_REMINDER_DEFAULT_MODE,
  SCHEDULE_NOTES_REMINDER_MODES,
  SCHEDULE_NOTES_REMINDER_OFF,
  SCHEDULE_NOTES_REMINDER_ON,
  SCHEDULE_NOTES_REMINDER_PAGE_ID
} from './integrated-schedule/constants/scheduleNotesReminderConstants';
import ScheduleNotesReminderToggle from './integrated-schedule/molecules/ScheduleNotesReminderToggle';
import ScheduleNotesReminderModal from './integrated-schedule/molecules/ScheduleNotesReminderModal';
import { useScheduleNotesReminder } from './integrated-schedule/hooks/useScheduleNotesReminder';
import PackageExpiryReminderModal from './integrated-schedule/molecules/PackageExpiryReminderModal';
import { usePackageExpiryReminder } from './integrated-schedule/hooks/usePackageExpiryReminder';
import '../../../styles/unified-design-tokens.css';
import './IntegratedMatchingSchedule.css';
import {
  NEW_DAYS,
  VIEW_FILTER_NEW,
  VIEW_FILTER_REMAINING,
  VIEW_FILTER_ALL,
  PAYMENT_TIMING_SAME_DAY_CARD,
  MAPPING_STATUS_PENDING_PAYMENT,
  isInstitutionLinkMapping,
  isEligibleForAssignmentQueues,
  isOngoingMapping,
  getMappingDate,
  normalizedRemainingSessions
} from './constants/integratedScheduleSidebarFilterConstants';
import {
  assertExternalMappingDropAllowed,
  assertDropDateNotPast,
  calendarHasOccupyingConsultationForMapping,
  EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE,
  EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE,
  EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS
} from '../../../utils/scheduleExternalDropGuards';
import { USER_ROLES, mapLegacyRole } from '../../../constants/roles';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';
import { resolveMappingCreatedFollowUp } from './utils/sameDayCardCheckoutUtils';
import { buildMappingPaymentTimingLookup } from '../../schedule/utils/sameDayPendingEventDecorator';
import { useConfirm } from '../../../hooks/useConfirm';
import {
  attachPendingSessionExtensions,
  normalizePendingSessionExtension,
  SESSION_EXTENSION_UI
} from '../../../utils/sessionExtensionPending';
import {
  countPendingPaymentMappings,
  mergeUnpaidSoftMappings,
  mergeUnpaidSoftWithScheduleMappingIds,
  applyUnpaidSoftStatusFromSchedules,
  PENDING_PAYMENT_DIRTY_DEFAULT_AGE_HOURS,
  selectPendingPaymentMappings,
  sumPendingPaymentAmount
} from '../../../utils/pendingPaymentAggregation';
import {
  MAPPING_DESYNC_CTA_TYPE,
  MAPPING_DESYNC_KIND
} from './integrated-schedule/utils/mappingScheduleDesync';
import { filterMappingsByClientSearch } from './integrated-schedule/utils/filterMappingsByClientSearch';
import { toErrorMessage } from '../../../utils/safeDisplay';
import {
  adminClientsWithMappingGet,
  adminMappingsListGet,
  adminMappingsListGetAll,
  adminSchedulesListGetAll
} from '../../../api/adminListFetch';
import {
  ADMIN_DASHBOARD_LIST_PAGE,
  ADMIN_DASHBOARD_LIST_PAGE_SIZE
} from '../../../constants/adminDashboardWidgetConstants';
import { buildMonthDateRangeYmd } from '../../../utils/dateUtils';
// T5 표준화 2026-05-21: API 경로는 SSOT(API_ENDPOINTS) 참조

/** 내담자 필터 옵션 idle defer fallback (ms) — cold-load 대역폭과 경쟁하지 않음 */
const CLIENT_FILTER_IDLE_FALLBACK_MS = 500;

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'mg.integratedSchedule.sidebarCollapsed';
const SIDEBAR_AUTO_COLLAPSE_BREAKPOINT_PX = 1280;
const SESSION_SUCCESSION_HIGHLIGHT_CLEAR_MS = 8000;
const INTEGRATED_SCHEDULE_DEFAULT_SAVED_VIEW = buildIntegratedScheduleDefaultSavedView(
  SIDEBAR_DENSITY_COMFORTABLE
);

/**
 * 통합 스케줄 헤더 「신규 배정」CTA — ADMIN/STAFF only (fail-closed).
 * BRANCH_SUPER_ADMIN 등 레거시는 mapLegacyRole → ADMIN. CONSULTANT·미지·role 없음 → false.
 *
 * @param {string|null|undefined} role
 * @returns {boolean}
 */
const isAdminLikeScheduleUserRole = (role) => {
  const normalized = mapLegacyRole(role);
  return normalized === USER_ROLES.ADMIN || normalized === USER_ROLES.STAFF;
};

/**
 * 통합 스케줄 상단 내담자 다중 필터 옵션 소스.
 * 필터용 id/name/phone/email만 필요하므로 view=summary 사용 (풀페치 금지 — P0).
 * 응답: { success: true, data: { clients: [{ id, name, email, phone, ... }], count } }
 * URL/fetch 는 adminListFetch SSOT (page+size 강제).
 */

const readStoredBoolean = (key) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return raw === 'true';
  } catch (e) {
    return null;
  }
};

const writeStoredBoolean = (key, value) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, String(Boolean(value)));
  } catch (e) {
    // 무시 — Storage 가 비활성/quota 초과여도 UI 동작은 유지
  }
};

const IntegratedMatchingSchedule = () => {
  const { t } = useTranslation();
  const { user } = useSession();
  const [confirm, ConfirmModal] = useConfirm();
  /** 통합 스케줄 캘린더·등록 모달: 세션 역할 전달(STAFF 등). 미로그인 시에만 ADMIN 폴백 */
  const calendarUserRole = user?.role || USER_ROLES.ADMIN;
  const [mappings, setMappings] = useState([]);
  /** 가예약 카드 전용 SSOT — pending-payment(+dirty merge) 직접 소스 (mappings 경로 실패 대비) */
  const [unpaidSoftForCard, setUnpaidSoftForCard] = useState([]);
  /** first-paint chrome KPI — STATS SSOT; null = 미수신/실패 시 mappings 폴백 */
  const [mappingsChromeStats, setMappingsChromeStats] = useState({
    totalMappings: null,
    activeMappings: null
  });
  const [loading, setLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [preFilledMapping, setPreFilledMapping] = useState(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState(() => new Date());
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [createMappingModalOpen, setCreateMappingModalOpen] = useState(false);
  const [sessionExtensionMapping, setSessionExtensionMapping] = useState(null);
  const [sessionSuccessionMapping, setSessionSuccessionMapping] = useState(null);
  const [highlightedMappingId, setHighlightedMappingId] = useState(null);
  const successionHighlightTimerRef = useRef(null);
  const [sessionExtensionPaymentRequest, setSessionExtensionPaymentRequest] = useState(null);
  const [sessionExtensionCancellingId, setSessionExtensionCancellingId] = useState('');
  const [packagePaymentHistoryClientId, setPackagePaymentHistoryClientId] = useState(null);
  const [viewFilter, setViewFilter] = useState(INTEGRATED_SCHEDULE_DEFAULT_VIEW_FILTER);
  const [statusFilter, setStatusFilter] = useState(INTEGRATED_SCHEDULE_DEFAULT_STATUS_FILTER);
  const sidebarDensityStorageKey = buildViewModeStorageKey(
    resolveViewModeStorageScope(),
    SIDEBAR_DENSITY_PAGE_ID
  );
  const { viewMode: sidebarDensity, setViewMode: setSidebarDensity } = useViewModePreference({
    storageKey: sidebarDensityStorageKey,
    defaultMode: SIDEBAR_DENSITY_COMFORTABLE,
    allowedModes: SIDEBAR_DENSITY_MODES
  });
  const notesReminderStorageKey = buildViewModeStorageKey(
    resolveViewModeStorageScope(),
    SCHEDULE_NOTES_REMINDER_PAGE_ID
  );
  const { viewMode: notesReminderMode, setViewMode: setNotesReminderMode } = useViewModePreference({
    storageKey: notesReminderStorageKey,
    defaultMode: SCHEDULE_NOTES_REMINDER_DEFAULT_MODE,
    allowedModes: SCHEDULE_NOTES_REMINDER_MODES
  });
  const notesReminderEnabled = notesReminderMode === SCHEDULE_NOTES_REMINDER_ON;
  const [scheduleEventsForReminder, setScheduleEventsForReminder] = useState([]);
  const handleScheduleEventsChange = useCallback((events) => {
    setScheduleEventsForReminder(Array.isArray(events) ? events : []);
  }, []);
  const packageExpiryOpenRef = useRef(false);
  const {
    reminderState,
    dismissReminder,
    isReminderOpen
  } = useScheduleNotesReminder({
    enabled: notesReminderEnabled,
    scheduleEvents: scheduleEventsForReminder,
    pausedRef: packageExpiryOpenRef
  });
  const {
    reminderState: packageExpiryState,
    dismissReminder: dismissPackageExpiry,
    isReminderOpen: isPackageExpiryOpen
  } = usePackageExpiryReminder({
    enabled: true,
    scheduleEvents: scheduleEventsForReminder,
    mappings,
    paused: isReminderOpen
  });
  useEffect(() => {
    packageExpiryOpenRef.current = isPackageExpiryOpen;
  }, [isPackageExpiryOpen]);
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
    pageId: INTEGRATED_SCHEDULE_SAVED_VIEW_PAGE_ID,
    defaultView: INTEGRATED_SCHEDULE_DEFAULT_SAVED_VIEW,
    namedViews: true
  });
  const savedViewFiltersRestoredRef = useRef(false);
  const savedViewPersistReadyRef = useRef(false);
  const savedViewPersistTimerRef = useRef(null);
  const savedViewMetaRef = useRef({
    sort: INTEGRATED_SCHEDULE_DEFAULT_SAVED_VIEW.sort,
    viewMode: INTEGRATED_SCHEDULE_DEFAULT_SAVED_VIEW.viewMode
  });
  const [paymentModalMapping, setPaymentModalMapping] = useState(null);
  const [depositModalMapping, setDepositModalMapping] = useState(null);
  // 옵션 B (예약 우선 매칭) — 당일 카드 결제 모달 상태
  const [checkoutSameDayMapping, setCheckoutSameDayMapping] = useState(null);
  const [approveProcessing, setApproveProcessing] = useState(false);
  // R4 (옵션 B 디러티 PENDING_PAYMENT 정리) — 관리자 취소 확인 모달 대상 + 처리 중 플래그.
  const [cancelTargetMapping, setCancelTargetMapping] = useState(null);
  const [cancelPendingProcessing, setCancelPendingProcessing] = useState(false);
  const [pendingPackageEditMapping, setPendingPackageEditMapping] = useState(null);
  const [desyncTarget, setDesyncTarget] = useState(null);
  const [desyncProcessing, setDesyncProcessing] = useState(false);
  const [peekMapping, setPeekMapping] = useState(null);
  // 월별 상담사 COMPLETED 카운트 — 캘린더 datesSet 콜백에서 갱신.
  // 초기값은 현재 년/월. 캘린더가 첫 렌더 시 onMonthChange 로 동일 값을 다시 set 해도 동일 키 → 캐시 hit.
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);

  // R6 (2026-06-06) Phase 3-B: 월별 카운트·누락 일지 fetch+캐시는 공통 hook 으로 위임.
  // 컴포넌트 스코프 useRef 캐시 + tenantId 리셋 + cancelled race 패턴은 hook 내부에 동일하게 보존.
  const {
    counts: consultantCounts,
    isLoading: consultantCountsLoading
  } = useMonthlyConsultantCounts(currentYear, currentMonth);
  const {
    items: missingConsultationLogs,
    isLoading: missingConsultationLogsLoading
  } = useMissingConsultationLogs(currentYear, currentMonth);

  // 통합 스케줄 한정 — 상단 컴팩트 내담자 다중 필터.
  // 빈 배열 = 필터 비활성. UnifiedScheduleComponent 가 events 를 그대로 통과시킨다.
  const [selectedClientIds, setSelectedClientIds] = useState(
    INTEGRATED_SCHEDULE_DEFAULT_SELECTED_CLIENT_IDS
  );
  const [clientFilterOptions, setClientFilterOptions] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [clientFilterLoading, setClientFilterLoading] = useState(false);
  const [sidebarClientSearchQuery, setSidebarClientSearchQuery] = useState('');
  const lastClientFilterTenantRef = useRef(null);

  // tenantId 변경 시 내담자 필터 옵션·선택 리셋(다른 테넌트의 내담자가 노출되지 않도록 차단).
  useEffect(() => {
    const tenantId = user?.tenantId ?? null;
    if (lastClientFilterTenantRef.current !== tenantId) {
      lastClientFilterTenantRef.current = tenantId;
      setClientFilterOptions([]);
      setSelectedClientIds([]);
      setSidebarClientSearchQuery('');
    }
  }, [user?.tenantId]);

  // 내담자 필터 옵션 — cold-load 임계 경로와 대역폭 경쟁 금지.
  // requestIdleCallback(+ setTimeout fallback)으로 첫 paint 이후 지연 로드.
  // SSOT: MappingCreationModal 와 동일 엔드포인트.
  useEffect(() => {
    let cancelled = false;
    let idleHandle = null;
    let timeoutHandle = null;

    const loadClientOptions = async() => {
      try {
        setClientFilterLoading(true);
        const response = await adminClientsWithMappingGet();
        let payload = response;
        if (response && typeof response === 'object' && response.success === true && response.data) {
          payload = response.data;
        }
        const rawClients = Array.isArray(payload?.clients)
          ? payload.clients
          : (Array.isArray(payload) ? payload : []);
        const options = rawClients
          .filter((c) => c && c.id != null)
          .map((c) => ({
            id: c.id,
            name: typeof c.name === 'string' ? c.name : String(c.name ?? ''),
            phone: typeof c.phone === 'string' && c.phone !== '-' ? c.phone : '',
            email: typeof c.email === 'string' ? c.email : ''
          }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
        if (!cancelled) {
          setClientFilterOptions(options);
        }
      } catch (error) {
        console.warn('내담자 필터 옵션 로드 실패:', error);
        if (!cancelled) {
          setClientFilterOptions([]);
        }
      } finally {
        if (!cancelled) {
          setClientFilterLoading(false);
        }
      }
    };

    const scheduleDeferred = () => {
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(() => {
          if (!cancelled) {
            loadClientOptions();
          }
        }, { timeout: CLIENT_FILTER_IDLE_FALLBACK_MS * 4 });
      } else {
        timeoutHandle = setTimeout(() => {
          if (!cancelled) {
            loadClientOptions();
          }
        }, CLIENT_FILTER_IDLE_FALLBACK_MS);
      }
    };
    scheduleDeferred();

    return () => {
      cancelled = true;
      if (
        idleHandle != null
        && typeof window !== 'undefined'
        && typeof window.cancelIdleCallback === 'function'
      ) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle != null) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [user?.tenantId]);

  const handleOpenPeekFromCard = useCallback((mapping) => {
    if (mapping) {
      setPeekMapping(mapping);
    }
  }, []);

  const handleClosePeek = useCallback(() => {
    setPeekMapping(null);
  }, []);

  const handleVehiclePlateRegistered = useCallback(({
    clientId,
    vehiclePlate,
    consultantId,
    consultantVehiclePlate
  }) => {
    if (consultantId != null && consultantVehiclePlate !== undefined) {
      const consultantKey = String(consultantId);
      setMappings((prev) => prev.map((m) => (
        String(m.consultantId ?? m.consultant?.id) === consultantKey
          ? { ...m, consultantVehiclePlate }
          : m
      )));
      setPeekMapping((prev) => (
        prev && String(prev.consultantId ?? prev.consultant?.id) === consultantKey
          ? { ...prev, consultantVehiclePlate }
          : prev
      ));
      setRefetchTrigger((t) => t + 1);
      return;
    }
    if (clientId == null) {
      return;
    }
    const idKey = String(clientId);
    setMappings((prev) => prev.map((m) => (
      String(m.clientId) === idKey ? { ...m, vehiclePlate } : m
    )));
    setPeekMapping((prev) => (
      prev && String(prev.clientId) === idKey ? { ...prev, vehiclePlate } : prev
    ));
    setRefetchTrigger((t) => t + 1);
  }, []);

  const handleConsultantUpdated = useCallback(({ mappingId, consultantId, consultantName, consultantVehiclePlate }) => {
    if (mappingId == null) {
      return;
    }
    const idKey = String(mappingId);
    setMappings((prev) => prev.map((m) => (
      String(m.id) === idKey
        ? {
          ...m,
          consultantId,
          consultantName,
          ...(consultantVehiclePlate !== undefined
            ? { consultantVehiclePlate }
            : { consultantVehiclePlate: null })
        }
        : m
    )));
    setPeekMapping((prev) => (
      prev && String(prev.id) === idKey
        ? {
          ...prev,
          consultantId,
          consultantName,
          ...(consultantVehiclePlate !== undefined
            ? { consultantVehiclePlate }
            : { consultantVehiclePlate: null })
        }
        : prev
    ));
    setRefetchTrigger((t) => t + 1);
  }, []);

  useEffect(() => {
    if (savedViewFiltersRestoredRef.current) {
      return;
    }
    savedViewFiltersRestoredRef.current = true;
    savedViewMetaRef.current = {
      sort: savedView.sort ?? INTEGRATED_SCHEDULE_DEFAULT_SAVED_VIEW.sort,
      viewMode: savedView.viewMode ?? INTEGRATED_SCHEDULE_DEFAULT_SAVED_VIEW.viewMode
    };
    if (savedView?.density) {
      setSidebarDensity(savedView.density);
    }
    const storedFilters = savedView?.filters;
    if (storedFilters && Object.keys(storedFilters).length > 0) {
      if (storedFilters.viewFilter != null) {
        setViewFilter(storedFilters.viewFilter);
      }
      if (storedFilters.statusFilter != null) {
        setStatusFilter(storedFilters.statusFilter);
      }
      if (Array.isArray(storedFilters.selectedClientIds)) {
        setSelectedClientIds(storedFilters.selectedClientIds);
      }
    }
    savedViewPersistReadyRef.current = true;
  }, [savedView, setSidebarDensity]);

  useEffect(() => {
    if (!savedViewPersistReadyRef.current) {
      return undefined;
    }

    if (savedViewPersistTimerRef.current) {
      clearTimeout(savedViewPersistTimerRef.current);
    }

    savedViewPersistTimerRef.current = setTimeout(() => {
      savedViewPersistTimerRef.current = null;
      setSavedView({
        viewMode: savedViewMetaRef.current.viewMode,
        filters: {
          viewFilter,
          statusFilter,
          selectedClientIds
        },
        sort: savedViewMetaRef.current.sort,
        density: sidebarDensity
      });
    }, INTEGRATED_SCHEDULE_SAVED_VIEW_PERSIST_DEBOUNCE_MS);

    return () => {
      if (savedViewPersistTimerRef.current) {
        clearTimeout(savedViewPersistTimerRef.current);
        savedViewPersistTimerRef.current = null;
      }
    };
  }, [viewFilter, statusFilter, selectedClientIds, sidebarDensity, setSavedView]);

  const applySavedViewPayload = useCallback((payload) => {
    const storedFilters = payload?.filters ?? {};
    if (storedFilters.viewFilter != null) {
      setViewFilter(storedFilters.viewFilter);
    }
    if (storedFilters.statusFilter != null) {
      setStatusFilter(storedFilters.statusFilter);
    }
    if (Array.isArray(storedFilters.selectedClientIds)) {
      setSelectedClientIds(storedFilters.selectedClientIds);
    }
    if (payload?.density) {
      setSidebarDensity(payload.density);
    }
    savedViewMetaRef.current = {
      sort: payload?.sort ?? INTEGRATED_SCHEDULE_DEFAULT_SAVED_VIEW.sort,
      viewMode: payload?.viewMode ?? INTEGRATED_SCHEDULE_DEFAULT_SAVED_VIEW.viewMode
    };
  }, [setSidebarDensity]);

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
      viewMode: savedViewMetaRef.current.viewMode,
      filters: {
        viewFilter,
        statusFilter,
        selectedClientIds
      },
      sort: savedViewMetaRef.current.sort,
      density: sidebarDensity
    });
  }, [saveNamedView, viewFilter, statusFilter, selectedClientIds, sidebarDensity]);

  const handleDeleteSavedView = useCallback((viewId) => {
    const fallbackPayload = deleteNamedView(viewId);
    if (fallbackPayload) {
      applySavedViewPayload(fallbackPayload);
    }
  }, [deleteNamedView, applySavedViewPayload]);

  /**
   * 2026-06-XX R4 (P0) — 4월 보기에서 month=3 호출 회귀 해결.
   *
   * SSOT (FullCalendar v6 공식 문서): view.currentStart = 활성 월의 1일 00:00.
   * view.activeStart 는 표시 그리드 첫 가시일이며 month view 에서는 보통
   * 이전 달의 일요일이 들어온다. PR #135 R3 의 가정 「activeStart = 활성 월 1일」
   * 은 잘못된 가정으로, 4월 보기에서 activeStart=2026-03-29 → month=3 API
   * 호출 회귀를 유발했다.
   *
   * 우선순위: currentStart(SSOT) → activeStart(이전 달 보정 후 폴백) → start(mid-15 폴백).
   */
  const handleCalendarMonthChange = useCallback(({ start, activeStart, currentStart }) => {
    let ref = null;
    if (currentStart instanceof Date) {
      ref = currentStart;
    } else if (activeStart instanceof Date) {
      const probe = new Date(activeStart.getFullYear(), activeStart.getMonth(), activeStart.getDate() + 7);
      ref = new Date(probe.getFullYear(), probe.getMonth(), 1);
    } else if (start instanceof Date) {
      ref = new Date(start.getFullYear(), start.getMonth(), 15);
    }
    if (!ref) return;
    const nextYear = ref.getFullYear();
    const nextMonth = ref.getMonth() + 1;
    setCurrentYear((prev) => (prev === nextYear ? prev : nextYear));
    setCurrentMonth((prev) => (prev === nextMonth ? prev : nextMonth));
  }, []);

  // 좌측 사이드바 collapse 상태: localStorage 선호값이 있으면 우선, 없으면 화면 폭 기반 초기값
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const stored = readStoredBoolean(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (stored !== null) return stored;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia(`(max-width: ${SIDEBAR_AUTO_COLLAPSE_BREAKPOINT_PX}px)`).matches;
    }
    return false;
  });
  const userOverrideSidebarRef = useRef(readStoredBoolean(SIDEBAR_COLLAPSED_STORAGE_KEY) !== null);

  /**
   * 1280px 이하에서 자동 접힘 (사용자 명시적 토글 이전까지만 적용).
   * 사용자가 한 번 토글하면 userOverrideSidebarRef=true 가 되어 자동 접힘이 더는 강제되지 않음.
   */
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(`(max-width: ${SIDEBAR_AUTO_COLLAPSE_BREAKPOINT_PX}px)`);
    const handle = (event) => {
      if (userOverrideSidebarRef.current) return;
      setIsSidebarCollapsed(event.matches);
    };
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handle);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(handle);
    }
    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', handle);
      } else if (typeof mql.removeListener === 'function') {
        mql.removeListener(handle);
      }
    };
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      userOverrideSidebarRef.current = true;
      writeStoredBoolean(SIDEBAR_COLLAPSED_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const loadMappingsGenerationRef = useRef(0);

  const loadMappings = useCallback(async(options = {}) => {
    const generation = loadMappingsGenerationRef.current + 1;
    loadMappingsGenerationRef.current = generation;
    const isStale = () => generation !== loadMappingsGenerationRef.current;

    /**
     * mappings 목록 + unpaid soft overlay 를 state 에 반영.
     * @param {*} response
     * @param {*} pendingRaw
     * @param {*} dirtyRaw
     * @param {*} schedulesRaw
     * @param {*} extensionData
     * @param {{ notifyOnHardFail?: boolean }} [paintOptions]
     */
    const applyMappingsPaint = (
      response,
      pendingRaw,
      dirtyRaw,
      schedulesRaw,
      extensionData,
      paintOptions = {}
    ) => {
      if (isStale()) {
        return { listFailed: true, unpaidSoftCard: [] };
      }
      const listFailed = response == null;
      const pendingFailed = pendingRaw == null;
      const dirtyFailed = dirtyRaw == null;
      const schedulesFailed = schedulesRaw == null;

      let list = [];
      if (response?.mappings) {
        list = response.mappings;
      } else if (Array.isArray(response)) {
        list = response;
      }
      const rawExtensions = extensionData?.requests
        ?? extensionData?.data?.requests
        ?? (Array.isArray(extensionData) ? extensionData : []);
      // base merge 유지: soft 카드는 overlay 전 행으로 ACTIVE(rem>0) 신호 게이트
      const baseMerged = mergeUnpaidSoftMappings(list, pendingRaw, dirtyRaw);
      const merged = applyUnpaidSoftStatusFromSchedules(baseMerged, schedulesRaw);
      setMappings(attachPendingSessionExtensions(
        merged,
        Array.isArray(rawExtensions) ? rawExtensions : []
      ));

      // 가예약 카드 SSOT: pending∪dirty ∪ TENTATIVE_PENDING_PAYMENT 스케줄→기존 매핑 (발명 금지)
      // ACTIVE 는 unpaid 신호 id 집합에 있을 때만 포함 (PENDING 강제 발명 금지)
      let unpaidSoftCard = mergeUnpaidSoftWithScheduleMappingIds(baseMerged, schedulesRaw, {
        pendingRaw,
        dirtyRaw
      });
      if (unpaidSoftCard.length === 0) {
        unpaidSoftCard = selectPendingPaymentMappings(
          mergeUnpaidSoftMappings([], pendingRaw, dirtyRaw)
        );
      }
      setUnpaidSoftForCard(unpaidSoftCard);

      if (paintOptions.notifyOnHardFail !== false) {
        const allUnpaidSourcesFailed = listFailed && pendingFailed && dirtyFailed && schedulesFailed;
        if (allUnpaidSourcesFailed || (listFailed && unpaidSoftCard.length === 0)) {
          notificationManager.error('배정 목록을 불러오는데 실패했습니다.');
        }
      }
      return { listFailed, unpaidSoftCard };
    };

    try {
      await runResourceLoad(options, setLoading, async() => {
        // 표시 월만 schedules drain — unbounded GetAll 금지 (캘린더와 동일 startDate/endDate)
        const { startDate, endDate } = buildMonthDateRangeYmd(currentYear, currentMonth);

        // unpaid 소스별 best-effort: 한 API 실패가 dirty·schedules 카드/필터 SSOT 를 지우지 않음
        // 첫 paint: mappings 1페이지 + unpaid + 월 스코프 schedules + STATS (full mappings GetAll 대기 금지)
        const [
          response,
          pendingRaw,
          dirtyRaw,
          schedulesRaw,
          extensionData,
          mappingsStatsRaw
        ] = await Promise.all([
          adminMappingsListGet().catch(() => null),
          StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_PAYMENT).catch(() => null),
          StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_PAYMENT_DIRTY, {
            ageHours: PENDING_PAYMENT_DIRTY_DEFAULT_AGE_HOURS,
            page: ADMIN_DASHBOARD_LIST_PAGE,
            size: ADMIN_DASHBOARD_LIST_PAGE_SIZE
          }).catch(() => null),
          adminSchedulesListGetAll({ startDate, endDate }).catch(() => null),
          StandardizedApi.get(API_ENDPOINTS.ADMIN.SESSION_EXTENSIONS.PENDING_PAYMENT)
            .catch(() => null),
          StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.STATS).catch(() => null)
        ]);

        if (isStale()) {
          return;
        }

        if (mappingsStatsRaw != null) {
          const statsData = mappingsStatsRaw?.data != null
            ? mappingsStatsRaw.data
            : mappingsStatsRaw;
          const totalRaw = Number(statsData?.totalMappings);
          const activeRaw = Number(statsData?.activeMappings);
          setMappingsChromeStats({
            totalMappings: Number.isFinite(totalRaw) ? totalRaw : null,
            activeMappings: Number.isFinite(activeRaw) ? activeRaw : null
          });
        }

        applyMappingsPaint(
          response,
          pendingRaw,
          dirtyRaw,
          schedulesRaw,
          extensionData,
          { notifyOnHardFail: true }
        );

        // 사이드바 완전성용 mappings 잔여 페이지 — idle defer 후 백그라운드 merge
        // (캘린더 배지 hook 대역폭 확보). schedules 는 재drain 하지 않음(월 스코프 재사용).
        const runBackgroundMappingsGetAll = async() => {
          if (isStale()) {
            return;
          }
          const fullResponse = await adminMappingsListGetAll().catch(() => null);
          if (isStale() || fullResponse == null) {
            return;
          }
          applyMappingsPaint(
            fullResponse,
            pendingRaw,
            dirtyRaw,
            schedulesRaw,
            extensionData,
            { notifyOnHardFail: false }
          );
        };

        if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(() => {
            void runBackgroundMappingsGetAll();
          }, { timeout: CLIENT_FILTER_IDLE_FALLBACK_MS * 4 });
        } else {
          setTimeout(() => {
            void runBackgroundMappingsGetAll();
          }, CLIENT_FILTER_IDLE_FALLBACK_MS);
        }
      });
    } catch (error) {
      if (isStale()) {
        return;
      }
      console.error('매칭 목록 로드 실패:', error);
      setMappings([]);
      setUnpaidSoftForCard([]);
      notificationManager.error('배정 목록을 불러오는데 실패했습니다.');
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  /**
   * Idle/tab resume: visibility visible + window focus → always soft refetch mappings
   * and bump calendar soft invalidate (no full reload / no loading overlay).
   */
  useEffect(() => {
    const runIdleSoftRefresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      softRefresh(loadMappings);
      setRefetchTrigger((t) => t + 1);
    };

    const onWindowFocus = () => {
      runIdleSoftRefresh();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runIdleSoftRefresh();
      }
    };

    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadMappings]);

  useEffect(() => () => {
    if (successionHighlightTimerRef.current) {
      clearTimeout(successionHighlightTimerRef.current);
    }
  }, []);

  const scheduleSuccessionHighlightClear = useCallback(() => {
    if (successionHighlightTimerRef.current) {
      clearTimeout(successionHighlightTimerRef.current);
    }
    successionHighlightTimerRef.current = setTimeout(() => {
      setHighlightedMappingId(null);
      successionHighlightTimerRef.current = null;
    }, SESSION_SUCCESSION_HIGHLIGHT_CLEAR_MS);
  }, []);

  const cutoff = Date.now() - NEW_DAYS * 24 * 60 * 60 * 1000;
  let byView;
  if (viewFilter === VIEW_FILTER_NEW) {
    byView = mappings.filter((m) => {
      const created = getMappingDate(m);
      const withinDays = created >= cutoff;
      const actionNeeded =
        m.status === 'PENDING_PAYMENT' || m.status === 'DEPOSIT_PENDING';
      // ACTIVE rem=0 / fully-consumed 는 공통 헬퍼로 제외. 액션 필요 상태는 헬퍼가 유지.
      return (withinDays || actionNeeded) && isEligibleForAssignmentQueues(m);
    });
  } else if (viewFilter === VIEW_FILTER_REMAINING) {
    byView = mappings.filter((m) =>
      isInstitutionLinkMapping(m) || normalizedRemainingSessions(m) > 0
    );
  } else {
    byView = mappings;
  }

  const sortedByView = [...byView].sort(
    (a, b) => getMappingDate(b) - getMappingDate(a)
  );
  let filteredMappings;
  if (statusFilter === MAPPING_STATUS_PENDING_PAYMENT) {
    // rem=0 unpaid soft 는 VIEW_FILTER_REMAINING 게이트를 거치지 않는다.
    const pendingFromFull = selectPendingPaymentMappings(mappings);
    filteredMappings = [...pendingFromFull].sort(
      (a, b) => getMappingDate(b) - getMappingDate(a)
    );
  } else if (statusFilter === 'ongoing') {
    filteredMappings = sortedByView.filter(isOngoingMapping);
  } else if (statusFilter) {
    filteredMappings = sortedByView.filter((m) => m.status === statusFilter);
  } else {
    filteredMappings = sortedByView;
  }

  if (Array.isArray(selectedClientIds) && selectedClientIds.length > 0) {
    const allowedClientIds = new Set(selectedClientIds.map((id) => String(id)));
    filteredMappings = filteredMappings.filter((m) => (
      m?.clientId != null && allowedClientIds.has(String(m.clientId))
    ));
  }

  filteredMappings = filterMappingsByClientSearch(
    filteredMappings,
    sidebarClientSearchQuery,
    clientFilterOptions
  );

  const sidebarSearchHighlightId = (
    String(sidebarClientSearchQuery || '').trim()
    && filteredMappings.length === 1
    && filteredMappings[0]?.id != null
  )
    ? filteredMappings[0].id
    : null;
  const effectiveHighlightedMappingId = highlightedMappingId ?? sidebarSearchHighlightId;

  const getStatusCount = (value) => {
    if (value === 'ongoing') return byView.filter(isOngoingMapping).length;
    if (value === '') return byView.length;
    if (value === MAPPING_STATUS_PENDING_PAYMENT) {
      return countPendingPaymentMappings(unpaidSoftForCard);
    }
    return byView.filter((m) => m.status === value).length;
  };

  // chrome KPI: STATS first-paint SSOT — GetAll 부분 목록으로 회귀하지 않음
  const summaryTotalCount = mappingsChromeStats.totalMappings ?? mappings.length;
  const summaryOngoingCount = mappingsChromeStats.activeMappings
    ?? mappings.filter(isOngoingMapping).length;
  const summaryPendingPaymentCount = countPendingPaymentMappings(unpaidSoftForCard);
  const summaryPendingPaymentAmount = sumPendingPaymentAmount(unpaidSoftForCard);
  // 가예약 사이드바 카드: unpaidSoftForCard SSOT (mappings 필터/뷰와 무관, count===0 이어도 chrome 유지)
  const gareyarkCardCount = unpaidSoftForCard.length;
  const gareyarkCardFirstPending = unpaidSoftForCard[0] || null;

  const handlePendingPaymentSummaryClick = useCallback(() => {
    setStatusFilter(MAPPING_STATUS_PENDING_PAYMENT);
    setViewFilter(VIEW_FILTER_ALL);
  }, []);

  const handleDropFromExternal = (date, mappingPayload) => {
    // 가예약 OPEN 점유 가드를 과거일 가드보다 먼저.
    // COMPLETED 이력·다른 매핑 쌍 일정은 차단하지 않는다.
    const calendarOccupying = calendarHasOccupyingConsultationForMapping(
      scheduleEventsForReminder,
      mappingPayload
    );
    const mappingCheck = assertExternalMappingDropAllowed(mappingPayload, {
      existingCalendarHasOccupyingSchedule: calendarOccupying,
      calendarEvents: scheduleEventsForReminder
    });
    if (!mappingCheck.ok) {
      // 리더 SSOT — 모든 차단 return 직전 notificationManager 필수(모달만 막고 toast 없으면 FAIL).
      // invalid_payload → error, 그 외(특히 provisional_already_has_schedule) → warning 인라인.
      if (mappingCheck.kind === 'invalid_payload') {
        notificationManager.error(
          mappingCheck.userMessage || EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE
        );
        return;
      }
      notificationManager.warning(
        mappingCheck.userMessage || EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE,
        mappingCheck.kind === 'provisional_already_has_schedule'
          ? EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS
          : undefined
      );
      // 리더 SSOT — 차단+토스트만, 모달 오픈=FAIL, 이 return 이전에만 setScheduleModalOpen 금지.
      return;
    }
    const dateCheck = assertDropDateNotPast(date);
    if (!dateCheck.ok) {
      notificationManager.warning(dateCheck.userMessage);
      return;
    }
    // 옵션 B: 일정 저장 직후 CheckoutSameDayModal 자동 진입을 위해
    // 매핑 ID·결제 의도·패키지 정보를 prefill 에 함께 보존한다.
    setPreFilledMapping({
      mappingId: mappingPayload.mappingId ?? null,
      consultantId: mappingPayload.consultantId,
      clientId: mappingPayload.clientId,
      consultantName: mappingPayload.consultantName || '상담사',
      clientName: mappingPayload.clientName || '내담자',
      mappingStatus: mappingPayload.status,
      remainingSessions: mappingPayload.remainingSessions,
      paymentTiming: mappingPayload.paymentTiming ?? null,
      packageName: mappingPayload.packageName ?? null,
      packagePrice: mappingPayload.packagePrice ?? null,
      totalSessions: mappingPayload.totalSessions ?? null,
      hasConsultationSchedule: mappingPayload.hasConsultationSchedule === true,
      hasOpenOccupyingConsultationSchedule:
        mappingPayload.hasOpenOccupyingConsultationSchedule === true,
      existingCalendarHasOccupyingSchedule: calendarOccupying
    });
    setSelectedDateForModal(date instanceof Date ? date : new Date(date));
    // 리더 SSOT — 위 assertExternalMappingDropAllowed / assertDropDateNotPast 통과 후에만 도달.
    // 가드 실패 시 setScheduleModalOpen(true) 는 unreachable (모달 오픈=FAIL).
    setScheduleModalOpen(true);
  };

  /** 사이드바 카드 «일정 등록» — 캘린더 드래그 대신 버튼으로만 모달 진입 */
  const handleOpenScheduleFromCard = (mapping) => {
    const mappingPayload = {
      mappingId: mapping.id,
      consultantId: mapping.consultantId,
      clientId: mapping.clientId,
      consultantName: mapping.consultantName,
      clientName: mapping.clientName,
      status: mapping.status,
      remainingSessions: mapping.remainingSessions,
      paymentTiming: mapping.paymentTiming ?? null,
      packageName: mapping.packageName ?? null,
      packagePrice: mapping.packagePrice ?? null,
      totalSessions: mapping.totalSessions ?? null,
      hasConsultationSchedule: mapping.hasConsultationSchedule === true,
      hasOpenOccupyingConsultationSchedule: mapping.hasOpenOccupyingConsultationSchedule === true
    };
    handleDropFromExternal(new Date(), mappingPayload);
  };

  /**
   * 옵션 B SAME_DAY_CARD 사이드바 카드 액션 — "당일 결제 + 활성화" 버튼.
   * P0 핫픽스 2026-05-28 가드와 동일하게 매핑 정보 누락 시 모달 진입을 차단한다.
   * @param {object} mapping
   * @param {{ sameDaySessionScheduleId?: string|number|null }} [extras]
   */
  const handleOpenCheckoutSameDayFromCard = (mapping, extras = {}) => {
    if (!mapping?.consultantId || !mapping?.packageName) {
      notificationManager.warning(
        '이 배정은 정보가 누락되어 당일 카드 결제를 진행할 수 없습니다. 배정을 다시 생성해 주세요.'
      );
      return;
    }
    const scheduleId = extras.sameDaySessionScheduleId
      ?? mapping.sameDaySessionScheduleId
      ?? null;
    setCheckoutSameDayMapping({
      id: mapping.id,
      consultantId: mapping.consultantId,
      consultantName: mapping.consultantName,
      clientId: mapping.clientId,
      clientName: mapping.clientName,
      packageName: mapping.packageName,
      packagePrice: mapping.packagePrice ?? null,
      paymentAmount: mapping.paymentAmount ?? null,
      totalSessions: mapping.totalSessions ?? null,
      paymentTiming: mapping.paymentTiming ?? null,
      sameDaySessionScheduleId: scheduleId
    });
  };

  /**
   * 스케줄 상세(가예약 과거) — 「당일 결제 + 활성화」.
   * mappingId 로 사이드바 mappings 를 찾아 기존 CheckoutSameDayModal 진입.
   */
  const handleCheckoutSameDayFromDetail = (scheduleData) => {
    const mappingId = scheduleData?.mappingId
      ?? scheduleData?.extendedProps?.mappingId
      ?? null;
    if (mappingId == null) {
      notificationManager.error(
        '연결된 배정을 찾을 수 없어 당일 결제를 진행할 수 없습니다.'
      );
      return;
    }
    const mapping = mappings.find((m) => String(m.id) === String(mappingId));
    if (!mapping) {
      notificationManager.error(
        '연결된 배정을 찾을 수 없어 당일 결제를 진행할 수 없습니다.'
      );
      return;
    }
    const scheduleId = scheduleData?.id ?? scheduleData?.scheduleId ?? null;
    handleOpenCheckoutSameDayFromCard(mapping, {
      sameDaySessionScheduleId: scheduleId
    });
  };

  const handleMappingCreated = (result) => {
    setCreateMappingModalOpen(false);
    softRefresh(loadMappings);
    // P0 핫픽스 2026-05-28 (사용자 보고): 옵션 B SAME_DAY_CARD 신규 매칭 생성 직후 CheckoutSameDayModal 자동 오픈 제거.
    // 사용자 의도: 매칭 생성 → 모달 닫힘 → 사이드바에서 직접 트리거(드래그 → 일정 생성 모달 또는 "당일 결제 + 활성화" 버튼).
    // PR #50 의 의도된 자동 진입(드래그 → 일정 생성 → handleScheduleCreated → CheckoutSameDayModal) 은 유지된다.
    const { shouldShowSameDayCardGuidance } = resolveMappingCreatedFollowUp(result);
    if (shouldShowSameDayCardGuidance) {
      notificationManager.info(
        '배정이 생성되었습니다. 사이드바에서 일정을 예약하거나 「당일 결제 + 활성화」를 진행해 주세요.'
      );
    }
  };

  const handlePaymentConfirmed = () => {
    setPaymentModalMapping(null);
    softRefresh(loadMappings);
  };

  const handleDepositConfirmed = () => {
    setDepositModalMapping(null);
    softRefresh(loadMappings);
  };

  const handleCheckoutSameDayCompleted = () => {
    setCheckoutSameDayMapping(null);
    softRefresh(loadMappings);
    // #865: oneshot/checkout 성공 후 캘린더 soft silent refetch
    setRefetchTrigger((t) => t + 1);
  };

  const handleApprove = async(mappingId) => {
    if (approveProcessing) return;
    setApproveProcessing(true);
    try {
      await StandardizedApi.post(`/api/v1/admin/mappings/${mappingId}/approve`, {
        adminName: user?.name || user?.userId || '관리자'
      });
      notificationManager.success('배정이 활성화되었습니다.');
      softRefresh(loadMappings);
    } catch (error) {
      console.error('매칭 승인 실패:', error);
      notificationManager.error(error?.message || '배정 활성화에 실패했습니다.');
    } finally {
      setApproveProcessing(false);
    }
  };

  /**
   * R4 (옵션 B 디러티 PENDING_PAYMENT 정리) — 사이드바 카드 "매칭 취소" 보조 액션.
   * 합의서/시안: docs/project-management/2026-05-28/R4_*.md.
   * 1) 카드에서 클릭 → UnifiedModal 확인 모달 오픈 (오클릭 방지).
   * 2) 모달 confirm → POST /admin/mappings/{id}/terminate (백엔드 PENDING_PAYMENT 분기 처리).
   * 3) 성공 시 카드 목록 자동 갱신 → TERMINATED 매칭 사이드바에서 사라짐.
   */
  const handleRequestCancelPendingMapping = useCallback((mapping) => {
    if (!mapping?.id) {
      return;
    }
    if (mapping.status !== 'PENDING_PAYMENT') {
      // 가드: PENDING_PAYMENT 외 상태는 UI 노출되지 않으나 방어적으로 차단.
      notificationManager.warning('결제 대기 상태의 배정만 취소할 수 있습니다.');
      return;
    }
    setCancelTargetMapping({
      id: mapping.id,
      consultantName: mapping.consultantName,
      clientName: mapping.clientName,
      paymentTiming: mapping.paymentTiming ?? null
    });
  }, []);

  /**
   * 가계약(PENDING_PAYMENT) 전용 패키지 변경 — 동일 매핑 write SSOT.
   * 과거 스케줄 시각과 무관. 일반 PUT /mappings/{id} 경로 사용 금지.
   */
  const handleRequestChangePendingPackage = useCallback((mapping) => {
    if (!mapping?.id) {
      return;
    }
    if (mapping.status !== MAPPING_STATUS_PENDING_PAYMENT) {
      notificationManager.warning('결제 대기 배정만 패키지를 변경할 수 있습니다.');
      return;
    }
    setPendingPackageEditMapping(mapping);
  }, []);

  const handlePendingPackageEditClose = useCallback(() => {
    setPendingPackageEditMapping(null);
  }, []);

  const handlePendingPackageEditSuccess = useCallback((updated) => {
    const payload = updated?.data ?? updated;
    if (payload && payload.id != null) {
      const idKey = String(payload.id);
      setMappings((prev) => prev.map((m) => (
        String(m.id) === idKey
          ? {
            ...m,
            packageName: payload.packageName ?? m.packageName,
            packagePrice: payload.packagePrice ?? m.packagePrice,
            totalSessions: payload.totalSessions ?? m.totalSessions,
            remainingSessions: payload.remainingSessions ?? m.remainingSessions,
            usedSessions: payload.usedSessions ?? m.usedSessions
          }
          : m
      )));
      setPeekMapping((prev) => (
        prev && String(prev.id) === idKey
          ? {
            ...prev,
            packageName: payload.packageName ?? prev.packageName,
            packagePrice: payload.packagePrice ?? prev.packagePrice,
            totalSessions: payload.totalSessions ?? prev.totalSessions,
            remainingSessions: payload.remainingSessions ?? prev.remainingSessions,
            usedSessions: payload.usedSessions ?? prev.usedSessions
          }
          : prev
      ));
    }
    setPendingPackageEditMapping(null);
    softRefresh(loadMappings);
  }, [loadMappings]);

  const handleCancelModalClose = useCallback(() => {
    if (cancelPendingProcessing) {
      return;
    }
    setCancelTargetMapping(null);
  }, [cancelPendingProcessing]);

  const handleConfirmCancelPendingMapping = useCallback(async() => {
    if (!cancelTargetMapping?.id || cancelPendingProcessing) {
      return;
    }
    const mappingId = cancelTargetMapping.id;
    setCancelPendingProcessing(true);
    try {
      await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.MAPPINGS.TERMINATE(mappingId),
        { reason: '관리자 취소 — 디러티 PENDING_PAYMENT 정리' }
      );
      notificationManager.success('배정이 취소되었습니다.');
      setCancelTargetMapping(null);
      softRefresh(loadMappings);
    } catch (error) {
      console.error('매칭 취소 실패:', error);
      notificationManager.error(error?.message || '배정 취소에 실패했습니다.');
    } finally {
      setCancelPendingProcessing(false);
    }
  }, [cancelTargetMapping, cancelPendingProcessing, loadMappings]);

  const handleRequestDesyncAction = useCallback((mapping, desyncMeta) => {
    if (!mapping?.id || !desyncMeta?.kind || desyncProcessing) {
      return;
    }
    if (desyncMeta.kind === MAPPING_DESYNC_KIND.SESSIONS_IN_PROGRESS) {
      return;
    }
    if (desyncMeta.kind === MAPPING_DESYNC_KIND.CANCEL) {
      handleRequestCancelPendingMapping(mapping);
      return;
    }
    setDesyncTarget({
      mappingId: mapping.id,
      kind: desyncMeta.kind,
      ctaType: desyncMeta.ctaType,
      modalTitle: desyncMeta.modalTitle,
      modalSubtitle: desyncMeta.modalSubtitle
    });
  }, [desyncProcessing, handleRequestCancelPendingMapping]);

  const handleDesyncModalClose = useCallback(() => {
    if (desyncProcessing) {
      return;
    }
    setDesyncTarget(null);
  }, [desyncProcessing]);

  const handleConfirmDesyncAction = useCallback(async() => {
    if (!desyncTarget?.mappingId || desyncProcessing) {
      return;
    }
    const mappingId = desyncTarget.mappingId;
    const ctaType = desyncTarget.ctaType;
    setDesyncProcessing(true);
    try {
      if (ctaType === MAPPING_DESYNC_CTA_TYPE.CLEANUP) {
        await StandardizedApi.post(
          API_ENDPOINTS.ADMIN.MAPPINGS.CLEANUP_FUTURE_SCHEDULES(mappingId),
          {}
        );
        notificationManager.success('잔여 일정을 정리했습니다.');
      } else if (ctaType === MAPPING_DESYNC_CTA_TYPE.COMPLETE) {
        await StandardizedApi.post(
          API_ENDPOINTS.ADMIN.SESSION_SYNC.VALIDATE_MAPPING(mappingId),
          {}
        );
        notificationManager.success('배정을 완료 처리했습니다.');
      } else {
        notificationManager.warning('처리할 수 없는 요청입니다.');
        return;
      }
      setDesyncTarget(null);
      softRefresh(loadMappings);
      setRefetchTrigger((t) => t + 1);
    } catch (error) {
      console.error('desync 조치 실패:', error);
      notificationManager.error(toErrorMessage(error) || '조치에 실패했습니다.');
    } finally {
      setDesyncProcessing(false);
    }
  }, [desyncTarget, desyncProcessing, loadMappings]);

  const handleScheduleModalClose = () => {
    setScheduleModalOpen(false);
    setPreFilledMapping(null);
  };

  const handleScheduleCreated = () => {
    setRefetchTrigger((t) => t + 1);
    softRefresh(loadMappings);
    setScheduleModalOpen(false);
    // 옵션 B v2.0 Path 3 UX 핫픽스 (2026-05-28 사용자 결재 14:48 KST):
    //  - 사용자 의도(14:27 KST): "지금 예약만 하는건데 미리 카드로 할건지 현금으로 할건지 선택이 되어야 하나?"
    //  - 일정 등록 직후 CheckoutSameDayModal 자동 진입을 제거하고, 사이드바 카드의
    //    "당일 결제 + 활성화" 버튼을 통한 별도 시점 결제로 일원화한다.
    //  - 추가 진입 경로 없음 (Q3 default 권장안 — 사이드바 단일 경로).
    //  - 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md §2·§3
    if (preFilledMapping?.paymentTiming === PAYMENT_TIMING_SAME_DAY_CARD) {
      notificationManager.info(t('admin:integratedSchedule.tentativeReserved.info'));
    }
    setPreFilledMapping(null);
  };

  const handleSessionExtensionFromCard = useCallback((mapping) => {
    if (mapping?.pendingSessionExtension) {
      notificationManager.warning(SESSION_EXTENSION_UI.DUPLICATE_PENDING);
      return;
    }
    setSessionExtensionMapping(mapping);
  }, []);

  const handleSessionSuccessionFromCard = useCallback((mapping) => {
    if (!mapping?.id) {
      return;
    }
    setSessionSuccessionMapping(mapping);
  }, []);

  const handleSessionSuccessionSucceeded = useCallback(async(payload) => {
    const targetId = payload?.targetMapping?.id ?? payload?.targetMapping?.mappingId ?? null;
    await softRefresh(loadMappings);
    if (targetId == null) {
      return;
    }
    setIsSidebarCollapsed(false);
    setViewFilter(VIEW_FILTER_ALL);
    setStatusFilter(INTEGRATED_SCHEDULE_DEFAULT_STATUS_FILTER);
    setHighlightedMappingId(String(targetId));
    scheduleSuccessionHighlightClear();
  }, [loadMappings, scheduleSuccessionHighlightClear]);

  const handlePackagePaymentHistoryFromCard = useCallback((mapping) => {
    const clientId = mapping?.clientId ?? mapping?.client?.id ?? null;
    if (clientId == null) {
      notificationManager.warning(PACKAGE_PAYMENT_HISTORY_UI.CLIENT_MISSING);
      return;
    }
    setPackagePaymentHistoryClientId(clientId);
  }, []);

  const handleSessionExtensionRequested = useCallback(() => {
    softRefresh(loadMappings);
    setSessionExtensionMapping(null);
  }, [loadMappings]);

  const handleConfirmSessionExtensionPayment = useCallback((mapping) => {
    const pending = mapping?.pendingSessionExtension;
    if (!pending?.id) {
      return;
    }
    setSessionExtensionPaymentRequest({
      ...normalizePendingSessionExtension(pending),
      sourceId: pending.id,
      clientName: mapping.clientName ?? pending.clientName,
      consultantName: mapping.consultantName ?? pending.consultantName,
      amount: pending.amount,
      additionalSessions: pending.additionalSessions
    });
  }, []);

  const cancelSessionExtensionRequest = useCallback(async(itemOrRequest) => {
    const requestId = itemOrRequest?.sourceId ?? itemOrRequest?.id;
    if (requestId == null) {
      return false;
    }
    const confirmed = await confirm({
      message: SESSION_EXTENSION_UI.CANCEL_CONFIRM_MESSAGE,
      variant: 'danger'
    });
    if (!confirmed) {
      return false;
    }
    setSessionExtensionCancellingId(String(requestId));
    try {
      const result = await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.SESSION_EXTENSIONS.CANCEL(requestId),
        { reason: SESSION_EXTENSION_UI.CANCEL_REASON }
      );
      if (result?.success === false) {
        throw new Error(result.message || '회기 추가 요청 취소에 실패했습니다.');
      }
      notificationManager.success(SESSION_EXTENSION_UI.CANCEL_SUCCESS);
      setSessionExtensionPaymentRequest(null);
      await softRefresh(loadMappings);
      setRefetchTrigger((prev) => prev + 1);
      return true;
    } catch (error) {
      console.error('회기 추가 요청 취소 실패:', error);
      notificationManager.error(toErrorMessage(error, '회기 추가 요청 취소에 실패했습니다.'));
      return false;
    } finally {
      setSessionExtensionCancellingId('');
    }
  }, [confirm, loadMappings]);

  const handleCancelSessionExtensionFromCard = useCallback((mapping) => {
    const pending = mapping?.pendingSessionExtension;
    if (!pending?.id) {
      return;
    }
    cancelSessionExtensionRequest({
      id: pending.id,
      sourceId: pending.id
    });
  }, [cancelSessionExtensionRequest]);

  const handleSessionExtensionPaymentConfirmed = useCallback(async() => {
    setSessionExtensionPaymentRequest(null);
    await softRefresh(loadMappings);
    setRefetchTrigger((prev) => prev + 1);
  }, [loadMappings]);

  const canCreateMappingCta = isAdminLikeScheduleUserRole(user?.role);
  const headerActions = canCreateMappingCta ? (
    <div
      className="integrated-schedule__header-actions"
      role="group"
      aria-label="통합 스케줄 관리"
    >
      <MGButton
        variant="primary"
        size="medium"
        onClick={() => setCreateMappingModalOpen(true)}
        aria-label="신규 배정 생성"
        className="integrated-schedule__header-btn"
      >
        신규 배정
      </MGButton>
    </div>
  ) : null;

  return (
    <div className="integrated-schedule integrated-schedule--clinic-os">
      <div className="integrated-schedule__shell">
        <ContentArea ariaLabel="통합 스케줄">
          <ContentHeader
            title="통합 스케줄"
            subtitle="배정 목록과 캘린더에서 예약을 한 화면에서 관리합니다."
            actions={headerActions}
            titleId="integrated-schedule-page-title"
          />

          <IntegratedScheduleSummaryStrip
            loading={loading}
            totalCount={summaryTotalCount}
            ongoingCount={summaryOngoingCount}
            pendingPaymentCount={summaryPendingPaymentCount}
            pendingPaymentAmount={summaryPendingPaymentAmount}
            onPendingPaymentClick={handlePendingPaymentSummaryClick}
          />

          <div className="integrated-schedule__stage">
          <div
            className={`integrated-schedule__content${
              peekMapping ? ' integrated-schedule__content--peek-open' : ''
            }`}
          >
        <MatchingScheduleSidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleSidebarToggle}
          filteredMappings={filteredMappings}
          loading={loading}
          viewFilter={viewFilter}
          onViewFilterChange={setViewFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          clientSearchQuery={sidebarClientSearchQuery}
          onClientSearchChange={setSidebarClientSearchQuery}
          sidebarDensity={sidebarDensity}
          onSidebarDensityChange={setSidebarDensity}
          gareyarkCard={{
            count: gareyarkCardCount,
            firstPending: gareyarkCardFirstPending,
            onOpenList: handlePendingPaymentSummaryClick,
            onCheckout: handleOpenCheckoutSameDayFromCard
          }}
          savedViewControls={(
            <SavedViewControls
              views={views}
              activeViewId={activeViewId}
              onSelectView={handleSelectSavedView}
              onSaveView={handleSaveNamedView}
              onResetToDefault={handleResetSavedView}
              onDeleteView={handleDeleteSavedView}
            />
          )}
          getStatusCount={getStatusCount}
          onScheduleFromCard={handleOpenScheduleFromCard}
          onOpenPeek={handleOpenPeekFromCard}
          onPayment={setPaymentModalMapping}
          onDeposit={setDepositModalMapping}
          onApprove={handleApprove}
          onCheckoutSameDay={handleOpenCheckoutSameDayFromCard}
          onCancelPendingMapping={handleRequestCancelPendingMapping}
          onChangePendingPackage={handleRequestChangePendingPackage}
          onDesyncAction={handleRequestDesyncAction}
          onSessionExtension={handleSessionExtensionFromCard}
          onSessionSuccession={handleSessionSuccessionFromCard}
          onConfirmSessionExtensionPayment={handleConfirmSessionExtensionPayment}
          onCancelSessionExtension={handleCancelSessionExtensionFromCard}
          onPackagePaymentHistory={handlePackagePaymentHistoryFromCard}
          approveProcessing={approveProcessing}
          cancelPendingProcessing={cancelPendingProcessing}
          cancelTargetMappingId={cancelTargetMapping?.id ?? null}
          desyncProcessing={desyncProcessing}
          desyncTargetMappingId={desyncTarget?.mappingId ?? null}
          activePeekMappingId={peekMapping?.id ?? null}
          highlightedMappingId={effectiveHighlightedMappingId}
        />

        <div
          className="integrated-schedule__main-region"
          data-region="R-MAIN-PEEK"
        >
        <main
          className="integrated-schedule__calendar-wrapper integrated-schedule__calendar-wrapper--integrated"
          data-layout-context="integrated-schedule"
          data-calendar-skin="integrated"
          data-region="R-MAIN"
        >
          {/*
            R2 (2026-06-09): 가예약 범례를 ScheduleLegend body 로 흡수해 상단 영역 압축.
            기존 className/i18n 키는 그대로 재사용 → 시각 회귀 0.
          */}
          <div className="integrated-schedule__calendar-content">
            <UnifiedScheduleComponent
              userRole={calendarUserRole}
              userId={user?.id ?? undefined}
              refetchTrigger={refetchTrigger}
              silentScheduleRefetch
              onDropFromExternal={handleDropFromExternal}
              onCheckoutSameDayFromDetail={handleCheckoutSameDayFromDetail}
              hideScheduleTitle
              integratedMonthEventLayout
              calendarSkin="integrated"
              mappingPaymentTimingByMappingId={buildMappingPaymentTimingLookup(mappings)}
              onMonthChange={handleCalendarMonthChange}
              consultantCounts={consultantCounts}
              consultantCountsMonth={currentMonth}
              consultantCountsLoading={consultantCountsLoading}
              showClientFilter
              clients={clientFilterOptions}
              selectedClientIds={selectedClientIds}
              onClientFilterChange={setSelectedClientIds}
              missingConsultationLogs={missingConsultationLogs}
              missingConsultationLogsLoading={missingConsultationLogsLoading}
              onScheduleEventsChange={handleScheduleEventsChange}
              onAfterScheduleUpdated={() => softRefresh(loadMappings)}
              headerToolbarEnd={(
                <ScheduleNotesReminderToggle
                  enabled={notesReminderEnabled}
                  onChange={(next) => setNotesReminderMode(
                    next ? SCHEDULE_NOTES_REMINDER_ON : SCHEDULE_NOTES_REMINDER_OFF
                  )}
                />
              )}
              sameDayPendingLegendContent={(
                <>
                  <p
                    className="integrated-schedule__legend integrated-schedule__legend--same-day"
                    role="note"
                  >
                    <span
                      className="integrated-schedule__legend-swatch integrated-schedule__legend-swatch--same-day"
                      aria-hidden="true"
                    />
                    <span className="integrated-schedule__legend-text">
                      {t('admin:mapping.schedule.legend.sameDayPending')}
                    </span>
                  </p>
                  <p
                    className="integrated-schedule__legend integrated-schedule__legend--institution-link"
                    role="note"
                  >
                    <span
                      className="integrated-schedule__legend-swatch integrated-schedule__legend-swatch--institution-link"
                      aria-hidden="true"
                    />
                    <span className="integrated-schedule__legend-text">
                      {t('admin:mapping.schedule.legend.institutionLink')}
                    </span>
                  </p>
                </>
              )}
            />
          </div>
        </main>
        <SidePeekShell
          isOpen={Boolean(peekMapping)}
          onClose={handleClosePeek}
          title="상세"
          ariaLabel={peekMapping ? `${peekMapping.clientName || '배정'} 상세` : '상세'}
        >
          <MappingScheduleSidePeekContent
            mapping={peekMapping}
            onVehiclePlateRegistered={handleVehiclePlateRegistered}
            onConsultantUpdated={handleConsultantUpdated}
            onChangePendingPackage={handleRequestChangePendingPackage}
            userRole={calendarUserRole}
          />
        </SidePeekShell>
        </div>
          </div>
          </div>
        </ContentArea>
      </div>

      {scheduleModalOpen && (
        <ScheduleModal
          isOpen={scheduleModalOpen}
          onClose={handleScheduleModalClose}
          selectedDate={selectedDateForModal}
          selectedInfo={null}
          userRole={calendarUserRole}
          userId={user?.id ?? undefined}
          onScheduleCreated={handleScheduleCreated}
          onScheduleCreateFailed={() => softRefresh(loadMappings)}
          preFilledMapping={preFilledMapping}
          calendarEvents={scheduleEventsForReminder}
        />
      )}

      <MappingCreationModal
        isOpen={createMappingModalOpen}
        onClose={() => setCreateMappingModalOpen(false)}
        onMappingCreated={handleMappingCreated}
      />

      {sessionExtensionMapping && (
        <SessionExtensionModal
          isOpen={!!sessionExtensionMapping}
          onClose={() => setSessionExtensionMapping(null)}
          mapping={sessionExtensionMapping}
          onSessionExtensionRequested={handleSessionExtensionRequested}
        />
      )}

      {sessionSuccessionMapping && (
        <SessionSuccessionWizardModal
          isOpen={!!sessionSuccessionMapping}
          onClose={() => setSessionSuccessionMapping(null)}
          mapping={sessionSuccessionMapping}
          onSucceeded={handleSessionSuccessionSucceeded}
        />
      )}

      <PackagePaymentHistoryModal
        isOpen={packagePaymentHistoryClientId != null}
        onClose={() => setPackagePaymentHistoryClientId(null)}
        clientId={packagePaymentHistoryClientId}
      />

      <SessionExtensionPaymentConfirmModal
        isOpen={Boolean(sessionExtensionPaymentRequest)}
        request={sessionExtensionPaymentRequest}
        onClose={() => setSessionExtensionPaymentRequest(null)}
        onConfirmed={handleSessionExtensionPaymentConfirmed}
        onCancelRequest={cancelSessionExtensionRequest}
        isCancelling={Boolean(
          sessionExtensionPaymentRequest
          && sessionExtensionCancellingId
          && String(sessionExtensionCancellingId) === String(
            sessionExtensionPaymentRequest.sourceId ?? sessionExtensionPaymentRequest.id
          )
        )}
      />

      {paymentModalMapping && (
        <MappingPaymentModal
          isOpen={!!paymentModalMapping}
          onClose={() => setPaymentModalMapping(null)}
          mapping={paymentModalMapping}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}
      {depositModalMapping && (
        <MappingDepositModal
          isOpen={!!depositModalMapping}
          onClose={() => setDepositModalMapping(null)}
          mapping={depositModalMapping}
          onDepositConfirmed={handleDepositConfirmed}
        />
      )}
      {checkoutSameDayMapping && (
        <CheckoutSameDayModal
          isOpen={!!checkoutSameDayMapping}
          onClose={() => setCheckoutSameDayMapping(null)}
          mapping={checkoutSameDayMapping}
          onCheckoutCompleted={handleCheckoutSameDayCompleted}
          mode={
            checkoutSameDayMapping?.paymentTiming === PAYMENT_TIMING_SAME_DAY_CARD
              ? CHECKOUT_MODAL_MODE_SAME_DAY
              : CHECKOUT_MODAL_MODE_CONFIRM_ACTIVATE
          }
        />
      )}
      {cancelTargetMapping && (
        <MappingCancelModal
          isOpen={!!cancelTargetMapping}
          onClose={handleCancelModalClose}
          onConfirm={handleConfirmCancelPendingMapping}
          processing={cancelPendingProcessing}
        />
      )}
      {pendingPackageEditMapping && (
        <PendingPackageEditModal
          isOpen={!!pendingPackageEditMapping}
          onClose={handlePendingPackageEditClose}
          mapping={pendingPackageEditMapping}
          onSuccess={handlePendingPackageEditSuccess}
        />
      )}
      {desyncTarget && (
        <MappingDesyncConfirmModal
          isOpen={!!desyncTarget}
          title={desyncTarget.modalTitle}
          subtitle={desyncTarget.modalSubtitle}
          onClose={handleDesyncModalClose}
          onConfirm={handleConfirmDesyncAction}
          processing={desyncProcessing}
        />
      )}
      <ScheduleNotesReminderModal
        isOpen={isReminderOpen}
        onClose={dismissReminder}
        clientName={reminderState?.clientName}
        consultantName={reminderState?.consultantName}
        startTimeLabel={reminderState?.startTimeLabel}
        notes={reminderState?.notes ?? []}
      />
      <PackageExpiryReminderModal
        isOpen={isPackageExpiryOpen}
        onClose={dismissPackageExpiry}
        clientName={packageExpiryState?.clientName}
        consultantName={packageExpiryState?.consultantName}
        startTimeLabel={packageExpiryState?.startTimeLabel}
        remainingSessions={packageExpiryState?.remainingSessions}
        totalSessions={packageExpiryState?.totalSessions}
      />
      <ConfirmModal />
    </div>
  );
};

export default IntegratedMatchingSchedule;
