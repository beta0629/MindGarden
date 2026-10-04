/**
 * MappingManagementPage — 부분 환불 액션은 관리자에게만 노출(사무원·상담사 숨김).
 *
 * @author Core Solution
 * @since 2026-10-04
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { USER_ROLES } from '../../../../constants/roles';

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
let mockSessionUser = null;

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockStandardizedApiGet(...args),
    post: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() }
}));

jest.mock('../../../../hooks/useConfirm', () => ({
  useConfirm: () => [jest.fn(), () => null]
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: mockSessionUser })
}));

jest.mock('../../../../hooks/useViewModePreference', () => ({
  buildViewModeStorageKey: jest.fn(() => 'mapping-view-mode-key'),
  resolveViewModeStorageScope: jest.fn(() => ({ tenantId: 't1', userId: 'u1' })),
  useViewModePreference: () => ({ viewMode: 'card', setViewMode: jest.fn() })
}));

jest.mock('../../../../hooks/useSavedViewPreference', () => ({
  useSavedViewPreference: () => ({
    savedView: { viewMode: 'card', filters: {}, sort: 'id_desc', density: 'comfortable' },
    setSavedView: jest.fn(),
    views: [],
    activeViewId: null,
    saveNamedView: jest.fn(),
    loadNamedView: jest.fn(),
    resetToDefaultView: jest.fn(),
    deleteNamedView: jest.fn()
  })
}));

jest.mock('../../ClientComprehensiveManagement/molecules/SavedViewControls', () => () => null);
jest.mock('../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <main>{children}</main>
}));
jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title }) => <header>{title}</header>
}));
jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-loading" />
}));
jest.mock('../organisms/MappingKpiSection', () => () => null);
jest.mock('../organisms/MappingSearchSection', () => () => null);
jest.mock('../organisms/MappingListBlock', () => ({ onRefund }) => (
  <div data-testid="mapping-list-block" data-has-refund={String(typeof onRefund === 'function')} />
));
jest.mock('../integrated-schedule/molecules/MappingScheduleSidePeekContent', () => () => null);
jest.mock('../../../common', () => ({
  SidePeekShell: ({ children }) => <div>{children}</div>
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

const MAPPING_STATUS_URL = '/api/v1/common-codes/groups/MAPPING_STATUS';

const renderAs = async(role) => {
  mockSessionUser = { id: 1, name: 'tester', userId: 'tester', role };
  render(<MappingManagementPage />);
  return waitFor(() => screen.getByTestId('mapping-list-block'));
};

describe('mappingManagement.partialRefundRole', () => {
  beforeEach(() => {
    mockStandardizedApiGet.mockReset();
    mockStandardizedApiGet.mockImplementation((url) =>
      Promise.resolve(url === MAPPING_STATUS_URL ? [] : { mappings: [] }));
    window.scrollTo = jest.fn();
  });

  test('관리자 — 부분 환불 액션 전달', async() => {
    const block = await renderAs(USER_ROLES.ADMIN);
    expect(block).toHaveAttribute('data-has-refund', 'true');
  });

  test.each([USER_ROLES.STAFF, USER_ROLES.CONSULTANT])('%s — 부분 환불 액션 숨김', async(role) => {
    const block = await renderAs(role);
    expect(block).toHaveAttribute('data-has-refund', 'false');
  });
});
