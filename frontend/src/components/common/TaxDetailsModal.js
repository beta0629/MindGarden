import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Receipt, XCircle, User, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import UnifiedLoading from './UnifiedLoading';
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

  // 총 세금 계산
  const totalTaxAmount = Array.isArray(taxDetails) 
    ? taxDetails.reduce((sum, tax) => sum + (tax.taxAmount || 0), 0)
    : 0;

  if (!isOpen) return null;

  const portalTarget = document.body || document.createElement('div');

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <Receipt size={28} className="mg-v2-modal-title-icon" />
            <h2 className="mg-v2-modal-title">세금 내역 상세</h2>
          </div>
          <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
            <XCircle size={24} />
          </button>
        </div>

        <div className="mg-v2-modal-body">
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
              <UnifiedLoading variant="pulse" size="large" text="세금 내역을 불러오는 중..." type="inline" />
            </div>
          ) : error ? (
            <div className="mg-v2-alert mg-v2-alert--error">
              <AlertCircle size={20} className="mg-v2-icon-inline" />
              <p>{error}</p>
              <button 
                className="mg-v2-button mg-v2-button--primary mg-v2-mt-md"
                onClick={loadTaxDetails}
              >
                <RefreshCw size={20} className="mg-v2-icon-inline" />
                다시 시도
              </button>
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
        </div>

        <div className="mg-v2-modal-footer">
          <button 
            className="mg-v2-button mg-v2-button--primary"
            onClick={onClose}
          >
            <XCircle size={20} className="mg-v2-icon-inline" />
            닫기
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default TaxDetailsModal;
