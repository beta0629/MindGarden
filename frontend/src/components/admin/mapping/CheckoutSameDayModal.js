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
  isCardPaymentMethod,
  mapPaymentMethodCodesToOptions,
  normalizePaymentMethodCodeValue,
  PAYMENT_METHOD_CODE_BANK_TRANSFER,
  PAYMENT_METHOD_CODE_OTHER
} from '../../../utils/paymentMethodSsot';
import {
  formatPaymentReferenceTimestamp,
  generatePaymentReferenceNumber
} from '../../../utils/paymentReferenceNumber';
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

const METHOD_I18N_KEY_BY_VALUE = {
  CREDIT_CARD: 'creditCard',
  DEBIT_CARD: 'debitCard',
  [PAYMENT_METHOD_CODE_BANK_TRANSFER]: 'bankTransfer',
  [PAYMENT_METHOD_CODE_OTHER]: 'other'
};

/**
 * 결제 방식 표시 라벨. 공통코드 라벨(SSOT)을 그대로 쓰고, 폴백 옵션처럼 라벨이 없을 때만 i18n 키를 쓴다.
 *
 * @param {Function} t i18n t
 * @param {string} i18nPrefix 모드별 i18n prefix
 * @param {{ value: string, label?: string }} option
 * @returns {string}
 */
const resolvePaymentMethodLabel = (t, i18nPrefix, option) => {
  if (option.label && option.label !== option.value) {
    return option.label;
  }
  const key = METHOD_I18N_KEY_BY_VALUE[option.value];
  return key ? t(`${i18nPrefix}.paymentMethod.${key}`, option.label) : option.value;
};

/**
 * 모달 진입 시 선택할 결제 방식: 배정에 저장된 방식 → 기본(신용카드) → 첫 옵션.
 *
 * @param {Array<{ value: string }>} options
 * @param {string|null|undefined} storedMethod 배정 생성 시 저장된 paymentMethod (canonical 정규화 후)
 * @returns {string}
 */
export const resolveInitialCheckoutPaymentMethod = (options, storedMethod) => {
  const list = Array.isArray(options) ? options : [];
  if (storedMethod && list.some((opt) => opt.value === storedMethod)) {
    return storedMethod;
  }
  if (list.some((opt) => opt.value === DEFAULT_CHECKOUT_PAYMENT_METHOD)) {
    return DEFAULT_CHECKOUT_PAYMENT_METHOD;
  }
  return list[0]?.value || DEFAULT_CHECKOUT_PAYMENT_METHOD;
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
  const [paymentMethodCodes, setPaymentMethodCodes] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [sameDaySessionScheduleId, setSameDaySessionScheduleId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const storedPaymentMethod = mapping?.paymentMethod ?? null;

  const generateReference = (method) => (
    isConfirmActivate
      ? `PAY_${formatPaymentReferenceTimestamp(new Date())}`
      : generatePaymentReferenceNumber(method)
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    const applyOptions = (options, storedMethod) => {
      const initialMethod = resolveInitialCheckoutPaymentMethod(options, storedMethod);
      setPaymentMethodOptions(options);
      setPaymentMethod(initialMethod);
      setPaymentReference(generateReference(initialMethod));
    };
    (async () => {
      try {
        const codes = await getTenantCodes('PAYMENT_METHOD');
        if (cancelled) {
          return;
        }
        setPaymentMethodCodes(Array.isArray(codes) ? codes : null);
        // 당일 결제: 배정 생성 모달과 동일하게 PAYMENT_METHOD 공통코드 전체(활성)를 노출한다.
        const sourceCodes = isConfirmActivate
          ? filterCheckoutSameDayPaymentMethodCodes(codes)
          : codes;
        applyOptions(
          mapPaymentMethodCodesToOptions(sourceCodes),
          normalizePaymentMethodCodeValue(storedPaymentMethod, codes)
        );
      } catch {
        if (!cancelled) {
          setPaymentMethodCodes(null);
          applyOptions(FALLBACK_CHECKOUT_PAYMENT_METHOD_OPTIONS, storedPaymentMethod);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generateReference 는 isConfirmActivate 에만 의존
  }, [isOpen, isConfirmActivate, storedPaymentMethod]);

  useEffect(() => {
    if (isOpen && mapping) {
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

  const isCardPayment = isCardPaymentMethod(paymentMethod, paymentMethodCodes);

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
    if (!isConfirmActivate) {
      setPaymentReference(generateReference(value));
    }
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
    if (isCardPayment && !paymentReference.trim()) {
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
        paymentReference: isCardPayment
          ? paymentReference.trim()
          : generateReference(paymentMethod),
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
    ? resolvePaymentMethodLabel(t, i18nPrefix, selectedPaymentMethodOption)
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
                onChange={() => handlePaymentMethodChange(option.value)}
                disabled={isLoading}
              />
              <span>
                {resolvePaymentMethodLabel(t, i18nPrefix, option)}
              </span>
            </label>
          ))}
        </fieldset>

        {isCardPayment && (
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
        )}

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
    paymentMethod: PropTypes.string,
    sameDaySessionScheduleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  onCheckoutCompleted: PropTypes.func,
  mode: PropTypes.oneOf([CHECKOUT_MODAL_MODE_SAME_DAY, CHECKOUT_MODAL_MODE_CONFIRM_ACTIVATE])
};

export default CheckoutSameDayModal;
