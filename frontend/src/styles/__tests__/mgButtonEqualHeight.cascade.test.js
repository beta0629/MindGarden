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

describe('MGButton equal-height box model (outline vs solid)', () => {
  const mgButtonCss = readCss('src/components/common/MGButton.css');
  const designSystemCss = readCss('src/styles/mindgarden-design-system.css');
  const unifiedModalsCss = readCss('src/styles/06-components/_unified-modals.css');
  const actionBarCss = readCss('src/components/common/ActionBar.css');

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
});
