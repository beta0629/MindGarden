/**
 * 커버/챕터 v4 시각 하네스 매트릭스 기대값 ↔ 뷰모델 대조.
 * 시각 캡처(scripts/cover-chapter-visual-harness)는 로컬 전용이므로, 같은 기대값을 여기서 CI 로 고정한다.
 */
import { CLIENT_COVER_COPY, CLIENT_SCHEDULE_CHAPTER_COPY } from '@/constants/clientHomeCopy';
import { CONSULTANT_COVER_COPY } from '@/constants/consultantHomeCopy';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import {
  CLIENT_DOCK_TABS,
  CONSULTANT_DOCK_TABS,
  getDockTab,
  getVisibleDockLabels,
} from '@/constants/roleDockConfig';
import type { Schedule } from '@/api/hooks/useSchedules';
import {
  CLIENT_FIXTURES,
  COUNSELOR_FIXTURES,
  HARNESS_FIXTURE_TAG,
  HARNESS_LONG_KOREAN_NAME,
  buildClientHarnessView,
  buildCounselorHarnessView,
  harnessNow,
  type ClientHarnessView,
  type CounselorHarnessView,
} from '../../../scripts/cover-chapter-visual-harness/harnessFixtures';
import {
  DOCK_MIN_BOTTOM_PAD,
  EDGE_CASE_GROUPS,
  EXPECTED_DOCK_LABELS,
  INSTITUTION_BADGE_TEXT,
  MAIN_SCREEN_KEYS,
  VISUAL_SCREEN_SPECS,
  evaluateScreenAssertions,
  type ClientVisualSpec,
  type CounselorVisualSpec,
  type HarnessDomSnapshot,
  type VisualScreenSpec,
} from '../../../scripts/cover-chapter-visual-harness/visualMatrixSpec';
import {
  buildCounselorRowDetail,
  containsMoneyText,
  resolveCoverLayoutMode,
  resolveInstitutionBadgeLabel,
} from '../coverChapterViewModel';

/** `LETTERBOX_ACTIVATION_WIDTH` (react-native 의존 모듈이라 node jest 에서 직접 import 하지 않음) */
const TABLET_MIN_WIDTH = 744;
const HOME_UPCOMING_MAX = 2;
const HOME_PAST_MAX = 1;

const NOW = harnessNow();

const clientSpecs = VISUAL_SCREEN_SPECS.filter((s): s is ClientVisualSpec => s.role === 'CLIENT');
const counselorSpecs = VISUAL_SCREEN_SPECS.filter(
  (s): s is CounselorVisualSpec => s.role === 'CONSULTANT',
);

function clientView(spec: ClientVisualSpec): ClientHarnessView {
  return buildClientHarnessView(CLIENT_FIXTURES[spec.fixture], NOW);
}

function counselorView(spec: CounselorVisualSpec): CounselorHarnessView {
  return buildCounselorHarnessView(COUNSELOR_FIXTURES[spec.fixture], NOW);
}

/** 하네스 화면이 실제로 그리는 일정 행 (화면별 slice 규칙 포함) */
function renderedClientRows(spec: ClientVisualSpec, view: ClientHarnessView): Schedule[] {
  if (spec.screen === 'client-home') {
    return [
      ...view.lists.upcoming.slice(0, HOME_UPCOMING_MAX),
      ...view.lists.past.slice(0, HOME_PAST_MAX),
    ];
  }
  return [...view.lists.upcoming, ...view.lists.past];
}

function renderedCounselorRows(view: CounselorHarnessView): Schedule[] {
  return [...(view.today.inProgress ? [view.today.inProgress] : []), ...view.today.upcoming];
}

function countBadges(heroBadge: string | null, rows: readonly Schedule[]): number {
  return (heroBadge ? 1 : 0) + rows.filter((r) => resolveInstitutionBadgeLabel(r) != null).length;
}

/** 스펙을 그대로 만족하는 합성 스냅샷 — 판정 함수의 양성 기준선 */
function passingSnapshot(spec: VisualScreenSpec): HarnessDomSnapshot {
  return {
    layoutMode: spec.expectedMode,
    window: spec.viewport,
    treeText: spec.requiredTexts.join('\n'),
    headerText: `마인드가든CORE${spec.expectedHeaderRight ?? ''}`,
    dockLabels: [...EXPECTED_DOCK_LABELS[spec.role]],
    activeDockLabels: [spec.expectedActiveDock],
    unpaidNodes: spec.expectedUnpaidTexts.map((text) => ({ text, insideProgressBlock: true })),
    institutionBadgeCount: spec.institutionBadges.min,
    greeting: {
      found: true,
      truncated: spec.greetingTruncated ?? false,
      lineCount: 1,
      rightEdge: spec.viewport.width - 1,
    },
    documentScrollWidth: spec.viewport.width,
    safeArea: {
      paddingTop: spec.insets.top,
      paddingLeft: spec.insets.left,
      paddingRight: spec.insets.right,
      dockPaddingBottom: Math.max(spec.insets.bottom, DOCK_MIN_BOTTOM_PAD),
      dockHeight: 0,
    },
  };
}

function failedIds(spec: VisualScreenSpec, snap: HarnessDomSnapshot): string[] {
  return evaluateScreenAssertions(spec, snap)
    .filter((a) => !a.pass)
    .map((a) => a.id);
}

describe('매트릭스 구성 — 7개 화면 · 뷰포트 · 레이아웃 모드', () => {
  it('정확히 7개 구현 화면과 지정 파일명을 가진다', () => {
    expect(VISUAL_SCREEN_SPECS.filter((s) => s.kind === 'screen').map((s) => s.file)).toEqual([
      'impl-phone-client-home.png',
      'impl-phone-client-schedule.png',
      'impl-phone-counselor-home.png',
      'impl-tablet-client-home-portrait.png',
      'impl-tablet-client-home-landscape.png',
      'impl-tablet-counselor-home-portrait.png',
      'impl-tablet-counselor-home-landscape.png',
    ]);
    expect(MAIN_SCREEN_KEYS).toHaveLength(7);
    expect(new Set(VISUAL_SCREEN_SPECS.map((s) => s.key)).size).toBe(VISUAL_SCREEN_SPECS.length);
  });

  it.each(VISUAL_SCREEN_SPECS.map((s) => [s.key, s] as const))(
    '%s: 기대 모드 = 짧은 변 기준 resolveCoverLayoutMode',
    (_key, spec) => {
      expect(
        resolveCoverLayoutMode(spec.viewport.width, spec.viewport.height, TABLET_MIN_WIDTH),
      ).toBe(spec.expectedMode);
    },
  );

  it('엣지 그룹은 존재하는 화면만 참조하고 safe-area 는 실기기 UNVERIFIED 로 표시한다', () => {
    const keys = new Set(VISUAL_SCREEN_SPECS.map((s) => s.key));
    for (const g of EDGE_CASE_GROUPS) {
      expect(g.keys.length).toBeGreaterThan(0);
      expect(g.keys.every((k) => keys.has(k))).toBe(true);
    }
    expect(EDGE_CASE_GROUPS.find((g) => g.id === 'safe-area-insets')?.physicalDevice).toBe(
      'UNVERIFIED',
    );
  });

  it('픽스처는 HARVEST 하네스 픽스처로 표시되어 있다', () => {
    for (const f of [...Object.values(CLIENT_FIXTURES), ...Object.values(COUNSELOR_FIXTURES)]) {
      expect(f.tag).toBe(HARNESS_FIXTURE_TAG);
    }
  });
});

describe('역할 도크 라벨', () => {
  it('매트릭스 기대 라벨 = roleDockConfig 노출 라벨', () => {
    expect(getVisibleDockLabels(CLIENT_DOCK_TABS)).toEqual([...EXPECTED_DOCK_LABELS.CLIENT]);
    expect(getVisibleDockLabels(CONSULTANT_DOCK_TABS)).toEqual([
      ...EXPECTED_DOCK_LABELS.CONSULTANT,
    ]);
  });

  it('화면별 활성 탭: 내담자 홈 → 홈, 일정 챕터 → 예약((sessions)), 상담사 홈 → 홈', () => {
    for (const spec of clientSpecs) {
      const route = spec.screen === 'client-home' ? '(home)' : '(sessions)';
      expect(spec.expectedActiveDock).toBe(getDockTab(CLIENT_DOCK_TABS, route).label);
    }
    for (const spec of counselorSpecs) {
      expect(spec.expectedActiveDock).toBe(getDockTab(CONSULTANT_DOCK_TABS, '(home)').label);
    }
  });
});

describe('미결제 칩 배치', () => {
  it.each(clientSpecs.map((s) => [s.key, s] as const))(
    '%s: 기대 칩 텍스트 = 회기 블록 뷰모델 출력',
    (_key, spec) => {
      const view = clientView(spec);
      const chip =
        spec.screen === 'client-home'
          ? CLIENT_COVER_COPY.unpaidChip(view.unpaidCount)
          : CLIENT_SCHEDULE_CHAPTER_COPY.UNPAID_CHIP;
      expect([...spec.expectedUnpaidTexts]).toEqual(view.unpaidCount > 0 ? [chip] : []);
    },
  );

  it('내담자 히어로·알림·배너·목록 문구에는 미결제가 없다 (칩은 회기 블록 전용)', () => {
    for (const spec of clientSpecs) {
      const view = clientView(spec);
      const strings = [
        view.hero?.eyebrow,
        view.hero?.personLabel,
        view.hero?.detail,
        view.banner?.title,
        view.banner?.subtitle,
        ...view.notificationRows.map((r) => r.title),
      ].filter((s): s is string => typeof s === 'string');
      expect(strings.some((s) => s.includes('미결제'))).toBe(false);
    }
  });

  it('상담사 화면은 미결제 칩을 기대하지 않는다', () => {
    for (const spec of counselorSpecs) {
      expect(spec.expectedUnpaidTexts).toEqual([]);
    }
  });
});

describe('기관연계 배지', () => {
  it.each(VISUAL_SCREEN_SPECS.map((s) => [s.key, s] as const))(
    '%s: 뷰모델이 그리는 배지 수가 매트릭스 범위 안',
    (_key, spec) => {
      const count =
        spec.role === 'CLIENT'
          ? countBadges(
              clientView(spec).hero?.badgeLabel ?? null,
              renderedClientRows(spec, clientView(spec)),
            )
          : countBadges(
              counselorView(spec).hero?.badgeLabel ?? null,
              renderedCounselorRows(counselorView(spec)),
            );
      expect(count).toBeGreaterThanOrEqual(spec.institutionBadges.min);
      if (spec.institutionBadges.max != null) {
        expect(count).toBeLessThanOrEqual(spec.institutionBadges.max);
      }
    },
  );

  it('INSTITUTION_LINK(engagementType·paymentTiming) 일정만 「기관연계」, 그 외는 배지 없음', () => {
    const rows = [
      ...CLIENT_FIXTURES['client-live'].schedules,
      ...COUNSELOR_FIXTURES['counselor-live'].todaySchedules,
    ];
    for (const r of rows) {
      const isLink =
        r.engagementType === 'INSTITUTION_LINK' || r.paymentTiming === 'INSTITUTION_LINK';
      expect(resolveInstitutionBadgeLabel(r)).toBe(isLink ? INSTITUTION_BADGE_TEXT : null);
    }
  });
});

describe('빈 목록', () => {
  it('내담자 빈 픽스처: 히어로·배너·알림·회기·목록이 모두 비고 빈 상태 문구를 기대한다', () => {
    const view = buildClientHarnessView(CLIENT_FIXTURES['client-empty'], NOW);
    expect(view.hero).toBeNull();
    expect(view.banner).toBeNull();
    expect(view.notificationRows).toEqual([]);
    expect(view.progress.hasBalance).toBe(false);
    expect(view.unpaidCount).toBe(0);
    expect(view.lists.upcoming).toEqual([]);
    expect(view.lists.past).toEqual([]);
    const home = VISUAL_SCREEN_SPECS.find((s) => s.key === 'edge-phone-client-home-empty')!;
    expect(home.requiredTexts).toEqual(
      expect.arrayContaining([
        CLIENT_COVER_COPY.HERO_EMPTY_TITLE,
        CLIENT_COVER_COPY.PROGRESS_EMPTY,
        CLIENT_COVER_COPY.UPCOMING_EMPTY,
        CLIENT_COVER_COPY.PAST_EMPTY,
        COVER_CHAPTER_COPY.NOTIF_EMPTY,
      ]),
    );
    const schedule = VISUAL_SCREEN_SPECS.find((s) => s.key === 'edge-phone-client-schedule-empty')!;
    expect(schedule.requiredTexts).toEqual(
      expect.arrayContaining([
        CLIENT_SCHEDULE_CHAPTER_COPY.UPCOMING_EMPTY,
        CLIENT_SCHEDULE_CHAPTER_COPY.PAST_EMPTY,
        CLIENT_SCHEDULE_CHAPTER_COPY.upcomingCount(0),
      ]),
    );
  });

  it('상담사 빈 픽스처: 히어로·진행 중·이후 일정·일지·알림 없음', () => {
    const view = buildCounselorHarnessView(COUNSELOR_FIXTURES['counselor-empty'], NOW);
    expect(view.hero).toBeNull();
    expect(view.today.inProgress).toBeNull();
    expect(view.today.upcoming).toEqual([]);
    expect(view.pendingCount).toBe(0);
    expect(view.notificationRows).toEqual([]);
    expect(view.banner).toBeNull();
    const spec = VISUAL_SCREEN_SPECS.find((s) => s.key === 'edge-phone-counselor-home-empty')!;
    expect(spec.requiredTexts).toEqual(
      expect.arrayContaining([
        CONSULTANT_COVER_COPY.TODAY_SUMMARY_ZERO,
        CONSULTANT_COVER_COPY.HERO_EMPTY_TITLE,
        CONSULTANT_COVER_COPY.UPCOMING_EMPTY,
        CONSULTANT_COVER_COPY.RECORDS_EMPTY,
      ]),
    );
  });
});

describe('긴 한글 이름', () => {
  it('표시 이름은 자르지 않고 그대로 넘기며(말줄임은 컴포넌트 1줄 처리), 매트릭스 인사 문구와 일치', () => {
    const view = buildClientHarnessView(CLIENT_FIXTURES['client-long-name'], NOW);
    expect(view.displayName).toBe(HARNESS_LONG_KOREAN_NAME);
    const phone = VISUAL_SCREEN_SPECS.find((s) => s.key === 'edge-phone-client-home-long-name')!;
    const landscape = VISUAL_SCREEN_SPECS.find(
      (s) => s.key === 'edge-tablet-landscape-client-home-long-name',
    )!;
    expect(phone.greetingText).toBe(CLIENT_COVER_COPY.greetingName(view.displayName));
    expect(phone.greetingTruncated).toBe(true);
    expect(landscape.greetingText).toBe(
      `${CLIENT_COVER_COPY.greetingName(view.displayName)}${CLIENT_COVER_COPY.LANDSCAPE_NAME_SUFFIX}`,
    );
    expect(phone.expectedHeaderRight).toBe(view.branchLabel);
  });
});

describe('라이브 화면 필수 문구 = 뷰모델 출력', () => {
  it('내담자: 히어로·배너·첫 알림 행이 필수 문구에 포함된다', () => {
    const spec = VISUAL_SCREEN_SPECS.find((s) => s.key === 'phone-client-home') as ClientVisualSpec;
    const view = clientView(spec);
    expect(spec.requiredTexts).toEqual(
      expect.arrayContaining([
        view.hero!.eyebrow,
        view.hero!.clock,
        view.hero!.personLabel,
        view.hero!.detail,
        view.banner!.title,
        view.banner!.chip,
        view.notificationRows[0]!.title,
      ]),
    );
    expect(spec.expectedHeaderRight).toBe(view.branchLabel);
  });

  it('상담사: 오늘 요약·알림 행(경고 포함)이 필수 문구에 포함된다', () => {
    const spec = VISUAL_SCREEN_SPECS.find(
      (s) => s.key === 'phone-counselor-home',
    ) as CounselorVisualSpec;
    const view = counselorView(spec);
    const { total, completed, inProgress, scheduled } = view.summary;
    expect(spec.requiredTexts).toEqual(
      expect.arrayContaining([
        CONSULTANT_COVER_COPY.todaySummary(total, completed, inProgress, scheduled),
        view.banner!.title,
        ...view.notificationRows.map((r) => r.title),
      ]),
    );
    expect(view.notificationRows[0]!.variant).toBe('warn');
  });
});

describe('상담사 금액 노출 없음', () => {
  it('원천 픽스처에는 결제·금액 항목이 섞여 있다 (필터가 실제로 동작해야 하는 조건)', () => {
    const f = COUNSELOR_FIXTURES['counselor-live'];
    expect(f.notificationPages[0]!.content.some((n) => containsMoneyText(n.title))).toBe(true);
    expect(JSON.stringify(f.activeNoticesRaw)).toMatch(/정산/);
  });

  it.each(counselorSpecs.map((s) => [s.key, s] as const))(
    '%s: 화면에 그려지는 모든 문자열에 미결제·…원·결제 문구가 없다',
    (_key, spec) => {
      const view = counselorView(spec);
      const { total, completed, inProgress, scheduled } = view.summary;
      const strings = [
        CONSULTANT_COVER_COPY.nameLabel(view.displayName),
        total > 0
          ? CONSULTANT_COVER_COPY.todaySummary(total, completed, inProgress, scheduled)
          : CONSULTANT_COVER_COPY.TODAY_SUMMARY_ZERO,
        view.hero?.eyebrow,
        view.hero?.personLabel,
        view.hero?.detail,
        view.banner?.title,
        view.banner?.subtitle,
        ...view.notificationRows.map((r) => r.title),
        ...renderedCounselorRows(view).map((r) => buildCounselorRowDetail(r)),
        ...view.records.map((r) => r.clientName),
      ].filter((s): s is string => typeof s === 'string');
      expect(strings.length).toBeGreaterThan(0);
      for (const s of strings) {
        expect(containsMoneyText(s)).toBe(false);
      }
      expect(spec.forbiddenTexts).toEqual(expect.arrayContaining(['미결제', '55,000원']));
    },
  );
});

describe('evaluateScreenAssertions — 판정 함수', () => {
  it.each(VISUAL_SCREEN_SPECS.map((s) => [s.key, s] as const))(
    '%s: 스펙을 만족하는 스냅샷은 전부 통과',
    (_key, spec) => {
      expect(failedIds(spec, passingSnapshot(spec))).toEqual([]);
    },
  );

  const clientHome = VISUAL_SCREEN_SPECS.find((s) => s.key === 'phone-client-home')!;
  const counselorHome = VISUAL_SCREEN_SPECS.find((s) => s.key === 'phone-counselor-home')!;

  it('회기 블록 밖 미결제 칩은 실패', () => {
    const snap = passingSnapshot(clientHome);
    expect(
      failedIds(clientHome, {
        ...snap,
        unpaidNodes: [...snap.unpaidNodes, { text: '미결제 1건', insideProgressBlock: false }],
      }),
    ).toContain('unpaid-placement');
  });

  it('상담사 트리에 금액·미결제가 보이면 실패 (aria-label 포함)', () => {
    const snap = passingSnapshot(counselorHome);
    expect(failedIds(counselorHome, { ...snap, treeText: `${snap.treeText}\n55,000원` })).toContain(
      'counselor-no-money',
    );
    expect(failedIds(counselorHome, { ...snap, treeText: `${snap.treeText}\n미결제` })).toContain(
      'counselor-no-money',
    );
  });

  it('도크 라벨·활성 탭·레이아웃 모드·safe-area 불일치는 실패', () => {
    const snap = passingSnapshot(clientHome);
    expect(
      failedIds(clientHome, { ...snap, dockLabels: ['홈', '예약 신청', '마음', '나'] }),
    ).toContain('dock-labels');
    expect(failedIds(clientHome, { ...snap, activeDockLabels: ['홈', '예약'] })).toContain(
      'dock-active',
    );
    expect(failedIds(clientHome, { ...snap, layoutMode: 'tabletPortrait' })).toContain(
      'layout-mode',
    );
    expect(
      failedIds(clientHome, { ...snap, safeArea: { ...snap.safeArea, paddingTop: 0 } }),
    ).toContain('safe-area-top');
    expect(
      failedIds(clientHome, { ...snap, safeArea: { ...snap.safeArea, dockPaddingBottom: 0 } }),
    ).toContain('safe-area-dock-bottom');
  });

  it('기관연계 배지 부족·브랜드 누락·인사 2줄은 실패', () => {
    const snap = passingSnapshot(clientHome);
    expect(failedIds(clientHome, { ...snap, institutionBadgeCount: 0 })).toContain(
      'institution-badge',
    );
    expect(failedIds(clientHome, { ...snap, headerText: '마인드가든 강남센터' })).toContain(
      'brand',
    );
    expect(
      failedIds(clientHome, { ...snap, greeting: { ...snap.greeting, lineCount: 2 } }),
    ).toContain('greeting');
  });
});
