import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { apiGet } from '../../utils/ajax';
import { getCommonCodes } from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import CustomSelect from '../common/CustomSelect';
import './PaymentConfirmationModal.css';

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
  onPaymentConfirmed 
}) => {
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

  const API_ENDPOINTS = {
    CONFIRM_PAYMENT: '/api/v1/admin/payments/confirm',
    CANCEL_PAYMENT: '/api/v1/admin/payments/cancel'
  };
  
  const PAYMENT_STATUS = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    PENDING: 'pending',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    COMPLETED: 'completed',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    CANCELLED: 'cancelled'
  };
  
  const MESSAGES = {
    CONFIRM_SUCCESS: '결제가 확인되었습니다.',
    CONFIRM_ERROR: '결제 확인에 실패했습니다.',
    CANCEL_SUCCESS: '결제가 취소되었습니다.',
    CANCEL_ERROR: '결제 취소에 실패했습니다.',
    REQUIRED_FIELDS: '필수 항목을 입력해주세요.',
    INVALID_AMOUNT: '유효한 금액을 입력해주세요.'
  };
  
  const VALIDATION = {
    MIN_AMOUNT: 1000,
    MAX_AMOUNT: 100000000,
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
    if (isOpen && mappings.length > 0) {
      setSelectedMappings(mappings.filter(mapping => 
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        mapping.status === PAYMENT_STATUS.PENDING
      ));
      
      const totalAmount = mappings
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        .filter(mapping => mapping.status === PAYMENT_STATUS.PENDING)
        .reduce((sum, mapping) => sum + (mapping.amount || 0), 0);
      
      setPaymentData(prev => ({
        ...prev,
        amount: totalAmount
      }));
    }
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  }, [isOpen, mappings, PAYMENT_STATUS.PENDING]);

  const PAYMENT_METHOD_FALLBACK = [
    { value: 'CARD', label: '카드', icon: '💳', color: 'var(--mg-primary-500)', description: '신용카드/체크카드 결제' },
    { value: 'BANK_TRANSFER', label: '계좌이체', icon: '🏦', color: 'var(--mg-success-500)', description: '은행 계좌 이체' },
    { value: 'CASH', label: '현금', icon: '💵', color: 'var(--mg-warning-500)', description: '현금 결제' },
    { value: 'KAKAO_PAY', label: '카카오페이', icon: '💛', color: '#fee500', description: '카카오페이 간편결제' },
    { value: 'NAVER_PAY', label: '네이버페이', icon: '💚', color: '#03c75a', description: '네이버페이 간편결제' },
    { value: 'TOSS', label: '토스', icon: '🔷', color: '#0064ff', description: '토스 간편결제' },
    { value: 'PAYPAL', label: '페이팔', icon: '🔵', color: '#0070ba', description: '페이팔 결제' },
    { value: 'OTHER', label: '기타', icon: '💱', color: '#6b7280', description: '기타 결제 방법' }
  ];

  useEffect(() => {
    const loadPaymentMethodCodes = async () => {
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
    
    if (!paymentData.amount || paymentData.amount < VALIDATION.MIN_AMOUNT) {
      newErrors.amount = MESSAGES.INVALID_AMOUNT;
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

  const handleConfirmPayment = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!validateForm()) {
      notificationManager.error(MESSAGES.REQUIRED_FIELDS);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.CONFIRM_PAYMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mappingIds: selectedMappings.map(mapping => mapping.id),
          paymentMethod: paymentData.method,
          amount: paymentData.amount,
          note: paymentData.note
        })
      });

      const data = await response.json();

      if (data.success) {
        notificationManager.success(MESSAGES.CONFIRM_SUCCESS);
        onPaymentConfirmed && onPaymentConfirmed(data.data);
        onClose();
      } else {
        throw new Error(data.message || MESSAGES.CONFIRM_ERROR);
      }
    } catch (error) {
      console.error('결제 확인 실패:', error);
      notificationManager.error(error.message || MESSAGES.CONFIRM_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (selectedMappings.length === 0) {
      notificationManager.error('취소할 매핑을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.CANCEL_PAYMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mappingIds: selectedMappings.map(mapping => mapping.id)
        })
      });

      const data = await response.json();

      if (data.success) {
        notificationManager.success(MESSAGES.CANCEL_SUCCESS);
        onPaymentConfirmed && onPaymentConfirmed(data.data);
        onClose();
      } else {
        throw new Error(data.message || MESSAGES.CANCEL_ERROR);
      }
    } catch (error) {
      console.error('결제 취소 실패:', error);
      notificationManager.error(error.message || MESSAGES.CANCEL_ERROR);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="결제 확인"
      size="auto"
      className="mg-v2-ad-b0kla"
      backdropClick
      showCloseButton
      loading={loading}
      actions={
        <>
          <button
            type="button"
            className="mg-v2-button mg-v2-button-secondary"
            onClick={(e) => {
              e?.preventDefault();
              e?.stopPropagation();
              onClose();
            }}
            disabled={loading}
          >
            취소
          </button>
          <MGButton
            type="button"
            variant="danger"
            onClick={handleCancelPayment}
            loading={loading}
            loadingText="취소 처리 중..."
            disabled={selectedMappings.length === 0}
            preventDoubleClick
          >
            <XCircle size={18} />
            결제 취소
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            onClick={handleConfirmPayment}
            loading={loading}
            loadingText="확인 처리 중..."
            disabled={selectedMappings.length === 0}
            preventDoubleClick
          >
            <CheckCircle size={18} />
            결제 확인
          </MGButton>
        </>
      }
    >
      <div className="mg-v2-modal-body">
          {/* 매핑 목록 */}
          <div className="mg-v2-ad-b0kla__card mg-v2-form-section">
            <h3 className="mg-v2-ad-b0kla__section-title">결제 대기 중인 매핑</h3>
            <div className="mg-v2-mapping-list">
              {mappings
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                .filter(mapping => mapping.status === PAYMENT_STATUS.PENDING)
                .map(mapping => (
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
                    />
                    <div className="mg-v2-mapping-info">
                      <div className="mg-v2-mapping-client">
                        <strong>{mapping.clientName}</strong>
                      </div>
                      <div className="mg-v2-mapping-consultant">
                        상담사: {mapping.consultantName}
                      </div>
                      <div className="mg-v2-mapping-amount">
                        {formatCurrency(mapping.amount || 0)}
                      </div>
                    </div>
                  </label>
                ))}
            </div>
            {errors.mappings && (
              <div className="mg-v2-error-message">{errors.mappings}</div>
            )}
          </div>

          {/* 결제 정보 입력 */}
          <div className="mg-v2-ad-b0kla__card mg-v2-form-section">
            <h3 className="mg-v2-ad-b0kla__section-title">결제 정보</h3>
            
            <div className="mg-v2-form-group">
              <label className="mg-v2-label">결제 방법</label>
              <CustomSelect
                value={paymentData.method}
                onChange={(val) => handlePaymentDataChange('method', val)}
                options={paymentMethodOptions.map(option => ({
                  value: option.value,
                  label: `${option.icon} ${option.label}`
                }))}
                placeholder="선택하세요"
                className="mg-v2-select"
                disabled={loadingCodes}
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
  );
};

export default PaymentConfirmationModal;
