/**
 * SessionManagement loadData — API 래퍼 정규화(asArray) 회귀 테스트
 *
 * 원인: apiGet unwrap 후 `{ mappings: [] }` 객체가 state에 들어가 mappings.filter TypeError
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const mockApiGet = jest.fn();

jest.mock('react-i18next', () => {
  const stableT = (key) => {
    const map = {
      'admin:session.pageTitle': '회기 관리',
      'admin:session.subtitle': '회기 추가·조회',
      'admin:session.ariaContent': '회기 관리 본문',
      'admin:session.stat.totalClients': '전체 내담자',
      'admin:session.stat.activeMappings': '활성 매칭',
      'admin:session.stat.usedSessions': '사용 회기',
      'admin:session.stat.completionRate': '완료율',
      'admin:session.tab.quick': '빠른 추가',
      'admin:session.tab.search': '검색',
      'admin:session.tab.mapping': '매핑별',
      'admin:labels.active': '활성',
      'admin:labels.inactive': '비활성',
      'common:state.dataLoading': '불러오는 중'
    };
    return map[key] ?? key;
  };
  return {
    useTranslation: () => ({ t: stableT }),
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: (...args) => mockApiGet(...args),
  apiPost: jest.fn(),
  apiPut: jest.fn()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

jest.mock('../../../hooks/useSavedViewPreference', () => ({
  __esModule: true,
  useSavedViewPreference: () => ({
    savedView: { viewMode: 'card', filters: {}, sort: {}, density: 'comfortable' },
    views: [],
    activeViewId: 'default',
    saveNamedView: jest.fn(),
    loadNamedView: jest.fn(),
    resetToDefaultView: jest.fn(),
    deleteNamedView: jest.fn()
  })
}));

jest.mock('../../../hooks/useViewModePreference', () => ({
  __esModule: true,
  buildViewModeStorageKey: jest.fn(() => 'session-view-mode'),
  resolveViewModeStorageScope: jest.fn(() => ({ tenantId: 't1', userId: 'u1' })),
  useViewModePreference: () => ({
    viewMode: 'card',
    setViewMode: jest.fn()
  })
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title}>{children}</div>
  )
}));

jest.mock('../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title }) => <h1>{title}</h1>
}));

jest.mock('../ClientComprehensiveManagement/molecules/SavedViewControls', () => ({
  __esModule: true,
  default: () => <div data-testid="saved-view-controls" />
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button', className }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>{children}</button>
  )
}));

jest.mock('../mapping/SessionExtensionModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../ui/Card/index', () => ({
  __esModule: true,
  ProfileCard: () => null
}));

import SessionManagement from '../SessionManagement';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

const API_ADMIN_CLIENTS_WITH_MAPPING_INFO = '/api/v1/admin/clients/with-mapping-info';
const API_ADMIN_SESSION_EXTENSIONS_REQUESTS = '/api/v1/admin/session-extensions/requests';
const API_COMMON_CODES_GROUPS_MAPPING_STATUS = '/api/v1/common-codes/groups/MAPPING_STATUS';

const WRAPPED_CLIENTS = { clients: [{ id: 1, name: '내담자A' }] };
const WRAPPED_CONSULTANTS = { consultants: [{ id: 2, name: '상담사B' }] };
const WRAPPED_MAPPINGS = {
  mappings: [
    { id: 10, status: 'ACTIVE', usedSessions: 3, clientName: '내담자A', consultantName: '상담사B' }
  ],
  count: 1
};
const WRAPPED_REQUESTS = { requests: [], count: 0 };

describe('SessionManagement loadData — asArray 정규화', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiGet.mockImplementation((url) => {
      if (url === API_ADMIN_CLIENTS_WITH_MAPPING_INFO) {
        return Promise.resolve(WRAPPED_CLIENTS);
      }
      if (url === API_ENDPOINTS.ADMIN.CONSULTANTS.LIST) {
        return Promise.resolve(WRAPPED_CONSULTANTS);
      }
      if (url === API_ENDPOINTS.ADMIN.MAPPINGS.LIST) {
        return Promise.resolve(WRAPPED_MAPPINGS);
      }
      if (url === API_ADMIN_SESSION_EXTENSIONS_REQUESTS) {
        return Promise.resolve(WRAPPED_REQUESTS);
      }
      if (url === API_COMMON_CODES_GROUPS_MAPPING_STATUS) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });
  });

  it('래핑된 mappings 페이로드에서 TypeError 없이 mount·통계 렌더', async () => {
    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '회기 관리');
    expect(screen.getByText('전체 내담자')).toBeInTheDocument();
    expect(screen.getByText('활성 매칭')).toBeInTheDocument();
    expect(screen.getByText('사용 회기')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
  });

  it('apiGet 4종 호출이 기대 엔드포인트로 이루어진다', async () => {
    render(<SessionManagement />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(API_ADMIN_CLIENTS_WITH_MAPPING_INFO);
    });

    expect(mockApiGet).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.CONSULTANTS.LIST);
    expect(mockApiGet).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.MAPPINGS.LIST);
    expect(mockApiGet).toHaveBeenCalledWith(API_ADMIN_SESSION_EXTENSIONS_REQUESTS);
  });
});
