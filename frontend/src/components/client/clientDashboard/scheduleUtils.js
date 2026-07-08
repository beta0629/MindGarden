/**
 * Client Dashboard — 일정·표시 유틸
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CLIENT_DEFAULT_CONSULTANT_LABEL,
  CLIENT_DEFAULT_CONSULTATION_TYPE,
  CLIENT_DEFAULT_PACKAGE_LABEL,
  CLIENT_MAX_LIST_ROWS,
  CLIENT_PAYMENT_STATUS_LABELS,
  CLIENT_SCHEDULE_STATUS_LABELS,
  CLIENT_STATUS_FALLBACK_LABEL,
  CLIENT_UPCOMING_CTA_LABEL
} from './constants';

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

/** 백엔드 상태코드 → 표시 라벨 (판정은 코드 그대로) */
export function resolveScheduleStatusLabel(status) {
  if (!status) return CLIENT_STATUS_FALLBACK_LABEL;
  return CLIENT_SCHEDULE_STATUS_LABELS[status] || String(status);
}

export function resolvePaymentStatusLabel(status) {
  if (!status) return CLIENT_STATUS_FALLBACK_LABEL;
  return CLIENT_PAYMENT_STATUS_LABELS[status] || String(status);
}

export function formatCurrencyKRW(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return CLIENT_STATUS_FALLBACK_LABEL;
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
}

export function formatPaymentDate(dateString) {
  if (!dateString) return CLIENT_STATUS_FALLBACK_LABEL;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return CLIENT_STATUS_FALLBACK_LABEL;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function resolveConsultantName(entry) {
  return toDisplayString(
    entry?.consultantName || entry?.consultant?.name,
    CLIENT_DEFAULT_CONSULTANT_LABEL
  );
}

/** 다음 일정 ListTableView 행 */
export function buildUpcomingRows(schedules) {
  if (!Array.isArray(schedules)) return [];
  return schedules.slice(0, CLIENT_MAX_LIST_ROWS).map((schedule, idx) => ({
    id: schedule.id || `client-upcoming-${idx}`,
    scheduleId: schedule.id,
    datetimeLabel: formatScheduleCardDateTime(schedule),
    consultantName: resolveConsultantName(schedule),
    typeLabel: toDisplayString(
      schedule.consultationType || schedule.title,
      CLIENT_DEFAULT_CONSULTATION_TYPE
    ),
    statusLabel: resolveScheduleStatusLabel(schedule.status),
    cta: CLIENT_UPCOMING_CTA_LABEL
  }));
}

/** 최근 상담일지(완료 상담) ListTableView 행 */
export function buildCompletedRows(schedules) {
  if (!Array.isArray(schedules)) return [];
  return [...schedules]
    .sort((a, b) => (scheduleSortKey(a) < scheduleSortKey(b) ? 1 : -1))
    .slice(0, CLIENT_MAX_LIST_ROWS)
    .map((schedule, idx) => ({
      id: schedule.id || `client-completed-${idx}`,
      scheduleId: schedule.id,
      dateLabel: formatScheduleCardDateTime(schedule),
      consultantName: resolveConsultantName(schedule),
      statusLabel: resolveScheduleStatusLabel(schedule.status)
    }));
}

/** 결제 요약 ListTableView 행 (mappings 파생) */
export function buildPaymentRows(mappings) {
  if (!Array.isArray(mappings)) return [];
  return mappings
    .filter((mapping) => mapping.paymentDate)
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    .slice(0, CLIENT_MAX_LIST_ROWS)
    .map((mapping, idx) => ({
      id: mapping.id || `client-payment-${idx}`,
      paymentDateLabel: formatPaymentDate(mapping.paymentDate),
      packageName: toDisplayString(mapping.packageName, CLIENT_DEFAULT_PACKAGE_LABEL),
      amountLabel: formatCurrencyKRW(mapping.packagePrice),
      statusLabel: resolvePaymentStatusLabel(mapping.paymentStatus)
    }));
}
