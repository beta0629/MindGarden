import React, { useState, useEffect } from 'react';
import StandardizedApi from '../../utils/standardizedApi';
import { getCommonCodes } from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import BadgeSelect from '../common/BadgeSelect';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { TABLET_LOGIN_CONSTANTS, PAYMENT_CONFIRMATION_MODAL_CONSTANTS } from '../../constants/css-variables';
import {
  BULK_MAPPING_ITEM_STATUS,
  BULK_MAPPING_ITEM_STATUS_LABEL,
  BULK_MAPPING_RESULT_MESSAGES
} from '../../constants/bulkMappingPayment';
import {
  extractBulkMappingResults,
  extractBulkMappingResultsFromError,
  isPendingPaymentMapping,
  resolveMappingPaymentAmount
} from '../../utils/bulkMappingPaymentResult';
import {
  MIN_PAYMENT_AMOUNT,
  MAX_PAYMENT_AMOUNT,
  formatPaymentAmountForDisplay,
  isBelowMinPaymentAmount
} from '../../constants/paymentAmountConstants';
import {
  PAYMENT_MIN_CARD_AMOUNT_I18N_KEY,
  PAYMENT_MIN_CARD_AMOUNT_TITLE_I18N_KEY,
  buildMinCardPaymentAmountMessage
} from '../../utils/minPaymentAmountMessage';
import { useAlert } from '../../hooks/useAlert';
import './PaymentConfirmationModal.css';
import { useTranslation } from 'react-i18next';

// 외부 브랜드 SSOT (Kakao/Naver 브랜드 가이드 공식 색상) — 운영 게이트 허용.
// follow-up: corrected identifier after typo debug (PR #16 P0 후속).
// 기존 핫픽스는 존재하지 않는 `CSS_VARIABLES.SOCIAL.BUTTONS` 체인을 참조했고
// fallback hex 만 실제 적용되었음. 디버거(`p0-mapping-mgmt-buttons-debug`) 진단
// 결과 실제 SSOT 는 `TABLET_LOGIN_CONSTANTS.SOCIAL.BUTTONS` 임을 확정, 정상 식별자로 교체.
// nullish 가드와 fallback hex 는 defense in depth(미니파이 tree-shaking 회귀 대비)
// 목적으로 유지하며, 운영 P0 회귀 방지를 위해 제거 금지. justification: 하드코딩
// 게이트(`config/shell-scripts/check-hardcode.sh`)는 운영 안전 fallback 사유로 허용.
const KAKAO_BRAND_COLOR = TABLET_LOGIN_CONSTANTS?.SOCIAL?.BUTTONS?.KAKAO?.COLOR ?? 'var(--mypage-kakao-bg)';
const NAVER_BRAND_COLOR = TABLET_LOGIN_CONSTANTS?.SOCIAL?.BUTTONS?.NAVER?.COLOR ?? 'var(--mg-color-naver-green)';


/**
 * 결제 확인 모달 컴포넌트
/**
 * - 매핑별 결제 확인/취소 기능
/**
 * - 결제 방법 및 금액 입력
/**
 * - 결제 상태 관리
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-09-05
 */
const PaymentConfirmationModal = ({ 
  isOpen, 
  onClose, 
  mappings = [], 
  onPaymentConfirmed,
  canCancelPayment = false
}) => {
  const { t } = useTranslation();
  const [alert, AlertModal] = useAlert();
  // notificationManager가 제대로 import되었는지 확인
  if (typeof notificationManager === 'undefined') {
    console.error('notificationManager가 정의되지 않았습니다. import를 확인해주세요.');
  }
  
  const [loading, setLoading] = useState(false);
  const [selectedMappings, setSelectedMappings] = useState([]);
  const [paymentData, setPaymentData] = useState({
    method: 'CARD',
    amount: 0,
    note: ''
  });
  const [errors, setErrors] = useState({});
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  const [bulkOutcome, setBulkOutcome] = useState(null);
  const { API_ENDPOINTS } = PAYMENT_CONFIRMATION_MODAL_CONSTANTS;

  const MESSAGES = {
    CONFIRM_SUCCESS: '결제가 확인되었습니다.',
    CONFIRM_ERROR: '결제 확인에 실패했습니다.',
    CANCEL_SUCCESS: '결제가 취소되었습니다.',
    CANCEL_ERROR: '결제 취소에 실패했습니다.',
    REQUIRED_FIELDS: '필수 항목을 입력해주세요.',
    INVALID_AMOUNT: '유효한 금액을 입력해주세요.'
  };
  
  const VALIDATION = {
    MIN_AMOUNT: MIN_PAYMENT_AMOUNT,
    MAX_AMOUNT: MAX_PAYMENT_AMOUNT,
    MAX_NOTE_LENGTH: 500
  };
  
  const FORMAT = {
    CURRENCY: {
      LOCALE: 'ko-KR',
      STYLE: 'currency',
      CURRENCY: 'KRW'
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setBulkOutcome(null);
      return;
    }
    if (mappings.length > 0) {
      const pending = mappings.filter(isPendingPaymentMapping);
      setSelectedMappings(pending);
      setPaymentData(prev => ({
        ...prev,
        amount: pending.reduce((sum, mapping) => sum + resolveMappingPaymentAmount(mapping), 0)
      }));
    }
  }, [isOpen, mappings]);

  const PAYMENT_METHOD_FALLBACK = [
    { value: 'CARD', label: '카드', icon: '💳', color: 'var(--mg-primary-500)', description: '신용카드/체크카드 결제' },
    { value: 'BANK_TRANSFER', label: '계좌이체', icon: '🏦', color: 'var(--mg-success-500)', description: '은행 계좌 이체' },
    { value: 'CASH', label: '현금', icon: '💵', color: 'var(--mg-warning-500)', description: '현금 결제' },
    { value: 'KAKAO_PAY', label: '카카오페이', icon: '💛', color: KAKAO_BRAND_COLOR, description: '카카오페이 간편결제' },
    { value: 'NAVER_PAY', label: '네이버페이', icon: '💚', color: NAVER_BRAND_COLOR, description: '네이버페이 간편결제' },
    { value: 'TOSS', label: '토스', icon: '🔷', color: 'var(--mg-info-500)', description: '토스 간편결제' },
    { value: 'PAYPAL', label: '페이팔', icon: '🔵', color: 'var(--mg-primary-700)', description: '페이팔 결제' },
    { value: 'OTHER', label: '기타', icon: '💱', color: 'var(--mg-color-text-secondary)', description: '기타 결제 방법' }
  ];

  useEffect(() => {
    const loadPaymentMethodCodes = async() => {
      try {
        setLoadingCodes(true);
        const codes = await getCommonCodes('PAYMENT_METHOD');
        const list = Array.isArray(codes) ? codes : (codes?.codes || []);
        if (list.length > 0) {
          const options = list.map(code => ({
            value: code.codeValue || code.code_value,
            label: code.codeLabel || code.code_label || code.codeValue || code.code_value,
            icon: code.icon,
            color: code.colorCode || code.color_code,
            description: code.description
          }));
          setPaymentMethodOptions(options);
        } else {
          setPaymentMethodOptions(PAYMENT_METHOD_FALLBACK);
        }
      } catch (error) {
        console.error('결제 방법 코드 로드 실패:', error);
        setPaymentMethodOptions(PAYMENT_METHOD_FALLBACK);
      } finally {
        setLoadingCodes(false);
      }
    };

    loadPaymentMethodCodes();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(FORMAT.CURRENCY.LOCALE, {
      style: FORMAT.CURRENCY.STYLE,
      currency: FORMAT.CURRENCY.CURRENCY
    }).format(amount);
  };

  const handleMappingToggle = (mappingId) => {
    setSelectedMappings(prev => {
      const isSelected = prev.some(mapping => mapping.id === mappingId);
      if (isSelected) {
        return prev.filter(mapping => mapping.id !== mappingId);
      } else {
        const mapping = mappings.find(m => m.id === mappingId);
        return [...prev, mapping];
      }
    });
  };

  const handlePaymentDataChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (selectedMappings.length === 0) {
      newErrors.mappings = '결제할 매핑을 선택해주세요.';
    }
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      newErrors.amount = MESSAGES.INVALID_AMOUNT;
    } else if (isBelowMinPaymentAmount(paymentData.amount)) {
      newErrors.amount = t(PAYMENT_MIN_CARD_AMOUNT_I18N_KEY, {
        amount: formatPaymentAmountForDisplay(MIN_PAYMENT_AMOUNT),
        defaultValue: buildMinCardPaymentAmountMessage()
      });
    }
    
    if (paymentData.amount > VALIDATION.MAX_AMOUNT) {
      newErrors.amount = `최대 금액은 ${formatCurrency(VALIDATION.MAX_AMOUNT)}입니다.`;
    }
    
    if (paymentData.note && paymentData.note.length > VALIDATION.MAX_NOTE_LENGTH) {
      newErrors.note = `메모는 ${VALIDATION.MAX_NOTE_LENGTH}자 이하로 입력해주세요.`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 일괄 요청 — 매칭마다 독립 처리. 전부 처리(또는 건너뜀)면 닫고, 아니면 매칭별 결과를 모달에 남긴다.
   * 일부라도 커밋되었으면 닫을 때 목록을 새로 고친다(onPaymentConfirmed).
   */
  const submitBulk = async(endpoint, body, successMessage, errorMessage) => {
    setLoading(true);
    try {
      const data = await StandardizedApi.post(endpoint, body);
      const outcome = extractBulkMappingResults(data);
      if (!outcome || outcome.summary.failed === 0) {
        notificationManager.success(successMessage);
        onPaymentConfirmed && onPaymentConfirmed(data);
        onClose();
        return;
      }
      setBulkOutcome({ ...outcome, committed: outcome.summary.succeeded > 0, data });
      const retryable = selectedMappings.filter(mapping =>
        outcome.results.some(item => item.mappingId === Number(mapping.id)
          && item.status === BULK_MAPPING_ITEM_STATUS.FAILED));
      setSelectedMappings(retryable);
      setPaymentData(prev => ({
        ...prev,
        amount: retryable.reduce((sum, mapping) => sum + resolveMappingPaymentAmount(mapping), 0)
      }));
      notificationManager.warning(outcome.summary.succeeded > 0
        ? BULK_MAPPING_RESULT_MESSAGES.PARTIAL_NOTICE
        : BULK_MAPPING_RESULT_MESSAGES.NONE_PROCESSED_NOTICE);
    } catch (error) {
      console.error('일괄 결제 처리 실패:', error);
      const outcome = extractBulkMappingResultsFromError(error);
      if (outcome) {
        setBulkOutcome({ ...outcome, committed: outcome.summary.succeeded > 0, data: null });
      }
      notificationManager.error(error?.message || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (bulkOutcome?.committed && onPaymentConfirmed) {
      onPaymentConfirmed(bulkOutcome.data);
      return;
    }
    onClose();
  };

  const resultByMappingId = new Map(
    (bulkOutcome?.results || []).map(item => [item.mappingId, item])
  );

  const handleConfirmPayment = async(e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!validateForm()) {
      if (isBelowMinPaymentAmount(paymentData.amount)) {
        await alert({
          variant: 'warning',
          titleKey: PAYMENT_MIN_CARD_AMOUNT_TITLE_I18N_KEY,
          messageKey: PAYMENT_MIN_CARD_AMOUNT_I18N_KEY,
          interpolation: { amount: formatPaymentAmountForDisplay(MIN_PAYMENT_AMOUNT) }
        });
      } else {
        notificationManager.error(MESSAGES.REQUIRED_FIELDS);
      }
      return;
    }

    await submitBulk(API_ENDPOINTS.CONFIRM_PAYMENT, {
      mappingIds: selectedMappings.map(mapping => mapping.id),
      paymentMethod: paymentData.method,
      amount: paymentData.amount,
      note: paymentData.note
    }, MESSAGES.CONFIRM_SUCCESS, MESSAGES.CONFIRM_ERROR);
  };

  const handleCancelPayment = async(e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (selectedMappings.length === 0) {
      notificationManager.error('취소할 매핑을 선택해주세요.');
      return;
    }

    await submitBulk(API_ENDPOINTS.CANCEL_PAYMENT, {
      mappingIds: selectedMappings.map(mapping => mapping.id)
    }, MESSAGES.CANCEL_SUCCESS, MESSAGES.CANCEL_ERROR);
  };

  if (!isOpen) return null;

  return (
    <>
      <AlertModal />
      <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin.actions.paymentConfirm')}
      size="auto"
      className="mg-v2-ad-b0kla"
      backdropClick
      showCloseButton
      loading={loading}
      actions={
        <>
          <MGButton
            type="button"
            variant="secondary"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            onClick={(e) => {
              e?.preventDefault();
              e?.stopPropagation();
              handleClose();
            }}
            disabled={loading}
          >
            {t('admin.actions.cancel')}
          </MGButton>
          {canCancelPayment && (
            <MGButton
              type="button"
              variant="danger"
              className={buildErpMgButtonClassName({ variant: 'danger', size: 'md', loading })}
              onClick={handleCancelPayment}
              loading={loading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              disabled={selectedMappings.length === 0}
              preventDoubleClick
            >
              결제 취소
            </MGButton>
          )}
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading })}
            onClick={handleConfirmPayment}
            loading={loading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={selectedMappings.length === 0}
            preventDoubleClick
          >
            {t('admin.actions.paymentConfirm')}
          </MGButton>
        </>
      }
    >
      <div className="mg-v2-modal-body">
          {bulkOutcome && (
            <div className="mg-v2-ad-b0kla__card mg-v2-form-section" role="status" data-testid="bulk-payment-result">
              <h3 className="mg-v2-ad-b0kla__section-title">{BULK_MAPPING_RESULT_MESSAGES.RESULT_TITLE}</h3>
              <p>{BULK_MAPPING_RESULT_MESSAGES.SUMMARY(bulkOutcome.summary)}</p>
            </div>
          )}
          {/* 매핑 목록 */}
          <div className="mg-v2-ad-b0kla__card mg-v2-form-section">
            <h3 className="mg-v2-ad-b0kla__section-title">결제 대기 중인 매핑</h3>
            <div className="mg-v2-mapping-list">
              {mappings
                .filter(isPendingPaymentMapping)
                .map(mapping => {
                  const itemResult = resultByMappingId.get(Number(mapping.id));
                  const itemDone = itemResult != null
                    && itemResult.status !== BULK_MAPPING_ITEM_STATUS.FAILED;
                  return (
                  <label 
                    key={mapping.id}
                    className={`mg-mapping-item ${
                      selectedMappings.some(m => m.id === mapping.id) ? 'selected' : ''
                    }`}
                  >
                    <input 
                      type="checkbox"
                      className="mg-v2-checkbox"
                      checked={selectedMappings.some(m => m.id === mapping.id)}
                      onChange={() => handleMappingToggle(mapping.id)}
                      disabled={itemDone}
                    />
                    <div className="mg-v2-mapping-info">
                      <div className="mg-v2-mapping-client">
                        <strong>{mapping.clientName}</strong>
                      </div>
                      <div className="mg-v2-mapping-consultant">
                        상담사: {mapping.consultantName}
                      </div>
                      <div className="mg-v2-mapping-amount">
                        {formatCurrency(resolveMappingPaymentAmount(mapping))}
                      </div>
                      {itemResult && (
                        <div
                          className="mg-v2-mapping-result"
                          data-testid={`bulk-payment-item-${mapping.id}`}
                          data-status={itemResult.status}
                        >
                          <strong>{BULK_MAPPING_ITEM_STATUS_LABEL[itemResult.status] || itemResult.status}</strong>
                          {itemResult.message ? ` · ${itemResult.message}` : ''}
                        </div>
                      )}
                    </div>
                  </label>
                  );
                })}
            </div>
            {errors.mappings && (
              <div className="mg-v2-error-message">{errors.mappings}</div>
            )}
          </div>

          {/* 결제 정보 입력 */}
          <div className="mg-v2-ad-b0kla__card mg-v2-form-section">
            <h3 className="mg-v2-ad-b0kla__section-title">결제 정보</h3>
            
            <div className="mg-v2-form-group">
              <label className="mg-v2-label">{t('admin.labels.paymentMethod')}</label>
              <BadgeSelect
                value={paymentData.method}
                onChange={(val) => handlePaymentDataChange('method', val)}
                options={paymentMethodOptions.map(option => ({
                  value: option.value,
                  label: `${option.icon != null ? `${option.icon} ` : ''}${option.label || option.value || ''}`,
                  icon: option.icon
                }))}
                placeholder={t('admin.messages.pleaseSelect')}
                className="mg-v2-badge-select-wrap"
                disabled={loadingCodes}
                loading={loadingCodes}
                aria-label={t('admin.labels.paymentMethod')}
              />
            </div>

            <div className="mg-v2-form-group">
              <label className="mg-v2-label">결제 금액</label>
              <input
                type="number"
                value={paymentData.amount}
                onChange={(e) => handlePaymentDataChange('amount', parseInt(e.target.value) || 0)}
                className={`mg-v2-input ${errors.amount ? 'error' : ''}`}
                min={VALIDATION.MIN_AMOUNT}
                max={VALIDATION.MAX_AMOUNT}
              />
              {errors.amount && (
                <div className="mg-v2-error-message">{errors.amount}</div>
              )}
            </div>

            <div className="mg-v2-form-group">
              <label className="mg-v2-label">메모 (선택사항)</label>
              <textarea
                value={paymentData.note}
                onChange={(e) => handlePaymentDataChange('note', e.target.value)}
                className={`mg-v2-textarea ${errors.note ? 'error' : ''}`}
                rows="3"
                maxLength={VALIDATION.MAX_NOTE_LENGTH}
                placeholder="결제 관련 메모를 입력하세요"
              />
              {errors.note && (
                <div className="mg-v2-error-message">{errors.note}</div>
              )}
            </div>
          </div>
        </div>
    </UnifiedModal>
    </>
  );
};

export default PaymentConfirmationModal;
