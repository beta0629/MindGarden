/**
 * ConsultantStatus — apiGet unwrap 후 { consultants } 페이로드를 직접 렌더.
 * response.success 게이트가 있으면 unwrap 응답이 항상 실패로 보인다.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ConsultantStatus from '../ConsultantStatus';
import { apiGet } from '../../../utils/ajax';

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn()
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../ui/Card/index', () => ({
  ProfileCard: ({ name, badges }) => (
    <div data-testid="profile-card">
      <div data-testid="consultant-name">{name}</div>
      <div data-testid="consultant-badges">{badges}</div>
    </div>
  )
}));

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>
}));

jest.mock('../../../utils/zonedDateTime', () => ({
  formatDateKeyInZone: () => '2026-10-14'
}));

describe('ConsultantStatus — with-vacation unwrap 페이로드', () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it('mock unwrapped { consultants: [...] } 로 성공 렌더한다 (success 게이트 없음)', async() => {
    apiGet.mockImplementation((url) => {
      if (String(url).includes('/with-vacation')) {
        return Promise.resolve({
          consultants: [
            {
              id: 3,
              name: '김상담',
              email: 'c@example.com',
              phone: '010-0000-0000',
              specialty: 'ANXIETY',
              isActive: true,
              createdAt: '2026-01-01'
            }
          ],
          count: 1
        });
      }
      return Promise.resolve([]);
    });

    render(<ConsultantStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-card')).toBeInTheDocument();
    });
    expect(screen.getByText('김상담')).toBeInTheDocument();
    expect(screen.queryByText(/상담사 목록 조회 실패/)).not.toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/consultants/with-vacation')
    );
  });

  it('배열 페이로드도 수용한다', async() => {
    apiGet.mockImplementation((url) => {
      if (String(url).includes('/with-vacation')) {
        return Promise.resolve([
          { id: 6, name: '이상담', isActive: true }
        ]);
      }
      return Promise.resolve([]);
    });

    render(<ConsultantStatus />);

    await waitFor(() => {
      expect(screen.getByText('이상담')).toBeInTheDocument();
    });
  });
});
