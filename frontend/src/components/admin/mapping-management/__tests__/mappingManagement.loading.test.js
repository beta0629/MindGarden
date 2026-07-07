/**
 * MappingManagementPage — 초기 로딩 SSOT 스모크 테스트.
 *
 * ContentArea + ContentHeader 유지, 본문만 spinner(primary/md) 표시.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

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
  default: ({ text, variant, tone, size, type }) => (
    <div
      role="status"
      data-testid="unified-loading"
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      data-type={type}
    >
      {text}
    </div>
  )
}));

jest.mock('../organisms/MappingKpiSection', () => () => <div data-testid="mapping-kpi-section" />);
jest.mock('../organisms/MappingSearchSection', () => () => <div data-testid="mapping-search-section" />);
jest.mock('../organisms/MappingListBlock', () => () => <div data-testid="mapping-list-block" />);
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

import MappingManagementPage from '../pages/MappingManagementPage';

const PAGE_TITLE = 'admin:mapping.page.title';
const PAGE_SUBTITLE = 'admin:mapping.page.subtitle';
const LOADING_TEXT = 'admin:mapping.page.loadingText';
const EMPTY_MAPPINGS = { mappings: [] };

describe('mappingManagement.loading', () => {
  beforeEach(() => {
    mockStandardizedApiGet.mockReset();
    mockStandardizedApiGet.mockImplementation((url) => {
      if (url === '/api/v1/common-codes/groups/MAPPING_STATUS') {
        return Promise.resolve([]);
      }
      return new Promise(() => {});
    });
    window.scrollTo = jest.fn();
  });

  test('초기 fetch 중 ContentArea·ContentHeader 유지 + 본문 spinner SSOT', async() => {
    render(<MappingManagementPage />);

    expect(screen.getByTestId('content-area')).toBeInTheDocument();
    expect(screen.getByTestId('content-header')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId('content-header-actions')).toBeInTheDocument();

    const loadingEl = screen.getByTestId('unified-loading');
    expect(loadingEl).toHaveAttribute('data-variant', 'spinner');
    expect(loadingEl).toHaveAttribute('data-tone', 'primary');
    expect(loadingEl).toHaveAttribute('data-size', 'md');
    expect(loadingEl).toHaveAttribute('data-type', 'inline');
    expect(loadingEl).toHaveTextContent(LOADING_TEXT);

    expect(screen.queryByTestId('mapping-search-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mapping-kpi-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mapping-list-block')).not.toBeInTheDocument();
  });

  test('로딩 완료 후 본문 섹션 렌더', async() => {
    mockStandardizedApiGet.mockImplementation((url) => {
      if (url === '/api/v1/common-codes/groups/MAPPING_STATUS') {
        return Promise.resolve([]);
      }
      return Promise.resolve(EMPTY_MAPPINGS);
    });

    render(<MappingManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mapping-search-section')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mapping-kpi-section')).toBeInTheDocument();
    expect(screen.getByTestId('mapping-list-block')).toBeInTheDocument();
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
  });

  test('fetch resolve 후 loading → loaded 전환', async() => {
    let resolveMappings;
    mockStandardizedApiGet.mockImplementation((url) => {
      if (url === '/api/v1/common-codes/groups/MAPPING_STATUS') {
        return Promise.resolve([]);
      }
      return new Promise((resolve) => {
        resolveMappings = () => resolve(EMPTY_MAPPINGS);
      });
    });

    render(<MappingManagementPage />);

    expect(screen.getByTestId('unified-loading')).toBeInTheDocument();

    await act(async() => {
      resolveMappings();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('mapping-list-block')).toBeInTheDocument();
  });
});
