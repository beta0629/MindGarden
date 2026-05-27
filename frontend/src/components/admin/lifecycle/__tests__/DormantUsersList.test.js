/**
 * DormantUsersList 테스트 — Phase 4 어드민 휴면 사용자 목록 컴포넌트.
 *
 * 검증 시나리오:
 *  1) loading=true → UnifiedLoading 노출
 *  2) error → 에러 노출
 *  3) 빈 목록 → empty 상태 노출
 *  4) 행 렌더링 + reactivate / forceAnonymize / 상세 클릭 콜백
 *  5) 페이지네이션 prev/next 활성/비활성 토글
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DormantUsersList from '../DormantUsersList';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

const samplePage = ({ content = [], number = 0, totalPages = 1 } = {}) => ({
  content,
  number,
  size: 20,
  totalPages,
  totalElements: content.length
});

const sampleRow = (overrides = {}) => ({
  userId: 4242,
  maskedUserId: 'clie*****',
  role: 'CLIENT',
  dormantEnteredAt: '2025-01-01T00:00:00',
  anonymizeScheduledAt: '2029-01-01T00:00:00',
  preNoticeSentAt: '2028-12-01T00:00:00',
  preNoticeChannel: 'EMAIL',
  vaultPresent: true,
  ...overrides
});

describe('DormantUsersList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loading=true → loading 컴포넌트 노출 + 테이블 미렌더', () => {
    render(<DormantUsersList loading page={null} />);
    expect(screen.queryByTestId('dormant-users-list')).not.toBeInTheDocument();
  });

  it('error 존재 → 에러 영역 노출 (role=alert)', () => {
    render(<DormantUsersList error="조회 실패" page={null} />);
    expect(screen.getByTestId('dormant-users-error')).toBeInTheDocument();
    expect(screen.getByTestId('dormant-users-error').textContent).toContain('조회 실패');
  });

  it('빈 목록 → empty 상태 노출', () => {
    render(<DormantUsersList page={samplePage({ content: [] })} />);
    expect(screen.getByTestId('dormant-users-empty')).toBeInTheDocument();
  });

  it('데이터 표시 + reactivate / forceAnonymize / 상세 클릭 콜백', async () => {
    const onReactivate = jest.fn();
    const onForceAnonymize = jest.fn();
    const onViewDetail = jest.fn();
    const row = sampleRow();
    render(
      <DormantUsersList
        page={samplePage({ content: [row] })}
        onReactivate={onReactivate}
        onForceAnonymize={onForceAnonymize}
        onViewDetail={onViewDetail}
      />
    );

    expect(screen.getByTestId('dormant-users-list')).toBeInTheDocument();
    expect(screen.getByTestId(`dormant-user-row-${row.userId}`)).toBeInTheDocument();

    await userEvent.click(screen.getByTestId(`dormant-user-detail-${row.userId}`));
    expect(onViewDetail).toHaveBeenCalledWith(row);

    await userEvent.click(screen.getByTestId(`dormant-user-reactivate-${row.userId}`));
    expect(onReactivate).toHaveBeenCalledWith(row);

    await userEvent.click(screen.getByTestId(`dormant-user-force-anonymize-${row.userId}`));
    expect(onForceAnonymize).toHaveBeenCalledWith(row);
  });

  it('vaultPresent=false → reactivate 버튼 비활성', () => {
    const row = sampleRow({ vaultPresent: false });
    render(<DormantUsersList page={samplePage({ content: [row] })} />);
    expect(screen.getByTestId(`dormant-user-reactivate-${row.userId}`)).toBeDisabled();
  });

  it('페이지네이션: 첫 페이지 → prev 비활성 / next 활성', async () => {
    const onChangePage = jest.fn();
    const row = sampleRow();
    render(
      <DormantUsersList
        page={samplePage({ content: [row], number: 0, totalPages: 3 })}
        onChangePage={onChangePage}
      />
    );
    expect(screen.getByTestId('dormant-users-prev-page')).toBeDisabled();
    expect(screen.getByTestId('dormant-users-next-page')).not.toBeDisabled();

    await userEvent.click(screen.getByTestId('dormant-users-next-page'));
    expect(onChangePage).toHaveBeenCalledWith(1);
  });

  it('페이지네이션: 마지막 페이지 → next 비활성', () => {
    const row = sampleRow();
    render(
      <DormantUsersList
        page={samplePage({ content: [row], number: 2, totalPages: 3 })}
      />
    );
    expect(screen.getByTestId('dormant-users-prev-page')).not.toBeDisabled();
    expect(screen.getByTestId('dormant-users-next-page')).toBeDisabled();
  });
});
