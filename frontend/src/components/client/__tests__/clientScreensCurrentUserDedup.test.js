/**
 * ClientPaymentHistory / ClientSessionManagement — useSession().user 직접 사용 dedup 회귀.
 *
 * <p>B6 묶음 B (2026-06-12): /api/v1/auth/current-user 직접 호출을 제거하고 SessionContext 의 user 를
 * 사용하도록 전환했다. 본 테스트는 두 화면이 마운트 시 current-user 엔드포인트로 추가 요청을 보내지
 * 않음을 단언한다.</p>
 *
 * <p>의도적 brittleness 금지 — mock 은 user/hasCheckedSession 만 제공하고, ajax/StandardizedApi 의
 * /current-user 호출 여부만 검증한다.</p>
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/client/payment-history' })
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { t: (key) => key }
  })
}));

jest.mock('../../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => key }
}));

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn(() => Promise.resolve([])),
  default: {}
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve([]))
  }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../../../utils/dashboardUtils', () => ({
  redirectToDynamicDashboard: jest.fn()
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    getUser: jest.fn(),
    getCurrentTenantRole: jest.fn(() => null)
  }
}));

jest.mock('../../../utils/apiResponseNormalize', () => ({
  isApiGetNullFailure: jest.fn(() => false),
  normalizeMappingsListPayload: jest.fn(() => []),
  normalizeApiListPayload: jest.fn(() => []),
  normalizeApiObjectPayload: jest.fn(() => ({})),
  normalizeScheduleListPayload: jest.fn(() => [])
}));

jest.mock('../../../utils/clientSessionTotals', () => ({
  calculateClientSessionTotalsFromMappings: () => ({
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0
  })
}));

jest.mock('../../../utils/session', () => ({
  getDashboardPath: jest.fn(() => '/client/dashboard')
}));

jest.mock('../../layout/AdminCommonLayout', () => {
  const ReactInner = require('react');
  return ({ children }) => ReactInner.createElement('div', { 'data-testid': 'admin-layout' }, children);
});
jest.mock('../../dashboard-v2/content/ContentArea', () => {
  const ReactInner = require('react');
  return ({ children }) => ReactInner.createElement('div', null, children);
});
jest.mock('../../dashboard-v2/content/ContentHeader', () => {
  const ReactInner = require('react');
  return () => ReactInner.createElement('div', null);
});
jest.mock('../../common/MGButton', () => {
  const ReactInner = require('react');
  return ({ children, ...props }) => ReactInner.createElement('button', props, children);
});
jest.mock('../../erp/common/erpMgButtonProps', () => ({
  buildErpMgButtonClassName: () => '',
  ERP_MG_BUTTON_LOADING_TEXT: 'loading'
}));
jest.mock('../../common/UnifiedLoading', () => {
  const ReactInner = require('react');
  return () => ReactInner.createElement('div', { 'data-testid': 'loading' });
});
jest.mock('../../../components/common/UnifiedLoading', () => {
  const ReactInner = require('react');
  return () => ReactInner.createElement('div', { 'data-testid': 'loading' });
});
jest.mock('../../../constants/mapping', () => ({
  isClientMappingPaymentSettled: () => false
}));

const mockUseSession = jest.fn();
jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

describe('B6 묶음 B — Client 화면 current-user 직접 호출 제거', () => {
  let apiGetMock;
  let standardizedApiGetMock;

  beforeEach(() => {
    jest.clearAllMocks();
    apiGetMock = require('../../../utils/ajax').apiGet;
    standardizedApiGetMock = require('../../../utils/standardizedApi').default.get;
    apiGetMock.mockResolvedValue([]);
    standardizedApiGetMock.mockResolvedValue([]);
  });

  it('ClientPaymentHistory: hasCheckedSession=true + Context user 사용 시 /auth/current-user 호출 없음', async() => {
    mockUseSession.mockReturnValue({
      user: { id: 42, role: 'CLIENT' },
      hasCheckedSession: true
    });

    const ClientPaymentHistory = require('../ClientPaymentHistory').default;
    render(<ClientPaymentHistory />);

    await waitFor(() => {
      expect(standardizedApiGetMock).toHaveBeenCalled();
    });

    standardizedApiGetMock.mock.calls.forEach(([endpoint]) => {
      expect(endpoint).not.toContain('/auth/current-user');
    });
    apiGetMock.mock.calls.forEach(([endpoint]) => {
      expect(endpoint).not.toContain('/auth/current-user');
    });
  });

  it('ClientPaymentHistory: hasCheckedSession=false 면 로드 자체를 보류한다', async() => {
    mockUseSession.mockReturnValue({
      user: null,
      hasCheckedSession: false
    });

    const ClientPaymentHistory = require('../ClientPaymentHistory').default;
    render(<ClientPaymentHistory />);

    // 잠시 대기 후에도 호출이 없어야 한다.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(standardizedApiGetMock).not.toHaveBeenCalled();
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('ClientSessionManagement: hasCheckedSession=true + Context user 사용 시 /auth/current-user 호출 없음', async() => {
    mockUseSession.mockReturnValue({
      user: { id: 99, role: 'CLIENT' },
      hasCheckedSession: true
    });

    const ClientSessionManagement = require('../ClientSessionManagement').default;
    render(<ClientSessionManagement />);

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalled();
    });

    apiGetMock.mock.calls.forEach(([endpoint]) => {
      expect(endpoint).not.toContain('/auth/current-user');
    });
  });
});
