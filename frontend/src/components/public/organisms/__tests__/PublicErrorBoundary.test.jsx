/**
 * PublicErrorBoundary 단위 테스트
 *
 * - 정상 children 렌더링
 * - 에러 throw 시 fallback UI 표시
 * - Primary CTA (retry/home) 동작
 * - onError 콜백 호출
 * - 커스텀 title/description 슬롯
 * - role="alert" 접근성
 *
 * @author MindGarden
 * @since 2026-06-15
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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

const PublicErrorBoundary = require('../PublicErrorBoundary').default;
const { DEFAULT_FALLBACK_TEXT } = require('../PublicErrorBoundary');

const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
};

const renderWithBoundary = (props = {}, childProps = {}) => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const result = render(
    <PublicErrorBoundary {...props}>
      <ThrowError shouldThrow={childProps.shouldThrow || false} />
    </PublicErrorBoundary>
  );
  return { ...result, consoleSpy };
};

describe('PublicErrorBoundary', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error', () => {
    renderWithBoundary();
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('does not show fallback when no error', () => {
    renderWithBoundary();
    expect(screen.queryByTestId('mg-v2-public-error-boundary')).not.toBeInTheDocument();
  });

  it('shows fallback UI on error', () => {
    renderWithBoundary({}, { shouldThrow: true });
    expect(screen.getByTestId('mg-v2-public-error-boundary')).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_FALLBACK_TEXT.TITLE)).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_FALLBACK_TEXT.DESCRIPTION)).toBeInTheDocument();
  });

  it('has role=alert on fallback', () => {
    renderWithBoundary({}, { shouldThrow: true });
    const el = screen.getByTestId('mg-v2-public-error-boundary');
    expect(el).toHaveAttribute('role', 'alert');
  });

  it('has aria-live=assertive on fallback', () => {
    renderWithBoundary({}, { shouldThrow: true });
    const el = screen.getByTestId('mg-v2-public-error-boundary');
    expect(el).toHaveAttribute('aria-live', 'assertive');
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    renderWithBoundary({ onError }, { shouldThrow: true });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('shows retry as primary CTA by default', () => {
    renderWithBoundary({}, { shouldThrow: true });
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent(DEFAULT_FALLBACK_TEXT.RETRY_LABEL);
    expect(buttons[1]).toHaveTextContent(DEFAULT_FALLBACK_TEXT.HOME_LABEL);
  });

  it('shows home as primary CTA when primaryCta="home"', () => {
    renderWithBoundary({ primaryCta: 'home' }, { shouldThrow: true });
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent(DEFAULT_FALLBACK_TEXT.HOME_LABEL);
    expect(buttons[1]).toHaveTextContent(DEFAULT_FALLBACK_TEXT.RETRY_LABEL);
  });

  it('retry button resets error state and re-renders children', () => {
    let shouldThrow = true;
    const ThrowOnce = () => {
      if (shouldThrow) {
        throw new Error('One-time error');
      }
      return <div>Recovered content</div>;
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <PublicErrorBoundary>
        <ThrowOnce />
      </PublicErrorBoundary>
    );

    expect(screen.getByTestId('mg-v2-public-error-boundary')).toBeInTheDocument();

    shouldThrow = false;
    const retryBtn = screen.getByText(DEFAULT_FALLBACK_TEXT.RETRY_LABEL);
    fireEvent.click(retryBtn);

    rerender(
      <PublicErrorBoundary>
        <ThrowOnce />
      </PublicErrorBoundary>
    );

    expect(screen.queryByTestId('mg-v2-public-error-boundary')).not.toBeInTheDocument();
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('renders custom fallbackTitleSlot', () => {
    renderWithBoundary(
      { fallbackTitleSlot: 'Custom Title' },
      { shouldThrow: true }
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders custom fallbackDescriptionSlot', () => {
    renderWithBoundary(
      { fallbackDescriptionSlot: 'Custom description text' },
      { shouldThrow: true }
    );
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('home button navigates to root', () => {
    const assignMock = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { assign: assignMock },
      writable: true,
    });

    renderWithBoundary({ primaryCta: 'home' }, { shouldThrow: true });
    const homeBtn = screen.getByText(DEFAULT_FALLBACK_TEXT.HOME_LABEL);
    fireEvent.click(homeBtn);

    expect(assignMock).toHaveBeenCalledWith('/');
  });
});
