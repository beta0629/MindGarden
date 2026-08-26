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
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?height:\s*var\(--button-height-default\)/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?max-height:\s*var\(--button-height-default\)/
    );
    expect(unifiedModalsCss).toMatch(
      /\.mg-modal__actions\s+\.mg-button[\s\S]*?border-width:\s*1px/
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
});
