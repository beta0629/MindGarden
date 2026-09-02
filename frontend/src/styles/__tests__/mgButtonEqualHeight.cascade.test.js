/**
 * MGButton outline vs solid equal-height cascade gate
 * ActionBar box model must win over mindgarden-design-system / modal actions leaks.
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import fs from 'fs';
import path from 'path';

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..');

const readCss = (relativePath) =>
  fs.readFileSync(path.join(FRONTEND_ROOT, relativePath), 'utf8');

/**
 * Extract a CSS rule body for selectors that include the given fragment
 * and target modal actions primary/outline buttons.
 */
const extractModalActionsButtonBlocks = (css) => {
  const blocks = [];
  const re =
    /\.mg-modal(?:\.mg-v2-ad-b0kla)?\s+\.mg-modal__actions[^{]*\{[^}]*\}/g;
  let match = re.exec(css);
  while (match) {
    blocks.push(match[0]);
    match = re.exec(css);
  }
  return blocks;
};

describe('MGButton equal-height box model (outline vs solid)', () => {
  const mgButtonCss = readCss('src/components/common/MGButton.css');
  const designSystemCss = readCss('src/styles/mindgarden-design-system.css');
  const unifiedModalsCss = readCss('src/styles/06-components/_unified-modals.css');
  const actionBarCss = readCss('src/components/common/ActionBar.css');
  const mappingCreationModalCss = readCss('src/components/admin/MappingCreationModal.css');
  const b0klaCss = readCss('src/components/admin/AdminDashboard/AdminDashboardB0KlA.css');

  test('MGButton locks height/min/max and 1px border on base', () => {
    expect(mgButtonCss).toMatch(/border-width:\s*1px\s*!important/);
    expect(mgButtonCss).toMatch(/border-style:\s*solid\s*!important/);
    expect(mgButtonCss).toMatch(/box-sizing:\s*border-box\s*!important/);
    expect(mgButtonCss).toMatch(/line-height:\s*1\s*!important/);
    expect(mgButtonCss).toMatch(/transform:\s*none\s*!important/);
    expect(mgButtonCss).toMatch(
      /\.mg-button--medium\s*\{[^}]*height:\s*var\(--button-height-default\)\s*!important/s
    );
    expect(mgButtonCss).toMatch(
      /\.mg-button--medium\s*\{[^}]*max-height:\s*var\(--button-height-default\)\s*!important/s
    );
    expect(mgButtonCss).not.toMatch(/translateY\(-1px\)/);
  });

  test('MGButton locks 1px border on outline and solid variants', () => {
    expect(mgButtonCss).toMatch(
      /\.mg-button\.mg-button--outline[\s\S]*?border-width:\s*1px\s*!important/
    );
    expect(mgButtonCss).toMatch(
      /\.mg-button\.mg-button--primary[\s\S]*?border-width:\s*1px\s*!important/
    );
    expect(mgButtonCss).toMatch(
      /\.mg-button\.mg-button--success[\s\S]*?border-width:\s*1px\s*!important/
    );
    expect(mgButtonCss).toMatch(
      /\.mg-button\.mg-button--danger[\s\S]*?border-width:\s*1px\s*!important/
    );
  });

  test('mindgarden-design-system does not reset border to none or vertical padding sizes', () => {
    expect(designSystemCss).not.toMatch(/\.mg-button\s*\{[^}]*border:\s*none/s);
    expect(designSystemCss).toMatch(/\.mg-button\s*\{[^}]*border:\s*1px\s+solid\s+transparent/s);
    expect(designSystemCss).toMatch(
      /\.mg-button--medium\s*\{[^}]*height:\s*var\(--button-height-default\)/s
    );
    expect(designSystemCss).not.toMatch(
      /\.mg-button--medium\s*\{[^}]*min-height:\s*40px/s
    );
    expect(designSystemCss).not.toMatch(
      /\.mg-button--medium\s*\{[^}]*line-height:\s*1\.4/s
    );
  });

  test('unified modal actions lock height trio + 1px border contract', () => {
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?height:\s*var\(--button-height-default\)\s*!important/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?max-height:\s*var\(--button-height-default\)\s*!important/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?border-width:\s*1px/
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
  });

  test('ActionBar still forces equal height with border 0 override', () => {
    expect(actionBarCss).toMatch(/border:\s*0\s*!important/);
    expect(actionBarCss).toMatch(/height:\s*var\(--mg-actionbar-action-min-height\)\s*!important/);
    expect(actionBarCss).toMatch(/max-height:\s*var\(--mg-actionbar-action-min-height\)\s*!important/);
    expect(actionBarCss).toMatch(/transform:\s*none\s*!important/);
  });

  test('MappingCreationModal modal-actions do not use border:none or border:2px on buttons', () => {
    const actionBlocks = extractModalActionsButtonBlocks(mappingCreationModalCss);
    expect(actionBlocks.length).toBeGreaterThan(0);

    const primaryOrOutlineBlocks = actionBlocks.filter(
      (block) =>
        /mg-button--primary|mg-v2-button-primary|mg-button--outline|mg-v2-button-outline/.test(
          block
        )
    );
    expect(primaryOrOutlineBlocks.length).toBeGreaterThan(0);

    primaryOrOutlineBlocks.forEach((block) => {
      expect(block).not.toMatch(/border:\s*none/);
      expect(block).not.toMatch(/border:\s*2px/);
    });

    expect(mappingCreationModalCss).toMatch(
      /\.mg-modal\.mg-v2-ad-b0kla\s+\.mg-modal__actions\s+\.mg-button--primary[\s\S]*?border-color:\s*transparent/
    );
    expect(mappingCreationModalCss).toMatch(
      /\.mg-modal\.mg-v2-ad-b0kla\s+\.mg-modal__actions\s+\.mg-button--outline[\s\S]*?border-color:\s*var\(--ad-b0kla-green\)/
    );
  });

  test('B0KlA outline button uses 1px border, not 2px shorthand', () => {
    expect(b0klaCss).toMatch(
      /\.mg-v2-ad-b0kla\s+\.mg-v2-button-outline\s*\{[^}]*border-width:\s*1px/s
    );
    expect(b0klaCss).toMatch(
      /\.mg-v2-ad-b0kla\s+\.mg-v2-button-outline\s*\{[^}]*border-color:\s*var\(--ad-b0kla-green\)/s
    );
    expect(b0klaCss).not.toMatch(
      /\.mg-v2-ad-b0kla\s+\.mg-v2-button-outline\s*\{[^}]*border:\s*2px\s+solid/s
    );
  });

  test('ConsultationLogModal footer uses matching medium MGButton trio (ghost / outline / primary)', () => {
    const modalSrc = readCss('src/components/consultant/ConsultationLogModal.js');
    expect(modalSrc).toMatch(/import MGButton from ['"]\.\.\/common\/MGButton['"]/);
    expect(modalSrc).toMatch(/buildErpMgButtonClassName/);
    expect(modalSrc).toMatch(/consultation-log-modal__footer-actions/);
    expect(modalSrc).toMatch(/variant="ghost"[\s\S]*?size="medium"[\s\S]*?common\.actions\.cancel/);
    expect(modalSrc).toMatch(/variant="outline"[\s\S]*?size="medium"[\s\S]*?저장/);
    expect(modalSrc).toMatch(/variant="primary"[\s\S]*?size="medium"[\s\S]*?완료/);
    expect(modalSrc).not.toMatch(/import ActionBar from/);
    expect(modalSrc).not.toMatch(/ActionBarButton/);
    expect(modalSrc).toMatch(/className="mg-v2-clinic-os"/);
    expect(modalSrc).not.toMatch(/mg-v2-ad-b0kla/);
  });

  test('ActionButton.css solid variants use transparent 1px border (not border:none)', () => {
    const actionButtonCss = readCss('src/components/common/ActionButton.css');
    const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
    const solidSelectors = [
      /\.mg-v2-button--primary,\s*\.mg-v2-button-primary\s*\{([^}]*)\}/s,
      /\.mg-v2-button--success,\s*\.mg-v2-button-success\s*\{([^}]*)\}/s,
      /\.mg-v2-button--danger,\s*\.mg-v2-button-danger\s*\{([^}]*)\}/s
    ];

    solidSelectors.forEach((re) => {
      const match = stripComments(actionButtonCss).match(re);
      expect(match).not.toBeNull();
      const body = match[1];
      expect(body).not.toMatch(/(?:^|;)\s*border:\s*none\b/);
      expect(body).toMatch(/border-width:\s*1px/);
      expect(body).toMatch(/border-style:\s*solid/);
      expect(body).toMatch(/border-color:\s*transparent/);
    });

    // outline/secondary keep visible 1px solid border via longhand (not border:none / shorthand-only)
    const outlineMatch = stripComments(actionButtonCss).match(
      /\.mg-v2-button--outline,\s*\.mg-v2-button-outline\s*\{([^}]*)\}/s
    );
    expect(outlineMatch).not.toBeNull();
    expect(outlineMatch[1]).toMatch(/border-width:\s*1px/);
    expect(outlineMatch[1]).toMatch(/border-style:\s*solid/);
    expect(outlineMatch[1]).toMatch(/border-color:/);

    const secondaryMatch = stripComments(actionButtonCss).match(
      /\.mg-v2-button--secondary,\s*\.mg-v2-button-secondary\s*\{([^}]*)\}/s
    );
    expect(secondaryMatch).not.toBeNull();
    expect(secondaryMatch[1]).not.toMatch(/(?:^|;)\s*border:\s*1px\s+solid\b/);
    expect(secondaryMatch[1]).toMatch(/border-width:\s*1px/);
    expect(secondaryMatch[1]).toMatch(/border-style:\s*solid/);
    expect(secondaryMatch[1]).toMatch(/border-color:/);
  });

  test('AuthPageCommon scopes mg-v2-button-secondary margin-top under mg-v2-auth-container', () => {
    const authPageCommonCss = readCss('src/components/auth/AuthPageCommon.css');

    expect(authPageCommonCss).not.toMatch(
      /^\s*\.mg-v2-button-secondary\s*\{[^}]*margin-top:\s*8px/m
    );
    expect(authPageCommonCss).not.toMatch(
      /^\s*\.mg-v2-button-primary\s*\{[^}]*margin-top:\s*8px/m
    );
    expect(authPageCommonCss).toMatch(
      /\.mg-v2-auth-container\s+\.mg-v2-button-secondary\s*\{[^}]*margin-top:\s*8px/s
    );
    expect(authPageCommonCss).toMatch(
      /\.mg-v2-auth-container\s+\.mg-v2-button-primary\s*\{[^}]*margin-top:\s*8px/s
    );
  });

  test('MappingCancelModal footer uses matching medium secondary+danger MGButton pair', () => {
    const modalSrc = readCss(
      'src/components/admin/mapping-management/molecules/MappingCancelModal.js'
    );

    expect(modalSrc).toMatch(
      /MAPPING_CANCEL_BACK_BUTTON_TEST_ID\s*=\s*'mapping-cancel-modal-back'/
    );
    expect(modalSrc).toMatch(
      /MAPPING_CANCEL_CONFIRM_BUTTON_TEST_ID\s*=\s*'mapping-cancel-modal-confirm'/
    );
    expect(modalSrc).toMatch(
      /variant="secondary"[\s\S]*?size="medium"[\s\S]*?data-testid=\{MAPPING_CANCEL_BACK_BUTTON_TEST_ID\}/
    );
    expect(modalSrc).toMatch(
      /variant="danger"[\s\S]*?size="medium"[\s\S]*?data-testid=\{MAPPING_CANCEL_CONFIRM_BUTTON_TEST_ID\}/
    );
    expect(modalSrc).toMatch(/onClick=\{onClose\}/);
    expect(modalSrc).toMatch(/onClick=\{onConfirm\}/);
    expect(modalSrc).not.toMatch(/variant="primary"/);
  });

  test('unified modal dual-class height lock includes ghost (mg-v2-button-ghost / mg-button--ghost)', () => {
    // #720 누락 재발 방지: ghost+primary 푸터도 secondary/primary와 동일 !important 높이 계약
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button\.mg-v2-button\.mg-v2-button-ghost/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button\.mg-v2-button\.mg-button--ghost/
    );

    const dualClassBlock = unifiedModalsCss.match(
      /\.mg-modal__actions\s+\.mg-button\.mg-v2-button\.mg-v2-button-ghost[\s\S]*?\{([^}]*)\}/
    );
    expect(dualClassBlock).not.toBeNull();
    expect(dualClassBlock[1]).toMatch(/height:\s*var\(--button-height-default\)\s*!important/);
    expect(dualClassBlock[1]).toMatch(/min-height:\s*var\(--button-height-default\)\s*!important/);
    expect(dualClassBlock[1]).toMatch(/max-height:\s*var\(--button-height-default\)\s*!important/);
    expect(dualClassBlock[1]).toMatch(/padding:\s*var\(--button-padding-default\)\s*!important/);
    expect(dualClassBlock[1]).toMatch(/transform:\s*none\s*!important/);
  });

  test('unified modal ghost footer uses Clinic-OS slate hairline border-color token', () => {
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions[\s\S]*?\.mg-button--ghost[\s\S]*?border-color:\s*var\(--mg-v2-color-neutral-300/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions[\s\S]*?\.mg-button--ghost[\s\S]*?color:\s*var\(--mg-v2-color-text-primary/
    );
  });

  test('TabChipRow.css locks equal height for primary+outline+ghost in chip row context', () => {
    const tabChipRowCss = readCss('src/components/common/TabChipRow.css');

    expect(tabChipRowCss).toMatch(/\.mg-tab-chip-row\s*\{[^}]*align-items:\s*stretch/s);
    expect(tabChipRowCss).not.toMatch(/\.mg-tab-chip-row\s*\{[^}]*align-items:\s*center/s);

    expect(tabChipRowCss).toMatch(
      /\.mg-tab-chip-row\s+\.mg-button[\s\S]*?height:\s*var\(--button-height-sm\)\s*!important/
    );
    expect(tabChipRowCss).toMatch(
      /\.mg-tab-chip-row\s+\.mg-button[\s\S]*?min-height:\s*var\(--button-height-sm\)\s*!important/
    );
    expect(tabChipRowCss).toMatch(
      /\.mg-tab-chip-row\s+\.mg-button[\s\S]*?max-height:\s*var\(--button-height-sm\)\s*!important/
    );
    expect(tabChipRowCss).toMatch(
      /\.mg-tab-chip-row\s+\.mg-button[\s\S]*?transform:\s*none\s*!important/
    );
    expect(tabChipRowCss).toMatch(
      /\.mg-tab-chip-row\s+\.mg-button[\s\S]*?margin:\s*0\s*!important/
    );
    expect(tabChipRowCss).toMatch(
      /\.mg-tab-chip-row\s+\.mg-button[\s\S]*?border-width:\s*1px/
    );

    expect(tabChipRowCss).toMatch(
      /\.mg-tab-chip-row\s+\.mg-button\.mg-v2-button\.mg-v2-button-ghost/
    );
    expect(tabChipRowCss).toMatch(
      /\.mg-tab-chip-row\s+\.mg-button\.mg-v2-button\.mg-button--ghost/
    );

    const ghostBlock = tabChipRowCss.match(
      /\.mg-tab-chip-row\s+\.mg-button\.mg-v2-button\.mg-v2-button-ghost[\s\S]*?\{([^}]*)\}/
    );
    expect(ghostBlock).not.toBeNull();
    expect(ghostBlock[1]).toMatch(/height:\s*var\(--button-height-sm\)\s*!important/);
    expect(ghostBlock[1]).toMatch(/transform:\s*none\s*!important/);
  });

  test('SalaryManagement.css does not override header primary with border:none', () => {
    const salaryCss = readCss('src/components/erp/SalaryManagement.css');
    const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
    const stripped = stripComments(salaryCss);

    // Page must not redefine primary box model — MGButton SSOT owns transparent 1px border
    expect(stripped).not.toMatch(
      /\.salary-management__header-btn--primary\s*\{[^}]*border:\s*none/s
    );
    expect(stripped).not.toMatch(
      /\.salary-management__header-btn--primary\s*\{/s
    );
  });
});
