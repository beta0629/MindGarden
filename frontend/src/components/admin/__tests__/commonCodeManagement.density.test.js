/**
 * G5-01 Phase 1-B — CommonCodeManagement density & API SSOT guard
 */
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const COMPONENT_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/admin/CommonCodeManagement.js'
);
const CSS_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/admin/CommonCodeManagementB0KlA.css'
);
const API_PATH = path.join(REPO_ROOT, 'frontend/src/utils/commonCodeApi.js');

describe('CommonCodeManagement G5-01 density guard', () => {
  it('컴포넌트가 ajax 직접 호출 없이 StandardizedApi 경유 commonCodeApi를 사용한다', () => {
    const source = fs.readFileSync(COMPONENT_PATH, 'utf8');

    expect(source).not.toMatch(/from ['"]\.\.\/\.\.\/utils\/ajax['"]/);
    expect(source).toContain("from '../../utils/commonCodeApi'");
    expect(source).toContain('getLegacyCodeGroupsList');
    expect(source).toContain("import './AdminDashboard/AdminDashboardB0KlA.css'");
  });

  it('commonCodeApi가 StandardizedApi를 사용한다', () => {
    const source = fs.readFileSync(API_PATH, 'utf8');

    expect(source).toContain("import StandardizedApi from './standardizedApi'");
    expect(source).not.toMatch(/from ['"]\.\/ajax['"]/);
    expect(source).toContain('getLegacyCodeGroupsList');
  });

  it('page-specific compact CSS(4px 테이블 액션)가 제거되고 Comfortable modifier가 있다', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8');

    expect(css).toContain('mg-v2-ad-b0kla__data-table--comfortable');
    expect(css).toContain('flex-wrap: wrap');
    expect(css).not.toMatch(/\.mg-v2-ad-b0kla__code-actions[^{]*\{[^}]*padding:\s*4px/);
    expect(css).not.toMatch(/\.mg-v2-ad-b0kla__data-table\s*\{/);
  });

  it('폼 라벨·입력이 B0KlA 토큰을 사용한다', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8');

    expect(css).toContain('var(--mg-v2-color-text-secondary)');
    expect(css).toContain('var(--input-height-default)');
    expect(css).toContain('var(--mg-radius-md)');
  });
});
