/**
 * CardActionGroup — 통합 스케줄 사이드바 compact row 액션 (Primary 1 + overflow ⋮)
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import MGButton from '../../../../common/MGButton';
import { EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../../../../common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../../erp/common/erpMgButtonProps';
import resolveMappingSidebarActions from '../utils/resolveMappingSidebarActions';
import './CardActionGroup.css';

const BTN_SM = 'sm';

const CardActionGroup = ({
  mapping,
  onScheduleFromCard,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  onSessionExtension,
  approveProcessing,
  cancelPendingProcessing
}) => {
  const { t } = useTranslation();
  const { primaryAction, overflowItems } = resolveMappingSidebarActions({
    mapping,
    t,
    onScheduleFromCard,
    onPayment,
    onDeposit,
    onApprove,
    onCheckoutSameDay,
    onCancelPendingMapping,
    onSessionExtension,
    approveProcessing,
    cancelPendingProcessing
  });

  if (!primaryAction && overflowItems.length === 0) {
    return null;
  }

  const overflowWithBusy = overflowItems.map((item) => (
    item.id === 'cancel-pending' && cancelPendingProcessing
      ? { ...item, busy: true }
      : item
  ));

  return (
    <div
      className="mg-v2-card-actions mg-v2-card-actions--compact-row"
      data-testid="mapping-match-actions"
    >
      {primaryAction && (
        <MGButton
          type="button"
          variant={primaryAction.variant}
          size="small"
          className={buildErpMgButtonClassName({
            variant: primaryAction.variant,
            size: BTN_SM,
            loading: Boolean(primaryAction.loading),
            className: [
              'mg-v2-mapping-match-actions__btn',
              'integrated-schedule__card-primary-action',
              primaryAction.id === 'schedule' && 'integrated-schedule__btn-schedule-from-card'
            ].filter(Boolean).join(' ')
          })}
          disabled={primaryAction.disabled}
          loading={Boolean(primaryAction.loading)}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={primaryAction.onClick}
          aria-label={primaryAction.ariaLabel}
          preventDoubleClick={false}
        >
          {primaryAction.label}
        </MGButton>
      )}
      {overflowWithBusy.length > 0 && (
        <EntityRowActions
          layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
          ariaLabel="매칭 작업"
          items={overflowWithBusy}
        />
      )}
    </div>
  );
};

CardActionGroup.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    paymentTiming: PropTypes.string,
    clientName: PropTypes.string
  }),
  onScheduleFromCard: PropTypes.func,
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCheckoutSameDay: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
  onSessionExtension: PropTypes.func,
  approveProcessing: PropTypes.bool,
  cancelPendingProcessing: PropTypes.bool
};

CardActionGroup.defaultProps = {
  mapping: null,
  onScheduleFromCard: null,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  onCheckoutSameDay: null,
  onCancelPendingMapping: null,
  onSessionExtension: null,
  approveProcessing: false,
  cancelPendingProcessing: false
};

export default CardActionGroup;
