/**
 * 어드민 — 구독 관리 라우트 페이지 (옵션 C 라우트 부분).
 *
 * 라우트: ADMIN_ROUTES.BILLING_SUBSCRIPTIONS (`/admin/billing/subscriptions`).
 *
 * 디자이너 핸드오프(2026-05-27 §B) 정합:
 *   - AdminCommonLayout + ContentArea + ContentHeader + ContentSection
 *   - mg-v2-ad-b0kla 패턴 + 글로벌 SSOT 너비(var(--mg-container-max)). 페이지 전용 max-width override 금지.
 *   - SimpleLayout / UnifiedHeader 사용 금지 (P1 회귀 가드)
 *   - 빈 상태: EmptyState + B0KlA 일러스트 (TenantSubscriptionEmptyIllustration)
 *   - 데이터 있을 시: ContentSection 내부 카드 그리드 + 액션 ("구독 취소" 등)
 *   - 모달: 구독 등록 / 구독 취소 컨펜은 UnifiedModal (`SubscriptionManagementWrapper` 임베드)
 *
 * 권한: ADMIN/STAFF 진입 가능 (백엔드 추가 가드는 ADMIN 으로 제한).
 *
 * @see docs/project-management/2026-05-27/TENANT_BILLING_MANAGEMENT_DESIGN_HANDOFF.md
 * @author MindGarden
 * @since 2026-05-27
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../../contexts/SessionContext';
import { USER_ROLES, RoleUtils } from '../../../constants/roles';
import { ICONS } from '../../../constants/icons';
import notificationManager from '../../../utils/notification';
import { getSubscriptions, cancelSubscription } from '../../../utils/billingService';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../../dashboard-v2/content';
import EmptyState from '../../common/EmptyState';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import ActionBar from '../../common/ActionBar';
import ActionBarButton from '../../common/ActionBarButton';
import StatusBadge from '../../common/StatusBadge';
import UnifiedLoading from '../../common/UnifiedLoading';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { TenantSubscriptionEmptyIllustration } from '../../tenant/TenantProfileIllustrations';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import SubscriptionManagementWrapper from './wrappers/SubscriptionManagementWrapper';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import './SubscriptionsPage.css';

const ALLOWED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STAFF];
const PAGE_TITLE_ID = 'admin-billing-subscriptions-title';
const DollarSignIcon = ICONS.DOLLAR_SIGN;

const renderSubscriptionStatusBadge = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('active')) {
    return <StatusBadge variant="success"><SafeText>{status}</SafeText></StatusBadge>;
  }
  if (normalized.includes('pending')) {
    return <StatusBadge variant="warning"><SafeText>{status}</SafeText></StatusBadge>;
  }
  if (normalized.includes('cancel') || normalized.includes('terminated') || normalized.includes('suspended')) {
    return <StatusBadge variant="danger"><SafeText>{status}</SafeText></StatusBadge>;
  }
  return <StatusBadge variant="neutral"><SafeText>{status || '-'}</SafeText></StatusBadge>;
};

const SubscriptionsPage = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const { user, sessionInfo, isLoggedIn, isLoading: sessionLoading } = useSession();

  const tenantId = sessionInfo?.tenantId || user?.tenantId;
  const hasAccess = RoleUtils.hasAnyRole(user, ALLOWED_ROLES);

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasAccess) {
      notificationManager.error(t('admin:billing.errors.loadFailed'));
      navigate('/', { replace: true });
    }
  }, [sessionLoading, isLoggedIn, user, hasAccess, navigate, t]);

  const loadList = useCallback(async() => {
    if (!tenantId) {
      return;
    }
    setLoading(true);
    try {
      const list = await getSubscriptions(tenantId);
      setSubscriptions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('구독 목록 조회 실패:', err);
      notificationManager.error(t('admin:billing.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  useEffect(() => {
    if (hasAccess && tenantId) {
      loadList();
    }
  }, [hasAccess, tenantId, loadList]);

  const handleOpenAdd = useCallback(() => setAddModalOpen(true), []);
  const handleCloseAdd = useCallback(() => {
    if (submitting) {
      return;
    }
    setAddModalOpen(false);
  }, [submitting]);

  const handleOpenCancel = useCallback((subscription) => {
    setCancelTarget(subscription);
    setCancelReason('');
  }, []);

  const handleCloseCancel = useCallback(() => {
    if (submitting) {
      return;
    }
    setCancelTarget(null);
    setCancelReason('');
  }, [submitting]);

  const handleConfirmCancel = useCallback(async() => {
    if (!cancelTarget) {
      return;
    }
    setSubmitting(true);
    try {
      await cancelSubscription(cancelTarget.subscriptionId);
      notificationManager.success(t('common.actions.cancel'));
      setCancelTarget(null);
      setCancelReason('');
      await loadList();
    } catch (err) {
      console.error('구독 취소 실패:', err);
      notificationManager.error(t('admin:billing.errors.paymentFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [cancelTarget, loadList, t]);

  const handleSubscriptionRegistered = useCallback(async() => {
    setAddModalOpen(false);
    await loadList();
  }, [loadList]);

  const pageTitle = t('admin:billing.subscriptions.title');
  const pageSubtitle = t('admin:billing.subscriptions.subtitle');
  const addLabel = t('admin:billing.actions.addSubscription');

  if (sessionLoading || !hasAccess) {
    return (
      <AdminCommonLayout title={pageTitle}>
        <div className="mg-admin-billing-subscriptions">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading
              type="inline"
              text={t('admin:billing.subscriptions.loading')}
              variant="pulse"
            />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={pageTitle}>
      <div className="mg-admin-billing-subscriptions" data-testid="admin-billing-subscriptions-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={pageTitle}>
            <ContentHeader
              titleId={PAGE_TITLE_ID}
              title={pageTitle}
              subtitle={pageSubtitle}
              actions={(
                <ActionBarButton
                  variant="primary"
                  onClick={handleOpenAdd}
                  data-testid="admin-billing-add-subscription"
                >
                  {addLabel}
                </ActionBarButton>
              )}
            />

            <ContentSection
              title={pageTitle}
              dataTestId="admin-billing-subscription-section"
            >
              {loading ? (
                <UnifiedLoading
                  type="inline"
                  text={t('admin:billing.subscriptions.loading')}
                  variant="pulse"
                />
              ) : subscriptions.length === 0 ? (
                <EmptyState
                  className="mg-admin-billing-subscriptions__empty"
                  icon={<TenantSubscriptionEmptyIllustration />}
                  title={t('admin:billing.subscriptions.empty.title')}
                  description={t('admin:billing.subscriptions.empty.description')}
                  action={(
                    <MGButton
                      type="button"
                      variant="primary"
                      size="medium"
                      className={buildErpMgButtonClassName({
                        variant: 'primary',
                        size: 'md',
                        loading: false
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={handleOpenAdd}
                      data-testid="admin-billing-empty-subscription-cta"
                      preventDoubleClick={false}
                    >
                      {addLabel}
                    </MGButton>
                  )}
                />
              ) : (
                <ul className="mg-admin-billing-subscriptions__grid">
                  {subscriptions.map((subscription) => (
                    <li
                      key={subscription.subscriptionId}
                      className="mg-admin-billing-subscriptions__card"
                      data-testid="admin-billing-subscription-card"
                    >
                      <header className="mg-admin-billing-subscriptions__card-header">
                        <div>
                          <h3 className="mg-admin-billing-subscriptions__card-title">
                            <SafeText fallback={t('admin:billing.subscriptions.card.defaultPlanName')}>
                              {subscription.planName}
                            </SafeText>
                          </h3>
                          {renderSubscriptionStatusBadge(subscription.status)}
                        </div>
                      </header>
                      <dl className="mg-admin-billing-subscriptions__card-body">
                        {subscription.billingCycle && (
                          <div>
                            <dt>{t('admin:billing.subscriptions.card.billingCycle')}</dt>
                            <dd><SafeText>{subscription.billingCycle}</SafeText></dd>
                          </div>
                        )}
                        {subscription.amount != null && (
                          <div>
                            <dt>{t('admin:billing.subscriptions.card.amount')}</dt>
                            <dd>
                              <DollarSignIcon size={16} aria-hidden="true" />
                              {toSafeNumber(subscription.amount).toLocaleString()}원
                            </dd>
                          </div>
                        )}
                        {subscription.nextBillingDate && (
                          <div>
                            <dt>{t('admin:billing.subscriptions.card.nextBillingDate')}</dt>
                            <dd><SafeText>{toDisplayString(subscription.nextBillingDate, '-')}</SafeText></dd>
                          </div>
                        )}
                      </dl>
                      <footer className="mg-admin-billing-subscriptions__card-actions">
                        <MGButton
                          type="button"
                          variant="danger"
                          size="small"
                          className={buildErpMgButtonClassName({
                            variant: 'danger',
                            size: 'sm',
                            loading: false
                          })}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          onClick={() => handleOpenCancel(subscription)}
                          data-testid="admin-billing-cancel-subscription"
                          preventDoubleClick={false}
                        >
                          {t('admin:billing.actions.cancelSubscription')}
                        </MGButton>
                      </footer>
                    </li>
                  ))}
                </ul>
              )}
            </ContentSection>
          </ContentArea>
        </div>

        {/* §C-2: 구독 등록·변경 모달 */}
        <UnifiedModal
          isOpen={addModalOpen}
          onClose={handleCloseAdd}
          title={t('admin:billing.modal.addSubscription.title')}
          subtitle={t('admin:billing.modal.addSubscription.description')}
          size="large"
          variant="form"
          backdropClick={!submitting}
          showCloseButton
          loading={submitting}
          closeButtonDataTestId="admin-billing-add-subscription-close"
        >
          <SubscriptionManagementWrapper
            tenantId={tenantId}
            onCompleted={handleSubscriptionRegistered}
          />
        </UnifiedModal>

        {/* §C-3: 구독 취소 컨펜 모달 */}
        <UnifiedModal
          isOpen={Boolean(cancelTarget)}
          onClose={handleCloseCancel}
          title={t('admin:billing.modal.cancelSubscription.title')}
          subtitle={t('admin:billing.modal.cancelSubscription.description')}
          size="small"
          variant="confirm"
          backdropClick={!submitting}
          showCloseButton
          loading={submitting}
          actions={(
            <ActionBar align="end" gap="md">
              <ActionBarButton
                variant="outline"
                onClick={handleCloseCancel}
                disabled={submitting}
                data-testid="admin-billing-cancel-subscription-close"
              >
                {t('admin:billing.actions.close')}
              </ActionBarButton>
              <ActionBarButton
                variant="danger"
                onClick={handleConfirmCancel}
                loading={submitting}
                data-testid="admin-billing-cancel-subscription-confirm"
              >
                {t('admin:billing.actions.confirm')}
              </ActionBarButton>
            </ActionBar>
          )}
        >
          <form noValidate>
            <div className="mg-admin-billing-subscriptions__reason">
              <label className="mg-v2-label" htmlFor="admin-billing-cancel-reason">
                {t('admin:billing.modal.cancelSubscription.reasonLabel')}
              </label>
              <textarea
                id="admin-billing-cancel-reason"
                className="mg-v2-textarea"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={submitting}
                data-testid="admin-billing-cancel-subscription-reason"
              />
              <p className="mg-admin-billing-subscriptions__policy">
                {t('admin:billing.modal.cancelSubscription.refundPolicy')}
              </p>
            </div>
          </form>
        </UnifiedModal>
      </div>
    </AdminCommonLayout>
  );
};

export default SubscriptionsPage;
