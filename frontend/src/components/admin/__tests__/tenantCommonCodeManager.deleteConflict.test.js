/**
 * TenantCommonCodeManager — 삭제 409 시 서버 문구 표시 (공통 오류 문구 처리)
 *
 * @author Core Solution
 * @since 2026-10-12
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

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

jest.mock('../../common/SafeErrorDisplay', () => ({
  __esModule: true,
  default: ({ error }) => <div role="alert">{error}</div>
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
  default: ({ codes, onDelete }) => (
    <div data-testid="tenant-common-code-table">
      {codes.slice(0, 1).map((code) => (
        <button key={code.id} type="button" onClick={() => onDelete(code)}>delete</button>
      ))}
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
  useConfirm: () => [jest.fn().mockResolvedValue(true), () => null]
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
  getCoreCodesByGroup: jest.fn()
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

const SERVER_409_MESSAGE = '주문·결제 이력이 있는 상품은 삭제할 수 없습니다.';

function rebindMocks() {
  codeHelper.loadCodeGroupMetadata.mockResolvedValue([]);
  tenantCommonCodeApi.getTenantCodeGroups.mockResolvedValue({ success: true, data: MOCK_GROUPS.slice(0, 1) });
  tenantCommonCodeApi.getTenantCodesByGroup.mockResolvedValue({
    success: true,
    data: [{ id: 1, codeGroup: 'ADDRESS_TYPE', codeValue: 'SAMPLE', codeLabel: '샘플', isActive: true, sortOrder: 1 }]
  });
  commonCodeApi.getCoreCodesByGroup.mockResolvedValue([]);
}

describe('TenantCommonCodeManager 삭제 409', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rebindMocks();
  });

  test('409 응답이면 서버 문구를 그대로 보여 준다', async () => {
    const conflict = new Error('요청 오류');
    conflict.status = 409;
    conflict.response = { data: { success: false, message: SERVER_409_MESSAGE } };
    tenantCommonCodeApi.deleteTenantCode.mockRejectedValue(conflict);

    render(<TenantCommonCodeManager />);
    fireEvent.click(await screen.findByRole('button', { name: 'delete' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(SERVER_409_MESSAGE);
    });
  });

  test('서버 문구가 없으면 기본 문구로 대신한다', async () => {
    tenantCommonCodeApi.deleteTenantCode.mockRejectedValue(new Error(''));

    render(<TenantCommonCodeManager />);
    fireEvent.click(await screen.findByRole('button', { name: 'delete' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('admin:tenantCommonCode.msg.errCodeDelete');
    });
  });
});
