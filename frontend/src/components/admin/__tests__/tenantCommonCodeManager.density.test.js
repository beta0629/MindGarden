/**
 * G5-02 — TenantCommonCodeManager density & API SSOT guard
 */
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const MANAGER_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/admin/TenantCommonCodeManager.js'
);
const API_PATH = path.join(REPO_ROOT, 'frontend/src/utils/tenantCommonCodeApi.js');
const TABLE_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/admin/tenant-common-codes/organisms/TenantCommonCodeTable.js'
);
const TABLE_CSS_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/admin/tenant-common-codes/organisms/TenantCommonCodeTable.css'
);

describe('TenantCommonCodeManager G5-02 guard', () => {
  it('Manager가 ListTableView·SidePeekShell·EntityRowActions 패턴을 사용한다', () => {
    const source = fs.readFileSync(MANAGER_PATH, 'utf8');
    expect(source).toContain('TenantCommonCodeTable');
    expect(source).toContain('SidePeekShell');
    expect(source).toContain('AdminCommonLayout');
    expect(source).not.toContain('TenantCommonCodeManagerUI');
  });

  it('tenantCommonCodeApi가 axios 없이 StandardizedApi를 사용한다', () => {
    const source = fs.readFileSync(API_PATH, 'utf8');
    expect(source).toContain("import StandardizedApi from './standardizedApi'");
    expect(source).not.toMatch(/from ['"]axios['"]/);
    expect(source).toContain('normalizeTenantCommonCodeRow');
  });

  it('TenantCommonCodeTable이 EntityRowActions primary·overflow를 사용한다', () => {
    const source = fs.readFileSync(TABLE_PATH, 'utf8');
    expect(source).toContain('EntityRowActions');
    expect(source).toContain('ListTableView');
    expect(source).toContain('buildTenantCommonCodeRowActions');
    expect(source).toContain('primaryAction');
  });

  it('테이블 CSS가 Comfortable 밀도·B0KlA 토큰을 사용한다', () => {
    const css = fs.readFileSync(TABLE_CSS_PATH, 'utf8');
    expect(css).toContain('mg-v2-ad-b0kla__data-table--comfortable');
    expect(css).toContain('var(--mg-color-border-main)');
    expect(css).toContain('var(--mg-color-text-secondary)');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
