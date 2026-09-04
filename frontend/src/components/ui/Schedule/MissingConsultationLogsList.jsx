/**
 * MissingConsultationLogsList — 상담사 상담일지 미작성 일정 공통 리스트.
 *
 * Phase 3-B (R6 2026-06-06) — ScheduleLegend.js L379-434 추출.
 * 통합 스케줄(범례) + 어드민 대시보드(카드) 양쪽에서 동일 마크업·a11y 로 재사용한다.
 *
 * - props.items === null/undefined : 컴포넌트 자체 미렌더 (sentinel — 첫 응답 미수신)
 * - props.items === []             : «모두 작성됨» placeholder (variant 별 라벨 분기)
 * - 그 외                          : 상담사별 누락 일정 칩 리스트
 *
 * variant:
 *   - 'integrated' (기본): 「이번 달 모든 일정의 상담일지가 작성되었습니다」
 *   - 'dashboard'        : 「지난 일정의 모든 상담일지가 작성되었습니다」
 *
 * 스케줄 단위 SSOT (2026-09-04): missingEntries 가 있으면 엔트리별 칩·count 사용.
 * (같은 날 다른 내담자 일지가 있어도 «이미 완료인데 누락» 오탐 방지)
 * missingEntries 없으면 기존 missingDates 폴백.
 *
 * 날짜 칩 클릭 시 onDateChipClick({ consultantId, consultantName, date, scheduleId, clientId })
 * 를 호출한다. 부모가 상담일지 작성 모달/라우트로 연결한다.
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { toDisplayString } from '../../../utils/safeDisplay';
import { lookupMissingLogIdsForDate } from '../../../utils/missingConsultationLogNavigation';

/**
 * R4 (2026-06-09): 누락 일자 칩 라벨 — 'YYYY-MM-DD' → 'M/D'.
 * 입력 파싱 실패 시 원본 문자열 반환 (안전 폴백 + safeDisplay 룰 정합).
 */
export const formatToMonthDay = (raw) => {
  if (raw == null) return '';
  const str = String(raw).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!match) {
    return str;
  }
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) {
    return str;
  }
  return `${month}/${day}`;
};

const resolveTitleKey = () => 'admin:mapping.schedule.legend.missingConsultationLogs';
const resolveTitleDefault = () => '상담일지 미작성';

const resolveEmptyKey = (variant) => (variant === 'dashboard'
  ? 'admin:dashboard.consultationStats.missingLogsAllDone'
  : 'admin:mapping.schedule.legend.missingConsultationLogsAllDone');

const resolveEmptyDefault = (variant) => (variant === 'dashboard'
  ? '지난 일정의 모든 상담일지가 작성되었습니다'
  : '이번 달 모든 일정의 상담일지가 작성되었습니다');

/**
 * 칩 렌더 소스 정규화 — missingEntries 우선, 없으면 missingDates 폴백.
 *
 * @param {object} item
 * @returns {{ chips: Array<{date: string, scheduleId: *, clientId: *, clientName: string|null, key: string}>, count: number }}
 */
export const resolveMissingLogChips = (item) => {
  const entries = Array.isArray(item?.missingEntries) ? item.missingEntries : null;
  if (entries && entries.length > 0) {
    const chips = entries.map((entry, index) => {
      const safeDate = toDisplayString(entry?.date, '');
      const scheduleId = entry?.scheduleId ?? entry?.id ?? null;
      const clientId = entry?.clientId ?? null;
      const clientName = entry?.clientName != null
        ? toDisplayString(entry.clientName, '')
        : null;
      return {
        date: safeDate,
        scheduleId,
        clientId,
        clientName: clientName || null,
        key: `entry-${item?.consultantId}-${scheduleId ?? index}-${safeDate}`
      };
    });
    return { chips, count: chips.length };
  }

  const dates = Array.isArray(item?.missingDates) ? item.missingDates : [];
  const chips = dates.map((date) => {
    const safeDate = toDisplayString(date, '');
    const { scheduleId, clientId } = lookupMissingLogIdsForDate(item, safeDate);
    return {
      date: safeDate,
      scheduleId,
      clientId,
      clientName: null,
      key: `date-${item?.consultantId}-${safeDate}`
    };
  });
  return { chips, count: chips.length };
};

/**
 * 칩 표시 라벨 — 일자 + (가능하면) 내담자명.
 *
 * @param {{ date: string, clientName?: string|null, clientId?: * }} chip
 * @returns {string}
 */
export const formatMissingLogChipLabel = (chip) => {
  const dateLabel = formatToMonthDay(chip?.date);
  const name = chip?.clientName ? String(chip.clientName).trim() : '';
  if (name) {
    return `${dateLabel} ${name}`;
  }
  return dateLabel;
};

/**
 * 상담사별 상담일지 누락 일정 리스트.
 *
 * @param {object} props
 * @param {null|Array<{consultantId: number|string, consultantName: string, missingDates: string[], missingEntries?: object[]}>} props.items
 * @param {'integrated'|'dashboard'} [props.variant='integrated']
 * @param {string} [props.sectionClassName='mg-v2-legend-section mg-v2-legend-missing-logs']
 * @param {string} [props.titleClassName='mg-v2-legend-title']
 * @param {boolean} [props.showTitle=true]                                   타이틀 노출 여부 (대시보드 카드는 외부 헤더로 대체 가능)
 * @param {function} [props.onDateChipClick] 날짜 칩 클릭 핸들러
 * @param {boolean} [props.dateChipsDisabled=false] 칩 비활성 (조회 중 등)
 */
const MissingConsultationLogsList = ({
  items,
  variant = 'integrated',
  sectionClassName = 'mg-v2-legend-section mg-v2-legend-missing-logs',
  titleClassName = 'mg-v2-legend-title',
  showTitle = true,
  onDateChipClick,
  dateChipsDisabled = false
}) => {
  const { t } = useTranslation();

  if (!Array.isArray(items)) {
    return null;
  }

  const titleLabel = t(resolveTitleKey(), { defaultValue: resolveTitleDefault() });
  const emptyLabel = t(resolveEmptyKey(variant), { defaultValue: resolveEmptyDefault(variant) });
  const chipsInteractive = typeof onDateChipClick === 'function';

  return (
    <div className={sectionClassName}>
      {showTitle && (
        <div className={titleClassName}>{titleLabel}</div>
      )}
      {items.length === 0 ? (
        <div className="mg-v2-legend-missing-logs__empty">{emptyLabel}</div>
      ) : (
        <div className="mg-v2-legend-missing-logs__items">
          {items.map((item) => {
            const name = toDisplayString(item?.consultantName, '—');
            const { chips, count } = resolveMissingLogChips(item);
            const itemAria = t(
              'admin:mapping.schedule.legend.missingConsultationLogsItemAria',
              {
                name,
                count,
                defaultValue: `${name}, 미작성 ${count}건`
              }
            );
            return (
              <div
                key={`missing-${item?.consultantId ?? name}`}
                className="mg-v2-legend-missing-logs__item"
                aria-label={itemAria}
              >
                <span className="mg-v2-legend-missing-logs__name">{name}</span>
                <span className="mg-v2-legend-missing-logs__count">({count})</span>
                <span className="mg-v2-legend-missing-logs__dates">
                  {chips.map((chip) => {
                    const label = formatMissingLogChipLabel(chip);
                    const chipAria = t(
                      'admin:mapping.schedule.legend.missingConsultationLogsDateAria',
                      {
                        date: chip.date,
                        defaultValue: chipsInteractive
                          ? `${chip.date} 상담일지 미작성, 작성하기`
                          : `${chip.date} 상담일지 미작성`
                      }
                    );
                    if (!chipsInteractive) {
                      return (
                        <span
                          key={chip.key}
                          className="mg-v2-legend-missing-date-chip"
                          title={chip.date}
                          aria-label={chipAria}
                        >
                          {label}
                        </span>
                      );
                    }
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        className="mg-v2-legend-missing-date-chip mg-v2-legend-missing-date-chip--action"
                        title={chip.date}
                        aria-label={chipAria}
                        disabled={dateChipsDisabled}
                        onClick={() => {
                          onDateChipClick({
                            consultantId: item?.consultantId,
                            consultantName: name,
                            date: chip.date,
                            scheduleId: chip.scheduleId,
                            clientId: chip.clientId
                          });
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

MissingConsultationLogsList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      consultantId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      consultantName: PropTypes.string,
      missingDates: PropTypes.arrayOf(PropTypes.string),
      scheduleIdsByDate: PropTypes.object,
      missingEntries: PropTypes.arrayOf(PropTypes.object)
    })
  ),
  variant: PropTypes.oneOf(['integrated', 'dashboard']),
  sectionClassName: PropTypes.string,
  titleClassName: PropTypes.string,
  showTitle: PropTypes.bool,
  onDateChipClick: PropTypes.func,
  dateChipsDisabled: PropTypes.bool
};

export default MissingConsultationLogsList;
