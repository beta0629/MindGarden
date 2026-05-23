/**
 * SystemConfigManagement — AI 프로바이더 라디오 헬스 가드 통합 테스트.
 *
 * 트랙 B PR-3 (2026-05-23):
 * - 마운트 시 GET /api/v1/admin/ai/health 호출
 * - openaiKeyRegistered=true / geminiKeyRegistered=false 상태에서
 *   - OpenAI 라디오 enable
 *   - Gemini 라디오 disabled + tooltip "API 키 미등록 — 시스템 설정에서 등록 후 사용 가능"
 *
 * @see docs/standards/AI_SSOT_USAGE_GUIDE.md §6
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SystemConfigManagement from '../SystemConfigManagement';
import * as ajax from '../../../utils/ajax';
import * as aiHealthApi from '../../../api/admin/aiHealthApi';

// 외부 의존성 mock — 컴포넌트 내부 로직(라디오 가드)에 집중한다.
jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

jest.mock('../../../api/admin/aiHealthApi', () => ({
  __esModule: true,
  getAiProviderHealth: jest.fn(),
  AI_HEALTH_ENDPOINTS: { HEALTH: '/api/v1/admin/ai/health' },
  default: {
    getAiProviderHealth: jest.fn(),
    AI_HEALTH_ENDPOINTS: { HEALTH: '/api/v1/admin/ai/health' }
  }
}));

// 매 render 마다 새 객체를 반환하면 useEffect dep 가 흔들려 무한 루프가 발생하므로
// 동일 참조의 user 객체를 module scope 에서 한 번만 만든다.
jest.mock('../../../contexts/SessionContext', () => {
  const STABLE_USER = { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-pr3-fe' };
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

// 무거운 레이아웃·로딩 컴포넌트는 자식 노출만 보장
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
  default: ({ children, onClick, disabled, title, ...rest }) => (
    // eslint-disable-next-line react/button-has-type
    <button type="button" onClick={onClick} disabled={disabled} title={title} {...rest}>
      {children}
    </button>
  )
}));

jest.mock('../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../modelPricing', () => ({
  __esModule: true,
  getModelPricingLabel: () => '',
  getModelOptionSuffix: () => '',
  PRICING_URLS: { openai: '#', gemini: '#' }
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

const HEALTH_FIXTURE_OPENAI_ONLY = {
  tenantId: 'tenant-pr3-fe',
  activeProvider: 'openai',
  openaiKeyRegistered: true,
  geminiKeyRegistered: false,
  checkedAt: '2026-05-23T12:00:00Z'
};

/** 컴포넌트의 무거운 loadConfigs() 호출을 안전 default 응답으로 채워둔다. */
const installAjaxDefaults = () => {
  ajax.apiGet.mockImplementation((url) => {
    if (url === '/api/v1/admin/system-config/openai') {
      return Promise.resolve({ success: true, apiKey: 'sk-test', apiUrl: '', model: 'gpt-4o-mini' });
    }
    if (url === '/api/v1/admin/system-config/ai-default-provider') {
      return Promise.resolve({ success: true, providerId: 'openai' });
    }
    return Promise.resolve({ success: true, configValue: '' });
  });
  ajax.apiPost.mockResolvedValue({ success: true, models: [] });
};

describe('SystemConfigManagement — AI provider 라디오 헬스 가드', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installAjaxDefaults();
  });

  it('마운트 시 GET /api/v1/admin/ai/health 가 호출된다', async() => {
    aiHealthApi.getAiProviderHealth.mockResolvedValueOnce(HEALTH_FIXTURE_OPENAI_ONLY);

    render(<SystemConfigManagement />);

    await waitFor(() => {
      expect(aiHealthApi.getAiProviderHealth).toHaveBeenCalledTimes(1);
    });
  });

  it('등록된 provider(OpenAI) 라디오는 enable, 미등록(Gemini) 라디오는 disable + tooltip 노출', async() => {
    aiHealthApi.getAiProviderHealth.mockResolvedValueOnce(HEALTH_FIXTURE_OPENAI_ONLY);

    render(<SystemConfigManagement />);

    // loadConfigs 비동기 흐름이 모두 끝나 loading 상태가 풀린 뒤 라디오가 렌더링된다.
    await waitFor(
      () => {
        expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    await waitFor(() => {
      expect(aiHealthApi.getAiProviderHealth).toHaveBeenCalled();
    });

    const radios = await screen.findAllByRole(
      'radio',
      { name: /OpenAI|Gemini|Claude|Replicate/ },
      { timeout: 5000 }
    );
    const openaiRadio = radios.find((r) => r.value === 'openai');
    const geminiRadio = radios.find((r) => r.value === 'gemini');

    expect(openaiRadio).toBeDefined();
    expect(geminiRadio).toBeDefined();

    await waitFor(() => {
      expect(openaiRadio).not.toBeDisabled();
      expect(geminiRadio).toBeDisabled();
    });

    // tooltip 은 라벨 요소의 title 속성으로 표시됨
    const geminiLabel = geminiRadio.closest('label');
    expect(geminiLabel).not.toBeNull();
    expect(geminiLabel.getAttribute('title')).toBe('API 키 미등록 — 시스템 설정에서 등록 후 사용 가능');
  });

  it('헬스체크 실패 시 라디오는 가드(openai/gemini)에 의해 모두 disable 상태로 fallback', async() => {
    aiHealthApi.getAiProviderHealth.mockRejectedValueOnce(new Error('헬스체크 네트워크 오류'));

    render(<SystemConfigManagement />);

    await waitFor(
      () => {
        expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    await waitFor(() => {
      expect(aiHealthApi.getAiProviderHealth).toHaveBeenCalled();
    });

    const radios = await screen.findAllByRole(
      'radio',
      { name: /OpenAI|Gemini/ },
      { timeout: 5000 }
    );
    const openaiRadio = radios.find((r) => r.value === 'openai');
    const geminiRadio = radios.find((r) => r.value === 'gemini');

    await waitFor(() => {
      expect(openaiRadio).toBeDisabled();
      expect(geminiRadio).toBeDisabled();
    });
  });
});
