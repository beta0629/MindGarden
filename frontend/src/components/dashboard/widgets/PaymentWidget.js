/**
 * Payment Widget - 표준화된 위젯
/**
 * 결제 정보를 표시하는 위젯
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (표준화 업그레이드)
/**
 * @since 2025-11-21
 */

import React from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './Widget.css';

const PaymentWidget = ({ widget, user }) => {
  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  const config = widget.config || {};

  // 결제 상태에 따른 스타일 클래스
  const getPaymentStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'success': return 'payment-completed';
      case 'pending': case 'processing': return 'payment-pending';
      case 'failed': case 'error': return 'payment-failed';
      case 'cancelled': case 'canceled': return 'payment-cancelled';
      case 'refunded': return 'payment-refunded';
      default: return 'payment-default';
    }
  };

  // 금액 포맷팅
  const formatAmount = (amount, currency = 'KRW') => {
    if (!amount && amount !== 0) return '-';
    
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 결제 방법 아이콘
  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'card': case 'credit_card': return 'credit-card';
      case 'bank': case 'bank_transfer': return 'bank';
      case 'cash': return 'cash';
      case 'paypal': return 'paypal';
      case 'kakao': case 'kakaopay': return 'chat-square-text';
      case 'naver': case 'naverpay': return 'n-circle';
      default: return 'wallet2';
    }
  };

  // 결제 목록 렌더링
  const renderPaymentList = () => {
    if (!Array.isArray(data)) return null;

    return (
      <div className="payment-list">
        {data.map((payment, index) => (
          <div key={index} className={`payment-item ${getPaymentStatusClass(payment.status)}`}>
            <div className="payment-info">
              <div className="payment-header">
                <span className="payment-title">
                  {payment.title || payment.description || `결제 ${index + 1}`}
                </span>
                <span className="payment-amount">
                  {formatAmount(payment.amount, payment.currency)}
                </span>
              </div>
              <div className="payment-details">
                <span className="payment-method">
                  <i className={`bi bi-${getPaymentMethodIcon(payment.method)}`}></i>
                  {payment.method || '결제 방법'}
                </span>
                <span className="payment-date">
                  {payment.date ? new Date(payment.date).toLocaleDateString('ko-KR') : '날짜 미정'}
                </span>
                <span className={`payment-status ${getPaymentStatusClass(payment.status)}`}>
                  {payment.status || '상태 미정'}
                </span>
              </div>
            </div>
            <div className="payment-actions">
              {config.showActions && (
                <>
                  <button className="payment-action-btn view" title="상세보기">
                    <i className="bi bi-eye"></i>
                  </button>
                  {payment.status === 'completed' && (
                    <button className="payment-action-btn receipt" title="영수증">
                      <i className="bi bi-receipt"></i>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 결제 요약 렌더링
  const renderPaymentSummary = () => {
    if (!hasData) return null;

    let summary;
    if (Array.isArray(data)) {
      // 배열 데이터에서 요약 계산
      summary = {
        total: data.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        count: data.length,
        completed: data.filter(p => p.status === 'completed').length,
        pending: data.filter(p => p.status === 'pending').length
      };
    } else {
      // 단일 객체 데이터
      summary = data;
    }

    return (
      <div className="payment-summary">
        <div className="summary-item">
          <div className="summary-label">총 결제액</div>
          <div className="summary-value">
            {formatAmount(summary.total || summary.totalAmount)}
          </div>
        </div>
        {summary.count && (
          <div className="summary-item">
            <div className="summary-label">총 건수</div>
            <div className="summary-value">{summary.count}건</div>
          </div>
        )}
        {summary.completed !== undefined && (
          <div className="summary-item">
            <div className="summary-label">완료</div>
            <div className="summary-value completed">{summary.completed}건</div>
          </div>
        )}
        {summary.pending !== undefined && (
          <div className="summary-item">
            <div className="summary-label">대기</div>
            <div className="summary-value pending">{summary.pending}건</div>
          </div>
        )}
      </div>
    );
  };

  // 결제 위젯 렌더링
  const renderPaymentContent = () => {
    if (isEmpty) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 결제 정보가 없습니다.
        </div>
      );
    }
    
    if (!hasData) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    const showSummary = config.showSummary !== false; // 기본값 true
    const showList = config.showList !== false; // 기본값 true

    return (
      <div className="payment-container">
        {showSummary && renderPaymentSummary()}
        {showList && renderPaymentList()}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.PAYMENT}
      subtitle={widget.config?.subtitle || ''}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderPaymentContent()}
      </div>
    </BaseWidget>
  );
};

export default PaymentWidget;