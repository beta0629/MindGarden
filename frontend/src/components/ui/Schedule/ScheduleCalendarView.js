import { useCallback, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, AlertCircle, Info } from 'lucide-react';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
  CALENDAR_EXTENDED_TYPE_VACATION,
  CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD,
  CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD,
  SCHEDULE_REMAINING_SESSIONS_FIELD,
  SCHEDULE_SESSION_SEQUENCE_FIELD,
  SCHEDULE_TOTAL_SESSIONS_FIELD,
  STATUS,
  resolveCalendarSessionLabel,
  parseClientScheduleNotesClientWideUnresolvedCount,
  parseClientScheduleNotesUnresolvedCount
} from '../../../constants/schedule';
import {
  getKrPublicHolidayNameForLocalDate,
  getKrSubstituteHolidayEveHintForLocalDate
} from '../../../utils/krPublicHolidays';
import { USER_ROLES } from '../../../constants/roles';
import './ScheduleCalendarView.css';

const KR_PUBLIC_HOLIDAY_DAY_BADGE_CLASS = 'mg-v2-ad-calendar-day-holiday-badge';
const KR_SUBSTITUTE_EVE_DAY_BADGE_CLASS = 'mg-v2-ad-calendar-day-substitute-eve-badge';
const SUBSTITUTE_EVE_DAY_CELL_CLASS = 'mg-v2-ad-calendar-day--kr-substitute-eve';
const WEEKEND_SAT_DAY_CELL_CLASS = 'mg-v2-ad-calendar-day--weekend-sat';
const WEEKEND_SUN_DAY_CELL_CLASS = 'mg-v2-ad-calendar-day--weekend-sun';

/** 통합 스케줄 외부 카드 드롭 등 «신규 생성» UX — 관리자형만 */
const SCHEDULE_DROP_ADMIN_ROLES = new Set([
    USER_ROLES.ADMIN,
    USER_ROLES.STAFF,
    'BRANCH_SUPER_ADMIN'
]);

const isScheduleDropAdminRole = (role) => !!role && SCHEDULE_DROP_ADMIN_ROLES.has(role);

/** 기존 일정 드래그 이동·변경 — 상담사 또는 관리자형 */
const isScheduleCalendarEditableRole = (role) =>
    role === USER_ROLES.CONSULTANT || isScheduleDropAdminRole(role);

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
    onEventDrop,
    onExternalEventReceive,
    integratedMonthEventLayout = false,
    calendarSkin,
    /** 통합 스케줄(사이드바→캘린더)만: 기존 일정 블록 드래그 이동 비활성화, 외부 드롭은 유지 */
    disableCalendarEventDrag = false,
    /** false면 FullCalendar 외부 드롭(사이드바 카드 등) 비활성 */
    acceptExternalCalendarDrops = true
}) => {
    const calendarRef = useRef(null);
    const calendarWrapperRef = useRef(null);

    const updateCalendarSize = useCallback(() => {
        const calendarApi = calendarRef.current?.getApi?.();
        if (!calendarApi) {
            return;
        }

        requestAnimationFrame(() => {
            calendarApi.updateSize();
        });
    }, []);

    useEffect(() => {
        updateCalendarSize();
    }, [updateCalendarSize, events.length]);

    useEffect(() => {
        const handleWindowResize = () => {
            updateCalendarSize();
        };

        window.addEventListener('resize', handleWindowResize);

        const resizeObserver = new ResizeObserver(() => {
            updateCalendarSize();
        });

        if (calendarWrapperRef.current) {
            resizeObserver.observe(calendarWrapperRef.current);
        }

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            resizeObserver.disconnect();
        };
    }, [updateCalendarSize]);

    /**
     * 로컬 날짜가 KR 공휴일 표에 있으면 셀에 표식.
     * 통합 스킨일 때만 익일「대체」공휴일 전날 클래스(배지·스타일 정합).
     */
    const dayCellClassNamesForKrHoliday = useCallback((arg) => {
      const list = [];
      const holidayName = getKrPublicHolidayNameForLocalDate(arg.date);
      if (holidayName) {
        list.push('mg-v2-ad-calendar-day--kr-public-holiday');
      }
      if (calendarSkin === 'integrated') {
        if (getKrSubstituteHolidayEveHintForLocalDate(arg.date)) {
          list.push(SUBSTITUTE_EVE_DAY_CELL_CLASS);
        }
        if (arg.view?.type === 'dayGridMonth' && !holidayName) {
          const dow = arg.date.getDay();
          if (dow === 6) {
            list.push(WEEKEND_SAT_DAY_CELL_CLASS);
          }
          if (dow === 0) {
            list.push(WEEKEND_SUN_DAY_CELL_CLASS);
          }
        }
      }
      return list;
    }, [calendarSkin]);

    /**
     * 월간 뷰: 배경 이벤트에는 제목이 안 그려져 공휴일명 배지 주입(FC dayCell 훅).
     * frame 말단+absolute는 day-events/bg보다 아래에 깔리거나 스크롤에 묻히므로 day-top(일자 아래)에 배치.
     */
    const handleDayCellDidMount = useCallback((info) => {
        if (info.view?.type !== 'dayGridMonth') {
            return;
        }
        const dayTop = info.el.querySelector('.fc-daygrid-day-top');
        if (!dayTop) {
            return;
        }
        const isIntegrated = calendarSkin === 'integrated';
        const holidayName = getKrPublicHolidayNameForLocalDate(info.date);
        const eveHint = isIntegrated ? getKrSubstituteHolidayEveHintForLocalDate(info.date) : null;

        if (holidayName && !dayTop.querySelector(`.${KR_PUBLIC_HOLIDAY_DAY_BADGE_CLASS}`)) {
            const badge = document.createElement('div');
            badge.className = KR_PUBLIC_HOLIDAY_DAY_BADGE_CLASS;
            const nameSpan = document.createElement('span');
            nameSpan.className = 'mg-v2-ad-calendar-day-holiday-badge__name';
            const safeName = toDisplayString(holidayName, '');
            nameSpan.textContent = safeName;
            badge.appendChild(nameSpan);
            if (eveHint) {
                const hintSpan = document.createElement('span');
                hintSpan.className = 'mg-v2-ad-calendar-day-holiday-badge__eve-hint';
                hintSpan.textContent = toDisplayString(eveHint.hintLine, '');
                badge.appendChild(hintSpan);
                badge.title =
                    `${toDisplayString(eveHint.hintLine, '')} (${toDisplayString(eveHint.nextHolidayName, '')})`;
            } else {
                badge.title = safeName;
            }
            dayTop.appendChild(badge);
            return;
        }

        if (!holidayName && eveHint && !dayTop.querySelector(`.${KR_SUBSTITUTE_EVE_DAY_BADGE_CLASS}`)) {
            const eveBadge = document.createElement('div');
            eveBadge.className = KR_SUBSTITUTE_EVE_DAY_BADGE_CLASS;
            eveBadge.textContent = toDisplayString(eveHint.hintLine, '');
            eveBadge.title =
                `${toDisplayString(eveHint.hintLine, '')} (${toDisplayString(eveHint.nextHolidayName, '')})`;
            dayTop.appendChild(eveBadge);
        }
    }, [calendarSkin]);

    const handleDayCellWillUnmount = useCallback((info) => {
        info.el.querySelector(`.${KR_PUBLIC_HOLIDAY_DAY_BADGE_CLASS}`)?.remove();
        info.el.querySelector(`.${KR_SUBSTITUTE_EVE_DAY_BADGE_CLASS}`)?.remove();
    }, []);

    // 지난 일정 판별 함수
    const eventClassNames = (arg) => {
        if (arg.event.display === 'background') {
            if (arg.event.extendedProps?.type === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY) {
                return ['mg-v2-ad-calendar-event--kr-public-holiday-bg'];
            }
            return [];
        }
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

    /**
     * 외부 카드 드롭 수신: FullCalendar는 날짜·페이로드 전달만 한다.
     * onExternalEventReceive 쪽 비즈니스 검증(매칭·회기 등)은 부모·통합 화면 책임이다.
     */
    const handleEventReceive = (info) => {
        if (onExternalEventReceive && info.event) {
            const date = info.event.start;
            const payload = info.event.extendedProps || {};
            onExternalEventReceive(date, payload);
            info.event.remove();
        }
    };

    const handleEventDidMount = (info) => {
        if (info.event.extendedProps?.type === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY) {
            info.el.setAttribute('aria-hidden', 'true');
            info.el.setAttribute('tabIndex', '-1');
        }
    };

    // 이벤트 커스텀 렌더링 (카드 형태)
    const renderEventContent = (eventInfo) => {
        const { event } = eventInfo;
        if (event.display === 'background') {
            return null;
        }
        const { extendedProps } = event;
        const isMonthView = eventInfo.view?.type === 'dayGridMonth';
        const isPastOrCompleted = isEventPastOrCompleted(event);
        const pastClass = isPastOrCompleted ? ' mg-v2-ad-calendar-event--past' : '';
        const eventStart = new Date(event.start);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventStart.setHours(0, 0, 0, 0);
        const isPastDate = eventStart < today;
        const isCancelled = extendedProps?.status === 'CANCELLED';
        const cancelledClass = isCancelled ? ' mg-v2-ad-calendar-event--cancelled' : '';

        // 휴가 이벤트 렌더링 (월간/주간/일간 모두 기존 방식 유지)
        if (extendedProps.type === CALENDAR_EXTENDED_TYPE_VACATION) {
            const vacTitle = toDisplayString(event.title, '휴무');
            return (
                <div className={`mg-v2-ad-calendar-event mg-v2-ad-calendar-event--vacation${pastClass}`.trim()} title={vacTitle}>
                    <CalendarIcon size={14} className="mg-v2-ad-calendar-event__icon" style={{ color: event.backgroundColor }} />
                    <span className="mg-v2-ad-calendar-event__client">{vacTitle}</span>
                </div>
            );
        }

        // 일반 스케줄 이벤트 렌더링
        const clientName = toDisplayString(extendedProps.clientName, '이름 없음');
        const consultantName = toDisplayString(extendedProps.consultantName, '');
        const statusKorean = toDisplayString(extendedProps.statusKorean, '상태 없음');
        const borderColor = event.backgroundColor || 'var(--mg-primary-500)';
        const scheduleNotesUnresolvedCount = parseClientScheduleNotesUnresolvedCount(
            extendedProps?.[CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD]
        );
        const clientWideNotesUnresolvedCount = parseClientScheduleNotesClientWideUnresolvedCount(
            extendedProps?.[CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD]
        );
        const sessionInfo = integratedMonthEventLayout && isMonthView
            ? resolveCalendarSessionLabel({
                sessionSequence: extendedProps?.[SCHEDULE_SESSION_SEQUENCE_FIELD],
                remainingSessions: extendedProps?.[SCHEDULE_REMAINING_SESSIONS_FIELD],
                totalSessions: extendedProps?.[SCHEDULE_TOTAL_SESSIONS_FIELD],
                status: extendedProps?.status,
                isPast: isPastDate
            })
            : { label: '', variant: null, ariaLabel: '' };
        const sessionLabel = sessionInfo.label;
        const sessionTitleSuffix = sessionInfo.ariaLabel ? ` ${sessionInfo.ariaLabel}` : '';
        const sessionVariantClass = sessionInfo.variant
            ? ` mg-v2-ad-calendar-event__sessions--${sessionInfo.variant}`
            : '';
        const isVacationScheduleRow =
            extendedProps?.type === CALENDAR_EXTENDED_TYPE_VACATION
            || extendedProps?.status === STATUS.VACATION;
        const showUnresolvedMonthIndicator =
            integratedMonthEventLayout
            && isMonthView
            && !isCancelled
            && !isVacationScheduleRow
            && (scheduleNotesUnresolvedCount > 0 || clientWideNotesUnresolvedCount > 0);
        let unresolvedTitleSuffix = '';
        if (showUnresolvedMonthIndicator) {
            if (scheduleNotesUnresolvedCount > 0 && clientWideNotesUnresolvedCount > 0) {
                unresolvedTitleSuffix =
                    ` · 이 일정 미해소 ${scheduleNotesUnresolvedCount}건 · 내담자 전체 ${clientWideNotesUnresolvedCount}건`;
            } else if (scheduleNotesUnresolvedCount > 0) {
                unresolvedTitleSuffix = ` · 미해소 ${scheduleNotesUnresolvedCount}건`;
            } else {
                unresolvedTitleSuffix = ` · 내담자 미해소 ${clientWideNotesUnresolvedCount}건`;
            }
        }

        // 월간 뷰: 컴팩트 렌더링 (시간 + 내담자명만). 통합 스케줄은 좌측 Dot + 텍스트(전면 fill 완화).
        if (isMonthView) {
            const fullTooltip = `${clientName}${sessionTitleSuffix} · ${consultantName} · ${statusKorean}${unresolvedTitleSuffix}`;
            const integratedMonthLabel =
                `${eventInfo.timeText} · ${clientName}${sessionTitleSuffix} · ${statusKorean}${unresolvedTitleSuffix}`;
            const integratedMod = integratedMonthEventLayout ? ' mg-v2-ad-calendar-event--integrated-month' : '';
            const unresolvedMod = scheduleNotesUnresolvedCount > 0
                ? ' mg-v2-ad-calendar-event--client-notes-unresolved'
                : (clientWideNotesUnresolvedCount > 0 ? ' mg-v2-ad-calendar-event--client-notes-client-wide' : '');
            const dotMonthStyle = integratedMonthEventLayout
                ? (showUnresolvedMonthIndicator ? undefined : { backgroundColor: borderColor })
                : undefined;
            return (
                <div
                    className={`mg-v2-ad-calendar-event mg-v2-ad-calendar-event--compact${integratedMod}${unresolvedMod}${pastClass}${cancelledClass}`.trim()}
                    title={integratedMonthEventLayout ? integratedMonthLabel : fullTooltip}
                    aria-label={integratedMonthEventLayout ? integratedMonthLabel : fullTooltip}
                    style={integratedMonthEventLayout ? undefined : { borderLeftColor: borderColor }}
                >
                    {integratedMonthEventLayout && (
                        <span
                            className="mg-v2-ad-calendar-event__dot"
                            style={dotMonthStyle}
                            aria-hidden="true"
                        />
                    )}
                    <span className="mg-v2-ad-calendar-event__time">{eventInfo.timeText}</span>
                    <span className="mg-v2-ad-calendar-event__client">{clientName}</span>
                    {sessionLabel ? (
                        <span
                            className={`mg-v2-ad-calendar-event__sessions${sessionVariantClass}`.trim()}
                            aria-hidden="true"
                        >
                            {sessionLabel}
                        </span>
                    ) : null}
                    {showUnresolvedMonthIndicator && scheduleNotesUnresolvedCount > 0 && (
                        <AlertCircle className="mg-v2-ad-calendar-event__unresolved-icon" size={14} aria-hidden="true" />
                    )}
                    {showUnresolvedMonthIndicator && scheduleNotesUnresolvedCount === 0 && clientWideNotesUnresolvedCount > 0 && (
                        <Info className="mg-v2-ad-calendar-event__unresolved-icon mg-v2-ad-calendar-event__unresolved-icon--client-wide" size={14} aria-hidden="true" />
                    )}
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
        <div ref={calendarWrapperRef} className="mg-v2-schedule-calendar-view mg-v2-ad-b0kla-fc-wrapper">
            <FullCalendar
                ref={calendarRef}
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
                dayCellClassNames={dayCellClassNamesForKrHoliday}
                dayCellDidMount={handleDayCellDidMount}
                dayCellWillUnmount={handleDayCellWillUnmount}
                eventClassNames={eventClassNames}
                eventContent={renderEventContent}
                dateClick={onDateClick}
                eventClick={onEventClick}
                eventDrop={onEventDrop}
                eventReceive={acceptExternalCalendarDrops ? handleEventReceive : undefined}
                editable={!disableCalendarEventDrag && isScheduleCalendarEditableRole(userRole)}
                droppable={acceptExternalCalendarDrops && isScheduleDropAdminRole(userRole)}
                height="100%"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                scrollTime="09:00:00"
                scrollTimeReset={false}
                allDaySlot={true}
                eventDidMount={handleEventDidMount}
                businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5], // 월-금
                    startTime: '09:00',
                    endTime: '20:00'
                }}
                expandRows={true}
                stickyHeaderDates={true}
                windowResize={updateCalendarSize}
            />
        </div>
    );
};

export default ScheduleCalendarView;