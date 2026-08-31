/**
 * MappingCancelModal footer — secondary/danger zero-offset box-model contract.
 * JSDOM layout is limited; injects real CSS + resolved tokens and asserts
 * getComputedStyle parity (height trio, transform, align-self).
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import fs from 'fs';
import path from 'path';

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..', '..');

const readCss = (relativePath) =>
  fs.readFileSync(path.join(FRONTEND_ROOT, relativePath), 'utf8');

const CSS_TOKEN_ROOT = `
:root {
  --button-height-default: 40px;
  --button-height-sm: 32px;
  --button-padding-default: 0 16px;
  --button-padding-sm: 0 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --mg-v2-font-size-body-md: 14px;
  --cs-font-medium: 600;
  --mg-button-radius: 10px;
  --font-family-base: sans-serif;
  --mg-color-surface-main: #f3f4f6;
  --mg-color-text-main: #111827;
  --mg-color-border-main: #e5e7eb;
  --mg-gray-100: #f3f4f6;
  --mg-gray-200: #e5e7eb;
  --mg-gray-900: #111827;
  --mg-error-500: #a84848;
  --mg-white: #ffffff;
  --cs-secondary-500: #64748b;
  --cs-secondary-600: #475569;
  --mg-color-secondary-main: #64748b;
  --mg-color-text-on-primary: #ffffff;
}
`;

const FOOTER_BUTTON_MARKUP = `
<div class="mg-modal__actions" data-testid="footer">
  <button
    type="button"
    class="mg-button mg-button--secondary mg-button--medium mg-v2-button mg-v2-button-secondary"
    data-testid="mapping-cancel-modal-back"
  >돌아가기</button>
  <button
    type="button"
    class="mg-button mg-button--danger mg-button--medium mg-v2-button mg-v2-button-danger"
    data-testid="mapping-cancel-modal-confirm"
  >매칭 취소</button>
</div>
`;

const CSS_VAR_RESOLUTIONS = [
  [/var\(--button-height-default\)/g, '40px'],
  [/var\(--button-height-sm\)/g, '32px'],
  [/var\(--button-padding-default\)/g, '0 16px'],
  [/var\(--button-padding-sm\)/g, '0 12px'],
  [/var\(--mg-v2-font-size-body-md\)/g, '14px'],
  [/var\(--cs-font-medium\)/g, '600'],
  [/var\(--mg-button-radius(?:,\s*[^)]+)?\)/g, '10px'],
  [/var\(--font-family-base(?:,\s*[^)]+)?\)/g, 'sans-serif']
];

function resolveCssVarsForTest(css) {
  return CSS_VAR_RESOLUTIONS.reduce(
    (resolved, [pattern, replacement]) => resolved.replace(pattern, replacement),
    css
  );
}

function buildFooterStylesheet() {
  const raw = [
    CSS_TOKEN_ROOT,
    readCss('src/components/common/MGButton.css'),
    readCss('src/components/common/ActionButton.css'),
    readCss('src/styles/06-components/_unified-modals.css'),
    readCss('src/components/auth/AuthPageCommon.css')
  ].join('\n');
  return resolveCssVarsForTest(raw);
}

function mountFooterWithCss() {
  const css = buildFooterStylesheet();
  document.body.innerHTML = FOOTER_BUTTON_MARKUP;
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-testid', 'footer-css-fixture');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  return {
    back: document.querySelector('[data-testid="mapping-cancel-modal-back"]'),
    confirm: document.querySelector('[data-testid="mapping-cancel-modal-confirm"]'),
    footer: document.querySelector('[data-testid="footer"]')
  };
}

function readBoxContract(el) {
  const style = window.getComputedStyle(el);
  return {
    height: style.height,
    minHeight: style.minHeight,
    maxHeight: style.maxHeight,
    marginTop: style.marginTop,
    paddingTop: style.paddingTop,
    paddingBottom: style.paddingBottom,
    borderTopWidth: style.borderTopWidth,
    borderBottomWidth: style.borderBottomWidth,
    transform: style.transform,
    alignSelf: style.alignSelf,
    boxSizing: style.boxSizing,
    offsetTop: el.offsetTop
  };
}

describe('MappingCancelModal footer alignment (real CSS cascade)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document
      .querySelectorAll('style[data-testid="footer-css-fixture"]')
      .forEach((node) => node.remove());
  });

  test('secondary and danger share height trio, padding, transform, and offsetTop', () => {
    const { back, confirm } = mountFooterWithCss();
    const backBox = readBoxContract(back);
    const confirmBox = readBoxContract(confirm);

    expect(backBox.height).toBe('40px');
    expect(confirmBox.height).toBe('40px');
    expect(backBox.minHeight).toBe('40px');
    expect(confirmBox.minHeight).toBe('40px');
    expect(backBox.maxHeight).toBe('40px');
    expect(confirmBox.maxHeight).toBe('40px');

    expect(backBox.marginTop).toBe(confirmBox.marginTop);
    expect(backBox.marginTop).toBe('0px');
    expect(confirmBox.marginTop).toBe('0px');

    expect(backBox.paddingTop).toBe(confirmBox.paddingTop);
    expect(backBox.paddingBottom).toBe(confirmBox.paddingBottom);
    expect(backBox.borderTopWidth).toBe(confirmBox.borderTopWidth);
    expect(backBox.borderBottomWidth).toBe(confirmBox.borderBottomWidth);

    expect(backBox.transform).toBe('none');
    expect(confirmBox.transform).toBe('none');
    expect(backBox.alignSelf).toBe('center');
    expect(confirmBox.alignSelf).toBe('center');

    expect(back.offsetTop).toBe(confirm.offsetTop);
    expect(back.getBoundingClientRect().top).toBe(confirm.getBoundingClientRect().top);
    expect(back.getBoundingClientRect().bottom).toBe(confirm.getBoundingClientRect().bottom);
  });

  test('unified modal actions mirror ActionBar !important height lock (CSS source)', () => {
    const unifiedModalsCss = readCss('src/styles/06-components/_unified-modals.css');

    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?height:\s*var\(--button-height-default\)\s*!important/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?max-height:\s*var\(--button-height-default\)\s*!important/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?transform:\s*none\s*!important/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?align-self:\s*center\s*!important/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?margin:\s*0\s*!important/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button\.mg-v2-button[\s\S]*?height:\s*var\(--button-height-default\)\s*!important/
    );
  });
});
