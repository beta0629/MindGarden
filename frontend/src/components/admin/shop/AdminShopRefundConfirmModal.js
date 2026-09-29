/**
 * 전액 환불 확인 (2단계) — 사유 필수, 이미 쓴 회기가 있으면 확인 체크 필수.
 * 스위트에서 벽돌 솔리드 버튼은 이 모달의 최종 버튼 하나뿐이다.
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import React, { useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import {
  ADMIN_SHOP_ORDER_PAYMENT_ID_LABEL,
  ADMIN_SHOP_REFUND_PG_HINT,
  ADMIN_SHOP_REFUND_REASON_OPTIONS
} from '../../../constants/adminShopApi';
import {
  ADMIN_SHOP_REFUND_CONFIRM_COPY,
  ADMIN_SHOP_SUITE_TEST_IDS,
  formatAdminShopCopy
} from '../../../constants/adminShopSuite';
import { formatShopMoney } from '../../../utils/clientShopFormat';
import { toDisplayString } from '../../../utils/safeDisplay';
import { AdminShopPairPanel } from './AdminShopSuiteParts';

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
function AdminShopRefundConfirmModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  amount,
  sessions,
  usedCount,
  paymentId
}) {
  const baseId = useId();
  const [reason, setReason] = useState('');
  const [usedChecked, setUsedChecked] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setUsedChecked(false);
      setTouched(false);
    }
  }, [isOpen]);

  const hasUsed = usedCount != null && usedCount > 0;
  const reasonValid = Boolean(reason);
  const usedValid = !hasUsed || usedChecked;
  const canSubmit = reasonValid && usedValid && !submitting;
  const amountText = amount != null ? formatShopMoney(amount) : '—';
  const sessionsText = sessions != null ? `−${sessions}` : '—';
  const usedCaption = hasUsed
    ? formatAdminShopCopy(ADMIN_SHOP_REFUND_CONFIRM_COPY.USED_CAPTION, { usedCount })
    : '';

  const handleSubmit = () => {
    setTouched(true);
    if (!reasonValid || !usedValid) {
      return;
    }
    onSubmit(reason);
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={ADMIN_SHOP_REFUND_CONFIRM_COPY.TITLE}
      subtitle={ADMIN_SHOP_REFUND_CONFIRM_COPY.SUBTITLE}
      size="small"
      backdropClick={!submitting}
      closeOnEscape={!submitting}
      className="admin-shop-suite admin-shop-clinic-os"
      actions={(
        <>
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'md' })}
            onClick={onClose}
            disabled={submitting}
          >
            {ADMIN_SHOP_REFUND_CONFIRM_COPY.CANCEL}
          </MGButton>
          <MGButton
            type="button"
            variant="danger"
            className={buildErpMgButtonClassName({
              variant: 'danger',
              size: 'md',
              loading: submitting,
              className: 'admin-shop-suite__btn-brick-solid'
            })}
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            loadingText={`${amountText} ${ADMIN_SHOP_REFUND_CONFIRM_COPY.SUBMIT_SUFFIX}`}
            preventDoubleClick
            data-testid={ADMIN_SHOP_SUITE_TEST_IDS.REFUND_CONFIRM_SUBMIT}
          >
            {`${amountText} ${ADMIN_SHOP_REFUND_CONFIRM_COPY.SUBMIT_SUFFIX}`}
          </MGButton>
        </>
      )}
    >
      <div className="admin-shop-suite__form-stack" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.REFUND_CONFIRM}>
        <AdminShopPairPanel
          amountLabel={ADMIN_SHOP_REFUND_CONFIRM_COPY.PAIR_AMOUNT}
          amountText={amount != null ? `−${amountText}` : '—'}
          amountTone="out"
          sessionsLabel={ADMIN_SHOP_REFUND_CONFIRM_COPY.PAIR_SESSIONS}
          sessionsText={sessionsText}
          sessionsTone="out"
          sessionsCaption={usedCaption}
        />
        {paymentId ? (
          <p className="admin-shop-suite__hint" data-testid="admin-shop-refund-payment-id">
            <SafeText>{`${ADMIN_SHOP_ORDER_PAYMENT_ID_LABEL} ${toDisplayString(paymentId, '')}`}</SafeText>
          </p>
        ) : null}
        <div className="admin-shop-suite__field">
          <label className="admin-shop-suite__label" htmlFor={`${baseId}-reason`}>
            {ADMIN_SHOP_REFUND_CONFIRM_COPY.REASON_LABEL}
            <span className="admin-shop-suite__required" aria-hidden="true">*</span>
          </label>
          <select
            id={`${baseId}-reason`}
            className={`admin-shop-suite__select${touched && !reasonValid ? ' admin-shop-suite__input--error' : ''}`}
            value={reason}
            required
            aria-required="true"
            aria-invalid={touched && !reasonValid ? true : undefined}
            disabled={submitting}
            data-testid={ADMIN_SHOP_SUITE_TEST_IDS.REFUND_CONFIRM_REASON}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">{ADMIN_SHOP_REFUND_CONFIRM_COPY.REASON_PLACEHOLDER}</option>
            {ADMIN_SHOP_REFUND_REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {hasUsed ? (
          <label className="admin-shop-suite__check">
            <input
              type="checkbox"
              checked={usedChecked}
              disabled={submitting}
              data-testid={ADMIN_SHOP_SUITE_TEST_IDS.REFUND_CONFIRM_USED_CHECK}
              onChange={(e) => setUsedChecked(e.target.checked)}
            />
            <SafeText>
              {formatAdminShopCopy(ADMIN_SHOP_REFUND_CONFIRM_COPY.USED_CHECK, { usedCount })}
            </SafeText>
          </label>
        ) : null}
        <p className="admin-shop-suite__hint">
          <SafeText>{ADMIN_SHOP_REFUND_PG_HINT}</SafeText>
        </p>
      </div>
    </UnifiedModal>
  );
}

AdminShopRefundConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  amount: PropTypes.number,
  sessions: PropTypes.number,
  usedCount: PropTypes.number,
  paymentId: PropTypes.string
};

AdminShopRefundConfirmModal.defaultProps = {
  submitting: false,
  amount: null,
  sessions: null,
  usedCount: null,
  paymentId: ''
};

export default AdminShopRefundConfirmModal;
