/**
 * ClientSessionManagement — soft-refresh + auth retry wiring
 * (no location.reload / 401 null retry loop)
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
  test('imports useSoftResourceLoad and uses softRefresh on retry path', () => {
    expect(SRC).toMatch(/from ['"][^'"]*hooks\/useSoftResourceLoad['"]/);
    expect(SRC).toMatch(/useSoftResourceLoad/);
    expect(SRC).toMatch(/softRefreshSessions/);
    expect(SRC).toMatch(/softRefreshSessions\(\)/);
  });

  test('retry re-verifies current-user then soft navigates or softRefresh', () => {
    expect(SRC).toMatch(/AUTH_API\.GET_CURRENT_USER/);
    expect(SRC).toMatch(/handleRetry/);
    expect(SRC).toMatch(/navigate\(['"]\/login['"]\s*,\s*\{\s*replace:\s*true\s*\}\)/);
    expect(SRC).toMatch(/onClick=\{handleRetry\}/);
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
