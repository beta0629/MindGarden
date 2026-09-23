/**
 * AppContent — session-loading-overlay is bootstrap-only
 * (isLoading && !hasCheckedSession), never bare isLoading.
 */
import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'App.js'),
  'utf8'
);

describe('App session-loading-overlay bootstrap gate wiring', () => {
  test('AppContent destructures hasCheckedSession from useSession', () => {
    expect(SOURCE).toMatch(
      /function AppContent\(\)[\s\S]*?const \{[^}]*hasCheckedSession[^}]*\} = useSession\(\)/
    );
  });

  test('session-loading-overlay gates on isLoading && !hasCheckedSession', () => {
    expect(SOURCE).toMatch(
      /\{isLoading && !hasCheckedSession && \(\s*<div\s+className="session-loading-overlay"/
    );
  });

  test('overlay is not gated on bare isLoading alone', () => {
    expect(SOURCE).not.toMatch(
      /\{isLoading && \(\s*<div\s+className="session-loading-overlay"/
    );
  });
});
