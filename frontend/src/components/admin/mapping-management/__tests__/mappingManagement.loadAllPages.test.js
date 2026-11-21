/**
 * MappingManagementPage — 목록은 첫 페이지(size 20)가 아니라
 * adminMappingsListGetAll 로 전체 페이지를 받고, 검색도 그 전체 배열을 대상으로 한다.
 *
 * @author CoreSolution
 * @since 2026-11-21
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const BEYOND_PAGE_CLIENT = '페이지밖내담자';
const UNPAID_CLIENT = '소프트미입금내담자';
const FULL_MAPPING_COUNT = 21;
const TRUNCATED_MAPPING_COUNT = 20;

jest.mock('react-i18next', () => {
  const stableT = (key, fallback) => fallback || key;
  return {
    useTranslation: () => ({
      t: stableT,
      i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
    }),
    Trans: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: () => {} }
  };
});

const mockStandardizedApiGet = jest.fn();

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockStandardizedApiGet(...args),
    post: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

jest.mock('../../../../hooks/useConfirm', () => ({
  useConfirm: () => [jest.fn(), () => null]
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 1, name: 'Admin', userId: 'admin1' } })
}));

jest.mock('../../../../hooks/useViewModePreference', () => ({
  buildViewModeStorageKey: jest.fn(() => 'mapping-view-mode-key'),
  resolveViewModeStorageScope: jest.fn(() => ({ tenantId: 't1', userId: 'u1' })),
  useViewModePreference: () => ({
    viewMode: 'card',
    setViewMode: jest.fn()
  })
}));

jest.mock('../../../../hooks/useSavedViewPreference', () => ({
  useSavedViewPreference: () => ({
    savedView: {
      viewMode: 'card',
      filters: {},
      sort: 'id_desc',
      density: 'comfortable'
    },
    setSavedView: jest.fn(),
    views: [],
    activeViewId: null,
    saveNamedView: jest.fn(),
    loadNamedView: jest.fn(),
    resetToDefaultView: jest.fn(),
    deleteNamedView: jest.fn()
  })
}));

jest.mock('../../ClientComprehensiveManagement/molecules/SavedViewControls', () => () => (
  <div data-testid="saved-view-controls" />
));

jest.mock('../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children, ariaLabel, className }) => (
    <main data-testid="content-area" aria-label={ariaLabel} className={className}>
      {children}
    </main>
  )
}));

jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle, titleId, actions }) => (
    <header data-testid="content-header">
      <h1 id={titleId}>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions ? <div data-testid="content-header-actions">{actions}</div> : null}
    </header>
  )
}));

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-loading" />
}));

jest.mock('../organisms/MappingKpiSection', () => () => <div data-testid="mapping-kpi-section" />);

jest.mock('../organisms/MappingSearchSection', () => ({
  __esModule: true,
  default: ({ searchValue, onSearchChange }) => (
    <input
      data-testid="mapping-search-input"
      value={searchValue}
      onChange={(event) => onSearchChange(event.target.value)}
    />
  )
}));

jest.mock('../organisms/MappingListBlock', () => ({
  __esModule: true,
  default: ({ mappings = [] }) => (
    <div data-testid="mapping-list-block">
      <div data-testid="mapping-list-count">{mappings.length}</div>
      <ul>
        {mappings.map((mapping) => (
          <li key={mapping.id} data-testid={`mapping-row-${mapping.id}`}>
            {mapping.clientName} {mapping.consultantName}
          </li>
        ))}
      </ul>
    </div>
  )
}));

jest.mock('../integrated-schedule/molecules/MappingScheduleSidePeekContent', () => () => null);
jest.mock('../../../common', () => ({
  SidePeekShell: ({ children }) => <div data-testid="side-peek-shell">{children}</div>
}));
jest.mock('../../../common/ActionBar', () => ({ children }) => <div>{children}</div>);
jest.mock('../../../common/ActionBarButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}));
jest.mock('../../MappingCreationModal', () => () => null);
jest.mock('../../mapping/ConsultantTransferModal', () => () => null);
jest.mock('../../mapping/ConsultantTransferHistory', () => () => null);
jest.mock('../../mapping/PartialRefundModal', () => () => null);
jest.mock('../../PaymentConfirmationModal', () => () => null);
jest.mock('../../MappingEditModal', () => () => null);
jest.mock('../../../common/modals/UnifiedModal', () => () => null);
jest.mock('../PendingPackageEditModal', () => () => null);
jest.mock('../molecules/MappingCancelModal', () => () => null);

jest.mock('../../../../api/adminListFetch', () => {
  const actual = jest.requireActual('../../../../api/adminListFetch');
  return {
    ...actual,
    adminMappingsListGet: jest.fn(),
    adminMappingsListGetAll: jest.fn(),
    adminPendingPaymentMappingsGetAll: jest.fn()
  };
});

const {
  adminMappingsListGet,
  adminMappingsListGetAll,
  adminPendingPaymentMappingsGetAll
} = require('../../../../api/adminListFetch');

const MappingManagementPage = require('../pages/MappingManagementPage').default;

function buildMappings(count, lastClientName) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    clientId: index + 1,
    consultantId: index + 1,
    clientName: index === count - 1 ? lastClientName : `내담자${index + 1}`,
    consultantName: `상담사${index + 1}`,
    packageName: `패키지${index + 1}`,
    status: 'ACTIVE'
  }));
}

describe('mappingManagement.loadAllPages', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    mockStandardizedApiGet.mockReset();
    mockStandardizedApiGet.mockImplementation((url) => {
      if (url === '/api/v1/common-codes/groups/MAPPING_STATUS') {
        return Promise.resolve([]);
      }
      return Promise.resolve({ mappings: [], count: 0 });
    });
    adminMappingsListGet.mockReset();
    adminMappingsListGet.mockResolvedValue({
      mappings: buildMappings(TRUNCATED_MAPPING_COUNT, '첫페이지끝내담자'),
      count: TRUNCATED_MAPPING_COUNT
    });
    adminMappingsListGetAll.mockReset();
    adminMappingsListGetAll.mockResolvedValue({
      mappings: buildMappings(FULL_MAPPING_COUNT, BEYOND_PAGE_CLIENT),
      count: FULL_MAPPING_COUNT
    });
    adminPendingPaymentMappingsGetAll.mockReset();
    adminPendingPaymentMappingsGetAll.mockResolvedValue({
      mappings: [],
      count: 0
    });
  });

  test('전체 페이지(21건)를 로드하고 Get 단일 페이지는 호출하지 않는다', async() => {
    render(<MappingManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mapping-list-count')).toHaveTextContent(String(FULL_MAPPING_COUNT));
    });
    expect(screen.getByText(new RegExp(BEYOND_PAGE_CLIENT))).toBeInTheDocument();
    expect(adminMappingsListGetAll).toHaveBeenCalled();
    expect(adminMappingsListGet).not.toHaveBeenCalled();
  });

  test('검색이 20건을 넘는 전체 목록에서 페이지 밖 행을 찾는다', async() => {
    render(<MappingManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mapping-list-count')).toHaveTextContent(String(FULL_MAPPING_COUNT));
    });

    fireEvent.change(screen.getByTestId('mapping-search-input'), {
      target: { value: BEYOND_PAGE_CLIENT }
    });

    await waitFor(() => {
      expect(screen.getByTestId('mapping-list-count')).toHaveTextContent('1');
    });
    expect(screen.getByText(new RegExp(BEYOND_PAGE_CLIENT))).toBeInTheDocument();
    expect(screen.queryByText('내담자1')).not.toBeInTheDocument();
  });

  test('소프트 미입금 행을 합치고 중복 id 는 한 행만 남긴다', async() => {
    const fullList = buildMappings(FULL_MAPPING_COUNT, BEYOND_PAGE_CLIENT);
    const duplicateOfLast = {
      ...fullList[FULL_MAPPING_COUNT - 1],
      status: 'PENDING_PAYMENT'
    };
    const unpaidOnly = {
      id: 999,
      clientId: 999,
      consultantId: 999,
      clientName: UNPAID_CLIENT,
      consultantName: '미입금상담사',
      packageName: '미입금패키지',
      status: 'PENDING_PAYMENT'
    };
    adminPendingPaymentMappingsGetAll.mockResolvedValue({
      mappings: [duplicateOfLast, unpaidOnly],
      count: 2
    });

    render(<MappingManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mapping-list-count')).toHaveTextContent(
        String(FULL_MAPPING_COUNT + 1)
      );
    });
    expect(screen.getAllByTestId(`mapping-row-${FULL_MAPPING_COUNT}`)).toHaveLength(1);
    expect(screen.getByTestId('mapping-row-999')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(UNPAID_CLIENT))).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('mapping-search-input'), {
      target: { value: UNPAID_CLIENT }
    });

    await waitFor(() => {
      expect(screen.getByTestId('mapping-list-count')).toHaveTextContent('1');
    });
    expect(screen.getByText(new RegExp(UNPAID_CLIENT))).toBeInTheDocument();
  });
});
