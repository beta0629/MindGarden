import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import BadgeSelect from '../../common/BadgeSelect';
import SafeText from '../../common/SafeText';
import StatusBadge from '../../common/StatusBadge';
import UnifiedModal from '../../common/modals/UnifiedModal';
import ActionBar from '../../common/ActionBar';
import ActionBarButton from '../../common/ActionBarButton';
import { MAPPING_PAYMENT_METHOD_LABELS } from '../../../constants/billing';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { useConfirm } from '../../../hooks/useConfirm';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../../utils/safeDisplay';
import './SessionExtensionModal.css';

const DEFAULT_PAYMENT_METHOD = 'BANK_TRANSFER';
const CASH_PAYMENT_METHOD = 'CASH';
const PAYMENT_METHOD_OPTIONS = Object.entries(MAPPING_PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label })
);
const CONFIRM_SUCCESS_MESSAGE = '회기 추가 입금이 확인되어 회기가 합산되었습니다.';
const CONFIRM_ERROR_MESSAGE = '회기 추가 입금 확인에 실패했습니다.';

const createPaymentReference = () => `SESSION_EXTENSION_${Date.now()}`;
const formatRequestDate = (value) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const SessionExtensionPaymentConfirmModal = ({
  isOpen,
  request = null,
  onClose,
  onConfirmed,
  onCancelRequest,
  isCancelling = false
}) => {
  const [confirm, ConfirmModal] = useConfirm();
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_PAYMENT_METHOD);
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setPaymentMethod(DEFAULT_PAYMENT_METHOD);
    setPaymentReference(createPaymentReference());
    setIsSubmitting(false);
    submittingRef.current = false;
  }, [isOpen, request?.sourceId]);

  const handleClose = () => {
    if (!isSubmitting && !isCancelling) {
      onClose();
    }
  };

  const handleConfirm = async() => {
    if (!request?.sourceId || submittingRef.current || isSubmitting || isCancelling) {
      return;
    }
    if (paymentMethod !== CASH_PAYMENT_METHOD && !paymentReference.trim()) {
      notificationManager.error('결제 참조번호를 입력해주세요.');
      return;
    }

    submittingRef.current = true;
    const additionalSessions = toSafeNumber(request.additionalSessions, 0);
    const approved = await confirm({
      message: `입금을 확인하시겠습니까? 총 회기 수가 즉시 +${additionalSessions}회 증가합니다.`,
      variant: 'warning'
    });
    if (!approved) {
      submittingRef.current = false;
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
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !request) {
    return null;
  }

  const amount = toSafeNumber(request.amount, 0);
  const additionalSessions = toSafeNumber(request.additionalSessions, 0);

  const createdAt = formatRequestDate(request.createdAt);

  return (
    <>
      <UnifiedModal
        isOpen={isOpen}
        onClose={handleClose}
        title="회기 추가 대기 중"
        subtitle={`${toDisplayString(request.clientName, '내담자')} - ${toDisplayString(
          request.consultantName,
          '상담사'
        )}`}
        size="medium"
        className="mg-v2-ad-b0kla mg-extension-modal"
        backdropClick={!isSubmitting}
        showCloseButton
        loading={isSubmitting}
        actions={(
          <ActionBar align="end" gap="md">
            <ActionBarButton
              variant="danger"
              onClick={() => onCancelRequest(request)}
              loading={isCancelling}
              disabled={isSubmitting || isCancelling}
            >
              요청 취소
            </ActionBarButton>
            <ActionBarButton
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isCancelling}
            >
              닫기
            </ActionBarButton>
            <ActionBarButton
              variant="primary"
              onClick={handleConfirm}
              loading={isSubmitting}
              disabled={isSubmitting || isCancelling}
            >
              입금 확인
            </ActionBarButton>
          </ActionBar>
        )}
      >
        <section className="mg-extension mg-extension--pending" aria-label="회기 추가 요청 요약">
          <header className="mg-extension__pending-header">
            <StatusBadge status="PENDING" variant="warning">입금 대기</StatusBadge>
            <SafeText tag="span" className="mg-extension__pending-package">
              {toDisplayString(request.packageName, '동일 패키지 승계')}
            </SafeText>
          </header>

          <dl className="mg-extension__pending-summary">
            <div className="mg-extension__pending-row">
              <dt>추가 요청 회기</dt>
              <dd>{`+${additionalSessions}회`}</dd>
            </div>
            <div className="mg-extension__pending-row">
              <dt>입금 대기 금액</dt>
              <dd>{`${amount.toLocaleString()}원`}</dd>
            </div>
            <div className="mg-extension__pending-row">
              <dt>요청 일시</dt>
              <dd>{createdAt}</dd>
            </div>
          </dl>

          <div className="mg-extension__field">
            <span id="mg-extension-payment-method-label" className="mg-extension__label">
              결제 수단
            </span>
            <BadgeSelect
              value={paymentMethod}
              onChange={setPaymentMethod}
              options={PAYMENT_METHOD_OPTIONS}
              disabled={isSubmitting}
              aria-label="결제 수단"
            />
          </div>
          {paymentMethod !== CASH_PAYMENT_METHOD ? (
            <label className="mg-extension__field" htmlFor="mg-extension-payment-reference">
              <span className="mg-extension__label">참조 번호</span>
              <input
                id="mg-extension-payment-reference"
                type="text"
                className="mg-v2-input"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
          ) : null}

          <p className="mg-extension__pending-notice">
            입금이 확인되면 즉시 회기가 추가되며, 취소 시 요청이 삭제됩니다.
          </p>
        </section>
      </UnifiedModal>
      <ConfirmModal />
    </>
  );
};

SessionExtensionPaymentConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  request: PropTypes.shape({
    sourceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    clientName: PropTypes.string,
    consultantName: PropTypes.string,
    packageName: PropTypes.string,
    createdAt: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    additionalSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }),
  onClose: PropTypes.func.isRequired,
  onConfirmed: PropTypes.func.isRequired,
  onCancelRequest: PropTypes.func.isRequired,
  isCancelling: PropTypes.bool
};

export default SessionExtensionPaymentConfirmModal;
