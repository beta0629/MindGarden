/**
 * B0KlA pill-toggle CSS regression — 트랙(외곽)이 내부 pill 높이에
 * shrink-to-fit 되도록 검증. fill/stretch 재도입 금지.
 * Complete pill geometry: track overflow visible, MGButton size !important must not win.
 *
 * @author CoreSolution
 * @since 2026-07-20
 */

import fs from 'fs';
import path from 'path';

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..');

const readCss = (relativePath) =>
  fs.readFileSync(path.join(FRONTEND_ROOT, relativePath), 'utf8');

/** `.selector { ... }` 블록 본문 추출 (중첩 없는 flat 규칙용) */
const extractRuleBody = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const match = css.match(regex);
  return match ? match[1] : null;
};

/** 콤마로 나열된 selector 그룹에서 본문 추출 (첫 매칭 그룹) */
const extractGroupedRuleBody = (css, requiredSelectors) => {
  const start = css.indexOf(requiredSelectors[0]);
  if (start < 0) {
    return null;
  }
  const open = css.indexOf('{', start);
  if (open < 0) {
    return null;
  }
  const header = css.slice(start, open);
  const missing = requiredSelectors.filter((sel) => !header.includes(sel));
  if (missing.length > 0) {
    return null;
  }
  const close = css.indexOf('}', open);
  if (close < 0) {
    return null;
  }
  return css.slice(open + 1, close);
};

const SSOT = 'src/components/admin/AdminDashboard/AdminDashboardB0KlA.css';
const VIZ_GROUP = 'src/components/dashboard-v2/organisms/AdminDashboardVisualizationGroup.css';
const MAPPING_LIST = 'src/components/admin/mapping-management/organisms/MappingListBlock.css';
const MIRROR_FILES = [
  MAPPING_LIST,
  'src/components/erp/IntegratedFinanceDashboard.css',
  'src/components/common/ViewModeToggle.css'
];

describe('B0KlA pill-toggle shrink-to-fit', () => {
  const ssotCss = readCss(SSOT);

  it('SSOT: pill-toggle shrinks to content with track inset padding', () => {
    const body = extractRuleBody(ssotCss, '.mg-v2-ad-b0kla__pill-toggle');
    expect(body).not.toBeNull();
    expect(body).toMatch(/align-items:\s*center/);
    expect(body).toMatch(/height:\s*auto/);
    expect(body).toMatch(/padding:\s*var\(--mg-v2-space-1/);
    expect(body).not.toMatch(/align-items:\s*stretch/);
    expect(body).not.toMatch(/padding:\s*6px/);
    expect(body).not.toMatch(/padding:\s*0(?!\.)/);
  });

  it('SSOT: pill-toggle uses overflow visible (no overflow-x/overflow-y pair)', () => {
    const body = extractRuleBody(ssotCss, '.mg-v2-ad-b0kla__pill-toggle');
    expect(body).not.toBeNull();
    expect(body).toMatch(/overflow:\s*visible/);
    expect(body).not.toMatch(/overflow-x:\s*auto/);
    expect(body).not.toMatch(/overflow-y:\s*visible/);
  });

  it('SSOT: pill does not stretch to fill track', () => {
    const body = extractRuleBody(ssotCss, '.mg-v2-ad-b0kla__pill');
    expect(body).not.toBeNull();
    expect(body).not.toMatch(/align-self:\s*stretch/);
    expect(body).toMatch(/height:\s*auto/);
  });

  it('SSOT: chart-header does not force pill-toggle to grow', () => {
    const body = extractRuleBody(
      ssotCss,
      '.mg-v2-ad-b0kla__chart-header .mg-v2-ad-b0kla__pill-toggle'
    );
    expect(body).not.toBeNull();
    expect(body).toMatch(/align-self:\s*flex-start/);
    expect(body).toMatch(/flex-shrink:\s*0/);
  });

  it('SSOT: MGButton pill override beats .mg-button.mg-v2-button.mg-button--medium', () => {
    const body = extractGroupedRuleBody(ssotCss, [
      'button.mg-v2-ad-b0kla__pill.mg-button',
      'button.mg-v2-ad-b0kla__pill.mg-button.mg-v2-button.mg-button--medium'
    ]);
    expect(body).not.toBeNull();
    expect(body).not.toMatch(/align-self:\s*stretch/);
    expect(body).toMatch(/height:\s*auto\s*!important/);
    expect(body).toMatch(/max-height:\s*none\s*!important/);
    expect(body).toMatch(/min-height:\s*var\(--mg-v2-component-touch-target/);
    expect(body).toMatch(/padding:\s*var\(--mg-v2-space-3[\s\S]*!important/);
    expect(body).toMatch(/line-height:\s*var\(--mg-v2-font-line-height-body[\s\S]*!important/);
    expect(body).toMatch(/overflow:\s*visible\s*!important/);
  });

  it('VisualizationGroup __pills uses overflow visible', () => {
    const css = readCss(VIZ_GROUP);
    const body = extractRuleBody(css, '.mg-v2-content-visualization-group__pills');
    expect(body).not.toBeNull();
    expect(body).toMatch(/overflow:\s*visible/);
    expect(body).not.toMatch(/overflow-x:\s*auto/);
    expect(body).not.toMatch(/overflow-y:\s*visible/);
  });

  it('MappingListBlock does not redefine global pill-toggle (scoped under mapping-list-block)', () => {
    const css = readCss(MAPPING_LIST);
    expect(css).not.toMatch(
      /(?:^|\n)\.mg-v2-ad-b0kla__pill-toggle\s*\{/
    );
    expect(css).toMatch(
      /\.mg-v2-mapping-list-block\s+\.mg-v2-ad-b0kla__pill-toggle\s*\{/
    );
  });

  it('mirrors do not reintroduce track inset padding: 6px or stretch', () => {
    MIRROR_FILES.forEach((file) => {
      const css = readCss(file);
      expect(css).not.toMatch(
        /\.mg-v2-ad-b0kla__pill-toggle[^{]*\{[^}]*padding:\s*6px/
      );
      expect(css).not.toMatch(
        /\.mg-v2-ad-b0kla__pill-toggle[^{]*\{[^}]*align-items:\s*stretch/
      );
    });
  });

  it('ViewModeToggle does not add internal padding-block on track', () => {
    const css = readCss('src/components/common/ViewModeToggle.css');
    const body = extractRuleBody(
      css,
      '.mg-v2-ad-b0kla__pill-toggle.mg-v2-mapping-list-block__toggle'
    );
    expect(body).not.toBeNull();
    expect(body).not.toMatch(/padding-block/);
    expect(body).toMatch(/margin-block:/);
  });
});
