import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon } from 'lucide-react';
import './ScheduleCalendarView.css';

/**
 * 스케줄 캘린더 뷰 컴포넌트 (Presentational)
 * - 아토믹 디자인 기반 이벤트 배지
 * - 시각적 요소(그림자, 호버 효과) 강화
 */
const ScheduleCalendarView = ({
    events,
    userRole,
    onDateClick,
    onEventClick,
    onEventDrop
}) => {
    // 지난 일정 판별 함수
    const eventClassNames = (arg) => {
        const eventDate = new Date(arg.event.start);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        
        return eventDate < today ? ['fc-event-past'] : [];
    };

    // 과거 또는 완료된 예약 여부 (디저블 스타일 적용 대상)
    const isEventPastOrCompleted = (ev) => {
        const eventStart = new Date(ev.start);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventStart.setHours(0, 0, 0, 0);
        const isPast = eventStart < today;
        const status = ev.extendedProps?.status;
        const isCompleted = status === 'COMPLETED' || status === 'CANCELLED';
        return isPast || isCompleted;
    };

    // 이벤트 커스텀 렌더링 (카드 형태)
    const renderEventContent = (eventInfo) => {
        const { event } = eventInfo;
        const { extendedProps } = event;
        const isMonthView = eventInfo.view?.type === 'dayGridMonth';
        const isPastOrCompleted = isEventPastOrCompleted(event);
        const pastClass = isPastOrCompleted ? ' mg-v2-ad-calendar-event--past' : '';
        const isCancelled = extendedProps?.status === 'CANCELLED';
        const cancelledClass = isCancelled ? ' mg-v2-ad-calendar-event--cancelled' : '';

        // 휴가 이벤트 렌더링 (월간/주간/일간 모두 기존 방식 유지)
        if (extendedProps.type === 'vacation') {
            return (
                <div className={`mg-v2-ad-calendar-event mg-v2-ad-calendar-event--vacation${pastClass}`.trim()} title={event.title}>
                    <CalendarIcon size={14} className="mg-v2-ad-calendar-event__icon" style={{ color: event.backgroundColor }} />
                    <span className="mg-v2-ad-calendar-event__client">{event.title}</span>
                </div>
            );
        }

        // 일반 스케줄 이벤트 렌더링
        const clientName = extendedProps.clientName || '이름 없음';
        const consultantName = extendedProps.consultantName || '';
        const statusKorean = extendedProps.statusKorean || '상태 없음';
        const borderColor = event.backgroundColor || 'var(--mg-primary-500)';

        // 월간 뷰: 컴팩트 렌더링 (시간 + 내담자명만)
        if (isMonthView) {
            const fullTooltip = `${clientName} · ${consultantName} · ${statusKorean}`;
            return (
                <div
                    className={`mg-v2-ad-calendar-event mg-v2-ad-calendar-event--compact${pastClass}${cancelledClass}`.trim()}
                    title={fullTooltip}
                    style={{ borderLeftColor: borderColor }}
                >
                    <span className="mg-v2-ad-calendar-event__time">{eventInfo.timeText}</span>
                    <span className="mg-v2-ad-calendar-event__client">{clientName}</span>
                    {isCancelled && (
                        <span className="mg-v2-ad-calendar-event__badge mg-v2-ad-calendar-event__badge--cancelled" aria-label="취소">취소</span>
                    )}
                </div>
            );
        }

        // 주간/일간 뷰: 풀 카드 유지
        return (
            <div
                className={`mg-v2-ad-calendar-event${pastClass}${cancelledClass}`.trim()}
                title={`${clientName} - ${statusKorean}`}
                style={{ borderLeftColor: borderColor }}
            >
                <div className="mg-v2-ad-calendar-event__time">{eventInfo.timeText}</div>
                <div className="mg-v2-ad-calendar-event__title">
                    <span className="client-name">{clientName}</span>
                    {consultantName && (
                        <span className="counselor-name">{consultantName}</span>
                    )}
                </div>
                <div className="mg-v2-ad-calendar-event__status">{statusKorean}</div>
            </div>
        );
    };

    return (
        <div className="mg-v2-schedule-calendar-view mg-v2-ad-b0kla-fc-wrapper">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView="dayGridMonth"
                defaultView="dayGridMonth"
                locale="ko"
                selectable={true}
                selectMirror={true}
                dayMaxEvents={8}
                moreLinkClick="popover"
                weekends={true}
                events={events}
                eventClassNames={eventClassNames}
                eventContent={renderEventContent}
                dateClick={onDateClick}
                eventClick={onEventClick}
                eventDrop={onEventDrop}
                editable={userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN'}
                droppable={userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN'}
                height="100%"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                scrollTime="09:00:00"
                scrollTimeReset={false}
                allDaySlot={false}
                businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5], // 월-금
                    startTime: '09:00',
                    endTime: '18:00'
                }}
                expandRows={true}
                stickyHeaderDates={true}
            />
        </div>
    );
};

export default ScheduleCalendarView;