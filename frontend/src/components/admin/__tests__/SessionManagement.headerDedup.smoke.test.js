/**
 * SessionManagement — G-14 P2 header dedup 스모크 테스트.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const PAGE_TITLE = '회기 관리';
const PAGE_SUBTITLE = '회기·매핑 현황을 관리합니다.';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title ?? ''}>
      {children}
    </div>
  )
}));

jest.mock('../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle }) => (
    <header data-testid="content-header" data-has-title={String(Boolean(title))}>
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  )
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'admin:session.pageTitle': PAGE_TITLE,
        'admin:session.subtitle': PAGE_SUBTITLE,
        'admin:session.ariaContent': '회기 관리 본문',
        'common:state.dataLoading': '데이터 로딩 중'
      };
      return map[key] ?? key;
    }
  })
}));

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  apiPost: jest.fn(),
  apiPut: jest.fn()
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../ClientComprehensiveManagement/molecules/SavedViewControls', () => ({
  __esModule: true,
  default: () => <div data-testid="saved-view-controls" />
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children }) => <button type="button">{children}</button>
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
  ProfileCard: () => null,
  StatCard: ({ title }) => <div data-testid="stat-card">{title}</div>
}));

jest.mock('../../../hooks/useSavedViewPreference', () => ({
  useSavedViewPreference: () => ({
    savedView: {
      viewMode: 'list',
      filters: {},
      sort: {},
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

jest.mock('../../../hooks/useViewModePreference', () => ({
  buildViewModeStorageKey: jest.fn(),
  resolveViewModeStorageScope: jest.fn(),
  useViewModePreference: () => ({
    viewMode: 'list',
    setViewMode: jest.fn()
  })
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

import SessionManagement from '../SessionManagement';

describe('SessionManagement (G-14 P2 header dedup)', () => {
  test('ContentHeader title SSOT, ACL title 생략, 부제 유지', async() => {
    render(<SessionManagement />);

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');

    const header = screen.getByTestId('content-header');
    expect(header).toHaveAttribute('data-has-title', 'true');
    expect(screen.getByRole('heading', { name: PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(PAGE_SUBTITLE)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('content-area')).toBeInTheDocument();
    });
  });
});
