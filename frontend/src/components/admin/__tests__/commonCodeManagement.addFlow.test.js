/**
 * CommonCodeManagement — group selection + add modal flow (real MGButton)
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const PAGE_TITLE = '공통코드 관리';
const GROUP_KO = {
  ADDRESS_TYPE: '주소유형',
  ROLE: '역할'
};

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-common-layout">{children}</div>
}));

jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children, className }) => (
    <div data-testid="content-area" className={className}>{children}</div>
  ),
  ContentHeader: ({ title, subtitle }) => (
    <header data-testid="content-header">
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
  ContentCard: ({ children, className }) => (
    <div data-testid="content-card" className={className}>{children}</div>
  )
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallbackOrOpts) => {
      const map = {
        'admin:commonCode.ui.pageTitle': PAGE_TITLE,
        'admin:commonCode.ui.headerSubtitle': '부제',
        'admin:commonCode.ui.groupListTitle': '코드그룹 목록',
        'admin:commonCode.ui.searchPlaceholder': '검색',
        'admin:commonCode.ui.categoryAll': '전체',
        'admin:commonCode.ui.categoryUser': '사용자',
        'admin:commonCode.ui.categorySystem': '시스템',
        'admin:commonCode.ui.categoryPayment': '결제',
        'admin:commonCode.ui.categoryConsultation': '상담',
        'admin:commonCode.ui.categoryErp': 'ERP',
        'admin:commonCode.ui.btnNew': '신규 추가',
        'admin:commonCode.ui.btnCancel': '취소',
        'admin:commonCode.ui.btnSubmitAdd': '추가',
        'admin:commonCode.ui.btnSubmitEdit': '수정',
        'admin:commonCode.ui.btnEdit': '수정',
        'admin:commonCode.ui.btnDelete': '삭제',
        'admin:commonCode.ui.actionDeactivate': '비활성화',
        'admin:commonCode.ui.formTitleNew': '새 코드 추가',
        'admin:commonCode.ui.formTitleEdit': '코드 수정',
        'admin:commonCode.ui.colCodeLabel': '코드 라벨',
        'admin:commonCode.ui.colCodeValue': '코드 값',
        'admin:commonCode.ui.colStatus': '상태',
        'admin:commonCode.ui.colSort': '정렬',
        'admin:commonCode.ui.colDescription': '설명',
        'admin:commonCode.ui.colManage': '관리',
        'admin:commonCode.ui.statusActive': '활성',
        'admin:commonCode.ui.displayEmpty': '—',
        'admin:commonCode.ui.summaryAriaLabel': '공통코드 요약',
        'admin:commonCode.ui.summaryGroupCountLabel': '코드그룹 수',
        'admin:commonCode.ui.summarySelectedGroupLabel': '선택 그룹',
        'admin:commonCode.ui.summaryDetailCodeCountLabel': '세부 코드 수',
        'admin:commonCode.ui.loading': '로딩중...',
        'admin:commonCode.ui.emptyNoCodes': '등록된 세부 코드가 없습니다.',
        'admin:commonCode.ui.emptySelectTitle': '코드그룹을 선택하세요',
        'admin:commonCode.ui.emptySelectDesc': '좌측에서 선택',
        'admin:commonCode.groupKoFallback.ADDRESS_TYPE': '주소유형',
        'admin:commonCode.groupKoFallback.ROLE': '역할',
        'admin.actions.cancel': '취소'
      };
      if (map[key]) {
        return map[key];
      }
      if (typeof fallbackOrOpts === 'string') {
        return fallbackOrOpts;
      }
      return key;
    }
  })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 1, role: 'ADMIN', tenantId: 't1' } })
}));

jest.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => [jest.fn(), () => null]
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getCommonCodes: jest.fn(() => Promise.resolve([])),
  createCommonCode: jest.fn(),
  updateCommonCode: jest.fn(),
  deleteCommonCode: jest.fn(),
  toggleCommonCodeStatus: jest.fn(),
  getCodeGroups: jest.fn(() => Promise.resolve(['ADDRESS_TYPE', 'ROLE'])),
  getLegacyCodeGroupsList: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), error: jest.fn(), success: jest.fn() }
}));

jest.mock('../ClientComprehensiveManagement/molecules/SavedViewControls', () => ({
  __esModule: true,
  default: () => <div data-testid="saved-view-controls" />
}));

jest.mock('../../../utils/codeHelper', () => {
  const ko = {
    ADDRESS_TYPE: '주소유형',
    ROLE: '역할'
  };
  return {
    __esModule: true,
    loadCodeGroupMetadata: jest.fn(async () => []),
    getCodeGroupKoreanNameSync: jest.fn((group) => ko[group] || group),
    clearCodeGroupCache: jest.fn()
  };
});

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-loading">loading</div>
}));

jest.mock('../commoncode/CommonCodeForm', () => ({
  __esModule: true,
  default: ({ isOpen, title, onClose, cancelText, submitText }) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <div data-testid="common-code-form-modal">{title}</div>
        <button type="button" onClick={onClose}>{cancelText}</button>
        <button type="submit">{submitText}</button>
      </div>
    ) : null
  )
}));

import * as commonCodeApi from '../../../utils/commonCodeApi';
import * as codeHelper from '../../../utils/codeHelper';
import CommonCodeManagement from '../CommonCodeManagement';

const originalSessionManager = window.sessionManager;

describe('CommonCodeManagement add flow (real MGButton)', () => {
  let codesResolve;
  let codesPromise;

  beforeEach(() => {
    localStorage.clear();
    window.sessionManager = {
      getUser: () => ({ id: 'user-test', tenantId: 'tenant-test' })
    };

    codeHelper.loadCodeGroupMetadata.mockResolvedValue([]);
    codeHelper.getCodeGroupKoreanNameSync.mockImplementation(
      (group) => GROUP_KO[group] || group
    );

    commonCodeApi.getCodeGroups.mockResolvedValue(['ADDRESS_TYPE', 'ROLE']);
    codesPromise = new Promise((resolve) => {
      codesResolve = resolve;
    });
    commonCodeApi.getCommonCodes.mockImplementation(() => codesPromise);
    commonCodeApi.createCommonCode.mockResolvedValue({ id: 999 });
    commonCodeApi.updateCommonCode.mockResolvedValue({});
    commonCodeApi.deleteCommonCode.mockResolvedValue({});
    commonCodeApi.toggleCommonCodeStatus.mockResolvedValue({});
    commonCodeApi.getLegacyCodeGroupsList.mockResolvedValue([]);
  });

  afterEach(() => {
    window.sessionManager = originalSessionManager;
  });

  test('그룹 선택 시 우측 패널이 emptySelectTitle 대신 세부 영역을 표시한다', async () => {
    render(<CommonCodeManagement />);

    await waitFor(() => {
      expect(screen.getByText(GROUP_KO.ROLE)).toBeInTheDocument();
    });

    expect(screen.getByText('코드그룹을 선택하세요')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: GROUP_KO.ROLE }));

    await waitFor(() => {
      expect(screen.getByText(/역할 세부 코드/)).toBeInTheDocument();
    });
    expect(screen.queryByText('코드그룹을 선택하세요')).not.toBeInTheDocument();

    await act(async () => {
      codesResolve([]);
    });
  });

  test('codesLoading 중에도 신규 추가 MGButton(real) 클릭 시 모달이 연다', async () => {
    render(<CommonCodeManagement />);

    await waitFor(() => {
      expect(screen.getByText(GROUP_KO.ADDRESS_TYPE)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: GROUP_KO.ADDRESS_TYPE }));

    await waitFor(() => {
      expect(screen.getByText(/주소유형 세부 코드/)).toBeInTheDocument();
      expect(screen.getByTestId('unified-loading')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: '신규 추가' });
    expect(addButton).not.toBeDisabled();

    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('새 코드 추가')).toBeInTheDocument();
    });

    await act(async () => {
      codesResolve([]);
    });
  });

  test('tenant storageKey 준비 전 그룹 선택 후 hydrate 되어도 selectedGroup이 유지된다', async () => {
    function DelayedTenantWrapper() {
      const [, bump] = React.useState(0);
      React.useEffect(() => {
        window.sessionManager = { getUser: () => null };
        const id = window.setTimeout(() => {
          window.sessionManager = {
            getUser: () => ({ id: 'user-test', tenantId: 'tenant-test' })
          };
          bump(1);
        }, 20);
        return () => window.clearTimeout(id);
      }, []);
      return <CommonCodeManagement />;
    }

    render(<DelayedTenantWrapper />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: GROUP_KO.ROLE })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: GROUP_KO.ROLE }));

    await waitFor(() => {
      expect(screen.getByText(/역할 세부 코드/)).toBeInTheDocument();
    });

    await act(async () => {
      await new Promise((resolve) => { window.setTimeout(resolve, 30); });
    });

    expect(screen.getByText(/역할 세부 코드/)).toBeInTheDocument();
    expect(screen.queryByText('코드그룹을 선택하세요')).not.toBeInTheDocument();

    await act(async () => {
      codesResolve([]);
    });
  });
});
