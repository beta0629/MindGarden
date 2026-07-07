/**
 * AdminNotificationsPage — G-14 P2 header dedup 스모크 테스트.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

const PAGE_TITLE = '알림·메시지 관리';
const PAGE_SUBTITLE = '공지 작성과 메시지 조회를 한 화면에서 관리합니다.';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title ?? ''}>
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
  default: ({ title, subtitle, actions }) => (
    <header data-testid="content-header" data-has-title={String(Boolean(title))}>
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </header>
  )
}));

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(), jest.fn()]
}));

jest.mock('../../../utils/permissionUtils', () => ({
  fetchUserPermissions: async(setter) => {
    if (setter) setter([]);
    return [];
  },
  hasPermission: () => false
}));

jest.mock('../organisms/SystemNotificationListBlock', () => ({
  __esModule: true,
  default: () => <div data-testid="system-notification-list-block" />
}));

jest.mock('../organisms/AdminMessageListBlock', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-message-list-block" />
}));

jest.mock('../../common/SegmentedTabs', () => ({
  __esModule: true,
  default: () => <div data-testid="segmented-tabs" />
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children }) => <button type="button">{children}</button>
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => (key === 'admin.labels.message' ? '메시지' : key)
  })
}));

import AdminNotificationsPage from '../AdminNotificationsPage';

describe('AdminNotificationsPage (G-14 P2 header dedup)', () => {
  test('ACL title SSOT 유지, ContentHeader title 생략, 부제·탭 mount', () => {
    render(<AdminNotificationsPage />);

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', PAGE_TITLE);
    expect(screen.getByTestId('content-header')).toHaveAttribute('data-has-title', 'false');
    expect(screen.queryByRole('heading', { name: PAGE_TITLE })).not.toBeInTheDocument();
    expect(screen.getByText(PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId('segmented-tabs')).toBeInTheDocument();
  });
});
