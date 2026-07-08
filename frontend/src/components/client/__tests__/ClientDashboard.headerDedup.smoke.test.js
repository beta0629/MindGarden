/**
 * ClientDashboard — v1.1 rebuild smoke (G-14 · B0KlA · ContentHeader SSOT)
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const PAGE_TITLE = '내 대시보드';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title, className }) => (
    <div
      data-testid="admin-common-layout"
      data-title={title ?? ''}
      data-classname={className ?? ''}
    >
      {children}
    </div>
  )
}));

jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children, ariaLabel }) => (
    <div data-testid="content-area" data-aria-label={ariaLabel}>
      {children}
    </div>
  ),
  ContentHeader: ({ title, subtitle, titleId }) => (
    <header data-testid="content-header" data-has-title={String(Boolean(title))}>
      {title ? <h1 id={titleId}>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
  ContentSection: ({ title, subtitle, children, dataTestId }) => (
    <section data-testid={dataTestId || undefined}>
      {title ? <h2>{title}</h2> : null}
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </section>
  ),
  ContentKpiRow: () => <div data-testid="content-kpi-row" />
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}));

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../dashboard/ClientPersonalizedMessages', () => ({
  __esModule: true,
  default: () => <div data-testid="client-personalized-messages" />
}));

jest.mock('../../dashboard/ClientPaymentSessionsSection', () => ({
  __esModule: true,
  default: () => <div data-testid="client-payment-sessions" />
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'common:client.ClientDashboard.t_7be8ada9': '매칭 대기',
        'common:client.ClientDashboard.t_07de2f32': '상담 진행 중',
        'common:client.ClientDashboard.t_db16bb78': '결제 대기',
        'common:client.ClientDashboard.t_e85b3406': '담당 상담사 배정 전',
        'common:client.ClientDashboard.t_69c40d10': '좋은 아침',
        'common:client.ClientDashboard.t_2f3e0450': '좋은 오후',
        'common:client.ClientDashboard.t_c626e85b': '좋은 저녁',
        'common:client.ClientDashboard.t_e9792c10': '남은 회기',
        'common:client.ClientDashboard.t_4af64dc5': '이번 달 일정',
        'common:client.ClientDashboard.t_83cce32e': '새 메시지',
        'common:client.ClientDashboard.t_4968e29c': '상담 일정',
        'common:client.ClientDashboard.t_7ba9542c': '예정',
        'common:client.ClientDashboard.t_d7f3f1d4': '매칭이 진행 중입니다.',
        'common:client.ClientDashboard.t_17cef764': '패키지',
        'common:client.ClientDashboard.t_d23413ca': '상담이 진행 중입니다.',
        'common:client.ClientDashboard.t_6d8a0e47': '진행 중인 상담이 없습니다.',
        'common.labels.active': '활성',
        'common.labels.pending': '대기',
        'admin.labels.message': '메시지'
      };
      return map[key] ?? key;
    }
  })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: { id: 101, name: '테스트내담자', role: 'CLIENT' },
    isLoggedIn: true,
    isLoading: false,
    checkSession: jest.fn()
  })
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    getUser: () => ({ id: 101, name: '테스트내담자', role: 'CLIENT' }),
    isLoggedIn: () => true,
    setUser: jest.fn()
  }
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn((endpoint) => {
      if (String(endpoint).includes('schedules')) {
        return Promise.resolve([]);
      }
      if (String(endpoint).includes('mappings/client')) {
        return Promise.resolve([]);
      }
      if (String(endpoint).includes('unread-count')) {
        return Promise.resolve({ unreadCount: 0 });
      }
      return Promise.resolve(null);
    })
  }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

import ClientDashboard from '../ClientDashboard';

describe('ClientDashboard v1.1 rebuild', () => {
  test('ContentHeader SSOT · ACL title 생략 · B0KlA · E2E testid', async() => {
    render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute(
      'data-classname',
      'mg-v2-client-dashboard-layout'
    );

    expect(screen.getByTestId('content-header')).toHaveAttribute('data-has-title', 'true');
    expect(screen.getByRole('heading', { name: PAGE_TITLE })).toHaveAttribute(
      'id',
      'client-dashboard-page-title'
    );

    await waitFor(() => {
      expect(screen.getByTestId('client-dashboard-kpi-section')).toBeInTheDocument();
    });

    expect(screen.getByTestId('client-dashboard-upcoming-schedule')).toBeInTheDocument();
    expect(screen.getByTestId('client-dashboard-quick-menu')).toBeInTheDocument();
    expect(screen.getByTestId('client-dashboard-quick-menu-section')).toBeInTheDocument();
    expect(document.querySelector('.client-dashboard')).toBeInTheDocument();
    expect(document.querySelector('.client-dashboard__container')).toBeInTheDocument();
    expect(document.getElementById('client-dashboard-main')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^일정$/ })).toBeInTheDocument();
    expect(screen.getByTestId('client-personalized-messages')).toBeInTheDocument();
    // P2: 결제 요약은 ListTableView 섹션으로 재구성 (레거시 위젯 대체)
    await waitFor(() => {
      expect(screen.getByTestId('client-dashboard-payment-section')).toBeInTheDocument();
    });
    expect(screen.getByTestId('client-dashboard-core-section')).toBeInTheDocument();
  });
});
