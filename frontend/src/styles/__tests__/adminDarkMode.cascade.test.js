/**
 * Admin Dark Mode C-3 — token/cascade Jest gate
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import fs from 'fs';
import path from 'path';

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..');
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..');

const readCss = (relativePath) =>
  fs.readFileSync(path.join(FRONTEND_ROOT, relativePath), 'utf8');

const extractDarkBlocks = (css) => {
  const blocks = [];
  const regex = /\[data-theme=["']dark["']\][^{]*\{([^}]*)\}/g;
  let match = regex.exec(css);
  while (match) {
    blocks.push(match[1]);
    match = regex.exec(css);
  }
  return blocks.join('\n');
};

const C3_TOKEN_NAMES = [
  '--mg-dark-toolbar-bg',
  '--mg-dark-toolbar-border',
  '--mg-dark-chip-bg',
  '--mg-dark-chip-text',
  '--mg-dark-chip-active-bg',
  '--mg-dark-chip-active-text',
  '--mg-v2-form-bg',
  '--mg-v2-form-input-bg',
  '--mg-v2-form-border',
  '--mg-v2-form-text',
  '--mg-v2-form-focus-ring',
  '--mg-v2-form-label',
  '--mg-v2-form-error',
  '--ad-b0kla-table-header-text',
  '--ad-b0kla-table-border',
  '--ad-b0kla-table-row-selected',
  '--color-text-primary',
  '--color-background-primary'
];

const C3_COMPONENT_FILES = [
  'src/styles/06-components/_unified-modals.css',
  'src/components/erp/common/molecules/ErpFilterToolbar.css',
  'src/components/erp/ErpCommon.css',
  'src/components/admin/AdminDashboard/AdminDashboardB0KlA.css',
  'src/components/admin/ConsultationLogViewPage.css',
  'src/components/admin/ClientComprehensiveManagement/atoms/SavedViewChip.css',
  'src/components/admin/mapping-management/organisms/MappingFilterSection.css',
  'src/components/admin/mapping-management/IntegratedMatchingSchedule.css'
];

const HEX_IN_DECLARATION = /:\s*[^;{]*#[0-9a-fA-F]{3,8}/;

describe('Admin Dark Mode C-3 cascade', () => {
  test('dashboard-tokens-extension [data-theme="dark"] 에 C-3 토큰이 정의됨', () => {
    const css = readCss('src/styles/dashboard-tokens-extension.css');
    const darkBlock = extractDarkBlocks(css);

    C3_TOKEN_NAMES.forEach((token) => {
      expect(darkBlock).toContain(token);
    });
  });

  test('글로벌 UnifiedModal dark cascade 셀렉터 존재', () => {
    const css = readCss('src/styles/06-components/_unified-modals.css');

    expect(css).toMatch(/\[data-theme=["']dark["']\]\s*\.mg-modal-overlay/);
    expect(css).toMatch(/\[data-theme=["']dark["']\]\s*\.mg-modal\b/);
    expect(css).toMatch(/\[data-theme=["']dark["']\]\s*\.mg-modal__body\s*\.mg-v2-form-input/);
  });

  test('P0 컴포넌트 CSS [data-theme="dark"] 블록에 hex 하드코딩 0건', () => {
    C3_COMPONENT_FILES.forEach((file) => {
      const css = readCss(file);
      const darkCss = extractDarkBlocks(css);
      if (!darkCss.trim()) {
        return;
      }
      expect(darkCss).not.toMatch(HEX_IN_DECLARATION);
    });
  });

  test('SavedViewChip 클래스가 dark 토큰(var)을 사용', () => {
    const css = readCss(
      'src/components/admin/ClientComprehensiveManagement/atoms/SavedViewChip.css'
    );

    expect(css).toContain('.mg-v2-saved-view-chip');
    expect(css).toContain('var(--mg-dark-chip-bg');
    expect(css).toContain('var(--mg-dark-chip-active-bg');
  });

  test('SCREEN_SPEC P0 6라우트가 로드맵과 일치', () => {
    const spec = fs.readFileSync(
      path.join(
        REPO_ROOT,
        'docs/design-system/SCREEN_SPEC_ADMIN_DARK_MODE_C3_GLOBAL.md'
      ),
      'utf8'
    );

    [
      '/admin/dashboard',
      '/admin/user-management',
      '/admin/mapping-management',
      '/admin/integrated-schedule',
      '/admin/consultation-logs',
      '/erp/financial'
    ].forEach((route) => {
      expect(spec).toContain(route);
    });
  });
});
