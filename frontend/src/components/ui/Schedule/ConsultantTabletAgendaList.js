/**
 * 상담사 태블릿 일정 v2 — 세로「일」아젠다 / 「주」리스트 (타임그리드 대체)
 * FullCalendar eventClick 호환 페이로드로 onEventClick 호출.
 *
 * @author CoreSolution
 * @since 2026-10-28
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from '../../common/SafeText';
import {
  CONSULTANT_SCHEDULE_TABLET_CLASS as C,
  CONSULTANT_SCHEDULE_TABLET_TEST_ID
} from '../../../constants/consultantScheduleTablet';
import { CONSULTANT_SUITE_NS } from '../../../constants/consultantSuite';
import {
  buildTabletAgendaItems,
  groupTabletAgendaByDay
} from '../../../utils/consultantTabletAgenda';
import { getNow } from '../../../utils/serverClock';
import './ConsultantTabletAgendaList.css';

const CALENDAR_VIEW_WEEK = 'timeGridWeek';

/**
 * @param {Object} item
 * @param {Function} onEventClick
 * @returns {void}
 */
const emitEventClick = (item, onEventClick, nativeEvent) => {
  if (typeof onEventClick !== 'function' || !item?.event) {
    return;
  }
  const source = item.event;
  onEventClick({
    event: {
      id: source.id,
      title: source.title,
      start: item.start,
      end: item.end,
      extendedProps: source.extendedProps || {},
      classNames: typeof source.className === 'string'
        ? source.className.split(/\s+/).filter(Boolean)
        : []
    },
    jsEvent: nativeEvent,
    el: nativeEvent?.currentTarget || null
  });
};

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const ConsultantTabletAgendaList = ({
  events,
  viewType,
  rangeStart,
  rangeEnd,
  scheduleStatusOptions = [],
  onEventClick
}) => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const isWeek = viewType === CALENDAR_VIEW_WEEK;

  const items = useMemo(() => buildTabletAgendaItems(
    events,
    rangeStart,
    rangeEnd,
    {
      now: getNow(),
      translate: t,
      scheduleStatusOptions,
      inProgressLabel: t('schedule.agendaInProgress'),
      inProgressMeta: t('schedule.agendaInProgressMeta'),
      durationLabel: (count) => t('schedule.agendaDuration', { count })
    }
  ), [events, rangeStart, rangeEnd, scheduleStatusOptions, t]);

  const dayGroups = useMemo(
    () => (isWeek ? groupTabletAgendaByDay(items) : [{ dayKey: null, items }]),
    [isWeek, items]
  );

  const formatDayLabel = (dayKey) => {
    if (!dayKey) {
      return '';
    }
    const [y, m, d] = dayKey.split('-').map(Number);
    if (!y || !m || !d) {
      return dayKey;
    }
    const date = new Date(y, m - 1, d);
    return t('schedule.agendaDayLabel', {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      weekday: date.toLocaleDateString('ko-KR', { weekday: 'short' })
    });
  };

  const rootClass = [
    C.AGENDA,
    isWeek ? C.AGENDA_WEEK : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-testid={CONSULTANT_SCHEDULE_TABLET_TEST_ID.AGENDA}
      data-agenda-mode={isWeek ? 'week' : 'day'}
      role="list"
      aria-label={t('schedule.agendaAria')}
    >
      {dayGroups.map((group) => (
        <section
          key={group.dayKey || 'day'}
          className={C.DAY_GROUP}
          role="presentation"
        >
          {isWeek && group.dayKey ? (
            <h3 className={C.DAY_LABEL}>{formatDayLabel(group.dayKey)}</h3>
          ) : null}
          {group.items.map((item) => {
            const itemClass = [
              C.ITEM,
              item.className,
              item.inProgress ? C.ITEM_NOW : '',
              item.completed ? C.ITEM_DONE : ''
            ].filter(Boolean).join(' ');
            return (
              <button
                key={String(item.id)}
                type="button"
                role="listitem"
                className={itemClass}
                data-testid={CONSULTANT_SCHEDULE_TABLET_TEST_ID.ITEM}
                data-schedule-id={item.id}
                onClick={(nativeEvent) => emitEventClick(item, onEventClick, nativeEvent)}
              >
                <span className={C.TIME}>
                  <SafeText>{item.startLabel}</SafeText>
                  {item.endLabel ? (
                    <span className={C.TIME_END}>
                      <SafeText>{item.endLabel}</SafeText>
                    </span>
                  ) : null}
                </span>
                <span className={C.BODY}>
                  <span className={C.NAME}>
                    <SafeText>{item.clientName}</SafeText>
                  </span>
                  {item.meta ? (
                    <span className={C.META}>
                      <SafeText>{item.meta}</SafeText>
                    </span>
                  ) : null}
                </span>
                <span className={C.CHIP}>
                  <SafeText>{item.statusLabel}</SafeText>
                </span>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
};

ConsultantTabletAgendaList.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  viewType: PropTypes.string,
  rangeStart: PropTypes.instanceOf(Date),
  rangeEnd: PropTypes.instanceOf(Date),
  scheduleStatusOptions: PropTypes.arrayOf(PropTypes.object),
  onEventClick: PropTypes.func
};

ConsultantTabletAgendaList.defaultProps = {
  events: [],
  viewType: 'timeGridDay',
  rangeStart: null,
  rangeEnd: null,
  scheduleStatusOptions: [],
  onEventClick: undefined
};

export default ConsultantTabletAgendaList;
