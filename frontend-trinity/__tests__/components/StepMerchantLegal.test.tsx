/**
 * StepMerchantLegal — 카피·미리보기·검증 잠금
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StepMerchantLegal from '../../components/onboarding/StepMerchantLegal';
import { KR_PUBLIC_DATA_COPY } from '../../content/krPublicData';
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
    businessRegistrationNumber: '120-81-47521',
    representativeName: '홍길동',
    openingDate: '2020-01-15',
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

  it('shows verification result and suspended warning', async () => {
    const onLookupBusiness = jest.fn().mockResolvedValue({
      overallStatus: KR_PUBLIC_DATA_COPY.OVERALL_MATCH,
      businessStatus: KR_PUBLIC_DATA_COPY.BUSINESS_SUSPENDED,
      checkedAt: '2026-10-14T00:00:00Z',
      suspendedWarning: true,
    });

    render(
      <StepMerchantLegal
        formData={baseForm as any}
        setFormData={jest.fn()}
        bizNumberError={null}
        setBizNumberError={jest.fn()}
        businessLookupEnabled
        onLookupBusiness={onLookupBusiness}
      />
    );

    fireEvent.click(screen.getByTestId('onboarding-merchant-legal-verify'));

    await waitFor(() => {
      const panel = screen.getByTestId('onboarding-merchant-legal-verification');
      expect(panel).toHaveTextContent(KR_PUBLIC_DATA_COPY.OVERALL_MATCH);
      expect(panel).toHaveTextContent(KR_PUBLIC_DATA_COPY.BUSINESS_SUSPENDED);
      expect(panel).toHaveTextContent(KR_PUBLIC_DATA_COPY.WARNING_SUSPENDED);
    });
    expect(onLookupBusiness).toHaveBeenCalled();
  });
});
