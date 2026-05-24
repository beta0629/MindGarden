/**
 * SystemConfigManagement — AI 섹션 분리 회귀 테스트.
 *
 * 트랙 B PR-4 (2026-05-24): AI provider 라디오 + API 키 입력 폼은
 * `AiProviderManagementPage` (`/admin/system/ai-providers`) 로 이전됨.
 * 본 페이지에는 AI 라디오가 더 이상 렌더링되어서는 안 된다.
 *
 * @see frontend/src/components/admin/aiProvider/AiProviderManagementPage.js
 * @see docs/project-management/2026-05-24/AI_PROVIDER_MGMT_DESIGN_HANDOFF.md
 */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SystemConfigManagement from '../SystemConfigManagement';
import * as ajax from '../../../utils/ajax';

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, defOrOpts, opts) => {
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

jest.mock('../../../contexts/SessionContext', () => {
  const STABLE_USER = { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-pr4-cleanup' };
  const STABLE_SESSION = { user: STABLE_USER, isLoggedIn: true };
  return {
    __esModule: true,
    useSession: () => STABLE_SESSION
  };
});

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-common-layout">{children}</div>
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, title, type = 'button', ...rest }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled} title={title} {...rest}>
      {children}
    </button>
  )
}));

jest.mock('../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <section data-testid="content-area">{children}</section>
}));

jest.mock('../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, actions }) => (
    <header data-testid="content-header">
      <h1>{title}</h1>
      {actions}
    </header>
  )
}));

const installAjaxDefaults = () => {
  ajax.apiGet.mockImplementation((url) => {
    if (url === '/api/v1/admin/system-config/WELLNESS_AUTO_SEND_ENABLED') {
      return Promise.resolve({ success: true, configValue: 'true' });
    }
    if (url === '/api/v1/admin/system-config/WELLNESS_SEND_TIME') {
      return Promise.resolve({ success: true, configValue: '09:00' });
    }
    if (url === '/api/v1/admin/system-config/WELLNESS_TARGET_ROLES') {
      return Promise.resolve({ success: true, configValue: 'CLIENT,ROLE_CLIENT' });
    }
    return Promise.resolve({ success: true, configValue: '' });
  });
  ajax.apiPost.mockResolvedValue({ success: true });
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <SystemConfigManagement />
    </MemoryRouter>
  );

describe('SystemConfigManagement — PR-4 AI 섹션 분리 후 회귀 검증', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installAjaxDefaults();
  });

  it('마운트 시 AI health/openai/gemini 등 AI 관련 GET API 호출이 발생하지 않는다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    });

    const aiUrls = ajax.apiGet.mock.calls.map((c) => c[0]).filter((url) =>
      typeof url === 'string'
      && (url.includes('/api/v1/admin/ai/')
        || url.includes('/system-config/openai')
        || url.includes('/system-config/OPENAI_')
        || url.includes('/system-config/GEMINI_')
        || url.includes('/system-config/CLAUDE_')
        || url.includes('/system-config/REPLICATE_')
        || url.includes('/system-config/ai-default-provider'))
    );
    expect(aiUrls).toHaveLength(0);
  });

  it('AI provider 라디오는 더 이상 렌더링되지 않는다 (분리됨)', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('radio', { name: /OpenAI/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Gemini/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Claude/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Replicate/i })).not.toBeInTheDocument();
  });

  it('AI 프로바이더 관리 페이지로의 안내 링크가 존재한다 (/admin/system/ai-providers)', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    });

    const link = await screen.findByRole('link', { name: /AI 프로바이더 관리/ });
    expect(link).toHaveAttribute('href', '/admin/system/ai-providers');
  });

  it('웰니스 설정 폼이 그대로 유지된다 (잔류 잔존 확인)', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText(/자동 발송 활성화/)).toBeInTheDocument();
    expect(screen.getByLabelText(/발송 시간/)).toBeInTheDocument();
    expect(screen.getByLabelText(/대상 역할/)).toBeInTheDocument();
  });
});

describe('SystemConfigManagement — 웰니스 대상 역할 다중선택+칩 UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installAjaxDefaults();
  });

  const waitForLoaded = async() => {
    await waitFor(() => {
      expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    });
  };

  it('초기 DB 값 "CLIENT,ROLE_CLIENT" 가 2개의 칩으로 렌더링된다', async() => {
    renderPage();
    await waitForLoaded();

    const combobox = screen.getByRole('combobox', { name: /대상 역할/ });
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    expect(within(combobox).getByText('CLIENT')).toBeInTheDocument();
    expect(within(combobox).getByText(/ROLE_CLIENT/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CLIENT 제거/ })).toBeInTheDocument();

    fireEvent.click(combobox);
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('레거시 옵션은 라벨에 "(레거시)" 가 부착된다', async() => {
    renderPage();
    await waitForLoaded();

    const combobox = screen.getByRole('combobox', { name: /대상 역할/ });
    fireEvent.click(combobox);

    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('CLIENT')).toBeInTheDocument();
    expect(within(listbox).getByText('ROLE_CLIENT (레거시)')).toBeInTheDocument();
    expect(within(listbox).getByText('SUPER_ADMIN (레거시)')).toBeInTheDocument();
    expect(within(listbox).getByText('TENANT_ADMIN (레거시)')).toBeInTheDocument();
  });

  it('드롭다운에서 옵션 클릭 시 칩이 추가되고, 저장 시 콤마 구분 페이로드로 PUT 된다', async() => {
    ajax.apiGet.mockImplementation((url) => {
      if (url === '/api/v1/admin/system-config/WELLNESS_AUTO_SEND_ENABLED') {
        return Promise.resolve({ success: true, configValue: 'true' });
      }
      if (url === '/api/v1/admin/system-config/WELLNESS_SEND_TIME') {
        return Promise.resolve({ success: true, configValue: '09:00' });
      }
      if (url === '/api/v1/admin/system-config/WELLNESS_TARGET_ROLES') {
        return Promise.resolve({ success: true, configValue: 'CLIENT' });
      }
      return Promise.resolve({ success: true, configValue: '' });
    });

    renderPage();
    await waitForLoaded();

    const combobox = screen.getByRole('combobox', { name: /대상 역할/ });
    fireEvent.click(combobox);

    const listbox = await screen.findByRole('listbox');
    const consultantOption = within(listbox).getByRole('option', { name: 'CONSULTANT' });
    fireEvent.click(consultantOption);

    expect(within(combobox).getByText('CLIENT')).toBeInTheDocument();
    expect(within(combobox).getByText('CONSULTANT')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '설정 저장' }));

    await waitFor(() => {
      expect(ajax.apiPost).toHaveBeenCalledWith(
        '/api/v1/admin/system-config/WELLNESS_TARGET_ROLES',
        expect.objectContaining({
          configValue: 'CLIENT,CONSULTANT',
          category: 'WELLNESS'
        })
      );
    });
  });

  it('칩의 × 버튼 클릭 시 해당 역할이 제거되고 저장 페이로드에 반영된다', async() => {
    renderPage();
    await waitForLoaded();

    const removeRoleClient = screen.getByRole('button', { name: 'ROLE_CLIENT (레거시) 제거' });
    fireEvent.click(removeRoleClient);

    const combobox = screen.getByRole('combobox', { name: /대상 역할/ });
    expect(within(combobox).queryByText(/ROLE_CLIENT/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '설정 저장' }));

    await waitFor(() => {
      expect(ajax.apiPost).toHaveBeenCalledWith(
        '/api/v1/admin/system-config/WELLNESS_TARGET_ROLES',
        expect.objectContaining({ configValue: 'CLIENT' })
      );
    });
  });

  it('a11y: combobox 는 aria-expanded 토글 + 칩 제거 버튼은 명확한 aria-label 을 가진다', async() => {
    renderPage();
    await waitForLoaded();

    const combobox = screen.getByRole('combobox', { name: /대상 역할/ });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    const clientRemove = screen.getByRole('button', { name: 'CLIENT 제거' });
    expect(clientRemove).toHaveAttribute('aria-label', 'CLIENT 제거');
  });
});
