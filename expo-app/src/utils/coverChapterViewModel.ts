/**
 * 커버+챕터 v4 표시용 뷰모델 — API 계약 비변경, 표시 reshape 전용.
 *
 * 내담자 미결제 집계는 웹 `lobbyViewModel.countPendingPaymentMappings`,
 * 계약 유형 해석은 웹 `mappingEngagementType.resolveMappingEngagementType` 과 동일 규칙.
 * 데이터가 없으면 값을 만들어 내지 않는다(빈 상태는 화면이 정직하게 표시).
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { differenceInCalendarDays, format, isValid, parseISO, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Schedule } from '@/api/hooks/useSchedules';
import { CONSULTANT_COVER_COPY } from '@/constants/consultantHomeCopy';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import { stripHtmlToPlainText, toDisplayString } from '@/utils/safeDisplay';

// ---------------------------------------------------------------------------
// 계약 유형(기관연계)
// ---------------------------------------------------------------------------

export const ENGAGEMENT_TYPE = {
  SESSION_TICKET: 'SESSION_TICKET',
  INSTITUTION_LINK: 'INSTITUTION_LINK',
  VOUCHER: 'VOUCHER',
} as const;

export type EngagementType = (typeof ENGAGEMENT_TYPE)[keyof typeof ENGAGEMENT_TYPE];

const ENGAGEMENT_SOURCE_KEYS = [
  'engagementType',
  'mappingEngagementType',
  'clientEngagementType',
  'paymentTiming',
] as const;

const ENGAGEMENT_NESTED_KEYS = ['mapping', 'mappingInfo'] as const;

/**
 * @param value engagementType / paymentTiming 원값
 * @returns 정규화된 계약 유형, 해당 없음이면 null
 */
export function normalizeEngagementType(value: unknown): EngagementType | null {
  if (typeof value !== 'string') {
    return null;
  }
  const upper = value.trim().toUpperCase();
  if (upper === ENGAGEMENT_TYPE.INSTITUTION_LINK) {
    return ENGAGEMENT_TYPE.INSTITUTION_LINK;
  }
  if (upper === ENGAGEMENT_TYPE.VOUCHER) {
    return ENGAGEMENT_TYPE.VOUCHER;
  }
  if (upper === ENGAGEMENT_TYPE.SESSION_TICKET) {
    return ENGAGEMENT_TYPE.SESSION_TICKET;
  }
  return null;
}

function collectEngagementCandidates(source: unknown): unknown[] {
  if (source == null || typeof source !== 'object') {
    return [];
  }
  const bag = source as Record<string, unknown>;
  const out: unknown[] = ENGAGEMENT_SOURCE_KEYS.map((k) => bag[k]);
  for (const nestedKey of ENGAGEMENT_NESTED_KEYS) {
    const nested = bag[nestedKey];
    if (nested != null && typeof nested === 'object') {
      const n = nested as Record<string, unknown>;
      out.push(...ENGAGEMENT_SOURCE_KEYS.map((k) => n[k]));
    }
  }
  return out;
}

/**
 * 일정·매핑 행에서 계약 유형을 해석한다. 회기 수로 추정하지 않는다.
 *
 * @param source 일정·매핑 객체 또는 원값 문자열
 * @returns INSTITUTION_LINK | VOUCHER | SESSION_TICKET | null
 */
export function resolveEngagementType(source: unknown): EngagementType | null {
  if (typeof source === 'string') {
    return normalizeEngagementType(source);
  }
  const candidates = collectEngagementCandidates(source).map(normalizeEngagementType);
  const special = candidates.find(
    (c) => c === ENGAGEMENT_TYPE.INSTITUTION_LINK || c === ENGAGEMENT_TYPE.VOUCHER,
  );
  if (special) {
    return special;
  }
  return candidates.includes(ENGAGEMENT_TYPE.SESSION_TICKET)
    ? ENGAGEMENT_TYPE.SESSION_TICKET
    : null;
}

/**
 * 「기관연계」 배지 라벨. 필드가 없거나 기관연계가 아니면 null (점·약어로 대체하지 않음).
 *
 * @param source 일정·매핑 객체
 * @returns `기관연계` 또는 null
 */
export function resolveInstitutionBadgeLabel(source: unknown): string | null {
  return resolveEngagementType(source) === ENGAGEMENT_TYPE.INSTITUTION_LINK
    ? COVER_CHAPTER_COPY.INSTITUTION_LINK_BADGE
    : null;
}

// ---------------------------------------------------------------------------
// 내담자 미결제·회기
// ---------------------------------------------------------------------------

const MAPPING_STATUS_PENDING_PAYMENT = 'PENDING_PAYMENT';
const PAYMENT_STATUS_PENDING = 'PENDING';

/**
 * 웹 `countPendingPaymentMappings` 이식 — 매핑 status PENDING_PAYMENT 또는 paymentStatus PENDING.
 *
 * @param mappings 매핑 배열 (비배열이면 0)
 * @returns 미결제 매핑 수
 */
export function countPendingPaymentMappings(mappings: unknown): number {
  if (!Array.isArray(mappings)) {
    return 0;
  }
  return mappings.filter((m) => {
    if (m == null || typeof m !== 'object') {
      return false;
    }
    const row = m as Record<string, unknown>;
    return (
      row.status === MAPPING_STATUS_PENDING_PAYMENT || row.paymentStatus === PAYMENT_STATUS_PENDING
    );
  }).length;
}

export interface SessionProgressInput {
  totalSessions?: number | null;
  usedSessions?: number | null;
  remainingSessions?: number | null;
}

export interface SessionProgressView {
  readonly hasBalance: boolean;
  readonly total: number;
  readonly used: number;
  readonly remaining: number;
  /** 0~1 — 사용(완료) 비율 */
  readonly usedRatio: number;
  readonly remainingLabel: string;
  readonly totalLabel: string;
}

const PROGRESS_LABEL_PAD = 2;

function toNonNegativeInt(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.trunc(n));
}

/**
 * @param input 매핑 집계(aggregateSessionBalance) 결과
 * @returns 진행 바·「06 / 10회」 라벨용 뷰
 */
export function buildSessionProgress(input: SessionProgressInput): SessionProgressView {
  const total = toNonNegativeInt(input.totalSessions);
  const remainingRaw = toNonNegativeInt(input.remainingSessions);
  const remaining = total > 0 ? Math.min(remainingRaw, total) : remainingRaw;
  const usedRaw = toNonNegativeInt(input.usedSessions);
  const used = total > 0 ? Math.min(usedRaw, total) : usedRaw;
  return {
    hasBalance: total > 0,
    total,
    used,
    remaining,
    usedRatio: total > 0 ? used / total : 0,
    remainingLabel: String(remaining).padStart(PROGRESS_LABEL_PAD, '0'),
    totalLabel: String(total).padStart(PROGRESS_LABEL_PAD, '0'),
  };
}

// ---------------------------------------------------------------------------
// 날짜·시간
// ---------------------------------------------------------------------------

function parseYmd(dateYmd: string | null | undefined): Date | null {
  const raw = toDisplayString(dateYmd, '').slice(0, 10);
  if (!raw) {
    return null;
  }
  const d = parseISO(`${raw}T12:00:00`);
  return isValid(d) ? d : null;
}

/**
 * @param startTime `HH:mm[:ss]`
 * @returns `HH:mm` (해석 불가 시 빈 문자열)
 */
export function formatClock(startTime: string | null | undefined): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(toDisplayString(startTime, '').trim());
  if (!m) {
    return '';
  }
  return `${m[1]!.padStart(2, '0')}:${m[2]}`;
}

/**
 * @param dateYmd yyyy-MM-dd
 * @param now 기준 시각
 * @returns 오늘 0 · 내일 1 · 과거 음수, 해석 불가 null
 */
export function daysFromToday(dateYmd: string | null | undefined, now: Date): number | null {
  const d = parseYmd(dateYmd);
  if (!d) {
    return null;
  }
  return differenceInCalendarDays(startOfDay(d), startOfDay(now));
}

/**
 * @returns `오늘` · `내일` · `11월 19일 (목)`
 */
export function formatRelativeDayLabel(dateYmd: string | null | undefined, now: Date): string {
  const days = daysFromToday(dateYmd, now);
  if (days === 0) {
    return COVER_CHAPTER_COPY.TODAY;
  }
  if (days === 1) {
    return COVER_CHAPTER_COPY.TOMORROW;
  }
  const d = parseYmd(dateYmd);
  return d ? format(d, COVER_CHAPTER_COPY.DATE_SHORT_PATTERN, { locale: ko }) : '';
}

/**
 * @returns `다음 상담 · 오늘`
 */
export function formatHeroEyebrow(dateYmd: string | null | undefined, now: Date): string {
  const label = formatRelativeDayLabel(dateYmd, now);
  return label ? COVER_CHAPTER_COPY.heroEyebrow(label) : COVER_CHAPTER_COPY.NEXT_SESSION_LABEL;
}

/**
 * 일정 챕터 히어로 머리말 — `오늘, 11월 6일 금요일` / `11월 19일 목요일`
 */
export function formatChapterDateHeading(dateYmd: string | null | undefined, now: Date): string {
  const d = parseYmd(dateYmd);
  if (!d) {
    return COVER_CHAPTER_COPY.NEXT_SESSION_LABEL;
  }
  const body = format(d, COVER_CHAPTER_COPY.DATE_LONG_PATTERN, { locale: ko });
  const days = daysFromToday(dateYmd, now);
  if (days === 0) {
    return `${COVER_CHAPTER_COPY.TODAY}, ${body}`;
  }
  if (days === 1) {
    return `${COVER_CHAPTER_COPY.TOMORROW}, ${body}`;
  }
  return body;
}

export interface ListDateParts {
  readonly primary: string;
  readonly secondary: string;
}

/**
 * @returns `{ primary: '11.19', secondary: '목요일' }` (해석 불가 시 빈 문자열)
 */
export function formatListDateParts(dateYmd: string | null | undefined): ListDateParts {
  const d = parseYmd(dateYmd);
  if (!d) {
    return { primary: '', secondary: '' };
  }
  return {
    primary: format(d, 'MM.dd'),
    secondary: format(d, 'EEEE', { locale: ko }),
  };
}

/**
 * 알림 행 우측 시각 — `오늘 16:20` · `어제` · `10.29`
 */
export function formatNotificationTime(createdAt: string | null | undefined, now: Date): string {
  const raw = toDisplayString(createdAt, '').trim();
  if (!raw) {
    return '';
  }
  const d = parseISO(raw.replace(' ', 'T'));
  if (!isValid(d)) {
    return '';
  }
  const days = differenceInCalendarDays(startOfDay(d), startOfDay(now));
  if (days === 0) {
    return `${COVER_CHAPTER_COPY.TODAY} ${format(d, 'HH:mm')}`;
  }
  if (days === -1) {
    return COVER_CHAPTER_COPY.YESTERDAY;
  }
  return format(d, 'MM.dd');
}

function clockToMinutes(clock: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(toDisplayString(clock, '').trim());
  if (!m) {
    return null;
  }
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * @returns 시작·종료로 계산한 상담 길이(분), 계산 불가 시 null
 */
export function resolveDurationMinutes(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): number | null {
  const s = clockToMinutes(startTime);
  const e = clockToMinutes(endTime);
  if (s == null || e == null || e <= s) {
    return null;
  }
  return e - s;
}

// ---------------------------------------------------------------------------
// 일정 표시 문자열
// ---------------------------------------------------------------------------

/**
 * @returns 이름 첫 글자 (빈 이름이면 빈 문자열)
 */
export function resolveNameInitial(name: string | null | undefined): string {
  const s = toDisplayString(name, '').trim();
  return s ? Array.from(s)[0]! : '';
}

function sessionNumberLabel(s: Pick<Schedule, 'sessionNumber'>): string {
  const n = s.sessionNumber;
  return typeof n === 'number' && Number.isFinite(n) && n > 0
    ? COVER_CHAPTER_COPY.sessionNumber(n)
    : '';
}

/**
 * 목록 행 제목 — `개인상담 · 6회차`
 */
export function buildSessionTitle(s: Pick<Schedule, 'consultationType' | 'sessionNumber'>): string {
  return [toDisplayString(s.consultationType, ''), sessionNumberLabel(s)]
    .filter(Boolean)
    .join(' · ');
}

/**
 * 히어로 보조 줄 — `개인상담 5회차 · 대면 2상담실`
 */
export function buildHeroDetail(
  s: Pick<Schedule, 'consultationType' | 'sessionNumber' | 'location'>,
): string {
  const head = [toDisplayString(s.consultationType, ''), sessionNumberLabel(s)]
    .filter(Boolean)
    .join(' ');
  return [head, toDisplayString(s.location, '').trim()].filter(Boolean).join(' · ');
}

/**
 * 예정 목록 보조 줄 — `19:00 · 대면 1상담실`
 */
export function buildUpcomingRowDetail(s: Pick<Schedule, 'startTime' | 'location'>): string {
  return [formatClock(s.startTime), toDisplayString(s.location, '').trim()]
    .filter(Boolean)
    .join(' · ');
}

/**
 * 지난 목록 보조 줄 — `완료 · 50분 · 대면 2상담실`
 */
export function buildPastRowDetail(
  s: Pick<Schedule, 'startTime' | 'endTime' | 'location'>,
): string {
  const minutes = resolveDurationMinutes(s.startTime, s.endTime);
  return [
    COVER_CHAPTER_COPY.COMPLETED,
    minutes != null ? COVER_CHAPTER_COPY.minutes(minutes) : '',
    toDisplayString(s.location, '').trim(),
  ]
    .filter(Boolean)
    .join(' · ');
}

// ---------------------------------------------------------------------------
// 히어로
// ---------------------------------------------------------------------------

export interface CoverHeroView {
  readonly scheduleId: number;
  readonly eyebrow: string;
  readonly clock: string;
  readonly personLabel: string;
  readonly detail: string;
  readonly badgeLabel: string | null;
}

export interface CoverHeroInput {
  readonly scheduleId: number;
  readonly date: string;
  readonly startTime: string;
  readonly personLabel: string;
  readonly detail: string;
  readonly engagementSource?: unknown;
}

/**
 * 히어로 뷰 — 결제·미결제 정보는 의도적으로 포함하지 않는다.
 */
export function buildCoverHero(input: CoverHeroInput, now: Date): CoverHeroView {
  return {
    scheduleId: input.scheduleId,
    eyebrow: formatHeroEyebrow(input.date, now),
    clock: formatClock(input.startTime),
    personLabel: input.personLabel,
    detail: input.detail,
    badgeLabel: resolveInstitutionBadgeLabel(input.engagementSource),
  };
}

// ---------------------------------------------------------------------------
// 내담자 목록 분리
// ---------------------------------------------------------------------------

const INACTIVE_STATUSES = new Set<Schedule['status']>(['COMPLETED', 'CANCELLED', 'NO_SHOW']);

function scheduleSortKey(s: Pick<Schedule, 'date' | 'startTime'>): string {
  return `${toDisplayString(s.date, '').slice(0, 10)}T${formatClock(s.startTime) || '00:00'}`;
}

export interface ClientSessionLists {
  readonly upcoming: Schedule[];
  readonly past: Schedule[];
  readonly upcomingTotal: number;
  readonly pastTotal: number;
}

/**
 * 예정(가까운 순)·지난(최근 순) 분리. 히어로 일정은 예정 목록에서 뺀다.
 *
 * @param schedules 내담자 일정 전체
 * @param heroScheduleId 히어로에 노출 중인 일정 ID
 * @param limits 섹션별 최대 행 수 (미지정 시 전체)
 */
export function splitClientSessionLists(
  schedules: readonly Schedule[],
  heroScheduleId: number | null,
  limits: { upcomingMax?: number; pastMax?: number } = {},
): ClientSessionLists {
  const upcomingAll = schedules
    .filter((s) => !INACTIVE_STATUSES.has(s.status) && s.id !== heroScheduleId)
    .sort((a, b) => scheduleSortKey(a).localeCompare(scheduleSortKey(b)));
  const pastAll = schedules
    .filter((s) => s.status === 'COMPLETED')
    .sort((a, b) => scheduleSortKey(b).localeCompare(scheduleSortKey(a)));
  return {
    upcoming: limits.upcomingMax != null ? upcomingAll.slice(0, limits.upcomingMax) : upcomingAll,
    past: limits.pastMax != null ? pastAll.slice(0, limits.pastMax) : pastAll,
    upcomingTotal: upcomingAll.length,
    pastTotal: pastAll.length,
  };
}

// ---------------------------------------------------------------------------
// 상담사 오늘 일정
// ---------------------------------------------------------------------------

function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * 진행 중 판정 — status IN_PROGRESS 이거나, 오늘 일정이며 시작~종료 사이(완료·취소 제외).
 */
export function isScheduleInProgress(s: Schedule, now: Date): boolean {
  if (s.status === 'IN_PROGRESS') {
    return true;
  }
  if (INACTIVE_STATUSES.has(s.status) || daysFromToday(s.date, now) !== 0) {
    return false;
  }
  const start = clockToMinutes(s.startTime);
  const end = clockToMinutes(s.endTime);
  const cur = nowMinutes(now);
  return start != null && end != null && start <= cur && cur < end;
}

export interface CounselorTodaySummary {
  readonly total: number;
  readonly completed: number;
  readonly inProgress: number;
  readonly scheduled: number;
}

/**
 * 오늘 일정 상태 요약 (취소·노쇼는 total 에서 제외)
 */
export function summarizeCounselorToday(
  schedules: readonly Schedule[],
  now: Date,
): CounselorTodaySummary {
  const active = schedules.filter((s) => s.status !== 'CANCELLED' && s.status !== 'NO_SHOW');
  const completed = active.filter((s) => s.status === 'COMPLETED').length;
  const inProgress = active.filter((s) => isScheduleInProgress(s, now)).length;
  return {
    total: active.length,
    completed,
    inProgress,
    scheduled: Math.max(0, active.length - completed - inProgress),
  };
}

export interface CounselorTodaySplit {
  readonly inProgress: Schedule | null;
  readonly upcoming: Schedule[];
}

/**
 * 「지금 진행 중」 1건 + 「이후 일정」(시작 전, 히어로 제외)
 */
export function splitCounselorToday(
  schedules: readonly Schedule[],
  heroScheduleId: number | null,
  now: Date,
): CounselorTodaySplit {
  const inProgress =
    schedules.find((s) => s.id !== heroScheduleId && isScheduleInProgress(s, now)) ?? null;
  const cur = nowMinutes(now);
  const upcoming = schedules
    .filter((s) => {
      if (s.id === heroScheduleId || s.id === inProgress?.id || INACTIVE_STATUSES.has(s.status)) {
        return false;
      }
      if (s.status === 'IN_PROGRESS') {
        return false;
      }
      const start = clockToMinutes(s.startTime);
      return start == null || start > cur;
    })
    .sort((a, b) => scheduleSortKey(a).localeCompare(scheduleSortKey(b)));
  return { inProgress, upcoming };
}

/** `useUpcomingPreparation` 응답 중 히어로에 필요한 필드 */
export interface CounselorHeroSource {
  readonly scheduleId: number;
  readonly clientName: string;
  readonly sessionDate: string;
  readonly startTime: string;
  readonly sessionNumber?: number;
  readonly consultationType?: string;
}

function counselorPersonLabel(clientName: string | null | undefined): string {
  const name = toDisplayString(clientName, '').trim();
  return name ? CONSULTANT_COVER_COPY.clientLabel(name) : '';
}

/**
 * 상담사 다음 상담 히어로 — 준비 API 응답 우선, 없으면 오늘 시작 전 첫 일정.
 * 둘 다 없으면 null (화면은 빈 상태). 금액·결제 정보는 포함하지 않는다.
 *
 * @param preparation 다음 상담 준비 응답
 * @param todaySchedules 오늘 일정 (계약 유형·장소 보강용)
 * @param now 기준 시각
 */
export function buildCounselorHero(
  preparation: CounselorHeroSource | null | undefined,
  todaySchedules: readonly Schedule[],
  now: Date,
): CoverHeroView | null {
  if (preparation) {
    const match = todaySchedules.find((s) => s.id === preparation.scheduleId);
    return buildCoverHero(
      {
        scheduleId: preparation.scheduleId,
        date: preparation.sessionDate,
        startTime: preparation.startTime,
        personLabel: counselorPersonLabel(preparation.clientName),
        detail: buildHeroDetail({
          consultationType: preparation.consultationType ?? match?.consultationType ?? '',
          sessionNumber: preparation.sessionNumber ?? match?.sessionNumber,
          location: match?.location,
        }),
        engagementSource: match ?? preparation,
      },
      now,
    );
  }
  const next = splitCounselorToday(todaySchedules, null, now).upcoming[0];
  if (!next) {
    return null;
  }
  return buildCoverHero(
    {
      scheduleId: next.id,
      date: next.date,
      startTime: next.startTime,
      personLabel: counselorPersonLabel(next.clientName),
      detail: buildHeroDetail(next),
      engagementSource: next,
    },
    now,
  );
}

/**
 * 상담사 오늘 일정 행 보조 줄 — `개인상담 · 6회차 · 대면 1상담실`
 */
export function buildCounselorRowDetail(
  s: Pick<Schedule, 'consultationType' | 'sessionNumber' | 'location'>,
): string {
  return [buildSessionTitle(s), toDisplayString(s.location, '').trim()].filter(Boolean).join(' · ');
}

// ---------------------------------------------------------------------------
// 알림 행
// ---------------------------------------------------------------------------

export type CoverNotificationVariant = 'plain' | 'warn';

export type CoverNotificationTarget =
  | { readonly kind: 'notifications' }
  | { readonly kind: 'records' }
  | { readonly kind: 'client'; readonly clientId: number };

export interface CoverNotificationRow {
  readonly key: string;
  readonly title: string;
  readonly timeLabel: string;
  readonly unread: boolean;
  readonly variant: CoverNotificationVariant;
  readonly target: CoverNotificationTarget;
}

export interface CoverNotificationSource {
  readonly id: number;
  readonly type: string;
  readonly title: string;
  readonly content?: string;
  readonly isRead: boolean;
  readonly createdAt: string;
}

/** 상담사 화면에 금액·결제 정보가 새지 않도록 거르는 패턴 */
const MONEY_TEXT_PATTERN = /미결제|결제|입금|환불|금액|급여|정산|수납|청구|\d[\d,]*\s*원/;
const PAYMENT_NOTIFICATION_TYPE = 'PAYMENT';

export const COVER_NOTIFICATION_ROW_MAX = 2;

/**
 * @returns 결제·금액 관련 문구 포함 여부
 */
export function containsMoneyText(text: string | null | undefined): boolean {
  return MONEY_TEXT_PATTERN.test(toDisplayString(text, ''));
}

/**
 * 상담사 홈 노출 가능 알림인지 (결제 타입·금액 문구 제외)
 */
export function isCounselorSafeNotification(n: CoverNotificationSource): boolean {
  return (
    String(n.type).toUpperCase() !== PAYMENT_NOTIFICATION_TYPE &&
    !containsMoneyText(n.title) &&
    !containsMoneyText(n.content)
  );
}

function toPlainRow(n: CoverNotificationSource, now: Date): CoverNotificationRow {
  return {
    key: `notification-${n.id}`,
    title: toDisplayString(n.title, ''),
    timeLabel: formatNotificationTime(n.createdAt, now),
    unread: !n.isRead,
    variant: 'plain',
    target: { kind: 'notifications' },
  };
}

/**
 * `useNotifications` 무한 쿼리 페이지 → 알림 행 원천 배열 (첫 페이지만 사용).
 */
export function toCoverNotificationSources(
  pages: readonly { readonly content: readonly CoverNotificationSource[] }[] | undefined,
): CoverNotificationSource[] {
  return pages?.[0]?.content ? [...pages[0].content] : [];
}

/**
 * 내담자 홈 알림 행 — 최신순 상위 N 개(서버 정렬 유지).
 */
export function buildClientNotificationRows(
  notifications: readonly CoverNotificationSource[],
  now: Date,
  max: number = COVER_NOTIFICATION_ROW_MAX,
): CoverNotificationRow[] {
  return notifications
    .filter((n) => toDisplayString(n.title, '') !== '')
    .slice(0, max)
    .map((n) => toPlainRow(n, now));
}

export interface CounselorNotificationInput {
  readonly pendingJournalCount: number;
  readonly urgentClient?: {
    readonly clientId: number;
    readonly clientName: string;
    readonly riskLabel: string;
  } | null;
  readonly notifications: readonly CoverNotificationSource[];
  readonly now: Date;
  readonly max?: number;
}

/**
 * 상담사 홈 알림 행 — 일지 미작성은 warn(rose) 행으로 맨 위, 나머지는 흰 plain 행.
 * 결제·금액 관련 알림은 제외한다.
 */
export function buildCounselorNotificationRows(
  input: CounselorNotificationInput,
): CoverNotificationRow[] {
  const max = input.max ?? COVER_NOTIFICATION_ROW_MAX;
  const rows: CoverNotificationRow[] = [];
  const pending = toNonNegativeInt(input.pendingJournalCount);
  if (pending > 0) {
    rows.push({
      key: 'warn-missing-journal',
      title: CONSULTANT_COVER_COPY.missingJournalRow(pending),
      timeLabel: '',
      unread: true,
      variant: 'warn',
      target: { kind: 'records' },
    });
  }
  const plain: CoverNotificationRow[] = [];
  if (input.urgentClient) {
    plain.push({
      key: `urgent-client-${input.urgentClient.clientId}`,
      title: CONSULTANT_COVER_COPY.urgentClientRow(
        input.urgentClient.clientName,
        input.urgentClient.riskLabel,
      ),
      timeLabel: '',
      unread: true,
      variant: 'plain',
      target: { kind: 'client', clientId: input.urgentClient.clientId },
    });
  }
  for (const n of input.notifications) {
    if (toDisplayString(n.title, '') !== '' && isCounselorSafeNotification(n)) {
      plain.push(toPlainRow(n, input.now));
    }
  }
  return [...rows, ...plain.slice(0, max)];
}

// ---------------------------------------------------------------------------
// 소식 배너 (system-notifications/active)
// ---------------------------------------------------------------------------

export interface ActiveSystemNotice {
  readonly id: number;
  readonly title: string;
  readonly content: string;
  readonly notificationType: string;
  readonly isImportant: boolean;
  readonly isUrgent: boolean;
  readonly isRead: boolean;
  readonly publishedAt: string;
}

/**
 * `ApiResponse<List<Map>>` 또는 배열 원본을 공지 배열로 정규화한다.
 */
export function normalizeActiveSystemNotices(raw: unknown): ActiveSystemNotice[] {
  let rows: unknown = raw;
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    rows = (raw as Record<string, unknown>).data;
  }
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((r) => ({
      id: Number(r.id),
      title: stripHtmlToPlainText(toDisplayString(r.title, '')).trim(),
      content: stripHtmlToPlainText(toDisplayString(r.content, '')).trim(),
      notificationType: toDisplayString(r.notificationType, '').toUpperCase(),
      isImportant: r.isImportant === true,
      isUrgent: r.isUrgent === true,
      isRead: r.isRead === true,
      publishedAt: toDisplayString(r.publishedAt ?? r.createdAt, ''),
    }))
    .filter((n) => Number.isFinite(n.id) && n.id > 0 && n.title !== '');
}

export interface CoverNewsBannerView {
  readonly id: number;
  readonly chip: string;
  readonly title: string;
  readonly subtitle: string;
}

const CAMPAIGN_NOTICE_TYPES = new Set(['CAMPAIGN', 'EVENT', 'PROMOTION']);

function noticeRank(n: ActiveSystemNotice): number {
  return (n.isUrgent ? 4 : 0) + (n.isImportant ? 2 : 0) + (n.isRead ? 0 : 1);
}

/**
 * 활성 공지 중 배너 1건 선택. 없으면 null → 섹션 숨김.
 *
 * @param notices 활성 공지
 * @param role 상담사는 결제·금액 문구 공지를 제외한다
 */
export function pickCoverNewsBanner(
  notices: readonly ActiveSystemNotice[],
  role: 'CLIENT' | 'CONSULTANT',
): CoverNewsBannerView | null {
  const eligible =
    role === 'CONSULTANT'
      ? notices.filter((n) => !containsMoneyText(n.title) && !containsMoneyText(n.content))
      : [...notices];
  if (eligible.length === 0) {
    return null;
  }
  const best = [...eligible].sort((a, b) => {
    const diff = noticeRank(b) - noticeRank(a);
    return diff !== 0 ? diff : b.publishedAt.localeCompare(a.publishedAt);
  })[0]!;
  return {
    id: best.id,
    chip: CAMPAIGN_NOTICE_TYPES.has(best.notificationType)
      ? COVER_CHAPTER_COPY.BANNER_CHIP_CAMPAIGN
      : COVER_CHAPTER_COPY.BANNER_CHIP_NEWS,
    title: best.title,
    subtitle: best.content.split('\n').find((line) => line.trim() !== '') ?? '',
  };
}

// ---------------------------------------------------------------------------
// 헤더
// ---------------------------------------------------------------------------

/**
 * 브랜드 헤더 우측 지점 라벨 — 비었거나 브랜드명과 같으면 null.
 */
export function resolveBranchLabel(tenantName: string | null | undefined): string | null {
  const name = toDisplayString(tenantName, '').trim();
  if (!name || name === COVER_CHAPTER_COPY.BRAND_NAME) {
    return null;
  }
  return name;
}

// ---------------------------------------------------------------------------
// 레이아웃
// ---------------------------------------------------------------------------

export type CoverLayoutMode = 'phone' | 'tabletPortrait' | 'tabletLandscape';

/**
 * @param width 창 폭(pt)
 * @param height 창 높이(pt)
 * @param tabletMinWidth 태블릿 임계 폭 (letterbox 활성 임계와 동일 값 전달)
 */
export function resolveCoverLayoutMode(
  width: number,
  height: number,
  tabletMinWidth: number,
): CoverLayoutMode {
  if (width < tabletMinWidth) {
    return 'phone';
  }
  return width > height ? 'tabletLandscape' : 'tabletPortrait';
}
