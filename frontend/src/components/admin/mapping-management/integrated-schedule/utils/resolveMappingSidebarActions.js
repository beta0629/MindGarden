/**
 * resolveMappingSidebarActions — 사이드바 compact row Primary + overflow SSOT
 *
 * @author CoreSolution
 * @since 2026-06-30
 */

import {
  MAPPING_STATUS_ACTIVE,
  MAPPING_STATUS_PENDING_PAYMENT,
  PAYMENT_TIMING_SAME_DAY_CARD
} from '../../constants/integratedScheduleSidebarFilterConstants';

const CANCEL_TEST_ID = 'mapping-cancel-pending-trigger';

/**
 * @param {Object} params
 * @returns {{ primaryAction: Object|null, overflowItems: Array }}
 */
export function resolveMappingSidebarActions({
  mapping,
  t,
  onScheduleFromCard,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  onSessionExtension,
  approveProcessing = false,
  cancelPendingProcessing = false
}) {
  const overflowItems = [];

  if (onScheduleFromCard) {
    if (mapping?.status === MAPPING_STATUS_ACTIVE && onSessionExtension) {
      overflowItems.push({
        id: 'session-extension',
        label: t('admin:sessionManagement.quickAdd.addBtn', { defaultValue: '회기 추가' }),
        onClick: () => onSessionExtension(mapping)
      });
    }

    return {
      primaryAction: {
        id: 'schedule',
        label: '일정 등록',
        ariaLabel: '일정 등록',
        variant: 'secondary',
        onClick: onScheduleFromCard
      },
      overflowItems
    };
  }

  if (!mapping?.status) {
    return { primaryAction: null, overflowItems: [] };
  }

  const { status, id, paymentTiming } = mapping;
  const isSameDayCardPending = status === MAPPING_STATUS_PENDING_PAYMENT
    && paymentTiming === PAYMENT_TIMING_SAME_DAY_CARD;

  let primaryAction = null;

  if (isSameDayCardPending && onCheckoutSameDay) {
    primaryAction = {
      id: 'checkout-same-day',
      label: t('admin:mapping.card.actions.checkoutSameDayPayment'),
      ariaLabel: t('admin:mapping.card.actions.checkoutSameDayPayment'),
      variant: 'primary',
      onClick: () => onCheckoutSameDay(mapping)
    };
  } else if (status === MAPPING_STATUS_PENDING_PAYMENT && onPayment) {
    primaryAction = {
      id: 'payment',
      label: t('admin.actions.paymentConfirm'),
      ariaLabel: t('admin.actions.paymentConfirm'),
      variant: 'success',
      onClick: () => onPayment(mapping)
    };
  } else if (status === 'PAYMENT_CONFIRMED' && onDeposit) {
    primaryAction = {
      id: 'deposit',
      label: '입금 확인',
      ariaLabel: '입금 확인',
      variant: 'primary',
      onClick: () => onDeposit(mapping)
    };
  } else if (status === 'DEPOSIT_PENDING' && onApprove) {
    primaryAction = {
      id: 'approve',
      label: '승인',
      ariaLabel: '승인',
      variant: 'success',
      disabled: approveProcessing,
      loading: approveProcessing,
      onClick: () => onApprove(id)
    };
  }

  if (status === MAPPING_STATUS_PENDING_PAYMENT && onCancelPendingMapping) {
    overflowItems.push({
      id: 'cancel-pending',
      label: t('admin:mapping.card.actions.cancel'),
      variant: 'destructive',
      disabled: cancelPendingProcessing,
      testId: CANCEL_TEST_ID,
      onClick: () => onCancelPendingMapping(mapping)
    });
  }

  return { primaryAction, overflowItems };
}

export default resolveMappingSidebarActions;
