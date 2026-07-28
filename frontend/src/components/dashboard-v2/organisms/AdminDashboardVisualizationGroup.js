/**
 * AdminDashboardVisualizationGroup — 기간 pill + 예약/진행/완료 멀티 비주얼 (V1~V5)
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
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import {
  CHART_TYPES,
  B0KLA_CHART_BAR_FALLBACK,
  B0KLA_STATUS_SERIES_COLOR_VARS
} from '../../../constants/charts';
import { resolveCssColorVarToHex } from '../../../utils/resolveCssColorVarToHex';
import { toSafeNumber, toDisplayString } from '../../../utils/safeDisplay';
import KpiSparkline from '../atoms/KpiSparkline';
import { extractSparklineValues } from '../utils/dashboardKpiSparklineUtils';
import {
  DASHBOARD_CHART_PERIOD,
  formatChartPeriodLabel,
  isTrendSeriesAllZero,
  resolveTrendRowsByPeriod,
  sumTrendSeriesCounts
} from '../utils/dashboardChartPeriodUtils';
import './AdminDashboardVisualizationGroup.css';

const CHART_CANVAS_FALLBACK = Object.freeze({
  TICK: 'var(--mg-v2-color-text-secondary)',
  GRID: 'var(--mg-v2-color-border-light)',
  TOOLTIP_BACKGROUND: 'var(--mg-v2-color-surface-raised)',
  TOOLTIP_TEXT: 'var(--mg-v2-color-text-primary)',
  LEGEND: 'var(--mg-v2-color-text-secondary)'
});

const VIZ_PERIOD_OPTIONS = [
  { key: DASHBOARD_CHART_PERIOD.DAILY, labelKey: 'admin:dashboard.v2.period.daily' },
  { key: DASHBOARD_CHART_PERIOD.WEEKLY, labelKey: 'admin:dashboard.v2.period.weekly' },
  { key: DASHBOARD_CHART_PERIOD.MONTHLY, labelKey: 'admin:dashboard.v2.period.monthly' },
  { key: DASHBOARD_CHART_PERIOD.YEARLY, labelKey: 'admin:dashboard.v2.period.yearly' }
];

const STATUS_SERIES_LABEL_KEYS = Object.freeze({
  BOOKED: 'admin:dashboard.v2.viz.seriesBooked',
  IN_PROGRESS: 'admin:dashboard.v2.viz.seriesInProgress',
  COMPLETED: 'admin:dashboard.v2.viz.seriesCompleted'
});

const PERIOD_SUBTITLE_KEYS = Object.freeze({
  [DASHBOARD_CHART_PERIOD.DAILY]: 'admin:dashboard.v2.viz.subtitleDaily',
  [DASHBOARD_CHART_PERIOD.WEEKLY]: 'admin:dashboard.v2.viz.subtitleWeekly',
  [DASHBOARD_CHART_PERIOD.MONTHLY]: 'admin:dashboard.v2.viz.subtitleMonthly',
  [DASHBOARD_CHART_PERIOD.YEARLY]: 'admin:dashboard.v2.viz.subtitleYearly'
});

const CHART_HEIGHT = '200px';
const EMPTY_MESSAGE_KEY = 'admin:dashboard.v2.viz.emptyPeriod';

/**
 * V2/V3/V5 empty — 아이콘 + 문구 (스펙 §5)
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
 * @returns {{ booked: number[], inProgress: number[], completed: number[] }}
 */
function extractSeriesArrays(rows) {
  return {
    booked: rows.map((row) => toSafeNumber(row?.bookedCount ?? row?.scheduledCount, 0)),
    inProgress: rows.map((row) => toSafeNumber(row?.inProgressCount, 0)),
    completed: rows.map((row) => toSafeNumber(row?.completedCount, 0))
  };
}

/**
 * @param {number} value
 * @param {number} total
 * @returns {string}
 */
function formatPercent(value, total) {
  if (total <= 0) {
    return '0';
  }
  return ((toSafeNumber(value, 0) / total) * 100).toFixed(1);
}

const AdminDashboardVisualizationGroup = ({
  consultationStats = null,
  loading = false,
  darkResolved = false
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const [vizPeriod, setVizPeriod] = useState(DASHBOARD_CHART_PERIOD.MONTHLY);
  const [seriesColors, setSeriesColors] = useState({
    booked: B0KLA_CHART_BAR_FALLBACK.BORDER,
    inProgress: B0KLA_CHART_BAR_FALLBACK.FILL,
    completed: B0KLA_CHART_BAR_FALLBACK.BORDER
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
    const inProgressResolved = resolveCssColorVarToHex(
      B0KLA_STATUS_SERIES_COLOR_VARS.IN_PROGRESS,
      B0KLA_CHART_BAR_FALLBACK.FILL
    );
    const completedResolved = resolveCssColorVarToHex(
      B0KLA_STATUS_SERIES_COLOR_VARS.COMPLETED,
      resolveCssColorVarToHex(
        B0KLA_STATUS_SERIES_COLOR_VARS.COMPLETED_FALLBACK,
        B0KLA_CHART_BAR_FALLBACK.BORDER
      )
    );
    setSeriesColors({
      booked: bookedResolved,
      inProgress: inProgressResolved,
      completed: completedResolved
    });
    setCanvasTheme({
      tick: resolveCssColorVarToHex('--mg-v2-color-text-secondary', CHART_CANVAS_FALLBACK.TICK),
      grid: resolveCssColorVarToHex('--mg-v2-color-border-light', CHART_CANVAS_FALLBACK.GRID),
      tooltipBg: resolveCssColorVarToHex(
        '--mg-v2-color-surface-raised',
        CHART_CANVAS_FALLBACK.TOOLTIP_BACKGROUND
      ),
      tooltipText: resolveCssColorVarToHex(
        '--mg-v2-color-text-primary',
        CHART_CANVAS_FALLBACK.TOOLTIP_TEXT
      ),
      legend: resolveCssColorVarToHex('--mg-v2-color-text-secondary', CHART_CANVAS_FALLBACK.LEGEND)
    });
  }, [vizPeriod, darkResolved]);

  const trendRows = useMemo(
    () => resolveTrendRowsByPeriod(vizPeriod, consultationStats),
    [vizPeriod, consultationStats]
  );
  const series = useMemo(() => extractSeriesArrays(trendRows), [trendRows]);
  const sums = useMemo(() => sumTrendSeriesCounts(trendRows), [trendRows]);
  const allZero = isTrendSeriesAllZero(trendRows);
  const labels = useMemo(() => trendRows.map(formatChartPeriodLabel), [trendRows]);
  const subtitle = t(
    PERIOD_SUBTITLE_KEYS[vizPeriod] || PERIOD_SUBTITLE_KEYS[DASHBOARD_CHART_PERIOD.MONTHLY]
  );
  const emptyMessage = t(EMPTY_MESSAGE_KEY);
  const seriesLabels = useMemo(
    () => ({
      booked: t(STATUS_SERIES_LABEL_KEYS.BOOKED),
      inProgress: t(STATUS_SERIES_LABEL_KEYS.IN_PROGRESS),
      completed: t(STATUS_SERIES_LABEL_KEYS.COMPLETED)
    }),
    [t]
  );

  const scaleOptions = useMemo(
    () => ({
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, font: { size: 11 }, color: canvasTheme.tick }
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: canvasTheme.tick },
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

  const maxStacked = Math.max(sums.booked + sums.inProgress + sums.completed, 1);
  const maxLine = Math.max(...series.booked, ...series.inProgress, ...series.completed, 1);

  const sparkBooked = extractSparklineValues(trendRows, 'bookedCount');
  const sparkInProgress = extractSparklineValues(trendRows, 'inProgressCount');
  const sparkCompleted = extractSparklineValues(trendRows, 'completedCount');

  const kpiItems = [
    {
      key: 'booked',
      label: seriesLabels.booked,
      value: sums.booked,
      spark: sparkBooked,
      sparkVariant: 'secondary',
      toneClass: 'mg-v2-viz-kpi-card--booked'
    },
    {
      key: 'inProgress',
      label: seriesLabels.inProgress,
      value: sums.inProgress,
      spark: sparkInProgress,
      sparkVariant: 'accent',
      toneClass: 'mg-v2-viz-kpi-card--in-progress'
    },
    {
      key: 'completed',
      label: seriesLabels.completed,
      value: sums.completed,
      spark: sparkCompleted,
      sparkVariant: 'primary',
      toneClass: 'mg-v2-viz-kpi-card--completed'
    }
  ];

  const donutValues = [sums.booked, sums.inProgress, sums.completed];
  const donutColors = [seriesColors.booked, seriesColors.inProgress, seriesColors.completed];

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

      <div className="mg-v2-content-visualization-group__grid">
        {/* V2 스택 바 */}
        <div className="mg-v2-ad-b0kla__card">
          <div className="mg-v2-ad-b0kla__chart-header">
            <div>
              <h3 className="mg-v2-ad-b0kla__chart-title">
                {t('admin:dashboard.v2.viz.stackedBarTitle')}
              </h3>
              <p className="mg-v2-ad-b0kla__chart-desc">{toDisplayString(subtitle)}</p>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper mg-v2-viz-chart">
            {loading ? (
              <div className="mg-v2-skeleton mg-v2-viz-chart__skeleton" aria-hidden="true" />
            ) : allZero ? (
              <p className="mg-v2-ad-b0kla__chart-empty">{toDisplayString(emptyMessage)}</p>
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
                      label: seriesLabels.inProgress,
                      data: series.inProgress,
                      backgroundColor: seriesColors.inProgress,
                      borderColor: seriesColors.inProgress,
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
                          `${toDisplayString(ctx.dataset.label)}: ${toSafeNumber(ctx.parsed.y, 0)}건`
                      }
                    }
                  },
                  scales: {
                    ...stackedScaleOptions,
                    y: {
                      ...stackedScaleOptions.y,
                      suggestedMax: Math.max(maxStacked + 1, 2)
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* V3 멀티라인 3선 */}
        <div className="mg-v2-ad-b0kla__card">
          <div className="mg-v2-ad-b0kla__chart-header">
            <div>
              <h3 className="mg-v2-ad-b0kla__chart-title">
                {t('admin:dashboard.v2.viz.multiLineTitle')}
              </h3>
              <p className="mg-v2-ad-b0kla__chart-desc">{toDisplayString(subtitle)}</p>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper mg-v2-viz-chart">
            {loading ? (
              <div className="mg-v2-skeleton mg-v2-viz-chart__skeleton" aria-hidden="true" />
            ) : allZero ? (
              <p className="mg-v2-ad-b0kla__chart-empty">{toDisplayString(emptyMessage)}</p>
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
                      label: seriesLabels.inProgress,
                      data: series.inProgress,
                      borderColor: seriesColors.inProgress,
                      backgroundColor: seriesColors.inProgress,
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
                  plugins: {
                    legend: legendPlugin,
                    tooltip: {
                      ...tooltipOptions,
                      callbacks: {
                        label: (ctx) =>
                          `${toDisplayString(ctx.dataset.label)}: ${toSafeNumber(ctx.parsed.y, 0)}건`
                      }
                    }
                  },
                  scales: {
                    ...scaleOptions,
                    y: {
                      ...scaleOptions.y,
                      suggestedMax: Math.max(maxLine + 1, 2)
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* V4 KPI 미니카드 + 스파크라인 */}
        <div className="mg-v2-ad-b0kla__card">
          <div className="mg-v2-ad-b0kla__chart-header">
            <div>
              <h3 className="mg-v2-ad-b0kla__chart-title">
                {t('admin:dashboard.v2.viz.kpiTitle')}
              </h3>
              <p className="mg-v2-ad-b0kla__chart-desc">{toDisplayString(subtitle)}</p>
            </div>
          </div>
          <div className="mg-v2-viz-kpi-grid" aria-busy={loading}>
            {kpiItems.map((item) => (
              <article
                key={item.key}
                className={`mg-v2-viz-kpi-card ${item.toneClass}`}
              >
                <p className="mg-v2-viz-kpi-card__label">{toDisplayString(item.label)}</p>
                <div className="mg-v2-viz-kpi-card__body">
                  <p className="mg-v2-viz-kpi-card__value">
                    {`${toSafeNumber(item.value, 0)}건`}
                  </p>
                  {!loading && Array.isArray(item.spark) && item.spark.length > 0 ? (
                    <KpiSparkline data={item.spark} variant={item.sparkVariant} />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* V5 상태 도넛 */}
        <div className="mg-v2-ad-b0kla__card">
          <div className="mg-v2-ad-b0kla__chart-header">
            <div>
              <h3 className="mg-v2-ad-b0kla__chart-title">
                {t('admin:dashboard.v2.viz.donutTitle')}
              </h3>
              <p className="mg-v2-ad-b0kla__chart-desc">{toDisplayString(subtitle)}</p>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper mg-v2-ad-b0kla__chart-wrapper--donut mg-v2-viz-donut">
            {loading ? (
              <div className="mg-v2-skeleton mg-v2-viz-chart__skeleton" aria-hidden="true" />
            ) : sums.total === 0 ? (
              <p className="mg-v2-ad-b0kla__chart-empty">{toDisplayString(emptyMessage)}</p>
            ) : (
              <div className="mg-v2-viz-donut__layout">
                <div className="mg-v2-viz-donut__chart">
                  <Chart
                    type={CHART_TYPES.DOUGHNUT}
                    data={{
                      labels: [
                        seriesLabels.booked,
                        seriesLabels.inProgress,
                        seriesLabels.completed
                      ],
                      datasets: [
                        {
                          data: donutValues,
                          backgroundColor: donutColors,
                          borderColor: donutColors,
                          borderWidth: 2
                        }
                      ]
                    }}
                    height={CHART_HEIGHT}
                    options={{
                      maintainAspectRatio: false,
                      cutout: '62%',
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          ...tooltipOptions,
                          callbacks: {
                            label: (ctx) => {
                              const v = toSafeNumber(ctx.parsed, 0);
                              const pct = formatPercent(v, sums.total);
                              return `${toDisplayString(ctx.label)}: ${v}건 (${pct}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                  <div className="mg-v2-viz-donut__center" aria-hidden="true">
                    <span className="mg-v2-viz-donut__center-value">
                      {toSafeNumber(sums.total, 0)}
                    </span>
                    <span className="mg-v2-viz-donut__center-label">건</span>
                  </div>
                </div>
                <ul className="mg-v2-viz-donut__legend">
                  {[
                    {
                      key: 'booked',
                      label: seriesLabels.booked,
                      value: sums.booked,
                      swatchClass: 'mg-v2-viz-donut__swatch--booked'
                    },
                    {
                      key: 'inProgress',
                      label: seriesLabels.inProgress,
                      value: sums.inProgress,
                      swatchClass: 'mg-v2-viz-donut__swatch--in-progress'
                    },
                    {
                      key: 'completed',
                      label: seriesLabels.completed,
                      value: sums.completed,
                      swatchClass: 'mg-v2-viz-donut__swatch--completed'
                    }
                  ].map((item) => (
                    <li key={item.key} className="mg-v2-viz-donut__legend-item">
                      <span
                        className={`mg-v2-viz-donut__swatch ${item.swatchClass}`}
                        aria-hidden="true"
                      />
                      <span className="mg-v2-viz-donut__legend-text">
                        {`${toDisplayString(item.label)} ${formatPercent(item.value, sums.total)}%`}
                      </span>
                      <span className="mg-v2-viz-donut__legend-count">
                        {`${toSafeNumber(item.value, 0)}건`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* P1 슬롯: V7 일간 히트맵 / V8 상담사 랭킹 — 이번 배치 미구현 */}
      </div>
    </section>
  );
};

AdminDashboardVisualizationGroup.propTypes = {
  consultationStats: PropTypes.shape({
    dailyData: PropTypes.array,
    weeklyData: PropTypes.array,
    monthlyData: PropTypes.array,
    yearlyData: PropTypes.array
  }),
  loading: PropTypes.bool,
  darkResolved: PropTypes.bool
};

export default AdminDashboardVisualizationGroup;
