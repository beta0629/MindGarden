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
import { useTranslation } from 'react-i18next';
import {
  MAPPING_STATUS_PENDING_PAYMENT,
  PAYMENT_TIMING_SAME_DAY_CARD
} from '../constants/integratedScheduleSidebarFilterConstants';

const BTN_SM = 'sm';
// R4 v2.0 (디자이너 시안 docs/project-management/2026-05-28/R4_BUTTON_REDESIGN_V2.md, 옵션 A2):
// 텍스트 링크에서 정식 보조 버튼(풀-width Danger Outline)으로 리디자인.
// testid 는 RTL 회귀 0 유지를 위해 기존 `mapping-cancel-pending-trigger` 그대로 사용.
const CANCEL_BUTTON_TEST_ID = 'mapping-cancel-pending-trigger';

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
  const btnExtra = ['mg-v2-mapping-match-actions__btn', buttonClassName].filter(Boolean).join(' ');

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
          onClick={() => onCheckoutSameDay(mapping)}
          aria-label={t('admin:mapping.card.actions.checkoutSameDayPayment')}
          preventDoubleClick={false}
        >
          {t('admin:mapping.card.actions.checkoutSameDayPayment')}
        </MGButton>
      )}
      {showPayment && (
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
          aria-label={t('admin.actions.paymentConfirm')}
          preventDoubleClick={false}
        >
          {t('admin.actions.paymentConfirm')}
        </MGButton>
      )}
      {showDeposit && (
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
      {showApprove && (
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
      {showCancelPending && (
        <button
          type="button"
          className={[
            'mg-v2-mapping-match-actions__cancel-btn',
            emphasizeCancelDanger ? 'integrated-schedule__action-danger' : ''
          ].filter(Boolean).join(' ')}
          onClick={() => onCancelPendingMapping(mapping)}
          disabled={cancelPendingProcessing}
          aria-label={t('admin:mapping.card.actions.cancel')}
          aria-busy={cancelPendingProcessing}
          data-testid={CANCEL_BUTTON_TEST_ID}
        >
          {t('admin:mapping.card.actions.cancel')}
        </button>
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
