/**
 * IntegratedMatchingSchedule — idle/tab soft refresh wiring (SSOT softRefresh)
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'IntegratedMatchingSchedule.js'),
  'utf8'
);

describe('IntegratedMatchingSchedule soft refresh wiring', () => {
  test('imports softRefresh SSOT and uses softRefresh(loadMappings)', () => {
    expect(SOURCE).toMatch(/from ['"][^'"]*utils\/softRefresh['"]/);
    expect(SOURCE).toMatch(/runResourceLoad/);
    expect(SOURCE).toMatch(/softRefresh\(loadMappings\)/);
  });

  test('registers visibilitychange + window focus idle soft refetch', () => {
    expect(SOURCE).toMatch(/addEventListener\(['"]visibilitychange['"]/);
    expect(SOURCE).toMatch(/addEventListener\(['"]focus['"]/);
    expect(SOURCE).toMatch(/visibilityState\s*===\s*['"]visible['"]/);
    expect(SOURCE).toMatch(/softRefresh\(loadMappings\)/);
    expect(SOURCE).toMatch(/setRefetchTrigger\(\(t\)\s*=>\s*t\s*\+\s*1\)/);
  });

  test('idle soft path does not use location.reload or remount key hacks', () => {
    expect(SOURCE).not.toMatch(/location\.reload/);
    expect(SOURCE).not.toMatch(/window\.location\.reload/);
  });

  test('mutation/post-idle paths prefer softRefresh over raw silent loadMappings', () => {
    expect(SOURCE).not.toMatch(/loadMappings\(\{\s*silent:\s*true\s*\}\)/);
    expect(SOURCE).toMatch(/softRefresh\(loadMappings\)/);
  });

  test('loadMappings goes through runResourceLoad for silent loading gate', () => {
    expect(SOURCE).toMatch(/runResourceLoad\(options,\s*setLoading,/);
  });
});
