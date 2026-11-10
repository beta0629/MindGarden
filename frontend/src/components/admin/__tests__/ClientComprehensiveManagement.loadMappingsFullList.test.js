/**
 * ClientComprehensiveManagement 배정 탭 — adminMappingsListGetAll 전체 목록.
 *
 * @author CoreSolution
 * @since 2026-11-10
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const MAPPING_TAB_LABEL = '배정';
const BEYOND_PAGE_CONSULTANT = '페이지밖배정';
const FULL_MAPPING_COUNT = 21;
const TRUNCATED_MAPPING_COUNT = 20;

jest.mock('react-i18next', () => {
  const labels = {
    'admin:client.tab.mapping': MAPPING_TAB_LABEL
  };
  const stableT = (key, fallbackOrOpts) => {
    if (labels[key]) {
      return labels[key];
    }
    if (typeof fallbackOrOpts === 'string') return fallbackOrOpts;
    if (fallbackOrOpts && typeof fallbackOrOpts === 'object' && fallbackOrOpts.defaultValue) {
      return fallbackOrOpts.defaultValue;
    }
    return key;
  };
  return {
    useTranslation: () => ({
      t: stableT,
      i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
    }),
    Trans: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: () => {} }
  };
});

jest.mock('../../../i18n', () => ({
  __esModule: true,
  default: {
    language: 'ko',
    t: (key) => key
  }
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid="admin-common-layout">{children}</div>
  )
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { totalMappings: 0 } })),
    post: jest.fn(() => Promise.resolve({})),
    put: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn(() => Promise.resolve([
    { codeValue: 'ACTIVE', codeLabel: '활성' }
  ]))
}));

jest.mock('../../../utils/consultantHelper', () => ({
  getAllClientsWithStats: jest.fn()
}));

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn(() => Promise.resolve({ consultants: [] })),
  apiDelete: jest.fn(() => Promise.resolve({}))
}));

jest.mock('../../../utils/notification', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  showWarning: jest.fn()
}));

jest.mock('../../../api/adminListFetch', () => {
  const actual = jest.requireActual('../../../api/adminListFetch');
  return {
    ...actual,
    adminMappingsListGet: jest.fn(),
    adminMappingsListGetAll: jest.fn()
  };
});

jest.mock('../ClientComprehensiveManagement/ClientModal', () => () => null);
jest.mock('../PasswordResetModal', () => () => null);
jest.mock('../ClientComprehensiveManagement/ClientOverviewTab', () => () => null);
jest.mock('../ClientComprehensiveManagement/ClientConsultationTab', () => () => null);
jest.mock('../ClientComprehensiveManagement/ClientStatisticsTab', () => () => null);

const { getAllClientsWithStats } = require('../../../utils/consultantHelper');
const {
  adminMappingsListGet,
  adminMappingsListGetAll
} = require('../../../api/adminListFetch');
const ClientComprehensiveManagement = require('../ClientComprehensiveManagement').default;

function buildMappings(count, lastName) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    clientId: 1,
    consultantId: index + 1,
    consultantName: index === count - 1 ? lastName : `상담사${index + 1}`,
    status: 'ACTIVE'
  }));
}

describe('ClientComprehensiveManagement loadMappings full list', () => {
  beforeEach(() => {
    getAllClientsWithStats.mockReset();
    getAllClientsWithStats.mockResolvedValue([{
      client: {
        id: 1,
        name: '내담자',
        email: 'c@example.com',
        status: 'ACTIVE'
      },
      currentConsultants: 0,
      totalConsultants: 0,
      statistics: {}
    }]);
    adminMappingsListGet.mockReset();
    adminMappingsListGet.mockResolvedValue({
      mappings: buildMappings(TRUNCATED_MAPPING_COUNT, '첫페이지끝'),
      count: TRUNCATED_MAPPING_COUNT
    });
    adminMappingsListGetAll.mockReset();
    adminMappingsListGetAll.mockResolvedValue({
      mappings: buildMappings(FULL_MAPPING_COUNT, BEYOND_PAGE_CONSULTANT),
      count: FULL_MAPPING_COUNT
    });
  });

  test('배정 탭은 GetAll 21건을 보여주고 단일 페이지 Get 은 호출하지 않는다', async() => {
    render(<ClientComprehensiveManagement />);

    const mappingTab = await screen.findByRole('button', { name: MAPPING_TAB_LABEL });
    fireEvent.click(mappingTab);

    expect(await screen.findByText(`총 ${FULL_MAPPING_COUNT}건의 배정`)).toBeInTheDocument();
    expect(screen.getByText(BEYOND_PAGE_CONSULTANT)).toBeInTheDocument();
    await waitFor(() => {
      expect(adminMappingsListGetAll).toHaveBeenCalled();
    });
    expect(adminMappingsListGet).not.toHaveBeenCalled();
  });
});
