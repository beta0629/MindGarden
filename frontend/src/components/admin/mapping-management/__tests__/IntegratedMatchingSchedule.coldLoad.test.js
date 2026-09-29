/**
 * IntegratedMatchingSchedule — cold-load month-scoped schedules + early mappings paint SSOT
 *
 * RCA: #1235 이후 softRefresh 는 가벼워졌으나 cold load 가 schedules·mappings 를
 * 무제한 drain 하고 clients/with-mapping 이 마운트에서 대역폭을 점유함.
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('IntegratedMatchingSchedule cold-load month scope SSOT', () => {
  const scheduleJs = read('src/components/admin/mapping-management/IntegratedMatchingSchedule.js');
  const dateUtilsJs = read('src/utils/dateUtils.js');

  test('buildMonthDateRangeYmd helper exists and is imported by IMS', () => {
    expect(dateUtilsJs).toMatch(/export const buildMonthDateRangeYmd/);
    expect(scheduleJs).toMatch(/buildMonthDateRangeYmd/);
    expect(scheduleJs).toMatch(/from ['"][^'"]*utils\/dateUtils['"]/);
  });

  test('cold load schedules GetAll always passes startDate+endDate (no bare GetAll)', () => {
    expect(scheduleJs).toMatch(
      /adminSchedulesListGetAll\(\s*\{\s*startDate\s*,\s*endDate\s*\}\s*\)/
    );
    // unbounded schedules dump 금지
    expect(scheduleJs).not.toMatch(/adminSchedulesListGetAll\(\s*\)/);
    expect(scheduleJs).not.toMatch(/adminSchedulesListGetAll\(\s*\{\s*\}\s*\)/);
    // bare StandardizedApi.get('/admin/schedules') 재도입 금지
    expect(scheduleJs).not.toMatch(
      /StandardizedApi\.get\(\s*['"`][^'"`]*\/admin\/schedules/
    );
    expect(scheduleJs).not.toMatch(/adminSchedulesListGet\s*\(/);
  });

  test('month range comes from currentYear/currentMonth via buildMonthDateRangeYmd', () => {
    expect(scheduleJs).toMatch(
      /buildMonthDateRangeYmd\(\s*currentYear\s*,\s*currentMonth\s*\)/
    );
    expect(scheduleJs).toMatch(
      /\}, \[\s*currentYear\s*,\s*currentMonth\s*\]\)/
    );
  });

  test('assignment lists use mappings GetAll and do not stop at page size 20', () => {
    expect(scheduleJs).toMatch(/adminMappingsListGetAll\s*\(\s*\)/);
    expect(scheduleJs).not.toMatch(/adminMappingsListGet\s*\(/);
    expect(scheduleJs).not.toMatch(/runBackgroundMappingsGetAll/);
    const promiseAllBlock = scheduleJs.match(
      /await Promise\.all\(\[[\s\S]*?\]\)/
    );
    expect(promiseAllBlock).not.toBeNull();
    expect(promiseAllBlock[0]).toMatch(/adminMappingsListGetAll\s*\(\s*\)/);
    expect(promiseAllBlock[0]).not.toMatch(/adminMappingsListGet\s*\(/);
    expect(promiseAllBlock[0]).toMatch(
      /adminSchedulesListGetAll\(\s*\{\s*startDate\s*,\s*endDate\s*\}\s*\)/
    );
    expect(promiseAllBlock[0]).toMatch(/ADMIN\.MAPPINGS\.STATS/);
  });

  test('pending chrome KPIs use unpaidSoftForCard (not full mappings list)', () => {
    expect(scheduleJs).toMatch(
      /countPendingPaymentMappings\(\s*unpaidSoftForCard\s*\)/
    );
    expect(scheduleJs).toMatch(
      /sumPendingPaymentAmount\(\s*unpaidSoftForCard\s*\)/
    );
    expect(scheduleJs).toMatch(
      /MAPPING_STATUS_PENDING_PAYMENT\)\s*\{\s*return countPendingPaymentMappings\(unpaidSoftForCard\)/
    );
  });

  test('badge hooks declare before first-paint Promise.all; GetAll call is later', () => {
    expect(scheduleJs).toMatch(
      /useMonthlyConsultantCounts\(\s*currentYear\s*,\s*currentMonth\s*\)/
    );
    expect(scheduleJs).toMatch(
      /useMissingConsultationLogs\(\s*currentYear\s*,\s*currentMonth\s*\)/
    );

    const consultantIdx = scheduleJs.indexOf(
      'useMonthlyConsultantCounts(currentYear, currentMonth)'
    );
    const missingIdx = scheduleJs.indexOf(
      'useMissingConsultationLogs(currentYear, currentMonth)'
    );
    const promiseAllIdx = scheduleJs.indexOf('await Promise.all([');
    const getAllCallIdx = scheduleJs.indexOf('adminMappingsListGetAll()');

    expect(consultantIdx).toBeGreaterThan(-1);
    expect(missingIdx).toBeGreaterThan(-1);
    expect(promiseAllIdx).toBeGreaterThan(-1);
    expect(getAllCallIdx).toBeGreaterThan(-1);

    // badge hooks → 목록 Promise.all. 배정 목록 GetAll 은 그 안에서 전체를 받는다.
    expect(Math.max(consultantIdx, missingIdx)).toBeLessThan(promiseAllIdx);
    expect(promiseAllIdx).toBeLessThan(getAllCallIdx);

    // pending chrome still unpaidSoftForCard SSOT (not mappings GetAll)
    expect(scheduleJs).toMatch(
      /countPendingPaymentMappings\(\s*unpaidSoftForCard\s*\)/
    );
  });

  test('mappings GetAll is the list fetch, not an idle follow-up after page size 20', () => {
    expect(scheduleJs).toMatch(/adminMappingsListGetAll\s*\(\s*\)\.catch/);
    expect(scheduleJs).not.toMatch(/runBackgroundMappingsGetAll/);
    expect(scheduleJs).not.toMatch(/adminMappingsListGet\s*\(/);
  });

  test('clients/with-mapping-info is idle-deferred (not mount-blocking)', () => {
    expect(scheduleJs).toMatch(/requestIdleCallback/);
    expect(scheduleJs).toMatch(/CLIENT_FILTER_IDLE_FALLBACK_MS/);
    expect(scheduleJs).toMatch(/adminClientsWithMappingGetAll\s*\(/);
  });

  test('unpaid soft merge wiring remains after early-paint split', () => {
    expect(scheduleJs).toMatch(/mergeUnpaidSoftMappings/);
    expect(scheduleJs).toMatch(/applyUnpaidSoftStatusFromSchedules/);
    expect(scheduleJs).toMatch(/mergeUnpaidSoftWithScheduleMappingIds/);
  });
});
