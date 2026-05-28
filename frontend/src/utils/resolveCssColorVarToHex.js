/**
 * CSS 커스텀 속성(디자인 토큰)을 브라우저에서 실제 색으로 해석해 #RRGGBB 로 반환합니다.
 * 백엔드 BrandingInfo 등 7자 HEX 정합용.
 *
 * @author CoreSolution
 * @since 2026-04-15
 */

/**
 * unified-design-tokens.css :root — --cs-secondary-500 고정값 (SSR·해석 실패 시)
 */
const MG_SECONDARY_500_SSR_FALLBACK_HEX = 'var(--mg-color-text-secondary)';

/**
 * unified-design-tokens.css :root — --cs-primary-600 고정값.
 * --mg-primary-500 ↔ --cs-primary-500 상호 참조 시 브라우저 해석이 불안정할 수 있어 동일 팔레트 앵커로 사용.
 */
const MG_PRIMARY_500_SSR_FALLBACK_HEX = 'var(--mg-color-info)';

const RGBA_RE = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i;

/**
 * @param {string} rgbString getComputedStyle(...).color
 * @returns {string|null} #RRGGBB 대문자
 */
function rgbColorStringToHex(rgbString) {
  if (rgbString == null || typeof rgbString !== 'string') {
    return null;
  }
  const m = rgbString.trim().match(RGBA_RE);
  if (!m) {
    return null;
  }
  if (m[4] !== undefined && parseFloat(m[4]) < 1) {
    return null;
  }
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  if ([r, g, b].some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return null;
  }
  return `#${[r, g, b]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

/**
 * @param {string} cssVarName 예: '--mg-primary-500'
 * @param {string} ssrFallbackHex SSR 또는 해석 실패 시 사용할 7자 HEX
 * @returns {string}
 */
export function resolveCssColorVarToHex(cssVarName, ssrFallbackHex) {
  if (typeof document === 'undefined' || !document.body) {
    return ssrFallbackHex;
  }

  let el;
  try {
    el = document.createElement('div');
    el.setAttribute('data-mg-color-resolve', 'true');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.top = '0';
    el.style.visibility = 'hidden';
    el.style.color = `var(${cssVarName})`;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    const lower = computed.trim().toLowerCase();
    if (lower === 'transparent') {
      return ssrFallbackHex;
    }
    const hex = rgbColorStringToHex(computed);
    if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
      return hex;
    }
  } catch {
    // fall through
  } finally {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  return ssrFallbackHex;
}

/**
 * @returns {string} #RRGGBB
 */
export function getDefaultBrandingPrimaryHex() {
  return resolveCssColorVarToHex('--mg-primary-500', MG_PRIMARY_500_SSR_FALLBACK_HEX);
}

/**
 * @returns {string} #RRGGBB
 */
export function getDefaultBrandingSecondaryHex() {
  return resolveCssColorVarToHex('--mg-secondary-500', MG_SECONDARY_500_SSR_FALLBACK_HEX);
}

/**
 * Canvas 차트(Chart.js 등) 전용 색상 배열을 해석합니다.
 *
 * 배경:
 * - Chart.js 는 backgroundColor / borderColor 문자열을 그대로 Canvas 2D context 의
 *   ctx.fillStyle 에 대입합니다. Canvas 사양은 'var(--...)' 같은 CSS 변수 표기를
 *   파싱하지 못하므로(잘못된 색은 무시되고 이전 fillStyle 이 유지됨), SSOT 토큰을
 *   직접 전달하면 슬라이스가 검정/직전 색으로 렌더되는 P1 시각 결함이 발생합니다.
 * - 본 함수는 배열 내 'var(--mg-*)' 문자열만 골라 :root cascade(라이트/다크 자동)에
 *   등록된 토큰 값을 그대로(예: '#3B82F6') 반환합니다. 이는 동일 파일
 *   AdminDashboardV2.js 막대/라인 차트가 사용 중인 getPropertyValue 패턴과 동일하며,
 *   다크 모드 cascade 가 자동 적용됩니다 (:root[data-theme="dark"] override).
 * - 이미 hex/rgb/literal 색은 그대로 통과합니다(신규 hex 0건, SSOT 정합).
 *
 * @param {Array<string>} colors 색상 배열 (var(--...) | #hex | 기타 유효 CSS color)
 * @param {string} [fallback='transparent'] 해석 실패/SSR 시 fallback (CSS color keyword 또는 #RRGGBB)
 *                                          기본값 'transparent' — Canvas 검정 fallback 회피
 *                                          + 신규 hex 추가 금지 (D11 가드) 양립.
 * @returns {Array<string>} 해석된 색상 배열 (입력과 동일 길이)
 */
const CSS_VAR_TOKEN_RE = /^var\(\s*(--[a-zA-Z0-9_-]+)\s*\)$/;

export function resolveCssColorTokensArray(colors, fallback = 'transparent') {
  if (!Array.isArray(colors)) {
    return colors;
  }
  const hasDocument =
    typeof document !== 'undefined' &&
    document.documentElement &&
    typeof getComputedStyle !== 'undefined';
  const rootStyle = hasDocument ? getComputedStyle(document.documentElement) : null;
  return colors.map((c) => {
    if (typeof c !== 'string') {
      return c;
    }
    const match = c.trim().match(CSS_VAR_TOKEN_RE);
    if (!match) {
      return c;
    }
    if (!rootStyle) {
      return fallback;
    }
    const resolved = rootStyle.getPropertyValue(match[1]).trim();
    return resolved || fallback;
  });
}
