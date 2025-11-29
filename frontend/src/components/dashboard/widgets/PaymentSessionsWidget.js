/**
 * Payment Sessions Widget - 표준화된 결제/회기 관리 위젯
 * ClientPaymentSessionsSection을 위젯으로 변환 + 실제 API 연동
 * 
 * @author CoreSolution
 * @version 2.0.0 (위젯 표준화 업그레이드)
 * @since 2025-11-29
 */

import React from 'react';
import { 
  CreditCard, TrendingUp, CheckCircle, Clock, 
  DollarSign, Calendar, Package, RefreshCw 
} from 'lucide-react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { RoleUtils } from '../../../constants/roles';
import './PaymentSessionsWidget.css';
import '../ClientPaymentSessionsSection.css';

const PaymentSessionsWidget = ({ widget, user }) => {
  // 내담자 전용 위젯 (다른 역할은 표시하지 않음)
  if (!RoleUtils.isClient(user)) {
    return null;
  }

  // 데이터 소스 설정 (내담자 매핑 정보 조회)
  const getDataSourceConfig = () => ({
    type: 'api',
    cache: true,
    refreshInterval: 300000, // 5분마다 새로고침 (결제 정보는 자주 변경되지 않음)
    url: '/api/admin/mappings/client',
    params: {
      clientId: user.id
    },
    transform: (data) => transformPaymentData(data)
  });

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (매핑 데이터)
  const {
    data: paymentData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 매핑 데이터를 결제/회기 데이터로 변환
  const transformPaymentData = (mappingsData) => {
    if (!mappingsData || !Array.isArray(mappingsData)) {
      return {
        totalSessions: 0,
        usedSessions: 0,
        remainingSessions: 0,
        totalAmount: 0,
        recentPayments: []
      };
    }

    const mappings = mappingsData;
    
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

    return {
      totalSessions,
      usedSessions,
      remainingSessions,
      totalAmount,
      recentPayments
    };
  };

  // 통화 포맷팅
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 상태 클래스 가져오기
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

  // 상태 텍스트 가져오기
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

  // 기본 데이터 (API 실패 시 사용)
  const defaultPaymentData = {
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0,
    totalAmount: 0,
    recentPayments: []
  };

  // 실제 데이터 또는 기본값 사용
  const currentData = paymentData || defaultPaymentData;

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={!currentData.totalSessions && !currentData.recentPayments.length}
      onRefresh={refresh}
      customActions={[
        {
          icon: <RefreshCw size={16} />,
          label: '새로고침',
          onClick: refresh,
          disabled: loading
        }
      ]}
    >
      <div className="payment-sessions-widget-content">
        {/* 회기 현황 요약 통계 카드들 */}
        <div className="payment-sessions-stats">
          <div className="payment-stat-card payment-stat-card--primary">
            <div className="payment-stat-icon">
              <Package size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">총 회기수</div>
              <div className="payment-stat-value">{currentData.totalSessions}회</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--success">
            <div className="payment-stat-icon">
              <CheckCircle size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">사용한 회기</div>
              <div className="payment-stat-value">{currentData.usedSessions}회</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--warning">
            <div className="payment-stat-icon">
              <TrendingUp size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">남은 회기</div>
              <div className="payment-stat-value">{currentData.remainingSessions}회</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--info">
            <div className="payment-stat-icon">
              <DollarSign size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">총 결제금액</div>
              <div className="payment-stat-value">{formatCurrency(currentData.totalAmount)}</div>
            </div>
          </div>
        </div>

        {/* 최근 결제 내역 */}
        {currentData.recentPayments.length > 0 ? (
          <div className="payment-sessions-list">
            <h3 className="payment-sessions-subtitle">
              <Clock size={20} />
              최근 결제 내역
            </h3>
            <div className="payment-items">
              {currentData.recentPayments.map((payment) => (
                <div key={payment.id} className="payment-item">
                  <div className="payment-item__icon">
                    <CreditCard size={20} />
                  </div>
                  <div className="payment-item__content">
                    <div className="payment-item__header">
                      <h4 className="payment-item__package">
                        <DollarSign size={18} />
                        {formatCurrency(payment.amount)}
                      </h4>
                      <span className={`mg-badge mg-badge-${getStatusClass(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </div>
                    <div className="payment-item__details">
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
            <p className="payment-sessions-empty__subtitle">상담 패키지를 구매하시면 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default PaymentSessionsWidget;
