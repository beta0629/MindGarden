/**
 * PackagePricingDetailPage — /admin/package-pricing/new 신규 모드 회귀 가드.
 * isNew 로 열리면 id 없이도 「패키지를 찾을 수 없습니다」 알림·목록 이동 없이 신규 폼을 보여준다.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LABELS } from '../../../../../constants/packagePricingConstants';

const mockNavigate = jest.fn();

jest.mock('../../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() }
}));

jest.mock('../../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() }
}));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
  useParams: () => ({})
}));

jest.mock('../../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, loading }) => (
    <div data-testid="admin-common-layout">{loading ? <div data-testid="page-loading" /> : children}</div>
  )
}));

jest.mock('../../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

jest.mock('../../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title }) => <header>{title ? <h1>{title}</h1> : null}</header>
}));

jest.mock('../../../../../../styles/unified-design-tokens.css', () => ({}), { virtual: true });
jest.mock('../../../AdminDashboard/AdminDashboardB0KlA.css', () => ({}), { virtual: true });
jest.mock('../../PackagePricingPage.css', () => ({}), { virtual: true });

import PackagePricingDetailPage from '../PackagePricingDetailPage';
import StandardizedApi from '../../../../../utils/standardizedApi';
import notificationManager from '../../../../../utils/notification';

describe('PackagePricingDetailPage 신규 모드', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue([]);
  });

  test('isNew 이면 신규 제목을 보이고 알림·목록 이동이 없다', async () => {
    render(<PackagePricingDetailPage isNew />);
    await waitFor(() => expect(screen.getByText(LABELS.NEW_PAGE_TITLE)).toBeTruthy());
    expect(notificationManager.show).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('isNew 없이 id 가 없으면 편집 모드로 찾지 못해 목록으로 이동한다(라우트가 isNew 를 넘겨야 하는 이유)', async () => {
    render(<PackagePricingDetailPage />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    expect(notificationManager.show).toHaveBeenCalled();
  });
});
