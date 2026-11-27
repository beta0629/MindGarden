/**
 * SystemConfigManagement — 비ADMIN 페이지 본문 조기 return 가드
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { USER_ROLES } from '../../../constants/roles';
import { SCT_TEST_ID } from '../../../constants/sctOnline';
import notificationManager from '../../../utils/notification';

const PAGE_TITLE = '시스템 설정';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title, loading, loadingText }) => (
    <div data-testid="admin-common-layout" data-title={title ?? ''}>
      {loading ? <div data-testid="loading">{loadingText}</div> : children}
    </div>
  )
}));

jest.mock('../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defOrOpts) => {
      const map = {
        'systemConfig.pageTitle': '시스템 설정',
        'systemConfig.error.noAccess': '접근 권한이 없습니다.',
        'systemConfig.loading.session': '세션 확인 중',
        'systemConfig.loading.config': '설정 로딩 중'
      };
      if (map[key]) return map[key];
      return typeof defOrOpts === 'string' ? defOrOpts : key;
    }
  })
}));

const mockSessionState = {
  user: { id: 'staff-1', role: 'STAFF', tenantId: 'tenant-1' },
  isLoggedIn: true,
  hasCheckedSession: true
};

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => mockSessionState,
  SessionContext: { Provider: ({ children }) => children, _currentValue: null }
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

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../sct/AdminSctSettingsSection', () => ({
  __esModule: true,
  default: () => <div data-testid="sct-settings">sct-settings</div>
}));

import SystemConfigManagement from '../SystemConfigManagement';

describe('SystemConfigManagement admin page guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionState.user = { id: 'staff-1', role: USER_ROLES.STAFF, tenantId: 'tenant-1' };
    mockSessionState.isLoggedIn = true;
    mockSessionState.hasCheckedSession = true;
  });

  it('blocks page body for STAFF (no SCT settings section)', async() => {
    render(
      <MemoryRouter>
        <SystemConfigManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('system-config-access-denied')).toBeInTheDocument();
    });
    expect(screen.queryByTestId(SCT_TEST_ID.SETTINGS)).not.toBeInTheDocument();
    expect(screen.queryByTestId('sct-settings')).not.toBeInTheDocument();
    expect(notificationManager.show).toHaveBeenCalledWith(
      '접근 권한이 없습니다.',
      'error'
    );
  });

  it('renders page body for ADMIN', async() => {
    mockSessionState.user = { id: 'admin-1', role: USER_ROLES.ADMIN, tenantId: 'tenant-1' };
    render(
      <MemoryRouter>
        <SystemConfigManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('sct-settings')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('system-config-access-denied')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: PAGE_TITLE })).toBeInTheDocument();
  });
});
