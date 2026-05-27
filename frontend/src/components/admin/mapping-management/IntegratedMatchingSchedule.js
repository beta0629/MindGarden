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
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
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
import { computePendingPaymentAlert } from './utils/pendingPaymentAlertUtils';

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
    setPreFilledMapping({
      consultantId: mappingPayload.consultantId,
      clientId: mappingPayload.clientId,
      consultantName: mappingPayload.consultantName || '상담사',
      clientName: mappingPayload.clientName || '내담자',
      mappingStatus: mappingPayload.status,
      remainingSessions: mappingPayload.remainingSessions
    });
    setSelectedDateForModal(date instanceof Date ? date : new Date(date));
    setScheduleModalOpen(true);
  };

  /** 사이드바 카드 «일정 등록» — 캘린더 드래그 대신 버튼으로만 모달 진입 */
  const handleOpenScheduleFromCard = (mapping) => {
    const mappingPayload = {
      consultantId: mapping.consultantId,
      clientId: mapping.clientId,
      consultantName: mapping.consultantName,
      clientName: mapping.clientName,
      status: mapping.status,
      remainingSessions: mapping.remainingSessions
    };
    handleDropFromExternal(new Date(), mappingPayload);
  };

  const handleMappingCreated = (result) => {
    setCreateMappingModalOpen(false);
    loadMappings();
    // 옵션 B 사후 카드 분기: 생성된 PENDING_PAYMENT 매핑을 받아 CheckoutSameDayModal 자동 오픈.
    // P0 핫픽스 2026-05-28: 매핑 정보가 누락된 경우 모달 자동 진입을 차단해 NPE/표시 오류를 막는다.
    if (result && result.paymentTiming === 'SAME_DAY_CARD' && result.mappingId) {
      if (!result.consultantId || !result.packageName) {
        notificationManager.error('매칭 정보가 누락되어 결제 모달을 열 수 없습니다.');
        return;
      }
      setCheckoutSameDayMapping({
        id: result.mappingId,
        consultantId: result.consultantId,
        consultantName: result.consultantName,
        clientId: result.clientId,
        clientName: result.clientName,
        packageName: result.packageName,
        packagePrice: result.packagePrice ?? null,
        totalSessions: result.totalSessions ?? null
      });
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

  const handleScheduleModalClose = () => {
    setScheduleModalOpen(false);
    setPreFilledMapping(null);
  };

  const handleScheduleCreated = () => {
    setRefetchTrigger((t) => t + 1);
    loadMappings();
    setScheduleModalOpen(false);
    setPreFilledMapping(null);
  };

  const headerActions = (
    <MGButton
      variant="primary"
      size="medium"
      className={buildErpMgButtonClassName({
        variant: 'primary',
        className: 'integrated-schedule__btn-new-mapping'
      })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={() => setCreateMappingModalOpen(true)}
      aria-label="신규 매칭 생성"
      preventDoubleClick={false}
    >
      신규 매칭
    </MGButton>
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

          {/* 옵션 B (예약 우선 매칭) — PENDING_PAYMENT 알림 카드 */}
          {(() => {
            const { visible, count: pendingPaymentCount, firstPending } =
              computePendingPaymentAlert(mappings);
            if (!visible) {
              return null;
            }
            return (
              <div
                className="integrated-schedule__pending-payment-alert"
                role="status"
                aria-live="polite"
                data-testid="integrated-schedule-pending-payment-alert"
              >
                <div className="integrated-schedule__pending-payment-alert-text">
                  <strong className="integrated-schedule__pending-payment-alert-title">
                    {t('admin:mapping.integrated.pendingPayment.alert.title')}
                  </strong>
                  <span className="integrated-schedule__pending-payment-alert-count">
                    {t('admin:mapping.integrated.pendingPayment.alert.count', { count: pendingPaymentCount })}
                  </span>
                </div>
                <div className="integrated-schedule__pending-payment-alert-actions">
                  <MGButton
                    type="button"
                    variant="secondary"
                    size="small"
                    className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm' })}
                    onClick={() => setStatusFilter('PENDING_PAYMENT')}
                    preventDoubleClick={false}
                  >
                    {t('admin:mapping.integrated.pendingPayment.alert.action')}
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="primary"
                    size="small"
                    className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm' })}
                    onClick={() => {
                      // P0 핫픽스 2026-05-28: PENDING_PAYMENT 매핑이라도
                      // consultantId/packageName 이 누락되면 결제 모달 진입을 차단.
                      if (!firstPending?.consultantId || !firstPending?.packageName) {
                        notificationManager.warning('이 매칭은 정보가 누락되어 당일 카드 결제를 진행할 수 없습니다. 매칭을 다시 생성해 주세요.');
                        return;
                      }
                      setCheckoutSameDayMapping(firstPending);
                    }}
                    preventDoubleClick={false}
                  >
                    {t('admin:mapping.integrated.pendingPayment.alert.checkoutSameDay')}
                  </MGButton>
                </div>
              </div>
            );
          })()}

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
                      remainingSessions: mapping.remainingSessions
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
                        approveProcessing={approveProcessing}
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
          <div className="integrated-schedule__calendar-content">
            <UnifiedScheduleComponent
              userRole={calendarUserRole}
              userId={user?.id ?? undefined}
              refetchTrigger={refetchTrigger}
              onDropFromExternal={handleDropFromExternal}
              hideScheduleTitle
              integratedMonthEventLayout
              calendarSkin="integrated"
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
    </div>
  );
};

export default IntegratedMatchingSchedule;
