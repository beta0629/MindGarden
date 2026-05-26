/**
 * Payment Sessions Widget - 표준화된 결제/회기 관리 위젯
 * ClientPaymentSessionsSection을 위젯으로 변환 + 실제 API 연동
 * 
 * @author CoreSolution
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */

import React from 'react';
import {
  LayoutGrid,
  CheckCircle,
  Clock,
  CircleDollarSign,
  Receipt,
  Inbox
} from 'lucide-react';

import BaseWidget from './BaseWidget';
import { RoleUtils } from '../../../constants/roles';
import { useWidget } from '../../../hooks/useWidget';
import { apiGet } from '../../../utils/ajax';
import { normalizeMappingsListPayload } from '../../../utils/apiResponseNormalize';
import './PaymentSessionsWidget.css';
import '../ClientPaymentSessionsSection.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_MAPPINGS_CLIENT = '/api/v1/admin/mappings/client';

const PAYMENT_KPI_ICON_SIZE = 22;
const PAYMENT_ITEM_ICON_SIZE = 20;
const PAYMENT_STATE_ICON_SIZE = 40;

const MAPPINGS_WIDGET_FETCH_ERROR = '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';

const PaymentSessionsWidget = ({ widget, user }) => {
  const { t } = useTranslation();
  const getDataSourceConfig = () => ({
    type: 'api',
    cache: true,
    refreshInterval: 300000, // 5분마다 새로고침 (결제 정보는 자주 변경되지 않음)
    url: API_ADMIN_MAPPINGS_CLIENT,
    params: {
      clientId: user.id
    },
    fetcher: async(url, params) => {
      const raw = await apiGet(url, params);
      if (raw === null || raw === undefined) {
        const err = new Error(MAPPINGS_WIDGET_FETCH_ERROR);
        err.status = 400;
        throw err;
      }
      return raw;
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
    immediate: RoleUtils.isClient(user),
    cache: true,
    retryCount: 3
  });

  if (!RoleUtils.isClient(user)) {
    return null;
  }

  const transformPaymentData = (mappingsData) => {
    const mappings = normalizeMappingsListPayload(mappingsData);
    if (mappings.length === 0) {
      return {
        totalSessions: 0,
        usedSessions: 0,
        remainingSessions: 0,
        totalAmount: 0,
        recentPayments: []
      };
    }
    
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
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    if (!status) return 'secondary';
    
    const statusMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CONFIRMED': 'success',
      'PAY': 'success',
      'DEP': 'success',
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
    if (!status) return t('common:dashboard.PaymentSessionsWidget.t_8c5d2272');
    
    const statusTextMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CONFIRMED': t('common:dashboard.PaymentSessionsWidget.t_d1a349f7'),
      'PAY': t('common:dashboard.PaymentSessionsWidget.t_f8e2bb71'),
      'DEP': t('common:dashboard.PaymentSessionsWidget.t_a1b8faac'),
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'APPROVED': t('common:dashboard.PaymentSessionsWidget.t_0eb721a5'),
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': t('common:dashboard.PaymentSessionsWidget.t_9b3a3ba2'),
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'REJECTED': t('common:dashboard.PaymentSessionsWidget.t_851085ad'),
      'REFUNDED': t('common:dashboard.PaymentSessionsWidget.t_415cbe4c'),
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': t('common:dashboard.PaymentSessionsWidget.t_8d868037'),
      'FAILED': t('common:dashboard.PaymentSessionsWidget.t_732fe33a'),
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': t('common:dashboard.PaymentSessionsWidget.t_19b2d19b')
    };
    
    return statusTextMap[status] || status || t('common:dashboard.PaymentSessionsWidget.t_8c5d2272');
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
          label: t('common:dashboard.PaymentSessionsWidget.t_deb94acf'),
          onClick: refresh,
          disabled: loading
        }
      ]}
    >
      <div className="payment-sessions-widget-content">
        {/* 회기 현황 요약 통계 카드들 */}
        <div className="payment-sessions-stats">
          <div className="payment-stat-card payment-stat-card--primary">
            <div className="payment-stat-icon" aria-hidden>
              <LayoutGrid size={PAYMENT_KPI_ICON_SIZE} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">총 회기수</div>
              <div className="payment-stat-value">{currentData.totalSessions}회</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--success">
            <div className="payment-stat-icon" aria-hidden>
              <CheckCircle size={PAYMENT_KPI_ICON_SIZE} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">사용한 회기</div>
              <div className="payment-stat-value">{currentData.usedSessions}회</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--warning">
            <div className="payment-stat-icon" aria-hidden>
              <Clock size={PAYMENT_KPI_ICON_SIZE} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">남은 회기</div>
              <div className="payment-stat-value">{currentData.remainingSessions}회</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--info">
            <div className="payment-stat-icon" aria-hidden>
              <CircleDollarSign size={PAYMENT_KPI_ICON_SIZE} />
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
              
              최근 결제 내역
            </h3>
            <div className="payment-items">
              {currentData.recentPayments.map((payment) => (
                <div key={payment.id} className="payment-item">
                  <div className="payment-item__icon" aria-hidden>
                    <Receipt size={PAYMENT_ITEM_ICON_SIZE} />
                  </div>
                  <div className="payment-item__content">
                    <div className="payment-item__header">
                      <h4 className="payment-item__package">
                        
                        {formatCurrency(payment.amount)}
                      </h4>
                      <span className={`mg-badge mg-badge-${getStatusClass(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </div>
                    <div className="payment-item__details">
                      <span className="payment-item__sessions">
                        
                        {payment.sessions}회
                      </span>
                      <span className="payment-item__date">
                        
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
            <div className="payment-sessions-empty__icon" aria-hidden>
              <Inbox size={PAYMENT_STATE_ICON_SIZE} />
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