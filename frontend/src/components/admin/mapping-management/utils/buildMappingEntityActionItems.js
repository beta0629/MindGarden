/**
 * buildMappingEntityActionItems — 매칭 EntityRowActions overflow items SSOT
 *
 * @author CoreSolution
 * @since 2026-06-30
 */

import {
  MAPPING_STATUS_PENDING_PAYMENT,
  PAYMENT_TIMING_SAME_DAY_CARD
} from '../constants/integratedScheduleSidebarFilterConstants';

/** 카드 Primary CTA 1개로 노출할 workflow 액션 id (CardActionGroup SSOT) */
export const MAPPING_PRIMARY_ACTION_IDS = [
  'checkout-same-day',
  'payment',
  'deposit',
  'approve'
];

/**
 * workflow Primary 1개와 overflow items 분리
 *
 * @param {Array} items - buildMappingEntityActionItems 결과
 * @returns {{ primaryAction: { label: string, onClick: Function }|null, overflowItems: Array }}
 */
export function splitMappingActionItems(items = []) {
  const primaryIndex = items.findIndex((item) => MAPPING_PRIMARY_ACTION_IDS.includes(item.id));
  if (primaryIndex === -1) {
    return { primaryAction: null, overflowItems: items };
  }

  const primaryItem = items[primaryIndex];
  return {
    primaryAction: {
      label: primaryItem.label,
      onClick: primaryItem.onClick
    },
    overflowItems: items.filter((_, index) => index !== primaryIndex)
  };
}

/**
 * @param {Object} params
 * @param {Object} params.mapping
 * @param {Function} params.t - i18n translate
 * @param {Function} [params.onPayment]
 * @param {Function} [params.onDeposit]
 * @param {Function} [params.onApprove]
 * @param {Function} [params.onCheckoutSameDay]
 * @param {Function} [params.onCancelPendingMapping]
 * @param {Function} [params.onView]
 * @param {Function} [params.onEdit]
 * @param {Function} [params.onRefund]
 * @param {boolean} [params.processing]
 * @param {boolean} [params.cancelPendingProcessing]
 * @returns {Array}
 */
export function buildMappingEntityActionItems({
  mapping,
  t,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  onView,
  onEdit,
  onRefund,
  processing = false,
  cancelPendingProcessing = false
}) {
  if (!mapping) {
    return [];
  }

  const items = [];
  const { status, paymentTiming } = mapping;
  const isSameDayCardPending = status === MAPPING_STATUS_PENDING_PAYMENT
    && paymentTiming === PAYMENT_TIMING_SAME_DAY_CARD;

  if (isSameDayCardPending && onCheckoutSameDay) {
    items.push({
      id: 'checkout-same-day',
      label: t('admin:mapping.card.actions.checkoutSameDayPayment'),
      onClick: () => onCheckoutSameDay(mapping)
    });
  } else if (status === MAPPING_STATUS_PENDING_PAYMENT && onPayment) {
    items.push({
      id: 'payment',
      label: t('admin.actions.paymentConfirm'),
      onClick: () => onPayment(mapping)
    });
  }

  if (status === 'PAYMENT_CONFIRMED' && onDeposit) {
    items.push({
      id: 'deposit',
      label: '입금 확인',
      onClick: () => onDeposit(mapping)
    });
  }

  if (status === 'DEPOSIT_PENDING' && onApprove) {
    items.push({
      id: 'approve',
      label: '승인',
      disabled: processing,
      onClick: () => onApprove(mapping.id ?? mapping)
    });
  }

  if (status === MAPPING_STATUS_PENDING_PAYMENT && onCancelPendingMapping) {
    items.push({
      id: 'cancel-pending',
      label: t('admin:mapping.card.actions.cancel'),
      disabled: cancelPendingProcessing,
      onClick: () => onCancelPendingMapping(mapping)
    });
  }

  if (onView) {
    items.push({
      id: 'detail',
      label: '상세',
      onClick: () => onView(mapping)
    });
  }

  if (onEdit) {
    items.push({
      id: 'edit',
      label: t('common.actions.edit'),
      onClick: () => onEdit(mapping)
    });
  }

  if (onRefund) {
    items.push({
      id: 'refund',
      label: '환불',
      variant: 'destructive',
      disabled: processing,
      onClick: () => onRefund(mapping)
    });
  }

  return items;
}

export default buildMappingEntityActionItems;
