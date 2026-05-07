/**
 * IntegratedMatchingSchedule - 매칭·스케줄 통합 원스톱 화면
 * 좌: 매칭 목록(실 API /api/v1/admin/mappings), 우: 스케줄 캘린더(실 API)
 * 카드 드래그 → 캘린더 드롭 시 ScheduleModal 상담사·내담자 Pre-filled로 오픈
 *
 * @author Core Solution
 * @since 2025-02-25
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const IntegratedMatchingSchedule = () => {
  const { user } = useSession();
  /** 통합 스케줄 캘린더·등록 모달: 세션 역할 전달(STAFF 등). 미로그인 시에만 ADMIN 폴백 */
  const calendarUserRole = user?.role || 'ADMIN';
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
  const [approveProcessing, setApproveProcessing] = useState(false);
  const sidebarListRef = useRef(null);

  const loadMappings = useCallback(async() => {
    setLoading(true);
    try {
      const response = await StandardizedApi.get('/api/v1/admin/mappings');
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

  /** 스케줄 가능(드래그 가능) 카드 수 — 결제/입금/승인 후 목록 갱신 시 Draggable 재바인딩 */
  const scheduleableCount = filteredMappings.filter((m) => canScheduleForMapping(m)).length;

  useEffect(() => {
    if (!sidebarListRef.current || filteredMappings.length === 0) return;
    const draggable = new Draggable(sidebarListRef.current, {
      itemSelector: '.integrated-schedule__card.fc-event'
    });
    return () => draggable.destroy();
  }, [viewFilter, filteredMappings.length, scheduleableCount, mappings]);

  const handleDropFromExternal = (date, mappingPayload) => {
    const mappingCheck = assertExternalMappingDropAllowed(mappingPayload);
    if (!mappingCheck.ok) {
      if (mappingCheck.kind === 'invalid_payload') {
        notificationManager.error(mappingCheck.userMessage);
      } else {
        notificationManager.warning(mappingCheck.userMessage);
      }
      return;
    }
    const dateCheck = assertDropDateNotPast(date);
    if (!dateCheck.ok) {
      notificationManager.warning(dateCheck.userMessage);
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

  const handleMappingCreated = () => {
    setCreateMappingModalOpen(false);
    loadMappings();
  };

  const handlePaymentConfirmed = () => {
    setPaymentModalMapping(null);
    loadMappings();
  };

  const handleDepositConfirmed = () => {
    setDepositModalMapping(null);
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

          <div className="integrated-schedule__content">
        <aside className="integrated-schedule__sidebar">
          <h2 className="integrated-schedule__sidebar-title">매칭 목록</h2>
          {/* Task C: 필터 통합 후보 — MappingFilterSection + UnifiedFilterSearch(quickFilterOptions·filters 계약 정렬 시 이 블록 치환) */}
          <fieldset className="integrated-schedule__filter" aria-label="매칭 목록 보기 필터">
            <legend className="integrated-schedule__filter-legend">보기</legend>
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
                aria-label="전체"
              />
              <span className="integrated-schedule__filter-text">전체</span>
            </label>
          </fieldset>
          <fieldset className="integrated-schedule__filter integrated-schedule__filter--status" aria-label="상태별 필터">
            <legend className="integrated-schedule__filter-legend">상태</legend>
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
                      className={`integrated-schedule__card ${canScheduleForMapping(mapping) ? 'fc-event' : ''}`}
                      data-event={canScheduleForMapping(mapping) ? JSON.stringify(eventData) : undefined}
                    >
                      <MappingScheduleCard
                        mapping={mapping}
                        eventData={eventData}
                        isDraggable={canScheduleForMapping(mapping)}
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
    </div>
  );
};

export default IntegratedMatchingSchedule;
