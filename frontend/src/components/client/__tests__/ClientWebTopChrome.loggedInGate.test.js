/**
 * ClientWebTopChrome — isLoggedIn SSOT: 로그인 시 userName 없어도 「로그인」숨김
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientWebTopChrome from '../ClientWebTopChrome';
import { CLIENT_WEB_LOGIN } from '../../../constants/clientWebChromeConstants';

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({ unreadMessageCount: 0, unreadSystemCount: 0 })
}));

const renderChrome = (props = {}) => render(
  <MemoryRouter>
    <ClientWebTopChrome nav={null} {...props} />
  </MemoryRouter>
);

describe('ClientWebTopChrome logged-in gate', () => {
  test('isLoggedIn=true · userName 없음 → 로그인 링크 없음', () => {
    renderChrome({ isLoggedIn: true, onLogout: () => {} });
    expect(screen.queryByRole('link', { name: CLIENT_WEB_LOGIN })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });

  test('게스트(기본) → 로그인 링크 노출', () => {
    renderChrome();
    expect(screen.getByRole('link', { name: CLIENT_WEB_LOGIN })).toBeInTheDocument();
  });

  test('isLoggedIn=false · userName 있어도 게스트 취급 → 로그인 노출·프로필 숨김', () => {
    renderChrome({ isLoggedIn: false, userName: '이내담' });
    expect(screen.getByRole('link', { name: CLIENT_WEB_LOGIN })).toBeInTheDocument();
    expect(screen.queryByText('이내담')).not.toBeInTheDocument();
  });

  test('userName만 있으면(레거시) 로그인 링크 숨김', () => {
    renderChrome({ userName: '이내담', onLogout: () => {} });
    expect(screen.queryByRole('link', { name: CLIENT_WEB_LOGIN })).not.toBeInTheDocument();
  });
});
