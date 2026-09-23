/**
 * UnifiedScheduleComponent forceRefresh — soft path when silentScheduleRefetch
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'UnifiedScheduleComponent.js'),
  'utf8'
);

describe('UnifiedScheduleComponent forceRefresh soft path', () => {
  test('when silentScheduleRefetch, forceRefresh uses silent loadSchedules without clearing events first', () => {
    expect(SOURCE).toMatch(/const forceRefresh = useCallback\(async\(\) => \{[\s\S]*?silentScheduleRefetch[\s\S]*?loadSchedules\(\{\s*silent:\s*true\s*\}\)/);
    const forceRefreshBlock = SOURCE.match(
      /const forceRefresh = useCallback\(async\(\) => \{[\s\S]*?\}, \[loadSchedules, silentScheduleRefetch\]\);/
    );
    expect(forceRefreshBlock).not.toBeNull();
    const block = forceRefreshBlock[0];
    // Soft branch must not clear events before load
    expect(block).toMatch(/if \(silentScheduleRefetch\) \{[\s\S]*?await loadSchedules\(\{\s*silent:\s*true\s*\}\)/);
    const softBranch = block.match(/if \(silentScheduleRefetch\) \{([\s\S]*?)\} else \{/);
    expect(softBranch).not.toBeNull();
    expect(softBranch[1]).not.toMatch(/setEvents\(\[\]\)/);
    expect(softBranch[1]).toMatch(/loadSchedules\(\{\s*silent:\s*true\s*\}\)/);
  });

  test('when silentScheduleRefetch is false, hard path still clears events then non-silent load', () => {
    const forceRefreshBlock = SOURCE.match(
      /const forceRefresh = useCallback\(async\(\) => \{[\s\S]*?\}, \[loadSchedules, silentScheduleRefetch\]\);/
    );
    expect(forceRefreshBlock).not.toBeNull();
    const hardBranch = forceRefreshBlock[0].match(/\} else \{([\s\S]*?)\}[\s\S]*?console\.log\('✅/);
    expect(hardBranch).not.toBeNull();
    expect(hardBranch[1]).toMatch(/setEvents\(\[\]\)/);
    expect(hardBranch[1]).toMatch(/await loadSchedules\(\)/);
  });
});
