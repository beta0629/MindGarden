/**
 * useDropdownPosition — panel inline zIndex must match dropdown-common SSOT
 */
import fs from 'fs';
import path from 'path';

describe('useDropdownPosition zIndex SSOT', () => {
  it('Z_INDEX_DROPDOWN uses var(--z-header-dropdown)', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../useDropdownPosition.js'),
      'utf8'
    );
    expect(src).toMatch(
      /const\s+Z_INDEX_DROPDOWN\s*=\s*['"]var\(--z-header-dropdown\)['"]/
    );
  });
});
