import React, { useEffect, useState, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { useMatchingScheduleStore } from '../../../store/useMatchingScheduleStore';
import UnifiedModal from '../../common/modals/UnifiedModal';
import './IntegratedMatchingSchedule.css';

const IntegratedMatchingSchedule = () => {
  const { waitingList, calendarEvents, fetchInitialData, moveToCalendar, confirmEvent, rollbackEvent } = useMatchingScheduleStore();
  const waitingListRef = useRef(null);
  const draggableRef = useRef(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    // 초기 Mock 데이터 로드
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    // FullCalendar 외부 요소 드래그 설정
    if (waitingListRef.current) {
      draggableRef.current = new Draggable(waitingListRef.current, {
        itemSelector: '.integrated-schedule__item',
        eventData: function(eventEl) {
          return {
            id: 'temp-' + Date.now(),
            title: eventEl.dataset.name + ' - ' + eventEl.dataset.type,
            extendedProps: {
              waitingId: eventEl.dataset.id,
              name: eventEl.dataset.name,
              type: eventEl.dataset.type
            },
            create: true // Allows eventReceive to fire
          };
        }
      });
    }

    return () => {
      if (draggableRef.current) {
        draggableRef.current.destroy();
      }
    };
  }, [waitingList]);

  // 드롭 이벤트 수신 시 (외부 리스트 -> 캘린더)
  const handleEventReceive = (info) => {
    const { event } = info;
    const { waitingId, name, type } = event.extendedProps;
    
    const tempEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      extendedProps: { waitingId, name, type }
    };

    // 1. 낙관적 업데이트로 Zustand Store에 이벤트 추가 및 대기자 목록에서 제거
    moveToCalendar(waitingId, tempEvent);

    // 2. 모달에 띄울 정보 세팅
    setSelectedEvent(tempEvent);
    setModalOpen(true);
    
    // 이벤트 자체는 상태 관리를 통해 렌더링되므로 FullCalendar에서 임시로 생성된 이벤트 제거
    event.remove();
  };

  const handleModalSave = () => {
    if (!selectedEvent) return;
    
    // API 호출을 가정 (Mocking)
    const confirmedEvent = {
      ...selectedEvent,
      id: 'confirmed-' + Date.now(), // 실제 DB ID로 교체됨
    };
    
    confirmEvent(selectedEvent.id, confirmedEvent);
    setModalOpen(false);
    setSelectedEvent(null);
  };

  const handleModalCancel = () => {
    if (!selectedEvent) return;
    
    // 취소 시 롤백 처리
    const originalItem = {
      id: selectedEvent.extendedProps.waitingId,
      name: selectedEvent.extendedProps.name,
      type: selectedEvent.extendedProps.type,
      preferredTime: '드롭 취소됨',
      status: 'WAITING'
    };
    
    rollbackEvent(selectedEvent.id, originalItem);
    setModalOpen(false);
    setSelectedEvent(null);
  };

  // 성능 최적화: 캘린더에 주입할 이벤트를 useMemo로 캐싱
  const memoizedEvents = useMemo(() => calendarEvents, [calendarEvents]);

  return (
    <div className="integrated-schedule">
      <div className="integrated-schedule__header">
        <h1 className="integrated-schedule__title">통합 스케줄링 센터</h1>
        <button className="mg-btn mg-btn--primary mg-btn--medium">
          + 신규 내담자 등록
        </button>
      </div>

      <div className="integrated-schedule__content">
        {/* 좌측 대기자 목록 */}
        <div className="integrated-schedule__sidebar">
          <div className="integrated-schedule__sidebar-title">스케줄 대기 목록</div>
          <div className="integrated-schedule__list" ref={waitingListRef}>
            {waitingList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--mg-color-text-sub)' }}>
                대기자가 없습니다.
              </div>
            ) : (
              waitingList.map(item => (
                <div 
                  key={item.id} 
                  className="integrated-schedule__item"
                  data-id={item.id}
                  data-name={item.name}
                  data-type={item.type}
                >
                  <div className="integrated-schedule__item-name">{item.name}</div>
                  <div className="integrated-schedule__item-type">{item.type}</div>
                  <div className="integrated-schedule__item-badge">{item.preferredTime}</div>
                </div>
              ))
            )}
          </div>
          {/* TODO: 1024px 이하 해상도 모바일/태블릿에서는 이 sidebar를 숨기고 하단 드로어로 우회하는 UI 추가 구현 필요 */}
        </div>

        {/* 우측 캘린더 */}
        <div className="integrated-schedule__calendar-container">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridDay,timeGridWeek'
            }}
            slotMinTime="09:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            droppable={true}
            editable={true}
            events={memoizedEvents}
            eventReceive={handleEventReceive}
            height="100%"
          />
        </div>
      </div>

      {/* 스케줄 확인/저장 모달 */}
      <UnifiedModal
        isOpen={modalOpen}
        onClose={handleModalCancel}
        title="스케줄 배정 확인"
        subtitle="선택한 빈 시간에 대기자를 배정합니다."
        size="medium"
        actions={
          <>
            <button className="mg-btn mg-btn--secondary mg-btn--medium" onClick={handleModalCancel}>
              취소
            </button>
            <button className="mg-btn mg-btn--primary mg-btn--medium" onClick={handleModalSave}>
              배정 저장
            </button>
          </>
        }
      >
        {selectedEvent && (
          <div className="modal-form">
            <div className="modal-form-group">
              <label className="modal-form-label" htmlFor="schedule-client-name">내담자</label>
              <input 
                id="schedule-client-name"
                className="modal-form-input" 
                value={selectedEvent.extendedProps.name} 
                readOnly 
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-form-label" htmlFor="schedule-client-type">상담 종류</label>
              <input 
                id="schedule-client-type"
                className="modal-form-input" 
                value={selectedEvent.extendedProps.type} 
                readOnly 
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-form-label" htmlFor="schedule-start-time">시작 시간</label>
              <input 
                id="schedule-start-time"
                className="modal-form-input" 
                value={new Date(selectedEvent.start).toLocaleString()} 
                readOnly 
              />
            </div>
          </div>
        )}
      </UnifiedModal>
    </div>
  );
};

export default IntegratedMatchingSchedule;
