import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { User, Link2, UserCircle } from 'lucide-react';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import notificationManager from '../../../utils/notification';
import StandardizedApi from '../../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import {
  MIN_PAYMENT_AMOUNT,
  formatPaymentAmountForDisplay,
  isBelowMinPaymentAmount
} from '../../../constants/paymentAmountConstants';
import {
  PAYMENT_MIN_CARD_AMOUNT_I18N_KEY,
  PAYMENT_MIN_CARD_AMOUNT_TITLE_I18N_KEY
} from '../../../utils/minPaymentAmountMessage';
import { useAlert } from '../../../hooks/useAlert';
import { getTenantCodes } from '../../../utils/commonCodeApi';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  filterCheckoutSameDayPaymentMethodCodes,
  mapPaymentMethodCodesToOptions,
  PAYMENT_METHOD_CODE_BANK_TRANSFER,
  PAYMENT_METHOD_CODE_OTHER
} from '../../../utils/paymentMethodSsot';
import '../MappingCreationModal.css';
import './CheckoutSameDayModal.css';

/**
 * CheckoutSameDayModal — PENDING_PAYMENT 원샷 결제 확인 + 매칭 활성화 모달.
 *
 * 모드:
 * - `same-day` (기본): `POST .../checkout-same-day` (옵션 B 당일 카드)
 * - `confirm-activate`: `POST .../confirm-and-activate` (ADVANCE/일반)
 *
 * 백엔드는 confirmPayment + confirmDeposit + approveMapping을 단일 트랜잭션으로 연속 호출한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
const DEFAULT_CHECKOUT_PAYMENT_METHOD = 'CREDIT_CARD';
export const CHECKOUT_MODAL_MODE_SAME_DAY = 'same-day';
export const CHECKOUT_MODAL_MODE_CONFIRM_ACTIVATE = 'confirm-activate';

/** SSOT 로드 실패 시 폴백 옵션 (신용카드 → 체크카드 → 계좌이체 → 기타) */
const FALLBACK_CHECKOUT_PAYMENT_METHOD_OPTIONS = [
  { value: 'CREDIT_CARD', label: '신용카드' },
  { value: 'DEBIT_CARD', label: '체크카드' },
  { value: PAYMENT_METHOD_CODE_BANK_TRANSFER, label: '계좌이체' },
  { value: PAYMENT_METHOD_CODE_OTHER, label: '기타' }
];

// 옵션 B v2.0 합의서 §4·§6 Q11 (2026-05-28): 백엔드 멱등성 가드 응답 식별자.
const IDEMPOTENCY_ERROR_CODE = 'MAPPING_ALREADY_PROCESSED';
const HTTP_STATUS_CONFLICT = 409;

const methodKey = (value) => {
  switch (value) {
    case 'CREDIT_CARD':
      return 'creditCard';
    case 'DEBIT_CARD':
      return 'debitCard';
    case PAYMENT_METHOD_CODE_BANK_TRANSFER:
      return 'bankTransfer';
    case PAYMENT_METHOD_CODE_OTHER:
    default:
      return 'other';
  }
};

/**
 * RFC4122 v4 형식의 UUID 를 생성한다.
 *
 * @returns {string} UUID
 */
const generateRequestId = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  const rand = () => Math.random().toString(16).slice(2, 10);
  return `${rand()}-${rand().slice(0, 4)}-${rand().slice(0, 4)}-${rand().slice(0, 4)}-${rand()}${rand().slice(0, 4)}`;
};

const CheckoutSameDayModal = ({
  isOpen,
  onClose,
  mapping = null,
  onCheckoutCompleted,
  mode = CHECKOUT_MODAL_MODE_SAME_DAY
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const [alert, AlertModal] = useAlert();
  const isConfirmActivate = mode === CHECKOUT_MODAL_MODE_CONFIRM_ACTIVATE;
  const i18nPrefix = isConfirmActivate
    ? 'admin:mapping.checkout.confirmAndActivate'
    : 'admin:mapping.checkout.sameDay';
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_CHECKOUT_PAYMENT_METHOD);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [sameDaySessionScheduleId, setSameDaySessionScheduleId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const codes = await getTenantCodes('PAYMENT_METHOD');
        if (cancelled) {
          return;
        }
        const checkoutCodes = filterCheckoutSameDayPaymentMethodCodes(codes);
        const options = mapPaymentMethodCodesToOptions(checkoutCodes);
        setPaymentMethodOptions(options);
        const defaultValue = options.some((opt) => opt.value === DEFAULT_CHECKOUT_PAYMENT_METHOD)
          ? DEFAULT_CHECKOUT_PAYMENT_METHOD
          : (options[0]?.value || DEFAULT_CHECKOUT_PAYMENT_METHOD);
        setPaymentMethod(defaultValue);
      } catch {
        if (!cancelled) {
          setPaymentMethodOptions(FALLBACK_CHECKOUT_PAYMENT_METHOD_OPTIONS);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && mapping) {
      setPaymentReference(generateReference());
      setPaymentAmount(mapping.packagePrice != null
        ? String(mapping.packagePrice)
        : (mapping.paymentAmount != null ? String(mapping.paymentAmount) : ''));
      setSameDaySessionScheduleId(
        mapping.sameDaySessionScheduleId != null && mapping.sameDaySessionScheduleId !== ''
          ? String(mapping.sameDaySessionScheduleId)
          : ''
      );
      setRequestId(generateRequestId());
      setIsLoading(false);
    }
  }, [isOpen, mapping, mode]);

  const generateReference = () => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    return `${isConfirmActivate ? 'PAY' : 'CARD'}_${stamp}`;
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
      notificationManager.error(t(`${i18nPrefix}.error.noMapping`));
      return;
    }
    if (!paymentMethod) {
      notificationManager.error(t(`${i18nPrefix}.error.missingMethod`));
      return;
    }
    if (!paymentReference.trim()) {
      notificationManager.error(t(`${i18nPrefix}.error.missingReference`));
      return;
    }
    const amountNumber = Number(paymentAmount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      notificationManager.error(t(`${i18nPrefix}.error.invalidAmount`));
      return;
    }
    if (isBelowMinPaymentAmount(amountNumber)) {
      const amountLabel = formatPaymentAmountForDisplay(MIN_PAYMENT_AMOUNT);
      await alert({
        variant: 'warning',
        titleKey: PAYMENT_MIN_CARD_AMOUNT_TITLE_I18N_KEY,
        messageKey: PAYMENT_MIN_CARD_AMOUNT_I18N_KEY,
        interpolation: { amount: amountLabel },
        message: t(`${i18nPrefix}.error.minCardAmount`, {
          amount: amountLabel,
          defaultValue: t(PAYMENT_MIN_CARD_AMOUNT_I18N_KEY, {
            amount: amountLabel,
            ns: 'common'
          })
        })
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        paymentMethod,
        paymentReference: paymentReference.trim(),
        paymentAmount: amountNumber,
        sameDaySessionScheduleId: (!isConfirmActivate && sameDaySessionScheduleId)
          ? Number(sameDaySessionScheduleId)
          : null
      };
      const endpoint = isConfirmActivate
        ? API_ENDPOINTS.ADMIN.MAPPINGS.CONFIRM_AND_ACTIVATE(mapping.id)
        : API_ENDPOINTS.ADMIN.MAPPINGS.CHECKOUT_SAME_DAY(mapping.id);
      const response = await StandardizedApi.post(
        endpoint,
        payload,
        { headers: { 'X-Request-Id': requestId } }
      );
      notificationManager.success(t(`${i18nPrefix}.success`));
      onCheckoutCompleted?.(response?.data ?? response);
      handleClose();
    } catch (error) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code || error?.response?.data?.errorCode;
      if (status === HTTP_STATUS_CONFLICT || code === IDEMPOTENCY_ERROR_CODE) {
        notificationManager.info(
          t(
            `${i18nPrefix}.alreadyProcessed.info`,
            '이미 처리 중입니다. 새 배정 카드로 확인하세요.'
          )
        );
        onCheckoutCompleted?.(error?.response?.data ?? null);
        handleClose();
        return;
      }
      const message = error?.response?.data?.message
        || error?.message
        || t(`${i18nPrefix}.error.generic`);
      notificationManager.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPaymentMethodOption = paymentMethodOptions.find(
    (option) => option.value === paymentMethod
  );
  const selectedPaymentMethodLabel = selectedPaymentMethodOption
    ? t(
      `${i18nPrefix}.paymentMethod.${methodKey(selectedPaymentMethodOption.value)}`,
      selectedPaymentMethodOption.label
    )
    : paymentMethod;

  const summaryAmountText = (mapping?.packagePrice != null || mapping?.paymentAmount != null)
    ? `${Number(mapping.packagePrice || mapping.paymentAmount).toLocaleString()}원`
    : toDisplayString('N/A');

  if (!isOpen) {
    return null;
  }

  // P0 핫픽스 2026-05-28: 매핑 정보 누락 시 결제 폼 대신 alert 박스를 표시한다.
  // 신규 매칭 직후 또는 PENDING_PAYMENT 알림 카드에서 누락된 매핑이 전달된 경우 NPE/React #130 회피.
  if (!mapping?.id || !mapping?.consultantId || !mapping?.packageName) {
    return (
      <>
        <AlertModal />
        <UnifiedModal
        isOpen={isOpen}
        onClose={handleClose}
        title={t(`${i18nPrefix}.title`)}
        size="small"
        className="mg-v2-ad-b0kla mg-v2-checkout-same-day-modal mg-v2-checkout-same-day-modal--invalid"
        showCloseButton
        backdropClick
      >
        <div role="alert" className="mg-v2-checkout-same-day-modal__invalid-alert">
          {t(
            `${i18nPrefix}.error.invalidMapping`,
            '배정 정보가 누락되었습니다 (상담사 또는 패키지). 신규 배정을 다시 생성한 후 진행해 주세요.'
          )}
        </div>
      </UnifiedModal>
      </>
    );
  }

  return (
    <>
      <AlertModal />
      <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t(`${i18nPrefix}.title`)}
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
            {t(`${i18nPrefix}.cancel`)}
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
            {t(`${i18nPrefix}.submit`)}
          </MGButton>
        </>
      )}
    >
      <div className="mg-v2-checkout-same-day-modal__body">
        <div className="mg-v2-mapping-creation-modal-wrapper">
          <div className="mg-v2-ad-b0kla mg-v2-mapping-creation-modal">
            <div
              className="mg-v2-mapping-creation-modal__summary-bar"
              data-testid="checkout-same-day-summary-bar"
            >
              <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--person">
                <User size={16} />
                {' '}
                <SafeText fallback="N/A">
                  {mapping.consultantName ?? mapping.consultant?.name ?? mapping.consultant?.userId}
                </SafeText>
              </span>
              <span className="mg-v2-mapping-creation-modal__summary-divider" aria-hidden="true">
                <Link2 size={16} />
              </span>
              <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--person">
                <UserCircle size={16} />
                {' '}
                <SafeText fallback="N/A">
                  {mapping.clientName ?? mapping.client?.name ?? mapping.client?.userId}
                </SafeText>
              </span>
              <span className="mg-v2-mapping-creation-modal__summary-separator">|</span>
              <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--product">
                <SafeText fallback="N/A">{mapping.packageName}</SafeText>
              </span>
              <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--amount">
                {summaryAmountText}
              </span>
            </div>
            <div
              className="mg-v2-checkout-same-day-modal__summary-method"
              data-testid="checkout-same-day-summary-method"
            >
              <span className="mg-v2-checkout-same-day-modal__summary-method-label">
                {t(`${i18nPrefix}.paymentMethod.label`)}
              </span>
              <SafeText fallback="N/A">{selectedPaymentMethodLabel}</SafeText>
            </div>
          </div>
        </div>

        <fieldset
          className="mg-v2-checkout-same-day-modal__field-group"
          aria-labelledby="checkout-same-day-method-legend"
        >
          <legend
            id="checkout-same-day-method-legend"
            className="mg-v2-checkout-same-day-modal__legend"
          >
            {t(`${i18nPrefix}.paymentMethod.label`)}
          </legend>
          {paymentMethodOptions.map((option) => (
            <label key={option.value} className="mg-v2-checkout-same-day-modal__radio-option">
              <input
                type="radio"
                name="checkout-same-day-method"
                value={option.value}
                checked={paymentMethod === option.value}
                onChange={() => setPaymentMethod(option.value)}
                disabled={isLoading}
              />
              <span>
                {t(`${i18nPrefix}.paymentMethod.${methodKey(option.value)}`, option.label)}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="mg-v2-checkout-same-day-modal__field-group">
          <label htmlFor="checkout-same-day-reference">
            {t(`${i18nPrefix}.paymentReference.label`)}
          </label>
          <input
            id="checkout-same-day-reference"
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            disabled={isLoading}
            className="mg-v2-checkout-same-day-modal__input"
            placeholder={t(`${i18nPrefix}.paymentReference.placeholder`)}
          />
        </div>

        <div className="mg-v2-checkout-same-day-modal__field-group">
          <label htmlFor="checkout-same-day-amount">
            {t(`${i18nPrefix}.paymentAmount.label`)}
          </label>
          <input
            id="checkout-same-day-amount"
            type="number"
            min={MIN_PAYMENT_AMOUNT}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            disabled={isLoading}
            className="mg-v2-checkout-same-day-modal__input"
          />
        </div>

        {!isConfirmActivate && (
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
        )}
      </div>
    </UnifiedModal>
    </>
  );
};

CheckoutSameDayModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mapping: PropTypes.shape({
    id: PropTypes.number,
    consultantId: PropTypes.number,
    consultantName: PropTypes.string,
    clientId: PropTypes.number,
    clientName: PropTypes.string,
    packageName: PropTypes.string,
    packagePrice: PropTypes.number,
    paymentAmount: PropTypes.number,
    totalSessions: PropTypes.number,
    paymentTiming: PropTypes.string,
    sameDaySessionScheduleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  onCheckoutCompleted: PropTypes.func,
  mode: PropTypes.oneOf([CHECKOUT_MODAL_MODE_SAME_DAY, CHECKOUT_MODAL_MODE_CONFIRM_ACTIVATE])
};

export default CheckoutSameDayModal;
