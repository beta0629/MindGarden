import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * 내담자 결제 내역 및 총회기수 섹션 컴포넌트
 */
const ClientPaymentSessionsSection = ({ userId }) => {
  const [paymentData, setPaymentData] = useState({
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0,
    totalAmount: 0,
    recentPayments: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 결제 및 회기 데이터 로드
  useEffect(() => {
    loadPaymentSessionsData();
  }, [userId]);

  const loadPaymentSessionsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 내담자의 매핑 정보 조회
      const mappingResponse = await apiGet(`/api/admin/mappings/client?clientId=${userId}`);
      
      if (mappingResponse.success && mappingResponse.data) {
        const mappings = mappingResponse.data;
        
        // 총 회기수 계산 (ACTIVE 상태의 매핑만)
        const activeMappings = mappings.filter(mapping => mapping.status === 'ACTIVE');
        const totalSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
        const usedSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.usedSessions || 0), 0);
        const remainingSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.remainingSessions || 0), 0);
        const totalAmount = mappings.reduce((sum, mapping) => sum + (mapping.packagePrice || 0), 0);

        // 최근 결제 내역 (최근 5개)
        const recentPayments = mappings
          .filter(mapping => mapping.paymentDate)
          .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
          .slice(0, 5)
          .map(mapping => ({
            id: mapping.id,
            packageName: mapping.packageName,
            amount: mapping.packagePrice,
            sessions: mapping.totalSessions,
            paymentDate: mapping.paymentDate,
            paymentMethod: mapping.paymentMethod,
            status: mapping.paymentStatus
          }));

        setPaymentData({
          totalSessions,
          usedSessions,
          remainingSessions,
          totalAmount,
          recentPayments
        });
      } else {
        setPaymentData({
          totalSessions: 0,
          usedSessions: 0,
          remainingSessions: 0,
          totalAmount: 0,
          recentPayments: []
        });
      }
    } catch (error) {
      console.error('결제 및 회기 데이터 로드 실패:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    if (!status) {
      return '#6c757d';
    }
    
    switch (status) {
      case 'CONFIRMED':
        return '#ffc107';
      case 'APPROVED':
        return '#28a745';
      case 'PENDING':
        return '#17a2b8';
      case 'REJECTED':
        return '#dc3545';
      case 'REFUNDED':
        return '#6f42c1';
      case 'COMPLETED':
        return '#28a745';
      case 'FAILED':
        return '#dc3545';
      case 'CANCELLED':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    if (!status) {
      return '미결제';
    }
    
    switch (status) {
      case 'CONFIRMED':
        return '입금확인';
      case 'APPROVED':
        return '승인완료';
      case 'PENDING':
        return '대기중';
      case 'REJECTED':
        return '거부됨';
      case 'REFUNDED':
        return '환불됨';
      case 'COMPLETED':
        return '완료';
      case 'FAILED':
        return '실패';
      case 'CANCELLED':
        return '취소';
      default:
        return status || '미결제';
    }
  };

  if (isLoading) {
    return (
      <div className="client-payment-sessions-section">
        <div className="section-header">
          <h3><i className="bi bi-credit-card"></i> 결제 내역 및 회기 현황</h3>
        </div>
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-payment-sessions-section">
        <div className="section-header">
          <h3><i className="bi bi-credit-card"></i> 결제 내역 및 회기 현황</h3>
        </div>
        <div className="error-container">
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle"></i> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-payment-sessions-section">
      <div className="section-header">
        <h3><i className="bi bi-credit-card"></i> 결제 내역 및 회기 현황</h3>
      </div>

      <div className="payment-sessions-content">
        {/* 회기 현황 요약 */}
        <div className="sessions-summary">
          <div className="summary-card">
            <div className="summary-item">
              <div className="summary-label">총 회기수</div>
              <div className="summary-value total">{paymentData.totalSessions}회</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">사용한 회기</div>
              <div className="summary-value used">{paymentData.usedSessions}회</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">남은 회기</div>
              <div className="summary-value remaining">{paymentData.remainingSessions}회</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">총 결제금액</div>
              <div className="summary-value amount">{formatCurrency(paymentData.totalAmount)}</div>
            </div>
          </div>
        </div>

        {/* 최근 결제 내역 */}
        {paymentData.recentPayments.length > 0 ? (
          <div className="recent-payments">
            <h5><i className="bi bi-clock-history"></i> 최근 결제 내역</h5>
            <div className="payments-list">
              {paymentData.recentPayments.map((payment) => (
                <div key={payment.id} className="payment-item">
                  <div className="payment-info">
                    <div className="payment-package">{payment.packageName}</div>
                    <div className="payment-details">
                      <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                      <span className="payment-sessions">{payment.sessions}회</span>
                      <span className="payment-date">{formatDate(payment.paymentDate)}</span>
                    </div>
                  </div>
                  <div className="payment-status">
                    <span 
                      className="status-badge"
                      style={{ color: getStatusColor(payment.status) }}
                    >
                      {getStatusText(payment.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-payments">
            <div className="no-payments-content">
              <i className="bi bi-credit-card-2-front"></i>
              <p>아직 결제 내역이 없습니다.</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .client-payment-sessions-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f8f9fa;
        }

        .section-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .section-header h3 i {
          margin-right: 8px;
          color: #007bff;
        }

        .loading-container {
          text-align: center;
          padding: 40px 0;
        }

        .error-container {
          padding: 20px 0;
        }

        .sessions-summary {
          margin-bottom: 24px;
        }

        .summary-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }

        .summary-item {
          text-align: center;
        }

        .summary-label {
          font-size: 0.875rem;
          color: #6c757d;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .summary-value.total {
          color: #007bff;
        }

        .summary-value.used {
          color: #28a745;
        }

        .summary-value.remaining {
          color: #ffc107;
        }

        .summary-value.amount {
          color: #6f42c1;
        }

        .recent-payments h5 {
          color: #2c3e50;
          margin-bottom: 16px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .recent-payments h5 i {
          margin-right: 8px;
          color: #007bff;
        }

        .payments-list {
          space-y: 12px;
        }

        .payment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .payment-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .payment-info {
          flex: 1;
        }

        .payment-package {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .payment-details {
          display: flex;
          gap: 16px;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .payment-amount {
          font-weight: 600;
          color: #6f42c1;
        }

        .payment-sessions {
          color: #007bff;
        }

        .payment-date {
          color: #6c757d;
        }

        .payment-status {
          margin-left: 16px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(0, 0, 0, 0.05);
        }

        .no-payments {
          text-align: center;
          padding: 40px 20px;
        }

        .no-payments-content i {
          font-size: 3rem;
          color: #dee2e6;
          margin-bottom: 16px;
        }

        .no-payments-content p {
          color: #6c757d;
          margin-bottom: 20px;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .summary-card {
            grid-template-columns: repeat(2, 1fr);
          }

          .payment-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .payment-details {
            flex-direction: column;
            gap: 4px;
          }

          .payment-status {
            margin-left: 0;
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientPaymentSessionsSection;
