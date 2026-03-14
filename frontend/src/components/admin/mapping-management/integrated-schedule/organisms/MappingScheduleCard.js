/**
 * MappingScheduleCard - 매칭 스케줄 카드 (상담사→내담자 + 메타 + 액션 버튼)
 * @param {Object} mapping - 매칭 객체
 * @param {Object} eventData - 드래그용 이벤트 데이터 (FullCalendar)
 * @param {boolean} isDraggable - 드래그 가능 여부 (외부에서 fc-event 클래스 제어용, 여기선 미사용)
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
import './MappingScheduleCard.css';

const MappingScheduleCard = ({
  mapping,
  eventData,
  isDraggable,
  onPayment,
  onDeposit,
  onApprove,
  approveProcessing
}) => (
  <CardContainer>
    <div className="integrated-schedule__card-body">
      <MappingPartiesRow
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
      onPayment={onPayment}
      onDeposit={onDeposit}
      onApprove={onApprove}
      approveProcessing={approveProcessing}
    />
  </CardContainer>
);

MappingScheduleCard.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    consultantName: PropTypes.string,
    clientName: PropTypes.string,
    remainingSessions: PropTypes.number
  }),
  eventData: PropTypes.object,
  isDraggable: PropTypes.bool,
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  approveProcessing: PropTypes.bool
};

MappingScheduleCard.defaultProps = {
  mapping: null,
  eventData: null,
  isDraggable: false,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  approveProcessing: false
};

export default MappingScheduleCard;
