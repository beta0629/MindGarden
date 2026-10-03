/**
 * MyPage — 4개 역할(운영 · 운영+상담 · 상담사 · 내담자) 공통 레이아웃 렌더 잠금
 * 섹션 순서 · aside 구성 · 탭 없음 · Q1/Q3 숨김 · 보기 상태 입력칸 없음 · 버튼 sm
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyPage from '../MyPage';

const mockSession = { user: null, setModalOpen: () => {} };

jest.mock('../../../contexts/SessionContext', () => {
  const { createContext } = jest.requireActual('react');
  const SessionContext = createContext(null);
  return {
    __esModule: true,
    SessionContext,
    default: SessionContext,
    useSession: () => mockSession
  };
});

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="mock-admin-layout">{children}</div>
}));

jest.mock('../../client/ClientWebPageShell', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="mock-client-shell">
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

jest.mock('../../../services/clientShopService', () => ({
  fetchShopCart: jest.fn(() => Promise.resolve({ lines: [{ skuCode: 'A', quantity: 2 }] }))
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    user: null,
    getUser: jest.fn(() => null),
    checkSession: jest.fn(() => Promise.resolve()),
    notifyListeners: jest.fn(),
    startProfileEditing: jest.fn(),
    endProfileEditing: jest.fn()
  }
}));

jest.mock('../../../utils/mypageApi', () => ({
  __esModule: true,
  default: {
    getProfileInfo: jest.fn(),
    updateProfileInfo: jest.fn(),
    getSocialAccounts: jest.fn(() => Promise.resolve([])),
    getWithdrawalStatus: jest.fn(() => Promise.resolve({ lifecycleState: 'ACTIVE' })),
    getOAuth2Url: jest.fn(),
    unlinkSocialAccount: jest.fn()
  }
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (String(url).includes('privacy-consent')) {
        return Promise.resolve({
          privacyConsent: true,
          termsConsent: true,
          marketingConsent: false,
          consentDate: '2026-09-01T00:00:00'
        });
      }
      if (String(url).includes('clients/settings')) {
        return Promise.resolve({ notifications: { email: true, sms: false, push: true } });
      }
      return Promise.resolve([]);
    }),
    post: jest.fn(() => Promise.resolve({})),
    put: jest.fn(() => Promise.resolve({}))
  }
}));

const mypageApi = require('../../../utils/mypageApi').default;

const PROFILES = {
  operator: {
    user: { id: 1, role: 'ADMIN', name: '김운영', email: 'op@example.test', counselingEnabled: false },
    profile: { name: '김운영', email: 'op@example.test', phone: '01012345678', gender: 'M', address: '서울' }
  },
  operatorDual: {
    user: { id: 2, role: 'ADMIN', name: '이겸직', email: 'dual@example.test', counselingEnabled: true },
    profile: { name: '이겸직', email: 'dual@example.test', phone: '01022223333', specialty: 'DEPRESSION,ANXIETY' }
  },
  consultant: {
    user: { id: 3, role: 'CONSULTANT', name: '박상담', email: 'c@example.test' },
    profile: { name: '박상담', email: 'c@example.test', specialty: 'DEPRESSION' }
  },
  client: {
    user: { id: 4, role: 'CLIENT', name: '최내담', email: 'cl@example.test' },
    profile: { name: '최내담', email: 'cl@example.test', phone: '01055556666' }
  }
};

const EXPECTED_SECTIONS = {
  operator: ['basic', 'security', 'social', 'privacy'],
  operatorDual: ['basic', 'counsel', 'notify', 'security', 'social', 'privacy', 'account'],
  consultant: ['basic', 'counsel', 'notify', 'security', 'social', 'privacy', 'account'],
  client: ['basic', 'notify', 'security', 'social', 'privacy', 'account']
};

const renderAs = async(roleKey) => {
  const { user, profile } = PROFILES[roleKey];
  mockSession.user = user;
  localStorage.setItem('userInfo', JSON.stringify(user));
  mypageApi.getProfileInfo.mockResolvedValue(profile);
  const utils = render(
    <MemoryRouter initialEntries={[roleKey === 'client' ? '/client/mypage' : '/admin/mypage']}>
      <MyPage />
    </MemoryRouter>
  );
  await waitFor(() => expect(screen.getByTestId('mypage-layout')).toBeInTheDocument());
  await waitFor(() => expect(mypageApi.getProfileInfo).toHaveBeenCalled());
  return utils;
};

const sectionOrder = (container) =>
  Array.from(container.querySelectorAll('[data-mypage-section]')).map((el) => el.id);

describe('MyPage role layouts (one config + common components)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test.each(Object.keys(EXPECTED_SECTIONS))('%s: section order, no tabs, no view-state inputs', async(roleKey) => {
    const { container } = await renderAs(roleKey);

    await waitFor(() => expect(sectionOrder(container)).toEqual(EXPECTED_SECTIONS[roleKey]));
    expect(container.querySelector('[data-mypage-role]').getAttribute('data-mypage-role')).toBe(roleKey);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.queryAllByRole('tablist')).toHaveLength(0);

    const main = container.querySelector('.mg-mypage-layout__main');
    expect(main.querySelectorAll('input:not([type="checkbox"]), select, textarea')).toHaveLength(0);
    expect(main.querySelectorAll('input:disabled, select:disabled, textarea:disabled')).toHaveLength(0);

    container.querySelectorAll('.mg-mypage-layout .mg-button').forEach((button) => {
      expect(button.className).toMatch(/mg-button--small/);
    });
    expect(container.querySelectorAll('.mg-mypage-layout .mg-button--primary')).toHaveLength(0);
    expect(container.querySelectorAll('.mg-v2-avatar')).toHaveLength(1);
  });

  test('operator: aside = 내 계정 + 목차 only; Q3 hides gender/address rows and 회원 탈퇴', async() => {
    const { container } = await renderAs('operator');
    await waitFor(() => expect(screen.getByTestId('mypage-row-name')).toBeInTheDocument());

    const aside = container.querySelector('.mg-mypage-layout__aside');
    expect(within(aside).getByTestId('mypage-account-card')).toBeInTheDocument();
    expect(within(aside).queryByTestId('mypage-role-links')).toBeNull();
    expect(within(aside).getByTestId('mypage-section-index')).toBeInTheDocument();
    expect(screen.queryByTestId('mypage-row-gender')).toBeNull();
    expect(screen.queryByTestId('mypage-row-address')).toBeNull();
    expect(screen.queryByText('회원 탈퇴')).toBeNull();
    expect(screen.getByTestId('mypage-quiet-header')).toBeInTheDocument();
  });

  test('operatorDual: 역할 지도 2 rows in aside', async() => {
    await renderAs('operatorDual');
    const links = screen.getByTestId('mypage-role-links');
    expect(within(links).getByRole('heading', { name: '역할 지도' })).toBeInTheDocument();
    expect(within(links).getAllByRole('link')).toHaveLength(2);
  });

  test('consultant: 바로가기 급여 정산 · 근무 가능 시간', async() => {
    await renderAs('consultant');
    const links = screen.getByTestId('mypage-role-links');
    expect(within(links).getByText('급여 정산')).toBeInTheDocument();
    expect(within(links).getByText('근무 가능 시간')).toBeInTheDocument();
  });

  test('client: single stage, no index, 회기 관리 · 결제 내역 links, notification toggles in notify', async() => {
    const { container } = await renderAs('client');
    expect(screen.getByTestId('mock-client-shell')).toBeInTheDocument();
    expect(container.querySelector('.mg-mypage-layout--single')).toBeTruthy();
    expect(screen.queryByTestId('mypage-section-index')).toBeNull();
    const links = screen.getByTestId('mypage-role-links');
    expect(within(links).getByText('회기 관리')).toBeInTheDocument();
    expect(within(links).getByText('결제 내역')).toBeInTheDocument();
    const notify = screen.getByTestId('mypage-section-notify');
    await waitFor(() => expect(within(notify).getAllByRole('switch').length).toBeGreaterThan(0));
    expect(screen.getByTestId('mypage-security-withdrawal-button').className).toMatch(/mg-button--danger-outline/);
  });

  test('Q1: 설정 · 2단계 인증 · 다른 기기 로그아웃 · 고객센터 · 로그아웃 not rendered', async() => {
    await renderAs('consultant');
    ['2단계 인증', '다른 기기 로그아웃', '고객센터', '로그아웃', '언어', '시간대'].forEach((text) => {
      expect(screen.queryByText(text)).toBeNull();
    });
  });
});
