/**
 * AdminDashboardVisualizationGroup — 기간 pill + KPI(V6/V6b) + 예약/완료 차트 (v2)
 *
 * SSOT: docs/design-system/ADMIN_DASHBOARD_PERIOD_STATS_VIZ_SPEC.md
 *
 * @author CoreSolution
 * @since 2026-07-28
 */

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Chart from '../../common/Chart';
import MGButton from '../../common/MGButton';
import StatusBadge from '../../common/StatusBadge';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import {
  CHART_TYPES,
  B0KLA_CHART_BAR_FALLBACK,
  B0KLA_STATUS_SERIES_COLOR_VARS,
  DASHBOARD_VIZ_TARGET_COMPLETED
} from '../../../constants/charts';
import { resolveCssColorVarToHex } from '../../../utils/resolveCssColorVarToHex';
import { toSafeNumber, toDisplayString } from '../../../utils/safeDisplay';
import {
  DASHBOARD_CHART_PERIOD,
  formatChartPeriodLabel,
  isBookedCompletedAllZero,
  calcTargetAchievementPercent,
  resolveAutoYAxisMax,
  resolveGrowthBadgeState,
  resolvePeriodComparisonMetrics,
  resolveTrendRowsByPeriod
} from '../utils/dashboardChartPeriodUtils';
import './AdminDashboardVisualizationGroup.css';

/** 축·범례는 text-primary, 그리드는 border-default로 시리즈(진한 그린) 대비만 보강 */
const CHART_CANVAS_FALLBACK = Object.freeze({
  TICK: 'var(--mg-v2-color-text-primary)',
  GRID: 'var(--mg-v2-color-border-default)',
  TOOLTIP_BACKGROUND: 'var(--mg-v2-color-surface-raised)',
  TOOLTIP_TEXT: 'var(--mg-v2-color-text-primary)',
  LEGEND: 'var(--mg-v2-color-text-primary)'
});

const VIZ_PERIOD_OPTIONS = [
  { key: DASHBOARD_CHART_PERIOD.DAILY, labelKey: 'admin:dashboard.v2.period.daily' },
  { key: DASHBOARD_CHART_PERIOD.WEEKLY, labelKey: 'admin:dashboard.v2.period.weekly' },
  { key: DASHBOARD_CHART_PERIOD.MONTHLY, labelKey: 'admin:dashboard.v2.period.monthly' },
  { key: DASHBOARD_CHART_PERIOD.YEARLY, labelKey: 'admin:dashboard.v2.period.yearly' }
];

const STATUS_SERIES_LABEL_KEYS = Object.freeze({
  BOOKED: 'admin:dashboard.v2.viz.seriesBooked',
  COMPLETED: 'admin:dashboard.v2.viz.seriesCompleted'
});

const PERIOD_SUBTITLE_KEYS = Object.freeze({
  [DASHBOARD_CHART_PERIOD.DAILY]: 'admin:dashboard.v2.viz.subtitleDaily',
  [DASHBOARD_CHART_PERIOD.WEEKLY]: 'admin:dashboard.v2.viz.subtitleWeekly',
  [DASHBOARD_CHART_PERIOD.MONTHLY]: 'admin:dashboard.v2.viz.subtitleMonthly',
  [DASHBOARD_CHART_PERIOD.YEARLY]: 'admin:dashboard.v2.viz.subtitleYearly'
});

const PREVIOUS_PERIOD_LABEL_KEYS = Object.freeze({
  [DASHBOARD_CHART_PERIOD.DAILY]: 'admin:dashboard.v2.viz.previousDaily',
  [DASHBOARD_CHART_PERIOD.WEEKLY]: 'admin:dashboard.v2.viz.previousWeekly',
  [DASHBOARD_CHART_PERIOD.MONTHLY]: 'admin:dashboard.v2.viz.previousMonthly',
  [DASHBOARD_CHART_PERIOD.YEARLY]: 'admin:dashboard.v2.viz.previousYearly'
});

/** 주식창형: 상승=레드(danger), 하락=블루(info), 보합=neutral. 신규(fromZero)는 success. */
const GROWTH_BADGE_VARIANT = Object.freeze({
  up: 'danger',
  down: 'info',
  flat: 'neutral'
});

const GROWTH_BADGE_VARIANT_FROM_ZERO = 'success';

/**
 * @param {{ tone: 'up'|'down'|'flat', kind: 'percent'|'fromZero' }} badgeState
 * @returns {'success'|'danger'|'info'|'neutral'}
 */
function resolveGrowthBadgeVariant(badgeState) {
  if (badgeState.kind === 'fromZero') {
    return GROWTH_BADGE_VARIANT_FROM_ZERO;
  }
  return GROWTH_BADGE_VARIANT[badgeState.tone];
}

const CHART_HEIGHT = '200px';
const EMPTY_MESSAGE_KEY = 'admin:dashboard.v2.viz.emptyPeriod';
const PROGRESS_BAR_MAX_PERCENT = 100;

/**
 * V2/V3 empty — 아이콘 + 문구 (스펙 §5)
 *
 * @param {{ message: string }} props
 * @returns {JSX.Element}
 */
function VizChartEmpty({ message }) {
  return (
    <div className="mg-v2-ad-b0kla__chart-empty" data-testid="viz-chart-empty">
      <Icon
        name="BAR_CHART_3"
        size="XXXL"
        color="TRANSPARENT"
        className="mg-v2-ad-b0kla__chart-placeholder-icon"
        aria-hidden="true"
      />
      <p className="mg-v2-ad-b0kla__chart-empty-text">{toDisplayString(message)}</p>
    </div>
  );
}

VizChartEmpty.propTypes = {
  message: PropTypes.string.isRequired
};

/**
 * @param {Array<object>} rows
 * @returns {{ booked: number[], completed: number[] }}
 */
function extractPrimarySeriesArrays(rows) {
  return {
    booked: rows.map((row) => toSafeNumber(row?.bookedCount ?? row?.scheduledCount, 0)),
    completed: rows.map((row) => toSafeNumber(row?.completedCount, 0))
  };
}

/**
 * MoM 증감 배지 심볼 라벨 (스펙 §3: ▲ 12% / ▼ 5% / - 0% / ▲ 신규)
 *
 * @param {{ tone: 'up'|'down'|'flat', kind: 'percent'|'fromZero', rate: number|null }} badgeState
 * @param {string} fromZeroLabel
 * @returns {string}
 */
function formatGrowthBadgeSymbol(badgeState, fromZeroLabel) {
  if (badgeState.kind === 'fromZero') {
    return toDisplayString(fromZeroLabel);
  }
  const absRate = Math.abs(toSafeNumber(badgeState.rate, 0));
  if (badgeState.tone === 'up') {
    return `▲ ${absRate}%`;
  }
  if (badgeState.tone === 'down') {
    return `▼ ${absRate}%`;
  }
  return `- ${absRate}%`;
}

/**
 * KPI용 짧은 증감 라벨
 *
 * @param {{ tone: 'up'|'down'|'flat', kind: 'percent'|'fromZero', rate: number|null }} badgeState
 * @param {string} fromZeroLabel
 * @returns {string}
 */
function formatGrowthBadgeLabel(badgeState, fromZeroLabel) {
  return formatGrowthBadgeSymbol(badgeState, fromZeroLabel);
}

/**
 * 차트 카드용 「지난달 대비 ▲ 12%」 형태 라벨
 *
 * @param {{ tone: 'up'|'down'|'flat', kind: 'percent'|'fromZero', rate: number|null }} badgeState
 * @param {string} previousLabel
 * @param {string} fromZeroLabel
 * @param {(key: string, options?: object) => string} t
 * @param {string} [seriesLabel]
 * @returns {string}
 */
function formatChartGrowthBadgeLabel(badgeState, previousLabel, fromZeroLabel, t, seriesLabel) {
  const badge = formatGrowthBadgeSymbol(badgeState, fromZeroLabel);
  if (seriesLabel) {
    return toDisplayString(t('admin:dashboard.v2.viz.growthSeriesVsPrevious', {
      series: seriesLabel,
      previous: previousLabel,
      badge
    }));
  }
  return toDisplayString(t('admin:dashboard.v2.viz.growthVsPrevious', {
    previous: previousLabel,
    badge
  }));
}

/**
 * V6 증감 KPI 카드
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
function VizGrowthKpiCard({
  testId,
  toneClass,
  label,
  value,
  growthRate,
  previousCount,
  previousLabel,
  countUnit,
  fromZeroLabel
}) {
  const badgeState = resolveGrowthBadgeState(growthRate, value, previousCount);
  const previousText = previousCount != null
    ? `${toDisplayString(previousLabel)} ${toSafeNumber(previousCount, 0)}${countUnit}`
    : null;

  return (
    <article
      className={`mg-v2-viz-summary-kpi ${toneClass}`}
      data-testid={testId}
    >
      <p className="mg-v2-viz-summary-kpi__label">{toDisplayString(label)}</p>
      <div className="mg-v2-viz-summary-kpi__value-row">
        <p className="mg-v2-viz-summary-kpi__value">
          {`${toSafeNumber(value, 0)}${countUnit}`}
        </p>
        {badgeState ? (
          <StatusBadge
            variant={resolveGrowthBadgeVariant(badgeState)}
            className={`mg-v2-viz-growth-badge mg-v2-viz-growth-badge--${badgeState.tone}`}
            data-testid={`${testId}-growth`}
            data-tone={badgeState.tone}
            data-kind={badgeState.kind}
          >
            {formatGrowthBadgeLabel(badgeState, fromZeroLabel)}
          </StatusBadge>
        ) : null}
      </div>
      {previousText ? (
        <p className="mg-v2-viz-summary-kpi__previous">{previousText}</p>
      ) : null}
    </article>
  );
}

VizGrowthKpiCard.propTypes = {
  testId: PropTypes.string.isRequired,
  toneClass: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  growthRate: PropTypes.number,
  previousCount: PropTypes.number,
  previousLabel: PropTypes.string,
  countUnit: PropTypes.string.isRequired,
  fromZeroLabel: PropTypes.string.isRequired
};

/**
 * V6b 목표 vs 실적 KPI
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
function VizTargetKpiCard({
  label,
  achievementPercent,
  statusLabel,
  targetMeta
}) {
  const isAchieved = achievementPercent >= PROGRESS_BAR_MAX_PERCENT;
  const barWidth = Math.min(Math.max(achievementPercent, 0), PROGRESS_BAR_MAX_PERCENT);

  return (
    <article
      className="mg-v2-viz-summary-kpi mg-v2-viz-summary-kpi--target"
      data-testid="viz-kpi-card-target"
    >
      <p className="mg-v2-viz-summary-kpi__label">{toDisplayString(label)}</p>
      <div className="mg-v2-viz-summary-kpi__value-row">
        <p className="mg-v2-viz-summary-kpi__value mg-v2-viz-summary-kpi__value--achievement">
          {`${toSafeNumber(achievementPercent, 0)}%`}
        </p>
        <StatusBadge
          variant={isAchieved ? 'success' : 'info'}
          className="mg-v2-viz-growth-badge"
          data-testid="viz-kpi-card-target-status"
        >
          {toDisplayString(statusLabel)}
        </StatusBadge>
      </div>
      <p className="mg-v2-viz-summary-kpi__previous">{toDisplayString(targetMeta)}</p>
      <div
        className="mg-v2-viz-target-progress"
        role="progressbar"
        aria-valuenow={barWidth}
        aria-valuemin={0}
        aria-valuemax={PROGRESS_BAR_MAX_PERCENT}
        data-testid="viz-target-progress"
      >
        <div
          className="mg-v2-viz-target-progress__fill"
          style={{ '--mg-viz-target-progress': `${barWidth}%` }}
        />
      </div>
    </article>
  );
}

VizTargetKpiCard.propTypes = {
  label: PropTypes.string.isRequired,
  achievementPercent: PropTypes.number.isRequired,
  statusLabel: PropTypes.string.isRequired,
  targetMeta: PropTypes.string.isRequired
};

/**
 * 차트 카드 헤더 — 예약·완료 전기간 대비 증감 배지 (제목 옆 대형 노출)
 *
 * @param {object} props
 * @returns {JSX.Element|null}
 */
function VizChartHeaderGrowthBadges({
  testIdPrefix,
  bookedState,
  completedState,
  bookedLabel,
  completedLabel,
  previousLabel,
  fromZeroLabel,
  t
}) {
  if (!bookedState && !completedState) {
    return null;
  }

  return (
    <div
      className="mg-v2-viz-chart-header__badges"
      data-testid={`${testIdPrefix}-growth-badges`}
      role="group"
      aria-label={t('admin:dashboard.v2.viz.growthBadgesGroupLabel')}
    >
      {bookedState ? (
        <StatusBadge
          variant={resolveGrowthBadgeVariant(bookedState)}
          className={
            `mg-v2-viz-growth-badge mg-v2-viz-growth-badge--chart mg-v2-viz-growth-badge--${bookedState.tone}`
          }
          data-testid={`${testIdPrefix}-growth-booked`}
          data-tone={bookedState.tone}
          data-kind={bookedState.kind}
        >
          {formatChartGrowthBadgeLabel(
            bookedState,
            previousLabel,
            fromZeroLabel,
            t,
            bookedLabel
          )}
        </StatusBadge>
      ) : null}
      {completedState ? (
        <StatusBadge
          variant={resolveGrowthBadgeVariant(completedState)}
          className={
            `mg-v2-viz-growth-badge mg-v2-viz-growth-badge--chart mg-v2-viz-growth-badge--${completedState.tone}`
          }
          data-testid={`${testIdPrefix}-growth-completed`}
          data-tone={completedState.tone}
          data-kind={completedState.kind}
        >
          {formatChartGrowthBadgeLabel(
            completedState,
            previousLabel,
            fromZeroLabel,
            t,
            completedLabel
          )}
        </StatusBadge>
      ) : null}
    </div>
  );
}

VizChartHeaderGrowthBadges.propTypes = {
  testIdPrefix: PropTypes.string.isRequired,
  bookedState: PropTypes.shape({
    tone: PropTypes.oneOf(['up', 'down', 'flat']).isRequired,
    kind: PropTypes.oneOf(['percent', 'fromZero']).isRequired,
    rate: PropTypes.number
  }),
  completedState: PropTypes.shape({
    tone: PropTypes.oneOf(['up', 'down', 'flat']).isRequired,
    kind: PropTypes.oneOf(['percent', 'fromZero']).isRequired,
    rate: PropTypes.number
  }),
  bookedLabel: PropTypes.string.isRequired,
  completedLabel: PropTypes.string.isRequired,
  previousLabel: PropTypes.string.isRequired,
  fromZeroLabel: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired
};

const AdminDashboardVisualizationGroup = ({
  consultationStats = null,
  loading = false,
  darkResolved = false
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const [vizPeriod, setVizPeriod] = useState(DASHBOARD_CHART_PERIOD.MONTHLY);
  const [seriesColors, setSeriesColors] = useState({
    booked: B0KLA_CHART_BAR_FALLBACK.BORDER,
    completed: B0KLA_CHART_BAR_FALLBACK.FILL
  });
  const [canvasTheme, setCanvasTheme] = useState({
    tick: CHART_CANVAS_FALLBACK.TICK,
    grid: CHART_CANVAS_FALLBACK.GRID,
    tooltipBg: CHART_CANVAS_FALLBACK.TOOLTIP_BACKGROUND,
    tooltipText: CHART_CANVAS_FALLBACK.TOOLTIP_TEXT,
    legend: CHART_CANVAS_FALLBACK.LEGEND
  });

  useEffect(() => {
    const bookedResolved = resolveCssColorVarToHex(
      B0KLA_STATUS_SERIES_COLOR_VARS.BOOKED,
      resolveCssColorVarToHex(
        B0KLA_STATUS_SERIES_COLOR_VARS.BOOKED_FALLBACK,
        B0KLA_CHART_BAR_FALLBACK.BORDER
      )
    );
    const completedResolved = resolveCssColorVarToHex(
      B0KLA_STATUS_SERIES_COLOR_VARS.COMPLETED,
      resolveCssColorVarToHex(
        B0KLA_STATUS_SERIES_COLOR_VARS.COMPLETED_FALLBACK,
        B0KLA_CHART_BAR_FALLBACK.FILL
      )
    );
    setSeriesColors({
      booked: bookedResolved,
      completed: completedResolved
    });
    setCanvasTheme({
      tick: resolveCssColorVarToHex('--mg-v2-color-text-primary', CHART_CANVAS_FALLBACK.TICK),
      grid: resolveCssColorVarToHex('--mg-v2-color-border-default', CHART_CANVAS_FALLBACK.GRID),
      tooltipBg: resolveCssColorVarToHex(
        '--mg-v2-color-surface-raised',
        CHART_CANVAS_FALLBACK.TOOLTIP_BACKGROUND
      ),
      tooltipText: resolveCssColorVarToHex(
        '--mg-v2-color-text-primary',
        CHART_CANVAS_FALLBACK.TOOLTIP_TEXT
      ),
      legend: resolveCssColorVarToHex('--mg-v2-color-text-primary', CHART_CANVAS_FALLBACK.LEGEND)
    });
  }, [vizPeriod, darkResolved]);

  const trendRows = useMemo(
    () => resolveTrendRowsByPeriod(vizPeriod, consultationStats),
    [vizPeriod, consultationStats]
  );
  const series = useMemo(() => extractPrimarySeriesArrays(trendRows), [trendRows]);
  const comparison = useMemo(
    () => resolvePeriodComparisonMetrics(
      trendRows,
      consultationStats,
      DASHBOARD_VIZ_TARGET_COMPLETED
    ),
    [trendRows, consultationStats]
  );
  const allZero = isBookedCompletedAllZero(trendRows);
  const labels = useMemo(() => trendRows.map(formatChartPeriodLabel), [trendRows]);
  const subtitle = t(
    PERIOD_SUBTITLE_KEYS[vizPeriod] || PERIOD_SUBTITLE_KEYS[DASHBOARD_CHART_PERIOD.MONTHLY]
  );
  const emptyMessage = t(EMPTY_MESSAGE_KEY);
  const countUnit = t('admin:dashboard.v2.viz.countUnit');
  const previousPeriodLabel = t(
    PREVIOUS_PERIOD_LABEL_KEYS[vizPeriod]
      || PREVIOUS_PERIOD_LABEL_KEYS[DASHBOARD_CHART_PERIOD.MONTHLY]
  );
  const growthFromZeroLabel = t('admin:dashboard.v2.viz.growthFromZero');
  const seriesLabels = useMemo(
    () => ({
      booked: t(STATUS_SERIES_LABEL_KEYS.BOOKED),
      completed: t(STATUS_SERIES_LABEL_KEYS.COMPLETED)
    }),
    [t]
  );

  const achievementPercent = calcTargetAchievementPercent(
    comparison.currentCompleted,
    comparison.targetCompleted
  );
  const bookedGrowthState = useMemo(
    () => resolveGrowthBadgeState(
      comparison.growthRateBooked,
      comparison.currentBooked,
      comparison.previousBooked
    ),
    [
      comparison.growthRateBooked,
      comparison.currentBooked,
      comparison.previousBooked
    ]
  );
  const completedGrowthState = useMemo(
    () => resolveGrowthBadgeState(
      comparison.growthRateCompleted,
      comparison.currentCompleted,
      comparison.previousCompleted
    ),
    [
      comparison.growthRateCompleted,
      comparison.currentCompleted,
      comparison.previousCompleted
    ]
  );

  const scaleOptions = useMemo(
    () => ({
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, font: { size: 11 }, color: canvasTheme.tick }
      },
      y: {
        beginAtZero: true,
        /* stepSize 고정 금지 — 큰 dataMax에서 틱·상한 왜곡 방지. precision 0으로 정수 틱 */
        ticks: { precision: 0, color: canvasTheme.tick },
        grid: { color: canvasTheme.grid }
      }
    }),
    [canvasTheme]
  );

  const stackedScaleOptions = useMemo(
    () => ({
      x: { ...scaleOptions.x, stacked: true },
      y: { ...scaleOptions.y, stacked: true }
    }),
    [scaleOptions]
  );

  const tooltipOptions = useMemo(
    () => ({
      backgroundColor: canvasTheme.tooltipBg,
      titleColor: canvasTheme.tooltipText,
      bodyColor: canvasTheme.tooltipText,
      borderColor: canvasTheme.grid,
      borderWidth: 1
    }),
    [canvasTheme]
  );

  const legendPlugin = useMemo(
    () => ({
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 12,
        font: { size: 11 },
        color: canvasTheme.legend
      }
    }),
    [canvasTheme.legend]
  );

  const maxLine = series.booked.length > 0
    ? Math.max(...series.booked, ...series.completed, 0)
    : 0;
  const chartMaxY = series.booked.length > 0
    ? Math.max(...series.booked.map((v, i) => v + series.completed[i]), 0)
    : 0;
  const lineYAxisMax = resolveAutoYAxisMax(maxLine);
  const stackedYAxisMax = resolveAutoYAxisMax(chartMaxY);

  return (
    <section
      className="mg-v2-content-visualization-group"
      aria-labelledby="admin-viz-group-title"
      data-loading={loading ? 'true' : 'false'}
    >
      <div className="mg-v2-content-visualization-group__header">
        <div className="mg-v2-content-visualization-group__title-wrap">
          <span
            className="mg-v2-content-visualization-group__accent"
            aria-hidden="true"
          />
          <h2
            id="admin-viz-group-title"
            className="mg-v2-content-visualization-group__title"
          >
            {t('common:dashboard-v2.AdminDashboardV2.t_01c7a211')}
          </h2>
        </div>
        <div
          className="mg-v2-ad-b0kla__pill-toggle mg-v2-content-visualization-group__pills"
          role="group"
          aria-label={t('admin:dashboard.v2.viz.periodGroupLabel')}
        >
          {VIZ_PERIOD_OPTIONS.map((option) => (
            <MGButton
              key={option.key}
              type="button"
              aria-pressed={vizPeriod === option.key}
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading: false,
                className: `mg-v2-ad-b0kla__pill ${
                  vizPeriod === option.key ? 'mg-v2-ad-b0kla__pill--active' : ''
                }`
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => setVizPeriod(option.key)}
              preventDoubleClick={false}
            >
              {t(option.labelKey)}
            </MGButton>
          ))}
        </div>
      </div>

      {/* V6/V6b — 최상단 KPI 존 */}
      {loading ? (
        <div
          className="mg-v2-skeleton mg-v2-viz-summary-kpi-zone__skeleton"
          aria-busy="true"
          aria-hidden="true"
          data-testid="viz-kpi-skeleton"
        />
      ) : (
        <div
          className="mg-v2-viz-summary-kpi-zone"
          aria-busy="false"
          data-testid="viz-summary-kpi-zone"
        >
          <VizGrowthKpiCard
            testId="viz-kpi-card-booked"
            toneClass="mg-v2-viz-summary-kpi--booked"
            label={seriesLabels.booked}
            value={comparison.currentBooked}
            growthRate={comparison.growthRateBooked}
            previousCount={comparison.previousBooked}
            previousLabel={previousPeriodLabel}
            countUnit={countUnit}
            fromZeroLabel={growthFromZeroLabel}
          />
          <VizGrowthKpiCard
            testId="viz-kpi-card-completed"
            toneClass="mg-v2-viz-summary-kpi--completed"
            label={seriesLabels.completed}
            value={comparison.currentCompleted}
            growthRate={comparison.growthRateCompleted}
            previousCount={comparison.previousCompleted}
            previousLabel={previousPeriodLabel}
            countUnit={countUnit}
            fromZeroLabel={growthFromZeroLabel}
          />
          <VizTargetKpiCard
            label={t('admin:dashboard.v2.viz.targetTitle')}
            achievementPercent={achievementPercent}
            statusLabel={
              achievementPercent >= PROGRESS_BAR_MAX_PERCENT
                ? t('admin:dashboard.v2.viz.targetAchieved')
                : t('admin:dashboard.v2.viz.targetInProgress', {
                  percent: achievementPercent
                })
            }
            targetMeta={t('admin:dashboard.v2.viz.targetMeta', {
              actual: toSafeNumber(comparison.currentCompleted, 0),
              target: toSafeNumber(comparison.targetCompleted, 0),
              unit: countUnit
            })}
          />
        </div>
      )}

      <div className="mg-v2-content-visualization-group__grid">
        {/* V2 스택 바 — 예약/완료 */}
        <div className="mg-v2-ad-b0kla__card" data-testid="viz-stacked-bar-card">
          <div className="mg-v2-ad-b0kla__chart-header">
            <div className="mg-v2-viz-chart-header__main">
              <div className="mg-v2-viz-chart-header__title-row">
                <h3 className="mg-v2-ad-b0kla__chart-title">
                  {t('admin:dashboard.v2.viz.stackedBarTitle')}
                </h3>
                {!loading ? (
                  <VizChartHeaderGrowthBadges
                    testIdPrefix="viz-stacked-bar"
                    bookedState={bookedGrowthState}
                    completedState={completedGrowthState}
                    bookedLabel={seriesLabels.booked}
                    completedLabel={seriesLabels.completed}
                    previousLabel={previousPeriodLabel}
                    fromZeroLabel={growthFromZeroLabel}
                    t={t}
                  />
                ) : null}
              </div>
              <p className="mg-v2-ad-b0kla__chart-desc">{toDisplayString(subtitle)}</p>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper mg-v2-viz-chart">
            {loading ? (
              <div className="mg-v2-skeleton mg-v2-viz-chart__skeleton" aria-hidden="true" />
            ) : allZero ? (
              <VizChartEmpty message={emptyMessage} />
            ) : (
              <Chart
                type={CHART_TYPES.BAR}
                data={{
                  labels,
                  datasets: [
                    {
                      label: seriesLabels.booked,
                      data: series.booked,
                      backgroundColor: seriesColors.booked,
                      borderColor: seriesColors.booked,
                      borderWidth: 1,
                      stack: 'status'
                    },
                    {
                      label: seriesLabels.completed,
                      data: series.completed,
                      backgroundColor: seriesColors.completed,
                      borderColor: seriesColors.completed,
                      borderWidth: 1,
                      stack: 'status'
                    }
                  ]
                }}
                height={CHART_HEIGHT}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: legendPlugin,
                    tooltip: {
                      ...tooltipOptions,
                      callbacks: {
                        label: (ctx) =>
                          `${toDisplayString(ctx.dataset.label)}: ${toSafeNumber(ctx.parsed.y, 0)}${countUnit}`
                      }
                    }
                  },
                  scales: {
                    ...stackedScaleOptions,
                    y: {
                      ...stackedScaleOptions.y,
                      max: stackedYAxisMax
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* V3 멀티라인 — 예약/완료 */}
        <div className="mg-v2-ad-b0kla__card" data-testid="viz-multi-line-card">
          <div className="mg-v2-ad-b0kla__chart-header">
            <div className="mg-v2-viz-chart-header__main">
              <div className="mg-v2-viz-chart-header__title-row">
                <h3 className="mg-v2-ad-b0kla__chart-title">
                  {t('admin:dashboard.v2.viz.multiLineTitle')}
                </h3>
                {!loading ? (
                  <VizChartHeaderGrowthBadges
                    testIdPrefix="viz-multi-line"
                    bookedState={bookedGrowthState}
                    completedState={completedGrowthState}
                    bookedLabel={seriesLabels.booked}
                    completedLabel={seriesLabels.completed}
                    previousLabel={previousPeriodLabel}
                    fromZeroLabel={growthFromZeroLabel}
                    t={t}
                  />
                ) : null}
              </div>
              <p className="mg-v2-ad-b0kla__chart-desc">{toDisplayString(subtitle)}</p>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper mg-v2-viz-chart">
            {loading ? (
              <div className="mg-v2-skeleton mg-v2-viz-chart__skeleton" aria-hidden="true" />
            ) : allZero ? (
              <VizChartEmpty message={emptyMessage} />
            ) : (
              <Chart
                type={CHART_TYPES.LINE}
                data={{
                  labels,
                  datasets: [
                    {
                      label: seriesLabels.booked,
                      data: series.booked,
                      borderColor: seriesColors.booked,
                      backgroundColor: seriesColors.booked,
                      borderWidth: 2,
                      tension: 0.3,
                      fill: false
                    },
                    {
                      label: seriesLabels.completed,
                      data: series.completed,
                      borderColor: seriesColors.completed,
                      backgroundColor: seriesColors.completed,
                      borderWidth: 2,
                      tension: 0.3,
                      fill: false
                    }
                  ]
                }}
                height={CHART_HEIGHT}
                options={{
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false
                  },
                  plugins: {
                    legend: legendPlugin,
                    tooltip: {
                      ...tooltipOptions,
                      mode: 'index',
                      intersect: false,
                      callbacks: {
                        label: (ctx) =>
                          `${toDisplayString(ctx.dataset.label)}: ${toSafeNumber(ctx.parsed.y, 0)}${countUnit}`
                      }
                    }
                  },
                  scales: {
                    ...scaleOptions,
                    y: {
                      ...scaleOptions.y,
                      max: lineYAxisMax
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

AdminDashboardVisualizationGroup.propTypes = {
  consultationStats: PropTypes.shape({
    dailyData: PropTypes.array,
    weeklyData: PropTypes.array,
    monthlyData: PropTypes.array,
    yearlyData: PropTypes.array,
    previousPeriodBooked: PropTypes.number,
    previousPeriodCompleted: PropTypes.number,
    growthRateBooked: PropTypes.number,
    growthRateCompleted: PropTypes.number,
    targetCompleted: PropTypes.number,
    previousPeriodTotals: PropTypes.shape({
      booked: PropTypes.number,
      completed: PropTypes.number
    })
  }),
  loading: PropTypes.bool,
  darkResolved: PropTypes.bool
};

export default AdminDashboardVisualizationGroup;
