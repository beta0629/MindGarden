/**
 * #1598 개발 검증 FAIL 후속 — 보호 화면 가드·401 처리의 복귀 주소, 일반 로그인 착지점의 민감 쿼리 제거.
 *
 * @author CoreSolution
 * @since 2026-10-13
 */

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom';

import ProtectedRoute from '../../components/common/ProtectedRoute';
import { buildLoginReturnSearch, redirectToLoginPageOnce } from '../sessionRedirect';
import { consumeLoginReturnPath, sanitizeLoginReturnPath } from '../loginReturnPath';
import { USER_ROLES } from '../../constants/roles';

jest.mock('../../contexts/SessionContext', () => ({ useSession: jest.fn() }));
jest.mock('../../components/common/UnifiedLoading', () => function MockLoading() {
  return <div>loading</div>;
});

// eslint-disable-next-line import/first
import { useSession } from '../../contexts/SessionContext';

const ORIGIN = 'https://tenant.example.test';
let originalLocation;

const setLocation = (pathname, search = '') => {
  delete window.location;
  window.location = {
    origin: ORIGIN, host: 'tenant.example.test', hostname: 'tenant.example.test', protocol: 'https:',
    pathname, search, hash: '', href: `${ORIGIN}${pathname}${search}`
  };
};

beforeEach(() => {
  originalLocation = window.location;
  setLocation('/');
  window.sessionStorage.clear();
});
afterEach(() => {
  window.location = originalLocation;
});

const LoginProbe = () => {
  const loc = useLocation();
  return <div data-testid="login-at">{`${loc.pathname}${loc.search}`}</div>;
};

const renderGuard = (entry) => {
  useSession.mockReturnValue({ user: null, isLoading: false, hasCheckedSession: true, hasPermissionGroup: () => false });
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route path="*" element={(
          <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}><div>secret</div></ProtectedRoute>
        )} />
      </Routes>
    </MemoryRouter>
  );
};

describe('FAIL1 — 비로그인 보호 화면 → /login?redirect=원래경로', () => {
  test('라우트 가드: /admin/shop/client-offers 에 redirect 가 붙는다', () => {
    const { getByTestId } = renderGuard('/admin/shop/client-offers');
    expect(getByTestId('login-at').textContent).toBe('/login?redirect=%2Fadmin%2Fshop%2Fclient-offers');
  });

  test('라우트 가드: /client/offers 도 같다', () => {
    const { getByTestId } = renderGuard('/client/offers');
    expect(getByTestId('login-at').textContent).toBe('/login?redirect=%2Fclient%2Foffers');
  });

  test('라우트 가드: 민감 쿼리(token)는 버리고 나머지는 남긴다', () => {
    const { getByTestId } = renderGuard('/admin/shop/client-offers?token=abc&tab=2');
    expect(getByTestId('login-at').textContent).toBe('/login?redirect=%2Fadmin%2Fshop%2Fclient-offers%3Ftab%3D2');
  });

  test('공통 401 처리: returnUrl 없이 불려도 현재 화면 주소(민감 쿼리 제거)를 붙인다', () => {
    setLocation('/admin/shop/client-offers', '?token=abc&tab=2');
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      const mod = require('../sessionRedirect');
      mod.redirectToLoginPageOnce();
    });
    expect(window.location.href).toBe(`${ORIGIN}/login?redirect=%2Fadmin%2Fshop%2Fclient-offers%3Ftab%3D2`);
  });

  test('공통 401 처리: 이미 /login 에 있으면 redirect 를 붙이지 않는다(반복 방지)', () => {
    setLocation('/login', '?redirect=%2Fclient%2Foffers');
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require('../sessionRedirect').redirectToLoginPageOnce();
    });
    expect(window.location.href).toBe(`${ORIGIN}/login`);
  });

  test('buildLoginReturnSearch 는 외부·//·javascript:·로그인 경로를 버린다', () => {
    ['https://evil.com', '//evil.com', '/%2F%2Fevil.com', 'javascript:alert(1)', '/login', '/logout']
      .forEach((v) => expect(buildLoginReturnSearch(v)).toBe(''));
    expect(typeof redirectToLoginPageOnce).toBe('function');
  });
});

describe('FAIL2 — 모든 착지 경로가 sanitizeLoginReturnPath 를 거친다', () => {
  test('?redirect=/admin/shop/client-offers?token=abc&tab=2 → token 제거', () => {
    expect(sanitizeLoginReturnPath('/admin/shop/client-offers?token=abc&tab=2')).toBe('/admin/shop/client-offers?tab=2');
    setLocation('/login', `?redirect=${encodeURIComponent('/admin/shop/client-offers?token=abc&tab=2')}`);
    expect(consumeLoginReturnPath(['/admin/'])).toBe('/admin/shop/client-offers?tab=2');
  });

  test('저장값 복원도 같은 함수로 token 제거', () => {
    setLocation('/login', '');
    window.sessionStorage.setItem('mg.loginReturnPath', JSON.stringify({ path: '/client/offers?access_token=x&id=3', savedAt: Date.now() }));
    expect(consumeLoginReturnPath(['/client/'])).toBe('/client/offers?id=3');
  });

  test('관리자에게 권한 밖 /client/offers 는 쓰지 않는다(역할 기본 화면으로)', () => {
    setLocation('/login', `?redirect=${encodeURIComponent('/client/offers')}`);
    expect(consumeLoginReturnPath(['/admin/'])).toBe('');
  });
});
