/**
 * CardActionGroup — 통합 스케줄 카드 하단 액션 래퍼 (MappingMatchActions + 공통 레이아웃)
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CardActionGroup as CommonCardActionGroup } from '../../../../common';
import MGButton from '../../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../../erp/common/erpMgButtonProps';
import MappingMatchActions from '../../molecules/MappingMatchActions';
import { SESSION_EXTENSION_UI } from '../../../../../utils/sessionExtensionPending';

const CardActionGroup = ({
  mapping,
  onOpenPeek,
  onScheduleFromCard,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  onSessionExtension,
  onConfirmSessionExtensionPayment,
  onCancelSessionExtension,
  approveProcessing,
  cancelPendingProcessing
}) => {
  const pendingExtension = mapping?.pendingSessionExtension;
  const hasPendingExtension = Boolean(pendingExtension?.id);

  return (
  <CommonCardActionGroup className="integrated-schedule__card-actions">
    {onOpenPeek && (
      <MGButton
        type="button"
        variant="ghost"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'ghost',
          size: 'sm',
          loading: false,
          className: 'integrated-schedule__btn-detail-peek'
        })}
        loading={false}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={(event) => {
          event.stopPropagation();
          onOpenPeek();
        }}
        aria-label="상세"
        data-testid={`mapping-detail-peek-${mapping?.id ?? 'unknown'}`}
        preventDoubleClick={false}
      >
        상세
      </MGButton>
    )}
    {onScheduleFromCard && (
      <MGButton
        type="button"
        variant="secondary"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'secondary',
          size: 'sm',
          loading: false,
          className: 'integrated-schedule__btn-schedule-from-card'
        })}
        loading={false}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onScheduleFromCard}
        aria-label="일정 등록"
        preventDoubleClick={false}
      >
        일정 등록
      </MGButton>
    )}
    {mapping?.status === 'ACTIVE' && !hasPendingExtension && onSessionExtension && (
      <MGButton
        type="button"
        variant="secondary"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'secondary',
          size: 'sm',
          loading: false,
          className: 'integrated-schedule__btn-add-sessions-from-card'
        })}
        loading={false}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => onSessionExtension(mapping)}
        aria-label={SESSION_EXTENSION_UI.ADD_LABEL}
        preventDoubleClick={false}
      >
        {SESSION_EXTENSION_UI.ADD_LABEL}
      </MGButton>
    )}
    {mapping?.status === 'ACTIVE' && hasPendingExtension && onConfirmSessionExtensionPayment && (
      <MGButton
        type="button"
        variant="primary"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'primary',
          size: 'sm',
          loading: false,
          className: 'integrated-schedule__btn-confirm-session-extension'
        })}
        loading={false}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => onConfirmSessionExtensionPayment(mapping)}
        aria-label={SESSION_EXTENSION_UI.CONFIRM_LABEL}
        preventDoubleClick={false}
      >
        {SESSION_EXTENSION_UI.CONFIRM_LABEL}
      </MGButton>
    )}
    {mapping?.status === 'ACTIVE' && hasPendingExtension && onCancelSessionExtension && (
      <MGButton
        type="button"
        variant="danger"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'danger',
          size: 'sm',
          loading: false,
          className: 'integrated-schedule__btn-cancel-session-extension'
        })}
        loading={false}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => onCancelSessionExtension(mapping)}
        aria-label={SESSION_EXTENSION_UI.CANCEL_LABEL}
        preventDoubleClick={false}
      >
        {SESSION_EXTENSION_UI.CANCEL_LABEL}
      </MGButton>
    )}
    <MappingMatchActions
      mapping={mapping}
      onPayment={onPayment}
      onDeposit={onDeposit}
      onApprove={onApprove}
      onCheckoutSameDay={onCheckoutSameDay}
      onCancelPendingMapping={onCancelPendingMapping}
      cancelPendingProcessing={cancelPendingProcessing}
      disabled={approveProcessing}
      loading={approveProcessing}
    />
  </CommonCardActionGroup>
  );
};

CardActionGroup.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    paymentTiming: PropTypes.string,
    clientName: PropTypes.string,
    pendingSessionExtension: PropTypes.object
  }),
  onOpenPeek: PropTypes.func,
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCheckoutSameDay: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
  onSessionExtension: PropTypes.func,
  onConfirmSessionExtensionPayment: PropTypes.func,
  onCancelSessionExtension: PropTypes.func,
  approveProcessing: PropTypes.bool,
  cancelPendingProcessing: PropTypes.bool
};

CardActionGroup.defaultProps = {
  mapping: null,
  onOpenPeek: null,
  onScheduleFromCard: null,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  onCheckoutSameDay: null,
  onCancelPendingMapping: null,
  onSessionExtension: null,
  onConfirmSessionExtensionPayment: null,
  onCancelSessionExtension: null,
  approveProcessing: false,
  cancelPendingProcessing: false
};

export default CardActionGroup;
