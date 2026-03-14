/**
 * CardActionGroup - 결제/입금/승인 버튼 그룹 (common ActionButton 사용)
 * @param {Object} mapping - 매칭 객체
 * @param {Function} onPayment - 결제 확인 핸들러
 * @param {Function} onDeposit - 입금 확인 핸들러
 * @param {Function} onApprove - 승인 핸들러
 * @param {boolean} approveProcessing - 승인 처리 중 여부
 */

import React from 'react';
import PropTypes from 'prop-types';
import ActionButton from '../../../../common/ActionButton';
import { CardActionGroup as CommonCardActionGroup } from '../../../../common';

const CardActionGroup = ({
  mapping,
  onPayment,
  onDeposit,
  onApprove,
  approveProcessing
}) => (
  <CommonCardActionGroup>
    {mapping?.status === 'PENDING_PAYMENT' && (
      <ActionButton
        variant="success"
        size="small"
        onClick={() => onPayment?.(mapping)}
        aria-label="결제 확인"
      >
        결제 확인
      </ActionButton>
    )}
    {mapping?.status === 'PAYMENT_CONFIRMED' && (
      <ActionButton
        variant="primary"
        size="small"
        onClick={() => onDeposit?.(mapping)}
        aria-label="입금 확인"
      >
        입금 확인
      </ActionButton>
    )}
    {mapping?.status === 'DEPOSIT_PENDING' && (
      <ActionButton
        variant="success"
        size="small"
        disabled={approveProcessing}
        onClick={() => onApprove?.(mapping.id)}
        aria-label="승인"
      >
        {approveProcessing ? '승인 중...' : '승인'}
      </ActionButton>
    )}
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
