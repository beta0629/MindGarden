import React from 'react';
import { API_PERFORMANCE_WIDGET } from '../../../constants/widgetConstants';
import { toDisplayString } from '../../../utils/safeDisplay';

const AI_LOG_MESSAGES = API_PERFORMANCE_WIDGET.MESSAGES;
const DISPLAY_FALLBACK = '—';

const resolveSuccessRateColor = (successRate) => {
  if (successRate >= 95) return 'var(--mg-success-500, var(--mg-color-success-main))';
  if (successRate >= 80) return 'var(--mg-warning-500, var(--mg-color-warning-main))';
  return 'var(--mg-error-500, var(--mg-color-error-main))';
};

const resolveDurationColor = (averageDurationMs) => {
  if (averageDurationMs < 2000) return 'var(--mg-success-500, var(--mg-color-success-main))';
  if (averageDurationMs < 5000) return 'var(--mg-warning-500, var(--mg-color-warning-main))';
  return 'var(--mg-error-500, var(--mg-color-error-main))';
};

/**
 * AI 로그 모니터링 지표 위젯 (Today 구간).
 * callsToday===0 이면 빈 상태 안내를 표시한다.
 *
 * @param {{ loading: boolean, error: boolean, stats: object|null }} props
 */
const AiLogMonitorWidget = ({ loading, error, stats }) => {
  if (loading) {
    return (
      <div className="mg-v2-ad-b0kla__kpi-row api-perf-summary api-perf-summary--loading">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
            <div className="api-perf-summary__bar" />
            <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">
              {toDisplayString(AI_LOG_MESSAGES.AI_LOG_LOADING, DISPLAY_FALLBACK)}
            </span>
            <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value">
              {DISPLAY_FALLBACK}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="api-perf-ai-log__error" role="alert">
        {toDisplayString(AI_LOG_MESSAGES.AI_LOG_ERROR, DISPLAY_FALLBACK)}
        <br />
        <span className="api-perf-ai-log__error-hint">
          {toDisplayString(AI_LOG_MESSAGES.AI_LOG_API_HINT, DISPLAY_FALLBACK)}
        </span>
      </div>
    );
  }

  const callsToday = Number(stats.callsToday) || 0;
  const isEmptyToday = callsToday === 0;
  const successRateLabel = stats.successRate != null
    ? `${toDisplayString(stats.successRate, '0')}%`
    : DISPLAY_FALLBACK;
  const durationLabel = stats.averageDurationMs != null
    ? `${toDisplayString(stats.averageDurationMs, '0')}ms`
    : DISPLAY_FALLBACK;
  const tokensLabel = toDisplayString(
    stats.totalTokens != null ? Number(stats.totalTokens).toLocaleString() : 0,
    '0'
  );

  return (
    <div className="api-perf-ai-log">
      {isEmptyToday && (
        <div className="api-perf-ai-log__empty" data-testid="ai-log-empty-state" role="status">
          <p className="api-perf-ai-log__empty-title">
            {toDisplayString(AI_LOG_MESSAGES.AI_LOG_EMPTY_TITLE, DISPLAY_FALLBACK)}
          </p>
          <p className="api-perf-ai-log__empty-hint">
            {toDisplayString(AI_LOG_MESSAGES.AI_LOG_EMPTY_HINT, DISPLAY_FALLBACK)}
          </p>
        </div>
      )}
      <div className="mg-v2-ad-b0kla__kpi-row api-perf-summary">
        <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
          <div className="api-perf-summary__bar" />
          <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">
            {toDisplayString(AI_LOG_MESSAGES.AI_LOG_CALLS_TODAY, DISPLAY_FALLBACK)}
          </span>
          <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value">
            {`${toDisplayString(callsToday.toLocaleString(), '0')}건`}
          </span>
        </div>
        <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
          <div className="api-perf-summary__bar" />
          <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">
            {toDisplayString(AI_LOG_MESSAGES.AI_LOG_SUCCESS_RATE, DISPLAY_FALLBACK)}
          </span>
          <span
            className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value"
            style={stats.successRate != null ? { color: resolveSuccessRateColor(stats.successRate) } : undefined}
          >
            {successRateLabel}
          </span>
        </div>
        <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
          <div className="api-perf-summary__bar" />
          <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">
            {toDisplayString(AI_LOG_MESSAGES.AI_LOG_AVG_DURATION, DISPLAY_FALLBACK)}
          </span>
          <span
            className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value"
            style={stats.averageDurationMs != null ? { color: resolveDurationColor(stats.averageDurationMs) } : undefined}
          >
            {durationLabel}
          </span>
        </div>
        <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
          <div className="api-perf-summary__bar" />
          <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">
            {toDisplayString(AI_LOG_MESSAGES.AI_LOG_TOTAL_TOKENS, DISPLAY_FALLBACK)}
          </span>
          <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value api-perf-summary__value--neutral">
            {tokensLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AiLogMonitorWidget;
