/**
 * ClientSessionManagement — soft-refresh + retry wiring
 * (no location.reload / 401 null retry loop · 로그인 판단은 ClientRouteGuard 한 곳)
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(
  path.join(__dirname, '..', 'ClientSessionManagement.js'),
  'utf8'
);

describe('ClientSessionManagement soft-refresh + auth retry wiring', () => {
  test('imports useSoftResourceLoad and loads only after shared session ready', () => {
    expect(SRC).toMatch(/from ['"][^'"]*hooks\/useSoftResourceLoad['"]/);
    expect(SRC).toMatch(/useSoftResourceLoad/);
    expect(SRC).toMatch(/useClientSessionReady\(\)/);
    expect(SRC).toMatch(/enabled:\s*ready/);
  });

  test('retry reloads data without per-screen login redirect or current-user re-check', () => {
    expect(SRC).toMatch(/handleRetry/);
    expect(SRC).toMatch(/onClick=\{handleRetry\}/);
    expect(SRC).not.toMatch(/navigate\(['"]\/login/);
    expect(SRC).not.toMatch(/AUTH_API\.GET_CURRENT_USER/);
  });

  test('does not hard-reload on retry or session miss', () => {
    expect(SRC).not.toMatch(/location\.reload\s*\(/);
    expect(SRC).not.toMatch(/window\.location\.reload\s*\(/);
    expect(SRC).not.toMatch(/window\.location\.href\s*=/);
    expect(SRC).not.toMatch(/window\.location\.assign\s*\(/);
    expect(SRC).not.toMatch(/redirectToLoginPageOnce/);
  });

  test('error CTA is not raw loadSessionData (avoids 401/null retry loop)', () => {
    expect(SRC).not.toMatch(/onClick=\{loadSessionData\}/);
  });
});
