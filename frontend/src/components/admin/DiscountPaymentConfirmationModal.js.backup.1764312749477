import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import ReactDOM from 'react-dom';
import { CreditCard, X, Tag, CheckCircle, XCircle } from 'lucide-react';
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
    method: 'CARD',
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

  // Constants
  const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };

  useEffect(() => {
    if (isOpen && mappings.length > 0) {
      // 초기 선택된 매핑 설정
      setSelectedMappings(mappings.filter(mapping => 
        mapping.status === PAYMENT_STATUS.PENDING
      ));
      
      // 총 금액 계산
      const totalAmount = mappings
        .filter(mapping => mapping.status === PAYMENT_STATUS.PENDING)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <h2 className="mg-v2-modal-title">
            <Tag size={24} />
            할인 적용 결제 확인
          </h2>
          <button 
            className="mg-v2-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mg-v2-modal-body">
          {/* 선택된 매핑 정보 */}
          <div className="mg-v2-form-section">
            <h3 className="mg-v2-section-title">선택된 매핑</h3>
            <div className="mg-v2-mapping-list">
              {selectedMappings.map(mapping => (
                <div key={mapping.id} className="mg-v2-mapping-card">
                  <div className="mg-v2-mapping-row">
                    <strong>패키지:</strong> <span>{mapping.packageName}</span>
                  </div>
                  <div className="mg-v2-mapping-row">
                    <strong>원래 금액:</strong> <span>{formatAmount(mapping.amount)}원</span>
                  </div>
                  <div className="mg-v2-mapping-row">
                    <strong>상담사:</strong> <span>{mapping.consultantName}</span>
                  </div>
                  <div className="mg-v2-mapping-row">
                    <strong>내담자:</strong> <span>{mapping.clientName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 할인 적용 섹션 */}
          <div className="mg-v2-form-section">
            <h3 className="mg-v2-section-title">
              <Tag size={20} />
              할인 적용
            </h3>
            
            <div className="mg-v2-discount-input">
              <input
                type="text"
                className="mg-v2-input"
                placeholder="할인 코드 입력"
                value={paymentData.discountCode}
                onChange={(e) => setPaymentData(prev => ({ ...prev, discountCode: e.target.value }))}
                disabled={discountInfo.applied}
              />
              <button
                className={`mg-v2-button ${discountInfo.applied ? 'mg-v2-button-success' : 'mg-v2-button-primary'}`}
                onClick={applyDiscount}
                disabled={loading || discountInfo.applied}
              >
                {discountInfo.applied ? (
                  <>
                    <CheckCircle size={18} />
                    적용됨
                  </>
                ) : (
                  '할인 적용'
                )}
              </button>
              {discountInfo.applied && (
                <button
                  className="mg-v2-button mg-v2-button-danger"
                  onClick={removeDiscount}
                >
                  <XCircle size={18} />
                  제거
                </button>
              )}
            </div>
            
            {/* 할인 정보 표시 */}
            {discountInfo.applied && (
              <div className="mg-v2-discount-info">
                <div className="mg-v2-discount-row">
                  <span>원래 금액:</span>
                  <span>{formatAmount(discountInfo.originalAmount)}원</span>
                </div>
                <div className="mg-v2-discount-row mg-discount-amount">
                  <span>할인 금액:</span>
                  <span>-{formatAmount(discountInfo.discountAmount)}원 ({discountInfo.discountRate}%)</span>
                </div>
                <div className="mg-v2-discount-row mg-discount-final">
                  <span>최종 금액:</span>
                  <span>{formatAmount(discountInfo.finalAmount)}원</span>
                </div>
                <div className="mg-v2-discount-name">
                  적용된 할인: {discountInfo.discountName}
                </div>
              </div>
            )}
            
            {/* 적용 가능한 할인 옵션 */}
            {availableDiscounts.length > 0 && (
              <div className="mg-v2-available-discounts">
                <h4 className="mg-v2-subsection-title">적용 가능한 할인</h4>
                <div className="mg-v2-discount-options">
                  {availableDiscounts.map((discount, index) => (
                    <div 
                      key={index} 
                      className={`mg-discount-option ${discount.isApplicable ? 'applicable' : 'not-applicable'}`}
                      onClick={() => {
                        if (discount.isApplicable) {
                          setPaymentData(prev => ({ ...prev, discountCode: discount.code }));
                        }
                      }}
                    >
                      <div className="mg-v2-discount-option-name">{discount.name}</div>
                      <div className="mg-v2-discount-option-desc">{discount.description}</div>
                      <div className={`mg-discount-option-status ${discount.isApplicable ? 'success' : 'error'}`}>
                        {discount.isApplicable ? '적용 가능' : discount.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 결제 방법 선택 */}
          <div className="mg-v2-form-section">
            <h3 className="mg-v2-section-title">
              <CreditCard size={20} />
              결제 방법
            </h3>
            <div className="mg-v2-form-group">
              <select
                value={paymentData.method}
                onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                className="mg-v2-select"
              >
                <option value="CARD">카드</option>
                <option value="BANK_TRANSFER">계좌이체</option>
                <option value="CASH">현금</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
          </div>
          
          {/* 메모 입력 */}
          <div className="mg-v2-form-section">
            <h3 className="mg-v2-section-title">메모</h3>
            <div className="mg-v2-form-group">
              <textarea
                className="mg-v2-textarea"
                placeholder="결제 관련 메모를 입력하세요"
                value={paymentData.note}
                onChange={(e) => setPaymentData(prev => ({ ...prev, note: e.target.value }))}
                rows="3"
              />
            </div>
          </div>
        </div>
        
        <div className="mg-v2-modal-footer">
          <button
            className="mg-v2-button mg-v2-button-secondary"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="mg-v2-button mg-v2-button-success"
            onClick={handleConfirmPayment}
            disabled={loading || selectedMappings.length === 0}
          >
            {loading ? (
              <>
                <span className="mg-v2-spinner"></span>
                처리 중...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                결제 확인
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DiscountPaymentConfirmationModal;
