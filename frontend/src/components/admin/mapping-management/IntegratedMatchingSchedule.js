/**
 * IntegratedMatchingSchedule - 매칭·스케줄 통합 원스톱 화면
 * 좌: 매칭 목록(실 API /api/v1/admin/mappings), 우: 스케줄 캘린더(실 API)
 * 카드 드래그 → 캘린더 드롭 시 ScheduleModal 상담사·내담자 Pre-filled로 오픈
 *
 * @author Core Solution
 * @since 2025-02-25
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Draggable } from '@fullcalendar/interaction';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import { useSession } from '../../../contexts/SessionContext';
import UnifiedLoading from '../../common/UnifiedLoading';
import UnifiedScheduleComponent from '../../schedule/UnifiedScheduleComponent';
import ScheduleModal from '../../schedule/ScheduleModal';
import MappingCreationModal from '../MappingCreationModal';
import MappingPaymentModal from '../mapping/MappingPaymentModal';
import MappingDepositModal from '../mapping/MappingDepositModal';
import CheckoutSameDayModal from '../mapping/CheckoutSameDayModal';
import MappingCancelModal from './molecules/MappingCancelModal';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import ActionBarButton from '../../common/ActionBarButton';
import MappingScheduleCard from './integrated-schedule/organisms/MappingScheduleCard';
import '../../../styles/unified-design-tokens.css';
import '../AdminDashboard/AdminDashboardB0KlA.css';
import './IntegratedMatchingSchedule.css';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  NEW_DAYS,
  VIEW_FILTER_NEW,
  VIEW_FILTER_REMAINING,
  VIEW_FILTER_ALL,
  VIEW_FILTER_NEW_LABEL,
  STATUS_FILTER_OPTIONS,
  PAYMENT_TIMING_SAME_DAY_CARD,
  canScheduleForMapping,
  isOngoingMapping,
  getMappingDate
} from './constants/integratedScheduleSidebarFilterConstants';
import {
  assertExternalMappingDropAllowed,
  assertDropDateNotPast
} from '../../../utils/scheduleExternalDropGuards';
import { USER_ROLES } from '../../../constants/roles';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';
import { resolveMappingCreatedFollowUp } from './utils/sameDayCardCheckoutUtils';
import { buildMappingPaymentTimingLookup } from '../../schedule/utils/sameDayPendingEventDecorator';

// T5 표준화 2026-05-21: API 경로는 SSOT(API_ENDPOINTS) 참조

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'mg.integratedSchedule.sidebarCollapsed';
const SIDEBAR_AUTO_COLLAPSE_BREAKPOINT_PX = 1280;

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
  /** 통합 스케줄 캘린더·등록 모달: 세션 역할 전달(STAFF 등). 미로그인 시에만 ADMIN 폴백 */
  const calendarUserRole = user?.role || USER_ROLES.ADMIN;
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [preFilledMapping, setPreFilledMapping] = useState(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState(() => new Date());
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [createMappingModalOpen, setCreateMappingModalOpen] = useState(false);
  const [viewFilter, setViewFilter] = useState(VIEW_FILTER_NEW);
  const [statusFilter, setStatusFilter] = useState('ongoing');
  const [paymentModalMapping, setPaymentModalMapping] = useState(null);
  const [depositModalMapping, setDepositModalMapping] = useState(null);
  // 옵션 B (예약 우선 매칭) — 당일 카드 결제 모달 상태
  const [checkoutSameDayMapping, setCheckoutSameDayMapping] = useState(null);
  const [approveProcessing, setApproveProcessing] = useState(false);
  // R4 (옵션 B 디러티 PENDING_PAYMENT 정리) — 관리자 취소 확인 모달 대상 + 처리 중 플래그.
  const [cancelTargetMapping, setCancelTargetMapping] = useState(null);
  const [cancelPendingProcessing, setCancelPendingProcessing] = useState(false);
  const sidebarListRef = useRef(null);

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

  const loadMappings = useCallback(async() => {
    setLoading(true);
    try {
      const response = await StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.LIST);
      if (response?.mappings) {
        setMappings(response.mappings);
      } else if (Array.isArray(response)) {
        setMappings(response);
      } else {
        setMappings([]);
      }
    } catch (error) {
      console.error('매칭 목록 로드 실패:', error);
      setMappings([]);
      notificationManager.error('매칭 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  const cutoff = Date.now() - NEW_DAYS * 24 * 60 * 60 * 1000;
  let byView;
  if (viewFilter === VIEW_FILTER_NEW) {
    byView = mappings.filter((m) => {
      const created = getMappingDate(m);
      const withinDays = created >= cutoff;
      const actionNeeded =
        m.status === 'PENDING_PAYMENT' || m.status === 'DEPOSIT_PENDING';
      return withinDays || actionNeeded;
    });
  } else if (viewFilter === VIEW_FILTER_REMAINING) {
    byView = mappings.filter((m) => (m.remainingSessions ?? 0) > 0);
  } else {
    byView = mappings;
  }

  const sortedByView = [...byView].sort(
    (a, b) => getMappingDate(b) - getMappingDate(a)
  );
  let filteredMappings;
  if (statusFilter === 'ongoing') {
    filteredMappings = sortedByView.filter(isOngoingMapping);
  } else if (statusFilter) {
    filteredMappings = sortedByView.filter((m) => m.status === statusFilter);
  } else {
    filteredMappings = sortedByView;
  }

  const getStatusCount = (value) => {
    if (value === 'ongoing') return byView.filter(isOngoingMapping).length;
    if (value === '') return byView.length;
    return byView.filter((m) => m.status === value).length;
  };

  const scheduleableCount = filteredMappings.filter((m) => canScheduleForMapping(m)).length;

  useEffect(() => {
    if (!sidebarListRef.current || filteredMappings.length === 0) return;
    const draggable = new Draggable(sidebarListRef.current, {
      itemSelector: '.integrated-schedule__card.fc-event'
    });
    return () => draggable.destroy();
  }, [viewFilter, filteredMappings.length, scheduleableCount, mappings]);

  const handleDropFromExternal = (date, mappingPayload) => {
    const dateCheck = assertDropDateNotPast(date);
    if (!dateCheck.ok) {
      notificationManager.warning(dateCheck.userMessage);
      return;
    }
    const mappingCheck = assertExternalMappingDropAllowed(mappingPayload);
    if (!mappingCheck.ok) {
      if (mappingCheck.kind === 'invalid_payload') {
        notificationManager.error(mappingCheck.userMessage);
      } else {
        notificationManager.warning(mappingCheck.userMessage);
      }
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
      totalSessions: mappingPayload.totalSessions ?? null
    });
    setSelectedDateForModal(date instanceof Date ? date : new Date(date));
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
      totalSessions: mapping.totalSessions ?? null
    };
    handleDropFromExternal(new Date(), mappingPayload);
  };

  /**
   * 옵션 B SAME_DAY_CARD 사이드바 카드 액션 — "당일 결제 + 활성화" 버튼.
   * P0 핫픽스 2026-05-28 가드와 동일하게 매핑 정보 누락 시 모달 진입을 차단한다.
   */
  const handleOpenCheckoutSameDayFromCard = (mapping) => {
    if (!mapping?.consultantId || !mapping?.packageName) {
      notificationManager.warning(
        '이 매칭은 정보가 누락되어 당일 카드 결제를 진행할 수 없습니다. 매칭을 다시 생성해 주세요.'
      );
      return;
    }
    setCheckoutSameDayMapping({
      id: mapping.id,
      consultantId: mapping.consultantId,
      consultantName: mapping.consultantName,
      clientId: mapping.clientId,
      clientName: mapping.clientName,
      packageName: mapping.packageName,
      packagePrice: mapping.packagePrice ?? null,
      paymentAmount: mapping.paymentAmount ?? null,
      totalSessions: mapping.totalSessions ?? null
    });
  };

  const handleMappingCreated = (result) => {
    setCreateMappingModalOpen(false);
    loadMappings();
    // P0 핫픽스 2026-05-28 (사용자 보고): 옵션 B SAME_DAY_CARD 신규 매칭 생성 직후 CheckoutSameDayModal 자동 오픈 제거.
    // 사용자 의도: 매칭 생성 → 모달 닫힘 → 사이드바에서 직접 트리거(드래그 → 일정 생성 모달 또는 "당일 결제 + 활성화" 버튼).
    // PR #50 의 의도된 자동 진입(드래그 → 일정 생성 → handleScheduleCreated → CheckoutSameDayModal) 은 유지된다.
    const { shouldShowSameDayCardGuidance } = resolveMappingCreatedFollowUp(result);
    if (shouldShowSameDayCardGuidance) {
      notificationManager.info(
        '매칭이 생성되었습니다. 사이드바에서 일정을 예약하거나 「당일 결제 + 활성화」를 진행해 주세요.'
      );
    }
  };

  const handlePaymentConfirmed = () => {
    setPaymentModalMapping(null);
    loadMappings();
  };

  const handleDepositConfirmed = () => {
    setDepositModalMapping(null);
    loadMappings();
  };

  const handleCheckoutSameDayCompleted = () => {
    setCheckoutSameDayMapping(null);
    loadMappings();
  };

  const handleApprove = async(mappingId) => {
    if (approveProcessing) return;
    setApproveProcessing(true);
    try {
      await StandardizedApi.post(`/api/v1/admin/mappings/${mappingId}/approve`, {
        adminName: user?.name || user?.userId || '관리자'
      });
      notificationManager.success('매칭이 승인되었습니다.');
      loadMappings();
    } catch (error) {
      console.error('매칭 승인 실패:', error);
      notificationManager.error(error?.message || '매칭 승인에 실패했습니다.');
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
      notificationManager.warning('결제 대기 상태의 매칭만 취소할 수 있습니다.');
      return;
    }
    setCancelTargetMapping({
      id: mapping.id,
      consultantName: mapping.consultantName,
      clientName: mapping.clientName,
      paymentTiming: mapping.paymentTiming ?? null
    });
  }, []);

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
      notificationManager.success('매칭이 취소되었습니다.');
      setCancelTargetMapping(null);
      loadMappings();
    } catch (error) {
      console.error('매칭 취소 실패:', error);
      notificationManager.error(error?.message || '매칭 취소에 실패했습니다.');
    } finally {
      setCancelPendingProcessing(false);
    }
  }, [cancelTargetMapping, cancelPendingProcessing, loadMappings]);

  const handleScheduleModalClose = () => {
    setScheduleModalOpen(false);
    setPreFilledMapping(null);
  };

  const handleScheduleCreated = () => {
    setRefetchTrigger((t) => t + 1);
    loadMappings();
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

  const headerActions = (
    <ActionBarButton
      variant="primary"
      onClick={() => setCreateMappingModalOpen(true)}
      aria-label="신규 매칭 생성"
      className="integrated-schedule__btn-new-mapping"
    >
      신규 매칭
    </ActionBarButton>
  );

  return (
    <div className="mg-v2-ad-b0kla integrated-schedule integrated-schedule--b0kla">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="통합 스케줄링 센터">
          <ContentHeader
            title="통합 스케줄링"
            subtitle="매칭 목록과 캘린더에서 예약을 연계해 한 화면에서 관리합니다."
            actions={headerActions}
            titleId="integrated-schedule-page-title"
          />

          {/*
            옵션 B (예약 우선 매칭) PENDING_PAYMENT 알림 카드는 제거됨 (2026-05-28).
            - 카운트: 사이드바 statusFilter (`getStatusCount('PENDING_PAYMENT')`) 와 중복.
            - 필터 단축키: 사이드바 statusFilter 드롭다운으로 동일 액션 가능.
            - 빠른 결제 진입: 사이드바 카드별 "당일 결제 + 활성화" 버튼이 동일 기능 제공.
          */}

          <div className="integrated-schedule__content">
        <aside
          className={`integrated-schedule__sidebar${
            isSidebarCollapsed ? ' integrated-schedule__sidebar--collapsed' : ''
          }`}
          aria-label="매칭 목록 패널"
        >
          <div className="integrated-schedule__sidebar-header">
            <h2
              className="integrated-schedule__sidebar-title"
              id="integrated-schedule-sidebar-title"
            >
              매칭 목록
              <span
                className="integrated-schedule__sidebar-count"
                aria-label={t('integratedSchedule.sidebar.collapsedBadgeLabel', { count: filteredMappings.length })}
              >
                {filteredMappings.length}
              </span>
            </h2>
            <button
              type="button"
              className="integrated-schedule__sidebar-toggle"
              onClick={handleSidebarToggle}
              aria-expanded={!isSidebarCollapsed}
              aria-controls="integrated-schedule-sidebar-body"
              aria-label={
                isSidebarCollapsed
                  ? t('integratedSchedule.sidebar.expandAria')
                  : t('integratedSchedule.sidebar.collapseAria')
              }
              title={
                isSidebarCollapsed
                  ? t('integratedSchedule.sidebar.expandAria')
                  : t('integratedSchedule.sidebar.collapseAria')
              }
            >
              {isSidebarCollapsed ? <ChevronRight size={18} aria-hidden="true" /> : <ChevronLeft size={18} aria-hidden="true" />}
            </button>
          </div>
          <div
            id="integrated-schedule-sidebar-body"
            className="integrated-schedule__sidebar-body"
            hidden={isSidebarCollapsed}
          >
          {/* Task C: 필터 통합 후보 — MappingFilterSection + UnifiedFilterSearch(quickFilterOptions·filters 계약 정렬 시 이 블록 치환) */}
          <fieldset className="integrated-schedule__filter" aria-label="매칭 목록 보기 필터">
            <legend className="integrated-schedule__filter-legend">{t('admin.actions.view')}</legend>
            <label className={`integrated-schedule__filter-label ${viewFilter === VIEW_FILTER_NEW ? 'integrated-schedule__filter-label--selected' : ''}`}>
              <input
                type="radio"
                name="viewFilter"
                value={VIEW_FILTER_NEW}
                checked={viewFilter === VIEW_FILTER_NEW}
                onChange={() => setViewFilter(VIEW_FILTER_NEW)}
                aria-label={VIEW_FILTER_NEW_LABEL}
              />
              <span className="integrated-schedule__filter-text">{VIEW_FILTER_NEW_LABEL}</span>
            </label>
            <label className={`integrated-schedule__filter-label ${viewFilter === VIEW_FILTER_REMAINING ? 'integrated-schedule__filter-label--selected' : ''}`}>
              <input
                type="radio"
                name="viewFilter"
                value={VIEW_FILTER_REMAINING}
                checked={viewFilter === VIEW_FILTER_REMAINING}
                onChange={() => setViewFilter(VIEW_FILTER_REMAINING)}
                aria-label="회기 남은 매칭"
              />
              <span className="integrated-schedule__filter-text">회기 남은 매칭</span>
            </label>
            <label className={`integrated-schedule__filter-label ${viewFilter === VIEW_FILTER_ALL ? 'integrated-schedule__filter-label--selected' : ''}`}>
              <input
                type="radio"
                name="viewFilter"
                value={VIEW_FILTER_ALL}
                checked={viewFilter === VIEW_FILTER_ALL}
                onChange={() => setViewFilter(VIEW_FILTER_ALL)}
                aria-label={t('admin.labels.all')}
              />
              <span className="integrated-schedule__filter-text">{t('admin.labels.all')}</span>
            </label>
          </fieldset>
          <fieldset className="integrated-schedule__filter integrated-schedule__filter--status" aria-label="상태별 필터">
            <legend className="integrated-schedule__filter-legend">{t('admin.labels.status')}</legend>
            <div className="integrated-schedule__status-btns">
              {STATUS_FILTER_OPTIONS.map((opt) => {
                const count = getStatusCount(opt.value);
                const isSelected = statusFilter === opt.value;
                return (
                  <MGButton
                    key={opt.value || 'all'}
                    type="button"
                    variant="outline"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'sm',
                      loading: false,
                      className: `integrated-schedule__status-btn ${isSelected ? 'integrated-schedule__status-btn--selected' : ''}`
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => setStatusFilter(opt.value)}
                    aria-pressed={isSelected}
                    aria-label={`${toDisplayString(opt.label)} (${count}건)`}
                    preventDoubleClick={false}
                  >
                    <span className="integrated-schedule__status-btn-text">{toDisplayString(opt.label)}</span>
                    <span className="integrated-schedule__status-badge" aria-hidden="true">
                      {count}
                    </span>
                  </MGButton>
                );
              })}
            </div>
          </fieldset>
          {loading ? (
            <UnifiedLoading type="inline" text="매칭 목록 불러오는 중..." />
          ) : (
            <ul
              ref={sidebarListRef}
              className="integrated-schedule__list"
              aria-label="매칭 목록"
            >
              {(() => {
                if (filteredMappings.length === 0) {
                  let emptyMessage = '매칭이 없습니다.';
                  if (statusFilter) {
                    emptyMessage = '선택한 조건에 맞는 매칭이 없습니다.';
                  } else if (viewFilter === VIEW_FILTER_NEW) {
                    emptyMessage = `${VIEW_FILTER_NEW_LABEL}이 없습니다.`;
                  } else if (viewFilter === VIEW_FILTER_REMAINING) {
                    emptyMessage = '회기 남은 매칭이 없습니다.';
                  }
                  return (
                    <li className="integrated-schedule__empty">
                      {toDisplayString(emptyMessage)}
                    </li>
                  );
                }
                return filteredMappings.map((mapping) => {
                  const scheduleable = canScheduleForMapping(mapping);
                  // 옵션 B: paymentTiming·packageName·packagePrice·totalSessions 까지 함께 보존하여
                  // 드래그 → ScheduleModal → CheckoutSameDayModal 자동 진입 흐름에서 prefill 로 사용.
                  const eventData = {
                    id: `mapping-${mapping.id}`,
                    title: mapping.clientName || '내담자',
                    extendedProps: {
                      mappingId: mapping.id,
                      consultantId: mapping.consultantId,
                      clientId: mapping.clientId,
                      consultantName: mapping.consultantName || '상담사',
                      clientName: mapping.clientName || '내담자',
                      status: mapping.status,
                      remainingSessions: mapping.remainingSessions,
                      paymentTiming: mapping.paymentTiming ?? null,
                      packageName: mapping.packageName ?? null,
                      packagePrice: mapping.packagePrice ?? null,
                      totalSessions: mapping.totalSessions ?? null
                    }
                  };
                  return (
                    <li
                      key={mapping.id}
                      className={`integrated-schedule__card${scheduleable ? ' fc-event' : ''}`}
                      data-event={scheduleable ? JSON.stringify(eventData) : undefined}
                    >
                      <MappingScheduleCard
                        mapping={mapping}
                        eventData={eventData}
                        isDraggable={scheduleable}
                        onScheduleFromCard={
                          scheduleable
                            ? () => handleOpenScheduleFromCard(mapping)
                            : undefined
                        }
                        onPayment={setPaymentModalMapping}
                        onDeposit={setDepositModalMapping}
                        onApprove={handleApprove}
                        onCheckoutSameDay={handleOpenCheckoutSameDayFromCard}
                        onCancelPendingMapping={handleRequestCancelPendingMapping}
                        approveProcessing={approveProcessing}
                        cancelPendingProcessing={
                          cancelPendingProcessing
                          && cancelTargetMapping?.id === mapping.id
                        }
                      />
                    </li>
                  );
                });
              })()}
            </ul>
          )}
          </div>
        </aside>

        <main
          className="integrated-schedule__calendar-wrapper integrated-schedule__calendar-wrapper--integrated"
          data-layout-context="integrated-schedule"
          data-calendar-skin="integrated"
        >
          {/* 옵션 B 가예약 시각 구분 범례 — 점선 + warning 토큰 = SAME_DAY_CARD 결제 대기 가예약 */}
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
          <div className="integrated-schedule__calendar-content">
            <UnifiedScheduleComponent
              userRole={calendarUserRole}
              userId={user?.id ?? undefined}
              refetchTrigger={refetchTrigger}
              onDropFromExternal={handleDropFromExternal}
              hideScheduleTitle
              integratedMonthEventLayout
              calendarSkin="integrated"
              mappingPaymentTimingByMappingId={buildMappingPaymentTimingLookup(mappings)}
            />
          </div>
        </main>
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
          onScheduleCreateFailed={loadMappings}
          preFilledMapping={preFilledMapping}
        />
      )}

      <MappingCreationModal
        isOpen={createMappingModalOpen}
        onClose={() => setCreateMappingModalOpen(false)}
        onMappingCreated={handleMappingCreated}
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
    </div>
  );
};

export default IntegratedMatchingSchedule;
