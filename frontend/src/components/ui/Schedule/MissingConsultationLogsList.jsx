/**
 * MissingConsultationLogsList — 상담사 상담일지 미작성 일자 공통 리스트.
 *
 * Phase 3-B (R6 2026-06-06) — ScheduleLegend.js L379-434 추출.
 * 통합 스케줄(범례) + 어드민 대시보드(카드) 양쪽에서 동일 마크업·a11y 로 재사용한다.
 *
 * - props.items === null/undefined : 컴포넌트 자체 미렌더 (sentinel — 첫 응답 미수신)
 * - props.items === []             : «모두 작성됨» placeholder (variant 별 라벨 분기)
 * - 그 외                          : 상담사별 누락 일자 칩 리스트
 *
 * variant:
 *   - 'integrated' (기본): 「이번 달 모든 일정의 상담일지가 작성되었습니다」
 *   - 'dashboard'        : 「지난 일정의 모든 상담일지가 작성되었습니다」
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { toDisplayString } from '../../../utils/safeDisplay';

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
 * 상담사별 상담일지 누락 일자 리스트.
 *
 * @param {object} props
 * @param {null|Array<{consultantId: number|string, consultantName: string, missingDates: string[]}>} props.items
 * @param {'integrated'|'dashboard'} [props.variant='integrated']
 * @param {string} [props.sectionClassName='mg-v2-legend-section mg-v2-legend-missing-logs']
 * @param {string} [props.titleClassName='mg-v2-legend-title']
 * @param {boolean} [props.showTitle=true]                                   타이틀 노출 여부 (대시보드 카드는 외부 헤더로 대체 가능)
 */
const MissingConsultationLogsList = ({
    items,
    variant = 'integrated',
    sectionClassName = 'mg-v2-legend-section mg-v2-legend-missing-logs',
    titleClassName = 'mg-v2-legend-title',
    showTitle = true
}) => {
    const { t } = useTranslation();

    if (!Array.isArray(items)) {
        return null;
    }

    const titleLabel = t(resolveTitleKey(), { defaultValue: resolveTitleDefault() });
    const emptyLabel = t(resolveEmptyKey(variant), { defaultValue: resolveEmptyDefault(variant) });

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
                        const dates = Array.isArray(item?.missingDates) ? item.missingDates : [];
                        const itemAria = t(
                            'admin:mapping.schedule.legend.missingConsultationLogsItemAria',
                            {
                                name,
                                count: dates.length,
                                defaultValue: `${name}, 미작성 ${dates.length}건`
                            }
                        );
                        return (
                            <div
                                key={`missing-${item?.consultantId ?? name}`}
                                className="mg-v2-legend-missing-logs__item"
                                aria-label={itemAria}
                            >
                                <span className="mg-v2-legend-missing-logs__name">{name}</span>
                                <span className="mg-v2-legend-missing-logs__count">({dates.length})</span>
                                <span className="mg-v2-legend-missing-logs__dates">
                                    {dates.map((date) => {
                                        const safeDate = toDisplayString(date, '');
                                        const chipAria = t(
                                            'admin:mapping.schedule.legend.missingConsultationLogsDateAria',
                                            {
                                                date: safeDate,
                                                defaultValue: `${safeDate} 상담일지 미작성`
                                            }
                                        );
                                        return (
                                            <span
                                                key={`${item?.consultantId}-${safeDate}`}
                                                className="mg-v2-legend-missing-date-chip"
                                                title={safeDate}
                                                aria-label={chipAria}
                                            >
                                                {formatToMonthDay(safeDate)}
                                            </span>
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
            missingDates: PropTypes.arrayOf(PropTypes.string)
        })
    ),
    variant: PropTypes.oneOf(['integrated', 'dashboard']),
    sectionClassName: PropTypes.string,
    titleClassName: PropTypes.string,
    showTitle: PropTypes.bool
};

export default MissingConsultationLogsList;
