/**
 * /legal/products 상단의 상담 서비스 안내 링크
 *
 * @author CoreSolution
 * @since 2026-10-01
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConsultationPackagePublicPage from '../ConsultationPackagePublicPage';
import { COUNSELING_SERVICE_GUIDE } from '../../../constants/legalPublic';

jest.mock('../../common/CommonPageTemplate', () => ({ children }) => (
  <div data-testid="common-page-template">{children}</div>
));

jest.mock('../../../utils/tenantPublicHomeMeta', () => ({
  fetchTenantPublicHomeMeta: jest.fn()
}));

const { fetchTenantPublicHomeMeta } = require('../../../utils/tenantPublicHomeMeta');

describe('ConsultationPackagePublicPage guide link', () => {
  test('상담 서비스 자세히 보기가 /services 로 연결된다', async () => {
    fetchTenantPublicHomeMeta.mockResolvedValue({
      found: true,
      tenant: { name: '마음센터', consultationPackages: [] }
    });

    render(
      <MemoryRouter>
        <ConsultationPackagePublicPage />
      </MemoryRouter>
    );

    const link = await screen.findByTestId('counseling-service-detail-link');
    expect(link).toHaveAttribute('href', COUNSELING_SERVICE_GUIDE.PATH);
    expect(link).toHaveTextContent(COUNSELING_SERVICE_GUIDE.DETAIL_LINK);
  });
});
