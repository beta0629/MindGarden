/**
 * Client / Consultant soft-refresh sweep — source wiring guards
 * (mutation / focus / visibility / retry → softRefresh, no hard reload)
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.join(__dirname, '..', '..', '..');

function readSrc(...parts) {
  return fs.readFileSync(path.join(FRONTEND_SRC, ...parts), 'utf8');
}

describe('client/consultant soft-refresh sweep wiring', () => {
  const cases = [
    {
      name: 'useClientDashboardData',
      source: () => readSrc('components', 'client', 'clientDashboard', 'useClientDashboardData.js'),
      loadFn: 'loadClientData'
    },
    {
      name: 'ClientHomeRenewal',
      source: () => readSrc('components', 'client', 'ClientHomeRenewal.js'),
      loadFn: 'loadHomeData'
    },
    {
      name: 'ConsultantDashboardV2',
      source: () => readSrc('components', 'dashboard-v2', 'consultant', 'ConsultantDashboardV2.js'),
      loadFn: 'fetchDashboardData'
    },
    {
      name: 'ConsultantDashboardRenewal',
      source: () => readSrc('components', 'consultant', 'ConsultantDashboardRenewal.js'),
      loadFn: 'fetchDashboardData'
    }
  ];

  test.each(cases)('$name imports softRefresh and uses softRefresh($loadFn)', ({ source, loadFn }) => {
    const src = source();
    expect(src).toMatch(/from ['"][^'"]*utils\/softRefresh['"]/);
    expect(src).toMatch(/runResourceLoad/);
    expect(src).toMatch(new RegExp(`softRefresh\\(${loadFn}\\)`));
    expect(src).not.toMatch(/location\.reload\s*\(/);
    expect(src).not.toMatch(/window\.location\.reload\s*\(/);
  });

  test('useClientDashboardData listens visibility/focus and payment soft-refresh event', () => {
    const src = readSrc('components', 'client', 'clientDashboard', 'useClientDashboardData.js');
    expect(src).toContain('CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT');
    expect(src).toContain('visibilitychange');
    expect(src).toContain("addEventListener('focus'");
  });

  test('ConsultantDashboardV2 wires visibilitychange softRefresh', () => {
    const src = readSrc('components', 'dashboard-v2', 'consultant', 'ConsultantDashboardV2.js');
    expect(src).toContain('visibilitychange');
    expect(src).toMatch(/softRefresh\(fetchDashboardData\)/);
  });
});

describe('post-auth SPA navigate (no dashboard hard reload)', () => {
  test('session.redirectToDashboardWithFallback does not schedule window.location after navigate', () => {
    const src = readSrc('utils', 'session.js');
    const fnStart = src.indexOf('export const redirectToDashboardWithFallback');
    expect(fnStart).toBeGreaterThanOrEqual(0);
    const fnBody = src.slice(fnStart, fnStart + 1200);
    expect(fnBody).toMatch(/navigate\(dashboardPath,\s*\{\s*replace:\s*true\s*\}\)/);
    expect(fnBody).not.toMatch(/setTimeout\s*\(\s*\(\)\s*=>\s*\{[\s\S]*window\.location\.href/);
    expect(fnBody).not.toMatch(/window\.location\.replace\(dashboardPath\)/);
  });

  test('DuplicateLoginModal uses redirectToDynamicDashboard + navigate', () => {
    const src = readSrc('components', 'common', 'DuplicateLoginModal.js');
    expect(src).toContain('useNavigate');
    expect(src).toContain('redirectToDynamicDashboard');
    expect(src).not.toMatch(/window\.location\.href\s*=/);
  });

  test('TenantSelection fallback uses navigate not window.location.href', () => {
    const src = readSrc('components', 'auth', 'TenantSelection.js');
    expect(src).toMatch(/navigate\(['"]\/client\/dashboard['"]/);
    expect(src).not.toMatch(/window\.location\.href\s*=\s*['"]\/client\/dashboard['"]/);
  });

  test('OAuth2Callback has single markJustLoggedIn import (no duplicate declaration)', () => {
    const src = readSrc('components', 'auth', 'OAuth2Callback.js');
    const imports = src.match(/import\s*\{\s*markJustLoggedIn\s*\}\s*from/g) || [];
    expect(imports).toHaveLength(1);
    expect(src).not.toMatch(/location\.reload\s*\(/);
  });
});
