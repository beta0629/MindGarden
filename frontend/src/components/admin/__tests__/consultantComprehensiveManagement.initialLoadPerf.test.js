/**
 * ConsultantComprehensiveManagement — 초기 로드에서 full mappings/schedules 제거 가드
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(
  __dirname,
  '..',
  'ConsultantComprehensiveManagement.js'
);

describe('ConsultantComprehensiveManagement initial load perf', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  test('loadAllData가 mappings/schedules full list를 호출하지 않는다', () => {
    expect(source).not.toMatch(/loadMappings\s*\(/);
    expect(source).not.toMatch(/loadSchedules\s*\(/);
    expect(source).not.toContain('/api/v1/admin/schedules');
    expect(source).toContain('USER_MANAGEMENT.KPI_COUNTS');
    expect(source).toContain('loadKpiCounts');
  });

  test('loadAllData Promise.allSettled에 KPI count와 consultants만 포함한다', () => {
    const loadAllDataMatch = source.match(
      /const loadAllData = useCallback\(async\(\) => \{[\s\S]*?\}, \[[^\]]+\]\);/
    );
    expect(loadAllDataMatch).toBeTruthy();
    const body = loadAllDataMatch[0];
    expect(body).toContain('loadConsultants()');
    expect(body).toContain('loadKpiCounts()');
    expect(body).not.toContain('loadMappings()');
    expect(body).not.toContain('loadSchedules()');
  });
});
