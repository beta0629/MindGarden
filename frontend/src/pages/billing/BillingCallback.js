/**
 * 결제 수단 등록 콜백 페이지
 * 
 * PG SDK의 requestBillingAuth() 성공/실패 콜백을 처리합니다.
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-20
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { registerPaymentMethod } from '../../utils/billingService';
import { formatCardLast4 } from '../../utils/billingService';
import { getErrorMessage } from '../../utils/billingService';
import notificationManager from '../../utils/notification';
import MGButton from '../../components/common/MGButton';
import SimpleLayout from '../../components/layout/SimpleLayout';
import {
  BILLING_CSS,
  ICON_SIZES,
  BILLING_MESSAGES,
  CALLBACK_PARAMS,
  CALLBACK_STATUS,
  BILLING_ROUTES,
  PG_PROVIDER,
} from '../../constants/billing';
import './BillingCallback.css';

/**
 * 결제 수단 등록 콜백 페이지
 */
const BillingCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 'success' | 'fail' | 'processing'
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const statusParam = searchParams.get(CALLBACK_PARAMS.STATUS);
  const customerKey = searchParams.get(CALLBACK_PARAMS.CUSTOMER_KEY);
  const tenantId = searchParams.get(CALLBACK_PARAMS.TENANT_ID);
  const authKey = searchParams.get(CALLBACK_PARAMS.AUTH_KEY);
  const errorCode = searchParams.get(CALLBACK_PARAMS.ERROR_CODE);
  const errorMessage = searchParams.get(CALLBACK_PARAMS.ERROR_MESSAGE);

  useEffect(() => {
    const processCallback = async () => {
      if (!statusParam) {
        setError(BILLING_MESSAGES.CALLBACK.ERROR_MISSING_STATUS);
        setStatus(CALLBACK_STATUS.FAIL);
        setLoading(false);
        return;
      }

      if (statusParam === CALLBACK_STATUS.FAIL) {
        // 실패 처리
        setStatus(CALLBACK_STATUS.FAIL);
        const errorMsg = errorMessage || errorCode || BILLING_MESSAGES.CALLBACK.FAIL_DESCRIPTION;
        setError(errorMsg);
        setLoading(false);
        notificationManager.error(errorMsg);
        return;
      }

      if (statusParam === CALLBACK_STATUS.SUCCESS) {
        // 성공 처리
        if (!authKey || !customerKey || !tenantId) {
          setError(BILLING_MESSAGES.CALLBACK.ERROR_MISSING_PARAMS);
          setStatus(CALLBACK_STATUS.FAIL);
          setLoading(false);
          return;
        }

        try {
          setStatus(CALLBACK_STATUS.PROCESSING);

          // 백엔드에 결제 수단 등록 요청
          const paymentMethodData = await registerPaymentMethod({
            paymentMethodToken: authKey,
            pgProvider: PG_PROVIDER.TOSS,
            customerKey,
            tenantId,
          });

          setPaymentMethod(paymentMethodData);
          setStatus(CALLBACK_STATUS.SUCCESS);
          notificationManager.success(BILLING_MESSAGES.SUCCESS.PAYMENT_METHOD_REGISTERED);
        } catch (err) {
          console.error('결제 수단 등록 처리 실패:', err);
          const errorMsg = getErrorMessage(err, BILLING_MESSAGES.ERROR.REGISTRATION_FAILED);
          setError(errorMsg);
          setStatus(CALLBACK_STATUS.FAIL);
          notificationManager.error(errorMsg);
        } finally {
          setLoading(false);
        }
      }
    };

    processCallback();
  }, [statusParam, authKey, customerKey, tenantId, errorCode, errorMessage]);

  const handleGoToDashboard = () => {
    navigate(BILLING_ROUTES.DASHBOARD);
  };

  const handleRetry = () => {
    navigate(BILLING_ROUTES.PAYMENT_METHODS);
  };

  if (loading || status === CALLBACK_STATUS.PROCESSING) {
    return (
      <SimpleLayout>
        <div className={BILLING_CSS.BILLING_CALLBACK.CONTAINER}>
          <div className={BILLING_CSS.BILLING_CALLBACK.LOADING}>
            <Loader2 className={BILLING_CSS.BILLING_CALLBACK.SPINNER} size={ICON_SIZES.XLARGE} />
            <h2>{BILLING_MESSAGES.CALLBACK.PROCESSING}</h2>
            <p>{BILLING_MESSAGES.CALLBACK.PROCESSING_DESCRIPTION}</p>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className={BILLING_CSS.BILLING_CALLBACK.CONTAINER}>
        {status === CALLBACK_STATUS.SUCCESS ? (
          <div className={BILLING_CSS.BILLING_CALLBACK.SUCCESS}>
            <CheckCircle className={BILLING_CSS.BILLING_CALLBACK.ICON} size={ICON_SIZES.XXLARGE} />
            <h2>{BILLING_MESSAGES.CALLBACK.SUCCESS_TITLE}</h2>
            <p>{BILLING_MESSAGES.CALLBACK.SUCCESS_DESCRIPTION}</p>
            {paymentMethod && (
              <div className={BILLING_CSS.BILLING_CALLBACK.INFO}>
                <div className={BILLING_CSS.BILLING_CALLBACK.INFO_ITEM}>
                  <strong>{BILLING_MESSAGES.CALLBACK.PAYMENT_METHOD_ID_LABEL}:</strong>
                  <span>{paymentMethod.paymentMethodId}</span>
                </div>
                {paymentMethod.cardBrand && (
                  <div className={BILLING_CSS.BILLING_CALLBACK.INFO_ITEM}>
                    <strong>{BILLING_MESSAGES.CALLBACK.CARD_BRAND_LABEL}:</strong>
                    <span>{paymentMethod.cardBrand}</span>
                  </div>
                )}
                {paymentMethod.cardLast4 && (
                  <div className={BILLING_CSS.BILLING_CALLBACK.INFO_ITEM}>
                    <strong>{BILLING_MESSAGES.CALLBACK.CARD_LAST4_LABEL}:</strong>
                    <span>{formatCardLast4(paymentMethod.cardLast4)}</span>
                  </div>
                )}
              </div>
            )}
            <div className={BILLING_CSS.BILLING_CALLBACK.ACTIONS}>
              <MGButton variant="primary" onClick={handleGoToDashboard} fullWidth>
                {BILLING_MESSAGES.CALLBACK.GO_TO_DASHBOARD}
              </MGButton>
            </div>
          </div>
        ) : (
          <div className={BILLING_CSS.BILLING_CALLBACK.FAIL}>
            <XCircle className={BILLING_CSS.BILLING_CALLBACK.ICON} size={ICON_SIZES.XXLARGE} />
            <h2>{BILLING_MESSAGES.CALLBACK.FAIL_TITLE}</h2>
            <p>{error || BILLING_MESSAGES.CALLBACK.FAIL_DESCRIPTION}</p>
            {errorCode && (
              <div className={BILLING_CSS.BILLING_CALLBACK.ERROR_DETAILS}>
                <div className={BILLING_CSS.BILLING_CALLBACK.ERROR_ITEM}>
                  <strong>{BILLING_MESSAGES.CALLBACK.ERROR_CODE_LABEL}:</strong>
                  <span>{errorCode}</span>
                </div>
              </div>
            )}
            <div className={BILLING_CSS.BILLING_CALLBACK.ACTIONS}>
              <MGButton variant="secondary" onClick={handleRetry} fullWidth>
                {BILLING_MESSAGES.CALLBACK.RETRY}
              </MGButton>
              <MGButton variant="primary" onClick={handleGoToDashboard} fullWidth>
                {BILLING_MESSAGES.CALLBACK.GO_TO_DASHBOARD}
              </MGButton>
            </div>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default BillingCallback;

