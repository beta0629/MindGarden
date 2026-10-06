/**
 * 내담자 직접 예약(가예약 신청) — 가용 시간 펼치기·상담 유형 선택·요청 본문 조립.
 *
 * 서버 `POST /api/v1/clients/me/bookings` 는 명시 필드만 받는다(clientId·결제 수단 없음).
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

const JS_DAY_TO_API = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const API_DAY_SHORT = {
  SUN: 'SUNDAY',
  MON: 'MONDAY',
  TUE: 'TUESDAY',
  WED: 'WEDNESDAY',
  THU: 'THURSDAY',
  FRI: 'FRIDAY',
  SAT: 'SATURDAY'
};
const HH_MM_LENGTH = 5;

const toHhMm = (value) => {
  if (value == null) return '';
  const s = String(value);
  return s.length >= HH_MM_LENGTH ? s.substring(0, HH_MM_LENGTH) : s;
};

const normalizeDay = (value) => {
  if (value == null) return '';
  const s = String(value).toUpperCase();
  return API_DAY_SHORT[s] || s;
};

/**
 * `YYYY-MM-DD` 의 요일을 서버 DayOfWeek 이름으로.
 *
 * @param {string} dateStr 날짜
 * @returns {string} MONDAY … SUNDAY, 형식 오류면 ''
 */
export const dayOfWeekForDate = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return JS_DAY_TO_API[d.getDay()];
};

/**
 * 상담사 주간 반복 가용 시간(`GET /api/v1/consultants/{id}/availability` 의 data 행)을 특정 날짜 슬롯으로.
 *
 * @param {unknown} payload 응답 본문 또는 행 배열
 * @param {string} dateStr 날짜 `YYYY-MM-DD`
 * @returns {{ startTime: string, endTime: string }[]} 시작 시각순, 중복 제거
 */
export const expandAvailabilityForDate = (payload, dateStr) => {
  const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
  const day = dayOfWeekForDate(dateStr);
  if (!day) return [];
  const seen = new Set();
  return rows
    .filter((row) => row && row.isActive !== false && normalizeDay(row.dayOfWeek) === day)
    .map((row) => ({ startTime: toHhMm(row.startTime), endTime: toHhMm(row.endTime) }))
    .filter((slot) => slot.startTime && slot.endTime && slot.endTime > slot.startTime)
    .filter((slot) => {
      if (seen.has(slot.startTime)) return false;
      seen.add(slot.startTime);
      return true;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

/**
 * 공통코드 행에서 활성 상담 유형 중 정렬 순서가 가장 앞선 것.
 *
 * @param {unknown[]} codes 공통코드 행
 * @returns {{ value: string, label: string } | null} 없으면 null (하드코딩 기본값 없음)
 */
export const pickDefaultConsultationType = (codes) => {
  if (!Array.isArray(codes)) return null;
  const active = codes
    .filter((c) => c && c.codeValue && c.isActive !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER));
  const first = active[0];
  if (!first) return null;
  return {
    value: String(first.codeValue),
    label: String(first.koreanName || first.codeLabel || first.codeValue)
  };
};

/**
 * 가예약 신청 요청 본문.
 *
 * @param {{ consultantId: number|string, date: string, slot: { startTime: string, endTime: string },
 *   consultationType: string, memo?: string }} input 입력
 * @returns {object} 서버 ClientDirectBookingRequest
 */
export const buildClientBookingPayload = ({ consultantId, date, slot, consultationType, memo }) => {
  const body = {
    consultantId: Number(consultantId),
    date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    consultationType
  };
  if (memo != null && String(memo).trim() !== '') {
    body.memo = String(memo).trim();
  }
  return body;
};
