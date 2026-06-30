/**
 * resolveMappingSidebarActions — compact row action matrix unit tests
 *
 * @author CoreSolution
 * @since 2026-06-30
 */

import resolveMappingSidebarActions from '../resolveMappingSidebarActions';

const t = (key) => key;

describe('resolveMappingSidebarActions', () => {
  it('scheduleable ACTIVE → primary 일정 등록 + overflow 회기 추가', () => {
    const mapping = { id: 1, status: 'ACTIVE', remainingSessions: 3 };
    const onSessionExtension = jest.fn();
    const { primaryAction, overflowItems } = resolveMappingSidebarActions({
      mapping,
      t,
      onScheduleFromCard: jest.fn(),
      onSessionExtension
    });
    expect(primaryAction.id).toBe('schedule');
    expect(overflowItems).toHaveLength(1);
    expect(overflowItems[0].id).toBe('session-extension');
  });

  it('PENDING_PAYMENT SAME_DAY → primary checkout + overflow cancel', () => {
    const mapping = { id: 2, status: 'PENDING_PAYMENT', paymentTiming: 'SAME_DAY_CARD' };
    const { primaryAction, overflowItems } = resolveMappingSidebarActions({
      mapping,
      t,
      onCheckoutSameDay: jest.fn(),
      onCancelPendingMapping: jest.fn()
    });
    expect(primaryAction.id).toBe('checkout-same-day');
    expect(overflowItems.some((i) => i.id === 'cancel-pending')).toBe(true);
  });
});
