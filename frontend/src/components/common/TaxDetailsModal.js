import React, { useState, useEffect } from 'react';
import { SALARY_CSS_CLASSES, SALARY_MESSAGES, TAX_TYPE_LABELS } from '../../constants/salaryConstants';
import { apiGet } from '../../utils/ajax';

/**
 * 세금 내역 보기 모달 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {number} props.calculationId - 급여 계산 ID
 * @param {string} props.consultantName - 상담사 이름
 * @param {string} props.period - 계산 기간
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
const TaxDetailsModal = ({ 
  isOpen, 
  onClose, 
  calculationId, 
  consultantName, 
  period 
}) => {
  const [taxDetails, setTaxDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 세금 내역 조회
  const loadTaxDetails = async () => {
    if (!calculationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiGet(`/api/admin/salary/tax/${calculationId}`);
      
      if (response.success) {
        // response.data는 객체이고, 실제 세금 배열은 taxDetails 필드에 있음
        setTaxDetails(response.data?.taxDetails || []);
      } else {
        setError(response.message || SALARY_MESSAGES.CALCULATION_ERROR);
      }
    } catch (err) {
      console.error('세금 내역 조회 실패:', err);
      setError(SALARY_MESSAGES.CALCULATION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 세금 내역 조회
  useEffect(() => {
    if (isOpen && calculationId) {
      loadTaxDetails();
    }
  }, [isOpen, calculationId]);

  // 세금 유형 한글 변환
  const getTaxTypeLabel = (taxType) => {
    return TAX_TYPE_LABELS[taxType] || taxType;
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount || 0);
  };

  // 세율 포맷팅
  const formatTaxRate = (rate) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  // 총 세금 계산 (안전한 배열 처리)
  const totalTaxAmount = Array.isArray(taxDetails) 
    ? taxDetails.reduce((sum, tax) => sum + (tax.taxAmount || 0), 0)
    : 0;

  if (!isOpen) return null;

  return (
    <div className={`${SALARY_CSS_CLASSES.MODAL} modal-overlay`} style={modalOverlayStyle}>
      <div className="modal-content" style={modalContentStyle}>
        {/* 헤더 */}
        <div className="modal-header" style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>
            세금 내역 상세
          </h3>
          <button 
            className="modal-close-btn" 
            style={closeButtonStyle}
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 상담사 정보 */}
        <div className="consultant-info" style={consultantInfoStyle}>
          <div className="info-item">
            <span className="label">상담사:</span>
            <span className="value">{consultantName || '정보 없음'}</span>
          </div>
          <div className="info-item">
            <span className="label">기간:</span>
            <span className="value">{period || '정보 없음'}</span>
          </div>
        </div>

        {/* 내용 */}
        <div className="modal-body" style={modalBodyStyle}>
          {loading ? (
            <div className="loading-container" style={loadingStyle}>
              <div className="spinner"></div>
              <p>세금 내역을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="error-container" style={errorStyle}>
              <p>❌ {error}</p>
              <button 
                className={SALARY_CSS_CLASSES.BUTTON_PRIMARY}
                onClick={loadTaxDetails}
                style={retryButtonStyle}
              >
                다시 시도
              </button>
            </div>
          ) : taxDetails.length === 0 ? (
            <div className="empty-container" style={emptyStyle}>
              <p>📋 세금 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="tax-details-container">
              {/* 세금 내역 테이블 */}
              <table className={SALARY_CSS_CLASSES.TABLE} style={tableStyle}>
                <thead>
                  <tr className={SALARY_CSS_CLASSES.TABLE_HEADER}>
                    <th>세금 유형</th>
                    <th>세금명</th>
                    <th>세율</th>
                    <th>과세표준</th>
                    <th>세액</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  {taxDetails.map((tax, index) => (
                    <tr key={tax.id || index} className={SALARY_CSS_CLASSES.TABLE_ROW}>
                      <td className={SALARY_CSS_CLASSES.TABLE_CELL}>
                        {getTaxTypeLabel(tax.taxType)}
                      </td>
                      <td className={SALARY_CSS_CLASSES.TABLE_CELL}>
                        {tax.taxName || '-'}
                      </td>
                      <td className={SALARY_CSS_CLASSES.TABLE_CELL}>
                        {formatTaxRate(tax.taxRate)}
                      </td>
                      <td className={`${SALARY_CSS_CLASSES.TABLE_CELL} ${SALARY_CSS_CLASSES.AMOUNT_POSITIVE}`}>
                        {formatAmount(tax.taxableAmount)}원
                      </td>
                      <td className={`${SALARY_CSS_CLASSES.TABLE_CELL} ${SALARY_CSS_CLASSES.AMOUNT_NEGATIVE}`}>
                        {formatAmount(tax.taxAmount)}원
                      </td>
                      <td className={SALARY_CSS_CLASSES.TABLE_CELL}>
                        {tax.taxDescription || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row" style={totalRowStyle}>
                    <td colSpan="4" className="total-label">
                      <strong>총 세금</strong>
                    </td>
                    <td className={`total-amount ${SALARY_CSS_CLASSES.AMOUNT_NEGATIVE}`}>
                      <strong>{formatAmount(totalTaxAmount)}원</strong>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="modal-footer" style={modalFooterStyle}>
          <button 
            className={SALARY_CSS_CLASSES.BUTTON_SECONDARY}
            onClick={onClose}
            style={footerButtonStyle}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

// 인라인 스타일 정의
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '800px',
  maxHeight: '90vh',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
};

const modalHeaderStyle = {
  padding: '20px',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f8fafc'
};

const modalTitleStyle = {
  margin: 0,
  fontSize: 'var(--font-size-lg)',
  fontWeight: '600',
  color: '#1f2937'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: 'var(--font-size-xxl)',
  cursor: 'pointer',
  color: '#6b7280',
  padding: '0',
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const consultantInfoStyle = {
  padding: '15px 20px',
  backgroundColor: '#f1f5f9',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  gap: '30px'
};

const modalBodyStyle = {
  padding: '20px',
  maxHeight: '60vh',
  overflowY: 'auto'
};

const loadingStyle = {
  textAlign: 'center',
  padding: '40px 20px'
};

const errorStyle = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#dc2626'
};

const emptyStyle = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#6b7280'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 'var(--font-size-sm)'
};

const totalRowStyle = {
  backgroundColor: '#f8fafc',
  fontWeight: 'bold'
};

const modalFooterStyle = {
  padding: '15px 20px',
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'flex-end',
  backgroundColor: '#f8fafc'
};

const footerButtonStyle = {
  padding: '8px 16px',
  borderRadius: '4px',
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  color: '#374151',
  cursor: 'pointer',
  fontSize: 'var(--font-size-sm)'
};

const retryButtonStyle = {
  padding: '8px 16px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#3b82f6',
  color: 'white',
  cursor: 'pointer',
  fontSize: 'var(--font-size-sm)',
  marginTop: '10px'
};

export default TaxDetailsModal;
