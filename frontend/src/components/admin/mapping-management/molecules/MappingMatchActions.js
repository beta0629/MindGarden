/**
 * MappingMatchActions — 결제/입금/승인 매칭 액션 (ActionBarButton SSOT)
 * openModal·API·navigate는 부모에서 콜백으로만 연결한다.
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import ActionBarButton from '../../../common/ActionBarButton';
import { useTranslation } from 'react-i18next';
import {
  MAPPING_STATUS_PENDING_PAYMENT,
  PAYMENT_TIMING_SAME_DAY_CARD
} from '../constants/integratedScheduleSidebarFilterConstants';

// testid 는 RTL 회귀 0 유지를 위해 기존 `mapping-cancel-pending-trigger` 그대로 사용.
const CANCEL_BUTTON_TEST_ID = 'mapping-cancel-pending-trigger';
const ACTION_SIZE = 'sm';

const MappingMatchActions = ({
  mapping,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  cancelPendingProcessing = false,
  emphasizeCancelDanger = false,
  disabled = false,
  loading = false,
  buttonClassName = ''
}) => {
  const { t } = useTranslation();
  if (!mapping?.status) {
    return null;
  }

  const { status, id, paymentTiming } = mapping;
  const btnClassName = ['mg-v2-mapping-match-actions__btn', buttonClassName].filter(Boolean).join(' ');

  const isSameDayCardPending = status === MAPPING_STATUS_PENDING_PAYMENT
    && paymentTiming === PAYMENT_TIMING_SAME_DAY_CARD;
  // 옵션 B SAME_DAY_CARD 분기:
  //   - PENDING_PAYMENT + SAME_DAY_CARD → "당일 결제 + 활성화" (CheckoutSameDayModal)
  //   - PENDING_PAYMENT + ADVANCE/null → 기존 "결제 확인" (선납 입금 검증)
  const showCheckoutSameDay = isSameDayCardPending && onCheckoutSameDay;
  const showPayment = status === MAPPING_STATUS_PENDING_PAYMENT && !isSameDayCardPending && onPayment;
  const showDeposit = status === 'PAYMENT_CONFIRMED' && onDeposit;
  const showApprove = status === 'DEPOSIT_PENDING' && onApprove;
  // R4 (옵션 B 디러티 PENDING_PAYMENT 정리): PENDING_PAYMENT 매칭만 관리자 취소 보조 액션 노출.
  // ACTIVE/TERMINATED/SUSPENDED 등은 기존 종료/일시정지 흐름을 그대로 사용한다.
  const showCancelPending = status === MAPPING_STATUS_PENDING_PAYMENT && onCancelPendingMapping;
  if (!showCheckoutSameDay && !showPayment && !showDeposit && !showApprove && !showCancelPending) {
    return null;
  }

  return (
    <div className="mg-v2-mapping-match-actions" data-testid="mapping-match-actions">
      {showCheckoutSameDay && (
        <ActionBarButton
          type="button"
          variant="primary"
          size={ACTION_SIZE}
          className={btnClassName}
          onClick={() => onCheckoutSameDay(mapping)}
          aria-label={t('admin:mapping.card.actions.checkoutSameDayPayment')}
        >
          {t('admin:mapping.card.actions.checkoutSameDayPayment')}
        </ActionBarButton>
      )}
      {showPayment && (
        <ActionBarButton
          type="button"
          variant="primary"
          size={ACTION_SIZE}
          className={btnClassName}
          onClick={() => onPayment(mapping)}
          aria-label={t('admin.actions.paymentConfirm')}
        >
          {t('admin.actions.paymentConfirm')}
        </ActionBarButton>
      )}
      {showDeposit && (
        <ActionBarButton
          type="button"
          variant="primary"
          size={ACTION_SIZE}
          className={btnClassName}
          onClick={() => onDeposit(mapping)}
          aria-label="입금 확인"
        >
          입금 확인
        </ActionBarButton>
      )}
      {showApprove && (
        <ActionBarButton
          type="button"
          variant="primary"
          size={ACTION_SIZE}
          className={btnClassName}
          disabled={disabled}
          loading={loading}
          onClick={() => onApprove(id)}
          aria-label="승인"
        >
          승인
        </ActionBarButton>
      )}
      {showCancelPending && (
        <ActionBarButton
          type="button"
          variant="danger"
          size={ACTION_SIZE}
          className={[
            btnClassName,
            'integrated-schedule__btn-cancel-pending',
            emphasizeCancelDanger ? 'integrated-schedule__action-danger' : ''
          ].filter(Boolean).join(' ')}
          onClick={() => onCancelPendingMapping(mapping)}
          disabled={cancelPendingProcessing}
          loading={cancelPendingProcessing}
          aria-label={t('admin:mapping.card.actions.cancel')}
          data-testid={CANCEL_BUTTON_TEST_ID}
        >
          {t('admin:mapping.card.actions.cancel')}
        </ActionBarButton>
      )}
    </div>
  );
};

MappingMatchActions.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    paymentTiming: PropTypes.string
  }),
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCheckoutSameDay: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
  cancelPendingProcessing: PropTypes.bool,
  emphasizeCancelDanger: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  buttonClassName: PropTypes.string
};

MappingMatchActions.defaultProps = {
  mapping: null,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  onCheckoutSameDay: null,
  onCancelPendingMapping: null,
  cancelPendingProcessing: false,
  emphasizeCancelDanger: false,
  disabled: false,
  loading: false,
  buttonClassName: ''
};

export default MappingMatchActions;
