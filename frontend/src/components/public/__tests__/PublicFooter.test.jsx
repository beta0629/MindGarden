/**
 * PublicFooter 단위 테스트
 *
 * - 회사 정보 렌더링
 * - 법적 링크 (privacy, terms, account-deletion)
 * - mg-v2-* 토큰 클래스 사용 검증
 * - 접근성 (role=contentinfo, aria-label)
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

const PublicFooter = require('../atoms/PublicFooter').default;

const renderFooter = () =>
  render(
    <MemoryRouter>
      <PublicFooter />
    </MemoryRouter>
  );

describe('PublicFooter', () => {
  it('renders with contentinfo role', () => {
    renderFooter();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays Core Solution company name', () => {
    renderFooter();
    expect(screen.getByText('Core Solution')).toBeInTheDocument();
  });

  it('displays business registration number', () => {
    renderFooter();
    expect(screen.getByText(/767-18-02393/)).toBeInTheDocument();
  });

  it('renders email link', () => {
    renderFooter();
    const emailLink = screen.getByText('support@core-solution.co.kr');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:support@core-solution.co.kr');
  });

  it('uses mg-v2-public-footer class', () => {
    const { container } = renderFooter();
    expect(container.querySelector('.mg-v2-public-footer')).toBeInTheDocument();
  });

  it('renders copyright with current year', () => {
    renderFooter();
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('has legal navigation with aria-label', () => {
    renderFooter();
    const legalNav = screen.getByLabelText(/legal/i);
    expect(legalNav).toBeInTheDocument();
  });
});
