/**
 * B0KlA pill-toggle CSS regression — 트랙(외곽)이 내부 pill 높이에
 * shrink-to-fit 되도록 검증. fill/stretch 재도입 금지.
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

const SSOT = 'src/components/admin/AdminDashboard/AdminDashboardB0KlA.css';
const MIRROR_FILES = [
  'src/components/admin/mapping-management/organisms/MappingListBlock.css',
  'src/components/erp/IntegratedFinanceDashboard.css',
  'src/components/common/ViewModeToggle.css'
];

describe('B0KlA pill-toggle shrink-to-fit', () => {
  const ssotCss = readCss(SSOT);

  it('SSOT: pill-toggle shrinks to content (center, height auto, no inset padding)', () => {
    const body = extractRuleBody(ssotCss, '.mg-v2-ad-b0kla__pill-toggle');
    expect(body).not.toBeNull();
    expect(body).toMatch(/align-items:\s*center/);
    expect(body).toMatch(/height:\s*auto/);
    expect(body).toMatch(/padding:\s*0/);
    expect(body).not.toMatch(/align-items:\s*stretch/);
    expect(body).not.toMatch(/padding:\s*6px/);
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

  it('SSOT: MGButton pill override keeps height auto (no stretch)', () => {
    const body = extractRuleBody(ssotCss, 'button.mg-v2-ad-b0kla__pill.mg-button');
    expect(body).not.toBeNull();
    expect(body).not.toMatch(/align-self:\s*stretch/);
    expect(body).toMatch(/height:\s*auto/);
    expect(body).toMatch(/padding:\s*var\(--mg-v2-space-3/);
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
