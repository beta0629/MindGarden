/**
 * ConsultantSessionKpiPage — 상담사 완료 회기 KPI (일·주·월)
 *
 * @author MindGarden
 * @since 2026-05-16
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart3, CheckCircle2, CalendarRange } from 'lucide-react';
import { ContentArea, ContentHeader, ContentKpiRow, ContentSection } from '../dashboard-v2/content';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import Chart from '../common/Chart';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { CHART_TYPES, CHART_HEIGHTS, B0KLA_CHART_BAR_FALLBACK } from '../../constants/charts';
import { CONSULTANT_SESSION_KPI_STRINGS as S } from '../../constants/consultantSessionKpiStrings';
import { fetchConsultantSessionStatistics } from '../../api/consultantSessionStatisticsClient';
import { toDisplayString, toSafeNumber, toErrorMessage } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantSessionKpiPage.css';

const SESSION_KPI_TITLE_ID = 'consultant-session-kpi-page-title';

const GRANULARITY = {
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH'
};

/**
 * @param {Date} d
 * @param {number} n
 * @returns {Date}
 */
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * @param {Date} d
 * @param {number} n
 * @returns {Date}
 */
function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

/**
 * @param {Date} d
 * @returns {Date}
 */
function monthStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * @param {Date} d
 * @returns {Date}
 */
function monthEnd(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * @param {Date} d
 * @returns {string}
 */
function formatYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {string} granularity
 * @param {number} periodOffset
 * @returns {{ start: Date, end: Date }}
 */
function computeRange(granularity, periodOffset) {
  const today = new Date();
  if (granularity === GRANULARITY.MONTH) {
    const ref = addMonths(monthStart(today), periodOffset);
    const start = monthStart(ref);
    const end = monthEnd(ref);
    return { start, end };
  }
  if (granularity === GRANULARITY.WEEK) {
    const shift = periodOffset * 28;
    const end = addDays(today, shift);
    end.setHours(23, 59, 59, 999);
    const start = addDays(end, -55);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  const shift = periodOffset * 7;
  const end = addDays(today, shift);
  end.setHours(23, 59, 59, 999);
  const start = addDays(end, -13);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

/**
 * @param {string} granularity
 * @returns {string}
 */
function granularityLabel(g) {
  if (g === GRANULARITY.WEEK) return S.GRANULARITY_WEEK;
  if (g === GRANULARITY.MONTH) return S.GRANULARITY_MONTH;
  return S.GRANULARITY_DAY;
}

const ConsultantSessionKpiPage = () => {
  const [granularity, setGranularity] = useState(GRANULARITY.DAY);
  const [periodOffset, setPeriodOffset] = useState(0);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    previousPeriodTotal: null,
    buckets: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPeriodOffset(0);
  }, [granularity]);

  const { start, end } = useMemo(
    () => computeRange(granularity, periodOffset),
    [granularity, periodOffset]
  );
  const startDate = formatYmd(start);
  const endDate = formatYmd(end);
  const rangeLabel = useMemo(
    () => toDisplayString(`${startDate} ~ ${endDate}`, '—'),
    [startDate, endDate]
  );

  const load = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsultantSessionStatistics({
        startDate,
        endDate,
        granularity
      });
      setStats(data);
    } catch (e) {
      setError(e);
      setStats({ totalCompleted: 0, previousPeriodTotal: null, buckets: [] });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, granularity]);

  useEffect(() => {
    load();
  }, [load]);

  const kpiItems = useMemo(() => {
    const total = toSafeNumber(stats.totalCompleted, 0);
    const items = [
      {
        id: 'total',
        icon: <CheckCircle2 size={22} aria-hidden />,
        label: S.KPI_TOTAL_LABEL,
        value: String(total),
        iconVariant: 'blue'
      }
    ];
    if (stats.previousPeriodTotal != null) {
      items.push({
        id: 'prev',
        icon: <CalendarRange size={22} aria-hidden />,
        label: S.KPI_PREV_LABEL,
        value: String(toSafeNumber(stats.previousPeriodTotal, 0)),
        subtitle: S.KPI_PREV_SUB,
        iconVariant: 'gray'
      });
    }
    return items;
  }, [stats]);

  const chartData = useMemo(() => {
    const labels = stats.buckets.map((b) => toDisplayString(b.label, ''));
    const data = stats.buckets.map((b) => toSafeNumber(b.value, 0));
    return {
      labels,
      datasets: [
        {
          label: S.CHART_LABEL,
          data,
          backgroundColor: B0KLA_CHART_BAR_FALLBACK.FILL,
          borderColor: B0KLA_CHART_BAR_FALLBACK.BORDER,
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    };
  }, [stats.buckets]);

  const chartOptions = useMemo(
    () => ({
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }),
    []
  );

  const hasBuckets = Array.isArray(stats.buckets) && stats.buckets.length > 0;
  const totalNum = toSafeNumber(stats.totalCompleted, 0);
  const showEmptyZero =
    !loading && !error && !hasBuckets && totalNum === 0;
  const showMissingBuckets =
    !loading && !error && !hasBuckets && totalNum > 0;

  const segmentedTrack = (
    <div
      className="consultant-session-kpi__segmented mg-v2-ad-b0kla__segmented-control"
      role="tablist"
      aria-label={S.GRANULARITY_ARIA}
    >
      <div className="consultant-session-kpi__segmented-track">
        {[GRANULARITY.DAY, GRANULARITY.WEEK, GRANULARITY.MONTH].map((g) => (
          <MGButton
            key={g}
            type="button"
            variant={granularity === g ? 'primary' : 'outline'}
            className={`${buildErpMgButtonClassName({
              variant: granularity === g ? 'primary' : 'outline',
              size: 'sm',
              loading: false,
              className:
                granularity === g ? 'mg-v2-btn--primary' : 'mg-v2-btn--outline'
            })} mg-v2-ad-b0kla__segmented-item`.trim()}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
            onClick={() => setGranularity(g)}
            aria-selected={granularity === g}
            role="tab"
          >
            {granularityLabel(g)}
          </MGButton>
        ))}
      </div>
    </div>
  );

  const periodNav = (
    <div className="consultant-session-kpi__period-nav">
      <MGButton
        type="button"
        variant="outline"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'outline',
          size: 'sm',
          loading: false,
          className: 'consultant-session-kpi__nav-btn mg-v2-btn--outline'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
        onClick={() => setPeriodOffset((o) => o - 1)}
        aria-label={S.PERIOD_PREV}
      >
        <ChevronLeft size={20} aria-hidden />
      </MGButton>
      <span className="consultant-session-kpi__period-label">{rangeLabel}</span>
      <MGButton
        type="button"
        variant="outline"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'outline',
          size: 'sm',
          loading: false,
          className: 'consultant-session-kpi__nav-btn mg-v2-btn--outline'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
        onClick={() => setPeriodOffset((o) => o + 1)}
        aria-label={S.PERIOD_NEXT}
      >
        <ChevronRight size={20} aria-hidden />
      </MGButton>
    </div>
  );

  return (
    <ContentArea ariaLabel={S.ARIA_MAIN}>
      <ContentHeader
        title={toDisplayString(S.PAGE_TITLE, '')}
        subtitle={toDisplayString(S.PAGE_SUBTITLE, '')}
        titleId={SESSION_KPI_TITLE_ID}
      />
      <div className="mg-v2-ad-b0kla consultant-session-kpi">
        <div className="consultant-session-kpi__toolbar">
          {segmentedTrack}
          {periodNav}
        </div>

        {loading ? (
          <UnifiedLoading type="inline" text={S.LOADING} />
        ) : null}

        {!loading && error ? (
          <section
            className="consultant-session-kpi__state consultant-session-kpi__state--error"
            role="alert"
            aria-live="assertive"
          >
            <BarChart3 size={28} className="consultant-session-kpi__state-icon" aria-hidden />
            <p className="consultant-session-kpi__state-text">
              {toDisplayString(toErrorMessage(error, S.ERROR_FALLBACK), S.ERROR_FALLBACK)}
            </p>
            <p className="consultant-session-kpi__state-sub consultant-session-kpi__state-sub--muted">
              {S.ERROR_HINT}
            </p>
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading: false,
                className: 'mg-v2-btn--primary'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
              onClick={() => load()}
            >
              {S.RETRY}
            </MGButton>
          </section>
        ) : null}

        {!loading && !error ? (
          <>
            <ContentKpiRow items={kpiItems} />
            {showEmptyZero ? (
              <section
                className="consultant-session-kpi__state consultant-session-kpi__state--empty"
                role="status"
                aria-live="polite"
              >
                <p className="consultant-session-kpi__state-text">{S.EMPTY}</p>
              </section>
            ) : null}
            {showMissingBuckets ? (
              <section
                className="consultant-session-kpi__state consultant-session-kpi__state--empty"
                role="status"
                aria-live="polite"
              >
                <p className="consultant-session-kpi__state-text">{S.NO_BUCKET_DETAIL}</p>
              </section>
            ) : null}
            {hasBuckets ? (
              <>
                <ContentSection title={S.SECTION_TREND} noCard={false}>
                  <Chart
                    type={CHART_TYPES.BAR}
                    data={chartData}
                    height={CHART_HEIGHTS.MEDIUM}
                    options={chartOptions}
                    loading={false}
                    error={null}
                    className="consultant-session-kpi__chart"
                  />
                </ContentSection>
                <ContentSection title={S.SECTION_LIST} noCard={false}>
                  <div className="consultant-session-kpi__table-wrap">
                    <table className="consultant-session-kpi__table">
                      <thead>
                        <tr>
                          <th scope="col">{S.LIST_COL_PERIOD}</th>
                          <th scope="col">{S.LIST_COL_COUNT}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.buckets.map((row, idx) => (
                          <tr key={`${toDisplayString(row.label, '')}-${String(idx)}`}>
                            <td>{toDisplayString(row.label, '—')}</td>
                            <td>{String(toSafeNumber(row.value, 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ContentSection>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </ContentArea>
  );
};

export default ConsultantSessionKpiPage;
