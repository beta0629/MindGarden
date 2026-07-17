import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import BadgeSelect from '../../common/BadgeSelect';
import SafeText from '../../common/SafeText';
import UnifiedModal from '../../common/modals/UnifiedModal';
import ActionBar from '../../common/ActionBar';
import ActionBarButton from '../../common/ActionBarButton';
import { MAPPING_PAYMENT_METHOD_LABELS } from '../../../constants/billing';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../../utils/safeDisplay';

const DEFAULT_PAYMENT_METHOD = 'BANK_TRANSFER';
const CASH_PAYMENT_METHOD = 'CASH';
const PAYMENT_METHOD_OPTIONS = Object.entries(MAPPING_PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label })
);
const CONFIRM_SUCCESS_MESSAGE = '회기 추가 입금이 확인되어 회기가 합산되었습니다.';
const CONFIRM_ERROR_MESSAGE = '회기 추가 입금 확인에 실패했습니다.';

const createPaymentReference = () => `SESSION_EXTENSION_${Date.now()}`;

const SessionExtensionPaymentConfirmModal = ({
  isOpen,
  request = null,
  onClose,
  onConfirmed
}) => {
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_PAYMENT_METHOD);
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setPaymentMethod(DEFAULT_PAYMENT_METHOD);
    setPaymentReference(createPaymentReference());
    setIsSubmitting(false);
  }, [isOpen, request?.sourceId]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleConfirm = async() => {
    if (!request?.sourceId || isSubmitting) {
      return;
    }
    if (paymentMethod !== CASH_PAYMENT_METHOD && !paymentReference.trim()) {
      notificationManager.error('결제 참조번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.SESSION_EXTENSIONS.CONFIRM_PAYMENT(request.sourceId),
        {
          paymentMethod,
          paymentReference: paymentMethod === CASH_PAYMENT_METHOD
            ? null
            : paymentReference.trim()
        }
      );
      if (result?.success === false) {
        throw new Error(result.message || CONFIRM_ERROR_MESSAGE);
      }
      await onConfirmed(request);
      notificationManager.success(CONFIRM_SUCCESS_MESSAGE);
      onClose();
    } catch (error) {
      console.error('회기 추가 입금 확인 실패:', error);
      notificationManager.error(toErrorMessage(error, CONFIRM_ERROR_MESSAGE));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !request) {
    return null;
  }

  const amount = toSafeNumber(request.amount, 0);
  const additionalSessions = toSafeNumber(request.additionalSessions, 0);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="회기 추가 입금 확인"
      subtitle="확인 즉시 요청이 완료되고 매핑 회기가 합산됩니다."
      size="medium"
      className="mg-v2-ad-b0kla"
      backdropClick={!isSubmitting}
      showCloseButton
      loading={isSubmitting}
      actions={
        <ActionBar align="end" gap="md">
          <ActionBarButton variant="outline" onClick={handleClose} disabled={isSubmitting}>
            취소
          </ActionBarButton>
          <ActionBarButton
            variant="primary"
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            입금 확인 및 회기 합산
          </ActionBarButton>
        </ActionBar>
      }
    >
      <section className="mg-v2-form-section" aria-label="회기 추가 요청 요약">
        <div className="mg-v2-form-grid">
          <div className="mg-v2-form-group">
            <span className="mg-v2-label">내담자</span>
            <SafeText className="mg-v2-text-primary">
              {toDisplayString(request.clientName, '—')}
            </SafeText>
          </div>
          <div className="mg-v2-form-group">
            <span className="mg-v2-label">상담사</span>
            <SafeText className="mg-v2-text-primary">
              {toDisplayString(request.consultantName, '—')}
            </SafeText>
          </div>
          <div className="mg-v2-form-group">
            <span className="mg-v2-label">추가 회기</span>
            <strong className="mg-v2-text-primary">{`+${additionalSessions}회기`}</strong>
          </div>
          <div className="mg-v2-form-group">
            <span className="mg-v2-label">입금 금액</span>
            <strong className="mg-v2-text-primary">{`${amount.toLocaleString()}원`}</strong>
          </div>
        </div>
        <div className="mg-v2-form-group">
          <label className="mg-v2-label" htmlFor="session-extension-payment-method">
            결제 방법
          </label>
          <BadgeSelect
            id="session-extension-payment-method"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={PAYMENT_METHOD_OPTIONS}
            disabled={isSubmitting}
          />
        </div>
        {paymentMethod !== CASH_PAYMENT_METHOD ? (
          <div className="mg-v2-form-group">
            <label className="mg-v2-label" htmlFor="session-extension-payment-reference">
              결제 참조번호
            </label>
            <input
              id="session-extension-payment-reference"
              type="text"
              className="mg-v2-input"
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              disabled={isSubmitting}
            />
          </div>
        ) : null}
      </section>
    </UnifiedModal>
  );
};

SessionExtensionPaymentConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  request: PropTypes.shape({
    sourceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    clientName: PropTypes.string,
    consultantName: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    additionalSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }),
  onClose: PropTypes.func.isRequired,
  onConfirmed: PropTypes.func.isRequired
};

export default SessionExtensionPaymentConfirmModal;
