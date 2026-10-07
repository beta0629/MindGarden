/**
 * 안내 패널 제목·범례·본문 가로 inset 공유 (작업 C)
 *
 * 토글·마크 범례·본문이 같은 CSS 변수(--mg-schedule-legend-inline-pad)로
 * padding-inline(또는 padding 좌우)을 맞춰 1440·390 폭에서 시작선이 같게 한다.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..', '..', '..', '..');
const INLINE_PAD_VAR = '--mg-schedule-legend-inline-pad';
const INLINE_PAD_TOKEN = `var(${INLINE_PAD_VAR})`;

const TOKENS_CSS = fs.readFileSync(
  path.resolve(SRC, 'styles', 'tokens', 'design-v2-tokens.css'),
  'utf8'
);
const B0KLA_CSS = fs.readFileSync(
  path.resolve(SRC, 'components', 'schedule', 'ScheduleB0KlA.css'),
  'utf8'
);
const LEGEND_CSS = fs.readFileSync(
  path.resolve(SRC, 'components', 'ui', 'Schedule', 'ScheduleLegend.css'),
  'utf8'
);
const IMS_CSS = fs.readFileSync(
  path.resolve(
    SRC,
    'components',
    'admin',
    'mapping-management',
    'IntegratedMatchingSchedule.css'
  ),
  'utf8'
);
const UNIFIED_TOKENS_CSS = fs.readFileSync(
  path.resolve(SRC, 'styles', 'unified-design-tokens.css'),
  'utf8'
);
const TOGGLE_EXCLUDE = ':not(.mg-v2-schedule-legend__toggle)';

/**
 * @param {string} css
 * @param {string} selector
 * @returns {string}
 */
const extractRuleBody = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*\\{`, 'm');
  const match = re.exec(css);
  if (!match) {
    return '';
  }
  const open = css.indexOf('{', match.index);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') {
      depth += 1;
    } else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return css.slice(open + 1, i);
      }
    }
  }
  return '';
};

/**
 * @param {string} value
 * @returns {string[]}
 */
const splitCssValues = (value) => {
  const parts = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === '(') {
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
    }
    if (/\s/.test(ch) && depth === 0) {
      if (current) {
        parts.push(current);
      }
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) {
    parts.push(current);
  }
  return parts;
};

/**
 * padding-inline 또는 padding 단축의 좌우가 지정 변수를 쓰는지.
 * @param {string} ruleBody
 * @param {string} varToken
 * @returns {boolean}
 */
const usesInlinePadToken = (ruleBody, varToken) => {
  const paddingInline = ruleBody.match(/padding-inline\s*:\s*([^;]+)/);
  if (paddingInline && paddingInline[1].includes(varToken)) {
    return true;
  }
  const paddingLeft = ruleBody.match(/padding-left\s*:\s*([^;]+)/);
  const paddingRight = ruleBody.match(/padding-right\s*:\s*([^;]+)/);
  if (
    paddingLeft &&
    paddingRight &&
    paddingLeft[1].includes(varToken) &&
    paddingRight[1].includes(varToken)
  ) {
    return true;
  }
  const padding = ruleBody.match(/(?:^|[^-])padding\s*:\s*([^;]+)/m);
  if (!padding) {
    return false;
  }
  const parts = splitCssValues(padding[1].trim());
  if (parts.length === 1) {
    return parts[0].includes(varToken);
  }
  if (parts.length === 2 || parts.length === 3) {
    return parts[1].includes(varToken);
  }
  if (parts.length === 4) {
    return parts[1].includes(varToken) && parts[3].includes(varToken);
  }
  return false;
};

describe('안내 패널 공통 inline pad 정렬', () => {
  const toggleBody = extractRuleBody(
    B0KLA_CSS,
    '.mg-v2-ad-b0kla .mg-v2-schedule-legend__toggle'
  );
  const legendBody = extractRuleBody(LEGEND_CSS, '.mg-schedule-marks-legend');
  const panelBody = extractRuleBody(
    B0KLA_CSS,
    '.mg-v2-ad-b0kla .mg-v2-schedule-legend__body'
  );

  test('공통 변수는 기존 간격 토큰만 참조하고 화면별 CSS에 정의하지 않는다', () => {
    expect(TOKENS_CSS).toMatch(
      new RegExp(`${INLINE_PAD_VAR}\\s*:\\s*var\\(--mg-spacing-md\\)\\s*;`)
    );
    expect(TOKENS_CSS).not.toMatch(
      new RegExp(`${INLINE_PAD_VAR}\\s*:\\s*[^;]*(?:px|#|rgb)\\s*;`)
    );
    expect(IMS_CSS).not.toMatch(new RegExp(`${INLINE_PAD_VAR}\\s*:`));
  });

  test('제목 토글과 범례와 본문이 같은 변수 이름으로 가로 inset을 쓴다', () => {
    expect(toggleBody).toBeTruthy();
    expect(legendBody).toBeTruthy();
    expect(panelBody).toBeTruthy();
    expect(usesInlinePadToken(toggleBody, INLINE_PAD_TOKEN)).toBe(true);
    expect(usesInlinePadToken(legendBody, INLINE_PAD_TOKEN)).toBe(true);
    expect(usesInlinePadToken(panelBody, INLINE_PAD_TOKEN)).toBe(true);
    expect(toggleBody).toContain(INLINE_PAD_VAR);
    expect(legendBody).toContain(INLINE_PAD_VAR);
    expect(panelBody).toContain(INLINE_PAD_VAR);
  });

  test('범례 줄은 세로 가운데 정렬을 유지한다', () => {
    expect(legendBody).toMatch(/align-items:\s*center/);
  });

  test('반례: 토글만 예전 --mg-spacing-md 좌우 padding이면 공유 변수가 아니다', () => {
    const legacyToggle = [
      'padding: var(--mg-spacing-sm, 0.5rem) var(--mg-spacing-md, 1rem);'
    ].join('\n');
    expect(usesInlinePadToken(legacyToggle, INLINE_PAD_TOKEN)).toBe(false);
  });

  test('반례: 범례에 padding-inline이 없으면 제목 시작선과 어긋난다', () => {
    const noPadLegend = [
      'display: flex;',
      'align-items: center;',
      'gap: var(--mg-v2-space-2);'
    ].join('\n');
    expect(usesInlinePadToken(noPadLegend, INLINE_PAD_TOKEN)).toBe(false);
  });

  test('반례: 본문 좌우가 다른 토큰이면 공통 변수가 아니다', () => {
    const otherPadBody = [
      'padding: var(--mg-spacing-sm) var(--mg-spacing-lg) var(--mg-spacing-md);'
    ].join('\n');
    expect(usesInlinePadToken(otherPadBody, INLINE_PAD_TOKEN)).toBe(false);
  });

  test('전역 button 강제 padding·ellipsis 네 그룹이 안내 패널 토글을 제외한다', () => {
    const sectionStart = UNIFIED_TOKENS_CSS.indexOf('전체 버튼 스타일 통합 및 최적화');
    expect(sectionStart).toBeGreaterThan(-1);
    const section = UNIFIED_TOKENS_CSS.slice(sectionStart);

    const media768Rel = section.indexOf('@media (max-width: 768px)');
    const media480Rel = section.indexOf('@media (max-width: 480px)');
    expect(media768Rel).toBeGreaterThan(-1);
    expect(media480Rel).toBeGreaterThan(media768Rel);

    const beforeInner = section.slice(0, section.indexOf('/* 버튼 내부 텍스트 최적화 */'));
    const innerTo768 = section.slice(
      section.indexOf('/* 버튼 내부 텍스트 최적화 */'),
      media768Rel
    );
    const block768 = section.slice(media768Rel, media480Rel);
    const block480 = section.slice(media480Rel, media480Rel + 800);

    const firstButtonLine = (chunk) => {
      const match = chunk.match(/^[ \t]*button:not\([^;\n]+/m);
      return match ? match[0].trim() : '';
    };

    const groups = [
      firstButtonLine(beforeInner),
      firstButtonLine(innerTo768),
      firstButtonLine(block768),
      firstButtonLine(block480)
    ];
    expect(groups.every(Boolean)).toBe(true);
    expect(groups[1]).toMatch(/span\s*,?\s*$/);
    groups.forEach((selector) => {
      expect(selector).toContain(TOGGLE_EXCLUDE);
    });
  });

  test('반례: 전역 button 해머가 토글을 제외하지 않으면 390 시작선이 어긋난다', () => {
    const missingExclude = 'button:not(.mg-v2-nav-icon):not(.mg-v2-header-menu-row):not([data-gnb-chrome-free="true"])';
    expect(missingExclude.includes(TOGGLE_EXCLUDE)).toBe(false);
  });
});
