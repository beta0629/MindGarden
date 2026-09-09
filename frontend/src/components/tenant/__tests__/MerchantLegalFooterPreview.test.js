/**
 * MerchantLegalFooterPreview — 등록 약관 본문 모달 ( /terms 예정 링크 금지 )
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MerchantLegalFooterPreview from '../MerchantLegalFooterPreview';

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

describe('MerchantLegalFooterPreview registered legal body', () => {
  test('등록된 환불·상품 문구가 있으면 안내 컨트롤이 있고 /terms·/privacy 링크가 없다', () => {
    renderFooter({
      refundPolicyText: '환불은 7일 이내 가능합니다.',
      productPriceGuideText: '기본 상담 5만원'
    });

    const footer = screen.getByTestId('merchant-legal-footer');
    const refundBtn = screen.getByTestId('counseling-guide-refund');
    const priceBtn = screen.getByTestId('counseling-guide-pricing');

    expect(refundBtn).toHaveTextContent('환불·취소·청약');
    expect(refundBtn.textContent.replace(/\u2060/g, '')).toBe('환불·취소·청약철회');
    expect(priceBtn).toHaveTextContent('상품·가격 안내');
    expect(refundBtn).not.toHaveAttribute('href');
    expect(priceBtn).not.toHaveAttribute('href');
    expect(footer.querySelectorAll('a[href^="/terms"]')).toHaveLength(0);
    expect(footer.querySelectorAll('a[href="/privacy"]')).toHaveLength(0);
  });

  test('안내 클릭 시 UnifiedModal에 등록 본문이 표시된다', () => {
    renderFooter({
      refundPolicyText: '청약철회는 14일 이내.\n부분 환불 가능.',
      productPriceGuideText: '패키지 A · 10회'
    });

    fireEvent.click(screen.getByTestId('counseling-guide-refund'));
    expect(screen.getByTestId('merchant-legal-guide-modal')).toBeInTheDocument();
    expect(screen.getByTestId('merchant-legal-guide-modal-body')).toHaveTextContent(
      '청약철회는 14일 이내.'
    );
    expect(screen.getByTestId('merchant-legal-guide-modal-body')).toHaveTextContent(
      '부분 환불 가능.'
    );

    fireEvent.click(screen.getByTestId('modal-close'));
    fireEvent.click(screen.getByTestId('counseling-guide-pricing'));
    expect(screen.getByTestId('merchant-legal-guide-modal-body')).toHaveTextContent(
      '패키지 A · 10회'
    );
  });

  test('문구가 비어 있으면 안내 컨트롤과 /terms·/privacy 링크가 없다', () => {
    renderFooter({
      refundPolicyText: '',
      productPriceGuideText: '   '
    });

    const footer = screen.getByTestId('merchant-legal-footer');
    expect(screen.queryByTestId('counseling-guide-refund')).toBeNull();
    expect(screen.queryByTestId('counseling-guide-pricing')).toBeNull();
    expect(screen.queryByText('등록 필요')).toBeNull();
    expect(footer.querySelectorAll('a[href^="/terms"]')).toHaveLength(0);
    expect(footer.querySelectorAll('a[href="/privacy"]')).toHaveLength(0);
  });

  test('showAccountLinks=true 여도 계정에 로그인만 있고 /privacy 링크는 없다', () => {
    renderFooter(
      {
        refundPolicyText: '환불 본문',
        productPriceGuideText: '가격 본문'
      },
      { showAccountLinks: true }
    );

    const footer = screen.getByTestId('merchant-legal-footer');
    expect(footer.querySelector('a[href="/login"]')).not.toBeNull();
    expect(footer.querySelectorAll('a[href="/privacy"]')).toHaveLength(0);
    expect(footer.querySelectorAll('a[href^="/terms"]')).toHaveLength(0);
    expect(screen.queryByText('개인정보처리방침')).toBeNull();
  });

  test('showAccountLinks=false 이면 계정 열·로그인 링크가 없다', () => {
    renderFooter({}, { showAccountLinks: false });

    const footer = screen.getByTestId('merchant-legal-footer');
    expect(footer.querySelector('a[href="/login"]')).toBeNull();
    expect(footer.querySelectorAll('a[href^="/terms"]')).toHaveLength(0);
    expect(footer.querySelectorAll('a[href="/privacy"]')).toHaveLength(0);
  });

  test('nowrap 라벨 클래스·워드조이너로 청약|철회 중간 줄바꿈 방지', () => {
    renderFooter({
      refundPolicyText: '환불 안내 본문'
    });

    const btn = screen.getByTestId('counseling-guide-refund');
    const label = btn.querySelector('.mg-merchant-legal-footer__link-label');
    expect(label).not.toBeNull();
    expect(label.textContent.replace(/\u2060/g, '')).toBe('환불·취소·청약철회');
    expect(label.textContent).toContain('\u2060');
    expect(btn.className).toMatch(/mg-merchant-legal-footer__link/);

    const fs = require('fs');
    const path = require('path');
    const css = fs.readFileSync(
      path.join(__dirname, '..', 'MerchantLegalFooterPreview.css'),
      'utf8'
    );
    expect(css).toMatch(
      /\.mg-merchant-legal-footer__link[\s\S]*?white-space:\s*nowrap/
    );
    expect(css).toMatch(
      /\.mg-merchant-legal-footer__link-label[\s\S]*?white-space:\s*nowrap/
    );
  });

  test('모달 본문에서 [분] 자리표시자를 노출하지 않는다', () => {
    renderFooter({
      productPriceGuideText: '- 1회기 시간: [분] 분'
    });

    fireEvent.click(screen.getByTestId('counseling-guide-pricing'));
    const body = screen.getByTestId('merchant-legal-guide-modal-body');
    expect(body).toHaveTextContent('회기당 시간(분 단위)');
    expect(body.textContent).not.toMatch(/\[분\]/);
  });
});
