/**
 * GoogleLoginButton — client id 미주입 가드 분기 격리 테스트.
 *
 * <p>본 테스트는 `isGoogleWebClientIdConfigured === false` 환경에서 컴포넌트가 null 을
 * 반환하는지(=버튼 비표시) 만 검증한다. 메인 흐름 테스트와 분리한 이유는 mock 값을
 * 다르게 두려면 module 단위 격리가 필요하고, 한 파일에 둘 다 있으면 jest.resetModules +
 * doMock 조합에서 React 인스턴스 분리로 hook 호출이 깨지기 때문이다.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('../../../constants/oauth2', () => ({
  __esModule: true,
  isGoogleWebClientIdConfigured: false,
  GOOGLE_WEB_CLIENT_ID: '',
  OAUTH2_LOGIN_UI: {}
}));

jest.mock('../../../utils/socialLogin', () => ({
  __esModule: true,
  googleLogin: jest.fn(),
  kakaoLogin: jest.fn(),
  naverLogin: jest.fn()
}));

describe('GoogleLoginButton — client id 미주입 가드', () => {
  test('isGoogleWebClientIdConfigured 가 false 이면 버튼이 렌더되지 않는다.', () => {
    const GoogleLoginButton = require('../GoogleLoginButton').default;
    const { container } = render(<GoogleLoginButton onError={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
