/**
 * 설정 공통 셸 스모크 — 시스템 설정 · 센터 코드 · AI 프로바이더.
 * 실제 페이지를 렌더해 SettingsPageShell/SettingsSectionPanel 계약과 레거시 크롬 부재를 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title ?? ''}>
      {children}
    </div>
  )
}));

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('react-i18next', () => {
  const t = (key, defOrOpts) => {
    const map = {
      'systemConfig.pageTitle': '시스템 설정',
      'admin:tenantCommonCode.ui.headerTitle': '센터 코드'
    };
    if (map[key]) {
      return map[key];
    }
    if (typeof defOrOpts === 'string') {
      return defOrOpts;
    }
    return key;
  };
  return {
    __esModule: true,
    useTranslation: () => ({ t, i18n: { language: 'ko', changeLanguage: () => Promise.resolve() } }),
    Trans: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: () => {} }
  };
});

jest.mock('../../../../contexts/SessionContext', () => {
  const STABLE_SESSION = {
    user: { id: 'admin-1', role: 'ADMIN' },
    isLoggedIn: true,
    hasCheckedSession: true
  };
  return {
    __esModule: true,
    useSession: () => STABLE_SESSION,
    SessionContext: { Provider: ({ children }) => children, _currentValue: null }
  };
});

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: () => Promise.resolve({ success: true, flags: [] }),
    post: () => Promise.resolve({ success: true }),
    put: () => Promise.resolve({ success: true }),
    patch: () => Promise.resolve({ success: true }),
    delete: () => Promise.resolve({ success: true })
  }
}));

jest.mock('../../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: () => Promise.resolve({ success: true, configValue: '' }),
  apiPost: () => Promise.resolve({ success: true }),
  apiPut: () => Promise.resolve({ success: true }),
  apiPatch: () => Promise.resolve({ success: true }),
  apiDelete: () => Promise.resolve({ success: true })
}));

jest.mock('../../../../api/admin/smsTemplateApi', () => ({
  __esModule: true,
  getSmsTemplates: () => Promise.resolve([]),
  patchTemplateDispatchFlag: () => Promise.resolve({ success: true })
}));

jest.mock('../../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getCommonCodes: () => Promise.resolve([])
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: () => {}, error: () => {}, success: () => {} }
}));

jest.mock('../../../../utils/tenantCommonCodeApi', () => ({
  __esModule: true,
  getTenantCodeGroups: () => Promise.resolve({
    success: true,
    data: [{ groupName: 'ROLE', koreanName: '역할' }]
  }),
  getTenantCodesByGroup: () => Promise.resolve({ success: true, data: [] }),
  createTenantCode: () => Promise.resolve({ success: true }),
  updateTenantCode: () => Promise.resolve({ success: true }),
  deleteTenantCode: () => Promise.resolve({ success: true }),
  toggleTenantCodeActive: () => Promise.resolve({ success: true })
}));

jest.mock('../../../../utils/codeHelper', () => ({
  __esModule: true,
  loadCodeGroupMetadata: () => Promise.resolve([]),
  getCodeGroupKoreanNameSync: (group) => group
}));

jest.mock('../../../common', () => ({
  SidePeekShell: ({ children, isOpen }) => (
    isOpen ? <div data-testid="side-peek-shell">{children}</div> : null
  )
}));

jest.mock('../../tenant-common-codes/organisms/TenantCommonCodeTable', () => ({
  __esModule: true,
  default: ({ codes }) => <div data-testid="tenant-common-code-table">{codes.length}</div>
}));

jest.mock('../../tenant-common-codes/molecules/TenantCommonCodeSidePeekContent', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../tenant-common-codes/molecules/TenantCommonCodeFormModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../../api/admin/aiHealthApi', () => ({
  __esModule: true,
  getAiProviderHealth: () => Promise.resolve({
    activeProvider: 'openai',
    openaiKeyRegistered: true,
    geminiKeyRegistered: false
  })
}));

jest.mock('../../../../api/admin/aiUsageApi', () => ({
  __esModule: true,
  getAiUsageStats: () => Promise.resolve(null),
  getAiUsageLogs: () => Promise.resolve({ content: [], totalPages: 0, number: 0 }),
  getAiUsageLogDetail: () => Promise.resolve(null)
}));

/* eslint-disable import/first */
import SystemConfigManagement from '../../SystemConfigManagement';
import TenantCommonCodeManager from '../../TenantCommonCodeManager';
import AiProviderManagementPage from '../../aiProvider/AiProviderManagementPage';
/* eslint-enable import/first */

const expectSettingsShellContract = async(container, title) => {
  await waitFor(() => {
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
  });
  expect(container.querySelector('section.mg-v2-erp-shell.mg-v2-settings-shell')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
  expect(container.querySelector('.mg-v2-content-header')).not.toBeInTheDocument();
  expect(container.querySelectorAll('.mg-v2-settings-panel').length).toBeGreaterThan(0);
  expect(container.querySelector('.mg-action-btn')).not.toBeInTheDocument();
};

describe('설정 공통 셸 스모크 — 시스템 설정 · 센터 코드 · AI 프로바이더', () => {
  it('시스템 설정이 SettingsPageShell·SettingsSectionPanel 계약으로 렌더된다', async() => {
    const { container } = render(
      <MemoryRouter>
        <SystemConfigManagement />
      </MemoryRouter>
    );
    await expectSettingsShellContract(container, '시스템 설정');
  });

  it('센터 코드가 SettingsPageShell·SettingsSectionPanel 계약으로 렌더된다', async() => {
    const { container } = render(<TenantCommonCodeManager />);
    await waitFor(() => {
      expect(screen.getByTestId('tenant-common-code-table')).toBeInTheDocument();
    });
    await expectSettingsShellContract(container, '센터 코드');
  });

  it('AI 프로바이더가 SettingsPageShell·SettingsSectionPanel 계약으로 렌더된다', async() => {
    const { container } = render(<AiProviderManagementPage />);
    await expectSettingsShellContract(container, 'AI 프로바이더 관리');
  });
});
