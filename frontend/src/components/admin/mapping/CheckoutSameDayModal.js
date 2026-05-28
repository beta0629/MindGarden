import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
 * 후속 UX 개선: `feature/checkout-same-day-modal-ux-improvement-2026-05-28` (2026-05-28).
 *
 * UX 개선 5종:
 *  1. 헤더 subtitle 에 매칭 핵심 정보(상담사 → 내담자 · 패키지명 · 회기수) 표시.
 *  2. 당일 가예약 일정: number input → 드롭다운 (`<select>`).
 *     모달 열림 시 `GET /api/v1/admin/mappings/{id}/pending-schedules` 호출.
 *  3. 결제 승인번호: 자동 생성 + helper text + 자동 재생성 버튼 + focus 시 select-all.
 *  4. 결제 금액: 정가/차액 표시 + 천 단위 콤마 + 음수/0 가드 강화.
 *  5. 결제 완료 후 success 알림: 회기 차감/남은 회기 + 자동 확정 일정 정보.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
const PAYMENT_METHOD_OPTIONS = ['CREDIT_CARD', 'DEBIT_CARD', 'OTHER'];

const NUMBER_FORMAT_KO = new Intl.NumberFormat('ko-KR');

const formatCurrency = (value) => {
  if (value == null || value === '' || Number.isNaN(Number(value))) {
    return '';
  }
  return NUMBER_FORMAT_KO.format(Number(value));
};

const sanitizeAmountInput = (raw) => {
  if (raw == null) return '';
  // 숫자·기호 외 모든 문자 제거 (콤마·공백 입력 허용 → 내부 상태는 숫자 문자열).
  return String(raw).replace(/[^0-9]/g, '');
};

const formatScheduleOptionLabel = (item, t) => {
  if (!item || !item.scheduleDate) return '';
  const date = new Date(`${item.scheduleDate}T00:00:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = dayLabels[date.getDay()];
  const start = item.startTime ? String(item.startTime).slice(0, 5) : '';
  const end = item.endTime ? String(item.endTime).slice(0, 5) : '';
  const range = start && end ? `${start}~${end}` : (start || end);
  const statusBadge = item.status === 'TENTATIVE_PENDING_PAYMENT'
    ? ` · ${t('admin:mapping.checkout.sameDay.sameDaySession.tentativeBadge', '가예약')}`
    : '';
  return `${month}/${day} (${weekday}) ${range}${statusBadge}`;
};

const buildSubtitle = (mapping, t) => {
  if (!mapping) return '';
  const sessions = mapping.totalSessions != null ? Number(mapping.totalSessions) : null;
  const hasNames = !!(mapping.consultantName && mapping.clientName);
  const hasPackage = !!mapping.packageName;
  if (hasNames && hasPackage && sessions != null) {
    return t('admin:mapping.checkout.sameDay.subtitle.format', {
      consultant: mapping.consultantName,
      client: mapping.clientName,
      package: mapping.packageName,
      sessions
    });
  }
  if (hasNames && hasPackage) {
    return t('admin:mapping.checkout.sameDay.subtitle.noSessions', {
      consultant: mapping.consultantName,
      client: mapping.clientName,
      package: mapping.packageName
    });
  }
  if (hasPackage && sessions != null) {
    return t('admin:mapping.checkout.sameDay.subtitle.noConsultantClient', {
      package: mapping.packageName,
      sessions
    });
  }
  return mapping.packageName || '';
};

const CheckoutSameDayModal = ({ isOpen, onClose, mapping = null, onCheckoutCompleted }) => {
  const { t } = useTranslation(['admin']);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [sameDaySessionScheduleId, setSameDaySessionScheduleId] = useState('');
  const [pendingSchedules, setPendingSchedules] = useState([]);
  const [scheduleLoadError, setScheduleLoadError] = useState(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successDetail, setSuccessDetail] = useState(null);

  const referenceInputRef = useRef(null);

  const generateReference = useCallback(() => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    return `CARD_${stamp}`;
  }, []);

  // 모달 열림 시 초기화 + 가예약 일정 비동기 로드.
  useEffect(() => {
    if (!isOpen || !mapping) return;
    setPaymentMethod('CREDIT_CARD');
    setPaymentReference(generateReference());
    setPaymentAmount(mapping.packagePrice != null
      ? String(mapping.packagePrice)
      : (mapping.paymentAmount != null ? String(mapping.paymentAmount) : ''));
    setSameDaySessionScheduleId('');
    setIsLoading(false);
    setSuccessDetail(null);
    setPendingSchedules([]);
    setScheduleLoadError(null);

    if (!mapping.id) return;
    let cancelled = false;
    setIsLoadingSchedules(true);
    StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_SCHEDULES(mapping.id))
      .then((response) => {
        if (cancelled) return;
        const data = response?.data ?? response ?? {};
        const list = Array.isArray(data?.schedules) ? data.schedules : [];
        setPendingSchedules(list);
        setScheduleLoadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setPendingSchedules([]);
        setScheduleLoadError(error?.message
          || t('admin:mapping.checkout.sameDay.sameDaySession.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSchedules(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, mapping, generateReference, t]);

  const handleClose = () => {
    if (isLoading) return;
    onClose?.();
  };

  const handleRegenerateReference = () => {
    if (isLoading) return;
    setPaymentReference(generateReference());
    if (referenceInputRef.current) {
      referenceInputRef.current.focus();
      referenceInputRef.current.select();
    }
  };

  const handleReferenceFocus = (event) => {
    // 자동 생성된 reference 를 사용자가 쉽게 덮어쓸 수 있도록 select-all.
    if (event?.target?.select) {
      event.target.select();
    }
  };

  const handleAmountChange = (event) => {
    const sanitized = sanitizeAmountInput(event.target.value);
    setPaymentAmount(sanitized);
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
    setSuccessDetail(null);
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
      const responseData = response?.data ?? response ?? {};

      // 회기 차감 결과 도출 — 응답의 totalSessions/remainingSessions 우선, 없으면 mapping props 추정.
      const responseTotal = responseData.totalSessions != null
        ? Number(responseData.totalSessions)
        : (mapping.totalSessions != null ? Number(mapping.totalSessions) : null);
      const responseRemaining = responseData.remainingSessions != null
        ? Number(responseData.remainingSessions)
        : null;
      const consumed = (responseTotal != null && responseRemaining != null)
        ? Math.max(0, responseTotal - responseRemaining)
        : null;

      // 자동 확정된 첫 일정 — 사용자가 드롭다운에서 선택했다면 해당 항목 라벨, 아니면 첫 일정 추정.
      let firstScheduleLabel = null;
      const selectedScheduleId = sameDaySessionScheduleId ? Number(sameDaySessionScheduleId) : null;
      const selectedSchedule = selectedScheduleId
        ? pendingSchedules.find((s) => Number(s.id) === selectedScheduleId)
        : pendingSchedules[0];
      if (selectedSchedule) {
        const start = selectedSchedule.startTime
          ? String(selectedSchedule.startTime).slice(0, 5)
          : '';
        const date = selectedSchedule.scheduleDate
          ? String(selectedSchedule.scheduleDate)
          : '';
        if (date) {
          firstScheduleLabel = t('admin:mapping.checkout.sameDay.successDetail.firstSchedule', {
            date,
            time: start
          });
        }
      }

      const detailMessages = [];
      if (consumed != null && consumed > 0 && responseRemaining != null) {
        detailMessages.push(t('admin:mapping.checkout.sameDay.successDetail.session', {
          count: consumed,
          remaining: responseRemaining
        }));
      }
      if (firstScheduleLabel) {
        detailMessages.push(firstScheduleLabel);
      }

      setSuccessDetail({
        title: t('admin:mapping.checkout.sameDay.success'),
        details: detailMessages
      });
      notificationManager.success(t('admin:mapping.checkout.sameDay.success'));

      // 모달 내 success 알림을 잠시 노출(약 1.6초) 후 닫기.
      // 자동 닫기 전 사용자에게 결과 메타 데이터를 전달한다.
      setTimeout(() => {
        onCheckoutCompleted?.(responseData);
        handleClose();
      }, 1600);
    } catch (error) {
      const message = error?.response?.data?.message
        || error?.message
        || t('admin:mapping.checkout.sameDay.error.generic');
      notificationManager.error(message);
      setIsLoading(false);
    }
  };

  // 정가 vs 입력 금액 차액 계산.
  const priceDiff = useMemo(() => {
    if (mapping?.packagePrice == null) return null;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const list = Number(mapping.packagePrice);
    if (!Number.isFinite(list) || list <= 0) return null;
    return amount - list;
  }, [mapping, paymentAmount]);

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

  const subtitle = buildSubtitle(mapping, t);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin:mapping.checkout.sameDay.title')}
      subtitle={subtitle}
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
        {successDetail && (
          <div
            role="status"
            data-testid="checkout-success-detail"
            className="mg-v2-checkout-same-day-modal__success"
          >
            <div className="mg-v2-checkout-same-day-modal__success-title">
              {successDetail.title}
            </div>
            {successDetail.details.length > 0 && (
              <ul className="mg-v2-checkout-same-day-modal__success-list">
                {successDetail.details.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}

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
          <div className="mg-v2-checkout-same-day-modal__label-row">
            <label htmlFor="checkout-same-day-reference">
              {t('admin:mapping.checkout.sameDay.paymentReference.label')}
            </label>
            <button
              type="button"
              className="mg-v2-checkout-same-day-modal__inline-action"
              onClick={handleRegenerateReference}
              disabled={isLoading}
              data-testid="reference-regenerate-button"
            >
              {t('admin:mapping.checkout.sameDay.paymentReference.regenerate')}
            </button>
          </div>
          <input
            id="checkout-same-day-reference"
            ref={referenceInputRef}
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            onFocus={handleReferenceFocus}
            disabled={isLoading}
            className="mg-v2-checkout-same-day-modal__input"
            placeholder={t('admin:mapping.checkout.sameDay.paymentReference.placeholder')}
            autoComplete="off"
          />
          <small className="mg-v2-checkout-same-day-modal__hint">
            {t('admin:mapping.checkout.sameDay.paymentReference.helper')}
          </small>
        </div>

        <div className="mg-v2-checkout-same-day-modal__field-group">
          <label htmlFor="checkout-same-day-amount">
            {t('admin:mapping.checkout.sameDay.paymentAmount.label')}
          </label>
          <input
            id="checkout-same-day-amount"
            type="text"
            inputMode="numeric"
            value={paymentAmount === '' ? '' : formatCurrency(paymentAmount)}
            onChange={handleAmountChange}
            disabled={isLoading}
            className="mg-v2-checkout-same-day-modal__input"
            data-testid="checkout-amount-input"
          />
          {mapping?.packagePrice != null && (
            <small
              className="mg-v2-checkout-same-day-modal__hint"
              data-testid="checkout-list-price-hint"
            >
              {t('admin:mapping.checkout.sameDay.paymentAmount.listPrice', {
                price: formatCurrency(mapping.packagePrice)
              })}
              {priceDiff != null && priceDiff !== 0 && (
                <span className={priceDiff < 0
                  ? 'mg-v2-checkout-same-day-modal__hint--discount'
                  : 'mg-v2-checkout-same-day-modal__hint--surcharge'}
                >
                  {' · '}
                  {priceDiff < 0
                    ? t('admin:mapping.checkout.sameDay.paymentAmount.discount', {
                      amount: formatCurrency(Math.abs(priceDiff))
                    })
                    : t('admin:mapping.checkout.sameDay.paymentAmount.surcharge', {
                      amount: formatCurrency(priceDiff)
                    })}
                </span>
              )}
              {priceDiff != null && priceDiff === 0 && (
                <span className="mg-v2-checkout-same-day-modal__hint--match">
                  {' · '}
                  {t('admin:mapping.checkout.sameDay.paymentAmount.match')}
                </span>
              )}
            </small>
          )}
        </div>

        <div className="mg-v2-checkout-same-day-modal__field-group">
          <label htmlFor="checkout-same-day-schedule">
            {t('admin:mapping.checkout.sameDay.sameDaySession.label')}
          </label>
          {isLoadingSchedules ? (
            <div
              className="mg-v2-checkout-same-day-modal__schedule-loading"
              data-testid="checkout-schedules-loading"
            >
              {t('admin:mapping.checkout.sameDay.sameDaySession.loading')}
            </div>
          ) : (
            <select
              id="checkout-same-day-schedule"
              value={sameDaySessionScheduleId}
              onChange={(e) => setSameDaySessionScheduleId(e.target.value)}
              disabled={isLoading}
              className="mg-v2-checkout-same-day-modal__input"
              data-testid="checkout-schedule-select"
            >
              <option value="">
                {t('admin:mapping.checkout.sameDay.sameDaySession.optionAuto')}
              </option>
              {pendingSchedules.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {formatScheduleOptionLabel(item, t)}
                </option>
              ))}
            </select>
          )}
          {scheduleLoadError && (
            <small
              className="mg-v2-checkout-same-day-modal__hint mg-v2-checkout-same-day-modal__hint--error"
              data-testid="checkout-schedule-load-error"
            >
              {scheduleLoadError}
            </small>
          )}
          {!isLoadingSchedules && pendingSchedules.length === 0 && !scheduleLoadError && (
            <small className="mg-v2-checkout-same-day-modal__hint">
              {t('admin:mapping.checkout.sameDay.sameDaySession.empty')}
            </small>
          )}
          <small className="mg-v2-checkout-same-day-modal__hint">
            {t('admin:mapping.checkout.sameDay.sameDaySession.auto')}
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
