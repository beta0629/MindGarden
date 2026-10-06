import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, AlertCircle, Info } from 'lucide-react';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveScheduleStatusDisplayLabel } from '../../../utils/scheduleStatusLabel';
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
  resolveCompactScheduleStatusModifier,
  parseClientScheduleNotesClientWideUnresolvedCount,
  parseClientScheduleNotesUnresolvedCount
} from '../../../constants/schedule';
import { CLIENT_REMINDER_SMS_FIELD } from '../../../constants/scheduleClientReminderSms';
import {
  MAPPING_ENGAGEMENT_TYPE,
  MAPPING_ENGAGEMENT_TYPE_LABELS,
  resolveMappingEngagementType,
  shouldRenderEngagementTypeBadge
} from '../../../constants/mappingEngagementType';
import { resolveScheduleReminderSmsDisplay } from '../../admin/mapping-management/integrated-schedule/utils/scheduleReminderSmsDisplay';
import ScheduleReminderSmsBadge from '../../admin/mapping-management/integrated-schedule/molecules/ScheduleReminderSmsBadge';
import ScheduleEventMarks from '../../admin/mapping-management/integrated-schedule/molecules/ScheduleEventMarks';
import EngagementTypeBadge from '../../common/EngagementTypeBadge';
import { SAME_DAY_PENDING_EVENT_CLASS } from '../../schedule/utils/sameDayPendingEventDecorator';
import {
  INTEGRATED_MONTH_CHIP_I18N,
  buildIntegratedMonthChipCopy,
  formatIntegratedMonthChipShortTime
} from './integratedMonthChipCopy';
import { SCHEDULE_CALENDAR_I18N, buildScheduleCalendarTextOptions } from './scheduleCalendarI18n';
import useCalendarDragEscapeCancel from './useCalendarDragEscapeCancel';
import {
  getKrPublicHolidayNameForLocalDate,
  getKrSubstituteHolidayEveHintForLocalDate
} from '../../../utils/krPublicHolidays';
import { USER_ROLES, mapLegacyRole } from '../../../constants/roles';
import {
  appendScheduleMoveLockTooltip,
  getScheduleCreateInPastMessage,
  getScheduleMoveSourceLockedMessage,
  getScheduleMoveToPastMessage,
  isScheduleMoveSourceLocked,
  isScheduleMoveTargetInPast,
  resolveCalendarDropTargetStart,
  resolveScheduleMoveTarget
} from '../../../utils/scheduleMoveGuard';
import './ScheduleCalendarView.css';

const KR_PUBLIC_HOLIDAY_DAY_BADGE_CLASS = 'mg-v2-ad-calendar-day-holiday-badge';
const KR_SUBSTITUTE_EVE_DAY_BADGE_CLASS = 'mg-v2-ad-calendar-day-substitute-eve-badge';
const SUBSTITUTE_EVE_DAY_CELL_CLASS = 'mg-v2-ad-calendar-day--kr-substitute-eve';
const WEEKEND_SAT_DAY_CELL_CLASS = 'mg-v2-ad-calendar-day--weekend-sat';
const WEEKEND_SUN_DAY_CELL_CLASS = 'mg-v2-ad-calendar-day--weekend-sun';

/** FullCalendar 뷰 타입 — 월/주 날짜 클릭 시 일간 확대용 */
const CALENDAR_VIEW_MONTH = 'dayGridMonth';
const CALENDAR_VIEW_WEEK = 'timeGridWeek';
const CALENDAR_VIEW_DAY = 'timeGridDay';
const CALENDAR_VIEWS_ZOOM_FROM = new Set([CALENDAR_VIEW_MONTH, CALENDAR_VIEW_WEEK]);
const ZOOM_OUT_BUTTON_ID = 'zoomOut';
/** opacity fade 전용. transform/scale 금지(DnD 히트테스트 보호). --animation-duration-fast(0.15s)와 맞춤 */
const VIEW_FADE_CLASS = 'mg-v2-schedule-calendar-view--fading';
const VIEW_FADE_MS = 150;
/** 일/주 풀 카드 최소 높이(px) — --mg-v2-space-16(4rem)와 정합, 짧은 슬롯 본문 압착 방지 */
const EVENT_MIN_HEIGHT_PX = 64;

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * 통합 스케줄 외부 카드 드롭 등 «신규 생성» UX — 관리자형(4종 SSOT ADMIN/STAFF)만.
 * 레거시 BRANCH_SUPER_ADMIN 은 ADMIN 으로 자동 매핑된다.
 */
const isScheduleDropAdminRole = (role) => {
    const normalized = mapLegacyRole(role);
    return normalized === USER_ROLES.ADMIN || normalized === USER_ROLES.STAFF;
};

/** 기존 일정 드래그 이동·변경 — 상담사 또는 관리자형 */
const isScheduleCalendarEditableRole = (role) =>
    mapLegacyRole(role) === USER_ROLES.CONSULTANT || isScheduleDropAdminRole(role);

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
    onEventResize,
    /** 드래그가 과거 시각 칸에서 끝나 이동이 거부됐을 때 (message: string) => void */
    onEventMoveRejected,
    onExternalEventReceive,
    integratedMonthEventLayout = false,
    calendarSkin,
    /** 통합 스케줄(사이드바→캘린더)만: 기존 일정 블록 드래그 이동 비활성화, 외부 드롭은 유지 */
    disableCalendarEventDrag = false,
    /** false면 FullCalendar 외부 드롭(사이드바 카드 등) 비활성 */
    acceptExternalCalendarDrops = true,
    /**
     * FullCalendar 의 datesSet 콜백 통합 래퍼.
     * - 월/주/일 이동, 뷰 전환 등 가시 범위 변경 시 호출된다.
     * - 통합 스케줄 화면이 월별 상담사 카운트 API 를 재호출하는 트리거로 사용한다.
     * - (info: { start: Date, end: Date, activeStart: Date|undefined,
     *            currentStart: Date|undefined, view: string }) => void
     *
     * 2026-06-XX R4 (P0) — FullCalendar v6 공식 문서 SSOT 정정.
     *   - `view.currentStart` = 활성 month interval 의 시작 (1일 00:00). month view 의 SSOT.
     *   - `view.activeStart`  = 그리드 첫 가시일(이전 달 일부 포함 가능). month view 에서는
     *     보통 이전 달의 일요일이 들어온다.
     *   - `arg.start` = `view.activeStart` 와 동일 (표시 첫 셀).
     *
     * 부모는 `currentStart` 를 최우선 사용한다. PR #135 R3 의
     * 「activeStart = 활성 월 1일」가정은 잘못된 것으로, 4월 보기에서
     * activeStart=2026-03-29 → month=3 API 호출 회귀를 유발했다.
     */
    onMonthChange,
    scheduleStatusOptions = []
}) => {
    const { t } = useTranslation();
    const calendarRef = useRef(null);
    const calendarWrapperRef = useRef(null);
    /** 날짜 클릭으로 일간 확대하기 직전 뷰(month/week). 툴바「전체 보기」복귀용 */
    const previousViewBeforeZoomRef = useRef(null);
    const viewFadeTimerRef = useRef(null);
    /** datesSet에서 day→month/week 이탈 시에만 줌 상태 해제 (확대 직전 헤더 갱신 레이스 방지) */
    const lastViewTypeRef = useRef(null);
    const [isDayZoomed, setIsDayZoomed] = useState(false);
    useCalendarDragEscapeCancel();

    const updateCalendarSize = useCallback(() => {
        const calendarApi = calendarRef.current?.getApi?.();
        if (!calendarApi) {
            return;
        }

        requestAnimationFrame(() => {
            calendarApi.updateSize();
        });
    }, []);

    /**
     * 뷰 전환 시 컨테이너 opacity fade만 적용.
     * transform/scale/zoom 금지 — FullCalendar DnD·외부 드롭 좌표가 깨지지 않도록.
     */
    const runViewFadeTransition = useCallback((applyChange) => {
        const wrapperEl = calendarWrapperRef.current;
        if (viewFadeTimerRef.current != null) {
            window.clearTimeout(viewFadeTimerRef.current);
            viewFadeTimerRef.current = null;
        }

        if (!wrapperEl || prefersReducedMotion()) {
            applyChange();
            updateCalendarSize();
            return;
        }

        wrapperEl.classList.add(VIEW_FADE_CLASS);
        viewFadeTimerRef.current = window.setTimeout(() => {
            viewFadeTimerRef.current = null;
            applyChange();
            requestAnimationFrame(() => {
                wrapperEl.classList.remove(VIEW_FADE_CLASS);
                updateCalendarSize();
            });
        }, VIEW_FADE_MS);
    }, [updateCalendarSize]);

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
            if (viewFadeTimerRef.current != null) {
                window.clearTimeout(viewFadeTimerRef.current);
                viewFadeTimerRef.current = null;
            }
        };
    }, [updateCalendarSize]);

    const zoomToDayView = useCallback((date, fromViewType) => {
        const calendarApi = calendarRef.current?.getApi?.();
        if (!calendarApi || !date) {
            return;
        }

        previousViewBeforeZoomRef.current =
            CALENDAR_VIEWS_ZOOM_FROM.has(fromViewType)
                ? fromViewType
                : CALENDAR_VIEW_MONTH;
        setIsDayZoomed(true);

        runViewFadeTransition(() => {
            calendarApi.gotoDate(date);
            calendarApi.changeView(CALENDAR_VIEW_DAY);
        });
    }, [runViewFadeTransition]);

    const zoomOutToPreviousView = useCallback(() => {
        const calendarApi = calendarRef.current?.getApi?.();
        if (!calendarApi) {
            return;
        }

        const restoreView = previousViewBeforeZoomRef.current || CALENDAR_VIEW_MONTH;
        previousViewBeforeZoomRef.current = null;
        setIsDayZoomed(false);

        runViewFadeTransition(() => {
            calendarApi.changeView(restoreView);
        });
    }, [runViewFadeTransition]);

    /**
     * 제스처 분리 (DnD·editable 미변경):
     * - 월간/주간 dateClick → 해당일 timeGridDay 확대(등록 모달 열지 않음)
     * - 일간 dateClick → 기존 onDateClick(스케줄/휴가 등록 모달)
     * 이유: 저해상도에서 일정 가림 완화가 주 목적이고, dateClick 한 경로만 분기해
     * 더블클릭/셀 영역 분리보다 FullCalendar·모달 회귀가 적다.
     */
    const handleDateClick = useCallback((info) => {
        const viewType = info?.view?.type;
        if (CALENDAR_VIEWS_ZOOM_FROM.has(viewType)) {
            zoomToDayView(info.date, viewType);
            return;
        }
        if (isScheduleMoveTargetInPast(info?.date)) {
            onEventMoveRejected?.(getScheduleCreateInPastMessage());
            return;
        }
        onDateClick?.(info);
    }, [onDateClick, onEventMoveRejected, zoomToDayView]);

    const handleSelectAllow = useCallback((selectInfo) => {
        return !isScheduleMoveTargetInPast(selectInfo?.start);
    }, []);

    const handleDatesSet = useCallback((arg) => {
        const viewType = arg.view?.type;
        const previousViewType = lastViewTypeRef.current;
        lastViewTypeRef.current = viewType || null;

        if (
            previousViewType === CALENDAR_VIEW_DAY
            && viewType
            && viewType !== CALENDAR_VIEW_DAY
        ) {
            previousViewBeforeZoomRef.current = null;
            setIsDayZoomed(false);
        }

        onMonthChange?.({
            start: arg.start,
            end: arg.end,
            activeStart: arg.view?.activeStart,
            currentStart: arg.view?.currentStart,
            view: viewType
        });
    }, [onMonthChange]);

    const customButtons = useMemo(() => ({
        [ZOOM_OUT_BUTTON_ID]: {
            text: t(SCHEDULE_CALENDAR_I18N.toolbar.zoomOut),
            click: zoomOutToPreviousView
        }
    }), [t, zoomOutToPreviousView]);

    const calendarTextOptions = useMemo(() => buildScheduleCalendarTextOptions(t), [t]);

    const headerToolbar = useMemo(() => ({
        left: 'prev,next today',
        center: 'title',
        right: isDayZoomed
            ? `${ZOOM_OUT_BUTTON_ID} ${CALENDAR_VIEW_MONTH},${CALENDAR_VIEW_WEEK},${CALENDAR_VIEW_DAY}`
            : `${CALENDAR_VIEW_MONTH},${CALENDAR_VIEW_WEEK},${CALENDAR_VIEW_DAY}`
    }), [isDayZoomed]);

    /**
     * 로컬 날짜가 KR 공휴일 표에 있으면 셀에 표식.
     * 통합 스킨일 때만 익일「대체」공휴일 전날 클래스(배지·스타일 정합).
     *
     * 2026-05-23 옵션 A 정착 — `!holidayName` 가드를 제거해 공휴일 셀에도 weekend 클래스를 부여한다.
     * CSS 우선순위 규칙은 ScheduleCalendarView.css 의 공휴일 override 블록으로 명시하므로
     * Sat+공휴일 → 분홍, Sun+공휴일 → 분홍(동일 톤) 으로 시각 정합한다.
     * SSOT: docs/project-management/2026-05-23/CALENDAR_OPTION_A_DESIGN_HANDOFF.md §2,
     *       docs/project-management/2026-05-23/CALENDAR_HOLIDAY_BG_REGRESSION_ANALYSIS.md §4.2
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
        if (arg.view?.type === CALENDAR_VIEW_MONTH) {
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
        if (info.view?.type !== CALENDAR_VIEW_MONTH) {
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
                badge.setAttribute(
                    'aria-label',
                    `공휴일 ${safeName} · ${toDisplayString(eveHint.hintLine, '')}`
                );
            } else {
                badge.title = safeName;
                badge.setAttribute('aria-label', `공휴일 ${safeName}`);
            }
            badge.setAttribute('role', 'note');
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
        return isScheduleMoveSourceLocked({
            status: arg.event.extendedProps?.status,
            start: arg.event.start
        }) ? ['fc-event-past'] : [];
    };

    // 완료·취소 또는 시작이 지난 일정 — 드래그 핸들 비활성·흐림 스타일
    const isEventPastOrCompleted = (ev) => isScheduleMoveSourceLocked({
        status: ev.extendedProps?.status,
        start: ev.start
    });

    /** 마지막 eventAllow 가 «과거 시각 칸» 때문에 거부했는지 — eventDragStop 에서 사유 안내용 */
    const moveRejectedToPastRef = useRef(false);

    /**
     * 드래그·리사이즈 사전 차단 (FullCalendar eventAllow).
     * 원본 잠금은 완료·취소 또는 시작이 지난 일정(scheduleMoveGuard).
     * 놓을 칸이 현재 시각 이전이면 놓을 수 없음으로 표시한다.
     *
     * 외부 사이드바 매핑 드롭은 holiday/vacation/slotDragLocked 보다 **최우선** 허용.
     * eventAllow=false 이면 eventReceive 미발화 → 부모 토스트 SSOT silent FAIL.
     * FC external EventImpl 은 start 인스턴스가 없고 leftover 가 top-level 일 수 있음.
     * 점유·과거일·회기 가드와 한국어 토스트는 IntegratedMatchingSchedule SSOT.
     */
    const handleEventAllow = (dropInfo, draggedEvent) => {
        const props = draggedEvent?.extendedProps || {};
        const isExternalMappingDrop = props.externalMappingDrop === true
            || draggedEvent?.externalMappingDrop === true
            || (
                (props.mappingId != null || draggedEvent?.mappingId != null)
                && draggedEvent?.start == null
            );
        if (isExternalMappingDrop) {
            return true;
        }
        if (props.type === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY) {
            return false;
        }
        if (props.type === CALENDAR_EXTENDED_TYPE_VACATION) {
            return false;
        }
        if (props.slotDragLocked === true) {
            return false;
        }
        if (isScheduleMoveSourceLocked({ status: props.status, start: draggedEvent?.start })) {
            return false;
        }
        const targetInPast = isScheduleMoveTargetInPast(resolveScheduleMoveTarget(
            draggedEvent?.start,
            resolveCalendarDropTargetStart(dropInfo, draggedEvent),
            dropInfo?.end
        ));
        moveRejectedToPastRef.current = targetInPast;
        return !targetInPast;
    };

    const handleEventDragStart = () => {
        moveRejectedToPastRef.current = false;
    };

    const handleEventDragStop = () => {
        if (!moveRejectedToPastRef.current) {
            return;
        }
        moveRejectedToPastRef.current = false;
        onEventMoveRejected?.(getScheduleMoveToPastMessage());
    };

    /**
     * 외부 카드 드롭 수신: FullCalendar는 날짜·페이로드 전달만 한다.
     * leftover 가 top-level 에만 남는 FC 경로를 위해 extendedProps + top-level 병합.
     * onExternalEventReceive 쪽 비즈니스 검증(매칭·회기 등)은 부모·통합 화면 책임이다.
     */
    const handleEventReceive = (info) => {
        if (onExternalEventReceive && info.event) {
            const date = info.event.start;
            const ep = info.event.extendedProps || {};
            const event = info.event;
            const payload = {
                ...ep,
                externalMappingDrop: ep.externalMappingDrop ?? event.externalMappingDrop,
                mappingId: ep.mappingId ?? event.mappingId,
                consultantId: ep.consultantId ?? event.consultantId,
                clientId: ep.clientId ?? event.clientId,
                consultantName: ep.consultantName ?? event.consultantName,
                clientName: ep.clientName ?? event.clientName,
                status: ep.status ?? event.status,
                remainingSessions: ep.remainingSessions ?? event.remainingSessions,
                paymentTiming: ep.paymentTiming ?? event.paymentTiming,
                packageName: ep.packageName ?? event.packageName,
                packagePrice: ep.packagePrice ?? event.packagePrice,
                totalSessions: ep.totalSessions ?? event.totalSessions,
                hasConsultationSchedule:
                    ep.hasConsultationSchedule ?? event.hasConsultationSchedule,
                hasOpenOccupyingConsultationSchedule:
                    ep.hasOpenOccupyingConsultationSchedule
                    ?? event.hasOpenOccupyingConsultationSchedule
            };
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
        const sourceLockReason = getScheduleMoveSourceLockedMessage({
            status: extendedProps?.status,
            start: event.start
        });
        const isMonthView = eventInfo.view?.type === CALENDAR_VIEW_MONTH;
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
                    <CalendarIcon className="mg-v2-ad-calendar-event__icon" />
                    <span className="mg-v2-ad-calendar-event__client">{vacTitle}</span>
                </div>
            );
        }

        // 일반 스케줄 이벤트 렌더링
        const clientNameFallback = t(INTEGRATED_MONTH_CHIP_I18N.clientNameFallback);
        const clientName = toDisplayString(extendedProps.clientName, clientNameFallback);
        const consultantName = toDisplayString(extendedProps.consultantName, '');
        const statusLabel = resolveScheduleStatusDisplayLabel(
            extendedProps?.status,
            { codes: scheduleStatusOptions, translate: t }
        );
        const statusModifier = resolveCompactScheduleStatusModifier(extendedProps?.status);
        const statusModClass = statusModifier ? ` mg-v2-ad-calendar-event--status-${statusModifier}` : '';
        const eventClassList = Array.isArray(event.classNames) ? event.classNames : [];
        const isSameDayPending = extendedProps?.isSameDayPending === true
            || eventClassList.includes(SAME_DAY_PENDING_EVENT_CLASS);
        const engagementType = resolveMappingEngagementType(extendedProps);
        const showInstitutionMark = shouldRenderEngagementTypeBadge(engagementType);
        const institutionLabel = !showInstitutionMark
            ? ''
            : (engagementType === MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK
                ? t(INTEGRATED_MONTH_CHIP_I18N.institutionLink)
                : toDisplayString(MAPPING_ENGAGEMENT_TYPE_LABELS[engagementType], ''));
        const reminderSms = resolveScheduleReminderSmsDisplay(
            extendedProps?.[CLIENT_REMINDER_SMS_FIELD]
        );
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
        const chipCopy = buildIntegratedMonthChipCopy({
            translate: t,
            timeText: eventInfo.timeText,
            clientName,
            sessionAriaLabel: sessionInfo.ariaLabel,
            statusLabel,
            isSameDayPending,
            institutionLabel,
            reminderSmsStatus: reminderSms?.status,
            scheduleUnresolvedCount: showUnresolvedMonthIndicator ? scheduleNotesUnresolvedCount : 0,
            clientWideUnresolvedCount: showUnresolvedMonthIndicator ? clientWideNotesUnresolvedCount : 0
        });
        const sameDayPrefix = isSameDayPending ? (
            <span className="mg-v2-ad-calendar-event__same-day" aria-hidden="true">
                {chipCopy.sameDayPrefix}
            </span>
        ) : null;

        // 월간 뷰: 컴팩트 렌더링. 통합 스케줄은 상태 점 + 끝 표식.
        if (isMonthView) {
            const unresolvedSuffix = chipCopy.unresolvedText ? ` · ${chipCopy.unresolvedText}` : '';
            const fullTooltip = `${clientName}${sessionTitleSuffix} · ${consultantName} · ${statusLabel}${unresolvedSuffix}`;
            const integratedMod = integratedMonthEventLayout ? ' mg-v2-ad-calendar-event--integrated-month' : '';
            const unresolvedMod = scheduleNotesUnresolvedCount > 0
                ? ' mg-v2-ad-calendar-event--client-notes-unresolved'
                : (clientWideNotesUnresolvedCount > 0 ? ' mg-v2-ad-calendar-event--client-notes-client-wide' : '');
            const dotClass = statusModifier
                ? `mg-v2-ad-calendar-event__dot mg-v2-ad-calendar-event__dot--${statusModifier}`
                : 'mg-v2-ad-calendar-event__dot';
            const monthLabel = integratedMonthEventLayout ? chipCopy.ariaLabel : fullTooltip;
            return (
                <div
                    className={`mg-v2-ad-calendar-event mg-v2-ad-calendar-event--compact${integratedMod}${statusModClass}${unresolvedMod}${pastClass}${cancelledClass}`.trim()}
                    title={appendScheduleMoveLockTooltip(monthLabel, sourceLockReason)}
                    aria-label={monthLabel}
                    aria-disabled={sourceLockReason ? 'true' : undefined}
                >
                    {sameDayPrefix}
                    {integratedMonthEventLayout && (
                        <span className={dotClass} aria-hidden="true" />
                    )}
                    <span className="mg-v2-ad-calendar-event__time">
                        {integratedMonthEventLayout ? (
                            <>
                                <span className="mg-v2-ad-calendar-event__time-full">{eventInfo.timeText}</span>
                                <span className="mg-v2-ad-calendar-event__time-short">
                                    {formatIntegratedMonthChipShortTime(event.start)}
                                </span>
                            </>
                        ) : eventInfo.timeText}
                    </span>
                    <span className="mg-v2-ad-calendar-event__client">{clientName}</span>
                    {!integratedMonthEventLayout && (
                        <>
                            <ScheduleReminderSmsBadge
                                sms={extendedProps?.[CLIENT_REMINDER_SMS_FIELD]}
                                compact
                                stopPropagation
                                className="mg-v2-ad-calendar-event__reminder-sms"
                            />
                            <EngagementTypeBadge
                                source={extendedProps}
                                className="mg-v2-ad-calendar-event__engagement"
                            />
                        </>
                    )}
                    {sessionLabel ? (
                        <span
                            className={`mg-v2-ad-calendar-event__sessions${sessionVariantClass}`.trim()}
                            aria-hidden="true"
                        >
                            {sessionLabel}
                        </span>
                    ) : null}
                    {showUnresolvedMonthIndicator && scheduleNotesUnresolvedCount > 0 && (
                        <AlertCircle
                            className="mg-v2-ad-calendar-event__unresolved-icon"
                            title={chipCopy.unresolvedText}
                            aria-hidden="true"
                        />
                    )}
                    {showUnresolvedMonthIndicator && scheduleNotesUnresolvedCount === 0 && clientWideNotesUnresolvedCount > 0 && (
                        <Info
                            className="mg-v2-ad-calendar-event__unresolved-icon mg-v2-ad-calendar-event__unresolved-icon--client-wide"
                            title={chipCopy.unresolvedText}
                            aria-hidden="true"
                        />
                    )}
                    {isCancelled && (
                        <span
                            className="mg-v2-ad-calendar-event__badge mg-v2-ad-calendar-event__badge--cancelled"
                            aria-hidden="true"
                        >
                            {chipCopy.cancelledBadge}
                        </span>
                    )}
                    {integratedMonthEventLayout && (
                        <ScheduleEventMarks
                            source={extendedProps}
                            sms={extendedProps?.[CLIENT_REMINDER_SMS_FIELD]}
                            compact
                            stopPropagation
                            institutionTitle={institutionLabel}
                        />
                    )}
                </div>
            );
        }

        // 주간/일간 뷰: 풀 카드 유지 (상태 텍스트로 구분 — 좌측 색 레일 없음)
        return (
            <div
                className={`mg-v2-ad-calendar-event${pastClass}${cancelledClass}`.trim()}
                title={appendScheduleMoveLockTooltip(`${clientName} - ${statusLabel}`, sourceLockReason)}
                aria-disabled={sourceLockReason ? 'true' : undefined}
            >
                <div className="mg-v2-ad-calendar-event__time">{eventInfo.timeText}</div>
                <div className="mg-v2-ad-calendar-event__title">
                    {sameDayPrefix}
                    <span className="client-name">{clientName}</span>
                    <ScheduleReminderSmsBadge
                        sms={extendedProps?.[CLIENT_REMINDER_SMS_FIELD]}
                        stopPropagation
                        className="mg-v2-ad-calendar-event__reminder-sms"
                    />
                    <EngagementTypeBadge
                        source={extendedProps}
                        className="mg-v2-ad-calendar-event__engagement"
                    />
                    {consultantName && (
                        <span className="counselor-name">{consultantName}</span>
                    )}
                </div>
                <div className="mg-v2-ad-calendar-event__status">{statusLabel}</div>
            </div>
        );
    };

    return (
        <div ref={calendarWrapperRef} className="mg-v2-schedule-calendar-view mg-v2-ad-b0kla-fc-wrapper">
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={headerToolbar}
                customButtons={customButtons}
                initialView={CALENDAR_VIEW_MONTH}
                defaultView={CALENDAR_VIEW_MONTH}
                locale="ko"
                selectable={true}
                selectMirror={true}
                dayMaxEvents={8}
                moreLinkClick="popover"
                {...calendarTextOptions}
                weekends={true}
                events={events}
                dayCellClassNames={dayCellClassNamesForKrHoliday}
                dayCellDidMount={handleDayCellDidMount}
                dayCellWillUnmount={handleDayCellWillUnmount}
                eventClassNames={eventClassNames}
                eventContent={renderEventContent}
                dateClick={handleDateClick}
                selectAllow={handleSelectAllow}
                eventClick={onEventClick}
                eventDrop={onEventDrop}
                eventResize={onEventResize || onEventDrop}
                eventAllow={handleEventAllow}
                eventDragStart={handleEventDragStart}
                eventDragStop={handleEventDragStop}
                eventReceive={acceptExternalCalendarDrops ? handleEventReceive : undefined}
                editable={!disableCalendarEventDrag && isScheduleCalendarEditableRole(userRole)}
                droppable={acceptExternalCalendarDrops && isScheduleDropAdminRole(userRole)}
                height="100%"
                eventMinHeight={EVENT_MIN_HEIGHT_PX}
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
                datesSet={handleDatesSet}
            />
        </div>
    );
};

export default ScheduleCalendarView;