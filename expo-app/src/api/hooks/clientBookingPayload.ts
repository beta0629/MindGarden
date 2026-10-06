/**
 * 내담자 직접 예약(가예약 신청) 순수 유틸.
 *
 * BE 계약
 * - POST `/api/v1/clients/me/bookings` (`ClientBookingController`)
 *   Required: `consultantId`, `date`, `startTime`, `endTime`, `consultationType`(공통코드 CONSULTATION_TYPE)
 *   Optional: `memo`. `clientId`·결제 수단은 받지 않는다(세션 기준, 회기 차감은 결제 후).
 * - GET `/api/v1/consultants/{id}/availability` 는 `weekStart` 를 무시하고
 *   주간 반복 행(`dayOfWeek`, `startTime`, `endTime`, `isActive`) 목록을 `data` 로 반환한다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface CreateBookingRequest {
  consultantId: number;
  date: string;
  startTime: string;
  endTime: string;
  consultationType: string;
  memo?: string;
}

export interface ConsultationTypeOption {
  value: string;
  label: string;
}

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_SHORT: Record<string, string> = {
  SUN: 'SUNDAY',
  MON: 'MONDAY',
  TUE: 'TUESDAY',
  WED: 'WEDNESDAY',
  THU: 'THURSDAY',
  FRI: 'FRIDAY',
  SAT: 'SATURDAY',
};
const DAYS_IN_WEEK = 7;
const HH_MM_LENGTH = 5;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toHhMm(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  return s.length >= HH_MM_LENGTH ? s.substring(0, HH_MM_LENGTH) : s;
}

function normalizeDay(value: unknown): string {
  if (value == null) return '';
  const s = String(value).toUpperCase();
  return DAY_SHORT[s] ?? s;
}

function extractRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw != null && typeof raw === 'object') {
    const data = (raw as Record<string, unknown>).data;
    if (Array.isArray(data)) return data as Record<string, unknown>[];
  }
  return [];
}

/**
 * 주간 반복 가용 행을 `weekStart`(YYYY-MM-DD) 부터 7일치 날짜 슬롯으로 펼친다.
 * 이미 지난 시작 시각은 `isAvailable=false` (서버도 SCHEDULE_CREATE_IN_PAST 로 거절).
 */
export function expandWeeklyAvailability(
  raw: unknown,
  weekStart: string,
  now: Date = new Date(),
): AvailableSlot[] {
  const start = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(start.getTime())) return [];
  const rows = extractRows(raw).filter((r) => r && r.isActive !== false);
  const slots: AvailableSlot[] = [];
  for (let i = 0; i < DAYS_IN_WEEK; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const dayName = DAY_NAMES[day.getDay()];
    const date = toDateStr(day);
    const seen = new Set<string>();
    rows
      .filter((r) => normalizeDay(r.dayOfWeek) === dayName)
      .map((r) => ({ startTime: toHhMm(r.startTime), endTime: toHhMm(r.endTime) }))
      .filter((s) => s.startTime && s.endTime && s.endTime > s.startTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .forEach((s) => {
        if (seen.has(s.startTime)) return;
        seen.add(s.startTime);
        const startAt = new Date(`${date}T${s.startTime}:00`);
        slots.push({ date, ...s, isAvailable: startAt.getTime() > now.getTime() });
      });
  }
  return slots;
}

/** 공통코드 CONSULTATION_TYPE 활성 행 중 sortOrder 최소값. 없으면 null(하드코딩 기본값 없음). */
export function pickDefaultConsultationType(raw: unknown): ConsultationTypeOption | null {
  const rows = extractRows(raw);
  const active = rows
    .filter((c) => c && c.codeValue && c.isActive !== false)
    .slice()
    .sort((a, b) => {
      const sa = typeof a.sortOrder === 'number' ? a.sortOrder : Number.MAX_SAFE_INTEGER;
      const sb = typeof b.sortOrder === 'number' ? b.sortOrder : Number.MAX_SAFE_INTEGER;
      return sa - sb;
    });
  const first = active[0];
  if (!first) return null;
  const label = first.koreanName ?? first.codeLabel ?? first.codeValue;
  return { value: String(first.codeValue), label: String(label) };
}

/** 가예약 신청 본문. clientId·결제 수단은 넣지 않는다. */
export function buildCreateBookingRequest(input: {
  consultantId: string | number;
  date: string;
  startTime: string;
  endTime: string;
  consultationType: string;
  memo?: string;
}): CreateBookingRequest {
  const consultantId = Number(input.consultantId);
  if (!Number.isFinite(consultantId) || consultantId <= 0) {
    throw new Error('상담사 정보가 올바르지 않습니다.');
  }
  if (!input.consultationType) {
    throw new Error('상담 유형을 불러오지 못했습니다.');
  }
  const body: CreateBookingRequest = {
    consultantId,
    date: input.date,
    startTime: toHhMm(input.startTime),
    endTime: toHhMm(input.endTime),
    consultationType: input.consultationType,
  };
  const memo = input.memo?.trim();
  if (memo) body.memo = memo;
  return body;
}
