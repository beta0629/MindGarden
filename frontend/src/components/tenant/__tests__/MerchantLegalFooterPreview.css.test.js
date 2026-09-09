/**
 * MerchantLegalFooterPreview CSS — 환불 라벨 ellipsis/mid-word break 금지 (SSOT)
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '..', 'MerchantLegalFooterPreview.css');
const TOKENS_CSS_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'styles',
  'unified-design-tokens.css'
);

const readCss = (filePath) => fs.readFileSync(filePath, 'utf8');

/**
 * @param {string} css
 * @param {string} selector
 * @returns {string|null}
 */
const extractRuleBody = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const match = css.match(re);
  return match ? match[1] : null;
};

describe('MerchantLegalFooterPreview CSS — refund label no ellipsis', () => {
  const css = readCss(CSS_PATH);

  test('.mg-merchant-legal-footer__link has visible overflow / clip / nowrap / keep-all', () => {
    const body = extractRuleBody(css, '.mg-merchant-legal-footer__link');
    expect(body).toBeTruthy();
    expect(body).not.toMatch(/text-overflow:\s*ellipsis/);
    expect(body).toMatch(/overflow:\s*visible/);
    expect(body).toMatch(/text-overflow:\s*clip/);
    expect(body).toMatch(/white-space:\s*nowrap/);
    expect(body).toMatch(/word-break:\s*keep-all/);
  });

  test('.mg-merchant-legal-footer__link-label has no ellipsis and disables span max-width', () => {
    const body = extractRuleBody(css, '.mg-merchant-legal-footer__link-label');
    expect(body).toBeTruthy();
    expect(body).not.toMatch(/text-overflow:\s*ellipsis/);
    expect(body).toMatch(/overflow:\s*visible/);
    expect(body).toMatch(/text-overflow:\s*clip/);
    expect(body).toMatch(/white-space:\s*nowrap/);
    expect(body).toMatch(/word-break:\s*keep-all/);
    expect(body).toMatch(/max-width:\s*none/);
  });

  test('compact grid keeps guide/account columns at max-content (no equal 1fr squeeze)', () => {
    const body = extractRuleBody(
      css,
      '.mg-merchant-legal-footer--compact .mg-merchant-legal-footer__grid'
    );
    expect(body).toBeTruthy();
    expect(body).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+max-content\s+max-content/
    );
    expect(body).not.toMatch(/overflow-x:\s*auto/);
  });
});

describe('unified-design-tokens — merchant legal footer button chrome exception', () => {
  const tokensCss = readCss(TOKENS_CSS_PATH);

  test('global button chrome selectors exclude .mg-merchant-legal-footer__link', () => {
    const chromeBlockMatch = tokensCss.match(
      /\/\*\s*모든 버튼 공통 기본 스타일[\s\S]*?box-sizing:\s*border-box\s*!important;\s*\}/
    );
    expect(chromeBlockMatch).toBeTruthy();
    const chromeBlock = chromeBlockMatch[0];
    expect(chromeBlock).toMatch(/:not\(\.mg-merchant-legal-footer__link\)/);

    const spanBlockMatch = tokensCss.match(
      /\/\*\s*버튼 내부 텍스트 최적화\s*\*\/[\s\S]*?max-width:\s*100%\s*!important;\s*\}/
    );
    expect(spanBlockMatch).toBeTruthy();
    expect(spanBlockMatch[0]).toMatch(/:not\(\.mg-merchant-legal-footer__link\)/);

    const mobileBlockMatch = tokensCss.match(
      /\/\*\s*모바일 전용 버튼 최적화\s*\*\/[\s\S]*?line-height:\s*1\.2\s*!important;\s*\}/
    );
    expect(mobileBlockMatch).toBeTruthy();
    expect(mobileBlockMatch[0]).toMatch(/:not\(\.mg-merchant-legal-footer__link\)/);
  });
});
