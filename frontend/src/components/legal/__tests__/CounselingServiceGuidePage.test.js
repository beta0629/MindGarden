/**
 * 공개 /services 화면
 *
 * @author CoreSolution
 * @since 2026-10-01
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CounselingServiceGuidePage from '../CounselingServiceGuidePage';
import {
  CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE,
  LEGAL_PUBLIC_PATHS,
  LEGAL_TERMS_REFUND_HREF
} from '../../../constants/legalPublic';

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
        { name: '테스트 상품', sessions: 1, price: 1000 }
      ]
    }
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
    expect(screen.getByRole('heading', { level: 2, name: '상담사 자격' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '상품·가격' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '환불·개인정보' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('10회 패키지')).toBeInTheDocument();
    expect(screen.queryByText('테스트 상품')).not.toBeInTheDocument();
    expect(screen.getByText(CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE)).toBeInTheDocument();
    expect(screen.queryByText(/일시불만/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '환불 규정 전문' })).toHaveAttribute('href', LEGAL_TERMS_REFUND_HREF);
    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute(
      'href',
      LEGAL_PUBLIC_PATHS.PRIVACY
    );
    expect(document.title).toBe('상담 서비스 안내 · 마음센터');
  });

  test('종류·자격이 없으면 그 섹션을 렌더하지 않는다', async () => {
    fetchTenantPublicHomeMeta.mockResolvedValue({ found: false, tenant: null });
    renderPage();

    expect(await screen.findByRole('heading', { level: 2, name: '진행 절차' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: '상담 종류' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: '상담사 자격' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: '센터 소개' })).not.toBeInTheDocument();
    expect(screen.getByText(/정해진 시간 동안/)).toBeInTheDocument();
    expect(screen.getByText(/구매할 수 있는 상품이 없어요/)).toBeInTheDocument();
  });
});
