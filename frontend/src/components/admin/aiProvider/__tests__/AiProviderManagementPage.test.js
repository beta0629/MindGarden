/**
 * AiProviderManagementPage — 통합 동작 검증.
 *
 * 트랙 B PR-4 (2026-05-24):
 *   - 마운트 시 health / stats / logs 3 API 가 모두 호출된다.
 *   - 라디오 변경 → /ai-default-provider POST 호출 + 헬스 재조회.
 *   - 미등록 provider 카드는 disabled + tooltip.
 *   - 통계 카드 4 개 (오늘 / 이번 주 / 이번 달 / 성공률) 렌더.
 *   - 호출 로그 테이블 행 + 페이징 컨트롤 노출.
 *
 * @see frontend/src/components/admin/aiProvider/AiProviderManagementPage.js
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AiProviderManagementPage from '../AiProviderManagementPage';
import * as ajax from '../../../../utils/ajax';
import * as aiHealthApi from '../../../../api/admin/aiHealthApi';
import * as aiUsageApi from '../../../../api/admin/aiUsageApi';

jest.mock('../../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

jest.mock('../../../../api/admin/aiHealthApi', () => ({
  __esModule: true,
  getAiProviderHealth: jest.fn(),
  AI_HEALTH_ENDPOINTS: { HEALTH: '/api/v1/admin/ai/health' }
}));

jest.mock('../../../../api/admin/aiUsageApi', () => ({
  __esModule: true,
  AI_USAGE_ENDPOINTS: {
    STATS: '/api/v1/admin/ai/usage-stats',
    LOGS: '/api/v1/admin/ai/usage-logs',
    LOG_DETAIL: (id) => `/api/v1/admin/ai/usage-logs/${id}/detail`
  },
  getAiUsageStats: jest.fn(),
  getAiUsageLogs: jest.fn(),
  getAiUsageLogDetail: jest.fn()
}));

jest.mock('../../../../contexts/SessionContext', () => {
  const STABLE_USER = { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-pr4-ai' };
  const STABLE_SESSION = { user: STABLE_USER, isLoggedIn: true };
  return {
    __esModule: true,
    useSession: () => STABLE_SESSION
  };
});

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-common-layout">{children}</div>
}));

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, title, type = 'button', ...rest }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled} title={title} {...rest}>
      {children}
    </button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <section data-testid="content-area">{children}</section>
}));

jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title }) => (
    <header data-testid="content-header">
      <h1>{title}</h1>
    </header>
  )
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children, actions }) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <div>{children}</div>
        <div data-testid="modal-actions">{actions}</div>
      </div>
    ) : null
  )
}));

const STATS_FIXTURE = {
  tenantId: 'tenant-pr4-ai',
  period: 'month',
  callsToday: 12,
  callsThisWeek: 80,
  callsThisMonth: 320,
  callsByProvider: { OPENAI: 280, GEMINI: 40, CLAUDE: 0, REPLICATE: 0, UNKNOWN: 0 },
  callsByCaller: { wellness: 200, healing: 80, psych: 40 },
  successRate: 96.5,
  failureRate: 3.5,
  fallbackUsageRate: -1,
  averageDurationMs: 750,
  totalTokens: 45000,
  dailyCalls30d: Array.from({ length: 30 }).map((_, i) => ({
    date: `2026-04-${String(25 + i).padStart(2, '0')}`,
    count: i % 5
  }))
};

const LOGS_FIXTURE = {
  content: [
    {
      id: 101,
      aiProvider: 'OPENAI',
      requestType: 'wellness',
      model: 'gpt-4o-mini',
      status: 'success',
      durationMs: 540,
      tokenCount: 220,
      errorMessage: null,
      createdAt: '2026-05-24T08:30:00'
    },
    {
      id: 102,
      aiProvider: 'GEMINI',
      requestType: 'healing',
      model: 'gemini-2.5-flash',
      status: 'failed',
      durationMs: 1500,
      tokenCount: 0,
      errorMessage: '429 RESOURCE_EXHAUSTED',
      createdAt: '2026-05-24T07:10:00'
    }
  ],
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 50
};

const HEALTH_FIXTURE = {
  tenantId: 'tenant-pr4-ai',
  activeProvider: 'openai',
  openaiKeyRegistered: true,
  geminiKeyRegistered: false,
  checkedAt: '2026-05-24T09:00:00Z'
};

const installAjaxDefaults = () => {
  ajax.apiGet.mockImplementation((url) => {
    // OPENAI key/url/model 등 prefix 별 설정 응답
    if (url && url.includes('/system-config/OPENAI_API_KEY')) {
      return Promise.resolve({ success: true, configValue: 'sk-existing' });
    }
    if (url === '/api/v1/admin/system-config/ai-default-provider') {
      return Promise.resolve({ success: true, providerId: 'openai' });
    }
    return Promise.resolve({ success: true, configValue: '' });
  });
  ajax.apiPost.mockResolvedValue({ success: true });
};

const waitForLoaded = async() => {
  await waitFor(() => {
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
  }, { timeout: 5000 });
};

describe('AiProviderManagementPage — 트랙 B PR-4', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installAjaxDefaults();
    aiHealthApi.getAiProviderHealth.mockResolvedValue(HEALTH_FIXTURE);
    aiUsageApi.getAiUsageStats.mockResolvedValue(STATS_FIXTURE);
    aiUsageApi.getAiUsageLogs.mockResolvedValue(LOGS_FIXTURE);
  });

  it('마운트 시 헬스 / 통계 / 로그 3 API 가 모두 호출된다', async() => {
    render(<AiProviderManagementPage />);

    await waitForLoaded();

    await waitFor(() => {
      expect(aiHealthApi.getAiProviderHealth).toHaveBeenCalled();
      expect(aiUsageApi.getAiUsageStats).toHaveBeenCalled();
      expect(aiUsageApi.getAiUsageLogs).toHaveBeenCalled();
    });
  });

  it('미등록 provider (Gemini) 라디오는 disabled 이고 tooltip 노출, OpenAI 는 enable', async() => {
    render(<AiProviderManagementPage />);

    await waitForLoaded();

    const openaiRadio = await screen.findByRole('radio', { name: /OpenAI 사용/ });
    const geminiRadio = await screen.findByRole('radio', { name: /Gemini 사용/ });

    expect(openaiRadio).not.toBeDisabled();
    expect(geminiRadio).toBeDisabled();
    expect(geminiRadio.closest('label')).toHaveAttribute(
      'title',
      'API 키 미등록 — 아래 "키 변경" 으로 등록 후 사용 가능'
    );
  });

  it('라디오 변경 → /ai-default-provider POST 호출 + 헬스 재조회', async() => {
    aiHealthApi.getAiProviderHealth.mockResolvedValueOnce({
      ...HEALTH_FIXTURE,
      openaiKeyRegistered: true,
      geminiKeyRegistered: true
    });

    render(<AiProviderManagementPage />);

    await waitForLoaded();

    const geminiRadio = await screen.findByRole('radio', { name: /Gemini 사용/ });
    await act(async() => {
      fireEvent.click(geminiRadio);
    });

    await waitFor(() => {
      expect(ajax.apiPost).toHaveBeenCalledWith(
        '/api/v1/admin/system-config/ai-default-provider',
        { providerId: 'gemini' }
      );
    });
    await waitFor(() => {
      // 초기 1회 + 변경 후 1회 = 최소 2회
      expect(aiHealthApi.getAiProviderHealth.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('사용 통계 카드 (오늘 / 이번 주 / 이번 달 / 성공률) 가 모두 렌더링된다', async() => {
    render(<AiProviderManagementPage />);

    await waitForLoaded();

    expect(await screen.findByText('오늘 호출 수')).toBeInTheDocument();
    expect(screen.getByText('이번 주 호출 수')).toBeInTheDocument();
    expect(screen.getByText('이번 달 호출 수')).toBeInTheDocument();
    expect(screen.getByText('성공률')).toBeInTheDocument();
    // 값 노출 (포맷팅)
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('96.5%')).toBeInTheDocument();
  });

  it('호출 로그 테이블에 2건 행 + 페이징 정보가 노출된다', async() => {
    render(<AiProviderManagementPage />);

    await waitForLoaded();

    const table = await screen.findByRole('table');
    const tbody = table.querySelector('tbody');
    const rows = within(tbody).getAllByRole('row');
    expect(rows.length).toBe(2);

    expect(within(rows[0]).getByText('wellness')).toBeInTheDocument();
    expect(within(rows[1]).getByText('healing')).toBeInTheDocument();
    expect(screen.getByText('1 / 1 페이지')).toBeInTheDocument();
  });
});
