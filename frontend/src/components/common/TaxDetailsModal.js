import React, { useState, useEffect } from 'react';
import { SALARY_CSS_CLASSES, SALARY_MESSAGES, TAX_TYPE_LABELS } from '../../constants/salaryConstants';
import { apiGet } from '../../utils/ajax';
import './TaxDetailsModal.css';

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
    <div className="tax-details-modal-overlay">
      <div className="tax-details-modal-content">
        {/* 헤더 */}
        <div className="tax-details-modal-header">
          <h3 className="tax-details-modal-title">
            세금 내역 상세
          </h3>
          <button 
            className="tax-details-modal-close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 상담사 정보 */}
        <div className="tax-details-consultant-info">
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
        <div className="tax-details-modal-body">
          {loading ? (
            <div className="tax-details-loading">
              <div className="spinner"></div>
              <p>세금 내역을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="tax-details-error">
              <p>❌ {error}</p>
              <button 
                className="tax-details-retry-button"
                onClick={loadTaxDetails}
              >
                다시 시도
              </button>
            </div>
          ) : taxDetails.length === 0 ? (
            <div className="tax-details-empty">
              <p>📋 세금 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="tax-details-container">
              {/* 세금 내역 테이블 */}
              <table className="tax-details-table">
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
                  <tr className="tax-details-total-row">
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
        <div className="tax-details-modal-footer">
          <button 
            className="tax-details-footer-button"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxDetailsModal;
