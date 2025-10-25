import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';
import { 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Calendar,
  Package
} from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/mindgarden-design-system.css';
import './ClientPaymentSessionsSection.css';

/**
 * 내담자 결제 내역 및 총회기수 섹션 컴포넌트
 * 디자인 시스템 적용 버전
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
    // userId가 없으면 호출하지 않음
    if (!userId) {
      return;
    }
    loadPaymentSessionsData();
  }, [userId]);

  const loadPaymentSessionsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // userId 체크
      if (!userId) {
        setIsLoading(false);
        return;
      }

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

  const getStatusClass = (status) => {
    if (!status) return 'secondary';
    
    const statusMap = {
      'CONFIRMED': 'warning',
      'APPROVED': 'success',
      'PENDING': 'info',
      'REJECTED': 'danger',
      'REFUNDED': 'secondary',
      'COMPLETED': 'success',
      'FAILED': 'danger',
      'CANCELLED': 'secondary'
    };
    
    return statusMap[status] || 'secondary';
  };

  const getStatusText = (status) => {
    if (!status) return '미결제';
    
    const statusTextMap = {
      'CONFIRMED': '입금확인',
      'APPROVED': '승인완료',
      'PENDING': '대기중',
      'REJECTED': '거부됨',
      'REFUNDED': '환불됨',
      'COMPLETED': '완료',
      'FAILED': '실패',
      'CANCELLED': '취소'
    };
    
    return statusTextMap[status] || status || '미결제';
  };

  if (isLoading) {
    return (
      <div className="payment-sessions-section">
        <UnifiedLoading text="결제 정보를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-sessions-section">
        <div className="payment-sessions-error">
          <div className="payment-sessions-error__icon">
            <Clock size={48} />
          </div>
          <p className="payment-sessions-error__text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-sessions-section">
      {/* 섹션 헤더 */}
      <div className="payment-sessions-header">
        <h2 className="payment-sessions-title">
          <CreditCard size={24} />
          결제 내역 및 회기 현황
        </h2>
      </div>

      {/* 회기 현황 요약 */}
      <div className="payment-sessions-stats">
        <div className="payment-stat-card payment-stat-card--primary">
          <div className="payment-stat-icon">
            <Package size={20} />
          </div>
          <div className="payment-stat-content">
            <div className="payment-stat-label">총 회기수</div>
            <div className="payment-stat-value">{paymentData.totalSessions}회</div>
          </div>
        </div>

        <div className="payment-stat-card payment-stat-card--success">
          <div className="payment-stat-icon">
            <CheckCircle size={20} />
          </div>
          <div className="payment-stat-content">
            <div className="payment-stat-label">사용한 회기</div>
            <div className="payment-stat-value">{paymentData.usedSessions}회</div>
          </div>
        </div>

        <div className="payment-stat-card payment-stat-card--warning">
          <div className="payment-stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="payment-stat-content">
            <div className="payment-stat-label">남은 회기</div>
            <div className="payment-stat-value">{paymentData.remainingSessions}회</div>
          </div>
        </div>

        <div className="payment-stat-card payment-stat-card--info">
          <div className="payment-stat-icon">
            <DollarSign size={20} />
          </div>
          <div className="payment-stat-content">
            <div className="payment-stat-label">총 결제금액</div>
            <div className="payment-stat-value">{formatCurrency(paymentData.totalAmount)}</div>
          </div>
        </div>
      </div>

      {/* 최근 결제 내역 */}
      {paymentData.recentPayments.length > 0 ? (
        <div className="payment-sessions-list">
          <h3 className="payment-sessions-subtitle">
            <Clock size={20} />
            최근 결제 내역
          </h3>
          <div className="payment-items">
            {paymentData.recentPayments.map((payment) => (
              <div key={payment.id} className="payment-item">
                <div className="payment-item__icon">
                  <CreditCard size={20} />
                </div>
                <div className="payment-item__content">
                  <div className="payment-item__header">
                    <h4 className="payment-item__package">{payment.packageName}</h4>
                    <span className={`mg-badge mg-badge-${getStatusClass(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </div>
                  <div className="payment-item__details">
                    <span className="payment-item__amount">
                      <DollarSign size={14} />
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className="payment-item__sessions">
                      <Package size={14} />
                      {payment.sessions}회
                    </span>
                    <span className="payment-item__date">
                      <Calendar size={14} />
                      {formatDate(payment.paymentDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="payment-sessions-empty">
          <div className="payment-sessions-empty__icon">
            <CreditCard size={48} />
          </div>
          <p className="payment-sessions-empty__text">아직 결제 내역이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default ClientPaymentSessionsSection;
