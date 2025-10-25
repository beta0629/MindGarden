import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

/**
 * 스케줄 캘린더 뷰 컴포넌트 (Presentational)
 * - 순수 UI 컴포넌트
 * - FullCalendar 렌더링만 담당
 * - 비즈니스 로직 없음
 * - props로 데이터와 핸들러를 받음
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

    return (
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
            dayMaxEvents={true}
            weekends={true}
            events={events}
            eventClassNames={eventClassNames}
            dateClick={onDateClick}
            eventClick={onEventClick}
            eventDrop={onEventDrop}
            editable={userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN'}
            droppable={userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN'}
            height="auto"
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
            eventDisplay="block"
            displayEventTime={true}
            displayEventEnd={true}
        />
    );
};

export default ScheduleCalendarView;

