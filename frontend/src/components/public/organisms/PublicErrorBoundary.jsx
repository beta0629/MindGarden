/**
 * PublicErrorBoundary — 공개 페이지 전용 에러 경계 Organism
 *
 * React Error Boundary 패턴 (class component).
 * PublicLayout과 정합: 헤더·푸터 유지 + 본문 영역만 fallback 노출.
 * 어드민용 ErrorBoundary (common/ErrorBoundary.js)와 완전 분리.
 *
 * mg-v2-* 토큰 100% · 하드코딩 0 · 다크 모드 자동 지원
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React from 'react';
import PropTypes from 'prop-types';
import './PublicErrorBoundary.css';

const DEFAULT_FALLBACK_TEXT = Object.freeze({
  TITLE: '문제가 발생했습니다',
  DESCRIPTION: '잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터에 문의해주세요.',
  RETRY_LABEL: '다시 시도',
  HOME_LABEL: '홈으로',
});

class PublicErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.handleRetry = this.handleRetry.bind(this);
    this.handleGoHome = this.handleGoHome.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (_callbackErr) {
        // 외부 콜백 실패는 무시 (폴백 화면 노출 우선)
      }
    }
  }

  handleRetry() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  handleGoHome() {
    if (typeof window !== 'undefined' && window.location) {
      window.location.assign('/');
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { fallbackTitleSlot, fallbackDescriptionSlot, primaryCta } = this.props;

    const title = fallbackTitleSlot || DEFAULT_FALLBACK_TEXT.TITLE;
    const description = fallbackDescriptionSlot || DEFAULT_FALLBACK_TEXT.DESCRIPTION;

    const isPrimaryHome = primaryCta === 'home';
    const primaryLabel = isPrimaryHome
      ? DEFAULT_FALLBACK_TEXT.HOME_LABEL
      : DEFAULT_FALLBACK_TEXT.RETRY_LABEL;
    const primaryHandler = isPrimaryHome ? this.handleGoHome : this.handleRetry;
    const secondaryLabel = isPrimaryHome
      ? DEFAULT_FALLBACK_TEXT.RETRY_LABEL
      : DEFAULT_FALLBACK_TEXT.HOME_LABEL;
    const secondaryHandler = isPrimaryHome ? this.handleRetry : this.handleGoHome;

    return (
      <section
        className="mg-v2-public-error-boundary"
        role="alert"
        aria-live="assertive"
        data-testid="mg-v2-public-error-boundary"
      >
        <div className="mg-v2-public-error-boundary__card">
          <div className="mg-v2-public-error-boundary__icon" aria-hidden="true">
            !
          </div>
          <h2 className="mg-v2-public-error-boundary__title">{title}</h2>
          <p className="mg-v2-public-error-boundary__description">{description}</p>
          <div className="mg-v2-public-error-boundary__actions">
            <button
              type="button"
              className="mg-v2-public-error-boundary__btn mg-v2-public-error-boundary__btn--primary"
              onClick={primaryHandler}
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              className="mg-v2-public-error-boundary__btn mg-v2-public-error-boundary__btn--secondary"
              onClick={secondaryHandler}
            >
              {secondaryLabel}
            </button>
          </div>
        </div>
      </section>
    );
  }
}

PublicErrorBoundary.propTypes = {
  children: PropTypes.node,
  fallbackTitleSlot: PropTypes.node,
  fallbackDescriptionSlot: PropTypes.node,
  primaryCta: PropTypes.oneOf(['home', 'retry']),
  onError: PropTypes.func,
};

PublicErrorBoundary.defaultProps = {
  children: null,
  fallbackTitleSlot: null,
  fallbackDescriptionSlot: null,
  primaryCta: 'retry',
  onError: null,
};

export default PublicErrorBoundary;
export { DEFAULT_FALLBACK_TEXT };
