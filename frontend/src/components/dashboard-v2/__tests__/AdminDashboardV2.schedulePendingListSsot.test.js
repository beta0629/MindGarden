/**
 * AdminDashboardV2 / AdminDashboard 가예약 목록 — status·fetch SSOT 소스 락
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

const FORBIDDEN_STATUS_FILTERS = [
  /status:\s*['"]BOOKED['"]/,
  /status:\s*['"]PENDING['"]/,
  /status:\s*['"]TENTATIVE['"]/,
  /status:\s*STATUS\.BOOKED/,
  /status:\s*STATUS\.PENDING/
];

function assertGareyarkListLoad(source, label) {
  expect(source).toMatch(/loadSchedulePendingList/);
  expect(source).toMatch(/adminSchedulesListGet/);
  expect(source).toMatch(/ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY/);

  const loadFnMatch = source.match(
    /const loadSchedulePendingList = useCallback\(async\(\) => \{[\s\S]*?\}, \[\]\);/
  );
  expect(loadFnMatch).not.toBeNull();
  const loadFn = loadFnMatch[0];

  expect(loadFn).toMatch(/adminSchedulesListGet\s*\(\s*ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY\s*\)/);
  expect(loadFn).not.toMatch(/StandardizedApi\.get\s*\(\s*API_ADMIN_SCHEDULES/);
  expect(loadFn).not.toMatch(/\/schedules\/admin/);
  expect(loadFn).not.toMatch(/apiGet\s*\(/);

  FORBIDDEN_STATUS_FILTERS.forEach((re) => {
    expect(loadFn).not.toMatch(re);
  });

  // 캘린더 date-range 경로(/schedules/admin)는 필터 목록과 혼용 금지
  expect(source).not.toMatch(
    /adminSchedulesListGet[\s\S]{0,80}\/api\/v1\/schedules\/admin/
  );
  expect(label).toBeTruthy();
}

describe('Admin dashboard 가예약 list SSOT', () => {
  test('AdminDashboardV2 loadSchedulePendingList uses TENTATIVE_PENDING_PAYMENT via adminSchedulesListGet', () => {
    const dashboardJs = read('src/components/dashboard-v2/AdminDashboardV2.js');
    assertGareyarkListLoad(dashboardJs, 'AdminDashboardV2');
  });

  test('AdminDashboard loadSchedulePendingList uses TENTATIVE_PENDING_PAYMENT via adminSchedulesListGet', () => {
    const dashboardJs = read('src/components/admin/AdminDashboard.js');
    assertGareyarkListLoad(dashboardJs, 'AdminDashboard');
  });

  test('adminListFetch + widget constants export 가예약 query SSOT', () => {
    const fetchJs = read('src/api/adminListFetch.js');
    const constantsJs = read('src/constants/adminDashboardWidgetConstants.js');
    const scheduleJs = read('src/constants/schedule.js');

    expect(scheduleJs).toMatch(/TENTATIVE_PENDING_PAYMENT:\s*'TENTATIVE_PENDING_PAYMENT'/);
    expect(constantsJs).toMatch(/ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY/);
    expect(constantsJs).toMatch(/status:\s*STATUS\.TENTATIVE_PENDING_PAYMENT/);
    expect(constantsJs).toMatch(/API_ADMIN_SCHEDULES\s*=\s*'\/api\/v1\/admin\/schedules'/);
    expect(fetchJs).toMatch(/export function adminSchedulesListGet/);
    expect(fetchJs).toMatch(/API_ADMIN_SCHEDULES/);
    expect(fetchJs).toMatch(/ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY/);
  });
});
