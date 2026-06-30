/**
 * MappingScheduleCard - 사이드바 compact list row (grip + parties/meta + actions)
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import { GripVertical } from 'lucide-react';
import CardContainer from '../../../../common/CardContainer';
import MappingPartiesRow from '../molecules/MappingPartiesRow';
import CardMeta from '../molecules/CardMeta';
import CardActionGroup from '../molecules/CardActionGroup';
import './MappingScheduleCard.css';

const GRIP_ICON_SIZE = 16;

const MappingScheduleCard = ({
  mapping,
  isDraggable,
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
  <CardContainer
    variant="sidebarRow"
    className={[
      'integrated-schedule__card-row',
      isDraggable && 'integrated-schedule__card-row--draggable'
    ].filter(Boolean).join(' ')}
  >
    <div
      className={[
        'integrated-schedule__card-grip',
        !isDraggable && 'integrated-schedule__card-grip--disabled'
      ].filter(Boolean).join(' ')}
      aria-hidden={!isDraggable}
      aria-label={isDraggable ? '캘린더로 끌어 일정 등록' : undefined}
    >
      <GripVertical size={GRIP_ICON_SIZE} aria-hidden="true" />
    </div>
    <div className="integrated-schedule__card-center">
      <MappingPartiesRow
        layout="compact"
        consultantName={mapping?.consultantName}
        clientName={mapping?.clientName}
      />
      <CardMeta
        status={mapping?.status}
        remainingSessions={mapping?.remainingSessions}
      />
    </div>
    <CardActionGroup
      mapping={mapping}
      onScheduleFromCard={onScheduleFromCard}
      onPayment={onPayment}
      onDeposit={onDeposit}
      onApprove={onApprove}
      onCheckoutSameDay={onCheckoutSameDay}
      onCancelPendingMapping={onCancelPendingMapping}
      onSessionExtension={onSessionExtension}
      approveProcessing={approveProcessing}
      cancelPendingProcessing={cancelPendingProcessing}
    />
  </CardContainer>
);

MappingScheduleCard.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    paymentTiming: PropTypes.string,
    consultantName: PropTypes.string,
    clientName: PropTypes.string,
    remainingSessions: PropTypes.number
  }),
  isDraggable: PropTypes.bool,
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

MappingScheduleCard.defaultProps = {
  mapping: null,
  isDraggable: false,
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

export default MappingScheduleCard;
