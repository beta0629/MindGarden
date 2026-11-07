/**
 * HARVEST harness fixtures — 커버/챕터 v4 시각 하네스 전용 (앱 라우트·번들에 포함되지 않음).
 *
 * 값은 실제 API 응답 모양(Schedule · 알림 페이지 · system-notifications/active · 상담사 준비/일지)을
 * 그대로 따르고, 화면 표시값은 전부 `coverChapterViewModel` 빌더로만 만든다.
 * 뷰 빌더는 `useClientCoverData` · `useCoverInbox` · 상담사 홈 화면의 파생 로직과 1:1 로 맞춘다.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import type { UpcomingConsultation } from '@/api/hooks/useConsultations';
import type { Schedule } from '@/api/hooks/useSchedules';
import { CLIENT_COVER_COPY } from '@/constants/clientHomeCopy';
import { CONSULTANT_COVER_COPY, CONSULTANT_HOME_COPY } from '@/constants/consultantHomeCopy';
import type {
  HighPriorityClientItem,
  IncompleteRecordsData,
  UpcomingPreparationSession,
} from '@/utils/consultantHomeApiNormalize';
import { resolveConsultantPendingCount } from '@/utils/consultantHomeKpi';
import {
  buildClientNotificationRows,
  buildCounselorHero,
  buildCounselorNotificationRows,
  buildCoverHero,
  buildHeroDetail,
  buildSessionProgress,
  normalizeActiveSystemNotices,
  pickCoverNewsBanner,
  resolveBranchLabel,
  splitClientSessionLists,
  splitCounselorToday,
  summarizeCounselorToday,
  type ClientSessionLists,
  type CounselorTodaySplit,
  type CounselorTodaySummary,
  type CoverHeroView,
  type CoverNewsBannerView,
  type CoverNotificationRow,
  type CoverNotificationSource,
  type SessionProgressView,
} from '@/utils/coverChapterViewModel';

export const HARNESS_FIXTURE_TAG = 'HARVEST harness fixture';

/** 2026-11-06(금) 15:00 로컬 — 하네스·단위 테스트 공통 기준 시각 */
export const HARNESS_NOW_PARTS = [2026, 10, 6, 15, 0, 0] as const;

export function harnessNow(): Date {
  const [y, m, d, h, mi, s] = HARNESS_NOW_PARTS;
  return new Date(y, m, d, h, mi, s);
}

export const HARNESS_LONG_KOREAN_NAME = '김수한무거북이와두루미삼천갑자동방삭치치카포';

// ---------------------------------------------------------------------------
// 원천 모양
// ---------------------------------------------------------------------------

export interface ClientDashboardShape {
  readonly totalSessions: number;
  readonly usedSessions: number;
  readonly remainingSessions: number;
  readonly pendingPaymentCount: number;
}

export interface ClientHarnessFixture {
  readonly id: string;
  readonly tag: typeof HARNESS_FIXTURE_TAG;
  readonly userName: string | null;
  readonly tenantName: string | null;
  readonly upcoming: UpcomingConsultation | null;
  readonly dashboard: ClientDashboardShape | null;
  readonly schedules: readonly Schedule[];
  readonly notificationPages: readonly { readonly content: readonly CoverNotificationSource[] }[];
  /** system-notifications/active 의 ApiResponse 원본 */
  readonly activeNoticesRaw: unknown;
  readonly unreadCount: number;
  readonly hasMorePast: boolean;
}

export interface CounselorHarnessFixture {
  readonly id: string;
  readonly tag: typeof HARNESS_FIXTURE_TAG;
  readonly userName: string | null;
  readonly todaySchedules: readonly Schedule[];
  readonly preparation: UpcomingPreparationSession | null;
  readonly incomplete: IncompleteRecordsData;
  readonly pendingRecordsLength: number | undefined;
  readonly dashboardPendingRecordCount: number;
  readonly urgentClients: readonly HighPriorityClientItem[];
  readonly notificationPages: readonly { readonly content: readonly CoverNotificationSource[] }[];
  readonly activeNoticesRaw: unknown;
  readonly unreadCount: number;
}

function schedule(partial: Partial<Schedule> & Pick<Schedule, 'id'>): Schedule {
  return {
    consultantId: 10,
    clientId: 20,
    clientName: '김하늘',
    consultantName: '이지은',
    date: '2026-11-06',
    startTime: '16:00',
    endTime: '16:50',
    status: 'CONFIRMED',
    consultationType: '개인상담',
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// 내담자
// ---------------------------------------------------------------------------

const CLIENT_HERO_SCHEDULE: UpcomingConsultation = {
  ...schedule({
    id: 501,
    date: '2026-11-06',
    startTime: '16:00',
    endTime: '16:50',
    sessionNumber: 5,
    location: '대면 2상담실',
    engagementType: 'INSTITUTION_LINK',
  }),
  daysUntil: 0,
};

const CLIENT_SCHEDULES: readonly Schedule[] = [
  CLIENT_HERO_SCHEDULE,
  schedule({
    id: 502,
    date: '2026-11-13',
    startTime: '19:00',
    endTime: '19:50',
    sessionNumber: 6,
    location: '대면 1상담실',
    engagementType: 'INSTITUTION_LINK',
  }),
  schedule({
    id: 503,
    date: '2026-11-20',
    startTime: '19:00',
    endTime: '19:50',
    sessionNumber: 7,
    location: '비대면',
    engagementType: 'SESSION_TICKET',
  }),
  schedule({
    id: 498,
    date: '2026-10-30',
    startTime: '19:00',
    endTime: '19:50',
    status: 'COMPLETED',
    sessionNumber: 4,
    location: '대면 2상담실',
  }),
  schedule({
    id: 497,
    date: '2026-10-23',
    startTime: '19:00',
    endTime: '19:50',
    status: 'COMPLETED',
    sessionNumber: 3,
    location: '대면 2상담실',
  }),
];

const CLIENT_NOTIFICATIONS: readonly CoverNotificationSource[] = [
  {
    id: 9001,
    type: 'SCHEDULE',
    title: '오늘 16:00 상담이 확정되었어요',
    isRead: false,
    createdAt: '2026-11-06 09:20:00',
  },
  {
    id: 9000,
    type: 'MESSAGE',
    title: '이지은 상담사가 메시지를 보냈어요',
    isRead: true,
    createdAt: '2026-11-05 18:02:00',
  },
];

const CLIENT_ACTIVE_NOTICES_RAW = {
  success: true,
  data: [
    {
      id: 71,
      title: '11월 마음챙김 그룹 프로그램 안내',
      content: '매주 토요일 오전 10시 · 센터 3층',
      notificationType: 'CAMPAIGN',
      isImportant: true,
      isUrgent: false,
      isRead: false,
      publishedAt: '2026-11-01 09:00:00',
    },
  ],
};

export const CLIENT_LIVE_FIXTURE: ClientHarnessFixture = {
  id: 'client-live',
  tag: HARNESS_FIXTURE_TAG,
  userName: '김하늘',
  tenantName: '마인드가든 강남센터',
  upcoming: CLIENT_HERO_SCHEDULE,
  dashboard: { totalSessions: 10, usedSessions: 4, remainingSessions: 6, pendingPaymentCount: 1 },
  schedules: CLIENT_SCHEDULES,
  notificationPages: [{ content: CLIENT_NOTIFICATIONS }],
  activeNoticesRaw: CLIENT_ACTIVE_NOTICES_RAW,
  unreadCount: 1,
  hasMorePast: false,
};

export const CLIENT_EMPTY_FIXTURE: ClientHarnessFixture = {
  id: 'client-empty',
  tag: HARNESS_FIXTURE_TAG,
  userName: '김하늘',
  tenantName: null,
  upcoming: null,
  dashboard: null,
  schedules: [],
  notificationPages: [{ content: [] }],
  activeNoticesRaw: { success: true, data: [] },
  unreadCount: 0,
  hasMorePast: false,
};

export const CLIENT_LONG_NAME_FIXTURE: ClientHarnessFixture = {
  ...CLIENT_LIVE_FIXTURE,
  id: 'client-long-name',
  userName: HARNESS_LONG_KOREAN_NAME,
  tenantName: '마인드가든 서울특별시 강남구 테헤란로 심리상담센터 본점',
  upcoming: {
    ...CLIENT_HERO_SCHEDULE,
    consultantName: '남궁선우리별하늘바다',
  },
};

// ---------------------------------------------------------------------------
// 상담사
// ---------------------------------------------------------------------------

const COUNSELOR_TODAY: readonly Schedule[] = [
  schedule({
    id: 801,
    clientName: '박서준',
    date: '2026-11-06',
    startTime: '10:00',
    endTime: '10:50',
    status: 'COMPLETED',
    sessionNumber: 3,
    location: '대면 1상담실',
  }),
  schedule({
    id: 802,
    clientName: '최유나',
    date: '2026-11-06',
    startTime: '14:30',
    endTime: '15:20',
    status: 'IN_PROGRESS',
    sessionNumber: 8,
    location: '대면 2상담실',
  }),
  schedule({
    id: 803,
    clientName: '김하늘',
    date: '2026-11-06',
    startTime: '16:00',
    endTime: '16:50',
    sessionNumber: 5,
    location: '대면 2상담실',
    engagementType: 'INSTITUTION_LINK',
  }),
  schedule({
    id: 804,
    clientName: '정민호',
    date: '2026-11-06',
    startTime: '17:30',
    endTime: '18:20',
    sessionNumber: 2,
    location: '비대면',
    paymentTiming: 'INSTITUTION_LINK',
  }),
  schedule({
    id: 805,
    clientName: '한소희',
    date: '2026-11-06',
    startTime: '19:00',
    endTime: '19:50',
    sessionNumber: 11,
    location: '대면 1상담실',
  }),
];

/** 상담사 화면으로 새면 안 되는 결제·금액 알림이 섞인 원천 */
const COUNSELOR_NOTIFICATIONS: readonly CoverNotificationSource[] = [
  {
    id: 9101,
    type: 'PAYMENT',
    title: '김하늘 님 미결제 1건 (55,000원)',
    isRead: false,
    createdAt: '2026-11-06 11:00:00',
  },
  {
    id: 9100,
    type: 'SCHEDULE',
    title: '17:30 정민호 님 상담이 비대면으로 변경되었어요',
    isRead: false,
    createdAt: '2026-11-06 08:40:00',
  },
  {
    id: 9099,
    type: 'SYSTEM',
    title: '10월 급여 정산이 완료되었어요',
    isRead: true,
    createdAt: '2026-11-05 10:00:00',
  },
];

const COUNSELOR_ACTIVE_NOTICES_RAW = {
  success: true,
  data: [
    {
      id: 81,
      title: '11월 상담료 정산 일정 안내',
      content: '정산 금액은 25일 지급됩니다.',
      notificationType: 'GENERAL',
      isImportant: true,
      isUrgent: true,
      isRead: false,
      publishedAt: '2026-11-03 09:00:00',
    },
    {
      id: 80,
      title: '상담실 예약 시스템 점검 안내',
      content: '11월 8일(일) 02:00 ~ 04:00',
      notificationType: 'GENERAL',
      isImportant: false,
      isUrgent: false,
      isRead: false,
      publishedAt: '2026-11-02 09:00:00',
    },
  ],
};

export const COUNSELOR_LIVE_FIXTURE: CounselorHarnessFixture = {
  id: 'counselor-live',
  tag: HARNESS_FIXTURE_TAG,
  userName: '이지은',
  todaySchedules: COUNSELOR_TODAY,
  preparation: {
    scheduleId: 803,
    clientId: 20,
    clientName: '김하늘',
    sessionDate: '2026-11-06',
    startTime: '16:00',
    endTime: '16:50',
    sessionNumber: 5,
    consultationType: '개인상담',
    isToday: true,
  },
  incomplete: {
    count: 2,
    records: [
      {
        scheduleId: 801,
        clientId: 31,
        clientName: '박서준',
        sessionDate: '2026-11-06',
        sessionNumber: 3,
      },
      {
        scheduleId: 790,
        clientId: 32,
        clientName: '오지민',
        sessionDate: '2026-11-05',
        sessionNumber: 6,
      },
    ],
  },
  pendingRecordsLength: 2,
  dashboardPendingRecordCount: 2,
  urgentClients: [{ clientId: 33, clientName: '서도윤', riskLevel: 'HIGH' }],
  notificationPages: [{ content: COUNSELOR_NOTIFICATIONS }],
  activeNoticesRaw: COUNSELOR_ACTIVE_NOTICES_RAW,
  unreadCount: 3,
};

export const COUNSELOR_EMPTY_FIXTURE: CounselorHarnessFixture = {
  id: 'counselor-empty',
  tag: HARNESS_FIXTURE_TAG,
  userName: '이지은',
  todaySchedules: [],
  preparation: null,
  incomplete: { count: 0, records: [] },
  pendingRecordsLength: 0,
  dashboardPendingRecordCount: 0,
  urgentClients: [],
  notificationPages: [{ content: [] }],
  activeNoticesRaw: { success: true, data: [] },
  unreadCount: 0,
};

export const CLIENT_FIXTURES = {
  'client-live': CLIENT_LIVE_FIXTURE,
  'client-empty': CLIENT_EMPTY_FIXTURE,
  'client-long-name': CLIENT_LONG_NAME_FIXTURE,
} as const;

export const COUNSELOR_FIXTURES = {
  'counselor-live': COUNSELOR_LIVE_FIXTURE,
  'counselor-empty': COUNSELOR_EMPTY_FIXTURE,
} as const;

export type ClientFixtureId = keyof typeof CLIENT_FIXTURES;
export type CounselorFixtureId = keyof typeof COUNSELOR_FIXTURES;

// ---------------------------------------------------------------------------
// 뷰 빌더 — 화면 파생 로직과 동일
// ---------------------------------------------------------------------------

export interface ClientHarnessView {
  readonly displayName: string;
  readonly branchLabel: string | null;
  readonly heroSchedule: UpcomingConsultation | null;
  readonly hero: CoverHeroView | null;
  readonly progress: SessionProgressView;
  readonly progressDetail: string;
  readonly unpaidCount: number;
  readonly lists: ClientSessionLists;
  readonly hasMorePast: boolean;
  readonly banner: CoverNewsBannerView | null;
  readonly notificationRows: CoverNotificationRow[];
  readonly unreadCount: number;
}

/** `useClientCoverData` + `useCoverInbox('CLIENT')` + 내담자 홈의 파생 */
export function buildClientHarnessView(f: ClientHarnessFixture, now: Date): ClientHarnessView {
  const heroSchedule = f.upcoming;
  const hero = heroSchedule
    ? buildCoverHero(
        {
          scheduleId: heroSchedule.id,
          date: heroSchedule.date,
          startTime: heroSchedule.startTime,
          personLabel: CLIENT_COVER_COPY.consultantLabel(heroSchedule.consultantName),
          detail: buildHeroDetail(heroSchedule),
          engagementSource: heroSchedule,
        },
        now,
      )
    : null;
  const progress = buildSessionProgress({
    totalSessions: f.dashboard?.totalSessions,
    usedSessions: f.dashboard?.usedSessions,
    remainingSessions: f.dashboard?.remainingSessions,
  });
  const nextSessionNumber =
    typeof heroSchedule?.sessionNumber === 'number' ? heroSchedule.sessionNumber : null;
  const notices = normalizeActiveSystemNotices(f.activeNoticesRaw);
  const sources = f.notificationPages[0]?.content ? [...f.notificationPages[0].content] : [];
  return {
    displayName: f.userName?.trim() || CLIENT_COVER_COPY.NAME_FALLBACK,
    branchLabel: resolveBranchLabel(f.tenantName),
    heroSchedule,
    hero,
    progress,
    progressDetail: CLIENT_COVER_COPY.progressDetail(progress.used, nextSessionNumber),
    unpaidCount: f.dashboard?.pendingPaymentCount ?? 0,
    lists: splitClientSessionLists(f.schedules, heroSchedule?.id ?? null),
    hasMorePast: f.hasMorePast,
    banner: pickCoverNewsBanner(notices, 'CLIENT'),
    notificationRows: buildClientNotificationRows(sources, now),
    unreadCount: f.unreadCount,
  };
}

export interface CounselorHarnessView {
  readonly displayName: string;
  readonly hero: CoverHeroView | null;
  readonly today: CounselorTodaySplit;
  readonly summary: CounselorTodaySummary;
  readonly pendingCount: number;
  readonly records: IncompleteRecordsData['records'];
  readonly banner: CoverNewsBannerView | null;
  readonly notificationRows: CoverNotificationRow[];
  readonly unreadCount: number;
}

/** 상담사 홈(`app/(consultant)/(home)/index.tsx`) + `useCoverInbox('CONSULTANT')` 의 파생 */
export function buildCounselorHarnessView(
  f: CounselorHarnessFixture,
  now: Date,
): CounselorHarnessView {
  const schedules = f.todaySchedules;
  const hero = buildCounselorHero(f.preparation, schedules, now);
  const pendingCount = resolveConsultantPendingCount(
    f.incomplete.count,
    f.pendingRecordsLength,
    f.dashboardPendingRecordCount,
  );
  const urgent = f.urgentClients[0] ?? null;
  const notices = normalizeActiveSystemNotices(f.activeNoticesRaw);
  const sources = f.notificationPages[0]?.content ? [...f.notificationPages[0].content] : [];
  return {
    displayName: f.userName?.trim() || CONSULTANT_COVER_COPY.NAME_FALLBACK,
    hero,
    today: splitCounselorToday(schedules, hero?.scheduleId ?? null, now),
    summary: summarizeCounselorToday(schedules, now),
    pendingCount,
    records: f.incomplete.records,
    banner: pickCoverNewsBanner(notices, 'CONSULTANT'),
    notificationRows: buildCounselorNotificationRows({
      pendingJournalCount: pendingCount,
      urgentClient: urgent
        ? {
            clientId: urgent.clientId,
            clientName: urgent.clientName,
            riskLabel: CONSULTANT_HOME_COPY.riskLevelLabel(urgent.riskLevel),
          }
        : null,
      notifications: sources,
      now,
    }),
    unreadCount: f.unreadCount,
  };
}
