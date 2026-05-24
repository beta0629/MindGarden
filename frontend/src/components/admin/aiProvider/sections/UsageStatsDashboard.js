/**
 * §4. 사용 통계 대시보드 — 디자이너 §4.
 *
 * - 메트릭 카드 (오늘 / 이번 주 / 이번 달 / 성공률 / 평균 응답시간 / 총 토큰).
 * - 최근 30일 일별 호출 수를 단순 sparkline (CSS bar) 으로 표시 — 차트 라이브러리 무의존.
 * - provider/caller 분포는 단순 막대 (수평) 로 표시.
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React, { useMemo } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName } from '../../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../../utils/safeDisplay';
import UsageStatChip from '../molecules/UsageStatChip';
import {
  AI_PROVIDER_LABELS,
  PROVIDER_DISPLAY_LABEL
} from '../constants';

const formatNumber = (value) => {
  if (value == null || Number.isNaN(value)) return '0';
  return new Intl.NumberFormat('ko-KR').format(value);
};

const formatPercent = (value) => {
  if (value == null || Number.isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
};

const UsageStatsDashboard = ({
  stats,
  loading,
  error,
  onRefresh
}) => {
  const dailyMax = useMemo(() => {
    if (!stats?.dailyCalls30d?.length) return 0;
    return stats.dailyCalls30d.reduce((acc, row) => Math.max(acc, row.count || 0), 0);
  }, [stats]);

  const providerEntries = useMemo(() => {
    if (!stats?.callsByProvider) return [];
    return Object.entries(stats.callsByProvider).filter(([, count]) => count > 0);
  }, [stats]);

  const callerEntries = useMemo(() => {
    if (!stats?.callsByCaller) return [];
    return Object.entries(stats.callsByCaller);
  }, [stats]);

  const providerMax = providerEntries.reduce((acc, [, c]) => Math.max(acc, c), 0);
  const callerMax = callerEntries.reduce((acc, [, c]) => Math.max(acc, c), 0);

  const fallbackUnsupported = (stats?.fallbackUsageRate ?? -1) < 0;

  return (
    <section className="mg-ai-section mg-ai-usage-dashboard">
      <header className="mg-ai-section__header">
        <h2 className="mg-ai-section__title">
          <span className="mg-ai-section__accent" aria-hidden="true" />
          <BarChart3 size={18} aria-hidden="true" />
          {' '}사용 통계
        </h2>
        <MGButton
          type="button"
          variant="secondary"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'secondary',
            size: 'md',
            loading
          })}
          onClick={onRefresh}
          disabled={loading}
          loading={loading}
          loadingText="확인 중..."
          preventDoubleClick={false}
        >
          <RefreshCw size={14} aria-hidden="true" />
          {' '}새로고침
        </MGButton>
      </header>

      {error ? (
        <p className="mg-ai-section__empty mg-ai-section__empty--error">
          {toDisplayString(error)}
        </p>
      ) : null}

      <div className="mg-ai-usage-dashboard__chips">
        <UsageStatChip
          label={AI_PROVIDER_LABELS.callsToday}
          value={formatNumber(stats?.callsToday)}
          unit="회"
          accent="primary"
        />
        <UsageStatChip
          label={AI_PROVIDER_LABELS.callsThisWeek}
          value={formatNumber(stats?.callsThisWeek)}
          unit="회"
          accent="primary"
        />
        <UsageStatChip
          label={AI_PROVIDER_LABELS.callsThisMonth}
          value={formatNumber(stats?.callsThisMonth)}
          unit="회"
          accent="primary"
        />
        <UsageStatChip
          label={AI_PROVIDER_LABELS.successRate}
          value={formatPercent(stats?.successRate ?? 0)}
          accent="success"
        />
        <UsageStatChip
          label={AI_PROVIDER_LABELS.failureRate}
          value={formatPercent(stats?.failureRate ?? 0)}
          accent="danger"
        />
        <UsageStatChip
          label={AI_PROVIDER_LABELS.fallbackRate}
          value={fallbackUnsupported ? AI_PROVIDER_LABELS.fallbackUnsupported : formatPercent(stats?.fallbackUsageRate ?? 0)}
          accent="warning"
        />
        <UsageStatChip
          label={AI_PROVIDER_LABELS.averageDuration}
          value={formatNumber(stats?.averageDurationMs)}
          unit="ms"
          accent="neutral"
        />
        <UsageStatChip
          label={AI_PROVIDER_LABELS.totalTokens}
          value={formatNumber(stats?.totalTokens)}
          unit="tokens"
          accent="neutral"
        />
      </div>

      <div className="mg-ai-usage-dashboard__split">
        <div className="mg-ai-usage-dashboard__group">
          <h3 className="mg-ai-usage-dashboard__group-title">프로바이더 별 호출 수 (이번 달)</h3>
          {providerEntries.length === 0 ? (
            <p className="mg-ai-section__empty">{AI_PROVIDER_LABELS.emptyStateNoStats}</p>
          ) : (
            <ul className="mg-ai-usage-dashboard__bar-list">
              {providerEntries.map(([key, count]) => {
                const ratio = providerMax > 0 ? Math.round((count / providerMax) * 100) : 0;
                return (
                  <li key={key} className="mg-ai-usage-dashboard__bar-row">
                    <span className="mg-ai-usage-dashboard__bar-label">
                      {toDisplayString(PROVIDER_DISPLAY_LABEL[key] || key)}
                    </span>
                    <span className="mg-ai-usage-dashboard__bar-track" aria-hidden="true">
                      <span
                        className="mg-ai-usage-dashboard__bar-fill"
                        style={{ width: `${ratio}%` }}
                      />
                    </span>
                    <span className="mg-ai-usage-dashboard__bar-value">{formatNumber(count)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mg-ai-usage-dashboard__group">
          <h3 className="mg-ai-usage-dashboard__group-title">호출자(Caller) 별 호출 수 (이번 달)</h3>
          {callerEntries.length === 0 ? (
            <p className="mg-ai-section__empty">{AI_PROVIDER_LABELS.emptyStateNoStats}</p>
          ) : (
            <ul className="mg-ai-usage-dashboard__bar-list">
              {callerEntries.map(([key, count]) => {
                const ratio = callerMax > 0 ? Math.round((count / callerMax) * 100) : 0;
                return (
                  <li key={key} className="mg-ai-usage-dashboard__bar-row">
                    <span className="mg-ai-usage-dashboard__bar-label">{toDisplayString(key)}</span>
                    <span className="mg-ai-usage-dashboard__bar-track" aria-hidden="true">
                      <span
                        className="mg-ai-usage-dashboard__bar-fill mg-ai-usage-dashboard__bar-fill--caller"
                        style={{ width: `${ratio}%` }}
                      />
                    </span>
                    <span className="mg-ai-usage-dashboard__bar-value">{formatNumber(count)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mg-ai-usage-dashboard__sparkline" aria-label="최근 30일 호출 수">
        <h3 className="mg-ai-usage-dashboard__group-title">최근 30일 일별 호출 수</h3>
        <div className="mg-ai-usage-dashboard__sparkline-grid" role="img" aria-hidden="false">
          {(stats?.dailyCalls30d || []).map((row) => {
            const ratio = dailyMax > 0 ? Math.max(4, Math.round((row.count / dailyMax) * 100)) : 4;
            return (
              <span
                key={row.date}
                className="mg-ai-usage-dashboard__sparkline-bar"
                style={{ height: `${ratio}%` }}
                title={`${row.date}: ${formatNumber(row.count)}회`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UsageStatsDashboard;
