import React, { useState, useEffect } from 'react';
import { PAYMENT_CONFIRMATION_MODAL_CSS } from '../../constants/css';
import { PAYMENT_CONFIRMATION_MODAL_CONSTANTS } from '../../constants/css-variables';
import { apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';

/**
 * 결제 확인 모달 컴포넌트
 * - 매핑별 결제 확인/취소 기능
 * - 결제 방법 및 금액 입력
 * - 결제 상태 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */
const PaymentConfirmationModal = ({ 
  isOpen, 
  onClose, 
  mappings = [], 
  onPaymentConfirmed 
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedMappings, setSelectedMappings] = useState([]);
  const [paymentData, setPaymentData] = useState({
    method: PAYMENT_CONFIRMATION_MODAL_CONSTANTS.PAYMENT_METHODS.CARD,
    amount: 0,
    note: ''
  });
  const [errors, setErrors] = useState({});
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  const { 
    API_ENDPOINTS, 
    PAYMENT_METHODS, 
    MESSAGES, 
    FORMAT, 
    VALIDATION 
  } = PAYMENT_CONFIRMATION_MODAL_CONSTANTS;

  useEffect(() => {
    if (isOpen && mappings.length > 0) {
      // 초기 선택된 매핑 설정
      setSelectedMappings(mappings.filter(mapping => 
        mapping.status === PAYMENT_CONFIRMATION_MODAL_CONSTANTS.PAYMENT_STATUS.PENDING
      ));
      
      // 총 금액 계산
      const totalAmount = mappings
        .filter(mapping => mapping.status === PAYMENT_CONFIRMATION_MODAL_CONSTANTS.PAYMENT_STATUS.PENDING)
        .reduce((sum, mapping) => sum + (mapping.amount || 0), 0);
      
      setPaymentData(prev => ({
        ...prev,
        amount: totalAmount
      }));
    }
  }, [isOpen, mappings]);

  // 결제 방법 코드 로드
  useEffect(() => {
    const loadPaymentMethodCodes = async () => {
      try {
        setLoadingCodes(true);
        const response = await apiGet('/api/common-codes/group/PAYMENT_METHOD');
        if (response && response.length > 0) {
          const options = response.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode,
            description: code.description
          }));
          setPaymentMethodOptions(options);
        }
      } catch (error) {
        console.error('결제 방법 코드 로드 실패:', error);
        // 실패 시 기본값 설정
        setPaymentMethodOptions([
          { value: 'CARD', label: '카드', icon: '💳', color: '#3b82f6', description: '신용카드/체크카드 결제' },
          { value: 'BANK_TRANSFER', label: '계좌이체', icon: '🏦', color: '#10b981', description: '은행 계좌 이체' },
          { value: 'CASH', label: '현금', icon: '💵', color: '#f59e0b', description: '현금 결제' },
          { value: 'KAKAO_PAY', label: '카카오페이', icon: '💛', color: '#fee500', description: '카카오페이 간편결제' },
          { value: 'NAVER_PAY', label: '네이버페이', icon: '💚', color: '#03c75a', description: '네이버페이 간편결제' },
          { value: 'TOSS', label: '토스', icon: '🔷', color: '#0064ff', description: '토스 간편결제' },
          { value: 'PAYPAL', label: '페이팔', icon: '🔵', color: '#0070ba', description: '페이팔 결제' },
          { value: 'OTHER', label: '기타', icon: '💱', color: '#6b7280', description: '기타 결제 방법' }
        ]);
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
    
    // 에러 초기화
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

  const handleConfirmPayment = async () => {
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

  const handleCancelPayment = async () => {
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
    <div className={PAYMENT_CONFIRMATION_MODAL_CSS.OVERLAY}>
      <div className={PAYMENT_CONFIRMATION_MODAL_CSS.MODAL}>
        {/* 헤더 */}
        <div className={PAYMENT_CONFIRMATION_MODAL_CSS.HEADER}>
          <h2 className={PAYMENT_CONFIRMATION_MODAL_CSS.TITLE}>
            <i className="bi bi-credit-card"></i>
            결제 확인
          </h2>
          <button 
            className={PAYMENT_CONFIRMATION_MODAL_CSS.CLOSE_BUTTON}
            onClick={onClose}
            disabled={loading}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        {/* 본문 */}
        <div className={PAYMENT_CONFIRMATION_MODAL_CSS.BODY}>
          {/* 매핑 목록 */}
          <div className={PAYMENT_CONFIRMATION_MODAL_CSS.MAPPING_LIST}>
            <h3>결제 대기 중인 매핑</h3>
            {mappings
              .filter(mapping => mapping.status === PAYMENT_CONFIRMATION_MODAL_CONSTANTS.PAYMENT_STATUS.PENDING)
              .map(mapping => (
                <div 
                  key={mapping.id}
                  className={`${PAYMENT_CONFIRMATION_MODAL_CSS.MAPPING_ITEM} ${
                    selectedMappings.some(m => m.id === mapping.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleMappingToggle(mapping.id)}
                >
                  <div className={PAYMENT_CONFIRMATION_MODAL_CSS.MAPPING_HEADER}>
                    <input 
                      type="checkbox"
                      checked={selectedMappings.some(m => m.id === mapping.id)}
                      onChange={() => handleMappingToggle(mapping.id)}
                    />
                    <div className={PAYMENT_CONFIRMATION_MODAL_CSS.MAPPING_INFO}>
                      <div className={PAYMENT_CONFIRMATION_MODAL_CSS.MAPPING_CLIENT}>
                        <strong>{mapping.clientName}</strong>
                      </div>
                      <div className={PAYMENT_CONFIRMATION_MODAL_CSS.MAPPING_CONSULTANT}>
                        상담사: {mapping.consultantName}
                      </div>
                      <div className={PAYMENT_CONFIRMATION_MODAL_CSS.MAPPING_AMOUNT}>
                        {formatCurrency(mapping.amount || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* 결제 정보 입력 */}
          <div className={PAYMENT_CONFIRMATION_MODAL_CSS.PAYMENT_SECTION}>
            <h3>결제 정보</h3>
            
            <div className="form-group">
              <label>결제 방법</label>
              <select 
                value={paymentData.method} 
                onChange={(e) => handlePaymentDataChange('method', e.target.value)}
                className="form-control"
                disabled={loadingCodes}
              >
                {paymentMethodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label} ({option.value})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>결제 금액</label>
              <input
                type="number"
                value={paymentData.amount}
                onChange={(e) => handlePaymentDataChange('amount', parseInt(e.target.value) || 0)}
                className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                min={VALIDATION.MIN_AMOUNT}
                max={VALIDATION.MAX_AMOUNT}
              />
              {errors.amount && (
                <div className="invalid-feedback">{errors.amount}</div>
              )}
            </div>

            <div className="form-group">
              <label>메모 (선택사항)</label>
              <textarea
                value={paymentData.note}
                onChange={(e) => handlePaymentDataChange('note', e.target.value)}
                className={`form-control ${errors.note ? 'is-invalid' : ''}`}
                rows="3"
                maxLength={VALIDATION.MAX_NOTE_LENGTH}
                placeholder="결제 관련 메모를 입력하세요"
              />
              {errors.note && (
                <div className="invalid-feedback">{errors.note}</div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className={PAYMENT_CONFIRMATION_MODAL_CSS.FOOTER}>
          <div className={PAYMENT_CONFIRMATION_MODAL_CSS.BUTTON_GROUP}>
            <button
              className={`${PAYMENT_CONFIRMATION_MODAL_CSS.BUTTON} ${PAYMENT_CONFIRMATION_MODAL_CSS.BUTTON_SECONDARY}`}
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button
              className={`${PAYMENT_CONFIRMATION_MODAL_CSS.BUTTON} ${PAYMENT_CONFIRMATION_MODAL_CSS.BUTTON_DANGER}`}
              onClick={handleCancelPayment}
              disabled={loading || selectedMappings.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  처리 중...
                </>
              ) : (
                '결제 취소'
              )}
            </button>
            <button
              className={`${PAYMENT_CONFIRMATION_MODAL_CSS.BUTTON} ${PAYMENT_CONFIRMATION_MODAL_CSS.BUTTON_SUCCESS}`}
              onClick={handleConfirmPayment}
              disabled={loading || selectedMappings.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  처리 중...
                </>
              ) : (
                '결제 확인'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationModal;
