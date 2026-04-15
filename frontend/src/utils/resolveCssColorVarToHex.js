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
const MG_SECONDARY_500_SSR_FALLBACK_HEX = '#6B7280';

/**
 * unified-design-tokens.css :root — --cs-primary-600 고정값.
 * --mg-primary-500 ↔ --cs-primary-500 상호 참조 시 브라우저 해석이 불안정할 수 있어 동일 팔레트 앵커로 사용.
 */
const MG_PRIMARY_500_SSR_FALLBACK_HEX = '#2563EB';

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
