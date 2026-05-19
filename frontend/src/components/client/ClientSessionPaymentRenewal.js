/**
 * ClientSessionPaymentRenewal — 내담자 회기/결제 관리 (리뉴얼)
 *
 * 보유 회기 카드(프로그레스 링), 결제 내역, 회기 연장 요청.
 * ClientAppShell 하위 Outlet으로 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ShoppingBag } from 'lucide-react';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import { useSession } from '../../contexts/SessionContext';
import { useToast } from '../../contexts/ToastContext';
import { CLIENT_SHOP_ROUTES } from '../../constants/clientShopConstants';
import { useTenantComponentFlags } from '../../hooks/useTenantComponentFlags';
import './ClientSessionPaymentRenewal.css';

const TABS = [
  { key: 'payments', label: '결제 내역' },
  { key: 'extend', label: '회기 연장' },
];

const PACKAGES = [
  { id: 1, name: '기본 패키지', sessions: 4, price: 200000 },
  { id: 2, name: '스탠다드 패키지', sessions: 8, price: 360000, popular: true },
  { id: 3, name: '프리미엄 패키지', sessions: 16, price: 640000 },
];

const STATUS_LABELS = {
  COMPLETED: '완료',
  PENDING: '대기',
  FAILED: '실패',
  CANCELLED: '취소',
};

const formatCurrency = (amount) => `₩${Number(amount || 0).toLocaleString()}`;

const CIRCLE_RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const ConsultantProgressRing = ({ remaining, total }) => {
  const ratio = total > 0 ? remaining / total : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);
  return (
    <div className="session-payment__progress-ring">
      <svg viewBox="0 0 80 80">
        <circle className="session-payment__progress-bg" cx="40" cy="40" r={CIRCLE_RADIUS} />
        <circle
          className="session-payment__progress-fill"
          cx="40" cy="40" r={CIRCLE_RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="session-payment__progress-text">
        <span className="session-payment__progress-number">{remaining}</span>
        <span className="session-payment__progress-label">잔여</span>
      </div>
    </div>
  );
};

const ClientSessionPaymentRenewal = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const { showToast } = useToast();
  const { clientShopEnabled } = useTenantComponentFlags();
  const [activeTab, setActiveTab] = useState('payments');
  const [sessionInfo, setSessionInfo] = useState({ total: 0, used: 0, remaining: 0 });
  const [payments, setPayments] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);

  const clientId = user?.id;

  const loadData = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const [paymentsRes, sessionsRes] = await Promise.all([
        TenantAwareApiClient.get('/api/v1/payments', { clientId }).catch(() => []),
        TenantAwareApiClient.get('/api/v1/admin/session-extensions', { clientId }).catch(() => null),
      ]);

      const paymentList = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes?.data || []);
      setPayments(
        paymentList.map((p) => ({
          id: p.id || p.paymentId,
          date: p.paymentDate || p.createdAt?.split('T')[0] || '-',
          description: p.description || p.packageName || '상담 결제',
          method: p.paymentMethod || '카드',
          amount: p.amount || 0,
          status: p.status || 'COMPLETED',
        }))
      );

      const extensions = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.data || []);
      const total = extensions.reduce((s, e) => s + (e.sessionCount || 0), 0) || 10;
      const used = paymentList.filter((p) => p.status === 'COMPLETED').length;
      setSessionInfo({ total, used, remaining: Math.max(total - used, 0) });
    } catch (err) {
      console.error('결제 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExtend = async () => {
    if (!selectedPackage || !clientId) return;
    try {
      await TenantAwareApiClient.post('/api/v1/admin/session-extensions', {
        clientId,
        packageId: selectedPackage,
        sessionCount: PACKAGES.find((p) => p.id === selectedPackage)?.sessions,
      });
      showToast({ message: '회기 연장 요청이 완료되었습니다.', type: 'success' });
      setSelectedPackage(null);
      loadData();
    } catch (err) {
      console.error('회기 연장 실패:', err);
      showToast({ message: '회기 연장 요청에 실패했습니다.', type: 'error' });
    }
  };

  const getBadgeClass = (status) => {
    if (status === 'COMPLETED') return 'session-payment__item-badge--completed';
    if (status === 'PENDING') return 'session-payment__item-badge--pending';
    return 'session-payment__item-badge--failed';
  };

  if (loading) {
    return (
      <div className="session-payment">
        <div className="session-payment__skeleton">
          <div className="session-payment__skeleton-block" />
          <div className="session-payment__skeleton-block" />
        </div>
      </div>
    );
  }

  return (
    <div className="session-payment">
      {/* 보유 회기 카드 */}
      <div className="session-payment__remaining-card">
        <ConsultantProgressRing remaining={sessionInfo.remaining} total={sessionInfo.total} />
        <div className="session-payment__remaining-info">
          <span className="session-payment__remaining-title">보유 회기</span>
          <span className="session-payment__remaining-detail">
            전체 {sessionInfo.total}회 중 {sessionInfo.used}회 사용
          </span>
        </div>
      </div>

      {clientShopEnabled !== false ? (
        <button
          type="button"
          className="session-payment__shop-link"
          onClick={() => navigate(CLIENT_SHOP_ROUTES.CATALOG)}
        >
          <ShoppingBag size={18} aria-hidden />
          온라인 쇼핑 — 상품 둘러보기
        </button>
      ) : null}

      {/* 탭 */}
      <div className="session-payment__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`session-payment__tab${activeTab === tab.key ? ' session-payment__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 결제 내역 탭 */}
      {activeTab === 'payments' && (
        payments.length > 0 ? (
          <div className="session-payment__list">
            {payments.map((p, idx) => (
              <div
                key={p.id || idx}
                className="session-payment__item"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="session-payment__item-left">
                  <span className="session-payment__item-date">{p.date}</span>
                  <span className="session-payment__item-desc">{p.description}</span>
                  <span className="session-payment__item-method">{p.method}</span>
                </div>
                <div className="session-payment__item-right">
                  <span className="session-payment__item-amount">{formatCurrency(p.amount)}</span>
                  <span className={`session-payment__item-badge ${getBadgeClass(p.status)}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="session-payment__empty">
            <div className="session-payment__empty-icon">
              <CreditCard size={28} />
            </div>
            <p className="session-payment__empty-text">결제 내역이 없습니다</p>
          </div>
        )
      )}

      {/* 회기 연장 탭 */}
      {activeTab === 'extend' && (
        <>
          <div className="session-payment__packages">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`session-payment__package-card${selectedPackage === pkg.id ? ' session-payment__package-card--selected' : ''}${pkg.popular ? ' session-payment__package-card--popular' : ''}`}
                onClick={() => setSelectedPackage(pkg.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedPackage(pkg.id)}
                aria-pressed={selectedPackage === pkg.id}
              >
                {pkg.popular && <span className="session-payment__package-badge">인기</span>}
                <div className="session-payment__package-info">
                  <span className="session-payment__package-name">{pkg.name}</span>
                  <span className="session-payment__package-sessions">{pkg.sessions}회 상담</span>
                </div>
                <span className="session-payment__package-price">{formatCurrency(pkg.price)}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="session-payment__extend-btn"
            disabled={!selectedPackage}
            onClick={handleExtend}
          >
            <ShoppingBag size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            결제하고 회기 연장하기
          </button>
        </>
      )}
    </div>
  );
};

export default ClientSessionPaymentRenewal;
