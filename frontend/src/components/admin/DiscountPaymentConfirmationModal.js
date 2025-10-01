import React, { useState, useEffect } from 'react';
import { PAYMENT_CONFIRMATION_MODAL_CSS } from '../../constants/css';
import { PAYMENT_CONFIRMATION_MODAL_CONSTANTS } from '../../constants/css-variables';
import { apiGet, apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';

/**
 * 할인 적용 결제 확인 모달 컴포넌트
 * - 패키지 상품 할인 적용 입금확인
 * - 할인 코드 입력 및 적용
 * - 할인 후 최종 금액 계산
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
const DiscountPaymentConfirmationModal = ({ 
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
    note: '',
    discountCode: ''
  });
  const [discountInfo, setDiscountInfo] = useState({
    applied: false,
    originalAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    discountRate: 0,
    discountName: '',
    discountType: ''
  });
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
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
      
      setDiscountInfo(prev => ({
        ...prev,
        originalAmount: totalAmount,
        finalAmount: totalAmount
      }));
      
      // 적용 가능한 할인 옵션 로드
      loadAvailableDiscounts();
    }
  }, [isOpen, mappings]);

  // 적용 가능한 할인 옵션 로드
  const loadAvailableDiscounts = async () => {
    if (selectedMappings.length === 0) return;
    
    try {
      setLoadingCodes(true);
      const response = await apiGet(`/api/admin/discounts/available?mappingId=${selectedMappings[0].id}`);
      
      if (response.success) {
        setAvailableDiscounts(response.data || []);
      }
    } catch (error) {
      console.error('할인 옵션 로드 실패:', error);
      notificationManager.error('할인 옵션을 불러오는데 실패했습니다.');
    } finally {
      setLoadingCodes(false);
    }
  };

  // 할인 코드 적용
  const applyDiscount = async () => {
    if (!paymentData.discountCode.trim()) {
      notificationManager.warning('할인 코드를 입력해주세요.');
      return;
    }
    
    if (selectedMappings.length === 0) {
      notificationManager.warning('선택된 매핑이 없습니다.');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiPost(`/api/admin/discounts/apply`, {
        mappingId: selectedMappings[0].id,
        discountCode: paymentData.discountCode
      });
      
      if (response.success) {
        const discount = response.data;
        setDiscountInfo({
          applied: true,
          originalAmount: discount.originalAmount,
          discountAmount: discount.discountAmount,
          finalAmount: discount.finalAmount,
          discountRate: discount.discountRate,
          discountName: discount.discountName,
          discountType: discount.discountType
        });
        
        setPaymentData(prev => ({
          ...prev,
          amount: discount.finalAmount
        }));
        
        notificationManager.success(`할인이 적용되었습니다. (${discount.discountName})`);
      } else {
        notificationManager.error(response.message || '할인 적용에 실패했습니다.');
      }
    } catch (error) {
      console.error('할인 적용 실패:', error);
      notificationManager.error('할인 적용 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 할인 제거
  const removeDiscount = () => {
    setDiscountInfo({
      applied: false,
      originalAmount: paymentData.amount,
      discountAmount: 0,
      finalAmount: paymentData.amount,
      discountRate: 0,
      discountName: '',
      discountType: ''
    });
    
    setPaymentData(prev => ({
      ...prev,
      discountCode: ''
    }));
    
    notificationManager.info('할인이 제거되었습니다.');
  };

  // 결제 확인 처리
  const handleConfirmPayment = async () => {
    if (selectedMappings.length === 0) {
      notificationManager.warning('선택된 매핑이 없습니다.');
      return;
    }
    
    try {
      setLoading(true);
      
      for (const mapping of selectedMappings) {
        const response = await apiPost(`/api/admin/mappings/${mapping.id}/confirm-payment`, {
          paymentMethod: paymentData.method,
          paymentReference: `REF-${Date.now()}`,
          paymentAmount: paymentData.amount,
          discountCode: paymentData.discountCode,
          discountAmount: discountInfo.discountAmount,
          originalAmount: discountInfo.originalAmount
        });
        
        if (!response.success) {
          throw new Error(response.message || '결제 확인에 실패했습니다.');
        }
      }
      
      notificationManager.success('결제 확인이 완료되었습니다.');
      onPaymentConfirmed();
      onClose();
      
    } catch (error) {
      console.error('결제 확인 실패:', error);
      notificationManager.error('결제 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>할인 적용 결제 확인</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            style={PAYMENT_CONFIRMATION_MODAL_CSS.CLOSE_BUTTON}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body" style={PAYMENT_CONFIRMATION_MODAL_CSS.BODY}>
          {/* 선택된 매핑 정보 */}
          <div className="mapping-info" style={{ marginBottom: '20px' }}>
            <h3>선택된 매핑</h3>
            {selectedMappings.map(mapping => (
              <div key={mapping.id} className="mapping-item" style={{ 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <div><strong>패키지:</strong> {mapping.packageName}</div>
                <div><strong>원래 금액:</strong> {formatAmount(mapping.amount)}원</div>
                <div><strong>상담사:</strong> {mapping.consultantName}</div>
                <div><strong>내담자:</strong> {mapping.clientName}</div>
              </div>
            ))}
          </div>
          
          {/* 할인 적용 섹션 */}
          <div className="discount-section" style={{ marginBottom: '20px' }}>
            <h3>할인 적용</h3>
            
            <div className="discount-input" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="할인 코드 입력"
                value={paymentData.discountCode}
                onChange={(e) => setPaymentData(prev => ({ ...prev, discountCode: e.target.value }))}
                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                disabled={discountInfo.applied}
              />
              <button
                onClick={applyDiscount}
                disabled={loading || discountInfo.applied}
                style={{
                  padding: '8px 16px',
                  backgroundColor: discountInfo.applied ? '#28a745' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: discountInfo.applied ? 'not-allowed' : 'pointer'
                }}
              >
                {discountInfo.applied ? '적용됨' : '할인 적용'}
              </button>
              {discountInfo.applied && (
                <button
                  onClick={removeDiscount}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  제거
                </button>
              )}
            </div>
            
            {/* 할인 정보 표시 */}
            {discountInfo.applied && (
              <div className="discount-info" style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>원래 금액:</span>
                  <span>{formatAmount(discountInfo.originalAmount)}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#dc3545' }}>
                  <span>할인 금액:</span>
                  <span>-{formatAmount(discountInfo.discountAmount)}원 ({discountInfo.discountRate}%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 'var(--font-size-base)', borderTop: '1px solid #dee2e6', paddingTop: '5px' }}>
                  <span>최종 금액:</span>
                  <span style={{ color: '#007bff' }}>{formatAmount(discountInfo.finalAmount)}원</span>
                </div>
                <div style={{ marginTop: '10px', fontSize: 'var(--font-size-sm)', color: '#6c757d' }}>
                  적용된 할인: {discountInfo.discountName}
                </div>
              </div>
            )}
            
            {/* 적용 가능한 할인 옵션 */}
            {availableDiscounts.length > 0 && (
              <div className="available-discounts" style={{ marginTop: '10px' }}>
                <h4>적용 가능한 할인</h4>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {availableDiscounts.map((discount, index) => (
                    <div key={index} className="discount-option" style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      cursor: 'pointer',
                      backgroundColor: discount.isApplicable ? '#f8f9fa' : '#f5f5f5'
                    }}
                    onClick={() => {
                      if (discount.isApplicable) {
                        setPaymentData(prev => ({ ...prev, discountCode: discount.code }));
                      }
                    }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{discount.name}</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: '#6c757d' }}>{discount.description}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: discount.isApplicable ? '#28a745' : '#dc3545' }}>
                        {discount.isApplicable ? '적용 가능' : discount.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 결제 방법 선택 */}
          <div className="payment-method" style={{ marginBottom: '20px' }}>
            <h3>결제 방법</h3>
            <select
              value={paymentData.method}
              onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
            >
              <option value="CARD">카드</option>
              <option value="BANK_TRANSFER">계좌이체</option>
              <option value="CASH">현금</option>
              <option value="OTHER">기타</option>
            </select>
          </div>
          
          {/* 메모 입력 */}
          <div className="payment-note" style={{ marginBottom: '20px' }}>
            <h3>메모</h3>
            <textarea
              placeholder="결제 관련 메모를 입력하세요"
              value={paymentData.note}
              onChange={(e) => setPaymentData(prev => ({ ...prev, note: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
        
        <div className="modal-footer" style={PAYMENT_CONFIRMATION_MODAL_CSS.FOOTER}>
          <button
            onClick={onClose}
            style={PAYMENT_CONFIRMATION_MODAL_CSS.CANCEL_BUTTON}
          >
            취소
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={loading || selectedMappings.length === 0}
            style={{
              ...PAYMENT_CONFIRMATION_MODAL_CSS.CONFIRM_BUTTON,
              opacity: loading || selectedMappings.length === 0 ? 0.6 : 1,
              cursor: loading || selectedMappings.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '처리 중...' : '결제 확인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountPaymentConfirmationModal;
