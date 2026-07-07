/**
 * G-14 Phase 3 — ComingSoon B0KlA, Wellness header dedup, BranchDeprecation notice
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title, loading }) => (
    <div
      data-testid="admin-common-layout"
      data-title={title ?? ''}
      data-loading={String(Boolean(loading))}
    >
      {children}
    </div>
  )
}));

jest.mock('../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children, ariaLabel }) => (
    <div data-testid="content-area" data-aria-label={ariaLabel ?? ''}>
      {children}
    </div>
  )
}));

jest.mock('../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle, actions }) => (
    <header data-testid="content-header" data-has-title={String(Boolean(title))}>
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </header>
  )
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}));

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  apiPost: jest.fn(() => Promise.resolve({ success: true }))
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 1 }, isLoggedIn: true })
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: { getUser: () => ({ id: 1 }) }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../../common/ConfirmModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-loading" />
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'admin:wellnessMgmt.title': '웰니스 알림 관리',
        'admin:wellnessMgmt.subtitle': '템플릿·테스트 발송·AI 비용 통계',
        'admin:wellnessMgmt.regionLabel': '웰니스 알림 관리 본문',
        'admin:wellnessMgmt.loading': '로딩 중',
        'admin:wellnessMgmt.buttons.exchangeRefresh': '환율 새로고침',
        'admin:wellnessMgmt.buttons.testSend': '테스트 발송',
        'admin:actions.refresh': '새로고침',
        'admin:wellnessMgmt.stats.monthCost': '월 비용',
        'admin:wellnessMgmt.stats.monthDescription': '월 설명',
        'admin:wellnessMgmt.stats.tokens': '토큰',
        'admin:wellnessMgmt.stats.tokensDesc': '토큰 설명',
        'admin:wellnessMgmt.stats.apiCalls': 'API 호출',
        'admin:wellnessMgmt.stats.apiCallsDesc': 'API 설명',
        'admin:wellnessMgmt.stats.templates': '템플릿',
        'admin:wellnessMgmt.stats.templatesDesc': '템플릿 설명',
        'admin:wellnessMgmt.monthSelector.label': '월 선택',
        'admin:wellnessMgmt.recentLogs.title': '최근 로그',
        'admin:wellnessMgmt.recentLogs.empty': '로그 없음',
        'admin:wellnessMgmt.templates.title': '템플릿 목록',
        'admin:wellnessMgmt.templates.empty': '템플릿 없음',
        'admin:wellnessMgmt.templates.emptyHint': '힌트'
      };
      return map[key] ?? key;
    }
  })
}));

import ComingSoon from '../../common/ComingSoon';
import BranchDeprecationNotice from '../BranchDeprecationNotice';
import WellnessManagement from '../WellnessManagement';

describe('ComingSoon (G-14 Phase 3 B0KlA)', () => {
  test('AdminCommonLayout title·loading 및 mg-v2-notice-card mount', () => {
    const { container } = render(
      <ComingSoon title="시스템 관리" description="개발 중입니다." />
    );

    const layout = screen.getByTestId('admin-common-layout');
    expect(layout).toHaveAttribute('data-title', '시스템 관리');
    expect(layout).toHaveAttribute('data-loading', 'false');
    expect(container.querySelector('.mg-v2-ad-b0kla')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-notice-card')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-notice-card__title')).toHaveTextContent('시스템 관리');
    expect(container.querySelector('.coming-soon-container')).not.toBeInTheDocument();
  });

  test('기본 title fallback "준비 중"', () => {
    render(<ComingSoon />);
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '준비 중');
  });
});

describe('BranchDeprecationNotice (G-14 Phase 3 B0KlA)', () => {
  test('warning notice card 및 layout title', () => {
    const { container } = render(<BranchDeprecationNotice />);

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute(
      'data-title',
      '지점(Branch) 시스템 사용 중단'
    );
    expect(container.querySelector('.mg-v2-notice-card--warning')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-notice-card__icon .bi-exclamation-triangle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /관리자 대시보드로 이동/ })).toBeInTheDocument();
  });
});

describe('WellnessManagement (G-14 P0 ContentHeader title SSOT)', () => {
  test('ContentHeader h1 title·ACL title 생략·loading 유지', async () => {
    const { container } = render(<WellnessManagement />);

    const layout = screen.getByTestId('admin-common-layout');
    expect(layout).not.toHaveAttribute('data-title', '웰니스 알림 관리');
    expect(layout).toHaveAttribute('data-loading', 'true');

    const header = screen.getByTestId('content-header');
    expect(header).toHaveAttribute('data-has-title', 'true');
    expect(header.querySelector('h1')).toHaveTextContent('웰니스 알림 관리');
    expect(container.querySelector('.mg-v2-ad-b0kla')).toBeInTheDocument();
  });
});
