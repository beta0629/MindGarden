/**
 * 테넌트 프로필/설정 페이지
 * 테넌트 상태, 구독 정보, 결제 수단을 통합 관리
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { CreditCard, DollarSign, AlertCircle, Plus, Trash2, Edit2 } from 'lucide-react';
import { getPaymentMethods, getSubscriptions } from '../../utils/billingService';
import PaymentMethodRegistration from '../billing/PaymentMethodRegistration';
import SubscriptionManagement from '../billing/SubscriptionManagement';
import notificationManager from '../../utils/notification';
import StandardizedApi from '../../utils/standardizedApi';
import UnifiedLoading from '../common/UnifiedLoading';
import StatusBadge from '../common/StatusBadge';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import UnifiedModal from '../common/modals/UnifiedModal';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import {
  TENANT_API_PATHS,
  TENANT_DISPLAY_NAME_MAX_LENGTH,
  canEditTenantDisplayName
} from '../../constants/tenantApi';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './TenantProfile.css';

const TenantProfile = () => {
  const navigate = useNavigate();
  const { user, sessionInfo, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showPaymentMethodRegistration, setShowPaymentMethodRegistration] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, subscription, payment
  const [showTenantNameModal, setShowTenantNameModal] = useState(false);
  const [tenantNameDraft, setTenantNameDraft] = useState('');
  const [tenantNameSaving, setTenantNameSaving] = useState(false);
  const [tenantNameFieldError, setTenantNameFieldError] = useState('');
  const [tenantNameServerError, setTenantNameServerError] = useState('');
  const tenantNameErrorId = useId();
  const tenantNameInputId = useId();

  const tenantId = sessionInfo?.tenantId || user?.tenantId;
  const canRenameTenant = canEditTenantDisplayName(user);

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
  const loadTenantInfo = async (options = {}) => {
    const silent = options.silent === true;
    if (!tenantId) return;

    try {
      if (!silent) {
        setLoading(true);
      }
      const data = await StandardizedApi.get(TENANT_API_PATHS.CURRENT_TENANT);
      const tenant = data?.tenant;
      if (tenant) {
        setTenantInfo(tenant);
      }
    } catch (err) {
      console.error('테넌트 정보 로드 실패:', err);
      notificationManager.error('테넌트 정보를 불러오는데 실패했습니다.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const openTenantNameModal = () => {
    setTenantNameDraft(toDisplayString(tenantInfo?.name, ''));
    setTenantNameFieldError('');
    setTenantNameServerError('');
    setShowTenantNameModal(true);
  };

  const closeTenantNameModal = () => {
    if (tenantNameSaving) {
      return;
    }
    setShowTenantNameModal(false);
    setTenantNameFieldError('');
    setTenantNameServerError('');
  };

  const validateTenantNameDraft = (value) => {
    const t = value != null ? String(value).trim() : '';
    if (!t) {
      return '테넌트명을 입력해 주세요.';
    }
    if (t.length > TENANT_DISPLAY_NAME_MAX_LENGTH) {
      return `테넌트명은 ${TENANT_DISPLAY_NAME_MAX_LENGTH}자 이하여야 합니다.`;
    }
    return '';
  };

  const handleTenantNameSave = async (e) => {
    e.preventDefault();
    const msg = validateTenantNameDraft(tenantNameDraft);
    setTenantNameFieldError(msg);
    setTenantNameServerError('');
    if (msg) {
      return;
    }
    if (!tenantId) {
      return;
    }
    setTenantNameSaving(true);
    try {
      await StandardizedApi.put(TENANT_API_PATHS.tenantDisplayName(tenantId), {
        name: tenantNameDraft.trim()
      });
      notificationManager.success('테넌트명이 변경되었습니다.');
      setShowTenantNameModal(false);
      await loadTenantInfo({ silent: true });
    } catch (err) {
      const serverMsg = err?.message || '테넌트명 변경에 실패했습니다.';
      setTenantNameServerError(serverMsg);
    } finally {
      setTenantNameSaving(false);
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

  const renderStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { label: '대기 중', variant: 'warning' },
      ACTIVE: { label: '활성', variant: 'success' },
      SUSPENDED: { label: '일시정지', variant: 'danger' },
      CLOSED: { label: '종료', variant: 'neutral' }
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
  };

  if (sessionLoading || !isLoggedIn || !user) {
    return (
      <AdminCommonLayout title="테넌트 프로필">
        <div className="mg-v2-ad-b0kla mg-v2-tenant-profile">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="page" text="테넌트 정보를 불러오는 중..." variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (!tenantId) {
    return (
      <AdminCommonLayout title="테넌트 프로필">
        <div className="mg-v2-ad-b0kla mg-v2-tenant-profile">
          <div className="mg-v2-ad-b0kla__container">
            <div className="tenant-profile-error">
              <AlertCircle size={24} />
              <p>테넌트 정보를 찾을 수 없습니다.</p>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (loading) {
    return (
      <AdminCommonLayout title="테넌트 프로필">
        <div className="mg-v2-ad-b0kla mg-v2-tenant-profile">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="page" text="테넌트 프로필을 불러오는 중..." variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (!tenantInfo) {
    return (
      <AdminCommonLayout title="테넌트 프로필">
        <div className="mg-v2-ad-b0kla mg-v2-tenant-profile">
          <div className="mg-v2-ad-b0kla__container">
            <div className="tenant-profile-error">
              <AlertCircle size={24} />
              <p>테넌트 정보를 찾을 수 없습니다.</p>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="테넌트 프로필">
      <div className="mg-v2-ad-b0kla mg-v2-tenant-profile">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="테넌트 프로필 콘텐츠">
            <ContentHeader
              title={toDisplayString(tenantInfo.name, '테넌트')}
              subtitle="테넌트 상태 및 결제 정보 관리"
              titleId="tenant-profile-title"
              actions={renderStatusBadge(tenantInfo.status)}
            />

            <nav
              className="mg-v2-tab-buttons mg-v2-tenant-profile__tabs"
              aria-label="테넌트 프로필 섹션"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'overview'}
                className={`mg-v2-tab-button${activeTab === 'overview' ? ' active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                개요
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'subscription'}
                className={`mg-v2-tab-button${activeTab === 'subscription' ? ' active' : ''}`}
                onClick={() => setActiveTab('subscription')}
              >
                구독 관리
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'payment'}
                className={`mg-v2-tab-button${activeTab === 'payment' ? ' active' : ''}`}
                onClick={() => setActiveTab('payment')}
              >
                결제 수단
              </button>
            </nav>

            <div className="mg-v2-tenant-profile__panel" role="tabpanel">
              {activeTab === 'overview' && (
                <div className="mg-v2-tenant-profile__overview">
                  <ContentSection
                    title="테넌트 정보"
                    actions={
                      canRenameTenant ? (
                        <button
                          type="button"
                          className="mg-v2-button mg-v2-button--outline mg-v2-button--medium"
                          onClick={openTenantNameModal}
                          data-testid="tenant-profile-rename-open"
                        >
                          이름 변경
                        </button>
                      ) : null
                    }
                  >
                    <div className="mg-v2-tenant-profile__grid">
                      <div className="mg-v2-tenant-profile__field">
                        <label>테넌트 ID</label>
                        <p><SafeText>{tenantInfo.tenantId}</SafeText></p>
                      </div>
                      <div className="mg-v2-tenant-profile__field">
                        <label>테넌트명</label>
                        <p><SafeText>{tenantInfo.name}</SafeText></p>
                      </div>
                      <div className="mg-v2-tenant-profile__field">
                        <label>업종</label>
                        <p><SafeText fallback="-">{tenantInfo.businessType}</SafeText></p>
                      </div>
                      <div className="mg-v2-tenant-profile__field">
                        <label>상태</label>
                        <div>{renderStatusBadge(tenantInfo.status)}</div>
                      </div>
                    </div>
                  </ContentSection>

                  <ContentSection title="구독 정보">
                    {subscriptions.length > 0 ? (
                      <div className="subscription-summary">
                        {subscriptions.map((subscription) => (
                          <div key={subscription.subscriptionId} className="subscription-summary-item">
                            <div>
                              <strong><SafeText fallback="요금제">{subscription.planName}</SafeText></strong>
                              <span className={`subscription-status subscription-status--${toDisplayString(subscription.status, 'unknown').toLowerCase()}`}>
                                <SafeText>{subscription.status}</SafeText>
                              </span>
                            </div>
                            {subscription.amount != null && (
                              <div className="subscription-amount">
                                <DollarSign size={16} />
                                {toSafeNumber(subscription.amount).toLocaleString()}원
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">등록된 구독이 없습니다.</p>
                    )}
                  </ContentSection>

                  <ContentSection title="결제 수단">
                    {paymentMethods.length > 0 ? (
                      <div className="payment-method-summary">
                        {paymentMethods.map((pm) => (
                          <div key={pm.paymentMethodId} className="payment-method-summary-item">
                            <CreditCard size={16} />
                            <span><SafeText fallback="결제 수단">{pm.cardNumber ?? pm.methodType}</SafeText></span>
                            {pm.isDefault && (
                              <span className="default-badge">기본</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">등록된 결제 수단이 없습니다.</p>
                    )}
                  </ContentSection>
                </div>
              )}

              {activeTab === 'subscription' && (
                <ContentSection title="구독 관리" className="mg-v2-tenant-profile__subscription-wrap">
                  <SubscriptionManagement tenantId={tenantId} />
                </ContentSection>
              )}

              {activeTab === 'payment' && (
                <ContentSection
                  title="결제 수단 관리"
                  actions={
                    <MGButton
                      type="button"
                      variant="primary"
                      size="small"
                      onClick={() => setShowPaymentMethodRegistration(true)}
                      preventDoubleClick={false}
                    >
                      <Plus size={16} />
                      결제 수단 추가
                    </MGButton>
                  }
                  className="mg-v2-tenant-profile__payment-wrap"
                >
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
                                <SafeText fallback="결제 수단">{pm.cardNumber ?? pm.methodType}</SafeText>
                                {pm.isDefault && (
                                  <span className="default-badge">기본</span>
                                )}
                              </div>
                              {pm.cardExpiry && (
                                <div className="payment-method-expiry">
                                  만료일: <SafeText>{pm.cardExpiry}</SafeText>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="payment-method-actions">
                            {!pm.isDefault && (
                              <button
                                type="button"
                                className="payment-method-action-btn"
                                onClick={() => handleSetDefaultPaymentMethod(pm.paymentMethodId)}
                                title={toDisplayString('기본 결제 수단으로 설정')}
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="payment-method-action-btn payment-method-action-btn--danger"
                              onClick={() => handleDeletePaymentMethod(pm.paymentMethodId)}
                              title={toDisplayString('삭제')}
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
                        <MGButton
                          type="button"
                          variant="primary"
                          onClick={() => setShowPaymentMethodRegistration(true)}
                          preventDoubleClick={false}
                        >
                          <Plus size={16} />
                          결제 수단 추가
                        </MGButton>
                      </div>
                    )}
                  </div>
                </ContentSection>
              )}
            </div>
          </ContentArea>

          <UnifiedModal
            isOpen={showTenantNameModal}
            onClose={closeTenantNameModal}
            title="테넌트명 변경"
            size="small"
            variant="form"
            backdropClick={!tenantNameSaving}
            showCloseButton
            loading={tenantNameSaving}
            aria-describedby={
              tenantNameFieldError || tenantNameServerError ? tenantNameErrorId : undefined
            }
            actions={
              <>
                <button
                  type="button"
                  className="mg-v2-button mg-v2-button--outline mg-v2-button--medium"
                  onClick={closeTenantNameModal}
                  disabled={tenantNameSaving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  form="tenant-profile-rename-form"
                  className="mg-v2-button mg-v2-button--primary mg-v2-button--medium"
                  disabled={tenantNameSaving}
                  data-testid="tenant-profile-rename-save"
                >
                  저장
                </button>
              </>
            }
          >
            <form id="tenant-profile-rename-form" onSubmit={handleTenantNameSave} noValidate>
              <div className="mg-v2-form-group">
                <label className="mg-v2-label" htmlFor={tenantNameInputId}>
                  테넌트명
                </label>
                <input
                  id={tenantNameInputId}
                  name="tenantDisplayName"
                  type="text"
                  className="mg-v2-input"
                  value={tenantNameDraft}
                  onChange={(ev) => {
                    setTenantNameDraft(ev.target.value);
                    if (tenantNameFieldError) {
                      setTenantNameFieldError('');
                    }
                    if (tenantNameServerError) {
                      setTenantNameServerError('');
                    }
                  }}
                  maxLength={TENANT_DISPLAY_NAME_MAX_LENGTH}
                  disabled={tenantNameSaving}
                  autoComplete="organization"
                  aria-invalid={!!(tenantNameFieldError || tenantNameServerError)}
                  aria-describedby={
                    tenantNameFieldError || tenantNameServerError ? tenantNameErrorId : undefined
                  }
                  data-testid="tenant-profile-rename-input"
                />
                {(tenantNameFieldError || tenantNameServerError) && (
                  <p
                    id={tenantNameErrorId}
                    className="mg-v2-form-error"
                    role="alert"
                  >
                    {tenantNameFieldError || tenantNameServerError}
                  </p>
                )}
              </div>
            </form>
          </UnifiedModal>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default TenantProfile;

