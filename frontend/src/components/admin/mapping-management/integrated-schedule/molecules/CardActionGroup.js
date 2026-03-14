/**
 * CardActionGroup - 결제/입금/승인/스케줄 등록 버튼 그룹
 * @param {Object} mapping - 매칭 객체
 * @param {Function} onPayment - 결제 확인 핸들러
 * @param {Function} onDeposit - 입금 확인 핸들러
 * @param {Function} onApprove - 승인 핸들러
 * @param {Function} onScheduleRegister - 스케줄 등록 핸들러
 * @param {boolean} approveProcessing - 승인 처리 중 여부
 * @param {boolean} canScheduleForMapping - 스케줄 등록 가능 여부
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CalendarPlus, CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import MGButton from '../../../../common/MGButton';
import './CardActionGroup.css';

const CardActionGroup = ({
  mapping,
  onPayment,
  onDeposit,
  onApprove,
  onScheduleRegister,
  approveProcessing,
  canScheduleForMapping
}) => (
  <div className="integrated-schedule__card-actions">
    {mapping?.status === 'PENDING_PAYMENT' && (
      <MGButton
        type="button"
        variant="success"
        size="small"
        className="integrated-schedule__btn-action integrated-schedule__btn-action--payment"
        onClick={() => onPayment?.(mapping)}
        preventDoubleClick={false}
        aria-label="결제 확인"
      >
        <CreditCard size={14} />
        결제 확인
      </MGButton>
    )}
    {mapping?.status === 'PAYMENT_CONFIRMED' && (
      <MGButton
        type="button"
        variant="primary"
        size="small"
        className="integrated-schedule__btn-action integrated-schedule__btn-action--deposit"
        onClick={() => onDeposit?.(mapping)}
        preventDoubleClick={false}
        aria-label="입금 확인"
      >
        <DollarSign size={14} />
        입금 확인
      </MGButton>
    )}
    {mapping?.status === 'DEPOSIT_PENDING' && (
      <MGButton
        type="button"
        variant="success"
        size="small"
        className="integrated-schedule__btn-action integrated-schedule__btn-action--approve"
        onClick={() => onApprove?.(mapping.id)}
        loading={approveProcessing}
        loadingText="승인 중..."
        preventDoubleClick
        aria-label="승인"
      >
        <CheckCircle size={14} />
        승인
      </MGButton>
    )}
    <MGButton
      type="button"
      variant="primary"
      size="small"
      className="integrated-schedule__btn-schedule"
      onClick={() => onScheduleRegister?.(mapping)}
      disabled={!canScheduleForMapping}
      preventDoubleClick={false}
      aria-label={
        canScheduleForMapping
          ? `${mapping?.clientName || '내담자'} 스케줄 등록`
          : '결제 완료 후 스케줄 등록 가능'
      }
      title={
        canScheduleForMapping
          ? undefined
          : '결제가 완료된 매칭만 스케줄 등록이 가능합니다.'
      }
    >
      <CalendarPlus size={14} />
      스케줄 등록
    </MGButton>
  </div>
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
  onScheduleRegister: PropTypes.func,
  approveProcessing: PropTypes.bool,
  canScheduleForMapping: PropTypes.bool
};

CardActionGroup.defaultProps = {
  mapping: null,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  onScheduleRegister: null,
  approveProcessing: false,
  canScheduleForMapping: false
};

export default CardActionGroup;
