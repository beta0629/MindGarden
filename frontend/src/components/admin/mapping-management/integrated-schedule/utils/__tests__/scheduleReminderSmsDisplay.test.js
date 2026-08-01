/**
 * scheduleReminderSmsDisplay mapper 단위 테스트
 */

import {
  formatReminderSmsClock,
  resolveScheduleReminderSmsDisplay
} from '../scheduleReminderSmsDisplay';

describe('scheduleReminderSmsDisplay', () => {
  describe('formatReminderSmsClock', () => {
    it('parses ISO datetime', () => {
      expect(formatReminderSmsClock('2026-08-01T14:00:00')).toBe('14:00');
    });

    it('returns empty for null', () => {
      expect(formatReminderSmsClock(null)).toBe('');
    });
  });

  describe('resolveScheduleReminderSmsDisplay', () => {
    it('returns null for missing / N/A / SKIPPED', () => {
      expect(resolveScheduleReminderSmsDisplay(null)).toBeNull();
      expect(resolveScheduleReminderSmsDisplay({ status: 'N/A' })).toBeNull();
      expect(resolveScheduleReminderSmsDisplay({ status: 'SKIPPED' })).toBeNull();
      expect(resolveScheduleReminderSmsDisplay({ status: 'SKIPPED_CANCELLED' })).toBeNull();
    });

    it('maps SENT with sentAt tooltip', () => {
      const result = resolveScheduleReminderSmsDisplay({
        status: 'SENT',
        sentAt: '2026-08-01T14:00:00'
      });
      expect(result).toMatchObject({
        status: 'SENT',
        label: '발송됨',
        tooltip: '발송: 14:00',
        statusVariant: 'success'
      });
      expect(result.ariaLabel).toContain('발송됨');
    });

    it('maps PENDING with fireAt', () => {
      const result = resolveScheduleReminderSmsDisplay({
        status: 'PENDING',
        fireAt: '2026-08-02T09:00:00'
      });
      expect(result.label).toBe('대기');
      expect(result.tooltip).toBe('예정: 09:00');
      expect(result.statusVariant).toBe('warning');
    });

    it('maps FAILED with failureReason (no phone leak expected from API)', () => {
      const result = resolveScheduleReminderSmsDisplay({
        status: 'FAILED',
        failureReason: '번호 없음'
      });
      expect(result.label).toBe('실패');
      expect(result.tooltip).toBe('실패: 번호 없음');
      expect(result.statusVariant).toBe('danger');
      expect(result.ariaLabel).not.toMatch(/010/);
    });
  });
});
