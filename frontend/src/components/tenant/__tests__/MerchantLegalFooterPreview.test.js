/**
 * MerchantLegalFooterPreview — 공개 /legal/* 링크 SSOT (안내 컬럼 3 Links만)
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MerchantLegalFooterPreview from '../MerchantLegalFooterPreview';
import {
  LEGAL_PUBLIC_LABELS,
  LEGAL_PUBLIC_PATHS
} from '../../../constants/legalPublic';

const baseLegal = {
  businessRegistrationNumber: '120-81-47521',
  representativeName: '김대표',
  businessLandline: '02-111-2222',
  businessAddress: '서울시 테스트구',
  mailOrderReportNumber: '제2024-서울-0001호'
};

const renderFooter = (legal = {}, props = {}) =>
  render(
    <MemoryRouter>
      <MerchantLegalFooterPreview
        centerName="테스트상담센터"
        legal={{ ...baseLegal, ...legal }}
        {...props}
      />
    </MemoryRouter>
  );

describe('MerchantLegalFooterPreview public legal links', () => {
  test('안내 컬럼에 /legal/terms·privacy·products 링크가 정확히 3개이고 플랫폼 /terms 가짜 hop이 없다', () => {
    renderFooter({
      refundPolicyText: '환불은 7일 이내 가능합니다.',
      productPriceGuideText: '기본 상담 5만원'
    });

    const terms = screen.getByTestId('legal-public-link-terms');
    const privacy = screen.getByTestId('legal-public-link-privacy');
    const products = screen.getByTestId('legal-public-link-products');

    expect(terms).toHaveAttribute('href', LEGAL_PUBLIC_PATHS.TERMS);
    expect(privacy).toHaveAttribute('href', LEGAL_PUBLIC_PATHS.PRIVACY);
    expect(products).toHaveAttribute('href', LEGAL_PUBLIC_PATHS.PRODUCTS);
    expect(terms).toHaveTextContent(LEGAL_PUBLIC_LABELS.TERMS);
    expect(privacy).toHaveTextContent(LEGAL_PUBLIC_LABELS.PRIVACY);
    expect(products).toHaveTextContent(LEGAL_PUBLIC_LABELS.PRODUCTS);

    const guideCol = terms.closest('.mg-merchant-legal-footer__col');
    expect(guideCol).not.toBeNull();
    const guidePublicLinks = guideCol.querySelectorAll(
      '[data-testid^="legal-public-link-"]'
    );
    expect(guidePublicLinks).toHaveLength(3);

    expect(document.querySelector('a[href="/terms"]')).toBeNull();
    expect(document.querySelector('a[href="/terms#refund"]')).toBeNull();
    expect(document.querySelector('a[href="/terms#pricing"]')).toBeNull();
    expect(document.querySelector('a[href="/privacy"]')).toBeNull();
    expect(document.querySelector('a[href="/legal/refund"]')).toBeNull();
  });

  test('계정 컬럼 개인정보 링크는 /legal/privacy 이다', () => {
    renderFooter({}, { showAccountLinks: true });
    expect(screen.getByTestId('legal-account-privacy-link')).toHaveAttribute(
      'href',
      LEGAL_PUBLIC_PATHS.PRIVACY
    );
  });

  test('refundPolicyText가 있어도 counseling-guide-refund 및 /legal/refund가 없다', () => {
    renderFooter({
      refundPolicyText: '청약철회는 14일 이내.\n부분 환불 가능.'
    });

    expect(screen.queryByTestId('counseling-guide-refund')).toBeNull();
    expect(document.getElementById('counseling-guide-refund')).toBeNull();
    expect(document.querySelector('a[href="/legal/refund"]')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('legal-public-link-terms')).toBeInTheDocument();
    expect(screen.getByTestId('legal-public-link-privacy')).toBeInTheDocument();
    expect(screen.getByTestId('legal-public-link-products')).toBeInTheDocument();
  });

  test('환불·상품 문구가 비어 있어도 /legal 3 링크는 유지한다', () => {
    renderFooter({
      refundPolicyText: '',
      productPriceGuideText: '   '
    });

    expect(screen.queryByTestId('counseling-guide-refund')).toBeNull();
    expect(screen.queryByTestId('counseling-guide-pricing')).toBeNull();
    expect(screen.getByTestId('legal-public-link-terms')).toBeInTheDocument();
    expect(screen.getByTestId('legal-public-link-privacy')).toBeInTheDocument();
    expect(screen.getByTestId('legal-public-link-products')).toBeInTheDocument();
  });
});
