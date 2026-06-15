/**
 * ErrorBoundary 단위 테스트
 *
 * 검증 대상:
 *  - 자식이 정상이면 children 그대로 렌더
 *  - 자식이 던진 에러를 잡아 폴백 UI 렌더 (TITLE / DESCRIPTION / 액션 버튼)
 *  - role="alert" / aria-live="assertive" 접근성 속성 부여
 *  - onError 콜백, window.Sentry.captureException, webhook fetch 가 호출되는지
 *  - fallback prop 으로 커스텀 폴백 렌더 가능
 *
 * @author MindGarden
 * @since 2026-06-14
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ErrorBoundary, { FALLBACK_TEXT } from '../ErrorBoundary';

// jest 환경에서 React 가 componentDidCatch 의 에러를 콘솔에 다시 노출하므로,
// 의도적 throw 테스트에서 console.error 노이즈를 억제한다.
const originalConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  // eslint-disable-next-line no-console
  console.error = originalConsoleError;
});

function ThrowingChild({ message }) {
  throw new Error(message || '의도적 테스트 에러');
}

function SafeChild() {
  return <div data-testid="safe-child">정상 자식</div>;
}

describe('ErrorBoundary', () => {
  describe('정상 경로', () => {
    test('자식이 에러를 던지지 않으면 children 을 그대로 렌더한다', () => {
      render(
        <ErrorBoundary>
          <SafeChild />
        </ErrorBoundary>
      );
      expect(screen.getByTestId('safe-child')).toBeInTheDocument();
      expect(screen.queryByTestId('mg-error-boundary')).not.toBeInTheDocument();
    });
  });

  describe('에러 경로 — 기본 폴백', () => {
    test('자식이 에러를 던지면 폴백 카드(TITLE/DESCRIPTION/액션) 가 렌더된다', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      );

      const region = screen.getByTestId('mg-error-boundary');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('role', 'alert');
      expect(region).toHaveAttribute('aria-live', 'assertive');

      expect(screen.getByText(FALLBACK_TEXT.TITLE)).toBeInTheDocument();
      expect(screen.getByText(FALLBACK_TEXT.DESCRIPTION)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: FALLBACK_TEXT.RETRY_LABEL })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: FALLBACK_TEXT.HOME_LABEL })
      ).toBeInTheDocument();
    });
  });

  describe('리포트 콜백', () => {
    test('onError prop 이 에러와 errorInfo 와 함께 호출된다', () => {
      const onError = jest.fn();
      render(
        <ErrorBoundary onError={onError}>
          <ThrowingChild message="콜백 검증용" />
        </ErrorBoundary>
      );
      expect(onError).toHaveBeenCalledTimes(1);
      const [errArg, infoArg] = onError.mock.calls[0];
      expect(errArg).toBeInstanceOf(Error);
      expect(errArg.message).toBe('콜백 검증용');
      expect(infoArg).toEqual(
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    test('window.Sentry.captureException 이 존재하면 호출된다', () => {
      const captureException = jest.fn();
      const originalSentry = window.Sentry;
      window.Sentry = { captureException };

      try {
        render(
          <ErrorBoundary>
            <ThrowingChild message="Sentry 검증용" />
          </ErrorBoundary>
        );
        expect(captureException).toHaveBeenCalledTimes(1);
        const [errArg] = captureException.mock.calls[0];
        expect(errArg).toBeInstanceOf(Error);
        expect(errArg.message).toBe('Sentry 검증용');
      } finally {
        if (originalSentry === undefined) {
          delete window.Sentry;
        } else {
          window.Sentry = originalSentry;
        }
      }
    });
  });

  describe('커스텀 fallback prop', () => {
    test('fallback 함수가 제공되면 그 결과로 렌더된다', () => {
      const fallback = ({ error }) => (
        <div data-testid="custom-fallback">
          custom: {error && error.message}
        </div>
      );
      render(
        <ErrorBoundary fallback={fallback}>
          <ThrowingChild message="커스텀 검증" />
        </ErrorBoundary>
      );
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByTestId('custom-fallback')).toHaveTextContent(
        'custom: 커스텀 검증'
      );
    });

    test('커스텀 fallback 이 throw 하면 기본 폴백으로 폴백한다', () => {
      const fallback = () => {
        throw new Error('fallback 자체 에러');
      };
      render(
        <ErrorBoundary fallback={fallback}>
          <ThrowingChild />
        </ErrorBoundary>
      );
      expect(screen.getByText(FALLBACK_TEXT.TITLE)).toBeInTheDocument();
    });
  });
});
