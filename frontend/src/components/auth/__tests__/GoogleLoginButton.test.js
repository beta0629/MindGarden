/**
 * GoogleLoginButton — server-side auth-code (A-2) 흐름 단위 테스트.
 *
 * <p>2026-06-10 P0 마이그레이션으로 implicit popup 흐름이 폐기되고, BE 가 반환한
 * authorize URL 로 전체 페이지 redirect 하는 흐름으로 전환됐다. 본 테스트는
 * `googleLogin` 유틸을 mock 하여 버튼 클릭 시 BE redirect 가 시작되는지, 가드 분기
 * 와 에러 콜백 동작을 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';

const mockGoogleLogin = jest.fn();

jest.mock('../../../utils/socialLogin', () => ({
  __esModule: true,
  googleLogin: (...args) => mockGoogleLogin(...args),
  kakaoLogin: jest.fn(),
  naverLogin: jest.fn()
}));

jest.mock('../../../constants/oauth2', () => ({
  __esModule: true,
  isGoogleWebClientIdConfigured: true,
  GOOGLE_WEB_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
  OAUTH2_LOGIN_UI: {}
}));

const GoogleLoginButton = require('../GoogleLoginButton').default;

describe('GoogleLoginButton — server-side auth-code 흐름', () => {
  beforeEach(() => {
    mockGoogleLogin.mockReset();
  });

  test('버튼 클릭 시 googleLogin() 으로 server-side authorize redirect 가 시작된다.', async () => {
    mockGoogleLogin.mockResolvedValueOnce(undefined);

    render(<GoogleLoginButton onError={jest.fn()} label="Google로 로그인" />);

    const button = screen.getByRole('button', { name: /Google로 로그인/ });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
    });
  });

  test('googleLogin() 호출이 실패하면 onError prop 으로 사용자 친화 메시지가 전달된다.', async () => {
    mockGoogleLogin.mockRejectedValueOnce(new Error('서브도메인이 필요합니다.'));

    const onError = jest.fn();
    render(<GoogleLoginButton onError={onError} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('서브도메인이 필요합니다.');
    });
    expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
  });

  test('disabled prop 이 true 이면 클릭해도 redirect 가 시작되지 않는다.', async () => {
    render(<GoogleLoginButton onError={jest.fn()} disabled />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockGoogleLogin).not.toHaveBeenCalled();
  });

  test('연속 클릭 시 redirect 시작 직후 추가 호출은 무시된다 (이중 호출 가드).', async () => {
    let resolveLogin;
    mockGoogleLogin.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    render(<GoogleLoginButton onError={jest.fn()} label="Google로 계속" />);

    const button = screen.getByRole('button', { name: /Google로 계속/ });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
    });

    if (resolveLogin) {
      resolveLogin();
    }
  });
});

// 참고: client id 미주입 가드(`isGoogleWebClientIdConfigured === false`) 테스트는
// jest.resetModules + doMock 조합 시 React 인스턴스 분리로 hooks 호출이 깨지므로,
// 가드 분기 검증은 별도 격리 환경(`__tests__/GoogleLoginButton.guard.test.js`) 에서 수행한다.
