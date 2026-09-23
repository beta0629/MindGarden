/**
 * SessionContext — background periodic revalidation must stay silent
 * (never flip global isLoading / session-loading-overlay).
 */
import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'SessionContext.js'),
  'utf8'
);

describe('SessionContext silent periodic session check wiring', () => {
  test('periodic setInterval invokes checkSession with silent:true', () => {
    expect(SOURCE).toMatch(
      /setInterval\(\(\) => \{[\s\S]*?checkSession\(false,\s*\{\s*silent:\s*true\s*\}\)/
    );
  });

  test('periodic path documents silent background revalidation', () => {
    expect(SOURCE).toMatch(/백그라운드 주기 재검증은 silent/);
  });

  test('activity ping already uses silent checkSession (regression guard)', () => {
    expect(SOURCE).toMatch(
      /checkSession\(true,\s*\{\s*silent:\s*true\s*\}\)/
    );
  });

  test('non-silent checkSession still gates SET_LOADING via silent flag', () => {
    expect(SOURCE).toMatch(/const silent = options\.silent === true/);
    expect(SOURCE).toMatch(
      /if \(!silent\) \{\s*dispatch\(\{\s*type:\s*SessionActionTypes\.SET_LOADING,\s*payload:\s*true/
    );
  });
});
