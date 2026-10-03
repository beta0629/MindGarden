/**
 * 설정 공통 셸 스모크 — 카카오 설정 · 문자 설정 · SMS 템플릿 · 수동 알림 · 푸시 모니터링
 * 실제 페이지를 렌더해 SettingsPageShell / SettingsSectionPanel 계약을 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// 페이지들이 t 를 useCallback/useEffect 의존성에 넣으므로 렌더마다 같은 참조여야 한다.
jest.mock('react-i18next', () => {
  const mockT = (key, defOrOpts) => {
    if (typeof defOrOpts === 'string') {
      return defOrOpts;
    }
    if (defOrOpts && typeof defOrOpts.defaultValue === 'string') {
      return defOrOpts.defaultValue;
    }
    return key;
  };
  const mockTranslation = { t: mockT };
  return {
    __esModule: true,
    useTranslation: () => mockTranslation,
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../../api/admin/smsTemplateApi', () => ({
  __esModule: true,
  getSmsTemplates: jest.fn(),
  updateSmsTemplateTenantOverride: jest.fn(),
  deleteSmsTemplateTenantOverride: jest.fn(),
  previewSmsTemplate: jest.fn(),
  patchGlobalDispatchFlag: jest.fn(),
  patchTemplateDispatchFlag: jest.fn()
}));

jest.mock('../../../../api/admin/manualNotificationApi', () => {
  const actual = jest.requireActual('../../../../api/admin/manualNotificationApi');
  return {
    __esModule: true,
    ...actual,
    searchRecipients: jest.fn(),
    fetchCommonCodeTemplates: jest.fn(),
    fetchLiveTemplates: jest.fn(),
    fetchHistory: jest.fn(),
    fetchBatchDetail: jest.fn(),
    sendSmsBatch: jest.fn(),
    sendAlimtalkBatch: jest.fn(),
    sendPushBatch: jest.fn()
  };
});

jest.mock('../../../../api/admin/pushMonitoringApi', () => {
  const actual = jest.requireActual('../../../../api/admin/pushMonitoringApi');
  return {
    __esModule: true,
    ...actual,
    getPushMonitoringSnapshot: jest.fn(),
    resendPushMonitoringFailure: jest.fn(),
    getRecentSmsLogs: jest.fn()
  };
});

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn(), show: jest.fn() },
  showNotification: jest.fn()
}));

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, loading, loadingText }) => (
    <div data-testid="admin-layout">
      {loading ? <div role="status">{loadingText}</div> : children}
    </div>
  )
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions }) => (
    isOpen ? (
      <div role="dialog">
        {children}
        <div>{actions}</div>
      </div>
    ) : null
  )
}));

const mockSessionState = {
  user: { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-test' },
  isLoggedIn: true,
  isLoading: false
};
jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => mockSessionState
}));

/* eslint-disable import/first -- jest.mock 이후 import */
import StandardizedApi from '../../../../utils/standardizedApi';
import { getSmsTemplates } from '../../../../api/admin/smsTemplateApi';
import {
  fetchHistory,
  searchRecipients
} from '../../../../api/admin/manualNotificationApi';
import {
  getPushMonitoringSnapshot,
  getRecentSmsLogs
} from '../../../../api/admin/pushMonitoringApi';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import AdminKakaoAlimtalkSettingsPage from '../../AdminKakaoAlimtalkSettingsPage';
import AdminTenantSmsSettingsPage from '../../AdminTenantSmsSettingsPage';
import SmsTemplateManagementPage from '../../sms-templates/SmsTemplateManagementPage';
import AdminManualNotificationPage from '../../manual-notification/AdminManualNotificationPage';
import AdminPushMonitoringPage from '../../PushMonitoring/AdminPushMonitoringPage';
/* eslint-enable import/first */

const renderPage = async(element) => {
  let result;
  await act(async() => {
    result = render(<MemoryRouter>{element}</MemoryRouter>);
  });
  return result;
};

const expectSettingsShell = (container, title) => {
  const shell = container.querySelector('section.mg-v2-erp-shell.mg-v2-settings-shell');
  expect(shell).not.toBeNull();
  const h1 = shell.querySelector('h1');
  expect(h1).not.toBeNull();
  expect(h1).toHaveTextContent(title);
  expect(container.querySelector('.mg-v2-content-header')).toBeNull();
  expect(container.querySelector('[class*="mg-v2-ad-b0kla"]')).toBeNull();
  expect(container.querySelectorAll('.mg-v2-settings-panel').length).toBeGreaterThan(0);
  return shell;
};

const expectInputContract = (shell) => {
  shell.querySelectorAll('input[type="text"], input[type="search"], input[type="tel"]')
    .forEach((el) => expect(el).toHaveClass('mg-v2-form-input'));
  shell.querySelectorAll('select').forEach((el) => expect(el).toHaveClass('mg-v2-select'));
  shell.querySelectorAll('textarea').forEach((el) => expect(el).toHaveClass('mg-v2-form-textarea'));
};

describe('설정 공통 셸 스모크 — 메시지 설정 5종', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSmsTemplates.mockResolvedValue({ success: true, data: [] });
    fetchHistory.mockResolvedValue({ content: [], totalElements: 0, number: 0, totalPages: 0 });
    searchRecipients.mockResolvedValue([]);
    getPushMonitoringSnapshot.mockResolvedValue({ success: true, data: { kpi: null, failures: [] } });
    getRecentSmsLogs.mockResolvedValue({ success: true, data: [] });
  });

  it('카카오 설정: 셸 + 패널 + 입력 계약 + 저장 버튼', async() => {
    StandardizedApi.get.mockResolvedValue({ tenantId: 'tenant-test', alimtalkEnabled: true });
    const { container } = await renderPage(<AdminKakaoAlimtalkSettingsPage />);
    await screen.findByTestId('admin-kakao-alimtalk-settings');
    const shell = expectSettingsShell(container, 'settings:kakao.title');
    expectInputContract(shell);
    const save = screen.getByRole('button', { name: 'settings:kakao.action.saveTemplatesAndRefs' });
    expect(save).toHaveClass('mg-v2-settings-button');
  });

  it('문자 설정: 셸 + 패널 + 입력 계약 + 저장 버튼', async() => {
    StandardizedApi.get.mockResolvedValue({ tenantId: 'tenant-test', smsEnabled: true });
    const { container } = await renderPage(<AdminTenantSmsSettingsPage />);
    await screen.findByTestId('admin-tenant-sms-settings');
    const shell = expectSettingsShell(container, 'settings:sms.title');
    expectInputContract(shell);
    const save = screen.getByRole('button', { name: 'settings:sms.action.saveRefs' });
    expect(save).toHaveClass('mg-v2-settings-button');
  });

  it('SMS 템플릿: 셸 + 글로벌 토글 패널 + 목록 패널 + 입력 계약', async() => {
    const { container } = await renderPage(<SmsTemplateManagementPage />);
    await screen.findByTestId('sms-template-items');
    const shell = expectSettingsShell(container, 'smsTemplate.page.title');
    expect(screen.getByTestId('sms-template-global-toggle')).toHaveClass('mg-v2-settings-panel');
    expect(screen.getByTestId('sms-template-items').closest('.mg-v2-settings-panel')).not.toBeNull();
    expectInputContract(shell);
  });

  it('수동 알림: 셸 + 폼 섹션 패널 + 히스토리 패널 + 입력 계약', async() => {
    const { container } = await renderPage(<AdminManualNotificationPage />);
    await screen.findByText('manualNotification.history.empty');
    const shell = expectSettingsShell(container, 'manualNotification.page.title');
    expect(shell.querySelector('.mg-manual-notif-history.mg-v2-settings-panel')).not.toBeNull();
    expect(shell.querySelectorAll('.mg-manual-notif-form .mg-v2-settings-panel').length).toBeGreaterThan(0);
    expectInputContract(shell);
  });

  it('푸시 모니터링: 셸 + 섹션 패널 + SMS 로그 패널', async() => {
    const { container } = await renderPage(<AdminPushMonitoringPage />);
    await screen.findByTestId('sms-log-card-empty');
    expectSettingsShell(container, ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TITLE);
    expect(screen.getByTestId('sms-log-card')).toHaveClass('mg-v2-settings-panel');
    expect(screen.getByRole('button', { name: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_REFRESH }))
      .toHaveClass('mg-v2-settings-button');
  });
});
