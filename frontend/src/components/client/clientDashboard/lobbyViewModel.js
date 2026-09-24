/**
 * Client Lobby v4 — 표시용 뷰모델 헬퍼 (API 계약 비변경 · FE reshape only)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import {
  resolveShopPackageType,
  SHOP_PACKAGE_TYPE
} from '../../../utils/shopSessionCount';
import { renderCompactPackageName } from '../../../utils/packagePricing';
import {
  MAPPING_STATUS,
  countsTowardClientRemainingSessions,
  isAssignedMappingStatus,
  resolveMappingConsultantDisplayName
} from '../../../constants/mapping';
import {
  CLIENT_DEFAULT_CONSULTANT_LABEL,
  CLIENT_LOBBY_CHIP_PACKAGE,
  CLIENT_LOBBY_CHIP_SINGLE,
  CLIENT_LOBBY_DEFAULT_DURATION_MIN,
  CLIENT_LOBBY_FALLBACK_METHOD,
  CLIENT_LOBBY_HERO_PRIORITY,
  CLIENT_LOBBY_LIST_MAX,
  CLIENT_LOBBY_METHOD_LABELS,
  CLIENT_LOBBY_PACKAGE_FALLBACK,
  CLIENT_LOBBY_SINGLE_LABEL
} from './constants';

export {
  resolveClientWebBrandLabels,
  resolveLobbyBrandLabels
} from '../../../utils/clientWebBrandLabels';

const MS_PER_DAY = 24 * 60 * 60 * 1000;


/**
 * @param {Date} [now]
 * @returns {string}
 */
export function formatLobbyTodayEyebrow(now = new Date()) {
  const md = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  const wd = now.toLocaleDateString('ko-KR', { weekday: 'long' });
  return `오늘 · ${md} ${wd}`;
}

/**
 * @param {string|undefined} startTime HH:mm
 * @returns {string}
 */
export function formatLobbyAmPmTime(startTime) {
  const raw = toDisplayString(startTime, '');
  if (!raw) {
    return '';
  }
  const parts = raw.split(':');
  const hour = Number(parts[0]);
  const minute = parts[1] != null ? String(parts[1]).padStart(2, '0') : '00';
  if (!Number.isFinite(hour)) {
    return raw;
  }
  const period = hour < 12 ? '오전' : '오후';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${h12}:${minute}`;
}

/**
 * @param {object} schedule
 * @returns {string}
 */
export function formatLobbyDateTime(schedule) {
  if (!schedule?.date) {
    return '—';
  }
  const d = new Date(schedule.date);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  const md = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  const wd = d.toLocaleDateString('ko-KR', { weekday: 'long' });
  const time = formatLobbyAmPmTime(schedule.startTime);
  return time ? `${md} ${wd} · ${time}` : `${md} ${wd}`;
}

/**
 * @param {object} schedule
 * @returns {{ day: string, month: string }}
 */
export function formatLobbyListDateParts(schedule) {
  if (!schedule?.date) {
    return { day: '—', month: '' };
  }
  const d = new Date(schedule.date);
  if (Number.isNaN(d.getTime())) {
    return { day: '—', month: '' };
  }
  return {
    day: String(d.getDate()),
    month: `${d.getMonth() + 1}월`
  };
}

/**
 * @param {object} schedule
 * @returns {number}
 */
export function resolveScheduleDurationMinutes(schedule) {
  const raw = schedule?.durationMinutes ?? schedule?.duration ?? schedule?.sessionDuration;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) {
    return n;
  }
  const start = toDisplayString(schedule?.startTime, '');
  const end = toDisplayString(schedule?.endTime, '');
  if (start && end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].every(Number.isFinite)) {
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins > 0) {
        return mins;
      }
    }
  }
  return CLIENT_LOBBY_DEFAULT_DURATION_MIN;
}

/**
 * @param {object} schedule
 * @returns {string}
 */
export function resolveConsultationMethodLabel(schedule) {
  const code = toDisplayString(
    schedule?.consultationMethod
      || schedule?.sessionMode
      || schedule?.meetingType
      || schedule?.consultationType
      || '',
    ''
  ).toUpperCase();
  if (CLIENT_LOBBY_METHOD_LABELS[code]) {
    return CLIENT_LOBBY_METHOD_LABELS[code];
  }
  if (schedule?.isOnline === true || schedule?.online === true) {
    return CLIENT_LOBBY_METHOD_LABELS.VIDEO;
  }
  if (code && !/CONSULT|COUNSEL|SESSION|INDIVIDUAL|FAMILY|INITIAL|COUPLE|GROUP/.test(code)) {
    return toDisplayString(schedule?.consultationMethod || schedule?.consultationType, CLIENT_LOBBY_FALLBACK_METHOD);
  }
  return CLIENT_LOBBY_FALLBACK_METHOD;
}

/**
 * @param {object} schedule
 * @returns {string}
 */
export function resolveScheduleConsultantName(schedule) {
  return toDisplayString(
    schedule?.consultantName || schedule?.consultant?.name || schedule?.consultant?.consultantName,
    CLIENT_DEFAULT_CONSULTANT_LABEL
  );
}

/**
 * @param {string} name
 * @returns {string}
 */
export function resolveNameInitial(name) {
  const s = toDisplayString(name, '').trim();
  return s ? s.charAt(0) : '·';
}

/**
 * @param {object} schedule
 * @returns {string}
 */
export function resolveCenterMemo(schedule) {
  const memo = toDisplayString(
    schedule?.centerMemo || schedule?.adminMemo || schedule?.notes || schedule?.memo,
    ''
  ).trim();
  return memo;
}

/**
 * @param {string|Date} scheduleDate
 * @param {Date} [now]
 * @returns {number}
 */
export function daysUntilSchedule(scheduleDate, now = new Date()) {
  const a = new Date(now);
  a.setHours(0, 0, 0, 0);
  const b = new Date(scheduleDate);
  b.setHours(0, 0, 0, 0);
  if (Number.isNaN(b.getTime())) {
    return 0;
  }
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/**
 * @param {object} params
 * @param {object|null} params.nextSchedule
 * @param {number} params.remainingSessions
 * @param {boolean} params.hasAssignedConsultant
 * @param {boolean} params.hasPendingPayment
 * @returns {string}
 */
export function resolveHeroPriority({
  nextSchedule,
  remainingSessions,
  hasAssignedConsultant,
  hasPendingPayment
}) {
  if (nextSchedule) {
    return CLIENT_LOBBY_HERO_PRIORITY.NEXT_APPOINTMENT;
  }
  if (toSafeNumber(remainingSessions) === 0) {
    return CLIENT_LOBBY_HERO_PRIORITY.ZERO_SESSIONS;
  }
  if (!hasAssignedConsultant) {
    return CLIENT_LOBBY_HERO_PRIORITY.CONSULTANT_UNASSIGNED;
  }
  if (hasPendingPayment) {
    return CLIENT_LOBBY_HERO_PRIORITY.PENDING_PAYMENT;
  }
  return CLIENT_LOBBY_HERO_PRIORITY.QUIET_DAY;
}

/**
 * @param {Array} mappings
 * @returns {{ showPackage: boolean, showSingle: boolean, packageRemaining: number, singleRemaining: number, rows: Array<{ id: string, name: string, remaining: number }> }}
 */
export function buildSessionChipAndBalance(mappings) {
  // 홈·회기 SSOT: ACTIVE + PAYMENT_CONFIRMED(+DEPOSIT_* paid-eligible) rem 합산
  const active = (Array.isArray(mappings) ? mappings : []).filter(
    (m) => countsTowardClientRemainingSessions(m?.status)
  );

  let packageRemaining = 0;
  let singleRemaining = 0;
  const rows = [];

  active.forEach((mapping, idx) => {
    const total = toSafeNumber(mapping.totalSessions);
    const rem = toSafeNumber(mapping.remainingSessions);
    const type = resolveShopPackageType(total);
    if (type === SHOP_PACKAGE_TYPE.SINGLE) {
      singleRemaining += rem;
    } else {
      packageRemaining += rem;
      const nameNode = mapping.packageName
        ? renderCompactPackageName(mapping.packageName)
        : CLIENT_LOBBY_PACKAGE_FALLBACK;
      const name = typeof nameNode === 'string'
        ? nameNode
        : toDisplayString(mapping.packageName, CLIENT_LOBBY_PACKAGE_FALLBACK);
      rows.push({
        id: String(mapping.id || `pkg-${idx}`),
        name,
        remaining: rem
      });
    }
  });

  if (singleRemaining > 0 || active.some((m) => resolveShopPackageType(m.totalSessions) === SHOP_PACKAGE_TYPE.SINGLE)) {
    rows.push({
      id: 'single-sessions',
      name: CLIENT_LOBBY_SINGLE_LABEL,
      remaining: singleRemaining
    });
  }

  return {
    showPackage: packageRemaining > 0 || rows.some((r) => r.id !== 'single-sessions'),
    showSingle: singleRemaining > 0
      || active.some((m) => resolveShopPackageType(m.totalSessions) === SHOP_PACKAGE_TYPE.SINGLE),
    packageRemaining,
    singleRemaining,
    chips: [
      ...(packageRemaining > 0 || active.some((m) => resolveShopPackageType(m.totalSessions) === SHOP_PACKAGE_TYPE.PACKAGE)
        ? [CLIENT_LOBBY_CHIP_PACKAGE]
        : []),
      ...(singleRemaining > 0 || active.some((m) => resolveShopPackageType(m.totalSessions) === SHOP_PACKAGE_TYPE.SINGLE)
        ? [CLIENT_LOBBY_CHIP_SINGLE]
        : [])
    ],
    rows
  };
}

/**
 * @param {Array} mappings
 * @returns {{ pending: boolean, recentLabel: string|null, recentDateLabel: string|null }}
 */
export function resolvePaymentStatusSummary(mappings) {
  const list = Array.isArray(mappings) ? mappings : [];
  const hasPending = list.some(
    (m) => m?.status === MAPPING_STATUS.PENDING_PAYMENT || m?.paymentStatus === 'PENDING'
  );

  const withDate = list
    .filter((m) => m?.paymentDate)
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  if (hasPending) {
    return { pending: true, recentLabel: null, recentDateLabel: null };
  }

  if (withDate.length === 0) {
    return { pending: false, recentLabel: null, recentDateLabel: null };
  }

  const latest = withDate[0];
  const d = new Date(latest.paymentDate);
  const recentDateLabel = Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  return {
    pending: false,
    recentLabel: '최근 완료',
    recentDateLabel
  };
}

/**
 * @param {Array} schedules
 * @returns {Array}
 */
export function buildLobbyUpcomingList(schedules) {
  if (!Array.isArray(schedules)) {
    return [];
  }
  return schedules.slice(0, CLIENT_LOBBY_LIST_MAX).map((schedule, idx) => {
    const consultantName = resolveScheduleConsultantName(schedule);
    const duration = resolveScheduleDurationMinutes(schedule);
    const method = resolveConsultationMethodLabel(schedule);
    const dateParts = formatLobbyListDateParts(schedule);
    const time = formatLobbyAmPmTime(schedule.startTime);
    const memo = resolveCenterMemo(schedule);
    return {
      id: schedule.id || `lobby-upcoming-${idx}`,
      isNext: idx === 0,
      day: dateParts.day,
      month: dateParts.month,
      title: time ? `${time} · ${consultantName} 상담사` : `${consultantName} 상담사`,
      subtitle: `${duration}분 · ${method}`,
      memo: memo ? `센터 메모 · ${memo}` : '',
      badge: idx === 0 ? '다음' : '예정'
    };
  });
}

/**
 * @param {object} params
 * @returns {string}
 */
export function buildGreetingWhenLine({ nextSchedule, now = new Date() }) {
  if (!nextSchedule?.date) {
    return '조용한 하루입니다';
  }
  const days = daysUntilSchedule(nextSchedule.date, now);
  if (days === 0) {
    return '오늘 상담이 있습니다';
  }
  if (days === 1) {
    return '다음 상담까지 1일 · 조용한 하루입니다';
  }
  if (days > 1) {
    return `다음 상담까지 ${days}일 · 조용한 하루입니다`;
  }
  return '조용한 하루입니다';
}

/**
 * @param {object|null} primaryMapping
 * @param {object|null} clientStatus
 * @returns {boolean}
 */
export function hasAssignedConsultant(primaryMapping, clientStatus) {
  if (resolveMappingConsultantDisplayName(primaryMapping)) {
    return true;
  }
  return isAssignedMappingStatus(clientStatus?.mappingStatus);
}
