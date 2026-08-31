/**
 * TenantCommonCodeManager — fetch storm guard (behavioral)
 *
 * Verifies initial load fetches tenant codes once per group and does not
 * re-fetch global codes in a useEffect loop.
 *
 * @author Core Solution
 * @since 2026-08-31
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';

const MOCK_GROUPS = [
  { groupName: 'ADDRESS_TYPE', koreanName: '주소유형' },
  { groupName: 'ROLE', koreanName: '역할' },
  { groupName: 'ALIMTALK_CONFIG', koreanName: '알림톡설정' }
];

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
    <header data-testid="content-header">
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  )
}));

jest.mock('../../common', () => ({
  SidePeekShell: ({ children, isOpen }) => (
    isOpen ? <div data-testid="side-peek-shell">{children}</div> : null
  )
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, type = 'button', disabled }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}));

jest.mock('../tenant-common-codes/organisms/TenantCommonCodeTable', () => ({
  __esModule: true,
  default: ({ codes, loading }) => (
    <div data-testid="tenant-common-code-table" data-loading={String(loading)}>
      {codes.length} rows
    </div>
  )
}));

jest.mock('../tenant-common-codes/molecules/TenantCommonCodeSidePeekContent', () => ({
  __esModule: true,
  default: () => <div data-testid="tenant-common-code-peek" />
}));

jest.mock('../tenant-common-codes/molecules/TenantCommonCodeFormModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('react-i18next', () => {
  const stableT = (key, fallbackOrOpts) => {
    if (typeof fallbackOrOpts === 'string') {
      return fallbackOrOpts;
    }
    if (fallbackOrOpts && typeof fallbackOrOpts.defaultValue === 'string') {
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

jest.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => [jest.fn().mockResolvedValue(false), () => null]
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), error: jest.fn(), success: jest.fn() }
}));

jest.mock('../../../utils/tenantCommonCodeApi', () => ({
  __esModule: true,
  getTenantCodeGroups: jest.fn(),
  getTenantCodesByGroup: jest.fn(),
  createTenantCode: jest.fn(),
  updateTenantCode: jest.fn(),
  deleteTenantCode: jest.fn(),
  toggleTenantCodeActive: jest.fn()
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getCommonCodes: jest.fn()
}));

jest.mock('../../../utils/codeHelper', () => ({
  __esModule: true,
  loadCodeGroupMetadata: jest.fn(),
  getCodeGroupKoreanNameSync: jest.fn((group) => group)
}));

import * as tenantCommonCodeApi from '../../../utils/tenantCommonCodeApi';
import * as commonCodeApi from '../../../utils/commonCodeApi';
import * as codeHelper from '../../../utils/codeHelper';
import TenantCommonCodeManager from '../TenantCommonCodeManager';

function rebindMocks() {
  codeHelper.loadCodeGroupMetadata.mockResolvedValue([]);
  codeHelper.getCodeGroupKoreanNameSync.mockImplementation((group) => {
    const match = MOCK_GROUPS.find((g) => g.groupName === group);
    return match?.koreanName || group;
  });

  tenantCommonCodeApi.getTenantCodeGroups.mockResolvedValue({
    success: true,
    data: MOCK_GROUPS
  });

  tenantCommonCodeApi.getTenantCodesByGroup.mockImplementation((groupName) =>
    Promise.resolve({
      success: true,
      data: [
        {
          id: `${groupName}-1`,
          codeGroup: groupName,
          codeValue: 'SAMPLE',
          codeLabel: '샘플',
          isActive: true,
          sortOrder: 1
        }
      ]
    })
  );

  commonCodeApi.getCommonCodes.mockImplementation(() => Promise.resolve([]));
}

describe('TenantCommonCodeManager fetch guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rebindMocks();
  });

  test('초기 로드 시 그룹당 1회만 tenant/global 코드를 조회하고 fetch storm이 없다', async () => {
    render(<TenantCommonCodeManager />);

    await waitFor(() => {
      expect(tenantCommonCodeApi.getTenantCodeGroups).toHaveBeenCalledTimes(1);
      expect(tenantCommonCodeApi.getTenantCodesByGroup).toHaveBeenCalledTimes(3);
    });

    // Allow any microtask/effect churn to settle — loop would inflate counts
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(tenantCommonCodeApi.getTenantCodesByGroup).toHaveBeenCalledTimes(3);
    expect(tenantCommonCodeApi.getTenantCodesByGroup).toHaveBeenCalledWith('ADDRESS_TYPE');
    expect(tenantCommonCodeApi.getTenantCodesByGroup).toHaveBeenCalledWith('ROLE');
    expect(tenantCommonCodeApi.getTenantCodesByGroup).toHaveBeenCalledWith('ALIMTALK_CONFIG');

    expect(commonCodeApi.getCommonCodes.mock.calls.length).toBeLessThanOrEqual(3);
    expect(commonCodeApi.getCommonCodes).toHaveBeenCalledWith('ADDRESS_TYPE', false);
    expect(commonCodeApi.getCommonCodes).toHaveBeenCalledWith('ROLE', false);
    expect(commonCodeApi.getCommonCodes).toHaveBeenCalledWith('ALIMTALK_CONFIG', false);

    expect(codeHelper.loadCodeGroupMetadata).toHaveBeenCalledTimes(1);
  });
});
