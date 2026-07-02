/**
 * MappingEntityRowActions — 매칭 overflow ⋮ (EntityRowActions SSOT)
 * 결제·입금 모달 상태는 이 컴포넌트에서 관리한다.
 *
 * @author CoreSolution
 * @since 2026-06-30
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../../../common';
import MappingPaymentModal from '../../mapping/MappingPaymentModal';
import MappingDepositModal from '../../mapping/MappingDepositModal';
import { buildMappingEntityActionItems } from '../utils/buildMappingEntityActionItems';

const MappingEntityRowActions = ({
  mapping,
  layout = ENTITY_ROW_ACTIONS_LAYOUT.TABLE,
  ariaLabel = '매칭 작업',
  menuId,
  onView,
  onEdit,
  onRefund,
  onConfirmPayment,
  onConfirmDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  cancelPendingProcessing = false
}) => {
  const { t } = useTranslation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleCriticalAction = useCallback(
    async (fn) => {
      if (processing) return;
      setProcessing(true);
      try {
        if (fn) await fn();
      } finally {
        setTimeout(() => setProcessing(false), 1000);
      }
    },
    [processing]
  );

  const openPaymentModal = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  const openDepositModal = useCallback(() => {
    setShowDepositModal(true);
  }, []);

  const handleApprove = useCallback(
    (mappingId) => handleCriticalAction(() => onApprove?.(mappingId)),
    [handleCriticalAction, onApprove]
  );

  const handleRefund = useCallback(
    (targetMapping) => handleCriticalAction(() => onRefund?.(targetMapping)),
    [handleCriticalAction, onRefund]
  );

  const items = buildMappingEntityActionItems({
    mapping,
    t,
    onPayment: openPaymentModal,
    onDeposit: openDepositModal,
    onApprove: onApprove ? handleApprove : undefined,
    onCheckoutSameDay,
    onCancelPendingMapping,
    onView,
    onEdit,
    onRefund: onRefund ? handleRefund : undefined,
    processing,
    cancelPendingProcessing
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <EntityRowActions
        layout={layout}
        ariaLabel={ariaLabel}
        menuId={menuId}
        items={items}
      />
      {showPaymentModal && (
        <MappingPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          mapping={mapping}
          onPaymentConfirmed={() => {
            setShowPaymentModal(false);
            onConfirmPayment?.();
          }}
        />
      )}
      {showDepositModal && (
        <MappingDepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          mapping={mapping}
          onDepositConfirmed={() => {
            setShowDepositModal(false);
            onConfirmDeposit?.();
          }}
        />
      )}
    </>
  );
};

MappingEntityRowActions.propTypes = {
  mapping: PropTypes.object.isRequired,
  layout: PropTypes.oneOf(Object.values(ENTITY_ROW_ACTIONS_LAYOUT)),
  ariaLabel: PropTypes.string,
  menuId: PropTypes.string,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onRefund: PropTypes.func,
  onConfirmPayment: PropTypes.func,
  onConfirmDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCheckoutSameDay: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
  cancelPendingProcessing: PropTypes.bool
};

export default MappingEntityRowActions;
