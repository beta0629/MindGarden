/**
 * ClientComprehensiveManagement — overview 초기 로드에서 full mappings lazy 가드
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(
  __dirname,
  '..',
  'ClientComprehensiveManagement.js'
);

describe('ClientComprehensiveManagement initial load perf', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  test('mount effect가 full mappings/consultations를 즉시 호출하지 않는다', () => {
    expect(source).toContain('loadMappingKpiCount');
    expect(source).toContain('loadSecondaryTabData');
    expect(source).toContain('USER_MANAGEMENT.KPI_COUNTS');

    const mountEffectMatch = source.match(
      /useEffect\(\(\) => \{\s*loadCommonCodes\(\);\s*loadClients\(\);\s*loadMappingKpiCount\(\);\s*\}, \[\]\);/
    );
    expect(mountEffectMatch).toBeTruthy();
  });

  test('secondary tab 진입 시에만 mappings/consultations를 로드한다', () => {
    expect(source).toMatch(
      /mainTab === 'consultation' \|\| mainTab === 'mapping' \|\| mainTab === 'statistics'/
    );
    expect(source).toContain('loadSecondaryTabData');
  });
});
