/**
 * 웰니스 상세 — 「< 웰니스 알림」 목록 뒤로 링크
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StandardizedApi from '../../../utils/standardizedApi';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import WellnessNotificationDetail from '../WellnessNotificationDetail';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '9' })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => ({
    user: { id: 1, role: 'CLIENT' },
    isLoggedIn: true,
    isLoading: false,
    hasCheckedSession: true
  })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../../../utils/safeHtml', () => ({
  sanitizeRichNoticeHtml: (html) => (html == null ? '' : String(html))
}));

jest.mock('../../client/ClientWebPageShell', () => ({
  __esModule: true,
  default: ({ title, children }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

describe('WellnessNotificationDetail back link', () => {
  test('제목 위에 「< 웰니스 알림」 링크가 있고 목록 경로로 이동한다', async() => {
    StandardizedApi.get.mockResolvedValue({
      id: 9,
      title: '잠들기 전 5분 호흡 연습',
      content: '<p>본문</p>',
      notificationType: 'WELLNESS',
      authorName: '센터',
      publishedAt: '2026-10-21T00:00:00'
    });
    render(
      <MemoryRouter initialEntries={['/client/wellness/9']}>
        <Routes>
          <Route path="/client/wellness/:id" element={<WellnessNotificationDetail />} />
        </Routes>
      </MemoryRouter>
    );
    const link = await screen.findByTestId('wellness-detail-back-link');
    expect(link).toHaveTextContent('< 웰니스 알림');
    fireEvent.click(link);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(CLIENT_DASHBOARD_ROUTES.WELLNESS);
    });
    expect(screen.getByRole('button', { name: '목록으로' })).toBeInTheDocument();
  });
});
