/**
 * PublicLayout 단위 테스트
 *
 * - PublicHeader + children + PublicFooter 구조 검증
 * - mg-v2-* 토큰 클래스 사용 검증
 * - role=main 접근성
 *
 * @author MindGarden
 * @since 2026-06-15
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }
}));

const PublicLayout = require('../layouts/PublicLayout').default;

const renderLayout = (children) =>
  render(
    <MemoryRouter>
      <PublicLayout>{children}</PublicLayout>
    </MemoryRouter>
  );

describe('PublicLayout', () => {
  it('renders children inside main content area', () => {
    renderLayout(<p>Test Content</p>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('has role=main on content area', () => {
    renderLayout(<p>Content</p>);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders header (banner) and footer (contentinfo)', () => {
    renderLayout(<p>Content</p>);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('uses mg-v2-public-layout class', () => {
    const { container } = renderLayout(<p>Content</p>);
    expect(container.querySelector('.mg-v2-public-layout')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MemoryRouter>
        <PublicLayout className="custom-test-class"><p>Content</p></PublicLayout>
      </MemoryRouter>
    );
    expect(container.querySelector('.mg-v2-public-layout.custom-test-class')).toBeInTheDocument();
  });
});
