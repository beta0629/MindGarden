/**
 * 운영 타임존(기본 DEFAULT_VALUES.DEFAULT_TIMEZONE) 기준 날짜·시각 키 공통 유틸.
 *
 * - 날짜 키 'YYYY-MM-DD' 는 반드시 운영 타임존 캘린더로 만든다.
 *   `new Date().toISOString().split('T')[0]` 은 UTC 라 KST 이른 새벽에 전날이 된다.
 * - 일정 시각 문자열은 화면마다 형식이 다르다('오후 07:00', '19:00', '19:00:00', ISO, [h, m]).
 *   일정 화면의 시각 판정은 parseScheduleTimeKey 하나로만 읽는다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
import { DEFAULT_VALUES } from '../constants/magicNumbers';

export const DEFAULT_ZONE = DEFAULT_VALUES.DEFAULT_TIMEZONE;

const MINUTES_PER_HOUR = 60;
const HOURS_PER_HALF_DAY = 12;
const MAX_HOUR = 23;
const MAX_MINUTE = 59;

const MERIDIEM_AM = ['오전', 'am', 'a.m.'];
const MERIDIEM_PM = ['오후', 'pm', 'p.m.'];

const pad2 = (n) => String(n).padStart(2, '0');

const zonedParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`
  };
};

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

/**
 * 운영 타임존 기준 'YYYY-MM-DD'.
 *
 * @param {Date} [date=new Date()]
 * @param {string} [timeZone]
 * @returns {string}
 */
export const formatDateKeyInZone = (date = new Date(), timeZone = DEFAULT_ZONE) =>
  zonedParts(date, timeZone).date;

/**
 * 운영 타임존 기준 'YYYY-MM-DDTHH:mm'.
 *
 * @param {Date} [date=new Date()]
 * @param {string} [timeZone]
 * @returns {string}
 */
export const formatDateTimeKeyInZone = (date = new Date(), timeZone = DEFAULT_ZONE) => {
  const { date: d, time } = zonedParts(date, timeZone);
  return `${d}T${time}`;
};

/** 오프셋(Z, +09:00 등)이 붙은 ISO 날짜시각인지 */
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i;
const ISO_LOCAL = /^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?)$/;
const DATE_ONLY = /^(\d{4}-\d{2}-\d{2})/;
const CLOCK = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;

const toHm = (hour, minute) => {
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }
  if (hour < 0 || hour > MAX_HOUR || minute < 0 || minute > MAX_MINUTE) {
    return null;
  }
  return `${pad2(hour)}:${pad2(minute)}`;
};

const parseClockText = (text) => {
  let body = text.trim().toLowerCase();
  let meridiem = null;
  const all = [...MERIDIEM_AM.map((m) => [m, 'AM']), ...MERIDIEM_PM.map((m) => [m, 'PM'])];
  for (const [token, kind] of all) {
    if (body.startsWith(token)) {
      meridiem = kind;
      body = body.slice(token.length).trim();
      break;
    }
    if (body.endsWith(token)) {
      meridiem = kind;
      body = body.slice(0, body.length - token.length).trim();
      break;
    }
  }
  const m = CLOCK.exec(body);
  if (!m) {
    return null;
  }
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  if (meridiem) {
    if (hour < 1 || hour > HOURS_PER_HALF_DAY) {
      return null;
    }
    hour %= HOURS_PER_HALF_DAY;
    if (meridiem === 'PM') {
      hour += HOURS_PER_HALF_DAY;
    }
  }
  return toHm(hour, minute);
};

/**
 * 일정 시각 값 → 운영 타임존 'HH:mm'. 읽을 수 없으면 null.
 *
 * 지원: '오전/오후 hh:mm', 'hh:mm AM/PM', 'HH:mm', 'HH:mm:ss', ISO 로컬('YYYY-MM-DDTHH:mm[:ss]'),
 * 오프셋 ISO('...Z', '...+09:00' → 운영 타임존으로 환산), Date, [h, m(, s)] 배열. 숫자 단독 값은 미지원.
 *
 * @param {*} value
 * @param {string} [timeZone]
 * @returns {string|null}
 */
export const parseScheduleTimeKey = (value, timeZone = DEFAULT_ZONE) => {
  if (value == null || value === '') {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length >= 2 ? toHm(Number(value[0]), Number(value[1])) : null;
  }
  if (value instanceof Date) {
    return isValidDate(value) ? zonedParts(value, timeZone).time : null;
  }
  const text = String(value).trim();
  if (ISO_WITH_OFFSET.test(text)) {
    const d = new Date(text);
    return isValidDate(d) ? zonedParts(d, timeZone).time : null;
  }
  const local = ISO_LOCAL.exec(text);
  if (local) {
    return parseClockText(local[2]);
  }
  return parseClockText(text);
};

/**
 * 일정 날짜 값 → 'YYYY-MM-DD'. 읽을 수 없으면 null.
 * 오프셋 ISO·Date 는 운영 타임존 캘린더로 환산한다.
 *
 * @param {*} value 'YYYY-MM-DD[...]', [y, m, d], Date
 * @param {string} [timeZone]
 * @returns {string|null}
 */
export const parseScheduleDateKey = (value, timeZone = DEFAULT_ZONE) => {
  if (value == null || value === '') {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length >= 3 ? `${value[0]}-${pad2(value[1])}-${pad2(value[2])}` : null;
  }
  if (value instanceof Date) {
    return isValidDate(value) ? zonedParts(value, timeZone).date : null;
  }
  const text = String(value).trim();
  if (ISO_WITH_OFFSET.test(text)) {
    const d = new Date(text);
    return isValidDate(d) ? zonedParts(d, timeZone).date : null;
  }
  const m = DATE_ONLY.exec(text);
  return m ? m[1] : null;
};

/**
 * 'HH:mm' → 자정 기준 분. 읽을 수 없으면 null.
 *
 * @param {*} value parseScheduleTimeKey 입력과 동일
 * @param {string} [timeZone]
 * @returns {number|null}
 */
export const parseScheduleTimeMinutes = (value, timeZone = DEFAULT_ZONE) => {
  const hm = parseScheduleTimeKey(value, timeZone);
  if (!hm) {
    return null;
  }
  const [h, m] = hm.split(':').map(Number);
  return h * MINUTES_PER_HOUR + m;
};
