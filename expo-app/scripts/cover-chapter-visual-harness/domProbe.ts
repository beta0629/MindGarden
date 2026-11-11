/**
 * 브라우저 전용 DOM 프로브 — react-native-web 이 그린 실제 트리에서 판정 입력을 수집한다.
 * testID → `data-testid`, accessibilityLabel → `aria-label` 매핑을 이용한다.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import type { CoverLayoutMode } from '@/utils/coverChapterViewModel';
import { HARNESS_DOCK_TEST_ID } from './HarnessChrome';
import { HARNESS_TEST_ID } from './HarnessScreens';
import {
  INSTITUTION_BADGE_TEXT,
  PROGRESS_BLOCK_A11Y,
  UNPAID_TEXT,
  type HarnessDomSnapshot,
  type VisualScreenSpec,
} from './visualMatrixSpec';

/** CSS `line-height: normal` 근사 (Chrome 기본) */
const NORMAL_LINE_HEIGHT_RATIO = 1.2;

function byTestId(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
}

function px(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function leafElements(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).filter(
    (el) => el.children.length === 0 && (el.textContent ?? '').trim() !== '',
  );
}

function collectTreeText(root: Element): string {
  const labels = Array.from(root.querySelectorAll('[aria-label]')).map(
    (el) => el.getAttribute('aria-label') ?? '',
  );
  return [root.textContent ?? '', ...labels].join('\n');
}

/**
 * @param spec 현재 화면 스펙
 * @param layoutMode 하네스에서 `useCoverLayoutMode()` 가 낸 값
 */
export function collectDomSnapshot(
  spec: VisualScreenSpec,
  layoutMode: CoverLayoutMode | null,
): HarnessDomSnapshot {
  const root = document.getElementById('root') ?? document.body;
  const leaves = leafElements(root);

  const header = byTestId(HARNESS_TEST_ID.BRAND_HEADER);
  const dock = byTestId(HARNESS_DOCK_TEST_ID);
  const tabs = dock ? Array.from(dock.querySelectorAll<HTMLElement>('[role="tab"]')) : [];

  const unpaidNodes = leaves
    .filter((el) => (el.textContent ?? '').includes(UNPAID_TEXT))
    .map((el) => ({
      text: (el.textContent ?? '').trim(),
      insideProgressBlock: el.closest(`[aria-label="${PROGRESS_BLOCK_A11Y}"]`) != null,
    }));

  const greetingEl = leaves.find((el) => (el.textContent ?? '').trim() === spec.greetingText);
  const greetingRect = greetingEl?.getBoundingClientRect();
  const greetingStyle = greetingEl ? getComputedStyle(greetingEl) : null;
  const greetingLineHeight =
    greetingStyle && greetingStyle.lineHeight !== 'normal'
      ? px(greetingStyle.lineHeight)
      : px(greetingStyle?.fontSize ?? '') * NORMAL_LINE_HEIGHT_RATIO;

  const safe = byTestId(HARNESS_TEST_ID.SAFE_AREA);
  const safeStyle = safe ? getComputedStyle(safe) : null;
  const dockStyle = dock ? getComputedStyle(dock) : null;

  return {
    layoutMode,
    window: { width: window.innerWidth, height: window.innerHeight },
    treeText: collectTreeText(root),
    headerText: header?.textContent ?? '',
    dockLabels: tabs.map((t) => (t.textContent ?? '').trim()),
    activeDockLabels: tabs
      .filter((t) => t.getAttribute('aria-selected') === 'true')
      .map((t) => (t.textContent ?? '').trim()),
    unpaidNodes,
    institutionBadgeCount: root.querySelectorAll(`[aria-label="${INSTITUTION_BADGE_TEXT}"]`).length,
    greeting: {
      found: greetingEl != null,
      truncated: greetingEl != null && greetingEl.scrollWidth > greetingEl.clientWidth,
      lineCount:
        greetingRect && greetingLineHeight > 0
          ? Math.round(greetingRect.height / greetingLineHeight)
          : 0,
      rightEdge: greetingRect?.right ?? 0,
    },
    documentScrollWidth: document.documentElement.scrollWidth,
    safeArea: {
      paddingTop: px(safeStyle?.paddingTop ?? ''),
      paddingLeft: px(safeStyle?.paddingLeft ?? ''),
      paddingRight: px(safeStyle?.paddingRight ?? ''),
      dockPaddingBottom: px(dockStyle?.paddingBottom ?? ''),
      dockHeight: dock?.getBoundingClientRect().height ?? 0,
    },
  };
}

/** 세로로 스크롤 가능한 컨테이너를 모두 끝까지 내린다 (스크롤 캡처용). */
export function scrollAllToEnd(): number {
  const scrollers = Array.from(document.querySelectorAll<HTMLElement>('*')).filter((el) => {
    const oy = getComputedStyle(el).overflowY;
    return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1;
  });
  for (const el of scrollers) {
    el.scrollTop = el.scrollHeight;
  }
  return scrollers.length;
}
