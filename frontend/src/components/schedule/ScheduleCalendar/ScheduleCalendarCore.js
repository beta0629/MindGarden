import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

/**
 * FullCalendar 래퍼 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ScheduleCalendarCore = ({
    events,
    onDateClick,
    onEventClick,
    onEventDrop,
    isMobile,
    forceMobileMode
}) => {
    const calendarRef = React.useRef(null);

    // 모바일 환경에서 달력 설정 조정
    const getCalendarConfig = () => {
        const baseConfig = {
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: isMobile ? 'dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: events,
            editable: true,
            droppable: true,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            weekends: true,
            locale: 'ko',
            height: 'auto',
            aspectRatio: isMobile ? 1.5 : 1.8,
            eventClick: onEventClick,
            dateClick: onDateClick,
            eventDrop: onEventDrop,
            eventResize: onEventDrop,
            eventClassNames: (arg) => {
                const classes = ['mg-v2-calendar-event'];
                if (arg.event.extendedProps?.status) {
                    classes.push(`mg-v2-event-status-${arg.event.extendedProps.status.toLowerCase()}`);
                }
                return classes;
            },
            dayHeaderClassNames: 'mg-v2-calendar-day-header',
            dayCellClassNames: 'mg-v2-calendar-day-cell',
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            buttonText: {
                today: '오늘',
                month: '월',
                week: '주',
                day: '일'
            },
            allDayText: '종일',
            moreLinkText: '더보기',
            noEventsText: '일정이 없습니다'
        };

        // 모바일 환경에서 추가 설정
        if (isMobile) {
            baseConfig.dayMaxEvents = 3;
            baseConfig.moreLinkClick = 'popover';
            baseConfig.eventDisplay = 'block';
        }

        return baseConfig;
    };

    return (
        <div className={`mg-v2-calendar-container ${isMobile ? 'mg-v2-calendar-mobile' : ''}`}>
            <FullCalendar
                ref={calendarRef}
                {...getCalendarConfig()}
            />
        </div>
    );
};

export default ScheduleCalendarCore;
