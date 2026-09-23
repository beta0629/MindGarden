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
  });

  test('PENDING_PAYMENT statusFilter uses full mappings via selectPendingPaymentMappings', () => {
    expect(scheduleJs).toMatch(/statusFilter === MAPPING_STATUS_PENDING_PAYMENT/);
    expect(scheduleJs).toMatch(/selectPendingPaymentMappings\(mappings\)/);
    expect(scheduleJs).toMatch(
      /MAPPING_STATUS_PENDING_PAYMENT\)\s*\{\s*return countPendingPaymentMappings\(mappings\)/
    );
  });

  test('summary strip pending cell wires onPendingPaymentClick → ALL + PENDING_PAYMENT', () => {
    expect(summaryJs).toMatch(/onPendingPaymentClick/);
    expect(summaryJs).toMatch(/integrated-schedule-summary__cell--action/);
    expect(scheduleJs).toMatch(/onPendingPaymentClick=\{handlePendingPaymentSummaryClick\}/);
    expect(scheduleJs).toMatch(/setStatusFilter\(MAPPING_STATUS_PENDING_PAYMENT\)/);
    expect(scheduleJs).toMatch(/setViewFilter\(VIEW_FILTER_ALL\)/);
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
