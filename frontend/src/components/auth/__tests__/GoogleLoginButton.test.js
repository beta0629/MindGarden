/**
 * GoogleLoginButton — `@react-oauth/google` mock 기반 단위 테스트.
 *
 * `useGoogleLogin` 의 success/error 콜백을 모사하여 onSuccess/onError prop 으로 흘러가는지,
 * implicit 흐름 응답에서 accessToken 추출이 정확한지 검증한다.
 *
 * @author MindGarden
 * @since 2026-06-10
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

const mockUseGoogleLogin = jest.fn();

jest.mock('@react-oauth/google', () => ({
  __esModule: true,
  useGoogleLogin: (config) => mockUseGoogleLogin(config)
}));

jest.mock('../../../constants/oauth2', () => ({
  __esModule: true,
  isGoogleWebClientIdConfigured: true,
  GOOGLE_WEB_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
  OAUTH2_LOGIN_UI: {}
}));

const GoogleLoginButton = require('../GoogleLoginButton').default;

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    mockUseGoogleLogin.mockReset();
  });

  test('onSuccess 콜백이 access_token 을 추출하여 prop 으로 전달한다.', () => {
    let capturedConfig;
    mockUseGoogleLogin.mockImplementation((config) => {
      capturedConfig = config;
      return jest.fn();
    });

    const onSuccess = jest.fn();
    render(<GoogleLoginButton onSuccess={onSuccess} onError={jest.fn()} />);

    expect(capturedConfig).toBeDefined();
    expect(capturedConfig.flow).toBe('implicit');

    capturedConfig.onSuccess({
      access_token: '  ya29.access  ',
      scope: 'openid email profile',
      token_type: 'Bearer',
      expires_in: 3599
    });

    expect(onSuccess).toHaveBeenCalledWith({
      accessToken: 'ya29.access',
      idToken: null,
      scope: 'openid email profile'
    });
  });

  test('access_token 이 비어 있으면 onError 로 사용자 친화 메시지가 전달된다.', () => {
    let capturedConfig;
    mockUseGoogleLogin.mockImplementation((config) => {
      capturedConfig = config;
      return jest.fn();
    });

    const onSuccess = jest.fn();
    const onError = jest.fn();
    render(<GoogleLoginButton onSuccess={onSuccess} onError={onError} />);

    capturedConfig.onSuccess({ access_token: '   ' });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toMatch(/토큰을 찾을 수 없습니다/);
  });

  test('GIS onError 호출 시 description 이 onError prop 으로 전달된다.', () => {
    let capturedConfig;
    mockUseGoogleLogin.mockImplementation((config) => {
      capturedConfig = config;
      return jest.fn();
    });

    const onError = jest.fn();
    render(<GoogleLoginButton onSuccess={jest.fn()} onError={onError} />);

    capturedConfig.onError({ error: 'access_denied', error_description: '사용자 거부' });
    expect(onError).toHaveBeenCalledWith('사용자 거부');
  });

  test('버튼 클릭 시 useGoogleLogin trigger 가 호출된다.', () => {
    const triggerMock = jest.fn();
    mockUseGoogleLogin.mockReturnValueOnce(triggerMock);

    render(<GoogleLoginButton onSuccess={jest.fn()} onError={jest.fn()} label="Google로 로그인" />);

    const button = screen.getByRole('button', { name: /Google로 로그인/ });
    fireEvent.click(button);
    expect(triggerMock).toHaveBeenCalledTimes(1);
  });
});
