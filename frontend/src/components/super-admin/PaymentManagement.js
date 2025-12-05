import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import MGCard from '../common/MGCard';
import { Button } from '../ui/Button/Button';
import { API_BASE_URL } from '../../constants/api';
import { apiGet } from '../../utils/ajax';
import './PaymentManagement.css';
import notificationManager from '../../utils/notification';

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
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [paymentStatusOptions, setPaymentStatusOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [paymentGatewayOptions, setPaymentGatewayOptions] = useState([]);
  const [loadingGatewayCodes, setLoadingGatewayCodes] = useState(false);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [loadingMethodCodes, setLoadingMethodCodes] = useState(false);

  useEffect(() => {
    loadPayments();
    loadStatistics();
  }, [filters, pagination.currentPage]);

  // 결제 상태 코드 로드
  useEffect(() => {
    const loadPaymentStatusCodes = async () => {
      try {
        setLoadingCodes(true);
        const response = await apiGet('/api/v1/common-codes/PAYMENT_STATUS');
        if (response && response.length > 0) {
          const options = response.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode,
            description: code.codeDescription
          }));
          setPaymentStatusOptions(options);
        }
      } catch (error) {
        console.error('결제 상태 코드 로드 실패:', error);
        // 실패 시 기본값 설정
        setPaymentStatusOptions([
          { value: 'PENDING', label: '대기중', icon: '⏳', color: 'var(--mg-warning-500)', description: '결제 대기 중' },
          { value: 'PROCESSING', label: '처리중', icon: '🔄', color: 'var(--mg-primary-500)', description: '결제 처리 중' },
          { value: 'APPROVED', label: '승인됨', icon: '✅', color: 'var(--mg-success-500)', description: '결제 승인 완료' },
          { value: 'FAILED', label: '실패', icon: '❌', color: 'var(--mg-error-500)', description: '결제 실패' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
          { value: 'CANCELLED', label: '취소됨', icon: '🚫', color: '#6b7280', description: '결제 취소' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f97316 -> var(--mg-custom-f97316)
          { value: 'REFUNDED', label: '환불됨', icon: '↩️', color: '#f97316', description: '결제 환불' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
          { value: 'EXPIRED', label: '만료됨', icon: '⏰', color: '#374151', description: '결제 만료' },
          { value: 'PARTIAL_REFUND', label: '부분환불', icon: '↩️', color: 'var(--mg-warning-500)', description: '부분 환불' }
        ]);
      } finally {
        setLoadingCodes(false);
      }
    };

    loadPaymentStatusCodes();
  }, []);

  // 결제 게이트웨이 코드 로드
  const loadPaymentGatewayCodes = useCallback(async () => {
    try {
      setLoadingGatewayCodes(true);
      const response = await apiGet('/api/v1/common-codes/PAYMENT_METHOD');
      if (response && response.length > 0) {
        setPaymentGatewayOptions(response.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        })));
      }
    } catch (error) {
      console.error('결제 게이트웨이 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setPaymentGatewayOptions([
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #0064FF -> var(--mg-custom-0064FF)
        { value: 'TOSS', label: '토스페이먼츠', icon: '💙', color: '#0064FF', description: '토스페이먼츠 결제' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #34495E -> var(--mg-custom-34495E)
        { value: 'IAMPORT', label: '아임포트', icon: '🏦', color: '#34495E', description: '아임포트 결제' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FEE500 -> var(--mg-custom-FEE500)
        { value: 'KAKAO', label: '카카오페이', icon: '💛', color: '#FEE500', description: '카카오페이 결제' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #03C75A -> var(--mg-custom-03C75A)
        { value: 'NAVER', label: '네이버페이', icon: '💚', color: '#03C75A', description: '네이버페이 결제' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #0070BA -> var(--mg-custom-0070BA)
        { value: 'PAYPAL', label: '페이팔', icon: '💳', color: '#0070BA', description: '페이팔 결제' }
      ]);
    } finally {
      setLoadingGatewayCodes(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentGatewayCodes();
  }, [loadPaymentGatewayCodes]);

  // 결제 방법 코드 로드
  const loadPaymentMethodCodes = useCallback(async () => {
    try {
      setLoadingMethodCodes(true);
      const response = await apiGet('/api/v1/common-codes/PAYMENT_METHOD');
      if (response && response.length > 0) {
        setPaymentMethodOptions(response.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        })));
      }
    } catch (error) {
      console.error('결제 방법 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setPaymentMethodOptions([
        { value: 'CARD', label: '카드', icon: '💳', color: 'var(--mg-primary-500)', description: '신용카드/체크카드 결제' },
        { value: 'BANK_TRANSFER', label: '계좌이체', icon: '🏦', color: 'var(--mg-success-500)', description: '은행 계좌 이체' },
        { value: 'VIRTUAL_ACCOUNT', label: '가상계좌', icon: '🏧', color: 'var(--mg-purple-500)', description: '가상계좌 결제' },
        { value: 'MOBILE', label: '모바일결제', icon: '📱', color: 'var(--mg-warning-500)', description: '모바일 결제' },
        { value: 'CASH', label: '현금', icon: '💵', color: 'var(--mg-warning-500)', description: '현금 결제' }
      ]);
    } finally {
      setLoadingMethodCodes(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentMethodCodes();
  }, [loadPaymentMethodCodes]);

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

  // 실제 서비스 기능들
  const exportPayments = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        export: 'true',
        format: 'excel'
      });

      const response = await fetch(`${API_BASE_URL}/api/payments/export?${params}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notificationManager.show('결제 데이터가 성공적으로 내보내졌습니다.', 'info');
      
    } catch (error) {
      console.error('데이터 내보내기 실패:', error);
      notificationManager.show(`데이터 내보내기 실패: ${error.message}`, 'info');
    }
  };

  const showPaymentAnalytics = () => {
    // 결제 분석 모달 또는 페이지로 이동
    notificationManager.show('결제 분석 기능은 개발 중입니다.', 'info');
  };

  const handleBulkAction = async (action, selectedPayments) => {
    if (!selectedPayments || selectedPayments.length === 0) {
      notificationManager.show('선택된 결제가 없습니다.', 'info');
      return;
    }

    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(
        `선택된 ${selectedPayments.length}건의 결제를 ${action === 'approve' ? '승인' : action === 'refund' ? '환불' : '취소'}하시겠습니까?`,
        resolve
      );
    });

    if (!confirmed) return;

    try {
      const promises = selectedPayments.map(paymentId => {
        const endpoint = action === 'refund' 
          ? `${API_BASE_URL}/api/payments/${paymentId}/refund`
          : `${API_BASE_URL}/api/payments/${paymentId}/status`;
        
        const body = action === 'refund' 
          ? { amount: payments.find(p => p.id === paymentId)?.amount }
          : { status: action === 'approve' ? 'APPROVED' : 'CANCELLED' };

        return fetch(endpoint, {
          method: action === 'refund' ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(body)
        });
      });

      const responses = await Promise.all(promises);
      const failedCount = responses.filter(r => !r.ok).length;
      
      if (failedCount === 0) {
        notificationManager.show('모든 작업이 성공적으로 완료되었습니다.', 'info');
      } else {
        notificationManager.show(`${responses.length - failedCount}건 성공, ${failedCount}건 실패`, 'info');
      }
      
      loadPayments();
      loadStatistics();
      
    } catch (error) {
      console.error('일괄 작업 실패:', error);
      notificationManager.show(`일괄 작업 실패: ${error.message}`, 'info');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const handleSelectPayment = (paymentId, checked) => {
    if (checked) {
      setSelectedPayments(prev => [...prev, paymentId]);
    } else {
      setSelectedPayments(prev => prev.filter(id => id !== paymentId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPayments(payments.map(p => p.id));
    } else {
      setSelectedPayments([]);
    }
  };

  const getStatusBadge = (status) => {
    // 동적으로 로드된 결제 상태 옵션에서 찾기
    const statusOption = paymentStatusOptions.find(option => option.value === status);
    
    if (statusOption) {
      return (
        <span className="badge" data-badge-color={statusOption.color}>
          {statusOption.icon} {statusOption.label}
        </span>
      );
    }
    
    // 기본값
    return (
      <span className="badge badge-secondary">
        ❓ {status}
      </span>
    );
  };

  if (loading) {
    return (
      <SimpleLayout title="결제 관리">
        <UnifiedLoading type="page" text="결제 내역을 불러오는 중..." />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="결제 관리">
      <div className="payment-management">
        <div className="payment-header">
          <h1>결제 관리</h1>
          <div className="header-actions">
            <button 
              className="btn btn-success"
              onClick={() => exportPayments()}
            >
              데이터 내보내기
            </button>
            <button 
              className="btn btn-info"
              onClick={() => showPaymentAnalytics()}
            >
              결제 분석
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
              disabled={loadingCodes}
            >
              <option value="all">전체</option>
              {paymentStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label} ({option.value})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>결제 방법</label>
            <select 
              value={filters.method}
              onChange={(e) => handleFilterChange('method', e.target.value)}
              disabled={loadingMethodCodes}
            >
              <option value="all">전체</option>
              {paymentMethodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>결제 대행사</label>
            <select 
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
              disabled={loadingGatewayCodes}
            >
              <option value="all">전체</option>
              {paymentGatewayOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
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

        {/* 일괄 작업 도구 */}
        {selectedPayments.length > 0 && (
          <div className="bulk-actions">
            <div className="bulk-info">
              {selectedPayments.length}건 선택됨
            </div>
            <div className="bulk-buttons">
              <button 
                className="btn btn-success btn-sm"
                onClick={() => handleBulkAction('approve', selectedPayments)}
              >
                일괄 승인
              </button>
              <button 
                className="btn btn-warning btn-sm"
                onClick={() => handleBulkAction('cancel', selectedPayments)}
              >
                일괄 취소
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => handleBulkAction('refund', selectedPayments)}
              >
                일괄 환불
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedPayments([])}
              >
                선택 해제
              </button>
            </div>
          </div>
        )}

        {/* 결제 목록 카드 (표준화 원칙: 테이블 → 카드 전환) */}
        <div className="payment-list">
          {/* 전체 선택 체크박스 */}
          {payments.length > 0 && (
            <div className="mg-payment-select-all">
              <label className="mg-payment-select-all__label">
                <input
                  type="checkbox"
                  checked={selectedPayments.length === payments.length && payments.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="mg-payment-select-all__checkbox"
                />
                <span>전체 선택</span>
              </label>
            </div>
          )}
          
          {/* 결제 카드 그리드 */}
          <div className="mg-payment-cards-grid">
            {payments.map((payment) => (
              <MGCard 
                key={payment.id}
                variant="default"
                className={`mg-payment-card ${selectedPayments.includes(payment.id) ? 'mg-payment-card--selected' : ''}`}
              >
                <div className="mg-payment-card__header">
                  <label className="mg-payment-card__checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={(e) => handleSelectPayment(payment.id, e.target.checked)}
                      className="mg-payment-card__checkbox"
                    />
                  </label>
                  <div className="mg-payment-card__id-section">
                    <div className="mg-payment-card__payment-id">{payment.paymentId}</div>
                    <div className="mg-payment-card__order-id">주문: {payment.orderId}</div>
                  </div>
                </div>
                
                <div className="mg-payment-card__body">
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">금액</span>
                    <span className="mg-payment-card__value mg-payment-card__value--amount">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">상태</span>
                    <span className="mg-payment-card__value">
                      {getStatusBadge(payment.status)}
                    </span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">결제 방법</span>
                    <span className="mg-payment-card__value">{payment.method || '-'}</span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">대행사</span>
                    <span className="mg-payment-card__value">{payment.provider || '-'}</span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">결제자</span>
                    <span className="mg-payment-card__value">{payment.payerId || '-'}</span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">생성일</span>
                    <span className="mg-payment-card__value">{formatDate(payment.createdAt)}</span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">승인일</span>
                    <span className="mg-payment-card__value">
                      {payment.approvedAt ? formatDate(payment.approvedAt) : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="mg-payment-card__footer">
                  <div className="mg-payment-card__actions">
                    {payment.status === 'PENDING' && (
                      <Button
                        variant="success"
                        size="small"
                        onClick={() => handleStatusUpdate(payment.paymentId, 'APPROVED')}
                        preventDoubleClick={true}
                      >
                        승인
                      </Button>
                    )}
                    {payment.status === 'PENDING' && (
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleStatusUpdate(payment.paymentId, 'CANCELLED')}
                        preventDoubleClick={true}
                      >
                        취소
                      </Button>
                    )}
                    {payment.status === 'APPROVED' && (
                      <Button
                        variant="warning"
                        size="small"
                        onClick={() => handleRefund(payment.paymentId, payment.amount)}
                        preventDoubleClick={true}
                      >
                        환불
                      </Button>
                    )}
                  </div>
                </div>
              </MGCard>
            ))}
          </div>
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
