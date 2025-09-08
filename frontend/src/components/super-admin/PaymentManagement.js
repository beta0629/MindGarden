import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import { API_BASE_URL } from '../../constants/api';
import './PaymentManagement.css';

/**
 * 수퍼어드민 결제 관리 컴포넌트
 * - 결제 내역 조회 및 관리
 * - 결제 통계 및 분석
 * - 결제 상태 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    provider: 'all',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
  });

  useEffect(() => {
    loadPayments();
    loadStatistics();
  }, [filters, pagination.currentPage]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage,
        size: pagination.size,
        ...filters
      });

      const response = await fetch(`${API_BASE_URL}/api/payments?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.data || []);
        setPagination(prev => ({
          ...prev,
          totalPages: data.totalPages || 0,
          totalElements: data.totalElements || 0
        }));
      } else {
        throw new Error('결제 목록 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('결제 목록 로드 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: filters.endDate || new Date().toISOString()
      });

      const response = await fetch(`${API_BASE_URL}/api/payments/statistics?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.data || {});
      }
    } catch (error) {
      console.error('결제 통계 로드 실패:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 0
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  const handleStatusUpdate = async (paymentId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/status?status=${status}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        loadPayments();
        loadStatistics();
      } else {
        throw new Error('결제 상태 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('결제 상태 업데이트 실패:', error);
      setError(error.message);
    }
  };

  const handleRefund = async (paymentId, amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: amount,
          reason: '관리자 환불'
        })
      });

      if (response.ok) {
        loadPayments();
        loadStatistics();
      } else {
        throw new Error('환불 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('환불 처리 실패:', error);
      setError(error.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  // 테스트 함수들
  const testCreatePayment = async () => {
    try {
      const paymentRequest = {
        orderId: `TEST_ORDER_${Date.now()}`,
        amount: 100000,
        method: 'CARD',
        provider: 'TOSS',
        payerId: 1,
        recipientId: 1,
        branchId: 1,
        description: '테스트 결제 - 실제 데이터',
        timeoutMinutes: 30,
        successUrl: 'http://localhost:3000/payment/success',
        failUrl: 'http://localhost:3000/payment/fail',
        cancelUrl: 'http://localhost:3000/payment/cancel'
      };

      const response = await fetch(`${API_BASE_URL}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(paymentRequest)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      alert(`테스트 결제 생성 성공!\n결제 ID: ${result.data?.paymentId}\n주문 ID: ${result.data?.orderId}`);
      
      // 결제 목록 새로고침
      loadPayments();
      loadStatistics();
      
    } catch (error) {
      console.error('테스트 결제 생성 실패:', error);
      alert(`테스트 결제 생성 실패: ${error.message}`);
    }
  };

  const testPaymentScenarios = async () => {
    try {
      // 여러 시나리오 테스트
      const scenarios = [
        { amount: 50000, method: 'CARD', provider: 'TOSS', description: '카드 결제 테스트' },
        { amount: 100000, method: 'BANK_TRANSFER', provider: 'KAKAO', description: '계좌이체 테스트' },
        { amount: 200000, method: 'CARD', provider: 'KAKAO', description: '간편결제 테스트' }
      ];

      for (const scenario of scenarios) {
        const paymentRequest = {
          orderId: `SCENARIO_${Date.now()}_${scenario.method}`,
          amount: scenario.amount,
          method: scenario.method,
          provider: scenario.provider,
          payerId: 1,
          recipientId: 1,
          branchId: 1,
          description: scenario.description,
          timeoutMinutes: 30,
          successUrl: 'http://localhost:3000/payment/success',
          failUrl: 'http://localhost:3000/payment/fail',
          cancelUrl: 'http://localhost:3000/payment/cancel'
        };

        const response = await fetch(`${API_BASE_URL}/api/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(paymentRequest)
        });
        
        if (response.ok) {
          console.log(`${scenario.description} 성공`);
        } else {
          console.error(`${scenario.description} 실패`);
        }
      }
      
      alert('시나리오 테스트 완료!');
      
      // 결제 목록 새로고침
      loadPayments();
      loadStatistics();
      
    } catch (error) {
      console.error('시나리오 테스트 실패:', error);
      alert(`시나리오 테스트 실패: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { text: '대기중', class: 'badge-warning' },
      'PROCESSING': { text: '처리중', class: 'badge-info' },
      'APPROVED': { text: '승인됨', class: 'badge-success' },
      'FAILED': { text: '실패', class: 'badge-danger' },
      'CANCELLED': { text: '취소됨', class: 'badge-secondary' },
      'REFUNDED': { text: '환불됨', class: 'badge-warning' },
      'EXPIRED': { text: '만료됨', class: 'badge-dark' }
    };

    const statusInfo = statusMap[status] || { text: status, class: 'badge-light' };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  if (loading) {
    return (
      <SimpleLayout>
        <div className="payment-management">
          <div className="loading">로딩 중...</div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="payment-management">
        <div className="payment-header">
          <h1>결제 관리</h1>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => testCreatePayment()}
            >
              테스트 결제 생성
            </button>
            <button 
              className="btn btn-info"
              onClick={() => testPaymentScenarios()}
            >
              시나리오 테스트
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => loadPayments()}
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-title">총 결제 금액</div>
            <div className="stat-value">
              {formatCurrency(statistics.totalAmount || 0)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">승인된 결제</div>
            <div className="stat-value">
              {statistics.statusCounts?.APPROVED || 0}건
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">대기 중인 결제</div>
            <div className="stat-value">
              {statistics.statusCounts?.PENDING || 0}건
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">환불된 결제</div>
            <div className="stat-value">
              {statistics.statusCounts?.REFUNDED || 0}건
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="filters">
          <div className="filter-group">
            <label>결제 상태</label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">전체</option>
              <option value="PENDING">대기중</option>
              <option value="PROCESSING">처리중</option>
              <option value="APPROVED">승인됨</option>
              <option value="FAILED">실패</option>
              <option value="CANCELLED">취소됨</option>
              <option value="REFUNDED">환불됨</option>
              <option value="EXPIRED">만료됨</option>
            </select>
          </div>

          <div className="filter-group">
            <label>결제 방법</label>
            <select 
              value={filters.method}
              onChange={(e) => handleFilterChange('method', e.target.value)}
            >
              <option value="all">전체</option>
              <option value="CARD">카드</option>
              <option value="BANK_TRANSFER">계좌이체</option>
              <option value="VIRTUAL_ACCOUNT">가상계좌</option>
              <option value="MOBILE">모바일결제</option>
              <option value="CASH">현금</option>
            </select>
          </div>

          <div className="filter-group">
            <label>결제 대행사</label>
            <select 
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
            >
              <option value="all">전체</option>
              <option value="TOSS">토스페이먼츠</option>
              <option value="IAMPORT">아임포트</option>
              <option value="KAKAO">카카오페이</option>
              <option value="NAVER">네이버페이</option>
              <option value="PAYPAL">페이팔</option>
            </select>
          </div>

          <div className="filter-group">
            <label>시작 날짜</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>종료 날짜</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* 결제 목록 */}
        <div className="payment-list">
          <div className="table-container">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>결제 ID</th>
                  <th>주문 ID</th>
                  <th>금액</th>
                  <th>상태</th>
                  <th>방법</th>
                  <th>대행사</th>
                  <th>결제자</th>
                  <th>생성일</th>
                  <th>승인일</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.paymentId}</td>
                    <td>{payment.orderId}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td>{payment.method}</td>
                    <td>{payment.provider}</td>
                    <td>{payment.payerId}</td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>{payment.approvedAt ? formatDate(payment.approvedAt) : '-'}</td>
                    <td>
                      <div className="action-buttons">
                        {payment.status === 'PENDING' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleStatusUpdate(payment.paymentId, 'APPROVED')}
                          >
                            승인
                          </button>
                        )}
                        {payment.status === 'PENDING' && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleStatusUpdate(payment.paymentId, 'CANCELLED')}
                          >
                            취소
                          </button>
                        )}
                        {payment.status === 'APPROVED' && (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleRefund(payment.paymentId, payment.amount)}
                          >
                            환불
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="pagination">
            <button
              className="btn btn-sm"
              disabled={pagination.currentPage === 0}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              이전
            </button>
            <span>
              {pagination.currentPage + 1} / {pagination.totalPages} 
              (총 {pagination.totalElements}건)
            </span>
            <button
              className="btn btn-sm"
              disabled={pagination.currentPage >= pagination.totalPages - 1}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              다음
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default PaymentManagement;
