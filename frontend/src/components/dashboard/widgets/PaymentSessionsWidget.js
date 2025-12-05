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
  if (!RoleUtils.isClient(user)) {
    return null;
  }

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

  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

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
    
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    const activeMappings = mappings.filter(mapping => mapping.status === 'ACTIVE');
    const totalSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
    const usedSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.usedSessions || 0), 0);
    const remainingSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.remainingSessions || 0), 0);
    const totalAmount = mappings.reduce((sum, mapping) => sum + (mapping.packagePrice || 0), 0);

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
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CONFIRMED': 'warning',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'APPROVED': 'success',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': 'info',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'REJECTED': 'danger',
      'REFUNDED': 'secondary',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': 'success',
      'FAILED': 'danger',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': 'secondary'
    };
    
    return statusMap[status] || 'secondary';
  };

  const getStatusText = (status) => {
    if (!status) return '미결제';
    
    const statusTextMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CONFIRMED': '입금확인',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'APPROVED': '승인완료',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': '대기중',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'REJECTED': '거부됨',
      'REFUNDED': '환불됨',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': '완료',
      'FAILED': '실패',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': '취소'
    };
    
    return statusTextMap[status] || status || '미결제';
  };

  const defaultPaymentData = {
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0,
    totalAmount: 0,
    recentPayments: []
  };

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
