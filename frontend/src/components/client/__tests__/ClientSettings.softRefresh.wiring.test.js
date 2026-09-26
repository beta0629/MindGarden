/**
 * ClientSettings — soft-refresh wiring (no location.reload / assign loop)
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(
  path.join(__dirname, '..', 'ClientSettings.js'),
  'utf8'
);

describe('ClientSettings soft-refresh wiring (no hard reload loop)', () => {
  test('imports softRefresh SSOT via useSoftResourceLoad / softRefreshSettings', () => {
    expect(SRC).toMatch(/useSoftResourceLoad/);
    expect(SRC).toMatch(/softRefreshSettings\s*\(/);
    expect(SRC).toMatch(/load:\s*loadSettings|loadSettings/);
    expect(SRC).not.toMatch(/from ['"][^'"]*utils\/softRefresh['"]/);
  });

  test('initial load depends on userId + hasCheckedSession (no sessionLoading deadlock)', () => {
    expect(SRC).toMatch(/useStableUserId/);
    expect(SRC).toMatch(/useUserIdScopedLoad/);
    expect(SRC).toMatch(/hasCheckedSession/);
    expect(SRC).toMatch(/enabled:\s*Boolean\(hasCheckedSession\s*&&\s*isLoggedIn\)/);
    expect(SRC).not.toMatch(/enabled:\s*!sessionLoading/);
    expect(SRC).not.toMatch(/\}, \[user,\s*applyProfileFields\]\)/);
  });

  test('post-save checkSession is silent (no foreground 401 kick / overlay loop)', () => {
    expect(SRC).toMatch(/checkSession\(true,\s*\{\s*silent:\s*true\s*\}\)/);
    expect(SRC).not.toMatch(/await checkSession\(true\);/);
  });

  test('session failure soft-navigates to login with error retry UI', () => {
    expect(SRC).toMatch(/navigate\(['"]\/login['"],\s*\{\s*replace:\s*true\s*\}\)/);
    expect(SRC).toMatch(/handleRetry/);
    expect(SRC).toMatch(/SETTINGS_RETRY/);
    expect(SRC).toMatch(/isAuthFailure/);
    expect(SRC).toMatch(/setLoadError/);
    expect(SRC).toMatch(/hasCheckedSession/);
    expect(SRC).toMatch(/INTERNAL_SERVER_ERROR/);
    expect(SRC).not.toMatch(/location\.reload/);
  });

  test('does not hard-reload or assign dashboard/settings/login in-page loop', () => {
    expect(SRC).not.toMatch(/location\.reload\s*\(/);
    expect(SRC).not.toMatch(/window\.location\.reload\s*\(/);
    expect(SRC).not.toMatch(/window\.location\.assign\s*\(/);
    expect(SRC).not.toMatch(/window\.location\.href\s*=/);
    expect(SRC).not.toMatch(/location\.assign\(['"]\/client\/settings/);
    expect(SRC).not.toMatch(/location\.assign\(['"]\/client\/dashboard/);
  });

  test('email-change login kick uses logout SSOT or sessionRedirect once (no assign)', () => {
    expect(SRC).toMatch(/from ['"][^'"]*utils\/sessionRedirect['"]/);
    expect(SRC).toContain('redirectToLoginPageOnce');
    expect(SRC).toContain('sessionManager.logout');
    expect(SRC).not.toMatch(/window\.location\.assign\(['"]\/login['"]\)/);
  });
});
