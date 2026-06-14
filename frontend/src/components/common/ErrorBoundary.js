/**
 * ErrorBoundary — 최상위 React 에러 경계 (P0)
 *
 * 목적:
 *  - React 트리에서 렌더/라이프사이클/이벤트 핸들러 이외 동기 코드의 에러를 잡아
 *    화이트 스크린(white-screen) 노출을 차단한다.
 *  - 사용자에게 마인드가든 톤의 임시 폴백 화면을 제공하고, 새로고침/홈 이동 액션을 노출한다.
 *  - 옵션: 글로벌 Sentry SDK 또는 외부 webhook(Discord 등)으로 에러 리포트를 전송한다.
 *
 * 디자인 메모:
 *  - 본 화면은 디자인 v2 전 "임시" 폴백 UI 다. mindgarden 디자인 토큰(--mg-*)만 사용하고
 *    하드코딩된 색상·간격·폰트를 추가하지 않는다.
 *  - i18n 도입 전 단계이므로 메시지는 컴포넌트 상단 상수(FALLBACK_TEXT)로 SSOT 화하여
 *    추후 i18n 마이그 시 한 곳만 교체하면 된다.
 *
 * 환경변수 (옵션):
 *  - REACT_APP_ERROR_REPORT_WEBHOOK_URL: 설정 시 에러 발생 직후 JSON POST 리포트 전송
 *
 * 외부 SDK (옵션):
 *  - window.Sentry?.captureException 가 존재할 때만 호출 (Sentry 의존성 강제 없음)
 *
 * 사용 예:
 *  <ErrorBoundary>
 *    <App />
 *  </ErrorBoundary>
 *
 * @author MindGarden
 * @since 2026-06-14
 */

import React from 'react';

import './ErrorBoundary.css';

/**
 * 폴백 UI 메시지 SSOT.
 * i18n 정책 도입 후에는 i18n 키로 치환한다.
 */
const FALLBACK_TEXT = Object.freeze({
  TITLE: '오류가 발생했습니다',
  DESCRIPTION: '잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.',
  RETRY_LABEL: '새로고침',
  HOME_LABEL: '홈으로 이동',
  DETAILS_SUMMARY: '에러 상세 정보 (개발 모드)'
});

const ERROR_REPORT_WEBHOOK_URL =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ERROR_REPORT_WEBHOOK_URL) ||
  '';

const IS_DEV =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';

/**
 * Sentry SDK 가 글로벌로 로드되어 있을 때만 안전하게 캡쳐한다.
 * Sentry 가 없으면 noop.
 *
 * @param {Error} error
 * @param {{ componentStack?: string }} errorInfo
 */
function reportToSentryIfAvailable(error, errorInfo) {
  try {
    if (
      typeof window !== 'undefined' &&
      window.Sentry &&
      typeof window.Sentry.captureException === 'function'
    ) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo && errorInfo.componentStack ? errorInfo.componentStack : null
          }
        }
      });
    }
  } catch (_sentryErr) {
    // Sentry 자체 실패는 무시 (사용자 폴백이 우선)
  }
}

/**
 * 외부 webhook (Discord 등) 으로 에러 리포트를 비동기 전송한다.
 * 환경변수가 비어 있으면 호출하지 않는다.
 *
 * @param {Error} error
 * @param {{ componentStack?: string }} errorInfo
 */
function reportToWebhookIfConfigured(error, errorInfo) {
  if (!ERROR_REPORT_WEBHOOK_URL) {
    return;
  }
  try {
    const payload = {
      source: 'frontend-error-boundary',
      message: (error && error.message) || String(error),
      stack: error && error.stack ? error.stack : null,
      componentStack:
        errorInfo && errorInfo.componentStack ? errorInfo.componentStack : null,
      url: typeof window !== 'undefined' && window.location ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      timestamp: new Date().toISOString()
    };
    if (typeof fetch === 'function') {
      fetch(ERROR_REPORT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {
        // 네트워크 실패는 무시 (사용자 폴백이 우선)
      });
    }
  } catch (_webhookErr) {
    // 리포트 직렬화 실패는 무시
  }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
    this.handleReload = this.handleReload.bind(this);
    this.handleGoHome = this.handleGoHome.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    try {
      // eslint-disable-next-line no-console
      console.error(
        '[ErrorBoundary] React 트리에서 처리되지 않은 에러가 발생했습니다.',
        error,
        errorInfo
      );
    } catch (_logErr) {
      // console 자체 실패는 무시
    }

    reportToSentryIfAvailable(error, errorInfo);
    reportToWebhookIfConfigured(error, errorInfo);

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (_callbackErr) {
        // 콜백 실패는 무시 (폴백 화면 노출이 우선)
      }
    }
  }

  handleReload() {
    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
      window.location.reload();
    }
  }

  handleGoHome() {
    if (typeof window !== 'undefined' && window.location && typeof window.location.assign === 'function') {
      window.location.assign('/');
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;
    const { fallback } = this.props;

    if (typeof fallback === 'function') {
      try {
        return fallback({
          error,
          errorInfo,
          onReload: this.handleReload,
          onGoHome: this.handleGoHome
        });
      } catch (_fallbackErr) {
        // 커스텀 fallback 렌더링이 실패하면 기본 폴백으로 폴백
      }
    }

    return (
      <section
        className="mg-error-boundary"
        role="alert"
        aria-live="assertive"
        data-testid="mg-error-boundary"
      >
        <div className="mg-error-boundary__card">
          <div className="mg-error-boundary__icon" aria-hidden="true">!</div>
          <h1 className="mg-error-boundary__title">{FALLBACK_TEXT.TITLE}</h1>
          <p className="mg-error-boundary__description">{FALLBACK_TEXT.DESCRIPTION}</p>
          <div className="mg-error-boundary__actions">
            <button
              type="button"
              className="mg-error-boundary__btn mg-error-boundary__btn--primary"
              onClick={this.handleReload}
            >
              {FALLBACK_TEXT.RETRY_LABEL}
            </button>
            <button
              type="button"
              className="mg-error-boundary__btn mg-error-boundary__btn--secondary"
              onClick={this.handleGoHome}
            >
              {FALLBACK_TEXT.HOME_LABEL}
            </button>
          </div>

          {IS_DEV && error ? (
            <details className="mg-error-boundary__details">
              <summary>{FALLBACK_TEXT.DETAILS_SUMMARY}</summary>
              <pre className="mg-error-boundary__stack">
{error && error.message ? error.message : String(error)}
{error && error.stack ? `\n${error.stack}` : ''}
{errorInfo && errorInfo.componentStack ? errorInfo.componentStack : ''}
              </pre>
            </details>
          ) : null}
        </div>
      </section>
    );
  }
}

ErrorBoundary.defaultProps = {
  children: null,
  fallback: null,
  onError: null
};

export default ErrorBoundary;
export { FALLBACK_TEXT };
