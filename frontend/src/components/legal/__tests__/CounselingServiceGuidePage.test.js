/**
 * 공개 /services 화면
 *
 * @author CoreSolution
 * @since 2026-10-01
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CounselingServiceGuidePage from '../CounselingServiceGuidePage';
import {
  CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE,
  LEGAL_PUBLIC_PATHS,
  LEGAL_TERMS_REFUND_HREF
} from '../../../constants/legalPublic';
import { PUBLIC_GUIDE_COPY } from '../../../constants/publicCounselingGuideCopy';

jest.mock('../../common/CommonPageTemplate', () => ({ children }) => (
  <div data-testid="common-page-template">{children}</div>
));

jest.mock('../../../utils/tenantPublicHomeMeta', () => ({
  fetchTenantPublicHomeMeta: jest.fn()
}));

const { fetchTenantPublicHomeMeta } = require('../../../utils/tenantPublicHomeMeta');

const fullMeta = {
  found: true,
  tenant: {
    name: '마음센터',
    serviceGuide: {
      centerName: '마음센터',
      representativeName: '김대표',
      businessAddress: '서울시',
      businessLandline: '02-000-0000',
      oneLiner: '한 줄 정의',
      centerIntro: '센터 소개 문단',
      refundBody: '환불 요약입니다. 둘째 문장입니다.',
      types: [
        {
          name: '개인상담',
          description: '개인을 만나요',
          audience: '성인',
          modality: '대면 · 비대면',
          minutes: 50
        }
      ],
      counselors: [
        { name: '김상담', lines: ['임상심리사 · 발급기관'] }
      ],
      products: [
        {
          name: '10회 패키지',
          description: '기본',
          sessions: 10,
          minutes: 50,
          validityMonths: 3,
          price: 100000
        },
        { name: '단회기', sessions: 1, price: 90000 },
        { name: '다섯회기', sessions: 5, price: 40000 },
        { name: '테스트 상품', sessions: 1, price: 1000 },
        { name: '1000원_테스트', sessions: 1, price: 1000 },
        { name: '테스트SKU', skuCode: 'SHOP-20260929-001', sessions: 1, price: 1000 }
      ]
    },
    consultationPackages: Array.from({ length: 21 }, (_, index) => ({
      name: `패키지${index + 1}`,
      price: 1000
    }))
  }
};

const renderPage = () => render(
  <MemoryRouter>
    <CounselingServiceGuidePage />
  </MemoryRouter>
);

describe('CounselingServiceGuidePage', () => {
  beforeEach(() => {
    fetchTenantPublicHomeMeta.mockReset();
  });

  test('여섯 섹션과 할부 문장·환불·개인정보 링크가 있고 테스트 상품과 일시불만은 없다', async () => {
    fetchTenantPublicHomeMeta.mockResolvedValue(fullMeta);
    renderPage();

    expect(await screen.findByRole('heading', { level: 2, name: '센터 소개' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '상담 종류' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '진행 절차' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '상담사 소개' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '상품·가격' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '환불·개인정보' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByText('10회 패키지').length).toBeGreaterThan(0);
    expect(screen.queryByText('테스트 상품')).not.toBeInTheDocument();
    expect(screen.queryByText('1000원_테스트')).not.toBeInTheDocument();
    expect(screen.queryByText('테스트SKU')).not.toBeInTheDocument();
    expect(screen.queryByText('패키지1')).not.toBeInTheDocument();
    expect(screen.queryByText('임상심리사 · 발급기관')).not.toBeInTheDocument();
    expect(screen.getByText(PUBLIC_GUIDE_COPY.CENTER_NAME)).toBeInTheDocument();
    expect(screen.getByText(PUBLIC_GUIDE_COPY.CENTER_ADDRESS)).toBeInTheDocument();
    expect(screen.getByText(PUBLIC_GUIDE_COPY.CENTER_PHONE)).toBeInTheDocument();
    expect(screen.getByText(/아동·청소년·성인 1:1 개인상담/)).toBeInTheDocument();
    expect(screen.getByText(PUBLIC_GUIDE_COPY.COUNSELOR_INTRO)).toBeInTheDocument();
    expect(screen.getAllByText('상품명').length).toBeGreaterThan(0);
    expect(screen.getAllByText('회기').length).toBeGreaterThan(0);
    expect(screen.getAllByText('가격').length).toBeGreaterThan(0);
    expect(screen.getAllByText('이용기간').length).toBeGreaterThan(0);
    expect(screen.getAllByText('결제일부터 2개월').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5회기').length).toBeGreaterThan(0);
    expect(document.querySelector('.svc-product-card').textContent).not.toContain('—');
    expect(document.body.textContent).not.toContain('TODO');
    expect(screen.getByText(CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE)).toBeInTheDocument();
    expect(screen.queryByText(/일시불만/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '환불 규정 전문' })).toHaveAttribute('href', LEGAL_TERMS_REFUND_HREF);
    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute(
      'href',
      LEGAL_PUBLIC_PATHS.PRIVACY
    );
    expect(document.title).toBe('상담 서비스 안내 · 마음센터');
  });

  test('설정이 없어도 고정 안내를 보여주고 로그인으로 보내지 않는다', async () => {
    fetchTenantPublicHomeMeta.mockResolvedValue({ found: false, tenant: null });
    renderPage();

    expect(await screen.findByRole('heading', { level: 2, name: '진행 절차' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '상담 종류' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '상담사 소개' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '센터 소개' })).toBeInTheDocument();
    expect(screen.getByText(PUBLIC_GUIDE_COPY.PROCESS_LINE)).toBeInTheDocument();
    expect(screen.getByText(/구매할 수 있는 상품이 없어요/)).toBeInTheDocument();
    expect(screen.queryByText('TODO')).not.toBeInTheDocument();
    expect(window.location.pathname).not.toBe('/login');
  });

  test('390px 이하에서는 상품 카드를 쓰고 표는 숨긴다', () => {
    const css = fs.readFileSync(
      path.resolve(__dirname, '../CounselingServiceGuidePage.css'),
      'utf8'
    );
    expect(css).toMatch(/max-width:\s*24\.375rem/);
    expect(css).toMatch(/\.svc-product-table\s*\{\s*display:\s*none/);
    expect(css).toMatch(/\.svc-product-cards\s*\{\s*display:\s*block/);
  });
});
