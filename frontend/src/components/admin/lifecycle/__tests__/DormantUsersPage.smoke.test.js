/**
 * DormantUsersPage — AdminCommonLayout 스모크 테스트.
 *
 * 페이지가 AdminCommonLayout + ContentHeader + 본문 영역을 정상 mount 하고,
 * 목록 fetch 로딩·성공·오류 경로를 검증한다.
 *
 * @author Core Solution
 * @since 2026-07-06
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

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title, loading }) => (
    <div data-testid="admin-common-layout" data-title={title} data-loading={String(loading)}>
      {children}
    </div>
  )
}));

jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle, titleId }) => (
    <header data-testid="content-header">
      <h1 id={titleId}>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  )
}));

jest.mock('../DormantUsersList', () => ({
  __esModule: true,
  default: ({ loading, error, page }) => {
    if (loading) {
      return <div data-testid="dormant-users-list-loading" />;
    }
    if (error) {
      return (
        <div data-testid="dormant-users-error" role="alert">
          {error}
        </div>
      );
    }
    const content = page?.content;
    if (!Array.isArray(content) || content.length === 0) {
      return <div data-testid="dormant-users-empty" />;
    }
    return <div data-testid="dormant-users-list-stub" />;
  }
}));

jest.mock('../DormantUserDetail', () => () => null);
jest.mock('../ReactivateUserModal', () => () => null);
jest.mock('../ForceAnonymizeUserModal', () => () => null);

const mockShowToast = jest.fn();

const EMPTY_PAGE_RESPONSE = {
  data: { content: [], number: 0, size: 20, totalPages: 0, totalElements: 0 }
};

jest.mock('../dormantUsersApi', () => {
  const defaultEmptyPage = {
    data: { content: [], number: 0, size: 20, totalPages: 0, totalElements: 0 }
  };
  return {
    __esModule: true,
    fetchDormantUsers: jest.fn(() => Promise.resolve(defaultEmptyPage)),
    fetchDormantUserDetail: jest.fn(),
    reactivateDormantUser: jest.fn(),
    forceAnonymizeDormantUser: jest.fn()
  };
});

jest.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast })
}));

import { fetchDormantUsers } from '../dormantUsersApi';
import DormantUsersPage from '../DormantUsersPage';

const PAGE_TITLE = '휴면 사용자 관리';
const PAGE_SUBTITLE =
  '1년 비활성 사용자(DORMANT)의 4년 안정 보관 진행 상태를 확인하고 강제 복귀 또는 즉시 익명화할 수 있습니다.';
const LOAD_ERROR_MESSAGE = '휴면 사용자 목록을 불러오지 못했습니다.';

describe('DormantUsersPage 스모크', () => {
  beforeEach(() => {
    mockShowToast.mockClear();
    fetchDormantUsers.mockClear();
    fetchDormantUsers.mockImplementation(() => Promise.resolve(EMPTY_PAGE_RESPONSE));
  });

  test('mount 시 AdminCommonLayout title 및 본문 영역 렌더', async() => {
    render(<DormantUsersPage />);

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', PAGE_TITLE);
    expect(screen.getByTestId('dormant-users-page')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'false');
    });
  });

  test('초기 fetch 중 AdminCommonLayout loading=true', async() => {
    let resolveFetch;
    fetchDormantUsers.mockImplementation(
      () => new Promise((resolve) => {
        resolveFetch = () => resolve(EMPTY_PAGE_RESPONSE);
      })
    );

    render(<DormantUsersPage />);

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'true');
    expect(screen.getByTestId('dormant-users-list-loading')).toBeInTheDocument();

    await act(async() => {
      resolveFetch();
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'false');
    });
  });

  test('loading → loaded 전환 후 loading=false 및 빈 목록 영역', async() => {
    render(<DormantUsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'false');
    });

    expect(screen.queryByTestId('dormant-users-list-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('dormant-users-empty')).toBeInTheDocument();
  });

  test('ContentHeader title·subtitle 표시', async() => {
    render(<DormantUsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('content-header')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(PAGE_SUBTITLE)).toBeInTheDocument();
  });

  test('API reject 시 에러 영역(role=alert) 표시', async() => {
    fetchDormantUsers.mockImplementation(() => Promise.reject(null));

    render(<DormantUsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('dormant-users-error')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  test('빈 목록 응답 시 목록 영역(empty stub) 유지', async() => {
    render(<DormantUsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('dormant-users-empty')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('dormant-users-list-stub')).not.toBeInTheDocument();
  });

  test('mount 시 fetchDormantUsers(page:0, size:20) 호출', async() => {
    render(<DormantUsersPage />);

    await waitFor(() => {
      expect(fetchDormantUsers).toHaveBeenCalledWith({ page: 0, size: 20 });
    });
  });

  test('데이터가 있으면 목록 stub 렌더', async() => {
    fetchDormantUsers.mockImplementation(() => Promise.resolve({
      data: {
        content: [{ userId: 101, maskedUserId: 'user***', role: 'CLIENT', vaultPresent: true }],
        number: 0,
        size: 20,
        totalPages: 1,
        totalElements: 1
      }
    }));

    render(<DormantUsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('dormant-users-list-stub')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('dormant-users-empty')).not.toBeInTheDocument();
  });
});
