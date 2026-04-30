/**
 * CardActionGroup — 통합 스케줄 카드 하단 액션 래퍼 (MappingMatchActions + 공통 레이아웃)
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CardActionGroup as CommonCardActionGroup } from '../../../../common';
import MappingMatchActions from '../../molecules/MappingMatchActions';

const CardActionGroup = ({
  mapping,
  onPayment,
  onDeposit,
  onApprove,
  approveProcessing
}) => (
  <CommonCardActionGroup>
    <MappingMatchActions
      mapping={mapping}
      onPayment={onPayment}
      onDeposit={onDeposit}
      onApprove={onApprove}
      disabled={approveProcessing}
      loading={approveProcessing}
    />
  </CommonCardActionGroup>
);

CardActionGroup.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    clientName: PropTypes.string
  }),
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  approveProcessing: PropTypes.bool
};

CardActionGroup.defaultProps = {
  mapping: null,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  approveProcessing: false
};

export default CardActionGroup;
