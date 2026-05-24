/**
 * SystemConfigManagement — AI 섹션 분리 회귀 + 웰니스 대상 역할 DB 동기화 + 세션 race 핫픽스.
 *
 * 트랙 B PR-4 (2026-05-24): AI provider 라디오 + API 키 입력 폼은
 * `AiProviderManagementPage` (`/admin/system/ai-providers`) 로 이전됨.
 * 본 페이지에는 AI 라디오가 더 이상 렌더링되어서는 안 된다.
 *
 * 핫픽스 (2026-05-24):
 *  - 옵션 풀이 공통코드 'ROLE' 그룹에서 동적 로드 (구 USER_ROLES/LEGACY_USER_ROLES 상수 풀 제거).
 *  - 세션 복원(hasCheckedSession) 전에는 가드(`로그인이 필요합니다`)가 발동하지 않는다.
 *
 * @see frontend/src/components/admin/aiProvider/AiProviderManagementPage.js
 * @see docs/project-management/2026-05-24/AI_PROVIDER_MGMT_DESIGN_HANDOFF.md
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SystemConfigManagement from '../SystemConfigManagement';
import * as ajax from '../../../utils/ajax';
import * as commonCodeApi from '../../../utils/commonCodeApi';

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getCommonCodes: jest.fn()
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

// 세션 mock — 기본은 세션 복원 완료 + 로그인 상태.
const sessionState = {
  user: { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-pr4-cleanup' },
  isLoggedIn: true,
  hasCheckedSession: true
};
jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => sessionState
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));
import notificationManager from '../../../utils/notification';

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

const buildCommonCode = (overrides) => ({
  codeGroup: 'ROLE',
  isActive: true,
  isDeleted: false,
  sortOrder: 0,
  extraData: null,
  ...overrides
});

const DEFAULT_ROLE_CODES = [
  buildCommonCode({ codeValue: 'ADMIN', codeLabel: '관리자', koreanName: '관리자', sortOrder: 1 }),
  buildCommonCode({ codeValue: 'STAFF', codeLabel: '사무원', koreanName: '사무원', sortOrder: 2 }),
  buildCommonCode({ codeValue: 'CONSULTANT', codeLabel: '상담사', koreanName: '상담사', sortOrder: 3 }),
  buildCommonCode({ codeValue: 'CLIENT', codeLabel: '내담자', koreanName: '내담자', sortOrder: 4 }),
  buildCommonCode({
    codeValue: 'TENANT_ADMIN',
    codeLabel: '테넌트 관리자',
    koreanName: '테넌트 관리자',
    sortOrder: 5,
    extraData: '{"isDeprecated": true}'
  })
];

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
  commonCodeApi.getCommonCodes.mockResolvedValue(DEFAULT_ROLE_CODES);
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <SystemConfigManagement />
    </MemoryRouter>
  );

const waitForLoaded = async() => {
  await waitFor(() => {
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
  });
};

describe('SystemConfigManagement — PR-4 AI 섹션 분리 후 회귀 검증', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionState.hasCheckedSession = true;
    sessionState.isLoggedIn = true;
    sessionState.user = { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-pr4-cleanup' };
    installAjaxDefaults();
  });

  it('마운트 시 AI health/openai/gemini 등 AI 관련 GET API 호출이 발생하지 않는다', async() => {
    renderPage();
    await waitForLoaded();

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
    await waitForLoaded();

    expect(screen.queryByRole('radio', { name: /OpenAI/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Gemini/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Claude/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Replicate/i })).not.toBeInTheDocument();
  });

  it('AI 프로바이더 관리 페이지로의 안내 링크가 존재한다 (/admin/system/ai-providers)', async() => {
    renderPage();
    await waitForLoaded();

    const link = await screen.findByRole('link', { name: /AI 프로바이더 관리/ });
    expect(link).toHaveAttribute('href', '/admin/system/ai-providers');
  });

  it('웰니스 설정 폼이 그대로 유지된다 (잔류 잔존 확인)', async() => {
    renderPage();
    await waitForLoaded();

    expect(screen.getByLabelText(/자동 발송 활성화/)).toBeInTheDocument();
    expect(screen.getByLabelText(/발송 시간/)).toBeInTheDocument();
    expect(screen.getByLabelText(/대상 역할/)).toBeInTheDocument();
  });
});

describe('SystemConfigManagement — 웰니스 대상 역할 다중선택+칩 UI (DB 동기화)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionState.hasCheckedSession = true;
    sessionState.isLoggedIn = true;
    sessionState.user = { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-pr4-cleanup' };
    installAjaxDefaults();
  });

  it('마운트 시 공통코드 ROLE 그룹을 1회 조회한다', async() => {
    renderPage();
    await waitForLoaded();

    expect(commonCodeApi.getCommonCodes).toHaveBeenCalledTimes(1);
    expect(commonCodeApi.getCommonCodes).toHaveBeenCalledWith('ROLE');
  });

  it('초기 DB 값 "CLIENT,ROLE_CLIENT" 가 2개의 칩으로 렌더링된다 (chipLabel=codeValue)', async() => {
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

  it('활성 옵션은 한글명+코드 라벨로 표시되고, deprecated 옵션은 "(레거시)" 가 부착된다', async() => {
    renderPage();
    await waitForLoaded();

    const combobox = screen.getByRole('combobox', { name: /대상 역할/ });
    fireEvent.click(combobox);

    const listbox = await screen.findByRole('listbox');
    // DB에서 koreanName 이 codeValue 와 다른 경우 → "{name} ({code})"
    expect(within(listbox).getByText('관리자 (ADMIN)')).toBeInTheDocument();
    expect(within(listbox).getByText('상담사 (CONSULTANT)')).toBeInTheDocument();
    expect(within(listbox).getByText('내담자 (CLIENT)')).toBeInTheDocument();
    // extraData.isDeprecated=true → "(레거시)"
    expect(within(listbox).getByText('테넌트 관리자 (TENANT_ADMIN) (레거시)')).toBeInTheDocument();
    // saved 값이지만 DB 풀에 없는 ROLE_CLIENT 도 레거시 옵션으로 노출
    expect(within(listbox).getByText('ROLE_CLIENT (레거시)')).toBeInTheDocument();
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
    const consultantOption = within(listbox).getByRole('option', { name: '상담사 (CONSULTANT)' });
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

describe('SystemConfigManagement — 세션 로딩 race 핫픽스', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installAjaxDefaults();
  });

  it('세션 복원 전(hasCheckedSession=false)에는 "로그인 필요" 토스트가 발동하지 않고 로딩 상태가 유지된다', () => {
    sessionState.hasCheckedSession = false;
    sessionState.isLoggedIn = false;
    sessionState.user = null;

    renderPage();

    expect(screen.getByTestId('unified-loading')).toHaveTextContent(/세션을 확인하는 중/);
    expect(notificationManager.show).not.toHaveBeenCalled();
    expect(commonCodeApi.getCommonCodes).not.toHaveBeenCalled();
    expect(ajax.apiGet).not.toHaveBeenCalled();
  });

  it('세션 복원 완료 + 로그아웃 상태에서만 "로그인 필요" 토스트가 발동한다', async() => {
    sessionState.hasCheckedSession = true;
    sessionState.isLoggedIn = false;
    sessionState.user = null;

    renderPage();

    await waitFor(() => {
      expect(notificationManager.show).toHaveBeenCalledWith('로그인이 필요합니다.', 'error');
    });
    expect(commonCodeApi.getCommonCodes).not.toHaveBeenCalled();
  });

  it('세션 복원 완료 + 권한 없는 사용자는 "접근 권한 없음" 토스트가 발동한다', async() => {
    sessionState.hasCheckedSession = true;
    sessionState.isLoggedIn = true;
    sessionState.user = { id: 'c-1', role: 'CLIENT', tenantId: 't1' };

    renderPage();

    await waitFor(() => {
      expect(notificationManager.show).toHaveBeenCalledWith('접근 권한이 없습니다.', 'error');
    });
    expect(commonCodeApi.getCommonCodes).not.toHaveBeenCalled();
  });

  it('처음에는 hasCheckedSession=false → 이후 true 로 전이되면 가드 통과·옵션 풀 로드가 진행된다', async() => {
    sessionState.hasCheckedSession = false;
    sessionState.isLoggedIn = false;
    sessionState.user = null;

    const { rerender } = renderPage();
    expect(screen.getByTestId('unified-loading')).toHaveTextContent(/세션을 확인하는 중/);

    await act(async() => {
      sessionState.hasCheckedSession = true;
      sessionState.isLoggedIn = true;
      sessionState.user = { id: 'admin-1', role: 'ADMIN', tenantId: 't1' };
      rerender(
        <MemoryRouter>
          <SystemConfigManagement />
        </MemoryRouter>
      );
    });

    await waitForLoaded();

    expect(commonCodeApi.getCommonCodes).toHaveBeenCalledWith('ROLE');
    expect(notificationManager.show).not.toHaveBeenCalledWith('로그인이 필요합니다.', 'error');
  });
});
