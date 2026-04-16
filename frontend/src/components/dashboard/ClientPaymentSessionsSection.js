import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  CheckCircle,
  Clock,
  CircleDollarSign,
  Receipt,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { apiGet } from '../../utils/ajax';
import { normalizeApiListPayload } from '../../utils/apiResponseNormalize';

import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/unified-design-tokens.css';
import './ClientPaymentSessionsSection.css';
/**
 * 내담자 결제 내역 및 총회기수 섹션 컴포넌트
/**
 * 디자인 시스템 적용 버전
 */
const PAYMENT_KPI_ICON_SIZE = 22;
const PAYMENT_ITEM_ICON_SIZE = 20;
const PAYMENT_STATE_ICON_SIZE = 40;

const applyMappingsToPaymentState = (mappings, setPaymentData) => {
  if (!Array.isArray(mappings)) {
    setPaymentData({
      totalSessions: 0,
      usedSessions: 0,
      remainingSessions: 0,
      totalAmount: 0,
      recentPayments: []
    });
    return;
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

  setPaymentData({
    totalSessions,
    usedSessions,
    remainingSessions,
    totalAmount,
    recentPayments
  });
};

const ClientPaymentSessionsSection = ({ userId, supplyMappingsFromParent, parentMappings }) => {
  const [paymentData, setPaymentData] = useState({
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0,
    totalAmount: 0,
    recentPayments: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (supplyMappingsFromParent) {
      if (parentMappings === null || parentMappings === undefined) {
        setIsLoading(true);
        return;
      }
      try {
        setError(null);
        applyMappingsToPaymentState(parentMappings, setPaymentData);
      } catch (e) {
        console.error('결제 및 회기 데이터 적용 실패:', e);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!userId) {
      return;
    }
    loadPaymentSessionsData();
  }, [userId, supplyMappingsFromParent, parentMappings]);

  const loadPaymentSessionsData = async() => {
    try {
      setIsLoading(true);
      setError(null);

      if (!userId) {
        setIsLoading(false);
        return;
      }

      // 표준화 2025-12-08: /api/v1/admin 경로로 통일
      const mappingResponse = await apiGet(`/api/v1/admin/mappings/client?clientId=${userId}`);
      const mappings = normalizeApiListPayload(mappingResponse);

      applyMappingsToPaymentState(mappings, setPaymentData);
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

  if (isLoading) {
    return (
      <div className="payment-sessions-section">
        <UnifiedLoading type="inline" text="결제 내역을 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-sessions-section">
        <div className="payment-sessions-error">
          <div className="payment-sessions-error__icon" aria-hidden>
            <AlertCircle size={PAYMENT_STATE_ICON_SIZE} />
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
          
          결제 내역 및 회기 현황
        </h2>
      </div>

      {/* 회기 현황 요약 */}
      <div className="payment-sessions-stats">
        <div className="payment-stat-card payment-stat-card--primary">
          <div className="payment-stat-icon" aria-hidden>
            <LayoutGrid size={PAYMENT_KPI_ICON_SIZE} />
          </div>
          <div className="payment-stat-content">
            <div className="payment-stat-label">총 회기수</div>
            <div className="payment-stat-value">{paymentData.totalSessions}회</div>
          </div>
        </div>

        <div className="payment-stat-card payment-stat-card--success">
          <div className="payment-stat-icon" aria-hidden>
            <CheckCircle size={PAYMENT_KPI_ICON_SIZE} />
          </div>
          <div className="payment-stat-content">
            <div className="payment-stat-label">사용한 회기</div>
            <div className="payment-stat-value">{paymentData.usedSessions}회</div>
          </div>
        </div>

        <div className="payment-stat-card payment-stat-card--warning">
          <div className="payment-stat-icon" aria-hidden>
            <Clock size={PAYMENT_KPI_ICON_SIZE} />
          </div>
          <div className="payment-stat-content">
            <div className="payment-stat-label">남은 회기</div>
            <div className="payment-stat-value">{paymentData.remainingSessions}회</div>
          </div>
        </div>

        <div className="payment-stat-card payment-stat-card--info">
          <div className="payment-stat-icon" aria-hidden>
            <CircleDollarSign size={PAYMENT_KPI_ICON_SIZE} />
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
            
            최근 결제 내역
          </h3>
          <div className="payment-items">
            {paymentData.recentPayments.map((payment) => (
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
        </div>
      )}
    </div>
  );
};

export default ClientPaymentSessionsSection;
