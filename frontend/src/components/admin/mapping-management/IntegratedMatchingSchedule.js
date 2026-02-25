/**
 * IntegratedMatchingSchedule - 매칭·스케줄 통합 원스톱 화면
 * 좌: 매칭 목록(실 API /api/v1/admin/mappings), 우: 스케줄 캘린더(실 API)
 * "스케줄 등록" 클릭 시 ScheduleModal을 상담사·내담자 Pre-filled로 오픈
 *
 * @author MindGarden
 * @since 2025-02-25
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { CalendarPlus, UserPlus, CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import { useSession } from '../../../contexts/SessionContext';
import UnifiedLoading from '../../common/UnifiedLoading';
import UnifiedScheduleComponent from '../../schedule/UnifiedScheduleComponent';
import ScheduleModal from '../../schedule/ScheduleModal';
import MappingCreationModal from '../MappingCreationModal';
import MappingPaymentModal from '../mapping/MappingPaymentModal';
import MappingDepositModal from '../mapping/MappingDepositModal';
import '../../../styles/unified-design-tokens.css';
import '../AdminDashboard/AdminDashboardB0KlA.css';
import './IntegratedMatchingSchedule.css';

const STATUS_KO = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  PENDING_PAYMENT: '결제 대기',
  PAYMENT_CONFIRMED: '결제 확인',
  DEPOSIT_PENDING: '승인 대기',
  TERMINATED: '종료됨',
  SESSIONS_EXHAUSTED: '회기 소진',
  SUSPENDED: '일시정지'
};

const getStatusKoreanName = (status) => STATUS_KO[status] || status;

/** 스케줄 등록 가능한 매칭 상태 (입금 확인 후 스케줄 등록·드래그 허용) */
const SCHEDULABLE_STATUSES = new Set(['PAYMENT_CONFIRMED', 'DEPOSIT_PENDING', 'ACTIVE']);
const canScheduleForMapping = (mapping) =>
  mapping?.status && SCHEDULABLE_STATUSES.has(mapping.status);

/** 좌측 목록 필터: 회기 남은 매칭만(기본) | 전체 */
const SESSION_FILTER_REMAINING = 'remaining';
const SESSION_FILTER_ALL = 'all';

const IntegratedMatchingSchedule = () => {
  const { user } = useSession();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [preFilledMapping, setPreFilledMapping] = useState(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState(() => new Date());
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [createMappingModalOpen, setCreateMappingModalOpen] = useState(false);
  const [sessionFilter, setSessionFilter] = useState(SESSION_FILTER_REMAINING);
  const [paymentModalMapping, setPaymentModalMapping] = useState(null);
  const [depositModalMapping, setDepositModalMapping] = useState(null);
  const [approveProcessing, setApproveProcessing] = useState(false);
  const sidebarListRef = useRef(null);

  const loadMappings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await StandardizedApi.get('/api/v1/admin/mappings');
      if (response && response.mappings) {
        setMappings(response.mappings);
      } else if (response && Array.isArray(response)) {
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

  const filteredMappings =
    sessionFilter === SESSION_FILTER_REMAINING
      ? mappings.filter((m) => (m.remainingSessions ?? 0) > 0)
      : mappings;

  /** 스케줄 가능(드래그 가능) 카드 수 — 결제/입금/승인 후 목록 갱신 시 Draggable 재바인딩 */
  const scheduleableCount = filteredMappings.filter((m) => canScheduleForMapping(m)).length;

  useEffect(() => {
    if (!sidebarListRef.current || filteredMappings.length === 0) return;
    const draggable = new Draggable(sidebarListRef.current, {
      itemSelector: '.integrated-schedule__card.fc-event'
    });
    return () => draggable.destroy();
  }, [sessionFilter, filteredMappings.length, scheduleableCount]);

  const handleScheduleRegister = (mapping) => {
    if (!canScheduleForMapping(mapping)) {
      notificationManager.warning('결제가 완료된 매칭만 스케줄 등록이 가능합니다.');
      return;
    }
    if (!mapping.consultantId || !mapping.clientId) {
      notificationManager.error('상담사·내담자 정보가 없는 매칭입니다.');
      return;
    }
    setPreFilledMapping({
      consultantId: mapping.consultantId,
      clientId: mapping.clientId,
      consultantName: mapping.consultantName || '상담사',
      clientName: mapping.clientName || '내담자'
    });
    setSelectedDateForModal(new Date());
    setScheduleModalOpen(true);
  };

  const handleDropFromExternal = (date, mappingPayload) => {
    if (!mappingPayload || !mappingPayload.consultantId || !mappingPayload.clientId) {
      notificationManager.error('매칭 정보가 올바르지 않습니다.');
      return;
    }
    if (!canScheduleForMapping(mappingPayload)) {
      notificationManager.warning('결제가 완료된 매칭만 스케줄 등록이 가능합니다.');
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

  const handleApprove = async (mappingId) => {
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

  return (
    <div className="integrated-schedule">
      <header className="integrated-schedule__header">
        <h1 className="integrated-schedule__title">통합 스케줄링 센터</h1>
        <button
          type="button"
          className="integrated-schedule__btn-new-mapping"
          onClick={() => setCreateMappingModalOpen(true)}
          aria-label="신규 매칭 생성"
        >
          <UserPlus size={18} />
          신규 매칭
        </button>
      </header>

      <div className="integrated-schedule__content">
        <aside className="integrated-schedule__sidebar">
          <h2 className="integrated-schedule__sidebar-title">매칭 목록</h2>
          <fieldset className="integrated-schedule__filter" aria-label="매칭 목록 필터">
            <label className={`integrated-schedule__filter-label ${sessionFilter === SESSION_FILTER_REMAINING ? 'integrated-schedule__filter-label--selected' : ''}`}>
              <input
                type="radio"
                name="sessionFilter"
                value={SESSION_FILTER_REMAINING}
                checked={sessionFilter === SESSION_FILTER_REMAINING}
                onChange={() => setSessionFilter(SESSION_FILTER_REMAINING)}
                aria-label="회기 남은 매칭만"
              />
              <span className="integrated-schedule__filter-text">회기 남은 매칭만</span>
            </label>
            <label className={`integrated-schedule__filter-label ${sessionFilter === SESSION_FILTER_ALL ? 'integrated-schedule__filter-label--selected' : ''}`}>
              <input
                type="radio"
                name="sessionFilter"
                value={SESSION_FILTER_ALL}
                checked={sessionFilter === SESSION_FILTER_ALL}
                onChange={() => setSessionFilter(SESSION_FILTER_ALL)}
                aria-label="전체"
              />
              <span className="integrated-schedule__filter-text">전체</span>
            </label>
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
                  return (
                    <li className="integrated-schedule__empty">
                      {sessionFilter === SESSION_FILTER_REMAINING
                        ? '회기 남은 매칭이 없습니다.'
                        : '매칭이 없습니다.'}
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
                      <div className="integrated-schedule__card-body">
                        <div className="integrated-schedule__card-parties">
                          <span className="integrated-schedule__card-consultant">
                            {mapping.consultantName || 'N/A'}
                          </span>
                          <span className="integrated-schedule__card-arrow">→</span>
                          <span className="integrated-schedule__card-client">
                            {mapping.clientName || 'N/A'}
                          </span>
                        </div>
                        <div className="integrated-schedule__card-meta">
                          <span className={`integrated-schedule__card-status integrated-schedule__card-status--${(mapping.status || '').toLowerCase()}`}>
                            {getStatusKoreanName(mapping.status)}
                          </span>
                          {mapping.remainingSessions != null && mapping.remainingSessions >= 0 && (
                            <span className="integrated-schedule__card-remaining integrated-schedule__card-remaining-badge">
                              {mapping.remainingSessions}회 남음
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="integrated-schedule__card-actions">
                        {mapping.status === 'PENDING_PAYMENT' && (
                          <button
                            type="button"
                            className="integrated-schedule__btn-action integrated-schedule__btn-action--payment"
                            onClick={() => setPaymentModalMapping(mapping)}
                            aria-label="결제 확인"
                          >
                            <CreditCard size={14} />
                            결제 확인
                          </button>
                        )}
                        {mapping.status === 'PAYMENT_CONFIRMED' && (
                          <button
                            type="button"
                            className="integrated-schedule__btn-action integrated-schedule__btn-action--deposit"
                            onClick={() => setDepositModalMapping(mapping)}
                            aria-label="입금 확인"
                          >
                            <DollarSign size={14} />
                            입금 확인
                          </button>
                        )}
                        {mapping.status === 'DEPOSIT_PENDING' && (
                          <button
                            type="button"
                            className="integrated-schedule__btn-action integrated-schedule__btn-action--approve"
                            onClick={() => handleApprove(mapping.id)}
                            disabled={approveProcessing}
                            aria-label="승인"
                          >
                            <CheckCircle size={14} />
                            승인
                          </button>
                        )}
                        <button
                          type="button"
                          className={`integrated-schedule__btn-schedule ${canScheduleForMapping(mapping) ? '' : 'integrated-schedule__btn-schedule--disabled'}`}
                          onClick={() => handleScheduleRegister(mapping)}
                          disabled={!canScheduleForMapping(mapping)}
                          aria-label={canScheduleForMapping(mapping) ? `${mapping.clientName} 스케줄 등록` : '결제 완료 후 스케줄 등록 가능'}
                          title={canScheduleForMapping(mapping) ? undefined : '결제가 완료된 매칭만 스케줄 등록이 가능합니다.'}
                        >
                          <CalendarPlus size={14} />
                          스케줄 등록
                        </button>
                      </div>
                    </li>
                  );
                });
              })()}
            </ul>
          )}
        </aside>

        <main className="integrated-schedule__calendar-wrapper">
          <UnifiedScheduleComponent
            userRole="ADMIN"
            refetchTrigger={refetchTrigger}
            onDropFromExternal={handleDropFromExternal}
          />
        </main>
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
