/**
 * iPad letterbox 토큰 — Apple G4 (iPad 화면 미최적화) 재제출 대응 (Build 1.0.9).
 *
 * <p>SSOT: P3-D 디자인 스펙(agent-transcripts/.../386990fa-9897-408e-b9c2-9dbfd3bc1260).
 * iPad portrait 에서 iPhone 비율의 콘텐츠를 그대로 유지(가운데 정렬 + 좌우 letterbox)하며,
 * 너비 임계 미만(iPhone)에서는 zero-cost 로 children 을 그대로 통과시킨다.</p>
 *
 * <p>색상 토큰(`letterboxBg`, `letterboxBorder`)은 `tokens.ts` / `client-theme.ts` 등에서 관리한다.
 * 본 파일은 픽셀·임계 수치만 단일 진입점으로 모은다.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { LAYOUT_TABLET_DEVICE_WIDTH } from '../components/organisms/login/loginAnimationConstants';

/**
 * iPad 콘텐츠 컬럼 최대 너비 (pt).
 *
 * <p>기존 `CONTENT_MAX_WIDTH_TABLET = 440` (loginAnimationConstants.ts) 를 그대로 재export 하여
 * 단일 진입점으로 통합한다. 값·이름 변경 금지 — login/tenant-select 가 참조 중.
 * 근거: iPhone 14 Pro Max 430pt + α, Apple HIG iPad "readable line lengths" 안전선.</p>
 */
export { CONTENT_MAX_WIDTH_TABLET as LETTERBOX_CONTENT_MAX_WIDTH } from '../components/organisms/login/loginAnimationConstants';

/**
 * iPad letterbox 활성화 임계 화면 너비 (pt) — iPad mini portrait 기준.
 *
 * <p>기존 `LAYOUT_TABLET_DEVICE_WIDTH = 744` 를 단일 진입점으로 재export.
 * 이 임계 미만(iPhone Pro Max 430 등)에서는 letterbox 비활성 → 풀폭 표시.</p>
 */
export { LAYOUT_TABLET_DEVICE_WIDTH as LETTERBOX_ACTIVATION_WIDTH } from '../components/organisms/login/loginAnimationConstants';

/**
 * letterbox 미활성 시(iPhone) 콘텐츠 컬럼 최소 좌우 여백 (pt).
 *
 * <p>일반 모바일 화면의 기존 24pt padding 과 동일. ContentLetterbox 는 letterbox 비활성 상태에서
 * 자체 padding 을 추가하지 않으며, 본 토큰은 호출부가 필요 시 참조하는 단일 진입점이다.</p>
 */
export const LETTERBOX_MIN_SIDE_GUTTER = 24;

/**
 * letterbox 콘텐츠 컬럼 좌·우 보더 두께 (pt).
 *
 * <p>StyleSheet.hairlineWidth(0.5) 대신 명시 1pt — HiDPI iPad 에서 0.5pt 는 시각적으로 약해
 * 콘텐츠/letterbox 면 분리감이 부족함. P3-D 디자인 스펙 §3.2 결정.</p>
 */
export const LETTERBOX_BORDER_WIDTH = 1;

/**
 * 현재 화면 폭이 iPad letterbox 활성화 임계 이상인지 판정.
 *
 * <p>단일 진입점 — 호출부가 `windowWidth >= 744` 와 같은 매직 넘버 비교를 직접 하지 않도록 한다.</p>
 *
 * @param width `useWindowDimensions().width` 또는 동등 픽셀 폭 (pt)
 * @return letterbox 를 활성화해야 하면 true
 */
export function isLetterboxEnabled(width: number): boolean {
  return width >= LAYOUT_TABLET_DEVICE_WIDTH;
}
