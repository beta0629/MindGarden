import React, { useState, useEffect } from 'react';
import { Receipt, User, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import UnifiedModal from './modals/UnifiedModal';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { SALARY_CSS_CLASSES, SALARY_MESSAGES, TAX_TYPE_LABELS, SALARY_API_ENDPOINTS } from '../../constants/salaryConstants';
import StandardizedApi from '../../utils/standardizedApi';
import MGButton from './MGButton';

/**
 * 세금 내역 보기 모달 컴포넌트
 * 
/**
 * @param {Object} props - 컴포넌트 props
/**
 * @param {boolean} props.isOpen - 모달 열림 상태
/**
 * @param {Function} props.onClose - 모달 닫기 함수
/**
 * @param {number} props.calculationId - 급여 계산 ID
/**
 * @param {string} props.consultantName - 상담사 이름
/**
 * @param {string} props.period - 계산 기간
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
      const response = await StandardizedApi.get(
        `${SALARY_API_ENDPOINTS.TAX_DETAILS}/${calculationId}`
      );

      if (response && (response.success !== false)) {
        const data = response.data ?? response;
        setTaxDetails(data?.taxDetails ?? []);
      } else {
        setError((response && response.message) || SALARY_MESSAGES.CALCULATION_ERROR);
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

  // 총 세금 계산
  const totalTaxAmount = Array.isArray(taxDetails) 
    ? taxDetails.reduce((sum, tax) => sum + (tax.taxAmount || 0), 0)
    : 0;

  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="세금 내역 상세"
      size="large"
      backdropClick={true}
      showCloseButton={true}
      actions={
        <MGButton
          className="mg-v2-button mg-v2-button--primary"
          onClick={onClose}
          variant="primary"
          preventDoubleClick={false}
        >
          닫기
        </MGButton>
      }
    >
          {/* 상담사 정보 */}
          <div className="mg-v2-info-grid mg-v2-mb-lg">
            <div className="mg-v2-info-item">
              <User size={16} className="mg-v2-icon-inline" />
              <span className="mg-v2-info-label">상담사</span>
              <span className="mg-v2-info-value">{consultantName || '정보 없음'}</span>
            </div>
            <div className="mg-v2-info-item">
              <Calendar size={16} className="mg-v2-icon-inline" />
              <span className="mg-v2-info-label">기간</span>
              <span className="mg-v2-info-value">{period || '정보 없음'}</span>
            </div>
          </div>

          {/* 내용 */}
          {loading ? (
            <div className="mg-v2-loading-overlay">
              <div className="mg-loading">로딩중...</div>
            </div>
          ) : error ? (
            <div className="mg-v2-alert mg-v2-alert--error">
              <AlertCircle size={20} className="mg-v2-icon-inline" />
              <p>{error}</p>
              <MGButton
                className="mg-v2-button mg-v2-button--primary mg-v2-mt-md"
                onClick={loadTaxDetails}
                variant="primary"
              >
                <RefreshCw size={20} className="mg-v2-icon-inline" />
                다시 시도
              </MGButton>
            </div>
          ) : taxDetails.length === 0 ? (
            <div className="mg-v2-empty-state">
              <Receipt size={48} />
              <p>세금 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title mg-v2-mb-md">세금 내역</h3>
              <div className="mg-v2-table-container">
                <table className="mg-v2-table">
                  <thead>
                    <tr>
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
                      <tr key={tax.id || index}>
                        <td>{getTaxTypeLabel(tax.taxType)}</td>
                        <td>{tax.taxName || '-'}</td>
                        <td>{formatTaxRate(tax.taxRate)}</td>
                        <td className="mg-v2-color-primary">{formatAmount(tax.taxableAmount)}원</td>
                        <td className="mg-v2-color-danger">{formatAmount(tax.taxAmount)}원</td>
                        <td>{tax.taxDescription || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="mg-v2-table-row--emphasized">
                      <td colSpan="4"><strong>총 세금</strong></td>
                      <td className="mg-v2-color-danger"><strong>{formatAmount(totalTaxAmount)}원</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
    </UnifiedModal>
  );
};

export default TaxDetailsModal;
