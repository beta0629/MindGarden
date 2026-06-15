/**
 * PublicHeader 단위 테스트
 *
 * - 로고·네비게이션 링크·CTA 렌더링
 * - mg-v2-* 토큰 클래스 사용 검증
 * - 접근성 (aria-label, role)
 * - 모바일 햄버거 토글
 *
 * @author MindGarden
 * @since 2026-06-15
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

const PublicHeader = require('../atoms/PublicHeader').default;

const renderHeader = () =>
  render(
    <MemoryRouter>
      <PublicHeader />
    </MemoryRouter>
  );

describe('PublicHeader', () => {
  it('renders logo with MindGarden text', () => {
    renderHeader();
    expect(screen.getByText('MindGarden')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderHeader();
    const nav = screen.getByRole('banner');
    expect(nav).toBeInTheDocument();
  });

  it('uses mg-v2-public-header class', () => {
    const { container } = renderHeader();
    const header = container.querySelector('.mg-v2-public-header');
    expect(header).toBeInTheDocument();
  });

  it('has accessible logo link with aria-label', () => {
    renderHeader();
    const logo = screen.getByLabelText('MindGarden Home');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders hamburger button with aria attributes', () => {
    renderHeader();
    const hamburger = screen.getByLabelText(/toggle menu/i);
    expect(hamburger).toBeInTheDocument();
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    expect(hamburger).toHaveAttribute('aria-controls', 'public-mobile-menu');
  });

  it('toggles mobile menu on hamburger click', () => {
    renderHeader();
    const hamburger = screen.getByLabelText(/toggle menu/i);
    
    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    
    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders login and CTA buttons', () => {
    renderHeader();
    expect(screen.getAllByText(/login/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/get started/i).length).toBeGreaterThanOrEqual(1);
  });

  it('has focus-visible styles on nav links (class exists)', () => {
    const { container } = renderHeader();
    const navLinks = container.querySelectorAll('.mg-v2-public-header__nav-link');
    expect(navLinks.length).toBeGreaterThan(0);
  });
});
