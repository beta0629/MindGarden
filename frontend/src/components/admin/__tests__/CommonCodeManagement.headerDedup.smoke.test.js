/**
 * CommonCodeManagement — G-14 P2 header dedup 스모크 테스트.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

const PAGE_TITLE = '공통 코드 관리';
const PAGE_SUBTITLE = '시스템 공통 코드를 그룹별로 관리합니다.';

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
        'admin:commonCode.ui.pageTitle': PAGE_TITLE,
        'admin:commonCode.ui.headerSubtitle': PAGE_SUBTITLE,
        'admin:commonCode.ui.groupListTitle': '코드 그룹',
        'admin:commonCode.ui.searchPlaceholder': '검색'
      };
      return map[key] ?? key;
    }
  })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { role: 'ADMIN' } })
}));

jest.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => [jest.fn(), () => null]
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn(() => Promise.resolve([])),
  createCommonCode: jest.fn(),
  updateCommonCode: jest.fn(),
  deleteCommonCode: jest.fn(),
  toggleCommonCodeStatus: jest.fn(),
  getCodeGroups: jest.fn(() => Promise.resolve([])),
  getLegacyCodeGroupsList: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../../utils/codeHelper', () => ({
  loadCodeGroupMetadata: jest.fn(() => Promise.resolve()),
  getCodeGroupKoreanNameSync: jest.fn((group) => group),
  clearCodeGroupCache: jest.fn()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), error: jest.fn() }
}));

jest.mock('../ClientComprehensiveManagement/molecules/SavedViewControls', () => ({
  __esModule: true,
  default: () => <div data-testid="saved-view-controls" />
}));

jest.mock('../../../hooks/useSavedViewPreference', () => ({
  useSavedViewPreference: () => ({
    savedView: {
      viewMode: 'list',
      sort: {},
      density: 'comfortable',
      filters: {
        searchTerm: '',
        categoryFilter: 'all',
        selectedGroup: null
      }
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

jest.mock('../../common/CustomSelect', () => ({
  __esModule: true,
  default: () => <select data-testid="custom-select" />
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children }) => <button type="button">{children}</button>
}));

import CommonCodeManagement from '../CommonCodeManagement';

describe('CommonCodeManagement (G-14 P2 header dedup)', () => {
  test('ACL title SSOT 유지, ContentHeader title={null} prop 주입', () => {
    render(<CommonCodeManagement />);

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', PAGE_TITLE);

    const header = screen.getByTestId('content-header');
    expect(header).toHaveAttribute('data-has-title', 'false');
    expect(screen.queryByRole('heading', { name: PAGE_TITLE })).not.toBeInTheDocument();
    expect(screen.getByText(PAGE_SUBTITLE)).toBeInTheDocument();
  });
});
