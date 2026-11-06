/**
 * 역할별 하단 도크 IA (커버+챕터 v4) — 라벨·노출 여부 SSOT.
 *
 * 라우트 그룹은 기존 그대로 두고 라벨만 바꾼다. `(booking)` 은 직접 예약 차단 정책으로
 * 항상 `href: null` 이며, 내담자 「예약」 탭은 `(sessions)` 일정 챕터를 가리킨다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */

export type ClientDockRoute =
  '(home)' | '(sessions)' | '(wellness)' | '(more)' | '(booking)' | '(shop)';

export type ConsultantDockRoute = '(home)' | '(schedule)' | '(records)' | '(more)' | '(clients)';

export interface RoleDockTab<R extends string> {
  readonly route: R;
  readonly label: string;
  readonly a11yLabel: string;
  readonly visible: boolean;
}

export const CLIENT_DOCK_TABS: readonly RoleDockTab<ClientDockRoute>[] = [
  { route: '(home)', label: '홈', a11yLabel: '홈 탭', visible: true },
  { route: '(sessions)', label: '예약', a11yLabel: '예약 탭', visible: true },
  { route: '(wellness)', label: '마음', a11yLabel: '마음 탭', visible: true },
  { route: '(more)', label: '나', a11yLabel: '나 탭', visible: true },
  { route: '(booking)', label: '예약 신청', a11yLabel: '예약 신청', visible: false },
  { route: '(shop)', label: '쇼핑', a11yLabel: '쇼핑', visible: false },
] as const;

export const CONSULTANT_DOCK_TABS: readonly RoleDockTab<ConsultantDockRoute>[] = [
  { route: '(home)', label: '홈', a11yLabel: '홈 탭', visible: true },
  { route: '(schedule)', label: '일정', a11yLabel: '일정 탭', visible: true },
  { route: '(records)', label: '일지', a11yLabel: '일지 탭', visible: true },
  { route: '(more)', label: '나', a11yLabel: '나 탭', visible: true },
  { route: '(clients)', label: '내담자', a11yLabel: '내담자', visible: false },
] as const;

/**
 * @param tabs 역할 도크 정의
 * @param route 라우트 그룹명
 * @returns 해당 라우트 탭 정의 (없으면 throw — 레이아웃 오타를 빌드 단계에서 드러내기 위함)
 */
export function getDockTab<R extends string>(
  tabs: readonly RoleDockTab<R>[],
  route: R,
): RoleDockTab<R> {
  const hit = tabs.find((t) => t.route === route);
  if (!hit) {
    throw new Error(`Unknown dock route: ${route}`);
  }
  return hit;
}

/**
 * @param tabs 역할 도크 정의
 * @returns 도크에 보이는 라벨 (정의 순서)
 */
export function getVisibleDockLabels<R extends string>(tabs: readonly RoleDockTab<R>[]): string[] {
  return tabs.filter((t) => t.visible).map((t) => t.label);
}
