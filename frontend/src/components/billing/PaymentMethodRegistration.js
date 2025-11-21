/**
 * 결제 수단 등록 컴포넌트
 * 
 * PG SDK를 사용하여 자동결제(빌링) 등록을 처리합니다.
 * 토스페이먼츠 SDK v2의 requestBillingAuth()를 사용합니다.
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-20
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { requestBillingAuth, PG_PROVIDER } from '../../utils/paymentGateway';
import { generateUUID, generateCallbackUrl, getPgProviderCodes, getCodeLabel } from '../../utils/billingService';
import { BILLING_CSS, ICON_SIZES, BILLING_MESSAGES, CALLBACK_STATUS, COMMON_CODE_GROUPS } from '../../constants/billing';
import MGButton from '../common/MGButton';
import './PaymentMethodRegistration.css';

/**
 * 결제 수단 등록 컴포넌트
 * 
 * @param {Object} props
 * @param {Function} props.onSuccess - 등록 성공 시 콜백
 * @param {Function} props.onCancel - 취소 시 콜백
 * @param {string} props.tenantId - 테넌트 ID (선택적, 세션에서 가져옴)
 * @param {string} props.pgProvider - PG 제공자 (기본값: TOSS)
 */
const PaymentMethodRegistration = ({
  onSuccess,
  onCancel,
  tenantId: propTenantId,
  pgProvider = PG_PROVIDER.TOSS,
}) => {
  const { user, sessionInfo } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customerKey, setCustomerKey] = useState(null);
  const [pgProviderName, setPgProviderName] = useState('');

  // 테넌트 ID 결정 (prop > session > user)
  const tenantId = propTenantId || sessionInfo?.tenantId || user?.tenantId;

  // 고객 고유 ID 생성 (UUID)
  useEffect(() => {
    if (!customerKey && tenantId) {
      const uuid = generateUUID();
      setCustomerKey(uuid);
    }
  }, [customerKey, tenantId]);

  // PG 제공자 이름 로드
  useEffect(() => {
    const loadPgProviderName = async () => {
      try {
        const label = await getCodeLabel(COMMON_CODE_GROUPS.PG_PROVIDER, pgProvider);
        setPgProviderName(label);
      } catch (err) {
        console.error('PG 제공자 이름 조회 실패:', err);
        // 기본값 사용
        const defaultNames = {
          [PG_PROVIDER.TOSS]: '토스페이먼츠',
          [PG_PROVIDER.STRIPE]: '스트라이프',
          [PG_PROVIDER.IAMPORT]: '아임포트',
        };
        setPgProviderName(defaultNames[pgProvider] || pgProvider);
      }
    };

    if (pgProvider) {
      loadPgProviderName();
    }
  }, [pgProvider]);

  /**
   * 자동결제 등록 시작
   */
  const handleRegister = async () => {
    if (!tenantId) {
      setError(BILLING_MESSAGES.REGISTRATION.ERROR_TENANT_NOT_FOUND);
      return;
    }

    if (!customerKey) {
      setError(BILLING_MESSAGES.REGISTRATION.ERROR_CUSTOMER_KEY_GENERATION);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 성공/실패 URL 생성
      const successUrl = generateCallbackUrl(CALLBACK_STATUS.SUCCESS, customerKey, tenantId);
      const failUrl = generateCallbackUrl(CALLBACK_STATUS.FAIL, customerKey, tenantId);

      // PG SDK를 사용하여 자동결제 등록창 열기
      await requestBillingAuth(
        {
          customerKey,
          customerName: user?.name || user?.username || '',
          customerEmail: user?.email || '',
          successUrl,
          failUrl,
        },
        pgProvider
      );

      // 리다이렉트되므로 여기까지 오지 않음
    } catch (err) {
      console.error('결제 수단 등록 실패:', err);
      setError(err.message || BILLING_MESSAGES.REGISTRATION.ERROR_REGISTRATION_FAILED);
      setLoading(false);
    }
  };

  if (!tenantId) {
    return (
      <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.CONTAINER}>
        <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.ERROR}>
          <AlertCircle size={ICON_SIZES.MEDIUM} />
          <span>{BILLING_MESSAGES.REGISTRATION.ERROR_TENANT_NOT_FOUND}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.CONTAINER}>
      <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.HEADER}>
        <CreditCard size={ICON_SIZES.LARGE} />
        <h3>{BILLING_MESSAGES.REGISTRATION.TITLE}</h3>
      </div>

      <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.CONTENT}>
        <p className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.DESCRIPTION}>
          {BILLING_MESSAGES.REGISTRATION.DESCRIPTION}
          <br />
          <small>{BILLING_MESSAGES.REGISTRATION.DESCRIPTION_SECONDARY}</small>
        </p>

        {error && (
          <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.ERROR}>
            <AlertCircle size={ICON_SIZES.MEDIUM} />
            <span>{error}</span>
          </div>
        )}

        <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.INFO}>
          <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.INFO_ITEM}>
            <strong>{BILLING_MESSAGES.REGISTRATION.PG_PROVIDER_LABEL}:</strong>
            <span>{pgProviderName || pgProvider}</span>
          </div>
          <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.INFO_ITEM}>
            <strong>{BILLING_MESSAGES.REGISTRATION.CUSTOMER_ID_LABEL}:</strong>
            <span className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.CUSTOMER_KEY}>
              {customerKey || BILLING_MESSAGES.REGISTRATION.GENERATING}
            </span>
          </div>
        </div>
      </div>

      <div className={BILLING_CSS.PAYMENT_METHOD_REGISTRATION.FOOTER}>
        {onCancel && (
          <MGButton
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {BILLING_MESSAGES.REGISTRATION.CANCEL_BUTTON}
          </MGButton>
        )}
        <MGButton
          variant="primary"
          onClick={handleRegister}
          disabled={loading || !customerKey}
          loading={loading}
          loadingText={BILLING_MESSAGES.REGISTRATION.REGISTERING}
        >
          {BILLING_MESSAGES.REGISTRATION.REGISTER_BUTTON}
        </MGButton>
      </div>
    </div>
  );
};

export default PaymentMethodRegistration;

