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
      
      <div className={COMPONENT_CSS.ONBOARDING.PAYMENT_INFO_BOX} style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <p style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#856404',
          marginBottom: '10px'
        }}>
          ⚠️ PG사 결제 프로세스는 추후 진행 예정입니다
        </p>
        <p className={COMPONENT_CSS.ONBOARDING.SMALL_TEXT} style={{ color: '#856404', lineHeight: '1.6' }}>
          현재는 결제 수단 등록 없이 바로 온보딩 등록이 가능합니다.
          <br />
          온보딩 승인 후 서비스 이용 시점에 결제 수단을 등록하실 수 있습니다.
        </p>
      </div>

      <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
        <p className={COMPONENT_CSS.ONBOARDING.SMALL_TEXT} style={{ color: '#666' }}>
          온보딩 등록을 계속 진행하시겠습니까?
        </p>
      </div>
    </div>
  );
}

