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
