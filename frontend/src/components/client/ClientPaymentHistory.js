import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ClientPaymentHistory.css';

/**
 * 내담자 결제 내역 상세 페이지
 * 결제 내역, 패키지 정보, 환불 내역 등을 상세히 표시
 */
const ClientPaymentHistory = () => {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, completed, pending, refunded
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 기존 세션 확인

      // 사용자 정보 가져오기
      const userResponse = await apiGet('/api/auth/current-user');
      
      if (!userResponse || !userResponse.id) {
        throw new Error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      }
      
      const userId = userResponse.id;

      // 매핑 정보 가져오기 (결제 내역 포함)
      const mappingResponse = await apiGet(`/api/admin/mappings/client?clientId=${userId}`);
      const mappings = mappingResponse.data || [];

      // 상담 일정 가져오기 (상담일지가 아닌 기본 일정 정보만)
      const scheduleResponse = await apiGet(`/api/schedules?userId=${userId}&userRole=CLIENT`);
      const schedules = scheduleResponse.data || [];

      // 결제 내역 생성 (매핑 정보에서)
      const paymentHistory = mappings
        .filter(mapping => mapping.paymentDate)
        .map(mapping => ({
          id: mapping.id,
          packageName: mapping.packageName,
          amount: mapping.packagePrice,
          sessions: mapping.totalSessions,
          paymentDate: mapping.paymentDate,
          paymentMethod: mapping.paymentMethod,
          paymentReference: mapping.paymentReference,
          status: mapping.paymentStatus,
          consultant: mapping.consultant,
          createdAt: mapping.createdAt,
          adminApprovalDate: mapping.adminApprovalDate
        }))
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

      // 통계 계산
      const totalAmount = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const totalSessions = paymentHistory.reduce((sum, payment) => sum + (payment.sessions || 0), 0);
      const completedPayments = paymentHistory.filter(p => p.status === 'APPROVED').length;
      const pendingPayments = paymentHistory.filter(p => p.status === 'PENDING' || p.status === 'CONFIRMED').length;

      setPaymentData({
        paymentHistory,
        totalAmount,
        totalSessions,
        completedPayments,
        pendingPayments,
        mappings,
        schedules
      });
    } catch (error) {
      console.error('결제 데이터 로드 실패:', error);
      if (error.message.includes('로그인이 필요합니다')) {
        setError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      } else {
        setError('결제 데이터를 불러오는 중 오류가 발생했습니다.');
      }
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleHamburgerClick = (isOpen) => {
    setIsMenuOpen(isOpen);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return '#28a745';
      case 'CONFIRMED':
        return '#ffc107';
      case 'PENDING':
        return '#17a2b8';
      case 'REJECTED':
        return '#dc3545';
      case 'REFUNDED':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED':
        return '승인완료';
      case 'CONFIRMED':
        return '입금확인';
      case 'PENDING':
        return '대기중';
      case 'REJECTED':
        return '거부됨';
      case 'REFUNDED':
        return '환불됨';
      default:
        return status || '미결제';
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'CARD':
        return '카드';
      case 'BANK_TRANSFER':
        return '계좌이체';
      case 'CASH':
        return '현금';
      case 'VIRTUAL_ACCOUNT':
        return '가상계좌';
      case 'MOBILE':
        return '모바일결제';
      default:
        return method || '알 수 없음';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'CARD':
        return 'bi-credit-card';
      case 'BANK_TRANSFER':
        return 'bi-bank';
      case 'CASH':
        return 'bi-cash';
      case 'VIRTUAL_ACCOUNT':
        return 'bi-wallet2';
      case 'MOBILE':
        return 'bi-phone';
      default:
        return 'bi-question-circle';
    }
  };

  const filteredPayments = paymentData?.paymentHistory.filter(payment => {
    switch (filter) {
      case 'completed':
        return payment.status === 'APPROVED';
      case 'pending':
        return payment.status === 'PENDING' || payment.status === 'CONFIRMED';
      case 'refunded':
        return payment.status === 'REFUNDED';
      default:
        return true;
    }
  }) || [];

  if (isLoading) {
    return (
      <div className="client-payment-history">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p>결제 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-payment-history">
        <div className="error-container">
          <i className="bi bi-exclamation-triangle"></i>
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadPaymentData}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!paymentData || paymentData.paymentHistory.length === 0) {
    return (
      <div className="client-payment-history">
        <div className="no-data-container">
          <i className="bi bi-credit-card"></i>
          <h3>결제 내역이 없습니다</h3>
          <p>아직 결제한 내역이 없습니다.</p>
          <button className="btn btn-primary" onClick={() => navigate('/client/consultant-mapping')}>
            상담사 연결하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <SimpleLayout title="결제 내역">
      <div className="client-payment-history">
      
      {/* 햄버거 메뉴 드롭다운 */}
      {isMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          minWidth: '200px',
          padding: '8px 0'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e9ecef',
            fontWeight: '600',
            color: '#2c3e50',
            fontSize: '14px'
          }}>
            메뉴
          </div>
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
              gap: '8px',
              fontSize: '14px',
              color: '#2c3e50',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
              gap: '8px',
              fontSize: '14px',
              color: '#2c3e50',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
              gap: '8px',
              fontSize: '14px',
              color: '#2c3e50',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
              gap: '8px',
              fontSize: '14px',
              color: '#2c3e50',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => handleMenuAction('consultation-guide')}
          >
            <i className="bi bi-book"></i>
            상담 가이드
          </button>
        </div>
      )}

      {/* 결제 통계 */}
      <div className="payment-stats">
        <div className="stat-card total-amount">
          <div className="card-icon">
            <i className="bi bi-currency-dollar"></i>
          </div>
          <div className="card-content">
            <h3>총 결제 금액</h3>
            <p className="number">{formatCurrency(paymentData.totalAmount)}</p>
          </div>
        </div>

        <div className="stat-card total-sessions">
          <div className="card-icon">
            <i className="bi bi-calendar-check"></i>
          </div>
          <div className="card-content">
            <h3>총 구매 회기</h3>
            <p className="number">{paymentData.totalSessions}</p>
            <span className="unit">회</span>
          </div>
        </div>

        <div className="stat-card completed-payments">
          <div className="card-icon">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="card-content">
            <h3>완료된 결제</h3>
            <p className="number">{paymentData.completedPayments}</p>
            <span className="unit">건</span>
          </div>
        </div>

        <div className="stat-card pending-payments">
          <div className="card-icon">
            <i className="bi bi-clock"></i>
          </div>
          <div className="card-content">
            <h3>처리 중</h3>
            <p className="number">{paymentData.pendingPayments}</p>
            <span className="unit">건</span>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="filter-section">
        <h3>결제 내역 필터</h3>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            전체 ({paymentData.paymentHistory.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            완료 ({paymentData.completedPayments})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            처리중 ({paymentData.pendingPayments})
          </button>
          <button 
            className={`filter-btn ${filter === 'refunded' ? 'active' : ''}`}
            onClick={() => setFilter('refunded')}
          >
            환불 (0)
          </button>
        </div>
      </div>

      {/* 결제 내역 목록 */}
      <div className="payment-list">
        <h3><i className="bi bi-list-ul"></i> 결제 내역</h3>
        {filteredPayments.length > 0 ? (
          <div className="payment-items">
            {filteredPayments.map((payment, index) => (
              <div key={index} className="payment-item">
                <div className="payment-header">
                  <div className="payment-info">
                    <h4>{payment.packageName || '상담 패키지'}</h4>
                    <div className="payment-meta">
                      <span className="payment-date">
                        <i className="bi bi-calendar"></i>
                        {formatDate(payment.paymentDate)}
                      </span>
                      <span className="payment-method">
                        <i className={`bi ${getPaymentMethodIcon(payment.paymentMethod)}`}></i>
                        {getPaymentMethodText(payment.paymentMethod)}
                      </span>
                    </div>
                  </div>
                  <div className="payment-amount">
                    <span className="amount">{formatCurrency(payment.amount)}</span>
                    <span className="sessions">{payment.sessions}회</span>
                  </div>
                </div>

                <div className="payment-details">
                  <div className="detail-row">
                    <span className="label">상담사:</span>
                    <span className="value">{payment.consultant?.name || '미지정'}</span>
                  </div>
                  {payment.paymentReference && (
                    <div className="detail-row">
                      <span className="label">참조번호:</span>
                      <span className="value">{payment.paymentReference}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">결제 상태:</span>
                    <span 
                      className="status-badge"
                      style={{ color: getStatusColor(payment.status) }}
                    >
                      {getStatusText(payment.status)}
                    </span>
                  </div>
                  {payment.adminApprovalDate && (
                    <div className="detail-row">
                      <span className="label">승인일:</span>
                      <span className="value">{formatDate(payment.adminApprovalDate)}</span>
                    </div>
                  )}
                </div>

                {payment.status === 'PENDING' && (
                  <div className="payment-note">
                    <i className="bi bi-info-circle"></i>
                    <span>결제가 처리 중입니다. 승인 후 상담을 시작할 수 있습니다.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-payments">
            <i className="bi bi-inbox"></i>
            <p>해당 조건의 결제 내역이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 환불 정책 안내 */}
      <div className="refund-policy">
        <h3><i className="bi bi-shield-check"></i> 환불 정책</h3>
        <div className="policy-content">
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
    </SimpleLayout>
  );

export default ClientPaymentHistory;
