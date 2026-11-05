/**
 * 내담자 홈 「다음 한 장」로비 — presentation helpers (API 계약 변경 없음)
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { SoftChipItem } from '@/components/molecules/softChipRibbonLayout';
import {
  resolvePaymentChipTone,
  resolvePaymentChipValue,
} from '@/components/molecules/softChipRibbonLayout';
import { CLIENT_HOME_COPY } from '@/constants/clientHomeCopy';

/**
 * letterbox.ts `LETTERBOX_ACTIVATION_WIDTH` / `LAYOUT_TABLET_DEVICE_WIDTH` 와 동일.
 * letterbox → loginAnimationConstants → react-native 체인으로 Jest(node)가 깨지지 않도록
 * 숫자만 로컬 미러 (값 변경 시 letterbox SSOT와 함께 맞출 것).
 */
const LOBBY_TABLET_MIN_WIDTH = 744;

export interface LobbyUpcomingLike {
  readonly date?: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly consultantName?: string;
  readonly consultationType?: string;
  readonly daysUntil?: number;
  readonly notes?: string;
  readonly memo?: string;
  readonly status?: string;
}

export function formatLobbyTodayLabel(now: Date = new Date()): string {
  return format(now, 'M월 d일 EEEE', { locale: ko });
}

export function formatLobbyGreetingSubtitle(params: {
  readonly todayLabel: string;
  readonly upcoming: LobbyUpcomingLike | null | undefined;
}): string {
  const { todayLabel, upcoming } = params;
  if (upcoming == null) {
    return `${todayLabel} · ${CLIENT_HOME_COPY.NO_UPCOMING_META}`;
  }
  const days = upcoming.daysUntil;
  if (typeof days === 'number' && Number.isFinite(days)) {
    if (days <= 0) {
      return `${todayLabel} · ${CLIENT_HOME_COPY.UPCOMING_TODAY_META}`;
    }
    return `${todayLabel} · ${CLIENT_HOME_COPY.daysUntilMeta(days)}`;
  }
  return todayLabel;
}

export function formatLobbyDatetime(upcoming: LobbyUpcomingLike): string {
  const datePart = upcoming.date
    ? format(parseISO(`${upcoming.date}T12:00:00`), 'M월 d일 EEEE', { locale: ko })
    : CLIENT_HOME_COPY.FALLBACK_MUTE;
  const timePart = formatLobbyClock(upcoming.startTime);
  if (!timePart) {
    return datePart;
  }
  return `${datePart} · ${timePart}`;
}

export function formatLobbyClock(time: string | undefined): string {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length < 2) return time;
  const hour = Number(parts[0]);
  const minute = parts[1]!;
  if (!Number.isFinite(hour)) return `${parts[0]}:${minute}`;
  const period = hour < 12 ? '오전' : '오후';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${h12}:${minute}`;
}

export function formatLobbyDurationMinutes(
  startTime: string | undefined,
  endTime: string | undefined,
): string | null {
  if (!startTime || !endTime) return null;
  try {
    const start = parseISO(`1970-01-01T${normalizeTime(startTime)}`);
    const end = parseISO(`1970-01-01T${normalizeTime(endTime)}`);
    const mins = differenceInMinutes(end, start);
    if (!Number.isFinite(mins) || mins <= 0) return null;
    return `${mins}분`;
  } catch {
    return null;
  }
}

function normalizeTime(time: string): string {
  const t = time.trim();
  return t.length === 5 ? `${t}:00` : t;
}

export function formatLobbyModeLabel(consultationType: string | undefined): string {
  if (!consultationType || !consultationType.trim()) {
    return CLIENT_HOME_COPY.FALLBACK_MUTE;
  }
  const raw = consultationType.trim();
  const upper = raw.toUpperCase();
  if (upper.includes('FACE') || raw.includes('대면')) return '대면';
  if (upper.includes('ONLINE') || upper.includes('VIDEO') || raw.includes('화상') || raw.includes('비대면')) {
    return '화상';
  }
  if (upper.includes('PHONE') || raw.includes('전화')) return '전화';
  return raw;
}

export function formatLobbyMeta(upcoming: LobbyUpcomingLike): string {
  const name =
    upcoming.consultantName && upcoming.consultantName.trim().length > 0
      ? `${upcoming.consultantName.trim()} 상담사`
      : CLIENT_HOME_COPY.FALLBACK_CONSULTANT;
  const duration = formatLobbyDurationMinutes(upcoming.startTime, upcoming.endTime);
  const mode = formatLobbyModeLabel(upcoming.consultationType);
  return [name, duration, mode].filter(Boolean).join(' · ');
}

export function formatLobbyNextReservationChip(upcoming: LobbyUpcomingLike | null | undefined): string {
  if (upcoming == null) {
    return CLIENT_HOME_COPY.CHIP_NEXT_NONE;
  }
  const mode = formatLobbyModeLabel(upcoming.consultationType);
  const status =
    upcoming.status === 'CONFIRMED' || upcoming.status === 'BOOKED'
      ? '확정'
      : upcoming.status === 'SCHEDULED'
        ? '예정'
        : '확정';
  if (mode === CLIENT_HOME_COPY.FALLBACK_MUTE) {
    return status;
  }
  return `${status} · ${mode}`;
}

export function buildLobbySoftChips(params: {
  readonly remainingSessions: number;
  readonly upcoming: LobbyUpcomingLike | null | undefined;
}): SoftChipItem[] {
  const { remainingSessions, upcoming } = params;
  const counselor =
    upcoming?.consultantName && upcoming.consultantName.trim().length > 0
      ? upcoming.consultantName.trim()
      : CLIENT_HOME_COPY.FALLBACK_CONSULTANT_SHORT;

  return [
    {
      id: 'next',
      label: CLIENT_HOME_COPY.CHIP_NEXT_LABEL,
      value: formatLobbyNextReservationChip(upcoming),
      tone: 'peach',
    },
    {
      id: 'remaining',
      label: CLIENT_HOME_COPY.CHIP_REMAINING_LABEL,
      value: `${remainingSessions}${CLIENT_HOME_COPY.UNIT_SESSION_PACKAGE}`,
      tone: 'mint',
      badge: remainingSessions > 0 ? CLIENT_HOME_COPY.CHIP_PACKAGE_BADGE : undefined,
    },
    {
      id: 'counselor',
      label: CLIENT_HOME_COPY.CHIP_COUNSELOR_LABEL,
      value: counselor,
      tone: 'lavender',
    },
    {
      id: 'payment',
      label: CLIENT_HOME_COPY.CHIP_PAYMENT_LABEL,
      value: resolvePaymentChipValue(remainingSessions),
      tone: resolvePaymentChipTone(remainingSessions),
    },
  ];
}

export function truncateLobbyTip(text: string | undefined, maxLen = 48): string {
  if (!text || !text.trim()) {
    return CLIENT_HOME_COPY.TIP_FALLBACK;
  }
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

/**
 * 태블릿 가로: letterbox 임계(≥744) + width > height
 */
export function isLobbyTabletLandscape(width: number, height: number): boolean {
  return width >= LOBBY_TABLET_MIN_WIDTH && width > height;
}
