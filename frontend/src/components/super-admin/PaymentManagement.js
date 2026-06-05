import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import StatusBadge from '../common/StatusBadge';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import MGCard from '../common/MGCard';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ActionBar from '../common/ActionBar';
import ActionBarButton from '../common/ActionBarButton';
import { API_BASE_URL } from '../../constants/api';
import { apiGet } from '../../utils/ajax';
import './PaymentManagement.css';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES = '/api/v1/common-codes?codeGroup=PAYMENT_STATUS';
const API_COMMON_CODES_GROUPS_PAYMENT_METHOD = '/api/v1/common-codes/groups/PAYMENT_METHOD';


/**
 * 수퍼어드민 결제 관리 컴포넌트
/**
 * - 결제 내역 조회 및 관리
/**
 * - 결제 통계 및 분석
/**
 * - 결제 상태 관리
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-01-05
 */

const PAYMENT_PAGE_TITLE_ID = 'payment-management-title';

const PaymentManagement = () => {
  const { t } = useTranslation();
  const [confirm, ConfirmModal] = useConfirm();
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

  useEffect(() => {
    const loadPaymentStatusCodes = async() => {
      try {
        setLoadingCodes(true);
        const response = await apiGet(API_COMMON_CODES);
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
        setPaymentStatusOptions([
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'PENDING', label: '대기중', icon: '⏳', color: 'var(--mg-warning-500)', description: '결제 대기 중' },
          { value: 'PROCESSING', label: '처리중', icon: '🔄', color: 'var(--mg-primary-500)', description: '결제 처리 중' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'APPROVED', label: '승인됨', icon: '✅', color: 'var(--mg-success-500)', description: '결제 승인 완료' },
          { value: 'FAILED', label: '실패', icon: '❌', color: 'var(--mg-error-500)', description: '결제 실패' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'CANCELLED', label: '취소됨', icon: '🚫', color: 'var(--mg-gray-500)', description: '결제 취소' },
          { value: 'REFUNDED', label: '환불됨', icon: '↩️', color: 'var(--mg-warning-500)', description: '결제 환불' },
          { value: 'EXPIRED', label: '만료됨', icon: '⏰', color: 'var(--mg-gray-600)', description: '결제 만료' },
          { value: 'PARTIAL_REFUND', label: '부분환불', icon: '↩️', color: 'var(--mg-warning-500)', description: '부분 환불' }
        ]);
      } finally {
        setLoadingCodes(false);
      }
    };

    loadPaymentStatusCodes();
  }, []);

  const loadPaymentGatewayCodes = useCallback(async() => {
    try {
      setLoadingGatewayCodes(true);
      // 표준화 2025-12-08: 올바른 API 경로 사용 (/groups/{codeGroup})
      const response = await apiGet(API_COMMON_CODES_GROUPS_PAYMENT_METHOD);
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
      setPaymentGatewayOptions([
        { value: 'TOSS', label: '토스페이먼츠', icon: '💙', color: 'var(--mg-primary-500)', description: '토스페이먼츠 결제' },
        { value: 'IAMPORT', label: '아임포트', icon: '🏦', color: 'var(--mg-gray-700)', description: '아임포트 결제' },
        { value: 'KAKAO', label: '카카오페이', icon: '💛', color: 'var(--mg-yellow-500)', description: '카카오페이 결제' },
        { value: 'NAVER', label: '네이버페이', icon: '💚', color: 'var(--mg-green-500)', description: '네이버페이 결제' },
        { value: 'PAYPAL', label: '페이팔', icon: '💳', color: 'var(--mg-blue-500)', description: '페이팔 결제' }
      ]);
    } finally {
      setLoadingGatewayCodes(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentGatewayCodes();
  }, [loadPaymentGatewayCodes]);

  const loadPaymentMethodCodes = useCallback(async() => {
    try {
      setLoadingMethodCodes(true);
      // 표준화 2025-12-08: 올바른 API 경로 사용 (/groups/{codeGroup})
      const response = await apiGet(API_COMMON_CODES_GROUPS_PAYMENT_METHOD);
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

  const loadPayments = async() => {
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
          'Content-Type': 'application/json'
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
        throw new Error(i18n.t('error:super-admin.PaymentManagement.t_0f851db6'));
      }
    } catch (error) {
      console.error('결제 목록 로드 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async() => {
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: filters.endDate || new Date().toISOString()
      });

      const response = await fetch(`${API_BASE_URL}/api/payments/statistics?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
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

  const handleStatusUpdate = async(paymentId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/status?status=${status}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        loadPayments();
        loadStatistics();
      } else {
        throw new Error(i18n.t('error:super-admin.PaymentManagement.t_df171b53'));
      }
    } catch (error) {
      console.error('결제 상태 업데이트 실패:', error);
      setError(error.message);
    }
  };

  const handleRefund = async(paymentId, amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
        throw new Error(i18n.t('error:super-admin.PaymentManagement.t_64f296f5'));
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

  const exportPayments = async() => {
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
    notificationManager.show('결제 분석 기능은 개발 중입니다.', 'info');
  };

  const handleBulkAction = async(action, selectedPayments) => {
    if (!selectedPayments || selectedPayments.length === 0) {
      notificationManager.show('선택된 결제가 없습니다.', 'info');
      return;
    }

    const actionLabel = action === 'approve' ? '승인' : action === 'refund' ? '환불' : '취소';
    const confirmed = await confirm({
      message: `선택된 ${selectedPayments.length}건의 결제를 ${actionLabel}하시겠습니까?`,
      variant: action === 'refund' ? 'danger' : 'warning'
    });

    if (!confirmed) return;

    try {
      const promises = selectedPayments.map(paymentId => {
        const endpoint = action === 'refund' 
          ? `${API_BASE_URL}/api/payments/${paymentId}/refund`
          : `${API_BASE_URL}/api/payments/${paymentId}/status`;
        
        const body = action === 'refund' 
          ? { amount: payments.find(p => p.id === paymentId)?.amount }
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          : { status: action === 'approve' ? 'APPROVED' : 'CANCELLED' };

        return fetch(endpoint, {
          method: action === 'refund' ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json'
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

  const paymentStatusToVariant = (s) => {
    const v = (s || '').toUpperCase();
    if (v.includes('COMPLETE') || v.includes('CONFIRM') || v.includes('SUCCESS')) return 'success';
    if (v.includes('PENDING') || v.includes('WAIT')) return 'warning';
    if (v.includes('FAIL') || v.includes('CANCEL')) return 'danger';
    return 'neutral';
  };

  const getStatusBadge = (status) => {
    const statusOption = paymentStatusOptions.find((option) => option.value === status);
    const label = statusOption ? statusOption.label : status;
    return <StatusBadge variant={paymentStatusToVariant(status)}>{label}</StatusBadge>;
  };

  if (loading) {
    return (
      <AdminCommonLayout title={t('common:super-admin.PaymentManagement.t_4bdf9fd1')}>
        <UnifiedLoading type="inline" text={t('common:super-admin.PaymentManagement.t_eb11e9a6')} />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={t('common:super-admin.PaymentManagement.t_4bdf9fd1')}>
      <ContentArea ariaLabel="수퍼어드민 결제 관리">
        <ContentHeader
          title={t('common:super-admin.PaymentManagement.t_4bdf9fd1')}
          subtitle="결제 내역 조회, 상태 관리 및 통계"
          titleId={PAYMENT_PAGE_TITLE_ID}
          actions={(
            <ActionBar align="end" gap="md" className="header-actions">
              <ActionBarButton variant="outline" onClick={() => exportPayments()}>
                {t('common:super-admin.PaymentManagement.t_7dcea1f4')}
              </ActionBarButton>
              <ActionBarButton variant="outline" onClick={() => showPaymentAnalytics()}>
                {t('common:super-admin.PaymentManagement.t_335ea044')}
              </ActionBarButton>
              <ActionBarButton variant="primary" onClick={() => loadPayments()}>
                {t('admin.actions.refresh')}
              </ActionBarButton>
            </ActionBar>
          )}
        />

        <div className="payment-management">
        {/* 통계 카드 */}
        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-title">{t('common:super-admin.PaymentManagement.t_5c7affbb')}</div>
            <div className="stat-value">
              {formatCurrency(statistics.totalAmount || 0)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">{t('common:super-admin.PaymentManagement.t_2e659d7c')}</div>
            <div className="stat-value">
              // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
              {statistics.statusCounts?.APPROVED || 0}건
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">{t('common:super-admin.PaymentManagement.t_a932a475')}</div>
            <div className="stat-value">
              // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
              {statistics.statusCounts?.PENDING || 0}건
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">{t('common:super-admin.PaymentManagement.t_f3fba5df')}</div>
            <div className="stat-value">
              {statistics.statusCounts?.REFUNDED || 0}건
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="filters">
          <div className="filter-group">
            <label>{t('common:super-admin.PaymentManagement.t_d39b762e')}</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
              disabled={loadingCodes}
            >
              <option value="all">{t('admin.labels.all')}</option>
              {paymentStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label} ({option.value})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('admin.labels.paymentMethod')}</label>
            <select 
              value={filters.method}
              onChange={(e) => handleFilterChange('method', e.target.value)}
              disabled={loadingMethodCodes}
            >
              <option value="all">{t('admin.labels.all')}</option>
              {paymentMethodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('common:super-admin.PaymentManagement.t_da641026')}</label>
            <select 
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
              disabled={loadingGatewayCodes}
            >
              <option value="all">{t('admin.labels.all')}</option>
              {paymentGatewayOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('common:super-admin.PaymentManagement.t_61b44386')}</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>{t('common:super-admin.PaymentManagement.t_0043b752')}</label>
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
            <ActionBar align="start" gap="sm" className="bulk-buttons">
              <ActionBarButton variant="primary" size="sm" onClick={() => handleBulkAction('approve', selectedPayments)}>
                {t('common:super-admin.PaymentManagement.t_a3b01015')}
              </ActionBarButton>
              <ActionBarButton variant="outline" size="sm" onClick={() => handleBulkAction('cancel', selectedPayments)}>
                {t('common:super-admin.PaymentManagement.t_27fb23da')}
              </ActionBarButton>
              <ActionBarButton variant="danger" size="sm" onClick={() => handleBulkAction('refund', selectedPayments)}>
                {t('common:super-admin.PaymentManagement.t_7e3b3b4f')}
              </ActionBarButton>
              <ActionBarButton variant="ghost" size="sm" onClick={() => setSelectedPayments([])}>
                {t('common:super-admin.PaymentManagement.t_bf3e2aa4')}
              </ActionBarButton>
            </ActionBar>
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
                <span>{t('common:super-admin.PaymentManagement.t_0aa04a70')}</span>
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
                    <span className="mg-payment-card__label">{t('common:super-admin.PaymentManagement.t_64454827')}</span>
                    <span className="mg-payment-card__value mg-payment-card__value--amount">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">{t('admin.labels.status')}</span>
                    <span className="mg-payment-card__value">
                      {getStatusBadge(payment.status)}
                    </span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">{t('admin.labels.paymentMethod')}</span>
                    <span className="mg-payment-card__value">{payment.method || '-'}</span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">{t('common:super-admin.PaymentManagement.t_0ae2b5e8')}</span>
                    <span className="mg-payment-card__value">{payment.provider || '-'}</span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">{t('common:super-admin.PaymentManagement.t_5c6659bc')}</span>
                    <span className="mg-payment-card__value">{payment.payerId || '-'}</span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">{t('common:super-admin.PaymentManagement.t_a5466453')}</span>
                    <span className="mg-payment-card__value">{formatDate(payment.createdAt)}</span>
                  </div>
                  <div className="mg-payment-card__field">
                    <span className="mg-payment-card__label">{t('common:super-admin.PaymentManagement.t_c2700b57')}</span>
                    <span className="mg-payment-card__value">
                      {payment.approvedAt ? formatDate(payment.approvedAt) : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="mg-payment-card__footer">
                  <div className="mg-payment-card__actions">
                    {/* 표준화: 상태값은 공통코드 동적 조회 권장 (STATUS_GROUP) */}
                    {payment.status === 'PENDING' && (
                      <MGButton
                        variant="success"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'success', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => handleStatusUpdate(payment.paymentId, 'APPROVED')}
                        preventDoubleClick={true}
                      >
                        {t('common:super-admin.PaymentManagement.t_0d1cd671')}
                      </MGButton>
                    )}
                    {payment.status === 'PENDING' && (
                      <MGButton
                        variant="danger"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => handleStatusUpdate(payment.paymentId, 'CANCELLED')}
                        preventDoubleClick={true}
                      >
                        {t('admin.actions.cancel')}
                      </MGButton>
                    )}
                    {payment.status === 'APPROVED' && (
                      <MGButton
                        variant="warning"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'warning', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => handleRefund(payment.paymentId, payment.amount)}
                        preventDoubleClick={true}
                      >
                        {t('common:super-admin.PaymentManagement.t_14e82af6')}
                      </MGButton>
                    )}
                  </div>
                </div>
              </MGCard>
            ))}
          </div>
        </div>

        {/* 페이지네이션 */}
        <div className="pagination">
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={pagination.currentPage === 0}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            preventDoubleClick={false}
          >
            {t('common.actions.prev')}
          </MGButton>
          <span>
            {pagination.currentPage + 1} / {pagination.totalPages}
            (총 {pagination.totalElements}건)
          </span>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={pagination.currentPage >= pagination.totalPages - 1}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            preventDoubleClick={false}
          >
            {t('common:super-admin.PaymentManagement.t_854c76f3')}
          </MGButton>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        </div>
      </ContentArea>
      <ConfirmModal />
    </AdminCommonLayout>
  );
};

export default PaymentManagement;
