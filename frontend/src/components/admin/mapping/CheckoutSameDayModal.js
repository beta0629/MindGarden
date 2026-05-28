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

// 옵션 B v2.0 합의서 §4·§6 Q11 (2026-05-28): 백엔드 멱등성 가드 응답 식별자.
//   AdminServiceImpl.checkoutSameDayCard 가 매칭 status 또는 X-Request-Id 재사용 감지 시 반환.
const IDEMPOTENCY_ERROR_CODE = 'MAPPING_ALREADY_PROCESSED';
const HTTP_STATUS_CONFLICT = 409;

/**
 * RFC4122 v4 형식의 UUID 를 생성한다.
 * 백엔드는 헤더 누락 시 자동 생성하지만, 클라이언트에서 동일 요청을 재시도하려면 동일 ID 가 필요하다.
 * 본 구현은 외부 의존성 없이 sufficiently-random 한 ID 를 생성한다.
 *
 * @returns {string} UUID
 */
const generateRequestId = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback (구형 브라우저). collision risk 는 멱등성 5분 윈도우 안에서 무시할 수준.
  const rand = () => Math.random().toString(16).slice(2, 10);
  return `${rand()}-${rand().slice(0, 4)}-${rand().slice(0, 4)}-${rand().slice(0, 4)}-${rand()}${rand().slice(0, 4)}`;
};

const CheckoutSameDayModal = ({ isOpen, onClose, mapping = null, onCheckoutCompleted }) => {
  const { t } = useTranslation(['admin']);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [sameDaySessionScheduleId, setSameDaySessionScheduleId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && mapping) {
      setPaymentMethod('CREDIT_CARD');
      setPaymentReference(generateReference());
      setPaymentAmount(mapping.packagePrice != null
        ? String(mapping.packagePrice)
        : (mapping.paymentAmount != null ? String(mapping.paymentAmount) : ''));
      setSameDaySessionScheduleId('');
      // 모달이 열릴 때마다 신규 X-Request-Id 1건 생성 — 사용자 의도적 재시도(닫고 재오픈)는 신규 키.
      // 한 번 열린 모달 내 동일 결제 요청 재시도는 동일 키 → 백엔드 멱등성 가드 발동.
      setRequestId(generateRequestId());
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
      // 옵션 B v2.0 합의서 §4·§6 Q11 (2026-05-28): X-Request-Id 헤더로 백엔드 멱등성 가드와 통합.
      //   동일 모달 인스턴스 내 재시도(네트워크 끊김 등)는 동일 requestId → 백엔드에서 fast-fail 차단.
      const response = await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.MAPPINGS.CHECKOUT_SAME_DAY(mapping.id),
        payload,
        { headers: { 'X-Request-Id': requestId } }
      );
      notificationManager.success(t('admin:mapping.checkout.sameDay.success'));
      onCheckoutCompleted?.(response?.data ?? response);
      handleClose();
    } catch (error) {
      // 옵션 B v2.0 합의서 §6 Q6/Q11 멱등성 가드 응답 처리 (HTTP 409 + MAPPING_ALREADY_PROCESSED).
      //   사용자가 새 매칭 카드로 결과를 확인하도록 친절한 안내 토스트로 대체한다.
      const status = error?.response?.status;
      const code = error?.response?.data?.code || error?.response?.data?.errorCode;
      if (status === HTTP_STATUS_CONFLICT || code === IDEMPOTENCY_ERROR_CODE) {
        notificationManager.info(
          t(
            'admin:mapping.checkout.sameDay.alreadyProcessed.info',
            '이미 처리 중입니다. 새 매칭 카드로 확인하세요.'
          )
        );
        // 멱등성 가드 발동 시 모달을 닫아 사용자가 사이드바 카드(상태 갱신본)로 이동하도록 유도한다.
        onCheckoutCompleted?.(error?.response?.data ?? null);
        handleClose();
        return;
      }
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

  // P0 핫픽스 2026-05-28: 매핑 정보 누락 시 결제 폼 대신 alert 박스를 표시한다.
  // 신규 매칭 직후 또는 PENDING_PAYMENT 알림 카드에서 누락된 매핑이 전달된 경우 NPE/React #130 회피.
  if (!mapping?.id || !mapping?.consultantId || !mapping?.packageName) {
    return (
      <UnifiedModal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('admin:mapping.checkout.sameDay.title')}
        size="small"
        className="mg-v2-ad-b0kla mg-v2-checkout-same-day-modal mg-v2-checkout-same-day-modal--invalid"
        showCloseButton
        backdropClick
      >
        <div role="alert" className="mg-v2-checkout-same-day-modal__invalid-alert">
          {t(
            'admin:mapping.checkout.sameDay.error.invalidMapping',
            '매칭 정보가 누락되었습니다 (상담사 또는 패키지). 신규 매칭을 다시 생성한 후 진행해 주세요.'
          )}
        </div>
      </UnifiedModal>
    );
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
    consultantId: PropTypes.number,
    consultantName: PropTypes.string,
    clientId: PropTypes.number,
    clientName: PropTypes.string,
    packageName: PropTypes.string,
    packagePrice: PropTypes.number,
    paymentAmount: PropTypes.number,
    totalSessions: PropTypes.number
  }),
  onCheckoutCompleted: PropTypes.func
};

export default CheckoutSameDayModal;
