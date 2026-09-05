/**
 * 통합 사용자 관리 Clinic-OS KPI strip chrome lock
 * Client / Consultant / Staff overview KPIs must use MappingKpiSection strip classes.
 *
 * @author CoreSolution
 * @since 2026-09-05
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('UserManagement Clinic-OS KPI chrome', () => {
  const clientJs = read('src/components/admin/ClientComprehensiveManagement.js');
  const consultantJs = read('src/components/admin/ConsultantComprehensiveManagement.js');
  const staffJs = read('src/components/admin/StaffManagement.js');
  const statsJs = read('src/components/admin/ClientComprehensiveManagement/ClientStatisticsTab.js');
  const kpiCss = read('src/components/admin/mapping-management/organisms/MappingKpiSection.css');

  const assertClinicOsStrip = (source, label) => {
    expect(source).toMatch(/mapping-management-summary/);
    expect(source).toMatch(/KpiNumeral/);
    expect(source).not.toMatch(/mg-v2-mapping-kpi-section__icon/);
    expect(source).not.toMatch(/mg-v2-mapping-kpi-section__grid/);
    expect(source).not.toMatch(/mg-v2-mapping-kpi-section__card/);
  };

  test('Client overview KPIs use Clinic-OS summary strip', () => {
    assertClinicOsStrip(clientJs, 'client');
    expect(clientJs).toMatch(/mapping-management-summary--cols-4/);
  });

  test('Consultant overview KPIs use Clinic-OS summary strip', () => {
    assertClinicOsStrip(consultantJs, 'consultant');
    expect(consultantJs).toMatch(/mapping-management-summary--cols-4/);
  });

  test('Staff overview KPI uses Clinic-OS summary strip', () => {
    assertClinicOsStrip(staffJs, 'staff');
  });

  test('ClientStatisticsTab KPIs use Clinic-OS summary strip', () => {
    assertClinicOsStrip(statsJs, 'client-statistics');
    expect(statsJs).toMatch(/mapping-management-summary--cols-4/);
  });

  test('MappingKpiSection CSS supports 4-column strip modifier', () => {
    expect(kpiCss).toMatch(
      /\.mapping-management-summary--cols-4\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/s
    );
    expect(kpiCss).toMatch(/\.mapping-management-summary\s*\{[^}]*grid-template-columns:\s*repeat\(3/s);
    expect(kpiCss).not.toMatch(/mg-v2-mapping-kpi-section__icon/);
    expect(kpiCss).not.toMatch(/--ad-b0kla/);
  });
});
