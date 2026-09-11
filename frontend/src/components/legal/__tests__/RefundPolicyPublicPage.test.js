/**
 * RefundPolicyPublicPage — 테넌트 문구 우선 / 플랫폼 ## refund 폴백
 *
 * @author CoreSolution
 * @since 2026-09-11
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RefundPolicyPublicPage from '../RefundPolicyPublicPage';
import { LEGAL_PUBLIC_LABELS } from '../../../constants/legalPublic';

jest.mock('../../common/CommonPageTemplate', () => ({ children }) => (
  <div data-testid="common-page-template">{children}</div>
));

jest.mock('../../../utils/tenantPublicHomeMeta', () => ({
  fetchTenantPublicHomeMeta: jest.fn()
}));

jest.mock('../../../utils/platformLegalCopy', () => ({
  fetchPlatformLegalCopyMarkdown: jest.fn(),
  extractPlatformLegalSection: jest.fn(),
  renderQuietLegalHtmlFromMarkdown: jest.fn()
}));

const {
  fetchTenantPublicHomeMeta
} = require('../../../utils/tenantPublicHomeMeta');
const {
  fetchPlatformLegalCopyMarkdown,
  extractPlatformLegalSection,
  renderQuietLegalHtmlFromMarkdown
} = require('../../../utils/platformLegalCopy');

const PLATFORM_MD = '## refund\n\n### body\n';
const PLATFORM_SECTION = '## 1. 청약철회 기간\n\n7일 이내';
const PLATFORM_HTML = '<h2>1. 청약철회 기간</h2><p>7일 이내</p>';

describe('RefundPolicyPublicPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchPlatformLegalCopyMarkdown.mockResolvedValue(PLATFORM_MD);
    extractPlatformLegalSection.mockReturnValue(PLATFORM_SECTION);
    renderQuietLegalHtmlFromMarkdown.mockReturnValue(PLATFORM_HTML);
  });

  test('테넌트 refundPolicyText가 있으면 센터 본문을 표시한다', async () => {
    fetchTenantPublicHomeMeta.mockResolvedValue({
      found: true,
      tenant: {
        name: '테스트센터',
        merchantLegal: { refundPolicyText: '센터 전용 환불 규정입니다.' }
      }
    });

    render(
      <MemoryRouter>
        <RefundPolicyPublicPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('refund-policy-tenant-body')).toHaveTextContent(
        '센터 전용 환불 규정입니다.'
      );
    });
    expect(screen.queryByTestId('refund-policy-platform-body')).toBeNull();
    expect(screen.getByTestId('refund-policy-public-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      LEGAL_PUBLIC_LABELS.REFUND
    );
  });

  test('테넌트 문구가 없으면 플랫폼 SSOT HTML을 표시한다', async () => {
    fetchTenantPublicHomeMeta.mockResolvedValue({
      found: false,
      tenant: null
    });

    render(
      <MemoryRouter>
        <RefundPolicyPublicPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('refund-policy-platform-body')).toBeInTheDocument();
    });
    expect(screen.getByTestId('refund-policy-platform-body').innerHTML).toContain(
      '청약철회 기간'
    );
    expect(screen.queryByTestId('refund-policy-tenant-body')).toBeNull();
  });
});
