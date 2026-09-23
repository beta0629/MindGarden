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

  test('first paint uses adminMappingsListGet; full GetAll is background only', () => {
    expect(scheduleJs).toMatch(/adminMappingsListGet\s*\(\s*\)/);
    expect(scheduleJs).toMatch(/adminMappingsListGetAll\s*\(\s*\)/);
    // Promise.all 임계 경로에 GetAll 이 직접 들어가지 않음 (1페이지 Get 후 백그라운드)
    const promiseAllBlock = scheduleJs.match(
      /await Promise\.all\(\[[\s\S]*?\]\)/
    );
    expect(promiseAllBlock).not.toBeNull();
    expect(promiseAllBlock[0]).toMatch(/adminMappingsListGet\s*\(/);
    expect(promiseAllBlock[0]).not.toMatch(/adminMappingsListGetAll\s*\(/);
    expect(promiseAllBlock[0]).toMatch(
      /adminSchedulesListGetAll\(\s*\{\s*startDate\s*,\s*endDate\s*\}\s*\)/
    );
    // chrome KPI: STATS 는 first-paint Promise.all 에 포함 (best-effort)
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

  test('background mappings GetAll is idle-deferred (requestIdleCallback)', () => {
    expect(scheduleJs).toMatch(/CLIENT_FILTER_IDLE_FALLBACK_MS/);
    expect(scheduleJs).toMatch(/runBackgroundMappingsGetAll/);
    expect(scheduleJs).toMatch(/adminMappingsListGetAll\s*\(\s*\)/);
    // GetAll 은 idle defer 후 실행 (client filter 와 동일 requestIdleCallback 패턴)
    expect(scheduleJs).toMatch(
      /requestIdleCallback\(\(\)\s*=>\s*\{\s*void runBackgroundMappingsGetAll\(\);/
    );
    expect(scheduleJs).toMatch(
      /runBackgroundMappingsGetAll[\s\S]*?adminMappingsListGetAll\s*\(\s*\)/
    );
  });

  test('clients/with-mapping-info is idle-deferred (not mount-blocking)', () => {
    expect(scheduleJs).toMatch(/requestIdleCallback/);
    expect(scheduleJs).toMatch(/CLIENT_FILTER_IDLE_FALLBACK_MS/);
    expect(scheduleJs).toMatch(/adminClientsWithMappingGet\s*\(/);
  });

  test('unpaid soft merge wiring remains after early-paint split', () => {
    expect(scheduleJs).toMatch(/mergeUnpaidSoftMappings/);
    expect(scheduleJs).toMatch(/applyUnpaidSoftStatusFromSchedules/);
    expect(scheduleJs).toMatch(/mergeUnpaidSoftWithScheduleMappingIds/);
  });
});
