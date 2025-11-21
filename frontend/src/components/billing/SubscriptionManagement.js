/**
 * 구독 관리 컴포넌트
 * 
 * 구독 생성, 조회, 활성화, 취소 기능을 제공합니다.
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-20
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import {
  getSubscriptions,
  getPaymentMethods,
  getActivePricingPlans,
  createSubscription,
  activateSubscription,
  cancelSubscription,
  formatCurrency,
  formatCardExpiry,
  getErrorMessage,
  getSubscriptionStatusCodes,
  getBillingCycleCodes,
  getCodeLabel,
} from '../../utils/billingService';
import notificationManager from '../../utils/notification';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import PaymentMethodRegistration from './PaymentMethodRegistration';
import {
  BILLING_CSS,
  ICON_SIZES,
  BILLING_MESSAGES,
  SUBSCRIPTION_CONSTANTS,
  COMMON_CODE_GROUPS,
} from '../../constants/billing';
import './SubscriptionManagement.css';

/**
 * 구독 관리 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.tenantId - 테넌트 ID (선택적, 세션에서 가져옴)
 */
const SubscriptionManagement = ({ tenantId: propTenantId }) => {
  const { user, sessionInfo } = useSession();
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [showPaymentMethodRegistration, setShowPaymentMethodRegistration] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionStatusCodes, setSubscriptionStatusCodes] = useState([]);
  const [billingCycleCodes, setBillingCycleCodes] = useState([]);

  // 테넌트 ID 결정
  const tenantId = propTenantId || sessionInfo?.tenantId || user?.tenantId;

  // 구독 목록 로드
  useEffect(() => {
    if (tenantId) {
      loadSubscriptions();
      loadPaymentMethods();
      loadPricingPlans();
      loadCommonCodes();
    }
  }, [tenantId]);

  /**
   * 공통 코드 로드
   */
  const loadCommonCodes = async () => {
    try {
      const [statusCodes, cycleCodes] = await Promise.all([
        getSubscriptionStatusCodes(),
        getBillingCycleCodes(),
      ]);
      setSubscriptionStatusCodes(statusCodes);
      setBillingCycleCodes(cycleCodes);
    } catch (err) {
      console.error('공통 코드 로드 실패:', err);
    }
  };

  /**
   * 구독 목록 로드
   */
  const loadSubscriptions = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const subscriptions = await getSubscriptions(tenantId);
      setSubscriptions(subscriptions);
    } catch (err) {
      console.error('구독 목록 로드 실패:', err);
      notificationManager.error(BILLING_MESSAGES.ERROR.LOAD_SUBSCRIPTIONS);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 결제 수단 목록 로드
   */
  const loadPaymentMethods = async () => {
    if (!tenantId) return;

    try {
      const methods = await getPaymentMethods(tenantId);
      setPaymentMethods(methods);
    } catch (err) {
      console.error('결제 수단 목록 로드 실패:', err);
      // 조용히 실패 (에러 표시 안 함)
    }
  };

  /**
   * 요금제 목록 로드
   */
  const loadPricingPlans = async () => {
    try {
      const plans = await getActivePricingPlans();
      setPricingPlans(plans);
    } catch (err) {
      console.error('요금제 목록 로드 실패:', err);
      // 조용히 실패 (에러 표시 안 함)
    }
  };

  /**
   * 구독 생성
   */
  const handleCreateSubscription = async (planId, paymentMethodId) => {
    if (!tenantId) {
      notificationManager.error(BILLING_MESSAGES.ERROR.TENANT_NOT_FOUND);
      return;
    }

    try {
      setLoading(true);
      await createSubscription({
        tenantId,
        planId,
        paymentMethodId,
      });

      notificationManager.success(BILLING_MESSAGES.SUCCESS.SUBSCRIPTION_CREATED);
      await loadSubscriptions();
      setShowPaymentMethodRegistration(false);
      setSelectedPlan(null);
    } catch (err) {
      console.error('구독 생성 실패:', err);
      const errorMsg = getErrorMessage(err, BILLING_MESSAGES.ERROR.CREATE_SUBSCRIPTION);
      notificationManager.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 구독 활성화
   */
  const handleActivateSubscription = async (subscriptionId) => {
    try {
      setLoading(true);
      await activateSubscription(subscriptionId);
      notificationManager.success(BILLING_MESSAGES.SUCCESS.SUBSCRIPTION_ACTIVATED);
      await loadSubscriptions();
    } catch (err) {
      console.error('구독 활성화 실패:', err);
      const errorMsg = getErrorMessage(err, BILLING_MESSAGES.ERROR.ACTIVATE_SUBSCRIPTION);
      notificationManager.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 구독 취소
   */
  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm(BILLING_MESSAGES.SUBSCRIPTION.CANCEL_CONFIRM)) {
      return;
    }

    try {
      setLoading(true);
      await cancelSubscription(subscriptionId);
      notificationManager.success(BILLING_MESSAGES.SUCCESS.SUBSCRIPTION_CANCELLED);
      await loadSubscriptions();
    } catch (err) {
      console.error('구독 취소 실패:', err);
      const errorMsg = getErrorMessage(err, BILLING_MESSAGES.ERROR.CANCEL_SUBSCRIPTION);
      notificationManager.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!tenantId) {
    return (
      <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.CONTAINER}>
        <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.ERROR}>
          <AlertCircle size={ICON_SIZES.MEDIUM} />
          <span>{BILLING_MESSAGES.ERROR.TENANT_NOT_FOUND}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.CONTAINER}>
      <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.HEADER}>
        <CreditCard size={ICON_SIZES.LARGE} />
        <h2>{BILLING_MESSAGES.SUBSCRIPTION.TITLE}</h2>
      </div>

      {/* 결제 수단 등록 */}
      {showPaymentMethodRegistration && (
        <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SECTION}>
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

      {/* 결제 수단 목록 */}
      <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SECTION}>
        <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SECTION_HEADER}>
          <h3>{BILLING_MESSAGES.SUBSCRIPTION.PAYMENT_METHODS_TITLE}</h3>
          <MGButton
            variant="secondary"
            size="small"
            onClick={() => setShowPaymentMethodRegistration(true)}
          >
            {BILLING_MESSAGES.SUBSCRIPTION.ADD_PAYMENT_METHOD}
          </MGButton>
        </div>
        {paymentMethods.length === 0 ? (
          <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.EMPTY}>
            <p>{BILLING_MESSAGES.SUBSCRIPTION.NO_PAYMENT_METHODS}</p>
            <MGButton
              variant="primary"
              onClick={() => setShowPaymentMethodRegistration(true)}
            >
              {BILLING_MESSAGES.SUBSCRIPTION.REGISTER_PAYMENT_METHOD}
            </MGButton>
          </div>
        ) : (
          <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.PAYMENT_METHODS}>
            {paymentMethods.map((method) => (
              <div key={method.paymentMethodId} className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.PAYMENT_METHOD}>
                <CreditCard size={ICON_SIZES.MEDIUM} />
                <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.PAYMENT_METHOD_INFO}>
                  <div>
                    <strong>{method.cardBrand || '카드'}</strong>
                    {method.cardLast4 && <span> **** {method.cardLast4}</span>}
                  </div>
                  {method.cardExpMonth && method.cardExpYear && (
                    <small>
                      만료: {formatCardExpiry(method.cardExpMonth, method.cardExpYear)}
                    </small>
                  )}
                </div>
                {method.isDefault && (
                  <span className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.BADGE}>기본</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 구독 목록 */}
      <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SECTION}>
        <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SECTION_HEADER}>
          <h3>{BILLING_MESSAGES.SUBSCRIPTION.SUBSCRIPTIONS_TITLE}</h3>
        </div>
        {loading ? (
          <UnifiedLoading />
        ) : subscriptions.length === 0 ? (
          <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.EMPTY}>
            <p>{BILLING_MESSAGES.SUBSCRIPTION.NO_SUBSCRIPTIONS}</p>
            {pricingPlans.length > 0 && (
              <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.PLANS}>
                <h4>{BILLING_MESSAGES.SUBSCRIPTION.PLAN_SELECTION_TITLE}</h4>
                <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.PLAN_GRID}>
                  {pricingPlans.map((plan) => (
                    <div
                      key={plan.planId}
                      className={`${BILLING_CSS.SUBSCRIPTION_MANAGEMENT.PLAN_CARD} ${
                        selectedPlan?.planId === plan.planId ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <h4>{plan.nameKo || plan.name}</h4>
                      <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.PLAN_PRICE}>
                        {formatCurrency(plan.baseFee, plan.currency)}
                        {BILLING_MESSAGES.SUBSCRIPTION.MONTHLY_LABEL}
                      </div>
                      {plan.descriptionKo && (
                        <p className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.PLAN_DESCRIPTION}>
                          {plan.descriptionKo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {selectedPlan && paymentMethods.length > 0 && (
                  <MGButton
                    variant="primary"
                    onClick={() =>
                      handleCreateSubscription(selectedPlan.planId, paymentMethods[0].paymentMethodId)
                    }
                    fullWidth
                  >
                    {BILLING_MESSAGES.SUBSCRIPTION.CREATE_SUBSCRIPTION}
                  </MGButton>
                )}
                {selectedPlan && paymentMethods.length === 0 && (
                  <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.WARNING}>
                    <AlertCircle size={ICON_SIZES.MEDIUM} />
                    <span>{BILLING_MESSAGES.SUBSCRIPTION.NO_PAYMENT_METHOD_FOR_SUBSCRIPTION}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SUBSCRIPTIONS}>
            {subscriptions.map((subscription) => (
              <div key={subscription.subscriptionId} className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SUBSCRIPTION}>
                <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SUBSCRIPTION_HEADER}>
                  <div>
                    <h4>{subscription.planName || BILLING_MESSAGES.SUBSCRIPTION.DEFAULT_PLAN_NAME}</h4>
                    <SubscriptionStatusBadge
                      status={subscription.status}
                      statusCodes={subscriptionStatusCodes}
                    />
                  </div>
                </div>
                <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SUBSCRIPTION_INFO}>
                  {subscription.billingCycle && (
                    <div>
                      <Calendar size={ICON_SIZES.SMALL} />
                      <span>
                        {BILLING_MESSAGES.SUBSCRIPTION.BILLING_CYCLE_LABEL}:{' '}
                        <BillingCycleLabel cycle={subscription.billingCycle} cycleCodes={billingCycleCodes} />
                      </span>
                    </div>
                  )}
                  {subscription.amount && (
                    <div>
                      <DollarSign size={ICON_SIZES.SMALL} />
                      <span>{formatCurrency(subscription.amount, subscription.currency)}</span>
                    </div>
                  )}
                </div>
                <div className={BILLING_CSS.SUBSCRIPTION_MANAGEMENT.SUBSCRIPTION_ACTIONS}>
                  {subscription.status === SUBSCRIPTION_CONSTANTS.STATUS.PENDING_ACTIVATION && (
                    <MGButton
                      variant="primary"
                      size="small"
                      onClick={() => handleActivateSubscription(subscription.subscriptionId)}
                    >
                      {BILLING_MESSAGES.SUBSCRIPTION.ACTIVATE}
                    </MGButton>
                  )}
                  {subscription.status === SUBSCRIPTION_CONSTANTS.STATUS.ACTIVE && (
                    <MGButton
                      variant="danger"
                      size="small"
                      onClick={() => handleCancelSubscription(subscription.subscriptionId)}
                    >
                      {BILLING_MESSAGES.SUBSCRIPTION.CANCEL}
                    </MGButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 구독 상태 배지 컴포넌트 (공통 코드 기반)
 */
const SubscriptionStatusBadge = ({ status, statusCodes }) => {
  const [statusLabel, setStatusLabel] = useState(status || BILLING_MESSAGES.SUBSCRIPTION.STATUS_UNKNOWN);
  const [statusClass, setStatusClass] = useState('');

  useEffect(() => {
    const loadStatusLabel = async () => {
      if (!status) {
        setStatusLabel(BILLING_MESSAGES.SUBSCRIPTION.STATUS_UNKNOWN);
        return;
      }

      if (statusCodes && statusCodes.length > 0) {
        const code = statusCodes.find(c => c.codeValue === status);
        if (code) {
          setStatusLabel(code.koreanName || code.codeLabel || status);
        } else {
          setStatusLabel(status);
        }
      } else {
        // 공통 코드가 로드되지 않은 경우, 동적으로 조회
        const label = await getCodeLabel(COMMON_CODE_GROUPS.SUBSCRIPTION_STATUS, status);
        setStatusLabel(label);
      }

      // 상태별 CSS 클래스 설정
      const normalizedStatus = status?.toLowerCase() || '';
      if (normalizedStatus.includes('active')) {
        setStatusClass(BILLING_CSS.SUBSCRIPTION_MANAGEMENT.STATUS_ACTIVE);
      } else if (normalizedStatus.includes('pending')) {
        setStatusClass(BILLING_CSS.SUBSCRIPTION_MANAGEMENT.STATUS_PENDING_ACTIVATION);
      } else if (normalizedStatus.includes('cancel')) {
        setStatusClass(BILLING_CSS.SUBSCRIPTION_MANAGEMENT.STATUS_CANCELLED);
      }
    };

    loadStatusLabel();
  }, [status, statusCodes]);

  return (
    <span className={`${BILLING_CSS.SUBSCRIPTION_MANAGEMENT.STATUS} ${statusClass}`}>
      {status === SUBSCRIPTION_CONSTANTS.STATUS.ACTIVE && (
        <CheckCircle size={ICON_SIZES.SMALL} />
      )}
      {status === SUBSCRIPTION_CONSTANTS.STATUS.CANCELLED && (
        <XCircle size={ICON_SIZES.SMALL} />
      )}
      {statusLabel}
    </span>
  );
};

/**
 * 결제 주기 라벨 컴포넌트 (공통 코드 기반)
 */
const BillingCycleLabel = ({ cycle, cycleCodes }) => {
  const [cycleLabel, setCycleLabel] = useState(cycle);

  useEffect(() => {
    const loadCycleLabel = async () => {
      if (!cycle) {
        setCycleLabel('');
        return;
      }

      if (cycleCodes && cycleCodes.length > 0) {
        const code = cycleCodes.find(c => c.codeValue === cycle);
        if (code) {
          setCycleLabel(code.koreanName || code.codeLabel || cycle);
        } else {
          setCycleLabel(cycle);
        }
      } else {
        // 공통 코드가 로드되지 않은 경우, 동적으로 조회
        const label = await getCodeLabel(COMMON_CODE_GROUPS.BILLING_CYCLE, cycle);
        setCycleLabel(label);
      }
    };

    loadCycleLabel();
  }, [cycle, cycleCodes]);

  return <span>{cycleLabel}</span>;
};

export default SubscriptionManagement;

