/**
 * TenantCommonCodeFormModal footer — ghost+primary zero-offset box-model contract.
 * JSDOM layout is limited; injects real CSS + resolved tokens and asserts
 * getComputedStyle parity (height trio, transform, align-self).
 * Also guards ModalFormActions SSOT wiring (no per-page button skin).
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
  --mg-primary-500: #0e5f5a;
  --mg-color-primary-main: #0e5f5a;
  --mg-white: #ffffff;
  --cs-secondary-500: #64748b;
  --mg-color-secondary-main: #64748b;
  --mg-color-text-on-primary: #ffffff;
  --mg-color-text-secondary: #64748b;
  --mg-color-background-sub: #f3f4f6;
}
`;

const FOOTER_BUTTON_MARKUP = `
<div class="mg-modal__actions" data-testid="footer">
  <div class="mg-modal__form-actions" data-testid="modal-form-actions">
    <button
      type="button"
      class="mg-button mg-button--ghost mg-button--medium mg-v2-button mg-v2-button-ghost"
      data-testid="modal-form-actions-cancel"
    >취소</button>
    <button
      type="submit"
      class="mg-button mg-button--primary mg-button--medium mg-v2-button mg-v2-button-primary"
      data-testid="modal-form-actions-submit"
    >추가</button>
  </div>
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
    cancel: document.querySelector('[data-testid="modal-form-actions-cancel"]'),
    submit: document.querySelector('[data-testid="modal-form-actions-submit"]'),
    footer: document.querySelector('[data-testid="footer"]'),
    actions: document.querySelector('[data-testid="modal-form-actions"]')
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

describe('TenantCommonCodeFormModal footer alignment (ghost+primary)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document
      .querySelectorAll('style[data-testid="footer-css-fixture"]')
      .forEach((node) => node.remove());
  });

  test('footer source uses ModalFormActions with ghost cancel + primary submit (md)', () => {
    const modalSrc = readCss(
      'src/components/admin/tenant-common-codes/molecules/TenantCommonCodeFormModal.js'
    );
    const actionsSrc = readCss('src/components/common/modals/ModalFormActions.js');

    expect(modalSrc).toMatch(/import ModalFormActions from ['"].*ModalFormActions['"]/);
    expect(modalSrc).toMatch(/<ModalFormActions[\s\S]*?cancelVariant="ghost"/);
    expect(modalSrc).toMatch(/<ModalFormActions[\s\S]*?submitVariant="primary"/);
    expect(modalSrc).toMatch(/submitFormId=\{TENANT_COMMON_CODE_FORM_ID\}/);
    expect(modalSrc).not.toMatch(/import MGButton from/);
    expect(modalSrc).not.toMatch(/buildErpMgButtonClassName/);

    expect(actionsSrc).toMatch(/buildErpMgButtonClassName/);
    expect(actionsSrc).toMatch(/import MGButton from/);
    expect(actionsSrc).toMatch(/MODAL_FORM_ACTION_SIZE\s*=\s*'md'/);
    expect(actionsSrc).toMatch(/MODAL_FORM_ACTION_MG_SIZE\s*=\s*'medium'/);
    expect(actionsSrc).toMatch(/cancelVariant\s*=\s*'ghost'/);
    expect(actionsSrc).toMatch(/submitVariant\s*=\s*'primary'/);
    expect(actionsSrc).toMatch(/data-testid="modal-form-actions"/);
    expect(actionsSrc).toMatch(/data-testid="modal-form-actions-cancel"/);
    expect(actionsSrc).toMatch(/data-testid="modal-form-actions-submit"/);

    // 동일 size: cancel·submit 모두 md (ERP class) + medium (MGButton)
    const sizeUsages = actionsSrc.match(/size:\s*MODAL_FORM_ACTION_SIZE/g) || [];
    expect(sizeUsages.length).toBeGreaterThanOrEqual(2);
    const mgSizeUsages = actionsSrc.match(/size=\{MODAL_FORM_ACTION_MG_SIZE\}/g) || [];
    expect(mgSizeUsages.length).toBeGreaterThanOrEqual(2);
  });

  test('FormModal also consumes ModalFormActions with ghost cancel', () => {
    const formModalSrc = readCss('src/components/common/modals/FormModal.js');
    expect(formModalSrc).toMatch(/import ModalFormActions from ['"].*ModalFormActions['"]/);
    expect(formModalSrc).toMatch(/cancelVariant="ghost"/);
    expect(formModalSrc).not.toMatch(/variant="secondary"/);
  });

  test('ghost and primary share height trio, padding, transform, and offsetTop', () => {
    const { cancel, submit } = mountFooterWithCss();
    const cancelBox = readBoxContract(cancel);
    const submitBox = readBoxContract(submit);

    expect(cancelBox.height).toBe('40px');
    expect(submitBox.height).toBe('40px');
    expect(cancelBox.minHeight).toBe('40px');
    expect(submitBox.minHeight).toBe('40px');
    expect(cancelBox.maxHeight).toBe('40px');
    expect(submitBox.maxHeight).toBe('40px');

    expect(cancelBox.marginTop).toBe(submitBox.marginTop);
    expect(cancelBox.marginTop).toBe('0px');
    expect(submitBox.marginTop).toBe('0px');

    expect(cancelBox.paddingTop).toBe(submitBox.paddingTop);
    expect(cancelBox.paddingBottom).toBe(submitBox.paddingBottom);
    expect(cancelBox.borderTopWidth).toBe(submitBox.borderTopWidth);
    expect(cancelBox.borderBottomWidth).toBe(submitBox.borderBottomWidth);
    expect(cancelBox.borderTopWidth).toBe('1px');
    expect(submitBox.borderTopWidth).toBe('1px');

    expect(cancelBox.transform).toBe('none');
    expect(submitBox.transform).toBe('none');
    expect(cancelBox.alignSelf).toBe('center');
    expect(submitBox.alignSelf).toBe('center');

    expect(cancel.offsetTop).toBe(submit.offsetTop);
    expect(cancel.getBoundingClientRect().top).toBe(submit.getBoundingClientRect().top);
    expect(cancel.getBoundingClientRect().bottom).toBe(submit.getBoundingClientRect().bottom);
  });

  test('unified modal dual-class lock lists ghost alongside primary', () => {
    const unifiedModalsCss = readCss('src/styles/06-components/_unified-modals.css');

    expect(unifiedModalsCss).toMatch(/mg-v2-button-ghost/);
    expect(unifiedModalsCss).toMatch(/mg-button--ghost/);
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button\.mg-v2-button\.mg-v2-button-ghost/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button\.mg-v2-button\.mg-button--ghost/
    );
    expect(unifiedModalsCss).not.toMatch(
      /TenantCommonCode|tenant-common-code.*height|tenant.*button.*height/i
    );
  });
});
