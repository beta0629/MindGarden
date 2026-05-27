import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import notificationManager from '../../../utils/notification';
import StandardizedApi from '../../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import '../MappingCreationModal.css';
import './CheckoutSameDayModal.css';

/**
 * CheckoutSameDayModal — 옵션 B (예약 우선 매칭) 당일 카드 결제 단일 모달.
 *
 * 합의서: `docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md`.
 * PENDING_PAYMENT 매핑 1건에 대해 결제 정보를 입력받아 백엔드의
 * `POST /api/v1/admin/mappings/{id}/checkout-same-day`로 전송한다.
 * 백엔드는 confirmPayment + confirmDeposit + approveMapping을 단일 트랜잭션으로 연속 호출한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
const PAYMENT_METHOD_OPTIONS = ['CREDIT_CARD', 'DEBIT_CARD', 'OTHER'];

const CheckoutSameDayModal = ({ isOpen, onClose, mapping = null, onCheckoutCompleted }) => {
  const { t } = useTranslation(['admin']);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [sameDaySessionScheduleId, setSameDaySessionScheduleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && mapping) {
      setPaymentMethod('CREDIT_CARD');
      setPaymentReference(generateReference());
      setPaymentAmount(mapping.packagePrice != null
        ? String(mapping.packagePrice)
        : (mapping.paymentAmount != null ? String(mapping.paymentAmount) : ''));
      setSameDaySessionScheduleId('');
      setIsLoading(false);
    }
  }, [isOpen, mapping]);

  const generateReference = () => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    return `CARD_${stamp}`;
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose?.();
  };

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!mapping?.id) {
      notificationManager.error(t('admin:mapping.checkout.sameDay.error.noMapping'));
      return;
    }
    if (!paymentMethod) {
      notificationManager.error(t('admin:mapping.checkout.sameDay.error.missingMethod'));
      return;
    }
    if (!paymentReference.trim()) {
      notificationManager.error(t('admin:mapping.checkout.sameDay.error.missingReference'));
      return;
    }
    const amountNumber = Number(paymentAmount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      notificationManager.error(t('admin:mapping.checkout.sameDay.error.invalidAmount'));
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        paymentMethod,
        paymentReference: paymentReference.trim(),
        paymentAmount: amountNumber,
        sameDaySessionScheduleId: sameDaySessionScheduleId
          ? Number(sameDaySessionScheduleId)
          : null
      };
      const response = await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.MAPPINGS.CHECKOUT_SAME_DAY(mapping.id),
        payload
      );
      notificationManager.success(t('admin:mapping.checkout.sameDay.success'));
      onCheckoutCompleted?.(response?.data ?? response);
      handleClose();
    } catch (error) {
      const message = error?.response?.data?.message
        || error?.message
        || t('admin:mapping.checkout.sameDay.error.generic');
      notificationManager.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin:mapping.checkout.sameDay.title')}
      subtitle={mapping?.packageName || ''}
      size="medium"
      className="mg-v2-ad-b0kla mg-v2-checkout-same-day-modal"
      backdropClick={!isLoading}
      showCloseButton
      loading={isLoading}
      actions={(
        <>
          <MGButton
            type="button"
            variant="secondary"
            size="medium"
            className={buildErpMgButtonClassName({
              variant: 'secondary',
              size: 'md',
              loading: isLoading
            })}
            onClick={handleClose}
            disabled={isLoading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            {t('admin:mapping.checkout.sameDay.cancel')}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            size="medium"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: isLoading
            })}
            onClick={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            {t('admin:mapping.checkout.sameDay.submit')}
          </MGButton>
        </>
      )}
    >
      <div className="mg-v2-checkout-same-day-modal__body">
        <fieldset
          className="mg-v2-checkout-same-day-modal__field-group"
          aria-labelledby="checkout-same-day-method-legend"
        >
          <legend
            id="checkout-same-day-method-legend"
            className="mg-v2-checkout-same-day-modal__legend"
          >
            {t('admin:mapping.checkout.sameDay.paymentMethod.label')}
          </legend>
          {PAYMENT_METHOD_OPTIONS.map((value) => (
            <label key={value} className="mg-v2-checkout-same-day-modal__radio-option">
              <input
                type="radio"
                name="checkout-same-day-method"
                value={value}
                checked={paymentMethod === value}
                onChange={() => setPaymentMethod(value)}
                disabled={isLoading}
              />
              <span>{t(`admin:mapping.checkout.sameDay.paymentMethod.${methodKey(value)}`)}</span>
            </label>
          ))}
        </fieldset>

        <div className="mg-v2-checkout-same-day-modal__field-group">
          <label htmlFor="checkout-same-day-reference">
            {t('admin:mapping.checkout.sameDay.paymentReference.label')}
          </label>
          <input
            id="checkout-same-day-reference"
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            disabled={isLoading}
            className="mg-v2-checkout-same-day-modal__input"
            placeholder={t('admin:mapping.checkout.sameDay.paymentReference.placeholder')}
          />
        </div>

        <div className="mg-v2-checkout-same-day-modal__field-group">
          <label htmlFor="checkout-same-day-amount">
            {t('admin:mapping.checkout.sameDay.paymentAmount.label')}
          </label>
          <input
            id="checkout-same-day-amount"
            type="number"
            min="1"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            disabled={isLoading}
            className="mg-v2-checkout-same-day-modal__input"
          />
        </div>

        <div className="mg-v2-checkout-same-day-modal__field-group">
          <label htmlFor="checkout-same-day-schedule">
            {t('admin:mapping.checkout.sameDay.sameDaySession.label')}
          </label>
          <input
            id="checkout-same-day-schedule"
            type="number"
            min="1"
            value={sameDaySessionScheduleId}
            onChange={(e) => setSameDaySessionScheduleId(e.target.value)}
            disabled={isLoading}
            placeholder={t('admin:mapping.checkout.sameDay.sameDaySession.placeholder')}
            className="mg-v2-checkout-same-day-modal__input"
          />
          <small className="mg-v2-checkout-same-day-modal__hint">
            {t('admin:mapping.checkout.sameDay.sameDaySession.hint')}
          </small>
        </div>
      </div>
    </UnifiedModal>
  );
};

const methodKey = (value) => {
  switch (value) {
    case 'CREDIT_CARD':
      return 'creditCard';
    case 'DEBIT_CARD':
      return 'debitCard';
    case 'OTHER':
    default:
      return 'other';
  }
};

CheckoutSameDayModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mapping: PropTypes.shape({
    id: PropTypes.number,
    packageName: PropTypes.string,
    packagePrice: PropTypes.number,
    paymentAmount: PropTypes.number
  }),
  onCheckoutCompleted: PropTypes.func
};

export default CheckoutSameDayModal;
