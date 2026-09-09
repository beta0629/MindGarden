/**
 * Tenant Home v3 — 호스트 게이트 · 로비 카피 · 플랫폼 CTA 금지
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: null })
}));

jest.mock('../../../utils/dashboardUtils', () => ({
  redirectToDynamicDashboard: jest.fn()
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: { getCurrentTenantRole: jest.fn() }
}));

jest.mock('../../common/CommonPageTemplate', () => ({ children, title }) => (
  <div data-testid="page-template" data-title={title}>{children}</div>
));

const mockFetchMeta = jest.fn();
jest.mock('../../../utils/tenantPublicHomeMeta', () => ({
  fetchTenantPublicHomeMeta: (...args) => mockFetchMeta(...args)
}));

jest.mock('../../../utils/subdomainUtils', () => ({
  getTenantSubdomainFromHost: jest.fn()
}));

import { getTenantSubdomainFromHost } from '../../../utils/subdomainUtils';
import Homepage from '../Homepage';

describe('Homepage host gate — Tenant Home v3', () => {
  beforeEach(() => {
    mockFetchMeta.mockReset();
    getTenantSubdomainFromHost.mockReset();
  });

  it('tenant host shows lobby without platform CTAs', async () => {
    getTenantSubdomainFromHost.mockReturnValue('mindgarden');
    mockFetchMeta.mockResolvedValue({
      found: true,
      host: 'mindgarden.core-solution.co.kr',
      subdomain: 'mindgarden',
      tenant: {
        tenantId: 'tenant-test-001',
        name: '마음정원 상담센터',
        primaryColor: '#0f766e',
        merchantLegal: {
          businessRegistrationNumber: '120-81-47521',
          representativeName: '김대표',
          businessLandline: '02-000-0000',
          businessAddress: '서울시 테스트구',
          mailOrderReportNumber: '',
          refundPolicyText: '',
          productPriceGuideText: ''
        }
      }
    });

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tenant-home-lobby')).toBeInTheDocument();
    });

    expect(screen.getAllByTestId('tenant-home-center-name')[0]).toHaveTextContent('마음정원 상담센터');
    expect(screen.getByTestId('tenant-home-host')).toHaveTextContent('mindgarden.core-solution.co.kr');
    expect(screen.getByText('천천히, 안전하게.')).toBeInTheDocument();
    expect(screen.queryByText('시작하기')).not.toBeInTheDocument();
    expect(screen.queryByText('센터 도입 문의')).not.toBeInTheDocument();
    expect(document.body.textContent).toContain('120-81-47521');
    expect(document.body.textContent).toContain('김대표');
    expect(document.body.textContent).toContain('서울시 테스트구');
    expect(document.body.textContent).toContain('안내에서 확인');
    expect(document.body.textContent).not.toMatch(/푸터\s*링크와 센터 약관/);

    const footer = screen.getByTestId('merchant-legal-footer');
    expect(footer.querySelectorAll('a[href^="/terms"]')).toHaveLength(0);
    expect(footer.querySelectorAll('a[href="/privacy"]')).toHaveLength(0);
    expect(footer.querySelector('a[href="/login"]')).toBeNull();
  });

  it('platform apex keeps marketing landing', () => {
    getTenantSubdomainFromHost.mockReturnValue('');
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('tenant-home-lobby')).not.toBeInTheDocument();
    expect(screen.getAllByText('시작하기').length).toBeGreaterThan(0);
  });
});
