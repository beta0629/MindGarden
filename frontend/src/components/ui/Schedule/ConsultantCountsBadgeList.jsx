/**
 * ConsultantCountsBadgeList — 상담사 칩 + COMPLETED 카운트 배지 공통 리스트.
 *
 * Phase 3-B (R6 2026-06-06) — ScheduleLegend.js L296-353 추출.
 * IntegratedMatchingSchedule(통합 스케줄)와 AdminDashboardV2(어드민 대시보드)에서
 * 동일한 비주얼·상호작용으로 재사용한다 (한 사람이 만든 것처럼).
 *
 * - props.mode === 'monthly'    : 라벨 분기 「상담사 · {N}월 완료」 / fallback 「상담사」
 * - props.mode === 'cumulative' : 라벨 「상담사 · 누적 완료」
 * - 카운트 데이터 없음(빈 객체/Map 또는 hasCounts=false) 시 호출자가 활성 상담사를
 *   직접 전달했을 때만 노출 (fallback events 슬라이스는 ScheduleLegend.js 가 담당).
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import RemainingSessionsBadge from '../../common/RemainingSessionsBadge';
import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * P1 (2026-06-06) — 카운트 축약 정책 폐지.
 *
 * 이전: `99+` 같은 축약 표기로 ariaLabel/title 에 절대값을 별도 노출.
 * 변경: 사용자 요구에 따라 **항상 정확한 카운트**를 그대로 노출한다.
 * 호환: 외부에서 import 가능했으므로 export 는 유지하되 `Infinity` 로 의미를 무력화.
 *       (이 상수는 deprecated — 신규 코드에서는 직접 참조하지 말 것.)
 */
export const CONSULTANT_COUNT_MAX_DISPLAY = Infinity;

/**
 * consultantCounts 가 Map 또는 일반 객체 둘 다 허용되도록 통일된 lookup 헬퍼.
 * id 가 number/string 불일치할 수 있어 두 키 모두 시도한다.
 */
export const lookupCount = (consultantCounts, consultantId) => {
    if (!consultantCounts || consultantId == null) {
        return undefined;
    }
    if (consultantCounts instanceof Map) {
        if (consultantCounts.has(consultantId)) {
            return consultantCounts.get(consultantId);
        }
        const stringId = String(consultantId);
        if (consultantCounts.has(stringId)) {
            return consultantCounts.get(stringId);
        }
        return undefined;
    }
    if (typeof consultantCounts === 'object') {
        if (Object.prototype.hasOwnProperty.call(consultantCounts, consultantId)) {
            return consultantCounts[consultantId];
        }
        const stringId = String(consultantId);
        if (Object.prototype.hasOwnProperty.call(consultantCounts, stringId)) {
            return consultantCounts[stringId];
        }
    }
    return undefined;
};

export const hasAnyConsultantCount = (consultantCounts) => {
    if (!consultantCounts) {
        return false;
    }
    if (consultantCounts instanceof Map) {
        return consultantCounts.size > 0;
    }
    if (typeof consultantCounts === 'object') {
        return Object.keys(consultantCounts).length > 0;
    }
    return false;
};

const resolveTitleLabel = (t, mode, consultantCountsMonth, hasCounts) => {
    if (!hasCounts) {
        return t('common.labels.consultant');
    }
    if (mode === 'cumulative') {
        return t('admin:integratedSchedule.legend.consultantCumulativeCompleted', {
            defaultValue: '상담사 · 누적 완료'
        });
    }
    if (mode === 'monthly' && Number.isFinite(consultantCountsMonth)) {
        return t('admin:integratedSchedule.legend.consultantMonthlyCompleted', {
            month: consultantCountsMonth,
            defaultValue: `상담사 · ${consultantCountsMonth}월 완료`
        });
    }
    return t('common.labels.consultant');
};

/**
 * 상담사 칩 + 카운트 배지 리스트.
 *
 * @param {object} props
 * @param {Array<{id: number|string, name: string, isActive?: boolean}>} props.consultants  활성 상담사
 * @param {(consultantId: number|string) => string} props.getConsultantColor               칩 색 resolver
 * @param {Map|Object|null|undefined} props.consultantCounts                                카운트 매핑
 * @param {number|null} [props.consultantCountsMonth=null]                                  monthly 라벨용 월
 * @param {'monthly'|'cumulative'} [props.mode='monthly']                                   라벨 분기
 * @param {string} [props.titleClassName]                                                   라벨 클래스 override
 * @param {string} [props.itemsClassName]                                                   리스트 컨테이너 클래스 override
 */
const ConsultantCountsBadgeList = ({
    consultants,
    getConsultantColor,
    consultantCounts,
    consultantCountsMonth = null,
    mode = 'monthly',
    titleClassName = 'mg-v2-legend-title',
    itemsClassName = 'mg-v2-legend-items mg-v2-consultant-legend'
}) => {
    const { t } = useTranslation();
    const hasCounts = useMemo(() => hasAnyConsultantCount(consultantCounts), [consultantCounts]);

    const safeConsultants = useMemo(() => {
        if (!Array.isArray(consultants)) return [];
        return consultants.filter((c) => c && c.isActive !== false);
    }, [consultants]);

    if (safeConsultants.length === 0) {
        return null;
    }

    const titleLabel = resolveTitleLabel(t, mode, consultantCountsMonth, hasCounts);

    return (
        <>
            <div className={titleClassName}>{titleLabel}</div>
            <div className={itemsClassName}>
                {safeConsultants.map((consultant, index) => {
                    const consultantName = toDisplayString(consultant.name, '—');
                    const rawCount = lookupCount(consultantCounts, consultant.id);
                    const hasCount = rawCount !== undefined && rawCount !== null;
                    const numericCount = hasCount ? Number(rawCount) : null;
                    const isZeroCount = hasCount && numericCount === 0;
                    /*
                     * P1 (2026-06-06) — 99+ 축약 폐지. 항상 정확한 카운트를 노출.
                     * Number 가 아니거나 NaN 인 경우엔 안전하게 그대로 numericCount(NaN→배지 비노출은 호출자 책임)를
                     * 사용한다. RemainingSessionsBadge 의 min-width 가 3-4자리도 시각적으로 깨지지 않는지 확인됨.
                     */
                    const displayCount = numericCount;
                    const badgeClassName = `mg-v2-legend-count-badge${isZeroCount ? ' mg-v2-count-badge--zero' : ''}`;
                    const ariaKey = mode === 'cumulative'
                        ? 'admin:integratedSchedule.legend.consultantCumulativeCompletedAria'
                        : 'admin:integratedSchedule.legend.consultantCompletedAria';
                    const ariaDefault = mode === 'cumulative'
                        ? `${consultantName}, 누적 완료 ${numericCount}회`
                        : `${consultantName}, 이번 달 완료 ${numericCount}회`;
                    const badgeAriaLabel = hasCount
                        ? t(ariaKey, {
                            name: consultantName,
                            count: numericCount,
                            defaultValue: ariaDefault
                        })
                        : undefined;
                    /* P1: 99+ 폐지에 따라 별도 title 노출 불필요 — aria-label 이 정확한 카운트 포함. */
                    const badgeTitle = undefined;
                    return (
                        <div
                            key={`consultant-${consultant.id}-${index}`}
                            className="mg-v2-legend-item"
                        >
                            <span
                                className="mg-v2-legend-color"
                                style={{ '--legend-color': getConsultantColor(consultant.id) }}
                            />
                            <span className="mg-v2-legend-text">{consultantName}</span>
                            {hasCount && (
                                <RemainingSessionsBadge
                                    count={displayCount}
                                    className={badgeClassName}
                                    ariaLabel={badgeAriaLabel}
                                    title={badgeTitle}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

ConsultantCountsBadgeList.propTypes = {
    consultants: PropTypes.array,
    getConsultantColor: PropTypes.func.isRequired,
    consultantCounts: PropTypes.oneOfType([
        PropTypes.instanceOf(Map),
        PropTypes.object
    ]),
    consultantCountsMonth: PropTypes.number,
    mode: PropTypes.oneOf(['monthly', 'cumulative']),
    titleClassName: PropTypes.string,
    itemsClassName: PropTypes.string
};

export default ConsultantCountsBadgeList;
