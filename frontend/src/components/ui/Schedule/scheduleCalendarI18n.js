/**
 * 스케줄 캘린더(FullCalendar) 툴바·더보기 문구.
 * locale 문자열만 넘기면 FullCalendar 가 버튼·더보기 문구를 영어 기본값으로 그리므로 i18n 키로 덮는다.
 */

export const SCHEDULE_CALENDAR_I18N = Object.freeze({
  moreLink: 'schedule:calendar.moreLink'
});

/**
 * FullCalendar moreLinkText — 함수형은 전체 문구를 반환한다.
 *
 * @param {Function} translate i18next t
 * @returns {(count: number) => string}
 */
export const buildScheduleCalendarMoreLinkText = (translate) => (count) => {
  if (typeof translate !== 'function') {
    return '';
  }
  const value = translate(SCHEDULE_CALENDAR_I18N.moreLink, { count });
  return value == null ? '' : String(value);
};
