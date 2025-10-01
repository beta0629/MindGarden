import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ClientPaymentHistory.css';

const ClientPaymentHistory = () => {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userResponse = await apiGet('/api/auth/current-user');
      if (!userResponse || !userResponse.id) {
        throw new Error('로그인이 필요합니다.');
      }

      const userId = userResponse.id;
      const mappingsResponse = await apiGet(`/api/admin/mappings/client?clientId=${userId}`);
      const mappings = mappingsResponse.data || [];

      const totalAmount = mappings.reduce((sum, mapping) => sum + (mapping.packagePrice || 0), 0);
      const totalSessions = mappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
      const completedPayments = mappings.filter(mapping => mapping.paymentStatus === 'CONFIRMED').length;
      const pendingPayments = mappings.filter(mapping => mapping.paymentStatus === 'PENDING').length;

      setPaymentData({
        totalAmount,
        totalSessions,
        completedPayments,
        pendingPayments,
        mappings: mappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });

    } catch (err) {
      console.error('결제 데이터 로드 실패:', err);
      setError(err.message || '결제 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuAction = (action) => {
    setIsMenuOpen(false);
    switch (action) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'session-management':
        navigate('/client/session-management');
        break;
      case 'payment-history':
        navigate('/client/payment-history');
        break;
      case 'consultation-guide':
        alert('상담 가이드 페이지는 준비 중입니다.');
        break;
      default:
        break;
    }
  };

  const handleHamburgerClick = (isOpen) => {
    setIsMenuOpen(isOpen);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return '결제완료';
      case 'PENDING':
        return '결제대기';
      case 'REJECTED':
        return '결제실패';
      case 'REFUNDED':
        return '환불완료';
      default:
        return '미결제';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return '#28a745';
      case 'PENDING':
        return '#ffc107';
      case 'REJECTED':
        return '#dc3545';
      case 'REFUNDED':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getMethodText = (method) => {
    switch (method) {
      case 'CARD':
        return '카드';
      case 'CASH':
        return '현금';
      case 'BANK_TRANSFER':
        return '계좌이체';
      default:
        return '미지정';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const filteredMappings = paymentData?.mappings?.filter(mapping => {
    if (filter === 'all') return true;
    return mapping.paymentStatus === filter.toUpperCase();
  }) || [];

  if (isLoading) {
    return (
      <SimpleLayout title="결제 내역">
        <div className="client-payment-history">
          <div className="loading-container">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <p>결제 데이터를 불러오는 중...</p>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout title="결제 내역">
        <div className="client-payment-history">
          <div className="error-container">
            <div className="error-icon">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3>오류가 발생했습니다</h3>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={loadPaymentData}
            >
              다시 시도
            </button>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  if (!paymentData || paymentData.mappings.length === 0) {
    return (
      <SimpleLayout title="결제 내역">
        <div className="client-payment-history">
          <div className="no-data-container">
            <div className="no-data-icon">
              <i className="bi bi-credit-card"></i>
            </div>
            <h3>결제 내역이 없습니다</h3>
            <p>아직 결제한 패키지가 없습니다.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              대시보드로 이동
            </button>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="결제 내역">
      <div className="client-payment-history">
        {/* 페이지 헤드라인 */}
        <div className="client-payment-header">
          <h1 className="client-payment-title">
            <i className="bi bi-credit-card client-payment-title-icon"></i>
            결제 내역
          </h1>
          <p className="client-payment-subtitle">
            결제 내역과 패키지 정보를 확인하세요
          </p>
        </div>

        {/* 햄버거 메뉴 드롭다운 */}
        {isMenuOpen && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px'
          }}>
            <div style={{ padding: '8px 0' }}>
              <button 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => handleMenuAction('dashboard')}
              >
                <i className="bi bi-house"></i>
                대시보드
              </button>
              <button 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => handleMenuAction('session-management')}
              >
                <i className="bi bi-clock-history"></i>
                회기 관리
              </button>
              <button 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => handleMenuAction('payment-history')}
              >
                <i className="bi bi-credit-card"></i>
                결제 내역
              </button>
              <button 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => handleMenuAction('consultation-guide')}
              >
                <i className="bi bi-book"></i>
                상담 가이드
              </button>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">
              <i className="bi bi-currency-dollar"></i>
            </div>
            <div className="stat-content">
              <h3>총 결제금액</h3>
              <p className="stat-number">{formatCurrency(paymentData.totalAmount)}</p>
            </div>
          </div>

          <div className="stat-card sessions">
            <div className="stat-icon">
              <i className="bi bi-calendar-check"></i>
            </div>
            <div className="stat-content">
              <h3>총 회기</h3>
              <p className="stat-number">{paymentData.totalSessions}</p>
              <span className="stat-unit">회</span>
            </div>
          </div>

          <div className="stat-card completed">
            <div className="stat-icon">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>결제완료</h3>
              <p className="stat-number">{paymentData.completedPayments}</p>
              <span className="stat-unit">건</span>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">
              <i className="bi bi-clock"></i>
            </div>
            <div className="stat-content">
              <h3>결제대기</h3>
              <p className="stat-number">{paymentData.pendingPayments}</p>
              <span className="stat-unit">건</span>
            </div>
          </div>
        </div>

        {/* 필터 버튼 */}
        <div className="filter-section">
          <h3>결제 내역</h3>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              전체
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              결제완료
            </button>
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              결제대기
            </button>
            <button 
              className={`filter-btn ${filter === 'refunded' ? 'active' : ''}`}
              onClick={() => setFilter('refunded')}
            >
              환불완료
            </button>
          </div>
        </div>

        {/* 결제 내역 목록 */}
        <div className="payment-list">
          {filteredMappings.map((mapping, index) => (
            <div key={mapping.id || index} className="payment-item">
              <div className="payment-header">
                <div className="payment-title">
                  <h4>{mapping.packageName || '상담 패키지'}</h4>
                  <span className="payment-amount">{formatCurrency(mapping.packagePrice || 0)}</span>
                </div>
                <div 
                  className="payment-status"
                  data-status-color={getStatusColor(mapping.paymentStatus)}
                >
                  {getStatusText(mapping.paymentStatus)}
                </div>
              </div>

              <div className="payment-details">
                <div className="detail-row">
                  <span className="detail-label">회기 수:</span>
                  <span className="detail-value">{mapping.totalSessions || 0}회</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">상담사:</span>
                  <span className="detail-value">{mapping.consultant?.consultantName || '미지정'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">결제일:</span>
                  <span className="detail-value">{formatDate(mapping.paymentDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">결제방법:</span>
                  <span className="detail-value">{getMethodText(mapping.paymentMethod)}</span>
                </div>
                {mapping.paymentReference && (
                  <div className="detail-row">
                    <span className="detail-label">참조번호:</span>
                    <span className="detail-value">{mapping.paymentReference}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 환불 정책 */}
        <div className="refund-policy">
          <h3>환불 정책</h3>
          <div className="policy-list">
            <div className="policy-item">
              <i className="bi bi-check-circle"></i>
              <span>사용하지 않은 회기는 100% 환불 가능합니다.</span>
            </div>
            <div className="policy-item">
              <i className="bi bi-clock"></i>
              <span>환불 신청은 결제일로부터 7일 이내에 가능합니다.</span>
            </div>
            <div className="policy-item">
              <i className="bi bi-phone"></i>
              <span>환불 문의는 고객센터로 연락해주세요.</span>
            </div>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ClientPaymentHistory;
