/**
 * CommonCodeManagement — G-14 P2 header dedup + Clinic-OS regression 스모크.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const PAGE_TITLE = '공통코드 관리';
const PAGE_SUBTITLE = '코드그룹을 선택한 뒤 해당 그룹의 세부 코드를 관리합니다.';

const GROUP_KO = {
  ADDRESS_TYPE: '주소유형',
  ROLE: '역할',
  ALIMTALK_CONFIG: '알림톡설정'
};

const GROUP_KEYS = Object.keys(GROUP_KO);

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title ?? ''}>
      {children}
    </div>
  )
}));

jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children, className }) => (
    <div data-testid="content-area" className={className}>{children}</div>
  ),
  ContentHeader: ({ title, subtitle }) => (
    <header data-testid="content-header" data-has-title={String(Boolean(title))}>
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
        'admin:commonCode.ui.headerSubtitle': PAGE_SUBTITLE,
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
        'admin:commonCode.ui.btnClose': '닫기',
        'admin:commonCode.ui.actionDeactivate': '비활성화',
        'admin:commonCode.ui.actionActivate': '활성화',
        'admin:commonCode.ui.formTitleNew': '새 코드 추가',
        'admin:commonCode.ui.labelCodeValue': '코드 값',
        'admin:commonCode.ui.labelCodeLabel': '코드 라벨',
        'admin:commonCode.ui.labelDescription': '설명',
        'admin:commonCode.ui.labelSortOrder': '정렬 순서',
        'admin:commonCode.ui.labelActiveState': '활성 상태',
        'admin:commonCode.ui.colCodeLabel': '코드 라벨',
        'admin:commonCode.ui.colCodeValue': '코드 값',
        'admin:commonCode.ui.colStatus': '상태',
        'admin:commonCode.ui.colSort': '정렬',
        'admin:commonCode.ui.colDescription': '설명',
        'admin:commonCode.ui.colManage': '관리',
        'admin:commonCode.ui.statusActive': '활성',
        'admin:commonCode.ui.statusInactive': '비활성',
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
        'admin:commonCode.groupKoFallback.ALIMTALK_CONFIG': '알림톡설정'
      };
      if (map[key]) {
        return map[key];
      }
      if (typeof fallbackOrOpts === 'string') {
        return fallbackOrOpts;
      }
      if (fallbackOrOpts && typeof fallbackOrOpts.defaultValue === 'string') {
        return fallbackOrOpts.defaultValue;
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
  getCodeGroups: jest.fn(() => Promise.resolve(['ADDRESS_TYPE', 'ROLE', 'ALIMTALK_CONFIG'])),
  getLegacyCodeGroupsList: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../../utils/codeHelper', () => {
  const ko = {
    ADDRESS_TYPE: '주소유형',
    ROLE: '역할',
    ALIMTALK_CONFIG: '알림톡설정'
  };
  return {
    __esModule: true,
    loadCodeGroupMetadata: jest.fn(async () => []),
    getCodeGroupKoreanNameSync: jest.fn((group) => ko[group] || group),
    getCodeGroupIconSync: jest.fn(() => 'Folder'),
    clearCodeGroupCache: jest.fn()
  };
});

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), error: jest.fn(), success: jest.fn() }
}));

jest.mock('../ClientComprehensiveManagement/molecules/SavedViewControls', () => ({
  __esModule: true,
  default: () => <div data-testid="saved-view-controls" />
}));

jest.mock('../../../hooks/useSavedViewPreference', () => ({
  resolveSavedViewStorageScope: () => ({ tenantId: 't1', userId: '1' }),
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

jest.mock('../../common/molecules/SettingSwitchRow', () => ({
  __esModule: true,
  default: () => <div data-testid="setting-switch" />
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-loading" />
}));

jest.mock('../commoncode/CommonCodeForm', () => ({
  __esModule: true,
  default: ({ isOpen, title, onClose, cancelText, submitText }) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <div data-testid="common-code-form-modal">{title}</div>
        <div data-testid="modal-form-actions">
          <button type="button" onClick={onClose}>{cancelText}</button>
          <button type="submit">{submitText}</button>
        </div>
      </div>
    ) : null
  )
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, className, variant, fullWidth, onClick, type = 'button', title }) => (
    // eslint-disable-next-line react/button-has-type
    <button
      type={type}
      className={className || ''}
      data-variant={variant || ''}
      data-fullwidth={String(Boolean(fullWidth))}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}));

import * as commonCodeApi from '../../../utils/commonCodeApi';
import * as codeHelper from '../../../utils/codeHelper';
import CommonCodeManagement from '../CommonCodeManagement';

const KO_BY_GROUP = {
  ADDRESS_TYPE: '주소유형',
  ROLE: '역할',
  ALIMTALK_CONFIG: '알림톡설정'
};

function rebindCodeHelperMocks() {
  codeHelper.loadCodeGroupMetadata.mockResolvedValue([]);
  codeHelper.clearCodeGroupCache.mockImplementation(() => {});
  codeHelper.getCodeGroupKoreanNameSync.mockImplementation(
    (group) => KO_BY_GROUP[group] || group
  );
  if (codeHelper.getCodeGroupIconSync) {
    codeHelper.getCodeGroupIconSync.mockImplementation(() => 'Folder');
  }
}

function rebindCommonCodeApiMocks() {
  commonCodeApi.getCodeGroups.mockResolvedValue(['ADDRESS_TYPE', 'ROLE', 'ALIMTALK_CONFIG']);
  commonCodeApi.getCommonCodes.mockImplementation((group) => Promise.resolve([
    {
      id: 101,
      codeGroup: group,
      codeValue: 'SAMPLE',
      codeLabel: '샘플',
      codeDescription: 'desc',
      sortOrder: 1,
      isActive: true
    }
  ]));
}

describe('CommonCodeManagement (G-14 P2 header dedup)', () => {
  beforeEach(() => {
    rebindCodeHelperMocks();
    rebindCommonCodeApiMocks();
  });

  test('ContentHeader title SSOT, ACL title 생략, 부제 유지', () => {
    render(<CommonCodeManagement />);

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');

    const header = screen.getByTestId('content-header');
    expect(header).toHaveAttribute('data-has-title', 'true');
    expect(screen.getByRole('heading', { name: PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(PAGE_SUBTITLE)).toBeInTheDocument();
  });
});

describe('CommonCodeManagement (Clinic-OS regression)', () => {
  beforeEach(() => {
    rebindCodeHelperMocks();
    rebindCommonCodeApiMocks();
    expect(codeHelper.getCodeGroupKoreanNameSync('ROLE')).toBe('역할');
  });

  test('한글 그룹 목록·세부 제목·ghost/danger 액션·폼 footer', async () => {
    const { container } = render(<CommonCodeManagement />);

    await waitFor(() => {
      expect(commonCodeApi.getCodeGroups).toHaveBeenCalled();
      expect(screen.getByText(GROUP_KO.ADDRESS_TYPE)).toBeInTheDocument();
      expect(screen.getByText(GROUP_KO.ROLE)).toBeInTheDocument();
      expect(screen.getByText(GROUP_KO.ALIMTALK_CONFIG)).toBeInTheDocument();
    });

    // 1) English group-code sibling must not render when Korean title exists
    expect(container.querySelector('.mg-v2-ad-b0kla__group-code')).toBeNull();

    const groupList = container.querySelector('.mg-v2-ad-b0kla__group-list');
    expect(groupList).toBeTruthy();
    const groupListText = groupList.textContent || '';
    GROUP_KEYS.forEach((key) => {
      expect(groupListText).not.toContain(key);
    });
    expect(groupListText).toContain(GROUP_KO.ADDRESS_TYPE);
    expect(groupListText).toContain(GROUP_KO.ROLE);
    expect(groupListText).toContain(GROUP_KO.ALIMTALK_CONFIG);

    // 2) Clinic-OS quiet summary strip — 3 cells, no group selected yet
    const summaryStrip = container.querySelector('.mg-v2-common-code-page__summary');
    expect(summaryStrip).toBeTruthy();
    expect(summaryStrip.getAttribute('aria-label')).toBe('공통코드 요약');
    expect(within(summaryStrip).getByText('코드그룹 수')).toBeInTheDocument();
    expect(within(summaryStrip).getByText('선택 그룹')).toBeInTheDocument();
    expect(within(summaryStrip).getByText('세부 코드 수')).toBeInTheDocument();
    expect(within(summaryStrip).getByText('3')).toBeInTheDocument();
    expect(summaryStrip.querySelectorAll('.mg-v2-common-code-page__summary-cell')).toHaveLength(3);

    // Select ROLE → detail title Korean-only
    fireEvent.click(screen.getByRole('button', { name: GROUP_KO.ROLE }));

    await waitFor(() => {
      expect(screen.getByText(/역할 세부 코드/)).toBeInTheDocument();
    });

    // Summary strip updates when group selected
    const summaryAfterSelect = container.querySelector('.mg-v2-common-code-page__summary');
    expect(within(summaryAfterSelect).getByText(GROUP_KO.ROLE)).toBeInTheDocument();
    expect(within(summaryAfterSelect).getByText('1')).toBeInTheDocument();

    expect(screen.queryByText(/역할 \(ROLE\)/)).not.toBeInTheDocument();
    expect(screen.getByText(/역할 세부 코드/).textContent).not.toMatch(/역할 \(ROLE\)/);

    // 3) Row actions: ghost edit/toggle, danger delete, nowrap container
    await waitFor(() => {
      expect(screen.getByTitle('수정')).toBeInTheDocument();
    });

    const actions = container.querySelector('.mg-v2-common-code-page__code-actions')
      || container.querySelector('.mg-v2-ad-b0kla__code-actions');
    expect(actions).toBeTruthy();
    expect(actions.className).toMatch(/code-actions/);

    const editBtn = screen.getByTitle('수정');
    const toggleBtn = screen.getByTitle('비활성화');
    const deleteBtn = screen.getByTitle('삭제');

    expect(editBtn).toHaveAttribute('data-variant', 'ghost');
    expect(editBtn.className).toMatch(/ghost/);
    expect(toggleBtn).toHaveAttribute('data-variant', 'ghost');
    expect(toggleBtn.className).toMatch(/ghost/);
    expect(deleteBtn).toHaveAttribute('data-variant', 'danger');
    expect(deleteBtn.className).toMatch(/danger/);

    // 4) Open add modal → cancel/submit labels from CommonCodeForm wiring
    fireEvent.click(screen.getByRole('button', { name: '신규 추가' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('새 코드 추가')).toBeInTheDocument();
    });

    const modalActions = screen.getByTestId('modal-form-actions');
    expect(within(modalActions).getByRole('button', { name: '취소' })).toBeInTheDocument();
    expect(within(modalActions).getByRole('button', { name: '추가' })).toBeInTheDocument();
  });
});
