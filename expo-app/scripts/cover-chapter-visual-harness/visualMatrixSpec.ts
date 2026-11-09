/**
 * 커버/챕터 v4 시각 하네스 매트릭스 스펙 — 화면·뷰포트·모의 인셋·기대값(리터럴)과 순수 판정 함수.
 *
 * 브라우저 하네스(`entry.tsx`)가 DOM 스냅샷을 이 판정 함수에 넣고, Jest(`coverChapterVisualMatrix.test.ts`)는
 * 같은 기대값을 뷰모델 출력과 대조한다. 기대값은 일부러 리터럴로 적는다(설정에서 파생하면 동어반복).
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import type { CoverLayoutMode } from '@/utils/coverChapterViewModel';
import { containsMoneyText } from '@/utils/coverChapterViewModel';
import {
  HARNESS_LONG_KOREAN_NAME,
  type ClientFixtureId,
  type CounselorFixtureId,
} from './harnessFixtures';

export interface HarnessViewport {
  readonly width: number;
  readonly height: number;
}

export interface HarnessInsets {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export const PHONE_VIEWPORT: HarnessViewport = { width: 390, height: 844 };
export const TABLET_PORTRAIT_VIEWPORT: HarnessViewport = { width: 768, height: 1024 };
export const TABLET_LANDSCAPE_VIEWPORT: HarnessViewport = { width: 1024, height: 768 };

/** iPhone 14/15 계열 세로 인셋 (노치·홈 인디케이터) — 모의값 */
export const PHONE_MOCK_INSETS: HarnessInsets = { top: 47, bottom: 34, left: 0, right: 0 };
/** 홈 버튼 없는 iPad 인셋 — 모의값 */
export const TABLET_MOCK_INSETS: HarnessInsets = { top: 24, bottom: 20, left: 0, right: 0 };

/** `useBottomTabNavigatorOptions` 의 iOS·web 하단 패딩 하한 */
export const DOCK_MIN_BOTTOM_PAD = 20;

export const EXPECTED_DOCK_LABELS = {
  CLIENT: ['홈', '예약', '마음', '나'],
  CONSULTANT: ['홈', '일정', '일지', '나'],
} as const;

export const BRAND_TEXT = '마인드가든';
export const BRAND_BADGE_TEXT = 'CORE';
export const INSTITUTION_BADGE_TEXT = '기관연계';
/** `SessionProgressBlock` Pressable 의 accessibilityLabel — 미결제 칩의 유일한 허용 부모 */
export const PROGRESS_BLOCK_A11Y = '회기·결제 내역 보기';
export const UNPAID_TEXT = '미결제';
/** 사용자 지시: 상담사 트리에 「미결제」「…원」 없어야 함 */
const COUNSELOR_STRICT_MONEY_PATTERN = /미결제|\d[\d,]*\s*원/;

export type HarnessClientScreenId = 'client-home' | 'client-schedule';
export type HarnessCounselorScreenId = 'counselor-home';
export type HarnessScreenId = HarnessClientScreenId | HarnessCounselorScreenId;

interface VisualSpecBase {
  readonly key: string;
  readonly file: string;
  readonly kind: 'screen' | 'edge';
  readonly title: string;
  readonly viewport: HarnessViewport;
  readonly insets: HarnessInsets;
  readonly expectedMode: CoverLayoutMode;
  readonly expectedHeaderRight: string | null;
  readonly expectedActiveDock: string;
  /** 진행(회기) 블록 안에서만 보여야 하는 미결제 칩 텍스트 — 순서 무관 정확 일치 */
  readonly expectedUnpaidTexts: readonly string[];
  readonly institutionBadges: { readonly min: number; readonly max?: number };
  readonly greetingText: string;
  /** 미지정이면 말줄임 여부는 판정하지 않고 1줄 유지만 본다 */
  readonly greetingTruncated?: boolean;
  readonly requiredTexts: readonly string[];
  readonly forbiddenTexts: readonly string[];
  readonly scrolledCapture?: boolean;
}

export interface ClientVisualSpec extends VisualSpecBase {
  readonly role: 'CLIENT';
  readonly screen: HarnessClientScreenId;
  readonly fixture: ClientFixtureId;
}

export interface CounselorVisualSpec extends VisualSpecBase {
  readonly role: 'CONSULTANT';
  readonly screen: HarnessCounselorScreenId;
  readonly fixture: CounselorFixtureId;
}

export type VisualScreenSpec = ClientVisualSpec | CounselorVisualSpec;

const NO_BOOKING_CTA = ['예약 신청', '예약하기'] as const;

const CLIENT_HOME_LIVE_REQUIRED = [
  '상담실 입장',
  '다음 상담 · 오늘',
  '16:00',
  '이지은 상담사',
  '개인상담 5회차 · 대면 2상담실',
  '11월 마음챙김 그룹 프로그램 안내',
  '캠페인',
  '오늘 16:00 상담이 확정되었어요',
  '내 상담 회기',
  '이후 일정',
  '지난 상담',
] as const;

const CLIENT_HOME_LANDSCAPE_REQUIRED = [
  ...CLIENT_HOME_LIVE_REQUIRED,
  '센터에서 확정한 일정만 표시',
];

const CLIENT_SCHEDULE_LIVE_REQUIRED = [
  '상담실 입장',
  '오늘, 11월 6일 금요일',
  '잔여 06 / 10회',
  '예정 2건',
  '예정',
  '지난 상담',
  '변경이 필요하면 센터로 문의해 주세요.',
] as const;

const CLIENT_SCHEDULE_FORBIDDEN = [
  ...NO_BOOKING_CTA,
  '11월 마음챙김 그룹 프로그램 안내',
  '새 알림이 없어요',
  '오늘 16:00 상담이 확정되었어요',
] as const;

const COUNSELOR_LIVE_REQUIRED = [
  '다음 상담 입장',
  '오늘 5건 · 완료 1 · 진행 1 · 예정 3',
  '김하늘 님',
  '일지 미작성 2건',
  '서도윤 님 확인 필요 · 고위험',
  '17:30 정민호 님 상담이 비대면으로 변경되었어요',
  '상담실 예약 시스템 점검 안내',
  '지금 진행 중',
  '최유나 님',
  '이후 일정',
  '상담 기록',
] as const;

const COUNSELOR_FORBIDDEN = [
  ...NO_BOOKING_CTA,
  '미결제',
  '55,000원',
  '급여',
  '정산',
  '11월 상담료 정산 일정 안내',
] as const;

const BRANCH = '마인드가든 강남센터';

export const VISUAL_SCREEN_SPECS: readonly VisualScreenSpec[] = [
  {
    key: 'phone-client-home',
    file: 'impl-phone-client-home.png',
    kind: 'screen',
    title: '내담자 홈 · 폰',
    role: 'CLIENT',
    screen: 'client-home',
    fixture: 'client-live',
    viewport: PHONE_VIEWPORT,
    insets: PHONE_MOCK_INSETS,
    expectedMode: 'phone',
    expectedHeaderRight: BRANCH,
    expectedActiveDock: '홈',
    expectedUnpaidTexts: ['미결제 1건'],
    institutionBadges: { min: 2 },
    greetingText: '김하늘 님',
    requiredTexts: [...CLIENT_HOME_LIVE_REQUIRED, '상담 일정과 입장 정보를 확인하세요.'],
    forbiddenTexts: NO_BOOKING_CTA,
    scrolledCapture: true,
  },
  {
    key: 'phone-client-schedule',
    file: 'impl-phone-client-schedule.png',
    kind: 'screen',
    title: '내담자 예약(일정 챕터) · 폰',
    role: 'CLIENT',
    screen: 'client-schedule',
    fixture: 'client-live',
    viewport: PHONE_VIEWPORT,
    insets: PHONE_MOCK_INSETS,
    expectedMode: 'phone',
    expectedHeaderRight: BRANCH,
    expectedActiveDock: '예약',
    expectedUnpaidTexts: ['미결제'],
    institutionBadges: { min: 2 },
    greetingText: '예약',
    requiredTexts: CLIENT_SCHEDULE_LIVE_REQUIRED,
    forbiddenTexts: CLIENT_SCHEDULE_FORBIDDEN,
    scrolledCapture: true,
  },
  {
    key: 'phone-counselor-home',
    file: 'impl-phone-counselor-home.png',
    kind: 'screen',
    title: '상담사 홈 · 폰',
    role: 'CONSULTANT',
    screen: 'counselor-home',
    fixture: 'counselor-live',
    viewport: PHONE_VIEWPORT,
    insets: PHONE_MOCK_INSETS,
    expectedMode: 'phone',
    expectedHeaderRight: '상담사',
    expectedActiveDock: '홈',
    expectedUnpaidTexts: [],
    institutionBadges: { min: 2 },
    greetingText: '이지은 상담사',
    requiredTexts: COUNSELOR_LIVE_REQUIRED,
    forbiddenTexts: COUNSELOR_FORBIDDEN,
    scrolledCapture: true,
  },
  {
    key: 'tablet-client-home-portrait',
    file: 'impl-tablet-client-home-portrait.png',
    kind: 'screen',
    title: '내담자 홈 · 태블릿 세로',
    role: 'CLIENT',
    screen: 'client-home',
    fixture: 'client-live',
    viewport: TABLET_PORTRAIT_VIEWPORT,
    insets: TABLET_MOCK_INSETS,
    expectedMode: 'tabletPortrait',
    expectedHeaderRight: BRANCH,
    expectedActiveDock: '홈',
    expectedUnpaidTexts: ['미결제 1건'],
    institutionBadges: { min: 2 },
    greetingText: '김하늘 님',
    requiredTexts: [...CLIENT_HOME_LIVE_REQUIRED, '상담 일정과 입장 정보를 확인하세요.'],
    forbiddenTexts: NO_BOOKING_CTA,
    scrolledCapture: true,
  },
  {
    key: 'tablet-client-home-landscape',
    file: 'impl-tablet-client-home-landscape.png',
    kind: 'screen',
    title: '내담자 홈 · 태블릿 가로(40/60 분할)',
    role: 'CLIENT',
    screen: 'client-home',
    fixture: 'client-live',
    viewport: TABLET_LANDSCAPE_VIEWPORT,
    insets: TABLET_MOCK_INSETS,
    expectedMode: 'tabletLandscape',
    expectedHeaderRight: BRANCH,
    expectedActiveDock: '홈',
    expectedUnpaidTexts: ['미결제 1건'],
    institutionBadges: { min: 2 },
    greetingText: '김하늘 님 · 상담',
    requiredTexts: CLIENT_HOME_LANDSCAPE_REQUIRED,
    forbiddenTexts: NO_BOOKING_CTA,
  },
  {
    key: 'tablet-counselor-home-portrait',
    file: 'impl-tablet-counselor-home-portrait.png',
    kind: 'screen',
    title: '상담사 홈 · 태블릿 세로',
    role: 'CONSULTANT',
    screen: 'counselor-home',
    fixture: 'counselor-live',
    viewport: TABLET_PORTRAIT_VIEWPORT,
    insets: TABLET_MOCK_INSETS,
    expectedMode: 'tabletPortrait',
    expectedHeaderRight: '상담사',
    expectedActiveDock: '홈',
    expectedUnpaidTexts: [],
    institutionBadges: { min: 2 },
    greetingText: '이지은 상담사',
    requiredTexts: COUNSELOR_LIVE_REQUIRED,
    forbiddenTexts: COUNSELOR_FORBIDDEN,
    scrolledCapture: true,
  },
  {
    key: 'tablet-counselor-home-landscape',
    file: 'impl-tablet-counselor-home-landscape.png',
    kind: 'screen',
    title: '상담사 홈 · 태블릿 가로(40/60 분할)',
    role: 'CONSULTANT',
    screen: 'counselor-home',
    fixture: 'counselor-live',
    viewport: TABLET_LANDSCAPE_VIEWPORT,
    insets: TABLET_MOCK_INSETS,
    expectedMode: 'tabletLandscape',
    expectedHeaderRight: '상담사',
    expectedActiveDock: '홈',
    expectedUnpaidTexts: [],
    institutionBadges: { min: 2 },
    greetingText: '이지은 상담사',
    requiredTexts: [...COUNSELOR_LIVE_REQUIRED, '일정과 상담 기록만 표시'],
    forbiddenTexts: COUNSELOR_FORBIDDEN,
  },
  // --- 엣지 케이스 보드 -----------------------------------------------------
  {
    key: 'edge-phone-client-home-long-name',
    file: 'impl-edge-phone-client-home-long-name.png',
    kind: 'edge',
    title: '긴 한글 이름 · 내담자 홈 · 폰',
    role: 'CLIENT',
    screen: 'client-home',
    fixture: 'client-long-name',
    viewport: PHONE_VIEWPORT,
    insets: PHONE_MOCK_INSETS,
    expectedMode: 'phone',
    expectedHeaderRight: '마인드가든 서울특별시 강남구 테헤란로 심리상담센터 본점',
    expectedActiveDock: '홈',
    expectedUnpaidTexts: ['미결제 1건'],
    institutionBadges: { min: 2 },
    greetingText: `${HARNESS_LONG_KOREAN_NAME} 님`,
    greetingTruncated: true,
    requiredTexts: ['상담실 입장', '남궁선우리별하늘바다 상담사'],
    forbiddenTexts: NO_BOOKING_CTA,
  },
  {
    key: 'edge-tablet-landscape-client-home-long-name',
    file: 'impl-edge-tablet-landscape-client-home-long-name.png',
    kind: 'edge',
    title: '긴 한글 이름 · 내담자 홈 · 태블릿 가로',
    role: 'CLIENT',
    screen: 'client-home',
    fixture: 'client-long-name',
    viewport: TABLET_LANDSCAPE_VIEWPORT,
    insets: TABLET_MOCK_INSETS,
    expectedMode: 'tabletLandscape',
    expectedHeaderRight: '마인드가든 서울특별시 강남구 테헤란로 심리상담센터 본점',
    expectedActiveDock: '홈',
    expectedUnpaidTexts: ['미결제 1건'],
    institutionBadges: { min: 2 },
    greetingText: `${HARNESS_LONG_KOREAN_NAME} 님 · 상담`,
    requiredTexts: ['상담실 입장'],
    forbiddenTexts: NO_BOOKING_CTA,
  },
  {
    key: 'edge-phone-client-home-empty',
    file: 'impl-edge-phone-client-home-empty.png',
    kind: 'edge',
    title: '빈 목록 · 내담자 홈 · 폰',
    role: 'CLIENT',
    screen: 'client-home',
    fixture: 'client-empty',
    viewport: PHONE_VIEWPORT,
    insets: PHONE_MOCK_INSETS,
    expectedMode: 'phone',
    expectedHeaderRight: null,
    expectedActiveDock: '홈',
    expectedUnpaidTexts: [],
    institutionBadges: { min: 0, max: 0 },
    greetingText: '김하늘 님',
    requiredTexts: [
      '예정된 상담이 없어요',
      '센터에서 일정을 확정하면 이곳에 표시돼요.',
      '알림 확인',
      '새 알림이 없어요',
      '이용 중인 회기가 없어요',
      '이후 예정된 상담이 없어요',
      '지난 상담 기록이 없어요',
    ],
    forbiddenTexts: [...NO_BOOKING_CTA, '상담실 입장', '캠페인'],
    scrolledCapture: true,
  },
  {
    key: 'edge-phone-client-schedule-empty',
    file: 'impl-edge-phone-client-schedule-empty.png',
    kind: 'edge',
    title: '빈 목록 · 내담자 예약 · 폰',
    role: 'CLIENT',
    screen: 'client-schedule',
    fixture: 'client-empty',
    viewport: PHONE_VIEWPORT,
    insets: PHONE_MOCK_INSETS,
    expectedMode: 'phone',
    expectedHeaderRight: null,
    expectedActiveDock: '예약',
    expectedUnpaidTexts: [],
    institutionBadges: { min: 0, max: 0 },
    greetingText: '예약',
    requiredTexts: [
      '예정된 상담이 없어요',
      '이용 중인 회기가 없어요',
      '완료된 상담이 없어요',
      '예정 0건',
    ],
    forbiddenTexts: [...NO_BOOKING_CTA, '상담실 입장'],
  },
  {
    key: 'edge-phone-counselor-home-empty',
    file: 'impl-edge-phone-counselor-home-empty.png',
    kind: 'edge',
    title: '빈 목록 · 상담사 홈 · 폰',
    role: 'CONSULTANT',
    screen: 'counselor-home',
    fixture: 'counselor-empty',
    viewport: PHONE_VIEWPORT,
    insets: PHONE_MOCK_INSETS,
    expectedMode: 'phone',
    expectedHeaderRight: '상담사',
    expectedActiveDock: '홈',
    expectedUnpaidTexts: [],
    institutionBadges: { min: 0, max: 0 },
    greetingText: '이지은 상담사',
    requiredTexts: [
      '오늘 예정된 상담이 없어요',
      '남은 상담이 없어요',
      '일정 확인',
      '새 알림이 없어요',
      '오늘 남은 일정이 없어요',
      '작성할 일지가 없어요',
    ],
    forbiddenTexts: [...COUNSELOR_FORBIDDEN, '다음 상담 입장', '지금 진행 중'],
  },
];

export const MAIN_SCREEN_KEYS = VISUAL_SCREEN_SPECS.filter((s) => s.kind === 'screen').map(
  (s) => s.key,
);

export interface EdgeCaseGroup {
  readonly id: string;
  readonly title: string;
  readonly keys: readonly string[];
  readonly assertionIds: readonly AssertionId[];
  readonly physicalDevice?: 'UNVERIFIED';
}

const COUNSELOR_KEYS = VISUAL_SCREEN_SPECS.filter((s) => s.role === 'CONSULTANT').map((s) => s.key);

export const EDGE_CASE_GROUPS: readonly EdgeCaseGroup[] = [
  {
    id: 'long-korean-name',
    title: '긴 한글 이름 — 인사 1줄 말줄임 · 가로 넘침 없음',
    keys: ['edge-phone-client-home-long-name', 'edge-tablet-landscape-client-home-long-name'],
    assertionIds: ['greeting', 'no-horizontal-overflow', 'header-right'],
  },
  {
    id: 'empty-lists',
    title: '빈 목록 — 정직한 빈 상태 문구 · 배너/입장 CTA 숨김',
    keys: [
      'edge-phone-client-home-empty',
      'edge-phone-client-schedule-empty',
      'edge-phone-counselor-home-empty',
    ],
    assertionIds: ['required-texts', 'forbidden-texts', 'institution-badge'],
  },
  {
    id: 'institution-link-badge',
    title: '기관연계 배지 — INSTITUTION_LINK 일정에서만 표시',
    keys: [...MAIN_SCREEN_KEYS, 'edge-phone-client-home-empty', 'edge-phone-counselor-home-empty'],
    assertionIds: ['institution-badge'],
  },
  {
    id: 'role-dock-labels',
    title: '역할 도크 라벨 — 내담자 홈·예약·마음·나 / 상담사 홈·일정·일지·나',
    keys: VISUAL_SCREEN_SPECS.map((s) => s.key),
    assertionIds: ['dock-labels', 'dock-active'],
  },
  {
    id: 'unpaid-placement',
    title: '미결제 칩 — 내담자 「내 상담 회기」 블록에서만',
    keys: VISUAL_SCREEN_SPECS.map((s) => s.key),
    assertionIds: ['unpaid-placement'],
  },
  {
    id: 'counselor-amount-leakage',
    title: '상담사 금액 노출 없음 — 트리 텍스트·aria-label 에 미결제/…원/결제 문구 0건',
    keys: COUNSELOR_KEYS,
    assertionIds: ['counselor-no-money'],
  },
  {
    id: 'safe-area-insets',
    title: 'Safe area — 모의 인셋 → SafeAreaView padding-top · 도크 padding-bottom',
    keys: MAIN_SCREEN_KEYS,
    assertionIds: ['safe-area-top', 'safe-area-dock-bottom'],
    physicalDevice: 'UNVERIFIED',
  },
];

// ---------------------------------------------------------------------------
// DOM 스냅샷 → 판정
// ---------------------------------------------------------------------------

export interface HarnessDomSnapshot {
  readonly layoutMode: CoverLayoutMode | null;
  readonly window: HarnessViewport;
  /** 화면 트리 textContent + 모든 aria-label (숨김 포함, 누출 판정용) */
  readonly treeText: string;
  readonly headerText: string;
  readonly dockLabels: readonly string[];
  readonly activeDockLabels: readonly string[];
  readonly unpaidNodes: readonly { readonly text: string; readonly insideProgressBlock: boolean }[];
  readonly institutionBadgeCount: number;
  readonly greeting: {
    readonly found: boolean;
    readonly truncated: boolean;
    readonly lineCount: number;
    readonly rightEdge: number;
  };
  readonly documentScrollWidth: number;
  readonly safeArea: {
    readonly paddingTop: number;
    readonly paddingLeft: number;
    readonly paddingRight: number;
    readonly dockPaddingBottom: number;
    readonly dockHeight: number;
  };
}

export type AssertionId =
  | 'layout-mode'
  | 'brand'
  | 'header-right'
  | 'dock-labels'
  | 'dock-active'
  | 'unpaid-placement'
  | 'counselor-no-money'
  | 'institution-badge'
  | 'greeting'
  | 'required-texts'
  | 'forbidden-texts'
  | 'no-horizontal-overflow'
  | 'safe-area-top'
  | 'safe-area-dock-bottom';

export interface AssertionResult {
  readonly id: AssertionId;
  readonly pass: boolean;
  readonly detail: string;
}

function sameMultiset(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join('\u0000') === [...b].sort().join('\u0000');
}

function compact(s: string): string {
  return s.replace(/\s+/g, '');
}

/**
 * @param spec 화면 스펙
 * @param snap 브라우저에서 수집한 DOM 스냅샷
 * @returns 판정 결과 (상담사 전용 판정은 내담자 화면에서 생략)
 */
export function evaluateScreenAssertions(
  spec: VisualScreenSpec,
  snap: HarnessDomSnapshot,
): AssertionResult[] {
  const out: AssertionResult[] = [];
  const push = (id: AssertionId, pass: boolean, detail: string) => out.push({ id, pass, detail });

  push(
    'layout-mode',
    snap.layoutMode === spec.expectedMode,
    `expected ${spec.expectedMode}, measured ${snap.layoutMode ?? 'none'} @ ${snap.window.width}x${snap.window.height}`,
  );

  const header = compact(snap.headerText);
  push(
    'brand',
    header.startsWith(compact(`${BRAND_TEXT}${BRAND_BADGE_TEXT}`)),
    `header="${snap.headerText}"`,
  );
  const rightExpected = spec.expectedHeaderRight;
  push(
    'header-right',
    rightExpected == null
      ? header === compact(`${BRAND_TEXT}${BRAND_BADGE_TEXT}`)
      : header === compact(`${BRAND_TEXT}${BRAND_BADGE_TEXT}${rightExpected}`),
    `expected right=${rightExpected ?? '(none)'}`,
  );

  const dockExpected = EXPECTED_DOCK_LABELS[spec.role];
  push(
    'dock-labels',
    snap.dockLabels.join('|') === dockExpected.join('|'),
    `expected ${dockExpected.join('·')}, measured ${snap.dockLabels.join('·')}`,
  );
  push(
    'dock-active',
    snap.activeDockLabels.length === 1 && snap.activeDockLabels[0] === spec.expectedActiveDock,
    `expected ${spec.expectedActiveDock}, measured ${snap.activeDockLabels.join('·') || '(none)'}`,
  );

  const unpaidTexts = snap.unpaidNodes.map((n) => n.text);
  const strayUnpaid = snap.unpaidNodes.filter((n) => !n.insideProgressBlock).map((n) => n.text);
  push(
    'unpaid-placement',
    sameMultiset(unpaidTexts, spec.expectedUnpaidTexts) && strayUnpaid.length === 0,
    `expected [${spec.expectedUnpaidTexts.join(', ')}], measured [${unpaidTexts.join(', ')}]` +
      (strayUnpaid.length > 0 ? `, outside progress block: [${strayUnpaid.join(', ')}]` : ''),
  );

  if (spec.role === 'CONSULTANT') {
    const strict = COUNSELOR_STRICT_MONEY_PATTERN.exec(snap.treeText);
    const broad = containsMoneyText(snap.treeText);
    push(
      'counselor-no-money',
      !strict && !broad,
      strict || broad
        ? `leak: ${strict ? `"${strict[0]}"` : 'payment/amount wording'}`
        : 'no 미결제 / …원 / 결제·정산·급여 wording in tree text + aria-labels',
    );
  }

  const { min, max } = spec.institutionBadges;
  push(
    'institution-badge',
    snap.institutionBadgeCount >= min && (max == null || snap.institutionBadgeCount <= max),
    `count=${snap.institutionBadgeCount}, expected ${max == null ? `>= ${min}` : `${min}..${max}`}`,
  );

  push(
    'greeting',
    snap.greeting.found &&
      snap.greeting.lineCount === 1 &&
      (spec.greetingTruncated == null || snap.greeting.truncated === spec.greetingTruncated),
    `"${spec.greetingText}" found=${snap.greeting.found} lines=${snap.greeting.lineCount} truncated=${snap.greeting.truncated}` +
      (spec.greetingTruncated != null ? ` (expected truncated=${spec.greetingTruncated})` : ''),
  );

  const missing = spec.requiredTexts.filter((t) => !snap.treeText.includes(t));
  push(
    'required-texts',
    missing.length === 0,
    missing.length === 0
      ? `${spec.requiredTexts.length} present`
      : `missing: ${missing.join(' | ')}`,
  );
  const present = spec.forbiddenTexts.filter((t) => snap.treeText.includes(t));
  push(
    'forbidden-texts',
    present.length === 0,
    present.length === 0
      ? `${spec.forbiddenTexts.length} absent`
      : `present: ${present.join(' | ')}`,
  );

  push(
    'no-horizontal-overflow',
    snap.documentScrollWidth <= snap.window.width && snap.greeting.rightEdge <= snap.window.width,
    `scrollWidth=${snap.documentScrollWidth}, greetingRight=${Math.round(snap.greeting.rightEdge)}, viewport=${snap.window.width}`,
  );

  push(
    'safe-area-top',
    snap.safeArea.paddingTop === spec.insets.top &&
      snap.safeArea.paddingLeft === spec.insets.left &&
      snap.safeArea.paddingRight === spec.insets.right,
    `mock top=${spec.insets.top} → measured padding-top=${snap.safeArea.paddingTop} (l=${snap.safeArea.paddingLeft}, r=${snap.safeArea.paddingRight})`,
  );
  const dockPad = Math.max(spec.insets.bottom, DOCK_MIN_BOTTOM_PAD);
  push(
    'safe-area-dock-bottom',
    snap.safeArea.dockPaddingBottom === dockPad,
    `mock bottom=${spec.insets.bottom} → expected dock padding-bottom=${dockPad}, measured=${snap.safeArea.dockPaddingBottom} (dock height ${snap.safeArea.dockHeight})`,
  );

  return out;
}
