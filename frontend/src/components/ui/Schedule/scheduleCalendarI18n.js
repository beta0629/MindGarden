/**
 * 스케줄 캘린더(FullCalendar) 툴바·더보기 문구.
 * locale 문자열만 넘기면 FullCalendar 가 버튼·더보기 문구를 영어 기본값으로 그리므로 i18n 키로 덮는다.
 */

export const SCHEDULE_CALENDAR_I18N = Object.freeze({
  moreLink: 'schedule:calendar.moreLink',
  moreLinkHint: 'schedule:calendar.moreLinkHint',
  allDay: 'schedule:calendar.allDay',
  closeHint: 'schedule:calendar.closeHint',
  toolbar: Object.freeze({
    today: 'schedule:calendar.toolbar.today',
    month: 'schedule:calendar.toolbar.month',
    week: 'schedule:calendar.toolbar.week',
    day: 'schedule:calendar.toolbar.day',
    zoomOut: 'schedule:calendar.toolbar.zoomOut',
    prevHint: 'schedule:calendar.toolbar.prevHint',
    nextHint: 'schedule:calendar.toolbar.nextHint',
    viewHint: 'schedule:calendar.toolbar.viewHint'
  })
});

const translateText = (translate, key, options) => {
  if (typeof translate !== 'function') {
    return '';
  }
  const value = translate(key, options);
  return value == null ? '' : String(value);
};

/**
 * FullCalendar moreLinkText — 함수형은 전체 문구를 반환한다.
 *
 * @param {Function} translate i18next t
 * @returns {(count: number) => string}
 */
export const buildScheduleCalendarMoreLinkText = (translate) => (count) =>
  translateText(translate, SCHEDULE_CALENDAR_I18N.moreLink, { count });

/**
 * FullCalendar 영어 기본 문구를 덮는 옵션 묶음.
 *
 * @param {Function} translate i18next t
 * @returns {object} buttonText · buttonHints · viewHint · allDayText · moreLinkText · moreLinkHint · closeHint
 */
export const buildScheduleCalendarTextOptions = (translate) => {
  const { toolbar } = SCHEDULE_CALENDAR_I18N;
  const todayText = translateText(translate, toolbar.today);
  return {
    buttonText: {
      today: todayText,
      month: translateText(translate, toolbar.month),
      week: translateText(translate, toolbar.week),
      day: translateText(translate, toolbar.day)
    },
    buttonHints: {
      prev: translateText(translate, toolbar.prevHint),
      next: translateText(translate, toolbar.nextHint),
      today: todayText
    },
    viewHint: (buttonText) => translateText(translate, toolbar.viewHint, { view: buttonText }),
    allDayText: translateText(translate, SCHEDULE_CALENDAR_I18N.allDay),
    moreLinkText: buildScheduleCalendarMoreLinkText(translate),
    moreLinkHint: (count) => translateText(translate, SCHEDULE_CALENDAR_I18N.moreLinkHint, { count }),
    closeHint: translateText(translate, SCHEDULE_CALENDAR_I18N.closeHint)
  };
};
