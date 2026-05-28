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
  onScheduleFromCard,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  approveProcessing,
  cancelPendingProcessing
}) => (
  <CommonCardActionGroup>
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
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCheckoutSameDay: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
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
  approveProcessing: false,
  cancelPendingProcessing: false
};

export default CardActionGroup;
