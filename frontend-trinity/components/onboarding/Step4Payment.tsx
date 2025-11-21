/**
 * Step 4: 결제 수단 등록 컴포넌트
 */

import { useState } from "react";
import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import PaymentMethodModal from "../PaymentMethodModal";
import type { OnboardingFormData } from "../../hooks/useOnboarding";

interface Step4PaymentProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData | ((prev: OnboardingFormData) => OnboardingFormData)) => void;
  paymentOption: "register" | "pay" | "skip";
  setPaymentOption: (option: "register" | "pay" | "skip") => void;
  paymentMethodVerified: boolean;
  paymentMethodVerifying: boolean;
  skipPaymentMethod: boolean;
  setSkipPaymentMethod: (skip: boolean) => void;
  customerKey: string;
  createPaymentMethod: (data: {
    paymentMethodToken: string;
    pgProvider: "TOSS" | "STRIPE" | "OTHER";
  }) => Promise<{ paymentMethodId: string }>;
  setError: (error: string | null) => void;
}

export default function Step4Payment({
  formData,
  setFormData,
  paymentOption,
  setPaymentOption,
  paymentMethodVerified,
  paymentMethodVerifying,
  skipPaymentMethod,
  setSkipPaymentMethod,
  customerKey,
  createPaymentMethod,
  setError,
}: Step4PaymentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePaymentSuccess = async (authKey: string, customerKey: string) => {
    try {
      setError(null);
      const result = await createPaymentMethod({
        paymentMethodToken: authKey,
        pgProvider: TRINITY_CONSTANTS.PAYMENT.DEFAULT_PG_PROVIDER as "TOSS" | "STRIPE" | "OTHER",
      });
      
      setFormData({
        ...formData,
        paymentMethodToken: authKey,
        paymentMethodId: result.paymentMethodId,
      });
      
      setIsModalOpen(false);
    } catch (err) {
      console.error("결제 수단 등록 실패:", err);
      setError(err instanceof Error ? err.message : TRINITY_CONSTANTS.MESSAGES.ERROR_PAYMENT);
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setIsModalOpen(false);
  };

  return (
    <div className={COMPONENT_CSS.ONBOARDING.STEP}>
      <h3 className="trinity-onboarding__step-title">결제 수단 등록</h3>
      <p className="trinity-onboarding__step-description">
        결제 수단을 등록하거나 나중에 등록할 수 있습니다.
      </p>

      <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
        <p className={`${COMPONENT_CSS.ONBOARDING.SMALL_TEXT} trinity-onboarding__payment-option-title`}>
          결제 옵션을 선택해주세요:
        </p>
        <div className={COMPONENT_CSS.ONBOARDING.FLEX_COL}>
          <label className={`${COMPONENT_CSS.ONBOARDING.PAYMENT_OPTION_LABEL} ${
            paymentOption === 'register' ? COMPONENT_CSS.ONBOARDING.PAYMENT_OPTION_ACTIVE : ''
          }`}>
            <input
              type="radio"
              name="paymentOption"
              value="register"
              checked={paymentOption === 'register'}
              onChange={() => setPaymentOption('register')}
              className="trinity-onboarding__radio-input"
            />
            <div className="trinity-onboarding__payment-option-content">
              <strong>자동 결제 등록</strong>
              <small className={`${COMPONENT_CSS.ONBOARDING.SMALL_TEXT} trinity-onboarding__payment-option-description`}>
                매월 자동으로 결제됩니다. 카드 정보를 안전하게 저장합니다.
              </small>
            </div>
          </label>

          <label className={`${COMPONENT_CSS.ONBOARDING.PAYMENT_OPTION_LABEL} ${
            paymentOption === 'pay' ? COMPONENT_CSS.ONBOARDING.PAYMENT_OPTION_ACTIVE : ''
          }`}>
            <input
              type="radio"
              name="paymentOption"
              value="pay"
              checked={paymentOption === 'pay'}
              onChange={() => setPaymentOption('pay')}
              className="trinity-onboarding__radio-input"
            />
            <div className="trinity-onboarding__payment-option-content">
              <strong>즉시 결제</strong>
              <small className={`${COMPONENT_CSS.ONBOARDING.SMALL_TEXT} trinity-onboarding__payment-option-description`}>
                지금 바로 결제합니다. 카드 정보는 저장되지 않습니다.
              </small>
            </div>
          </label>

          <label className={`${COMPONENT_CSS.ONBOARDING.PAYMENT_OPTION_LABEL} ${
            paymentOption === 'skip' ? COMPONENT_CSS.ONBOARDING.PAYMENT_OPTION_ACTIVE : ''
          }`}>
            <input
              type="radio"
              name="paymentOption"
              value="skip"
              checked={paymentOption === 'skip'}
              onChange={() => {
                setPaymentOption('skip');
                setSkipPaymentMethod(true);
              }}
              className="trinity-onboarding__radio-input"
            />
            <div className="trinity-onboarding__payment-option-content">
              <strong>나중에 등록</strong>
              <small className={`${COMPONENT_CSS.ONBOARDING.SMALL_TEXT} trinity-onboarding__payment-option-description`}>
                온보딩 승인 후 결제 수단을 등록하거나 결제할 수 있습니다.
              </small>
            </div>
          </label>
        </div>
      </div>

      {(paymentOption === 'register' || paymentOption === 'pay') && (
        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          {paymentMethodVerified ? (
            <div className={COMPONENT_CSS.ONBOARDING.SUCCESS}>
              <p className={COMPONENT_CSS.ONBOARDING.SUCCESS_TEXT}>
                {TRINITY_CONSTANTS.MESSAGES.PAYMENT_METHOD_REGISTERED}
              </p>
              <p className={COMPONENT_CSS.ONBOARDING.SMALL_TEXT}>
                {TRINITY_CONSTANTS.MESSAGES.AUTO_BILLING_SUCCESS_INFO}
              </p>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={COMPONENT_CSS.ONBOARDING.BUTTON}
                disabled={paymentMethodVerifying}
              >
                {paymentOption === 'register' ? '카드 등록하기' : '즉시 결제하기'}
              </button>
              {paymentMethodVerifying && (
                <p className={COMPONENT_CSS.ONBOARDING.SMALL_TEXT}>
                  {TRINITY_CONSTANTS.MESSAGES.PAYMENT_METHOD_VERIFICATION_PENDING}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {paymentOption === 'skip' && (
        <div className={COMPONENT_CSS.ONBOARDING.PAYMENT_INFO_BOX}>
          <p className={COMPONENT_CSS.ONBOARDING.SMALL_TEXT}>
            {TRINITY_CONSTANTS.MESSAGES.PAYMENT_METHOD_SKIP_INFO}
          </p>
        </div>
      )}

      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        customerKey={customerKey}
        customerName={formData.tenantName}
        customerEmail={formData.contactEmail}
        useIframe={true}
      />
    </div>
  );
}

