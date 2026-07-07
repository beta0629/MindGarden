/**
 * SchedulePage — G-14 P0 header dedup 스모크 테스트.
 * ACL title 생략, ContentHeader SSOT는 페이지 본문.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title, loading }) => (
    <div data-testid="admin-common-layout" data-title={title ?? ''} data-loading={loading ? 'true' : 'false'}>
      {children}
    </div>
  )
}));

jest.mock('../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title }) => <h1 data-testid="content-header">{title}</h1>
}));

jest.mock('../../dashboard-v2/content/ContentSection', () => ({
  __esModule: true,
  default: ({ children }) => <section>{children}</section>
}));

jest.mock('../UnifiedScheduleComponent', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-schedule-stub" />
}));

jest.mock('../ConsultantStatus', () => ({
  __esModule: true,
  default: () => <div data-testid="consultant-status-stub" />
}));

jest.mock('../TodayStats', () => ({
  __esModule: true,
  default: () => <div data-testid="today-stats-stub" />
}));

jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => ({
    user: { id: 1, role: 'ADMIN' },
    isLoggedIn: true,
    isLoading: false,
    hasPermission: () => true
  })
}));

import SchedulePage from '../SchedulePage';

describe('SchedulePage (G-14 P0 header dedup)', () => {
  test('AdminCommonLayout title 생략 및 ContentHeader SSOT mount', () => {
    const { container } = render(<SchedulePage />);

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');
    expect(screen.getByTestId('content-header')).toHaveTextContent('스케줄 통합 관리');
    expect(container.querySelector('.mg-v2-ad-b0kla__container')).toBeInTheDocument();
  });
});
