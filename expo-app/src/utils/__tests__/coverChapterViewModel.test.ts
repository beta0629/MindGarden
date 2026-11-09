import type { Schedule } from '@/api/hooks/useSchedules';
import { CLIENT_COVER_COPY } from '@/constants/clientHomeCopy';
import { CONSULTANT_COVER_COPY } from '@/constants/consultantHomeCopy';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import {
  buildClientNotificationRows,
  buildCounselorHero,
  buildCounselorNotificationRows,
  buildCoverHero,
  buildPastRowDetail,
  buildSessionProgress,
  buildSessionTitle,
  containsMoneyText,
  countPendingPaymentMappings,
  formatChapterDateHeading,
  formatClock,
  formatHeroEyebrow,
  formatListDateParts,
  formatNotificationTime,
  normalizeActiveSystemNotices,
  pickCoverNewsBanner,
  resolveBranchLabel,
  resolveCoverLayoutMode,
  resolveDurationMinutes,
  resolveInstitutionBadgeLabel,
  resolveNameInitial,
  splitClientSessionLists,
  splitCounselorToday,
  summarizeCounselorToday,
  type ActiveSystemNotice,
  type CoverNotificationSource,
} from '../coverChapterViewModel';
import { pickScheduleEngagementFields } from '../scheduleEngagementFields';

/** 2026-11-06(금) 15:00 로컬 */
const NOW = new Date(2026, 10, 6, 15, 0, 0);
const TABLET_MIN_WIDTH = 744;

function makeSchedule(partial: Partial<Schedule>): Schedule {
  return {
    id: 1,
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
  } as Schedule;
}

function makeNotice(partial: Partial<ActiveSystemNotice>): ActiveSystemNotice {
  return {
    id: 1,
    title: '센터 휴무 안내',
    content: '11월 15일은 휴무입니다.',
    notificationType: 'GENERAL',
    isImportant: false,
    isUrgent: false,
    isRead: false,
    publishedAt: '2026-11-01T09:00:00',
    ...partial,
  };
}

function makeNotification(partial: Partial<CoverNotificationSource>): CoverNotificationSource {
  return {
    id: 1,
    type: 'SCHEDULE',
    title: '일정이 변경되었어요',
    isRead: false,
    createdAt: '2026-11-06T09:30:00',
    ...partial,
  };
}

describe('countPendingPaymentMappings', () => {
  it('PENDING_PAYMENT 상태 또는 paymentStatus PENDING 만 센다', () => {
    expect(
      countPendingPaymentMappings([
        { status: 'PENDING_PAYMENT' },
        { status: 'ACTIVE', paymentStatus: 'PENDING' },
        { status: 'ACTIVE', paymentStatus: 'APPROVED' },
        null,
        'x',
      ]),
    ).toBe(2);
  });

  it('배열이 아니면 0', () => {
    expect(countPendingPaymentMappings(undefined)).toBe(0);
    expect(countPendingPaymentMappings({ status: 'PENDING_PAYMENT' })).toBe(0);
    expect(countPendingPaymentMappings([])).toBe(0);
  });
});

describe('buildSessionProgress', () => {
  it('잔여/총 회기를 두 자리로 표시하고 사용 비율을 계산한다', () => {
    const p = buildSessionProgress({ totalSessions: 10, usedSessions: 4, remainingSessions: 6 });
    expect(p).toMatchObject({
      hasBalance: true,
      remainingLabel: '06',
      totalLabel: '10',
      usedRatio: 0.4,
    });
  });

  it('회기 데이터가 없으면 hasBalance=false (숫자를 만들어 내지 않음)', () => {
    const p = buildSessionProgress({});
    expect(p.hasBalance).toBe(false);
    expect(p.total).toBe(0);
    expect(p.usedRatio).toBe(0);
  });

  it('사용 회기가 총 회기를 넘으면 총 회기로 자른다', () => {
    const p = buildSessionProgress({ totalSessions: 5, usedSessions: 9, remainingSessions: 0 });
    expect(p.used).toBe(5);
    expect(p.usedRatio).toBe(1);
  });
});

describe('resolveInstitutionBadgeLabel', () => {
  it('engagementType INSTITUTION_LINK → 기관연계', () => {
    expect(resolveInstitutionBadgeLabel({ engagementType: 'INSTITUTION_LINK' })).toBe('기관연계');
  });

  it('paymentTiming INSTITUTION_LINK (소문자 포함) → 기관연계', () => {
    expect(resolveInstitutionBadgeLabel({ paymentTiming: ' institution_link ' })).toBe('기관연계');
  });

  it('중첩 mapping 필드도 해석한다', () => {
    expect(resolveInstitutionBadgeLabel({ mapping: { engagementType: 'INSTITUTION_LINK' } })).toBe(
      '기관연계',
    );
  });

  it('필드가 없거나 다른 유형이면 배지를 만들지 않는다', () => {
    expect(resolveInstitutionBadgeLabel({})).toBeNull();
    expect(resolveInstitutionBadgeLabel(null)).toBeNull();
    expect(resolveInstitutionBadgeLabel({ engagementType: 'SESSION_TICKET' })).toBeNull();
    expect(resolveInstitutionBadgeLabel({ engagementType: 'VOUCHER' })).toBeNull();
  });
});

describe('pickScheduleEngagementFields', () => {
  it('문자열 필드만 통과시키고 없으면 키를 생략한다', () => {
    expect(
      pickScheduleEngagementFields({ engagementType: 'INSTITUTION_LINK', paymentTiming: 7 }),
    ).toEqual({ engagementType: 'INSTITUTION_LINK' });
    expect(pickScheduleEngagementFields({})).toEqual({});
  });
});

describe('날짜·시간 포맷', () => {
  it('formatClock', () => {
    expect(formatClock('9:05:00')).toBe('09:05');
    expect(formatClock('')).toBe('');
    expect(formatClock(undefined)).toBe('');
  });

  it('formatHeroEyebrow — 오늘/내일/그 외', () => {
    expect(formatHeroEyebrow('2026-11-06', NOW)).toBe('다음 상담 · 오늘');
    expect(formatHeroEyebrow('2026-11-07', NOW)).toBe('다음 상담 · 내일');
    expect(formatHeroEyebrow('2026-11-19', NOW)).toBe('다음 상담 · 11월 19일 (목)');
    expect(formatHeroEyebrow('', NOW)).toBe(COVER_CHAPTER_COPY.NEXT_SESSION_LABEL);
  });

  it('formatChapterDateHeading', () => {
    expect(formatChapterDateHeading('2026-11-06', NOW)).toBe('오늘, 11월 6일 금요일');
    expect(formatChapterDateHeading('2026-11-19', NOW)).toBe('11월 19일 목요일');
  });

  it('formatListDateParts', () => {
    expect(formatListDateParts('2026-11-19')).toEqual({ primary: '11.19', secondary: '목요일' });
    expect(formatListDateParts(null)).toEqual({ primary: '', secondary: '' });
  });

  it('formatNotificationTime', () => {
    expect(formatNotificationTime('2026-11-06T09:30:00', NOW)).toBe('오늘 09:30');
    expect(formatNotificationTime('2026-11-05 20:00:00', NOW)).toBe('어제');
    expect(formatNotificationTime('2026-10-29T10:00:00', NOW)).toBe('10.29');
    expect(formatNotificationTime('not-a-date', NOW)).toBe('');
  });

  it('resolveDurationMinutes', () => {
    expect(resolveDurationMinutes('10:00', '10:50')).toBe(50);
    expect(resolveDurationMinutes('10:00', '09:00')).toBeNull();
    expect(resolveDurationMinutes(undefined, '10:00')).toBeNull();
  });
});

describe('이름·행 문구', () => {
  it('resolveNameInitial — 1글자/긴 이름/빈 이름', () => {
    expect(resolveNameInitial('김')).toBe('김');
    expect(resolveNameInitial('  남궁가나다라마바사아자차카타파하  ')).toBe('남');
    expect(resolveNameInitial('')).toBe('');
    expect(resolveNameInitial(null)).toBe('');
  });

  it('buildSessionTitle / buildPastRowDetail', () => {
    expect(buildSessionTitle({ consultationType: '개인상담', sessionNumber: 6 })).toBe(
      '개인상담 · 6회차',
    );
    expect(buildSessionTitle({ consultationType: '개인상담' })).toBe('개인상담');
    expect(
      buildPastRowDetail({ startTime: '10:00', endTime: '10:50', location: '대면 2상담실' }),
    ).toBe('완료 · 50분 · 대면 2상담실');
  });

  it('긴 이름도 문구를 자르지 않는다 (말줄임은 화면에서 numberOfLines 로 처리)', () => {
    const long = '가'.repeat(40);
    expect(CLIENT_COVER_COPY.consultantLabel(long)).toContain(long);
  });
});

describe('buildCoverHero', () => {
  it('결제 정보 없이 시각·머리말·기관연계 배지만 담는다', () => {
    const hero = buildCoverHero(
      {
        scheduleId: 7,
        date: '2026-11-06',
        startTime: '16:00:00',
        personLabel: '이지은 상담사',
        detail: '개인상담 5회차',
        engagementSource: { engagementType: 'INSTITUTION_LINK' },
      },
      NOW,
    );
    expect(hero).toEqual({
      scheduleId: 7,
      eyebrow: '다음 상담 · 오늘',
      clock: '16:00',
      personLabel: '이지은 상담사',
      detail: '개인상담 5회차',
      badgeLabel: '기관연계',
    });
    expect(Object.values(hero).some((v) => containsMoneyText(String(v)))).toBe(false);
  });
});

describe('splitClientSessionLists', () => {
  it('빈 목록 → 예정/지난 모두 비어 있다', () => {
    expect(splitClientSessionLists([], null)).toEqual({
      upcoming: [],
      past: [],
      upcomingTotal: 0,
      pastTotal: 0,
    });
  });

  it('한 건 — 히어로로 노출된 일정은 예정 목록에서 빠진다', () => {
    const only = makeSchedule({ id: 3 });
    const lists = splitClientSessionLists([only], 3);
    expect(lists.upcoming).toEqual([]);
    expect(lists.upcomingTotal).toBe(0);
  });

  it('여러 건 — 예정은 가까운 순, 지난은 최근 순, 취소·노쇼 제외, 상한 적용', () => {
    const rows = [
      makeSchedule({ id: 1, date: '2026-11-20', status: 'BOOKED' }),
      makeSchedule({ id: 2, date: '2026-11-08', status: 'CONFIRMED' }),
      makeSchedule({ id: 3, date: '2026-10-01', status: 'COMPLETED' }),
      makeSchedule({ id: 4, date: '2026-10-20', status: 'COMPLETED' }),
      makeSchedule({ id: 5, date: '2026-11-10', status: 'CANCELLED' }),
      makeSchedule({ id: 6, date: '2026-11-12', status: 'NO_SHOW' }),
      makeSchedule({ id: 7, date: '2026-11-07', status: 'SCHEDULED' }),
    ];
    const lists = splitClientSessionLists(rows, 7, { upcomingMax: 1, pastMax: 5 });
    expect(lists.upcoming.map((s) => s.id)).toEqual([2]);
    expect(lists.upcomingTotal).toBe(2);
    expect(lists.past.map((s) => s.id)).toEqual([4, 3]);
    expect(lists.pastTotal).toBe(2);
  });
});

describe('상담사 오늘 일정', () => {
  const today = [
    makeSchedule({ id: 1, startTime: '10:00', endTime: '10:50', status: 'COMPLETED' }),
    makeSchedule({ id: 2, startTime: '14:30', endTime: '15:20', status: 'CONFIRMED' }),
    makeSchedule({ id: 3, startTime: '16:00', endTime: '16:50', status: 'CONFIRMED' }),
    makeSchedule({ id: 4, startTime: '18:00', endTime: '18:50', status: 'BOOKED' }),
    makeSchedule({ id: 5, startTime: '19:00', endTime: '19:50', status: 'CANCELLED' }),
  ];

  it('summarizeCounselorToday — 취소 제외 집계', () => {
    expect(summarizeCounselorToday(today, NOW)).toEqual({
      total: 4,
      completed: 1,
      inProgress: 1,
      scheduled: 2,
    });
  });

  it('splitCounselorToday — 진행 중 1건 + 히어로 제외한 이후 일정', () => {
    const split = splitCounselorToday(today, 3, NOW);
    expect(split.inProgress?.id).toBe(2);
    expect(split.upcoming.map((s) => s.id)).toEqual([4]);
  });

  it('buildCounselorHero — 준비 응답 우선, 오늘 일정으로 장소·기관연계 보강', () => {
    const withLink = [
      ...today.slice(0, 2),
      makeSchedule({
        id: 3,
        startTime: '16:00',
        endTime: '16:50',
        location: '대면 1상담실',
        engagementType: 'INSTITUTION_LINK',
      }),
    ];
    const hero = buildCounselorHero(
      {
        scheduleId: 3,
        clientName: '박서준',
        sessionDate: '2026-11-06',
        startTime: '16:00',
        sessionNumber: 4,
        consultationType: '개인상담',
      },
      withLink,
      NOW,
    );
    expect(hero).toMatchObject({
      scheduleId: 3,
      clock: '16:00',
      personLabel: '박서준 님',
      detail: '개인상담 4회차 · 대면 1상담실',
      badgeLabel: '기관연계',
    });
  });

  it('buildCounselorHero — 준비 응답이 없으면 시작 전 첫 일정, 그것도 없으면 null', () => {
    expect(buildCounselorHero(null, today, NOW)?.scheduleId).toBe(3);
    expect(buildCounselorHero(null, [], NOW)).toBeNull();
    expect(buildCounselorHero(null, [today[0]!], NOW)).toBeNull();
  });
});

describe('알림 행', () => {
  it('내담자 — 상위 2건, 빈 제목 제외', () => {
    const rows = buildClientNotificationRows(
      [
        makeNotification({ id: 1, title: '' }),
        makeNotification({ id: 2, title: '상담 일정 확정', isRead: true }),
        makeNotification({ id: 3, title: '결제 완료' }),
        makeNotification({ id: 4, title: '세 번째' }),
      ],
      NOW,
    );
    expect(rows.map((r) => r.key)).toEqual(['notification-2', 'notification-3']);
    expect(rows[0]).toMatchObject({ variant: 'plain', unread: false, timeLabel: '오늘 09:30' });
  });

  it('상담사 — 일지 미작성은 warn 행(맨 위), 일정 변경 알림은 plain 행', () => {
    const rows = buildCounselorNotificationRows({
      pendingJournalCount: 2,
      urgentClient: null,
      notifications: [makeNotification({ id: 9, title: '내일 일정이 변경되었어요' })],
      now: NOW,
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      variant: 'warn',
      title: CONSULTANT_COVER_COPY.missingJournalRow(2),
      target: { kind: 'records' },
    });
    expect(rows[1]).toMatchObject({ variant: 'plain', target: { kind: 'notifications' } });
  });

  it('상담사 — 결제 타입·금액 문구 알림은 노출하지 않는다', () => {
    const rows = buildCounselorNotificationRows({
      pendingJournalCount: 0,
      notifications: [
        makeNotification({ id: 1, type: 'PAYMENT', title: '알림' }),
        makeNotification({ id: 2, title: '미결제 1건이 있어요' }),
        makeNotification({ id: 3, title: '정산 안내', content: '' }),
        makeNotification({ id: 4, title: '안내', content: '50,000원 입금 확인' }),
        makeNotification({ id: 5, title: '오늘 일정 안내' }),
      ],
      now: NOW,
    });
    expect(rows.map((r) => r.key)).toEqual(['notification-5']);
    expect(rows.every((r) => !containsMoneyText(r.title))).toBe(true);
  });

  it('상담사 — 위기 내담자 행은 plain, 미작성 0건이면 warn 행 없음', () => {
    const rows = buildCounselorNotificationRows({
      pendingJournalCount: 0,
      urgentClient: { clientId: 44, clientName: '최민', riskLabel: '고위험' },
      notifications: [],
      now: NOW,
    });
    expect(rows).toEqual([
      expect.objectContaining({
        variant: 'plain',
        title: '최민 님 확인 필요 · 고위험',
        target: { kind: 'client', clientId: 44 },
      }),
    ]);
  });

  it('상담사 — 알림이 하나도 없으면 빈 배열(빈 상태 행은 화면이 그린다)', () => {
    expect(
      buildCounselorNotificationRows({ pendingJournalCount: 0, notifications: [], now: NOW }),
    ).toEqual([]);
  });
});

describe('소식 배너', () => {
  it('normalizeActiveSystemNotices — ApiResponse.data / 배열 / 잘못된 값', () => {
    const raw = {
      success: true,
      data: [
        {
          id: 3,
          title: '<b>점검</b> 안내',
          content: '<p>오늘 밤</p>',
          notificationType: 'maintenance',
        },
        { id: 0, title: '무효' },
        { id: 4, title: '' },
      ],
    };
    const notices = normalizeActiveSystemNotices(raw);
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatchObject({
      id: 3,
      title: '점검 안내',
      content: '오늘 밤',
      notificationType: 'MAINTENANCE',
    });
    expect(normalizeActiveSystemNotices([{ id: 1, title: 'a' }])).toHaveLength(1);
    expect(normalizeActiveSystemNotices(null)).toEqual([]);
    expect(normalizeActiveSystemNotices({ data: 'x' })).toEqual([]);
  });

  it('활성 공지가 없으면 null (배너 숨김, 가짜 소식 없음)', () => {
    expect(pickCoverNewsBanner([], 'CLIENT')).toBeNull();
  });

  it('긴급 > 중요 > 안 읽음 순으로 고르고 칩·부제를 만든다', () => {
    const banner = pickCoverNewsBanner(
      [
        makeNotice({ id: 1, title: '일반', publishedAt: '2026-11-05T00:00:00' }),
        makeNotice({ id: 2, title: '중요', isImportant: true, content: '\n첫 줄\n둘째 줄' }),
        makeNotice({ id: 3, title: '이벤트', notificationType: 'EVENT', isRead: true }),
      ],
      'CLIENT',
    );
    expect(banner).toEqual({ id: 2, chip: '소식', title: '중요', subtitle: '첫 줄' });
    expect(
      pickCoverNewsBanner([makeNotice({ notificationType: 'CAMPAIGN' })], 'CLIENT')?.chip,
    ).toBe('캠페인');
  });

  it('상담사는 결제·금액 문구 공지를 배너로 쓰지 않는다', () => {
    const notices = [makeNotice({ id: 1, title: '수납 정책 변경', isUrgent: true })];
    expect(pickCoverNewsBanner(notices, 'CLIENT')?.id).toBe(1);
    expect(pickCoverNewsBanner(notices, 'CONSULTANT')).toBeNull();
  });
});

describe('resolveBranchLabel', () => {
  it('빈 값·브랜드명과 같으면 null', () => {
    expect(resolveBranchLabel('')).toBeNull();
    expect(resolveBranchLabel(undefined)).toBeNull();
    expect(resolveBranchLabel(COVER_CHAPTER_COPY.BRAND_NAME)).toBeNull();
    expect(resolveBranchLabel(' 강남센터 ')).toBe('강남센터');
  });
});

describe('resolveCoverLayoutMode', () => {
  it('폰 세로·가로는 phone, 태블릿은 방향에 따라 분기', () => {
    expect(resolveCoverLayoutMode(390, 844, TABLET_MIN_WIDTH)).toBe('phone');
    expect(resolveCoverLayoutMode(932, 430, TABLET_MIN_WIDTH)).toBe('phone');
    expect(resolveCoverLayoutMode(820, 1180, TABLET_MIN_WIDTH)).toBe('tabletPortrait');
    expect(resolveCoverLayoutMode(1180, 820, TABLET_MIN_WIDTH)).toBe('tabletLandscape');
  });
});
