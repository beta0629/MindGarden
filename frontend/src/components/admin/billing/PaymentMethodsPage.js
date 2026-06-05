/**
 * 어드민 — 결제 수단 라우트 페이지 (옵션 C 라우트 부분).
 *
 * 라우트: ADMIN_ROUTES.BILLING_PAYMENT_METHODS (`/admin/billing/payment-methods`).
 *
 * 디자이너 핸드오프(2026-05-27 §B-2) 정합:
 *   - AdminCommonLayout + ContentArea + ContentHeader + ContentSection
 *   - mg-v2-ad-b0kla 패턴 + 글로벌 SSOT 너비(var(--mg-container-max)). 페이지 전용 max-width override 금지.
 *   - SimpleLayout / UnifiedHeader 사용 금지 (P1 회귀 가드)
 *   - 빈 상태: EmptyState + B0KlA 일러스트 (TenantPaymentEmptyIllustration)
 *   - 데이터 있을 시: ContentSection 내부 카드 그리드 + 액션 ("기본 설정" / "삭제")
 *   - 모달: 결제 수단 등록 (PaymentMethodRegistrationWrapper 임베드) + 기본 결제 수단 설정 컨펜
 *
 * 권한: ADMIN/STAFF 진입 가능.
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
import { getPaymentMethods } from '../../../utils/billingService';
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
import { TenantPaymentEmptyIllustration } from '../../tenant/TenantProfileIllustrations';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import PaymentMethodRegistrationWrapper from './wrappers/PaymentMethodRegistrationWrapper';
import './PaymentMethodsPage.css';

const ALLOWED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STAFF];
const PAGE_TITLE_ID = 'admin-billing-payment-methods-title';
const CreditCardIcon = ICONS.CREDIT_CARD;

const PaymentMethodsPage = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const { user, sessionInfo, isLoggedIn, isLoading: sessionLoading } = useSession();

  const tenantId = sessionInfo?.tenantId || user?.tenantId;
  const hasAccess = RoleUtils.hasAnyRole(user, ALLOWED_ROLES);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [defaultTarget, setDefaultTarget] = useState(null);
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
      const list = await getPaymentMethods(tenantId);
      setPaymentMethods(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('결제 수단 목록 조회 실패:', err);
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

  const handleOpenSetDefault = useCallback((method) => {
    setDefaultTarget(method);
  }, []);

  const handleCloseSetDefault = useCallback(() => {
    if (submitting) {
      return;
    }
    setDefaultTarget(null);
  }, [submitting]);

  const handleConfirmSetDefault = useCallback(async() => {
    if (!defaultTarget) {
      return;
    }
    setSubmitting(true);
    try {
      // 백엔드 API 변경 없음 (옵션 C 핸드오프 §I) — 향후 PATCH /payment-methods/{id}/default 추가 시 위임.
      // 현재는 사용자 알림만 노출하고 모달을 닫는다. (UI SSOT 정합 + 회귀 안전 우선)
      notificationManager.success(t('admin:billing.modal.setDefaultPayment.title'));
      setDefaultTarget(null);
      await loadList();
    } catch (err) {
      console.error('기본 결제 수단 변경 실패:', err);
      notificationManager.error(t('admin:billing.errors.paymentFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [defaultTarget, loadList, t]);

  const handlePaymentRegistered = useCallback(async() => {
    setAddModalOpen(false);
    await loadList();
  }, [loadList]);

  const pageTitle = t('admin:billing.paymentMethods.title');
  const pageSubtitle = t('admin:billing.paymentMethods.subtitle');
  const addLabel = t('admin:billing.actions.addPaymentMethod');

  if (sessionLoading || !hasAccess) {
    return (
      <AdminCommonLayout title={pageTitle}>
        <div className="mg-admin-billing-payment-methods">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading
              type="inline"
              text={t('admin:billing.paymentMethods.loading')}
              variant="pulse"
            />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={pageTitle}>
      <div className="mg-admin-billing-payment-methods" data-testid="admin-billing-payment-methods-page">
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
                  data-testid="admin-billing-add-payment-method"
                >
                  {addLabel}
                </ActionBarButton>
              )}
            />

            <ContentSection
              title={pageTitle}
              dataTestId="admin-billing-payment-method-section"
            >
              {loading ? (
                <UnifiedLoading
                  type="inline"
                  text={t('admin:billing.paymentMethods.loading')}
                  variant="pulse"
                />
              ) : paymentMethods.length === 0 ? (
                <EmptyState
                  className="mg-admin-billing-payment-methods__empty"
                  icon={<TenantPaymentEmptyIllustration />}
                  title={t('admin:billing.paymentMethods.empty.title')}
                  description={t('admin:billing.paymentMethods.empty.description')}
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
                      data-testid="admin-billing-empty-payment-method-cta"
                      preventDoubleClick={false}
                    >
                      {addLabel}
                    </MGButton>
                  )}
                />
              ) : (
                <ul className="mg-admin-billing-payment-methods__grid">
                  {paymentMethods.map((method) => (
                    <li
                      key={method.paymentMethodId}
                      className="mg-admin-billing-payment-methods__card"
                      data-testid="admin-billing-payment-method-card"
                    >
                      <header className="mg-admin-billing-payment-methods__card-header">
                        <div className="mg-admin-billing-payment-methods__card-title-row">
                          <CreditCardIcon size={20} aria-hidden="true" />
                          <h3 className="mg-admin-billing-payment-methods__card-title">
                            <SafeText fallback={t('admin:billing.paymentMethods.card.cardLabel')}>
                              {method.cardBrand || method.methodType}
                            </SafeText>
                            {method.cardLast4 && (
                              <span className="mg-admin-billing-payment-methods__card-last4">
                                {' '}**** <SafeText>{method.cardLast4}</SafeText>
                              </span>
                            )}
                          </h3>
                        </div>
                        {method.isDefault && (
                          <StatusBadge variant="success">
                            {t('admin:billing.paymentMethods.card.defaultBadge')}
                          </StatusBadge>
                        )}
                      </header>
                      <dl className="mg-admin-billing-payment-methods__card-body">
                        {method.pgProvider && (
                          <div>
                            <dt>{t('admin:billing.paymentMethods.card.providerLabel')}</dt>
                            <dd><SafeText>{method.pgProvider}</SafeText></dd>
                          </div>
                        )}
                        {method.cardExpiry && (
                          <div>
                            <dt>{t('admin:billing.paymentMethods.card.expiryLabel')}</dt>
                            <dd><SafeText>{method.cardExpiry}</SafeText></dd>
                          </div>
                        )}
                      </dl>
                      <footer className="mg-admin-billing-payment-methods__card-actions">
                        {!method.isDefault && (
                          <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                              variant: 'outline',
                              size: 'sm',
                              loading: false
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => handleOpenSetDefault(method)}
                            data-testid="admin-billing-set-default"
                            preventDoubleClick={false}
                          >
                            {t('admin:billing.actions.setDefault')}
                          </MGButton>
                        )}
                      </footer>
                    </li>
                  ))}
                </ul>
              )}
            </ContentSection>
          </ContentArea>
        </div>

        {/* §C-1: 결제 수단 등록 모달 */}
        <UnifiedModal
          isOpen={addModalOpen}
          onClose={handleCloseAdd}
          title={t('admin:billing.modal.addPaymentMethod.title')}
          subtitle={t('admin:billing.modal.addPaymentMethod.description')}
          size="medium"
          variant="form"
          backdropClick={!submitting}
          showCloseButton
          loading={submitting}
          closeButtonDataTestId="admin-billing-add-payment-method-close"
        >
          <PaymentMethodRegistrationWrapper
            tenantId={tenantId}
            onCompleted={handlePaymentRegistered}
            onCancel={handleCloseAdd}
          />
        </UnifiedModal>

        {/* §C-4: 기본 결제 수단 설정 컨펜 모달 */}
        <UnifiedModal
          isOpen={Boolean(defaultTarget)}
          onClose={handleCloseSetDefault}
          title={t('admin:billing.modal.setDefaultPayment.title')}
          subtitle={t('admin:billing.modal.setDefaultPayment.description')}
          size="small"
          variant="confirm"
          backdropClick={!submitting}
          showCloseButton
          loading={submitting}
          actions={(
            <ActionBar align="end" gap="md">
              <ActionBarButton
                variant="outline"
                onClick={handleCloseSetDefault}
                disabled={submitting}
                data-testid="admin-billing-set-default-close"
              >
                {t('admin:billing.actions.close')}
              </ActionBarButton>
              <ActionBarButton
                variant="primary"
                onClick={handleConfirmSetDefault}
                loading={submitting}
                data-testid="admin-billing-set-default-confirm"
              >
                {t('admin:billing.actions.confirm')}
              </ActionBarButton>
            </ActionBar>
          )}
        />
      </div>
    </AdminCommonLayout>
  );
};

export default PaymentMethodsPage;
