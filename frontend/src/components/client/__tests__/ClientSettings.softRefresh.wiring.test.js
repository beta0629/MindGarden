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
  test('imports softRefresh SSOT and uses runResourceLoad / softRefresh(loadSettings)', () => {
    expect(SRC).toMatch(/from ['"][^'"]*utils\/softRefresh['"]/);
    expect(SRC).toMatch(/runResourceLoad/);
    expect(SRC).toMatch(/softRefresh\(loadSettings\)/);
    expect(SRC).toContain('loadSettings');
  });

  test('initial load depends on userId, not full user object (silent checkSession remount guard)', () => {
    expect(SRC).toMatch(/useStableUserId|const userId = user\?\.id/);
    expect(SRC).toMatch(/useUserIdScopedLoad|\[userId,\s*loadSettings\]/);
    expect(SRC).not.toMatch(/\}, \[user,\s*applyProfileFields\]\)/);
  });

  test('post-save checkSession is silent (no foreground 401 kick / overlay loop)', () => {
    expect(SRC).toMatch(/checkSession\(true,\s*\{\s*silent:\s*true\s*\}\)/);
    expect(SRC).not.toMatch(/await checkSession\(true\);/);
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
