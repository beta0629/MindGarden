/**
 * 날짜 포맷 유틸리티
 * date-fns 기반 — 한국어 상대 시간 표시
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  format,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';

/** Spring LocalDateTime / Instant 등 ISO 프리픽스 식별용 */
const COMMUNITY_LISTED_TIME_ISO_PREFIX = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/;

/** 나노초 이하를 밀리초 3자리로 자름 (Z / 오프셋 보존) */
const COMMUNITY_LISTED_TIME_NANO_TRIM = /(\.\d{3})\d+/;

const COMMUNITY_LISTED_TIME_LOCAL_DT =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * Hermes·date-fns가 나노초 LocalDateTime을 못 읽을 때 밀리초 3자리·수동 파싱으로 정규화
 */
export function normalizeCommunityListedTimeIso(trimmed: string): string {
  let s = trimmed.replace(COMMUNITY_LISTED_TIME_NANO_TRIM, '$1');
  const m = s.match(COMMUNITY_LISTED_TIME_LOCAL_DT);
  if (m) {
    const frac = m[7];
    const tz = m[8];
    if (frac && frac.length > 3) {
      const ms = frac.slice(0, 3);
      s = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.${ms}${tz ?? ''}`;
    }
  }
  return s;
}

function parseCommunityListedDate(normalized: string): Date | null {
  let date = parseISO(normalized);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  const m = normalized.match(COMMUNITY_LISTED_TIME_LOCAL_DT);
  if (!m) {
    return null;
  }
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = Number(m[6]);
  const frac = m[7];
  const ms = frac ? Number(frac.slice(0, 3).padEnd(3, '0')) : 0;
  const manual = new Date(year, month, day, hour, minute, second, ms);
  return Number.isNaN(manual.getTime()) ? null : manual;
}

/**
 * 커뮤니티 목록/피드용 시간: ISO면 나노초 정리 후 상대·짧은 표시, 그 외는 그대로
 *
 * @param raw 원시 또는 이미 가공된 라벨
 * @param fallback 빈 문자열·파싱 불가 시 (원문 ISO 노출 금지)
 */
export function formatCommunityListedTime(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return fallback;
  }
  if (!COMMUNITY_LISTED_TIME_ISO_PREFIX.test(trimmed)) {
    return trimmed;
  }
  const normalized = normalizeCommunityListedTimeIso(trimmed);
  const date = parseCommunityListedDate(normalized);
  if (date == null) {
    return fallback;
  }
  if (Number.isNaN(parseISO(normalized).getTime())) {
    return format(date, 'M/d HH:mm');
  }
  return formatRelativeTime(normalized);
}

/**
 * ISO 문자열 → 상대 시간 (방금, n분 전, n시간 전, 어제, MM/dd)
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
  const now = new Date();

  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = differenceInHours(now, date);
  if (hours < 24 && isToday(date)) return `${hours}시간 전`;

  if (isYesterday(date)) return '어제';

  const days = differenceInDays(now, date);
  if (days < 7) return `${days}일 전`;

  return format(date, 'MM/dd');
}

/**
 * ISO 문자열 → 시간 (오전/오후 h:mm)
 */
export function formatMessageTime(dateString: string): string {
  const date = parseISO(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${period} ${displayHours}:${displayMinutes}`;
}

/**
 * ISO 문자열 → 날짜 구분선용 (yyyy년 M월 d일 E요일)
 */
export function formatDateSeparator(dateString: string): string {
  const date = parseISO(dateString);
  if (isToday(date)) return '오늘';
  if (isYesterday(date)) return '어제';
  return format(date, 'yyyy년 M월 d일');
}

/**
 * 두 날짜가 같은 날인지 비교
 */
export function isSameDay(date1: string, date2: string): boolean {
  const d1 = parseISO(date1);
  const d2 = parseISO(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
