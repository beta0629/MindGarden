/**
 * App 스모크 테스트 — 상위 Provider·라우트가 마운트되는지 확인
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }
}));

jest.mock('./hooks/useTenantBranding', () => ({
  useTenantBranding: () => ({
    hasCustomBranding: false,
    companyName: '',
    primaryColor: ''
  })
}));

jest.mock('./utils/unifiedLayoutSystem', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    applyLayout: jest.fn()
  }
}));

jest.mock('./utils/designSystemHelper', () => ({
  initializeDynamicThemeSystem: jest.fn()
}));

import App from './App';

describe('App', () => {
  test('루트 경로에서 앱이 마운트되고 홈 관련 UI가 보인다', async() => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    const loginHits = await screen.findAllByText('로그인');
    expect(loginHits.length).toBeGreaterThan(0);

    errSpy.mockRestore();
  });
});
