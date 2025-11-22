/**
 * Payment Widget
 * 결제 세션 정보를 표시하는 범용 위젯
 * ClientPaymentSessionsSection을 기반으로 범용화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
import UnifiedLoading from '../../common/UnifiedLoading';
import './Widget.css';

const PaymentWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [paymentSessions, setPaymentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    expired: 0
  });
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const userId = user?.id || config.userId;
  const maxItems = config.maxItems || 5;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url && userId) {
      loadPaymentSessions();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadPaymentSessions, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.paymentSessions && Array.isArray(config.paymentSessions)) {
      setPaymentSessions(config.paymentSessions);
      calculateSummary(config.paymentSessions);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userId]);
  
  const loadPaymentSessions = async () => {
    try {
      setLoading(true);
      
      // 실제 API 엔드포인트: /api/admin/mappings/client?clientId={userId}
      // ClientPaymentSessionsSection에서 사용하는 엔드포인트
      const url = dataSource.url || `/api/admin/mappings/client?clientId=${userId}`;
      const response = await apiGet(url);
      
      if (response && response.success && response.data) {
        // 매핑 데이터에서 결제 세션 정보 추출
        const mappings = Array.isArray(response.data) ? response.data : [];
        
        // ACTIVE 상태의 매핑만 필터링하여 결제 세션으로 변환
        const activeMappings = mappings.filter(m => m.status === 'ACTIVE');
        const sessions = activeMappings
          .filter(mapping => mapping.paymentDate)
          .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
          .slice(0, maxItems)
          .map(mapping => ({
            id: mapping.id,
            title: mapping.packageName || '결제 세션',
            packageName: mapping.packageName,
            amount: mapping.packagePrice || 0,
            totalSessions: mapping.totalSessions || 0,
            usedSessions: mapping.usedSessions || 0,
            remainingSessions: mapping.remainingSessions || 0,
            paymentDate: mapping.paymentDate,
            paymentMethod: mapping.paymentMethod,
            status: mapping.paymentStatus === 'CONFIRMED' ? 'ACTIVE' : mapping.paymentStatus,
            expiryDate: mapping.expiryDate
          }));
        
        setPaymentSessions(sessions);
        calculateSummary(sessions);
      } else if (response && response.data) {
        // 다른 응답 형식 지원
        const sessions = Array.isArray(response.data) ? response.data : [];
        setPaymentSessions(sessions.slice(0, maxItems));
        calculateSummary(sessions);
      } else {
        setPaymentSessions([]);
        calculateSummary([]);
      }
    } catch (err) {
      console.error('PaymentWidget 데이터 로드 실패:', err);
      setPaymentSessions([]);
      calculateSummary([]);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateSummary = (sessions) => {
    const total = sessions.length;
    const active = sessions.filter(s => s.status === 'ACTIVE' || s.status === 'VALID').length;
    const expired = sessions.filter(s => s.status === 'EXPIRED' || s.status === 'INVALID').length;
    setSummary({ total, active, expired });
  };
  
  const handleSessionClick = (session) => {
    if (config.sessionUrl) {
      navigate(config.sessionUrl.replace('{sessionId}', session.id));
    } else {
      navigate(`/payments/sessions/${session.id}`);
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/payments/sessions');
    }
  };
  
  if (loading && paymentSessions.length === 0) {
    return (
      <div className="widget widget-payment">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-payment">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-credit-card"></i>
          {config.title || '결제 세션'}
        </div>
        {config.viewAllUrl && (
          <button className="widget-view-all" onClick={handleViewAll}>
            전체보기 →
          </button>
        )}
      </div>
      <div className="widget-body">
        {summary.total > 0 && (
          <div className="payment-summary">
            <div className="payment-summary-item">
              <div className="payment-summary-label">전체</div>
              <div className="payment-summary-value">{summary.total}</div>
            </div>
            <div className="payment-summary-item">
              <div className="payment-summary-label">활성</div>
              <div className="payment-summary-value text-success">{summary.active}</div>
            </div>
            <div className="payment-summary-item">
              <div className="payment-summary-label">만료</div>
              <div className="payment-summary-value text-danger">{summary.expired}</div>
            </div>
          </div>
        )}
        
        {paymentSessions.length > 0 ? (
          <div className="payment-session-list">
            {paymentSessions.map((session, index) => (
              <div
                key={session.id || index}
                className="payment-session-item"
                onClick={() => handleSessionClick(session)}
              >
                <div className="payment-session-info">
                  <div className="payment-session-title">{session.title || session.packageName}</div>
                  <div className="payment-session-details">
                    {session.totalSessions && (
                      <span>세션: {session.usedSessions || 0} / {session.totalSessions}</span>
                    )}
                    {session.amount && (
                      <span>금액: ₩{session.amount.toLocaleString()}</span>
                    )}
                  </div>
                  {session.expiryDate && (
                    <div className="payment-session-expiry">
                      만료일: {new Date(session.expiryDate).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
                <div className={`payment-session-status status-${session.status?.toLowerCase()}`}>
                  {session.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <i className="bi bi-credit-card-2-front"></i>
            <p>{config.emptyMessage || '결제 세션이 없습니다'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentWidget;

