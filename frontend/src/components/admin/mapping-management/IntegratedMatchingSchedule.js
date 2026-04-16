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

/** 스케줄 등록 가능한 매칭 상태 (입금 확인 후 스케줄 등록·드래그 허용) */
const SCHEDULABLE_STATUSES = new Set(['PAYMENT_CONFIRMED', 'DEPOSIT_PENDING', 'ACTIVE']);
const canScheduleForMapping = (mapping) =>
  mapping?.status && SCHEDULABLE_STATUSES.has(mapping.status);

/** 신규 매칭 판별: createdAt 최근 N일 이내. 운영 피드백으로 14일 등 조정 가능. */
const NEW_DAYS = 7;
/** 신규 매칭 필터 기간 표기 (NEW_DAYS 기반) */
function getNewDaysLabel(days) {
  if (days === 1) return '1일';
  if (days === 7) return '7일';
  if (days === 14) return '2주';
  if (days === 30) return '30일';
  return `${days}일`;
}
const NEW_DAYS_LABEL = getNewDaysLabel(NEW_DAYS);
const VIEW_FILTER_NEW_LABEL = `신규 매칭 (${NEW_DAYS_LABEL})`;

/** 좌측 목록 보기 필터: 신규 매칭(기본) | 회기 남은 매칭 | 전체 */
const VIEW_FILTER_NEW = 'new';
const VIEW_FILTER_REMAINING = 'remaining';
const VIEW_FILTER_ALL = 'all';

/** 매칭 정렬/신규 판별용 날짜 반환 (createdAt → assignedAt → startDate fallback) */
const getMappingDate = (m) => {
  const raw = m.createdAt ?? m.assignedAt ?? m.startDate;
  if (!raw) return 0;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

/** 신규 매칭중: 회기 소진·종료됨 제외 */
const ONGOING_EXCLUDED_STATUSES = new Set(['SESSIONS_EXHAUSTED', 'TERMINATED']);
const isOngoingMapping = (m) =>
  m?.status && !ONGOING_EXCLUDED_STATUSES.has(m.status);

/** 상태별 필터 옵션 (value: 'ongoing' = 신규 매칭중, value: '' = 전체) */
const STATUS_FILTER_OPTIONS = [
  { value: 'ongoing', label: '신규 매칭중' },
  { value: '', label: '전체' },
  { value: 'PENDING_PAYMENT', label: '결제 대기' },
  { value: 'PAYMENT_CONFIRMED', label: '결제 확인' },
  { value: 'DEPOSIT_PENDING', label: '승인 대기' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
  { value: 'TERMINATED', label: '종료됨' },
  { value: 'SESSIONS_EXHAUSTED', label: '회기 소진' },
  { value: 'SUSPENDED', label: '일시정지' }
];

const IntegratedMatchingSchedule = () => {
  const { user } = useSession();
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
    if (!mappingPayload?.consultantId || !mappingPayload?.clientId) {
      notificationManager.error('매칭 정보가 올바르지 않습니다.');
      return;
    }
    if (!canScheduleForMapping(mappingPayload)) {
      notificationManager.warning('결제가 완료된 매칭만 스케줄 등록이 가능합니다.');
      return;
    }
    // 과거 날짜 드롭 차단: 자정 기준 날짜만 비교
    const dropDate = date instanceof Date ? date : new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dropDateOnly = new Date(dropDate);
    dropDateOnly.setHours(0, 0, 0, 0);
    if (dropDateOnly.getTime() < today.getTime()) {
      notificationManager.warning('과거 날짜에는 예약할 수 없습니다.');
      return;
    }
    setPreFilledMapping({
      consultantId: mappingPayload.consultantId,
      clientId: mappingPayload.clientId,
      consultantName: mappingPayload.consultantName || '상담사',
      clientName: mappingPayload.clientName || '내담자'
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
                      {emptyMessage}
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
                      status: mapping.status
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

        <main className="integrated-schedule__calendar-wrapper integrated-schedule__calendar-wrapper--integrated" data-layout-context="integrated-schedule">
          <div className="integrated-schedule__calendar-content">
            <UnifiedScheduleComponent
              userRole="ADMIN"
              userId={user?.id ?? undefined}
              refetchTrigger={refetchTrigger}
              onDropFromExternal={handleDropFromExternal}
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
          userRole="ADMIN"
          userId={null}
          onScheduleCreated={handleScheduleCreated}
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
