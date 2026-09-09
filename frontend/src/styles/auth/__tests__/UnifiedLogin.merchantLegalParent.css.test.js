/**
 * UnifiedLogin CSS — 로그인 rail 부모 체인 ellipsis/클리핑 금지 계약
 *
 * DOM: mg-v2-login-container → content → form-wrapper → merchant-legal → Footer compact
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '..', 'UnifiedLogin.css');

const readCss = () => fs.readFileSync(CSS_PATH, 'utf8');

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

/**
 * merchant-legal 관련 블록만 추출 (주석·셀렉터에 해당 문자열이 있는 규칙)
 * @param {string} css
 * @returns {string}
 */
const extractMerchantLegalBlocks = (css) => {
  const blocks = [];
  const re = /[^{}]*mg-v2-login-merchant-legal[^{]*\{[^}]*\}/g;
  let match = re.exec(css);
  while (match) {
    blocks.push(match[0]);
    match = re.exec(css);
  }
  return blocks.join('\n');
};

describe('UnifiedLogin.css — merchant-legal parent chain no ellipsis', () => {
  const css = readCss();

  test('.mg-v2-login-form-wrapper keeps overflow visible and no ellipsis', () => {
    const body = extractRuleBody(css, '.mg-v2-login-form-wrapper');
    expect(body).toBeTruthy();
    expect(body).toMatch(/overflow:\s*visible/);
    expect(body).not.toMatch(/text-overflow:\s*ellipsis/);
  });

  test('.mg-v2-login-merchant-legal has overflow visible and min-width 0', () => {
    const body = extractRuleBody(css, '.mg-v2-login-merchant-legal');
    expect(body).toBeTruthy();
    expect(body).toMatch(/overflow:\s*visible/);
    expect(body).toMatch(/min-width:\s*0/);
    expect(body).not.toMatch(/text-overflow:\s*ellipsis/);
  });

  test('.mg-v2-login-merchant-legal link rules use clip / visible (no ellipsis)', () => {
    const linkBody = extractRuleBody(
      css,
      '.mg-v2-login-merchant-legal .mg-merchant-legal-footer__link'
    );
    // 콤마로 묶인 셀렉터일 수 있음
    const combined = extractRuleBody(
      css,
      '.mg-v2-login-merchant-legal .mg-merchant-legal-footer__link,\\s*\\.mg-v2-login-merchant-legal .mg-merchant-legal-footer__link-label'
    );
    const body = linkBody || combined || (() => {
      const re = /\.mg-v2-login-merchant-legal\s+\.mg-merchant-legal-footer__link[\s\S]*?\{([^}]*)\}/;
      const m = css.match(re);
      return m ? m[1] : null;
    })();
    expect(body).toBeTruthy();
    expect(body).toMatch(/overflow:\s*visible/);
    expect(body).toMatch(/text-overflow:\s*clip/);
    expect(body).not.toMatch(/text-overflow:\s*ellipsis/);
  });

  test('merchant-legal blocks contain zero text-overflow:ellipsis', () => {
    const blocks = extractMerchantLegalBlocks(css);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks).not.toMatch(/text-overflow:\s*ellipsis/);
  });

  test('login compact grid uses max-content for guide columns', () => {
    const body = extractRuleBody(
      css,
      '.mg-v2-login-merchant-legal .mg-merchant-legal-footer--compact .mg-merchant-legal-footer__grid'
    );
    expect(body).toBeTruthy();
    expect(body).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+max-content\s+max-content/
    );
  });

  test('mobile merchant-legal overflow remains visible under container overflow-x hidden', () => {
    const mediaStart = css.search(/@media\s*\(\s*max-width:\s*767px\s*\)/);
    expect(mediaStart).toBeGreaterThanOrEqual(0);
    const mobileSlice = css.slice(mediaStart);
    expect(mobileSlice).toMatch(/\.mg-v2-login-container[\s\S]*?overflow-x:\s*hidden/);
    expect(mobileSlice).toMatch(
      /\.mg-v2-login-merchant-legal[\s,][\s\S]*?overflow:\s*visible/
    );
  });
});
