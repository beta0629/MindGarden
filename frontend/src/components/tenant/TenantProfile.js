/**
 * 테넌트 프로필/설정 페이지
/**
 * 
/**
 * 테넌트 상태, 구독 정보, 결제 수단을 통합 관리하는 페이지
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { Building2, CreditCard, Calendar, DollarSign, CheckCircle, XCircle, AlertCircle, Plus, Trash2, Edit2 } from 'lucide-react';
import { getPaymentMethods, getSubscriptions } from '../../utils/billingService';
import PaymentMethodRegistration from '../billing/PaymentMethodRegistration';
import notificationManager from '../../utils/notification';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import MGButton from '../../components/common/MGButton'; // 임시 비활성화
import './TenantProfile.css';

const TenantProfile = () => {
  const { user, sessionInfo, isLoggedIn, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showPaymentMethodRegistration, setShowPaymentMethodRegistration] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, subscription, payment

  const tenantId = sessionInfo?.tenantId || user?.tenantId;

  useEffect(() => {
    if (sessionLoading) {
      return; // 세션 로딩 중에는 대기
    }

    if (!isLoggedIn || !user) {
      console.log('🔐 인증되지 않은 사용자 - 로그인 페이지로 리다이렉트');
      navigate('/login', { replace: true });
      return;
    }

    if (!tenantId) {
      console.log('⚠️ 테넌트 ID 없음 - 대시보드로 리다이렉트');
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [isLoggedIn, user, sessionLoading, tenantId, navigate]);

  useEffect(() => {
    if (tenantId && isLoggedIn && user) {
      loadTenantInfo();
      loadSubscriptions();
      loadPaymentMethods();
    }
  }, [tenantId, isLoggedIn, user]);

/**
   * 테넌트 정보 로드
   */
  const loadTenantInfo = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/tenant/current', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('테넌트 정보 조회 실패');
      }

      const data = await response.json();
      if (data.success && data.tenant) {
        setTenantInfo(data.tenant);
      }
    } catch (err) {
      console.error('테넌트 정보 로드 실패:', err);
      notificationManager.error('테넌트 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

/**
   * 구독 정보 로드
   */
  const loadSubscriptions = async () => {
    if (!tenantId) return;

    try {
      const subscriptions = await getSubscriptions(tenantId);
      setSubscriptions(subscriptions || []);
    } catch (err) {
      console.error('구독 정보 로드 실패:', err);
    }
  };

/**
   * 결제 수단 목록 로드
   */
  const loadPaymentMethods = async () => {
    if (!tenantId) return;

    try {
      const paymentMethods = await getPaymentMethods(tenantId);
      setPaymentMethods(paymentMethods || []);
    } catch (err) {
      console.error('결제 수단 로드 실패:', err);
    }
  };

/**
   * 결제 수단 삭제
   */
  const handleDeletePaymentMethod = async (paymentMethodId) => {
    if (!confirm('정말 이 결제 수단을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/billing/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('결제 수단 삭제 실패');
      }

      notificationManager.success('결제 수단이 삭제되었습니다.');
      loadPaymentMethods();
    } catch (err) {
      console.error('결제 수단 삭제 실패:', err);
      notificationManager.error('결제 수단 삭제에 실패했습니다.');
    }
  };

/**
   * 기본 결제 수단 설정
   */
  const handleSetDefaultPaymentMethod = async (paymentMethodId) => {
    try {
      const response = await fetch(`/api/v1/billing/payment-methods/${paymentMethodId}/set-default?tenantId=${tenantId}`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('기본 결제 수단 설정 실패');
      }

      notificationManager.success('기본 결제 수단이 설정되었습니다.');
      loadPaymentMethods();
    } catch (err) {
      console.error('기본 결제 수단 설정 실패:', err);
      notificationManager.error('기본 결제 수단 설정에 실패했습니다.');
    }
  };

/**
   * 테넌트 상태 배지 렌더링
   */
  const renderStatusBadge = (status) => {
    const statusConfig = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      PENDING: { label: '대기 중', color: 'warning', icon: AlertCircle },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      ACTIVE: { label: '활성', color: 'success', icon: CheckCircle },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      SUSPENDED: { label: '일시정지', color: 'danger', icon: XCircle },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      CLOSED: { label: '종료', color: 'secondary', icon: XCircle }
    };

    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`tenant-status-badge tenant-status-badge--${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  if (sessionLoading || !isLoggedIn || !user) {
    return (
      <SimpleLayout>
        <UnifiedLoading type="page" text="테넌트 정보를 불러오는 중..." />
      </SimpleLayout>
    );
  }

  if (!tenantId) {
    return (
      <SimpleLayout>
        <div className="tenant-profile-error">
          <AlertCircle size={24} />
          <p>테넌트 정보를 찾을 수 없습니다.</p>
        </div>
      </SimpleLayout>
    );
  }

  if (loading) {
    return (
      <SimpleLayout>
        <UnifiedLoading type="page" text="테넌트 프로필을 불러오는 중..." />
      </SimpleLayout>
    );
  }

  if (!tenantInfo) {
    return (
      <SimpleLayout>
        <div className="tenant-profile-error">
          <AlertCircle size={24} />
          <p>테넌트 정보를 찾을 수 없습니다.</p>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="tenant-profile">
        {/* 헤더 */}
        <div className="tenant-profile-header">
          <div className="tenant-profile-header-content">
            <Building2 size={32} />
            <div>
              <h1>{tenantInfo.name || '테넌트 정보'}</h1>
              <p className="tenant-profile-subtitle">테넌트 상태 및 결제 정보 관리</p>
            </div>
          </div>
          {renderStatusBadge(tenantInfo.status)}
        </div>

        {/* 탭 네비게이션 */}
        <div className="tenant-profile-tabs">
          <button
            className={`tenant-profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            개요
          </button>
          <button
            className={`tenant-profile-tab ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            구독 관리
          </button>
          <button
            className={`tenant-profile-tab ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            결제 수단
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="tenant-profile-content">
          {/* 개요 탭 */}
          {activeTab === 'overview' && (
            <div className="tenant-profile-overview">
              <div className="tenant-info-card">
                <h2>테넌트 정보</h2>
                <div className="tenant-info-grid">
                  <div className="tenant-info-item">
                    <label>테넌트 ID</label>
                    <p>{tenantInfo.tenantId}</p>
                  </div>
                  <div className="tenant-info-item">
                    <label>테넌트명</label>
                    <p>{tenantInfo.name}</p>
                  </div>
                  <div className="tenant-info-item">
                    <label>업종</label>
                    <p>{tenantInfo.businessType || '-'}</p>
                  </div>
                  <div className="tenant-info-item">
                    <label>상태</label>
                    <div>{renderStatusBadge(tenantInfo.status)}</div>
                  </div>
                </div>
              </div>

              <div className="tenant-info-card">
                <h2>구독 정보</h2>
                {subscriptions.length > 0 ? (
                  <div className="subscription-summary">
                    {subscriptions.map((subscription) => (
                      <div key={subscription.subscriptionId} className="subscription-summary-item">
                        <div>
                          <strong>{subscription.planName || '요금제'}</strong>
                          <span className={`subscription-status subscription-status--${subscription.status?.toLowerCase()}`}>
                            {subscription.status}
                          </span>
                        </div>
                        {subscription.amount && (
                          <div className="subscription-amount">
                            <DollarSign size={16} />
                            {subscription.amount.toLocaleString()}원
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">등록된 구독이 없습니다.</p>
                )}
              </div>

              <div className="tenant-info-card">
                <h2>결제 수단</h2>
                {paymentMethods.length > 0 ? (
                  <div className="payment-method-summary">
                    {paymentMethods.map((pm) => (
                      <div key={pm.paymentMethodId} className="payment-method-summary-item">
                        <CreditCard size={16} />
                        <span>{pm.cardNumber || pm.methodType || '결제 수단'}</span>
                        {pm.isDefault && (
                          <span className="default-badge">기본</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">등록된 결제 수단이 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {/* 구독 관리 탭 */}
          {activeTab === 'subscription' && (
            <div className="tenant-profile-subscription">
              <SubscriptionManagement tenantId={tenantId} />
            </div>
          )}

          {/* 결제 수단 탭 */}
          {activeTab === 'payment' && (
            <div className="tenant-profile-payment">
              <div className="payment-method-header">
                <h2>결제 수단 관리</h2>
                <button className="mg-button"
                  onClick={() => setShowPaymentMethodRegistration(true)}
                  variant="primary"
                >
                  <Plus size={16} />
                  결제 수단 추가
                </button>
              </div>

              {showPaymentMethodRegistration && (
                <div className="payment-method-registration-wrapper">
                  <PaymentMethodRegistration
                    tenantId={tenantId}
                    onSuccess={() => {
                      setShowPaymentMethodRegistration(false);
                      loadPaymentMethods();
                    }}
                    onCancel={() => setShowPaymentMethodRegistration(false)}
                  />
                </div>
              )}

              <div className="payment-method-list">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((pm) => (
                    <div key={pm.paymentMethodId} className="payment-method-card">
                      <div className="payment-method-card-content">
                        <CreditCard size={24} />
                        <div className="payment-method-info">
                          <div className="payment-method-name">
                            {pm.cardNumber || pm.methodType || '결제 수단'}
                            {pm.isDefault && (
                              <span className="default-badge">기본</span>
                            )}
                          </div>
                          {pm.cardExpiry && (
                            <div className="payment-method-expiry">
                              만료일: {pm.cardExpiry}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="payment-method-actions">
                        {!pm.isDefault && (
                          <button
                            className="payment-method-action-btn"
                            onClick={() => handleSetDefaultPaymentMethod(pm.paymentMethodId)}
                            title="기본 결제 수단으로 설정"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button
                          className="payment-method-action-btn payment-method-action-btn--danger"
                          onClick={() => handleDeletePaymentMethod(pm.paymentMethodId)}
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-payment-methods">
                    <CreditCard size={48} />
                    <p>등록된 결제 수단이 없습니다.</p>
                    <button className="mg-button"
                      onClick={() => setShowPaymentMethodRegistration(true)}
                      variant="primary"
                    >
                      <Plus size={16} />
                      결제 수단 추가
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </SimpleLayout>
  );
};

export default TenantProfile;

