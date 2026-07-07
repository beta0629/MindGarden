/**
 * App 스모크 테스트 — 상위 Provider·라우트가 마운트되는지 확인
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';

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
  test('루트(/)에서 Phase 3 Public Main Homepage가 렌더된다', async() => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelector('.mg-v2-homepage')).toBeInTheDocument();
      expect(container.querySelector('.mg-v2-homepage-hero__headline')).toBeInTheDocument();
    });
    expect(container.querySelector('.mg-v2-landing-template')).not.toBeInTheDocument();
    expect(container.querySelector('.mg-v2-landing-hero')).not.toBeInTheDocument();

    errSpy.mockRestore();
  });

  test('/landing은 / 로 리다이렉트되어 Homepage가 렌더된다', async() => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    window.history.pushState({}, '', '/landing');

    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelector('.mg-v2-homepage')).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/');
    expect(container.querySelector('.mg-v2-landing-template')).not.toBeInTheDocument();

    errSpy.mockRestore();
  });

  describe('admin orphan redirects (CLN-01)', () => {
    const redirectCases = [
      ['/admin/sessions', '/admin/mapping-management'],
      ['/admin/schedules', '/admin/integrated-schedule'],
      ['/admin/schedule', '/admin/integrated-schedule'],
      ['/admin/dashboards', '/admin/dashboard'],
      ['/admin/statistics', '/admin/dashboard']
    ];

    test.each(redirectCases)('%s → %s', async(from, to) => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      window.history.pushState({}, '', from);

      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe(to);
      });

      errSpy.mockRestore();
    });

    test('/admin/schedules?consultantId=1 preserves query string', async() => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      window.history.pushState({}, '', '/admin/schedules?consultantId=1&clientId=2');

      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/admin/integrated-schedule');
        expect(window.location.search).toBe('?consultantId=1&clientId=2');
      });

      errSpy.mockRestore();
    });
  });
});
