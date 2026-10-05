/**
 * 온보딩 Step1 이메일은 필수이고, 안내 문장은 TRINITY_CONSTANTS 만 쓴다.
 */

import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Step1BasicInfoProgressive from '../../components/onboarding/Step1BasicInfoProgressive';
import { TRINITY_CONSTANTS } from '../../constants/trinity';
import type { OnboardingFormData } from '../../hooks/useOnboarding';

const EMPTY_FORM: OnboardingFormData = {
  tenantName: '',
  businessType: '',
  regionCode: '',
  brandName: '',
  subdomain: '',
  contactEmail: '',
  contactEmailLocal: '',
  contactEmailDomain: '',
  contactEmailCustomDomain: '',
  contactPhone: '',
  adminPassword: '',
  adminPasswordConfirm: '',
  planId: '',
  paymentMethodToken: '',
  paymentMethodId: '',
  subscriptionId: '',
  businessRegistrationNumber: '',
  representativeName: '',
  openingDate: '',
  businessLandline: '',
  businessAddress: '',
  mailOrderReportNumber: '',
  refundPolicyText: '',
  productPriceGuideText: '',
};

function validateEmailFormat(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_REQUIRED };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_INVALID };
  }
  return { valid: true };
}

function Harness() {
  const [formData, setFormData] = useState<OnboardingFormData>(EMPTY_FORM);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const markPhoneVerified = () => setPhoneVerified(true);

  return (
    <Step1BasicInfoProgressive
      formData={formData}
      setFormData={setFormData}
      phoneFormatError={null}
      phoneVerified={phoneVerified}
      phoneVerificationCode=""
      phoneVerificationSending={false}
      phoneVerificationVerifying={false}
      phoneVerificationTimeLeft={null}
      resendCooldown={0}
      phoneOtpSentMessage={null}
      setPhoneVerified={markPhoneVerified}
      setPhoneVerificationCode={() => undefined}
      setPhoneVerificationTimeLeft={() => undefined}
      setVerificationAttempts={() => undefined}
      sendPhoneVerificationCode={() => undefined}
      verifyPhoneCode={() => undefined}
      resetPhoneVerification={() => undefined}
      validateEmailFormat={validateEmailFormat}
      setPhoneFormatError={() => undefined}
      subdomainDuplicateChecked={false}
      subdomainDuplicateChecking={false}
      subdomainDuplicateError={null}
      subdomainPreview={null}
      setSubdomainDuplicateChecked={() => undefined}
      setSubdomainDuplicateError={() => undefined}
      setSubdomainPreview={() => undefined}
      checkSubdomainDuplicate={async () => undefined}
      setError={() => undefined}
      regionCodes={[{ codeValue: 'seoul', koreanName: '서울' }]}
      loadRegionCodes={async () => undefined}
    />
  );
}

async function clickNext() {
  const next = screen.getByRole('button', { name: '다음 →' });
  await waitFor(() => {
    expect(next).toBeEnabled();
  });
  fireEvent.click(next);
}

describe('Step1 email required', () => {
  it('rejects an empty email with the named required message and does not label it optional', async () => {
    render(<Harness />);

    fireEvent.change(screen.getByPlaceholderText('회사명 또는 상호를 입력하세요'), {
      target: { value: '테스트회사' },
    });
    await clickNext();

    await clickNext();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'seoul' } });
    await clickNext();

    await clickNext();

    fireEvent.change(screen.getByPlaceholderText(TRINITY_CONSTANTS.PHONE.PLACEHOLDER), {
      target: { value: '01012345678' },
    });
    await clickNext();

    expect(screen.queryByText('이메일 (선택)')).not.toBeInTheDocument();
    const emailLabel = screen.getByText((_, element) => {
      return element?.classList.contains('trinity-progressive-field__label') === true
        && (element.textContent ?? '').includes('이메일');
    });
    expect(emailLabel).toHaveTextContent('이메일');
    expect(emailLabel).toHaveTextContent('*');

    const emailInput = screen.getByPlaceholderText(TRINITY_CONSTANTS.MESSAGES.PLACEHOLDER_EMAIL);
    expect(screen.getByRole('button', { name: '다음 →' })).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    expect(
      screen.getByText(TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_INVALID, { exact: false })
    ).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: '' } });
    expect(
      screen.getByText(TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_REQUIRED, { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 →' })).toBeDisabled();
  });
});
