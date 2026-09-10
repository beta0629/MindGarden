/**
 * MerchantLegalFooterPreview — 공개 /legal/* 링크 SSOT
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MerchantLegalFooterPreview from '../MerchantLegalFooterPreview';
import { LEGAL_PUBLIC_PATHS } from '../../../constants/legalPublic';

jest.mock('../../common/modals/UnifiedModal', () => {
  return function MockUnifiedModal({ isOpen, title, children, onClose }) {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label={title} data-testid="merchant-legal-guide-modal">
        <h2>{title}</h2>
        <div>{children}</div>
        <button type="button" onClick={onClose} data-testid="modal-close">
          close
        </button>
      </div>
    );
  };
});

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
  test('안내 컬럼에 /legal/terms·privacy·products 링크가 있고 플랫폼 /terms 가짜 hop이 없다', () => {
    renderFooter({
      refundPolicyText: '환불은 7일 이내 가능합니다.',
      productPriceGuideText: '기본 상담 5만원'
    });

    expect(screen.getByTestId('legal-public-link-terms')).toHaveAttribute(
      'href',
      LEGAL_PUBLIC_PATHS.TERMS
    );
    expect(screen.getByTestId('legal-public-link-privacy')).toHaveAttribute(
      'href',
      LEGAL_PUBLIC_PATHS.PRIVACY
    );
    expect(screen.getByTestId('legal-public-link-products')).toHaveAttribute(
      'href',
      LEGAL_PUBLIC_PATHS.PRODUCTS
    );
    expect(document.querySelector('a[href="/terms"]')).toBeNull();
    expect(document.querySelector('a[href="/terms#refund"]')).toBeNull();
    expect(document.querySelector('a[href="/terms#pricing"]')).toBeNull();
    expect(document.querySelector('a[href="/privacy"]')).toBeNull();
  });

  test('계정 컬럼 개인정보 링크는 /legal/privacy 이다', () => {
    renderFooter({}, { showAccountLinks: true });
    expect(screen.getByTestId('legal-account-privacy-link')).toHaveAttribute(
      'href',
      LEGAL_PUBLIC_PATHS.PRIVACY
    );
  });

  test('환불 등록 문구가 있으면 보조 모달 컨트롤이 열린다', () => {
    renderFooter({
      refundPolicyText: '청약철회는 14일 이내.\n부분 환불 가능.'
    });

    fireEvent.click(screen.getByTestId('counseling-guide-refund'));
    expect(screen.getByTestId('merchant-legal-guide-modal')).toBeInTheDocument();
    expect(screen.getByTestId('merchant-legal-guide-modal-body')).toHaveTextContent(
      '청약철회는 14일 이내.'
    );
  });

  test('환불 문구가 비어 있으면 환불 모달 컨트롤만 숨기고 /legal 링크는 유지한다', () => {
    renderFooter({
      refundPolicyText: '',
      productPriceGuideText: '   '
    });

    expect(screen.queryByTestId('counseling-guide-refund')).toBeNull();
    expect(screen.queryByTestId('counseling-guide-pricing')).toBeNull();
    expect(screen.getByTestId('legal-public-link-terms')).toBeInTheDocument();
    expect(screen.getByTestId('legal-public-link-products')).toBeInTheDocument();
  });

  test('환불 라벨은 청약|철회 사이에 U+2060 WORD JOINER를 둔다', () => {
    renderFooter({
      refundPolicyText: '환불 안내 본문'
    });

    const label = screen
      .getByTestId('counseling-guide-refund')
      .querySelector('.mg-merchant-legal-footer__link-label');
    expect(label).not.toBeNull();
    expect(label.textContent).toBe('환불·취소·청약\u2060철회');
    expect(label.textContent.replace(/\u2060/g, '')).toBe('환불·취소·청약철회');
  });
});
