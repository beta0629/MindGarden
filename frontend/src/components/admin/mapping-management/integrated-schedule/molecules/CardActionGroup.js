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
  approveProcessing,
  cancelPendingProcessing
}) => (
  <CommonCardActionGroup>
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
    {mapping?.status === 'ACTIVE' && onSessionExtension && (
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
        aria-label="회기 추가"
        preventDoubleClick={false}
      >
        회기 추가
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

CardActionGroup.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    paymentTiming: PropTypes.string,
    clientName: PropTypes.string
  }),
  onOpenPeek: PropTypes.func,
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
  onOpenPeek: null,
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
