/**
 * Client Dashboard — 일정·표시 유틸
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

/** ISO 날짜·시간 문자열 기준 정렬용 */
export function scheduleSortKey(schedule) {
  const d = schedule?.date || '';
  const t = schedule?.startTime || '00:00';
  return `${d}T${t}`;
}

export function formatScheduleCardDateTime(schedule) {
  if (!schedule?.date) return '—';
  const d = new Date(schedule.date);
  if (Number.isNaN(d.getTime())) return '—';
  const w = d.toLocaleDateString('ko-KR', { weekday: 'short' });
  const md = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  const time = schedule.startTime ? String(schedule.startTime) : '';
  return time ? `${md} (${w}) ${time}` : `${md} (${w})`;
}

export function parseUnreadCountPayload(raw) {
  if (raw == null) return 0;
  if (typeof raw === 'object' && typeof raw.unreadCount === 'number') {
    return raw.unreadCount;
  }
  return 0;
}

export function getGreetingPrefix(t) {
  const hour = new Date().getHours();
  if (hour < 12) return t('common:client.ClientDashboard.t_69c40d10');
  if (hour < 18) return t('common:client.ClientDashboard.t_2f3e0450');
  return t('common:client.ClientDashboard.t_c626e85b');
}
