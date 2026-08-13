/**
 * WeeklyReservationsWidget — 주간 예약 현황 위젯 (MVP)
 * ExpectedVisitsWidget 직상단에 배치. CSS 미니 바 + KPI + 상태 요약.
 *
 * @author CoreSolution
 * @since 2026-08-13
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays } from 'lucide-react';
import StandardizedApi from '../../utils/standardizedApi';
import { ContentSection } from './content';
import { EmptyState, StatusBadge } from '../common';
import SegmentedTabs from '../common/SegmentedTabs';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import {
  WEEKLY_RESERVATIONS_API,
  WEEK_OFFSET,
  WEEK_OFFSET_OPTIONS,
  DAY_OF_WEEK_SHORT_LABELS,
  WEEKLY_STATUS_ORDER,
  WEEKLY_RESERVATIONS_STRINGS as S,
  WEEKLY_RESERVATIONS_CSS as CSS
} from '../../constants/weeklyReservationsConstants';
import './WeeklyReservationsWidget.css';

/**
 * YYYY-MM-DD → YYYY.MM.DD
 * @param {string} dateStr
 * @returns {string}
 */
function formatDateDot(dateStr) {
  const raw = toDisplayString(dateStr, '');
  if (!raw || raw.length < 10) return raw;
  return raw.slice(0, 10).replaceAll('-', '.');
}

/**
 * 기간 서브타이틀
 * @param {string} weekStart
 * @param {string} weekEnd
 * @returns {string}
 */
function buildWeekSubtitle(weekStart, weekEnd) {
  const start = formatDateDot(weekStart);
  const end = formatDateDot(weekEnd);
  if (!start && !end) return '';
  return `${start} ~ ${end}`;
}

/**
 * 전주 대비 표시 문구
 * @param {number} changeAbs
 * @param {number|null} changePercent
 * @returns {string}
 */
function formatChangeLabel(changeAbs, changePercent) {
  const abs = toSafeNumber(changeAbs, 0);
  if (abs === 0) {
    return S.CHANGE_SAME;
  }
  const sign = abs > 0 ? S.CHANGE_UP_PREFIX : '';
  const pct = changePercent == null ? '' : ` (${sign}${toDisplayString(changePercent)}%)`;
  return `${sign}${toDisplayString(abs)}${S.KPI_UNIT}${pct}`;
}

const WeeklyReservationsWidget = () => {
  const [weekOffset, setWeekOffset] = useState(WEEK_OFFSET.THIS_WEEK);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await StandardizedApi.get(WEEKLY_RESERVATIONS_API.STATS, {
        weekOffset
      });
      const payload = response?.data != null ? response.data : response;
      setData(payload && typeof payload === 'object' ? payload : null);
    } catch (err) {
      console.error('주간 예약 현황 로드 실패:', err);
      setError(err?.message || S.ERROR);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWeekChange = useCallback((value) => {
    const next = value === WEEK_OFFSET.LAST_WEEK
      ? WEEK_OFFSET.LAST_WEEK
      : WEEK_OFFSET.THIS_WEEK;
    setWeekOffset(next);
  }, []);

  const subtitle = useMemo(
    () => buildWeekSubtitle(data?.weekStart, data?.weekEnd),
    [data?.weekStart, data?.weekEnd]
  );

  const totalCount = toSafeNumber(data?.totalCount, 0);
  const changeAbs = toSafeNumber(data?.changeAbs, 0);
  const changePercent = data?.changePercent == null
    ? null
    : toSafeNumber(data.changePercent, 0);

  const byDayOfWeek = useMemo(() => {
    const rows = Array.isArray(data?.byDayOfWeek) ? data.byDayOfWeek : [];
    const map = new Map();
    rows.forEach((row) => {
      const dow = toSafeNumber(row?.dayOfWeek, 0);
      if (dow >= 1 && dow <= 7) {
        map.set(dow, toSafeNumber(row?.count, 0));
      }
    });
    return [1, 2, 3, 4, 5, 6, 7].map((dow) => ({
      dayOfWeek: dow,
      label: DAY_OF_WEEK_SHORT_LABELS[dow] || '',
      count: map.get(dow) ?? 0
    }));
  }, [data?.byDayOfWeek]);

  const maxDayCount = useMemo(
    () => byDayOfWeek.reduce((max, row) => Math.max(max, row.count), 0),
    [byDayOfWeek]
  );

  const byStatus = useMemo(() => {
    const rows = Array.isArray(data?.byStatus) ? data.byStatus : [];
    const map = new Map();
    rows.forEach((row) => {
      const key = toDisplayString(row?.status, '');
      if (key) {
        map.set(key, toSafeNumber(row?.count, 0));
      }
    });
    return WEEKLY_STATUS_ORDER.map((status) => ({
      status,
      count: map.get(status) ?? 0
    }));
  }, [data?.byStatus]);

  const weekToggle = (
    <SegmentedTabs
      ariaLabel={S.ARIA_WEEK_TOGGLE}
      items={WEEK_OFFSET_OPTIONS}
      activeValue={weekOffset}
      onChange={handleWeekChange}
      size="sm"
    />
  );

  const renderBody = () => {
    if (loading) {
      return (
        <div className={`${CSS.BODY} ${CSS.BODY_LOADING}`}>
          <div className="mg-loading-container mg-flex mg-flex-col mg-align-center mg-justify-center">
            <div className="mg-loading-spinner" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon={<AlertCircle size={32} />}
          title={S.ERROR}
          description={toDisplayString(error, '')}
          action={(
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'secondary',
                size: 'sm',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={loadData}
            >
              {S.RETRY}
            </MGButton>
          )}
        />
      );
    }

    if (!data || totalCount === 0) {
      return (
        <EmptyState
          icon={<CalendarDays size={32} />}
          title={S.EMPTY}
        />
      );
    }

    const changeClass = changeAbs > 0
      ? `${CSS.KPI_CHANGE} ${CSS.KPI_CHANGE_UP}`
      : `${CSS.KPI_CHANGE} ${CSS.KPI_CHANGE_DOWN}`;

    return (
      <div className={CSS.GRID}>
        <section className={CSS.KPI} aria-label={S.KPI_TOTAL_LABEL}>
          <p className={CSS.KPI_LABEL}>{S.KPI_TOTAL_LABEL}</p>
          <p className={CSS.KPI_VALUE}>
            {toDisplayString(totalCount)}
            <span>{S.KPI_UNIT}</span>
          </p>
          <p className={changeClass}>
            {S.KPI_PREV_LABEL}
            {' '}
            {formatChangeLabel(changeAbs, changePercent)}
          </p>
        </section>

        <section className={CSS.DAYS} aria-label={S.SECTION_BY_DAY}>
          <p className={CSS.DAYS_TITLE}>{S.SECTION_BY_DAY}</p>
          <div className={CSS.BARS}>
            {byDayOfWeek.map((day) => {
              const heightPct = maxDayCount > 0
                ? Math.round((day.count / maxDayCount) * 100)
                : 0;
              const isPeak = maxDayCount > 0 && day.count === maxDayCount;
              return (
                <div key={day.dayOfWeek} className={CSS.BAR_COL}>
                  <span className={CSS.BAR_COUNT}>
                    {toDisplayString(day.count)}
                  </span>
                  <div className={CSS.BAR_TRACK}>
                    <div
                      className={
                        isPeak
                          ? `${CSS.BAR_FILL} ${CSS.BAR_FILL_PEAK}`
                          : CSS.BAR_FILL
                      }
                      style={{ '--wr-bar-height': `${heightPct}%` }}
                    />
                  </div>
                  <span className={CSS.BAR_LABEL}>
                    {toDisplayString(day.label, '')}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className={CSS.STATUS} aria-label={S.SECTION_BY_STATUS}>
          <p className={CSS.STATUS_TITLE}>{S.SECTION_BY_STATUS}</p>
          <ul className={CSS.STATUS_LIST}>
            {byStatus.map((item) => (
              <li key={item.status} className={CSS.STATUS_ROW}>
                <StatusBadge status={item.status} />
                <span className={CSS.STATUS_COUNT}>
                  {toDisplayString(item.count)}
                  {S.KPI_UNIT}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  };

  return (
    <ContentSection
      title={S.WIDGET_TITLE}
      subtitle={subtitle}
      actions={weekToggle}
      className={CSS.WIDGET}
      dataTestId="weekly-reservations-widget"
    >
      {renderBody()}
    </ContentSection>
  );
};

export default WeeklyReservationsWidget;
