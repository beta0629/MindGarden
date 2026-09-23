/**
 * IntegratedMatchingSchedule — unpaid soft (PENDING_PAYMENT) merge·filter SSOT 소스 락
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('IntegratedMatchingSchedule unpaid soft merge/filter SSOT', () => {
  const scheduleJs = read('src/components/admin/mapping-management/IntegratedMatchingSchedule.js');
  const summaryJs = read(
    'src/components/admin/mapping-management/integrated-schedule/molecules/IntegratedScheduleSummaryStrip.js'
  );
  const sidebarJs = read(
    'src/components/admin/mapping-management/integrated-schedule/organisms/MatchingScheduleSidebar.js'
  );
  const scheduleConstants = read('src/constants/schedule.js');
  const mappingPageJs = read(
    'src/components/admin/mapping-management/pages/MappingManagementPage.js'
  );

  test('loadMappings fetches PENDING_PAYMENT (+ dirty best-effort) and mergeUnpaidSoftMappings', () => {
    expect(scheduleJs).toMatch(/mergeUnpaidSoftMappings/);
    expect(scheduleJs).toMatch(/ADMIN\.MAPPINGS\.PENDING_PAYMENT/);
    expect(scheduleJs).toMatch(/ADMIN\.MAPPINGS\.PENDING_PAYMENT_DIRTY/);
    expect(scheduleJs).toMatch(/PENDING_PAYMENT_DIRTY_DEFAULT_AGE_HOURS/);
    expect(scheduleJs).toMatch(
      /mergeUnpaidSoftMappings\(\s*list\s*,\s*pendingRaw\s*,\s*dirtyRaw\s*\)/
    );
    expect(scheduleJs).toMatch(/adminSchedulesListGetAll/);
    expect(scheduleJs).not.toMatch(/adminSchedulesListGet\s*\(/);
    // unpaid soft schedules drain 은 월 스코프 GetAll (bare Get 금지)
    expect(scheduleJs).toMatch(
      /adminSchedulesListGetAll\(\s*\{\s*startDate\s*,\s*endDate\s*\}\s*\)/
    );
    expect(scheduleJs).toMatch(/adminClientsWithMappingGet\s*\(/);
    expect(scheduleJs).toMatch(/mergeUnpaidSoftWithScheduleMappingIds/);
    expect(scheduleJs).toMatch(/applyUnpaidSoftStatusFromSchedules/);
    expect(scheduleJs).toMatch(/baseMerged/);
    expect(scheduleJs).toMatch(
      /mergeUnpaidSoftWithScheduleMappingIds\(\s*baseMerged\s*,\s*schedulesRaw\s*,\s*\{[\s\S]*pendingRaw[\s\S]*dirtyRaw[\s\S]*\}\s*\)/
    );
    expect(scheduleJs).toMatch(/\.catch\(\(\)\s*=>\s*null\)/);
  });

  test('PENDING_PAYMENT statusFilter uses full mappings via selectPendingPaymentMappings', () => {
    expect(scheduleJs).toMatch(/statusFilter === MAPPING_STATUS_PENDING_PAYMENT/);
    expect(scheduleJs).toMatch(/selectPendingPaymentMappings\(mappings\)/);
    // chrome badge count 는 unpaidSoftForCard SSOT (first-paint); list filter 는 mappings
    expect(scheduleJs).toMatch(
      /MAPPING_STATUS_PENDING_PAYMENT\)\s*\{\s*return countPendingPaymentMappings\(unpaidSoftForCard\)/
    );
  });

  test('summary strip pending cell wires onPendingPaymentClick → ALL + PENDING_PAYMENT', () => {
    expect(summaryJs).toMatch(/onPendingPaymentClick/);
    expect(summaryJs).toMatch(/integrated-schedule-summary__cell--action/);
    expect(scheduleJs).toMatch(/onPendingPaymentClick=\{handlePendingPaymentSummaryClick\}/);
    expect(scheduleJs).toMatch(/setStatusFilter\(MAPPING_STATUS_PENDING_PAYMENT\)/);
    expect(scheduleJs).toMatch(/setViewFilter\(VIEW_FILTER_ALL\)/);
  });

  test('가예약 card lives in MatchingScheduleSidebar via unpaidSoftForCard + gareyarkCard', () => {
    expect(scheduleJs).toMatch(/unpaidSoftForCard/);
    expect(scheduleJs).toMatch(/setUnpaidSoftForCard/);
    expect(scheduleJs).toMatch(/mergeUnpaidSoftWithScheduleMappingIds/);
    expect(scheduleJs).toMatch(/gareyarkCard=\{\{/);
    expect(scheduleJs).not.toMatch(/pendingPaymentAlert\.visible/);
    expect(scheduleJs).not.toMatch(/computePendingPaymentAlert\(/);
    expect(sidebarJs).toMatch(
      /data-testid=["']integrated-schedule-pending-payment-alert["']/
    );
    expect(sidebarJs).toMatch(/gareyarkCard/);
    expect(sidebarJs).toMatch(/integrated-schedule__pending-payment-alert--sidebar/);
    // prop 있으면 count 게이트 없이 chrome 렌더 (visible ? … : null 금지)
    expect(sidebarJs).toMatch(/gareyarkCard \? renderGareyarkCard/);
    expect(sidebarJs).not.toMatch(/pendingPaymentAlert\.visible/);
  });

  test('schedule soft unpaid SSOT exports TENTATIVE_PENDING_PAYMENT set', () => {
    expect(scheduleConstants).toMatch(/TENTATIVE_PENDING_PAYMENT:\s*'TENTATIVE_PENDING_PAYMENT'/);
    expect(scheduleConstants).toMatch(/SCHEDULE_SOFT_UNPAID_STATUSES/);
    expect(scheduleConstants).toMatch(/isScheduleSoftUnpaidStatus/);
    expect(scheduleConstants).toMatch(/isScheduleBookedOrSoftUnpaidStatus/);
  });

  test('MappingManagementPage loadMappings also merges pending-payment ∪ dirty', () => {
    expect(mappingPageJs).toMatch(/mergeUnpaidSoftMappings/);
    expect(mappingPageJs).toMatch(/ADMIN\.MAPPINGS\.PENDING_PAYMENT/);
    expect(mappingPageJs).toMatch(/ADMIN\.MAPPINGS\.PENDING_PAYMENT_DIRTY/);
  });
});
