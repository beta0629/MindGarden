/**
 * GNB dropdown overlay/panel z-index SSOT (mobile logout overlay fix)
 * overlay --z-header (1000) < panel --z-header-dropdown (1001)
 * desktop: overlay display:none !important outside max-width 767px
 */
import fs from 'fs';
import path from 'path';

const readCss = (relativeFromFrontendSrc) =>
  fs.readFileSync(
    path.join(__dirname, '..', '..', '..', '..', relativeFromFrontendSrc),
    'utf8'
  );

describe('dropdown-common / z-index tokens', () => {
  const zIndexCss = readCss('styles/01-settings/_z-index.css');
  const dropdownCss = fs.readFileSync(
    path.join(__dirname, '../dropdown-common.css'),
    'utf8'
  );

  it('--z-header=1000, --z-header-dropdown=1001 (panel > overlay)', () => {
    expect(zIndexCss).toMatch(/--z-header:\s*1000\s*;/);
    expect(zIndexCss).toMatch(/--z-header-dropdown:\s*1001\s*;/);
  });

  it('overlay uses --z-header; panel uses --z-header-dropdown', () => {
    expect(dropdownCss).toMatch(
      /\.mg-v2-dropdown-overlay\s*\{[\s\S]*?z-index:\s*var\(--z-header\);/
    );
    expect(dropdownCss).toMatch(
      /\.mg-v2-dropdown-panel[\s\S]*?z-index:\s*var\(--z-header-dropdown\);/
    );
  });

  it('desktop default hides overlay; mobile ≤767 shows it', () => {
    expect(dropdownCss).toMatch(
      /\.mg-v2-dropdown-overlay\s*\{[\s\S]*?display:\s*none\s*!important;/
    );
    expect(dropdownCss).toMatch(
      /@media\s*\(\s*max-width:\s*767px\s*\)\s*\{[\s\S]*?\.mg-v2-dropdown-overlay\s*\{[\s\S]*?display:\s*block\s*!important;/
    );
  });
});
