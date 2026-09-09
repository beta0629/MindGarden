/**
 * StepMerchantLegal — 카피·미리보기·검증 잠금
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StepMerchantLegal from '../../components/onboarding/StepMerchantLegal';
import { TRINITY_CONSTANTS } from '../../constants/trinity';

describe('StepMerchantLegal', () => {
  const baseForm = {
    tenantName: '마음정원 상담센터',
    brandName: '',
    businessType: '',
    regionCode: '',
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
    businessLandline: '',
    businessAddress: '',
    mailOrderReportNumber: '',
    refundPolicyText: '',
    productPriceGuideText: '',
  };

  it('shows later-settings copy and mini footer preview with center name', () => {
    render(
      <StepMerchantLegal
        formData={baseForm as any}
        setFormData={jest.fn()}
        bizNumberError={null}
        setBizNumberError={jest.fn()}
      />
    );
    expect(
      screen.getByText(TRINITY_CONSTANTS.MERCHANT_LEGAL.STEP_DESCRIPTION)
    ).toBeInTheDocument();
    expect(screen.getByText('마음정원 상담센터')).toBeInTheDocument();
    expect(screen.getByText(TRINITY_CONSTANTS.MERCHANT_LEGAL.MAIL_ORDER_NOTE)).toBeInTheDocument();
  });

  it('surfaces biz number error from props', () => {
    render(
      <StepMerchantLegal
        formData={baseForm as any}
        setFormData={jest.fn()}
        bizNumberError="사업자등록번호 형식이 올바르지 않습니다."
        setBizNumberError={jest.fn()}
      />
    );
    expect(screen.getByText(/사업자등록번호 형식이 올바르지 않습니다/i)).toBeInTheDocument();
  });
});
