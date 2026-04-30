/**
 * MappingMatchActions — 결제/입금/승인 매칭 액션 (MGButton + ERP 클래스 계약)
 * openModal·API·navigate는 부모에서 콜백으로만 연결한다.
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';

const BTN_SM = 'sm';

const MappingMatchActions = ({
  mapping,
  onPayment,
  onDeposit,
  onApprove,
  disabled = false,
  loading = false,
  buttonClassName = ''
}) => {
  if (!mapping?.status) {
    return null;
  }

  const { status, id } = mapping;
  const btnExtra = ['mg-v2-mapping-match-actions__btn', buttonClassName].filter(Boolean).join(' ');

  return (
    <>
      {status === 'PENDING_PAYMENT' && onPayment && (
        <MGButton
          type="button"
          variant="success"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'success',
            size: BTN_SM,
            loading: false,
            className: btnExtra
          })}
          loading={false}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onPayment(mapping)}
          aria-label="결제 확인"
          preventDoubleClick={false}
        >
          결제 확인
        </MGButton>
      )}
      {status === 'PAYMENT_CONFIRMED' && onDeposit && (
        <MGButton
          type="button"
          variant="primary"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: BTN_SM,
            loading: false,
            className: btnExtra
          })}
          loading={false}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onDeposit(mapping)}
          aria-label="입금 확인"
          preventDoubleClick={false}
        >
          입금 확인
        </MGButton>
      )}
      {status === 'DEPOSIT_PENDING' && onApprove && (
        <MGButton
          type="button"
          variant="success"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'success',
            size: BTN_SM,
            loading,
            className: btnExtra
          })}
          disabled={disabled}
          loading={loading}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onApprove(id)}
          aria-label="승인"
          preventDoubleClick={false}
        >
          승인
        </MGButton>
      )}
    </>
  );
};

MappingMatchActions.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string
  }),
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  buttonClassName: PropTypes.string
};

MappingMatchActions.defaultProps = {
  mapping: null,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  disabled: false,
  loading: false,
  buttonClassName: ''
};

export default MappingMatchActions;
