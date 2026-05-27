/**
 * 테넌트 프로필/설정 페이지
 * 테넌트 상태, 구독 정보, 결제 수단을 통합 관리
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { ICONS } from '../../constants/icons';

const CreditCardIcon = ICONS.CREDIT_CARD;
const DollarSignIcon = ICONS.DOLLAR_SIGN;
const AlertCircleIcon = ICONS.ALERT_CIRCLE;
import { getPaymentMethods, getSubscriptions } from '../../utils/billingService';
import notificationManager from '../../utils/notification';
import StandardizedApi from '../../utils/standardizedApi';
import UnifiedLoading from '../common/UnifiedLoading';
import StatusBadge from '../common/StatusBadge';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import MGButton from '../common/MGButton';
import EmptyState from '../common/EmptyState';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import SafeText from '../common/SafeText';
import UnifiedModal from '../common/modals/UnifiedModal';
import {
  TenantSubscriptionEmptyIllustration,
  TenantPaymentEmptyIllustration
} from './TenantProfileIllustrations';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import {
  TENANT_API_PATHS,
  TENANT_DISPLAY_NAME_MAX_LENGTH,
  canEditTenantDisplayName
} from '../../constants/tenantApi';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import {
  TENANT_PROFILE_NOTIFICATIONS_SECTION_TITLE,
  TENANT_PROFILE_KAKAO_ALIMTALK_LABEL,
  TENANT_PROFILE_KAKAO_ALIMTALK_SETTINGS_BUTTON,
  TENANT_PROFILE_SMS_CHANNEL_LABEL,
  TENANT_PROFILE_SMS_SETTINGS_BUTTON
} from '../../constants/tenantProfileStrings';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './TenantProfile.css';
import { USER_ROLES } from '../../constants/roles';
import { useTranslation } from 'react-i18next';

const TenantProfile = () => {
  const { t } = useTranslation(['common', 'admin']);
  const navigate = useNavigate();
  const {
    user,
    sessionInfo,
    isLoggedIn,
    isLoading: sessionLoading,
    checkSession,
    hasAnyRole
  } = useSession();
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
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
  const canOpenAdminNotificationSettings = hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.STAFF]);

  const renderChangeNameButton = (size = 'medium') => (
    <MGButton
      type="button"
      variant="outline"
      size={size}
      className={buildErpMgButtonClassName({
        variant: 'outline',
        size: size === 'medium' ? 'md' : size,
        loading: false
      })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={openTenantNameModal}
      aria-label={t('admin:tenantProfile.actions.changeNameAria')}
      data-testid="tenant-profile-rename-open"
      preventDoubleClick={false}
    >
      {t('admin:tenantProfile.actions.changeName')}
    </MGButton>
  );

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
  const loadTenantInfo = async(options = {}) => {
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

  const handleTenantNameSave = async(e) => {
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
      try {
        await checkSession(true);
      } catch (syncErr) {
        console.debug('세션 사용자 정보 동기화 실패(무시):', syncErr);
      }
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
  const loadSubscriptions = async() => {
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
  const loadPaymentMethods = async() => {
    if (!tenantId) return;

    try {
      const paymentMethods = await getPaymentMethods(tenantId);
      setPaymentMethods(paymentMethods || []);
    } catch (err) {
      console.error('결제 수단 로드 실패:', err);
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
      <AdminCommonLayout title={t('common:tenant.TenantProfile.t_326425a6')}>
        <div className="mg-v2-tenant-profile">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="inline" text={t('common:tenant.TenantProfile.t_42f5bfb9')} variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (!tenantId) {
    return (
      <AdminCommonLayout title={t('common:tenant.TenantProfile.t_326425a6')}>
        <div className="mg-v2-tenant-profile">
          <div className="mg-v2-ad-b0kla__container">
            <div className="tenant-profile-error">
              <AlertCircleIcon size={24} />
              <p>{t('common:tenant.TenantProfile.t_8f990fec')}</p>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (loading) {
    return (
      <AdminCommonLayout title={t('common:tenant.TenantProfile.t_326425a6')}>
        <div className="mg-v2-tenant-profile">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="inline" text={t('common:tenant.TenantProfile.t_ca5bf104')} variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (!tenantInfo) {
    return (
      <AdminCommonLayout title={t('common:tenant.TenantProfile.t_326425a6')}>
        <div className="mg-v2-tenant-profile">
          <div className="mg-v2-ad-b0kla__container">
            <div className="tenant-profile-error">
              <AlertCircleIcon size={24} />
              <p>{t('common:tenant.TenantProfile.t_8f990fec')}</p>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={t('common:tenant.TenantProfile.t_326425a6')}>
      <div className="mg-v2-tenant-profile">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={t('admin:tenantProfile.header.regionLabel')}>
            <div className="tenant-profile-header">
              <ContentHeader
                title={toDisplayString(tenantInfo.name, '테넌트')}
                subtitle={t('admin:tenantProfile.header.subtitle')}
                titleId="tenant-profile-title"
                actions={(
                  <div className="mg-v2-tenant-profile__header-actions">
                    {canRenameTenant ? renderChangeNameButton('medium') : null}
                    {renderStatusBadge(tenantInfo.status)}
                  </div>
                )}
              />
            </div>

            <div
              className="mg-v2-ad-b0kla__pill-toggle mg-v2-tenant-profile__pill-toggle"
              role="tablist"
              aria-label={t('common:tenant.TenantProfile.t_15c8471b')}
            >
              <MGButton
                type="button"
                role="tab"
                aria-selected={activeTab === 'overview'}
                variant="outline"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'md',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill ${activeTab === 'overview' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setActiveTab('overview')}
                preventDoubleClick={false}
              >
                {t('common:tenant.TenantProfile.t_476966c5')}
              </MGButton>
              <MGButton
                type="button"
                role="tab"
                aria-selected={activeTab === 'subscription'}
                variant="outline"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'md',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill ${activeTab === 'subscription' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setActiveTab('subscription')}
                preventDoubleClick={false}
              >
                {t('common:tenant.TenantProfile.t_3ba22bb7')}
              </MGButton>
              <MGButton
                type="button"
                role="tab"
                aria-selected={activeTab === 'payment'}
                variant="outline"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'md',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill ${activeTab === 'payment' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setActiveTab('payment')}
                preventDoubleClick={false}
              >
                {t('common:tenant.TenantProfile.t_bb94631a')}
              </MGButton>
            </div>

            <div
              className="mg-v2-tenant-profile__panel tenant-profile-content"
              role="tabpanel"
            >
              {activeTab === 'overview' && (
                <div className="mg-v2-tenant-profile__overview tenant-profile-overview">
                  <ContentSection title={t('admin:tenantProfile.card.tenantInfo')}>
                    <div className="mg-v2-tenant-profile__grid mg-v2-tenant-profile__grid--two-col">
                      <div className="mg-v2-tenant-profile__column">
                        <div className="mg-v2-tenant-profile__field">
                          <label>{t('common:tenant.TenantProfile.t_065dd028')}</label>
                          <p><SafeText>{tenantInfo.tenantId}</SafeText></p>
                        </div>
                        <div className="mg-v2-tenant-profile__field">
                          <label>{t('common:tenant.TenantProfile.t_dacf2653')}</label>
                          <p><SafeText>{tenantInfo.name}</SafeText></p>
                        </div>
                      </div>
                      <div className="mg-v2-tenant-profile__column">
                        <div className="mg-v2-tenant-profile__field">
                          <label>{t('common:tenant.TenantProfile.t_0fb1a92d')}</label>
                          <p><SafeText fallback="-">{tenantInfo.businessType}</SafeText></p>
                        </div>
                        <div className="mg-v2-tenant-profile__field">
                          <label>{t('admin.labels.status')}</label>
                          <div>{renderStatusBadge(tenantInfo.status)}</div>
                        </div>
                      </div>
                    </div>
                  </ContentSection>

                  <ContentSection title={t('admin:tenantProfile.card.notifications', { defaultValue: TENANT_PROFILE_NOTIFICATIONS_SECTION_TITLE })}>
                    <div className="mg-v2-tenant-profile__grid">
                      <div className="mg-v2-tenant-profile__field">
                        <label>{TENANT_PROFILE_KAKAO_ALIMTALK_LABEL}</label>
                        <div>
                          {canOpenAdminNotificationSettings ? (
                            <MGButton
                              type="button"
                              variant="outline"
                              size="medium"
                              className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'md',
                                loading: false
                              })}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              onClick={() => navigate(ADMIN_ROUTES.KAKAO_ALIMTALK_SETTINGS)}
                              data-testid="tenant-profile-kakao-alimtalk-settings"
                              preventDoubleClick={false}
                            >
                              {TENANT_PROFILE_KAKAO_ALIMTALK_SETTINGS_BUTTON}
                            </MGButton>
                          ) : null}
                        </div>
                      </div>
                      <div className="mg-v2-tenant-profile__field">
                        <label>{TENANT_PROFILE_SMS_CHANNEL_LABEL}</label>
                        <div>
                          {canOpenAdminNotificationSettings ? (
                            <MGButton
                              type="button"
                              variant="outline"
                              size="medium"
                              className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'md',
                                loading: false
                              })}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              onClick={() => navigate(ADMIN_ROUTES.TENANT_SMS_SETTINGS)}
                              data-testid="tenant-profile-sms-settings"
                              preventDoubleClick={false}
                            >
                              {TENANT_PROFILE_SMS_SETTINGS_BUTTON}
                            </MGButton>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </ContentSection>

                  <ContentSection
                    title={t('admin:tenantProfile.card.subscription', { defaultValue: t('common:tenant.TenantProfile.t_d37f5764') })}
                    className="mg-v2-tenant-profile__overview-card"
                  >
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
                                <DollarSignIcon size={16} />
                                {toSafeNumber(subscription.amount).toLocaleString()}원
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        className="mg-v2-tenant-profile__empty"
                        icon={<TenantSubscriptionEmptyIllustration />}
                        title={t('admin:tenantProfile.empty.subscription.headline')}
                        description={t('admin:tenantProfile.empty.subscription.subcopy')}
                        action={(
                          <MGButton
                            type="button"
                            variant="primary"
                            size="medium"
                            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => setActiveTab('subscription')}
                            data-testid="tenant-profile-empty-subscription-cta"
                            preventDoubleClick={false}
                          >
                            {t('admin:tenantProfile.empty.subscription.cta')}
                          </MGButton>
                        )}
                      />
                    )}
                  </ContentSection>

                  <ContentSection
                    title={t('admin:tenantProfile.card.payment', { defaultValue: t('common:tenant.TenantProfile.t_bb94631a') })}
                    className="mg-v2-tenant-profile__overview-card"
                  >
                    {paymentMethods.length > 0 ? (
                      <div className="payment-method-summary">
                        {paymentMethods.map((pm) => (
                          <div key={pm.paymentMethodId} className="payment-method-summary-item">
                            <CreditCardIcon size={16} />
                            <span><SafeText fallback="결제 수단">{pm.cardNumber ?? pm.methodType}</SafeText></span>
                            {pm.isDefault && (
                              <span className="default-badge">{t('common:tenant.TenantProfile.t_7f1d8c41')}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        className="mg-v2-tenant-profile__empty"
                        icon={<TenantPaymentEmptyIllustration />}
                        title={t('admin:tenantProfile.empty.payment.headline')}
                        description={t('admin:tenantProfile.empty.payment.subcopy')}
                        action={(
                          <MGButton
                            type="button"
                            variant="primary"
                            size="medium"
                            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => setActiveTab('payment')}
                            data-testid="tenant-profile-empty-payment-cta"
                            preventDoubleClick={false}
                          >
                            {t('admin:tenantProfile.empty.payment.cta')}
                          </MGButton>
                        )}
                      />
                    )}
                  </ContentSection>
                </div>
              )}

              {activeTab === 'subscription' && (
                <ContentSection
                  title={t('admin:tenantProfile.card.subscription', { defaultValue: t('common:tenant.TenantProfile.t_d37f5764') })}
                  className="mg-v2-tenant-profile__subscription-wrap tenant-profile-subscription"
                  data-testid="tenant-profile-subscription-section"
                >
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
                              <DollarSignIcon size={16} />
                              {toSafeNumber(subscription.amount).toLocaleString()}원
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      className="mg-v2-tenant-profile__empty"
                      icon={<TenantSubscriptionEmptyIllustration />}
                      title={t('admin:tenantProfile.empty.subscription.headline')}
                      description={t('admin:tenantProfile.empty.subscription.subcopy')}
                    />
                  )}
                </ContentSection>
              )}

              {activeTab === 'payment' && (
                <ContentSection
                  title={t('admin:tenantProfile.card.payment', { defaultValue: t('common:tenant.TenantProfile.t_bb94631a') })}
                  className="mg-v2-tenant-profile__payment-wrap tenant-profile-payment"
                  data-testid="tenant-profile-payment-section"
                >
                  {paymentMethods.length > 0 ? (
                    <div className="payment-method-summary">
                      {paymentMethods.map((pm) => (
                        <div key={pm.paymentMethodId} className="payment-method-summary-item">
                          <CreditCardIcon size={16} />
                          <span><SafeText fallback="결제 수단">{pm.cardNumber ?? pm.methodType}</SafeText></span>
                          {pm.cardExpiry && (
                            <span className="payment-method-expiry">
                              {t('common:tenant.TenantProfile.t_fabb8d23')} <SafeText>{pm.cardExpiry}</SafeText>
                            </span>
                          )}
                          {pm.isDefault && (
                            <span className="default-badge">{t('common:tenant.TenantProfile.t_7f1d8c41')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      className="mg-v2-tenant-profile__empty"
                      icon={<TenantPaymentEmptyIllustration />}
                      title={t('admin:tenantProfile.empty.payment.headline')}
                      description={t('admin:tenantProfile.empty.payment.subcopy')}
                    />
                  )}
                </ContentSection>
              )}
            </div>
          </ContentArea>

          <UnifiedModal
            isOpen={showTenantNameModal}
            onClose={closeTenantNameModal}
            title={t('common:tenant.TenantProfile.t_3981095c')}
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
                <MGButton
                  type="button"
                  variant="outline"
                  size="medium"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={closeTenantNameModal}
                  disabled={tenantNameSaving}
                  preventDoubleClick={false}
                >
                  {t('admin.actions.cancel')}
                </MGButton>
                <MGButton
                  type="submit"
                  form="tenant-profile-rename-form"
                  variant="primary"
                  size="medium"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: tenantNameSaving
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  disabled={tenantNameSaving}
                  loading={tenantNameSaving}
                  data-testid="tenant-profile-rename-save"
                  preventDoubleClick={false}
                >
                  {t('common.actions.save')}
                </MGButton>
              </>
            }
          >
            <form id="tenant-profile-rename-form" onSubmit={handleTenantNameSave} noValidate>
              <div className="mg-v2-form-group">
                <label className="mg-v2-label" htmlFor={tenantNameInputId}>
                  {t('common:tenant.TenantProfile.t_dacf2653')}
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

