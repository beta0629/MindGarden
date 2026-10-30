/**
 * 묶음 ② — 내담자 서브페이지 공통 셸: 상단 탭 내비 대신 홈과 같은 ☰ + 얇은 드로어
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';

jest.mock('../../common/ConfirmModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png', () => 'logo.png');
jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 1, role: 'CLIENT', name: '홍길동' }, isLoggedIn: true })
}));
jest.mock('../../../hooks/useBranding', () => ({
  useBranding: () => ({ brandingInfo: null })
}));
jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({ unreadMessageCount: 0, unreadSystemCount: 0 })
}));

// eslint-disable-next-line import/first
import ClientWebPageShell from '../ClientWebPageShell';
// eslint-disable-next-line import/first
import {
  CLIENT_WEB_TOP_CHROME_MENU_TEST_ID,
  CLIENT_WEB_TOP_NAV_TEST_ID
} from '../../../constants/clientWebChromeConstants';
// eslint-disable-next-line import/first
import { CLIENT_COVER_MENU_TEST_ID } from '../clientDashboard/constants';

const renderShell = () => render(
  <MemoryRouter initialEntries={['/client/schedule']}>
    <ClientWebPageShell activeNavId="schedule" title="일정">
      <p>본문</p>
    </ClientWebPageShell>
  </MemoryRouter>
);

describe('ClientWebPageShell ☰ 헤더', () => {
  it('상단 탭 내비 없이 ☰ 1개, 클릭 시 드로어(역할 메뉴 IA)', () => {
    renderShell();
    expect(screen.queryByTestId(CLIENT_WEB_TOP_NAV_TEST_ID)).not.toBeInTheDocument();
    const menus = screen.getAllByTestId(CLIENT_WEB_TOP_CHROME_MENU_TEST_ID);
    expect(menus).toHaveLength(1);
    expect(screen.queryByTestId(CLIENT_COVER_MENU_TEST_ID)).not.toBeInTheDocument();
    fireEvent.click(menus[0]);
    const drawer = screen.getByTestId(CLIENT_COVER_MENU_TEST_ID);
    expect(drawer).toHaveTextContent('예정');
    expect(drawer.querySelector('[aria-current="page"]')).not.toBeNull();
  });

  it('☰ 포커스링은 :focus-visible만, 드로어 CSS는 토큰만(hex 없음)', () => {
    const chrome = fs.readFileSync(path.join(__dirname, '..', 'ClientWebTopChrome.css'), 'utf8');
    expect(chrome).toMatch(/\.client-web-topchrome__menu:focus-visible\s*\{/);
    expect(chrome).toMatch(/\.client-web-topchrome__menu:focus\s*\{\s*outline:\s*none;/);
    const drawerCss = fs.readFileSync(
      path.join(__dirname, '..', 'clientDashboard', 'coverChapter', 'CoverMenuDrawer.css'),
      'utf8'
    );
    expect(drawerCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
