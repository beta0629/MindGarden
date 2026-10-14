/**
 * selectActiveConsultants — 선택·KPI용 활성 필터 SSOT
 */

const { selectActiveConsultants } = require('../selectActiveConsultants');

describe('selectActiveConsultants', () => {
  test('비배열·null → 빈 배열', () => {
    expect(selectActiveConsultants(null)).toEqual([]);
    expect(selectActiveConsultants(undefined)).toEqual([]);
    expect(selectActiveConsultants({})).toEqual([]);
  });

  test('isActive !== false 만 유지 (undefined·true 포함, false 제외)', () => {
    const list = [
      { id: 1, name: 'A', isActive: true },
      { id: 2, name: 'B', isActive: false },
      { id: 3, name: 'C' },
      null,
      { id: 4, name: 'D', isActive: false }
    ];
    expect(selectActiveConsultants(list).map((c) => c.id)).toEqual([1, 3]);
  });

  test('선택 화면 소스가 공통 모듈을 사용한다', () => {
    const fs = require('fs');
    const path = require('path');
    const root = path.resolve(__dirname, '..', '..');
    const files = [
      'components/schedule/steps/ConsultantSelectionStep.js',
      'components/admin/mapping/ConsultantTransferModal.js',
      'components/schedule/ConsultantStatus.js',
      'components/admin/AdminDashboard.js',
      'components/dashboard-v2/AdminDashboardV2.js',
      'components/admin/MappingCreationModal.js',
      'components/admin/VacationManagementModal.js',
      'components/admin/ClientComprehensiveManagement.js'
    ];
    files.forEach((rel) => {
      const src = fs.readFileSync(path.join(root, rel), 'utf8');
      expect(src).toMatch(/selectActiveConsultants/);
    });
  });

  test('통합스케줄 색·필터 소스는 활성 필터를 쓰지 않는다', () => {
    const fs = require('fs');
    const path = require('path');
    const root = path.resolve(__dirname, '..', '..');
    const unified = fs.readFileSync(
      path.join(root, 'components/schedule/UnifiedScheduleComponent.js'),
      'utf8'
    );
    const filterSelect = fs.readFileSync(
      path.join(
        root,
        'components/admin/mapping-management/integrated-schedule/molecules/ConsultantFilterSelect.jsx'
      ),
      'utf8'
    );
    expect(unified).not.toMatch(/selectActiveConsultants/);
    expect(filterSelect).not.toMatch(/selectActiveConsultants/);
  });
});
