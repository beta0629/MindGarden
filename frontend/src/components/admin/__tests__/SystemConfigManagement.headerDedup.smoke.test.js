/**
 * SystemConfigManagement — G-14 P2 header dedup 스모크 테스트.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const PAGE_TITLE = '시스템 설정';
const PAGE_SUBTITLE = '테넌트·알림·웰니스 등 시스템 옵션을 관리합니다.';

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
      {actions ? <div data-testid="content-header-actions">{actions}</div> : null}
    </header>
  )
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defOrOpts, opts) => {
      const map = {
        'systemConfig.pageTitle': PAGE_TITLE,
        'systemConfig.pageSubtitle': PAGE_SUBTITLE,
        'systemConfig.action.save': '저장',
        'systemConfig.loading.session': '세션 확인 중',
        'systemConfig.loading.config': '설정 로딩 중'
      };
      if (map[key]) return map[key];
      const hasDefault = typeof defOrOpts === 'string';
      const fallback = hasDefault ? defOrOpts : key;
      const variables = hasDefault ? (opts || {}) : (defOrOpts || {});
      return Object.entries(variables).reduce(
        (acc, [name, value]) => acc.replace(new RegExp(`{{${name}}}`, 'g'), String(value)),
        fallback
      );
    }
  })
}));

const sessionState = {
  user: { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-1' },
  isLoggedIn: true,
  hasCheckedSession: true
};

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => sessionState,
  SessionContext: { Provider: ({ children }) => children, _currentValue: null }
}));

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn(() => Promise.resolve({ success: true, configValue: 'false' })),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn()
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ success: true, flags: [] }),
    post: jest.fn().mockResolvedValue({ success: true }),
    put: jest.fn().mockResolvedValue({ success: true }),
    patch: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../common/ActionBarButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: () => null
}));

import SystemConfigManagement from '../SystemConfigManagement';

describe('SystemConfigManagement (G-14 P2 header dedup)', () => {
  test('ContentHeader title SSOT, ACL title 생략, 부제·저장 액션 유지', async() => {
    render(
      <MemoryRouter>
        <SystemConfigManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');
    });

    const header = screen.getByTestId('content-header');
    expect(header).toHaveAttribute('data-has-title', 'true');
    expect(screen.getByRole('heading', { name: PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId('content-header-actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });
});
