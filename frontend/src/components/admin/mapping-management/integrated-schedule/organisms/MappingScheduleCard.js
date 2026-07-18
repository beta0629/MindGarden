/**
 * MappingScheduleCard - 매칭 스케줄 카드 (상담사→내담자 + 메타 + 액션 버튼)
 * @param {Object} mapping - 매칭 객체
 * @param {Object} eventData - 드래그용 이벤트 데이터 (FullCalendar)
 * @param {boolean} isDraggable - 드래그 가능 여부
 * @param {Function} [onScheduleFromCard] - «일정 등록» 클릭 시 (통합 스케줄 사이드바)
 * @param {Function} onPayment - 결제 확인 핸들러
 * @param {Function} onDeposit - 입금 확인 핸들러
 * @param {Function} onApprove - 승인 핸들러
 * @param {boolean} approveProcessing - 승인 처리 중 여부
 */

import React from 'react';
import PropTypes from 'prop-types';
import CardContainer from '../../../../common/CardContainer';
import MappingPartiesRow from '../molecules/MappingPartiesRow';
import CardMeta from '../molecules/CardMeta';
import CardActionGroup from '../molecules/CardActionGroup';
import SessionProgressIndicator from '../../molecules/SessionProgressIndicator';
import './MappingScheduleCard.css';

const MappingScheduleCard = ({
  mapping,
  eventData,
  isDraggable,
  onOpenPeek,
  onScheduleFromCard,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  onDesyncAction,
  onSessionExtension,
  onConfirmSessionExtensionPayment,
  onCancelSessionExtension,
  approveProcessing,
  cancelPendingProcessing,
  desyncProcessing
}) => {
  const handleCardBodyClick = () => {
    if (onOpenPeek) {
      onOpenPeek(mapping);
    }
  };

  const handleCardBodyKeyDown = (event) => {
    if (!onOpenPeek) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenPeek(mapping);
    }
  };

  return (
  <CardContainer>
    <div
      className="integrated-schedule__card-body integrated-schedule__card-body--peek-trigger"
      role={onOpenPeek ? 'button' : undefined}
      tabIndex={onOpenPeek ? 0 : undefined}
      onClick={onOpenPeek ? handleCardBodyClick : undefined}
      onKeyDown={onOpenPeek ? handleCardBodyKeyDown : undefined}
      aria-label={onOpenPeek ? `${mapping?.clientName || '매칭'} 상세 보기` : undefined}
    >
      <SessionProgressIndicator
        className="integrated-schedule__card-progress"
        used={mapping?.usedSessions}
        total={mapping?.totalSessions}
      />
      <MappingPartiesRow
        consultantName={mapping?.consultantName}
        clientName={mapping?.clientName}
      />
      <CardMeta
        status={mapping?.status}
        remainingSessions={mapping?.remainingSessions}
        packageName={mapping?.packageName}
        pendingSessionExtension={mapping?.pendingSessionExtension}
        hasConsultationSchedule={mapping?.hasConsultationSchedule}
        nextConsultationDate={mapping?.nextConsultationDate}
        paymentTiming={mapping?.paymentTiming}
      />
    </div>
    <CardActionGroup
      mapping={mapping}
      onOpenPeek={onOpenPeek ? () => onOpenPeek(mapping) : undefined}
      onScheduleFromCard={onScheduleFromCard}
      onPayment={onPayment}
      onDeposit={onDeposit}
      onApprove={onApprove}
      onCheckoutSameDay={onCheckoutSameDay}
      onCancelPendingMapping={onCancelPendingMapping}
      onDesyncAction={onDesyncAction}
      onSessionExtension={onSessionExtension}
      onConfirmSessionExtensionPayment={onConfirmSessionExtensionPayment}
      onCancelSessionExtension={onCancelSessionExtension}
      approveProcessing={approveProcessing}
      cancelPendingProcessing={cancelPendingProcessing}
      desyncProcessing={desyncProcessing}
    />
  </CardContainer>
  );
};

MappingScheduleCard.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    paymentTiming: PropTypes.string,
    consultantName: PropTypes.string,
    clientName: PropTypes.string,
    packageName: PropTypes.string,
    usedSessions: PropTypes.number,
    totalSessions: PropTypes.number,
    remainingSessions: PropTypes.number,
    pendingSessionExtension: PropTypes.object,
    hasConsultationSchedule: PropTypes.bool,
    nextConsultationDate: PropTypes.string
  }),
  eventData: PropTypes.object,
  isDraggable: PropTypes.bool,
  onOpenPeek: PropTypes.func,
  onScheduleFromCard: PropTypes.func,
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCheckoutSameDay: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
  onDesyncAction: PropTypes.func,
  onSessionExtension: PropTypes.func,
  onConfirmSessionExtensionPayment: PropTypes.func,
  onCancelSessionExtension: PropTypes.func,
  approveProcessing: PropTypes.bool,
  cancelPendingProcessing: PropTypes.bool,
  desyncProcessing: PropTypes.bool
};

MappingScheduleCard.defaultProps = {
  mapping: null,
  eventData: null,
  isDraggable: false,
  onOpenPeek: null,
  onScheduleFromCard: null,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  onCheckoutSameDay: null,
  onCancelPendingMapping: null,
  onDesyncAction: null,
  onSessionExtension: null,
  onConfirmSessionExtensionPayment: null,
  onCancelSessionExtension: null,
  approveProcessing: false,
  cancelPendingProcessing: false,
  desyncProcessing: false
};

export default MappingScheduleCard;
