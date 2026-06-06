/**
 * CumulativeConsultantCountsChart — 누적 상담 건수 가로 막대 차트.
 *
 * P1 (2026-06-06) — 어드민 대시보드 §「상담사 별 통합데이터」 카드 §A 섹션 전용.
 * 기존 `ConsultantCountsBadgeList` (mode='cumulative') 가 칩 + 배지 텍스트로만 표시하던
 * 누적 상담 건수를, 사용자 요구에 따라 **시각적 비교가 가능한 가로 막대 그래프**로 교체한다.
 *
 * - count DESC 정렬 (1위 ~ N위)
 * - max = 활성 상담사 중 최대 count (모두 0 이면 빈 상태 placeholder)
 * - 막대 색은 `getConsultantColor(id)` 로 상담사 칩 색과 동일
 * - 카운트는 99+ 같은 축약 없이 **정확한 숫자**를 노출 (toLocaleString 사용)
 * - 색·간격·폰트 토큰만 사용 (D11 하드코딩 게이트 준수)
 *
 * @author MindGarden core-coder
 * @since 2026-06-06
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    lookupCount,
    hasAnyConsultantCount
} from '../../ui/Schedule/ConsultantCountsBadgeList';
import { toDisplayString } from '../../../utils/safeDisplay';

const identityMask = (value) => value;

const formatCount = (numericCount) => {
    if (!Number.isFinite(numericCount)) {
        return '0';
    }
    return numericCount.toLocaleString('ko-KR');
};

/**
 * 누적 상담 건수 가로 막대 차트.
 *
 * @param {object} props
 * @param {Array<{id: number|string, name: string, isActive?: boolean}>} props.consultants
 * @param {(consultantId: number|string) => string} props.getConsultantColor
 * @param {Map|Object|null|undefined} props.consultantCounts
 * @param {string} [props.sectionClassName='mg-v2-cumulative-chart']
 * @param {string} [props.titleClassName='mg-v2-cumulative-chart__title']
 * @param {string} [props.listClassName='mg-v2-cumulative-chart__list']
 * @param {(name: string) => string} [props.maskName]                 표시명 마스킹 함수 (대시보드 PII 마스킹)
 * @param {string} [props.emptyText]                                  빈 상태 placeholder override
 */
const CumulativeConsultantCountsChart = ({
    consultants,
    getConsultantColor,
    consultantCounts,
    sectionClassName = 'mg-v2-cumulative-chart',
    titleClassName = 'mg-v2-cumulative-chart__title',
    listClassName = 'mg-v2-cumulative-chart__list',
    maskName = identityMask,
    emptyText
}) => {
    const { t } = useTranslation();

    const safeConsultants = useMemo(() => {
        if (!Array.isArray(consultants)) {
            return [];
        }
        return consultants.filter((c) => c && c.id != null && c.isActive !== false);
    }, [consultants]);

    const rankedRows = useMemo(() => {
        if (safeConsultants.length === 0) {
            return [];
        }
        const rows = safeConsultants.map((consultant) => {
            const rawCount = lookupCount(consultantCounts, consultant.id);
            const numericCount = rawCount === undefined || rawCount === null
                ? 0
                : Number(rawCount);
            return {
                id: consultant.id,
                name: consultant.name,
                count: Number.isFinite(numericCount) ? numericCount : 0
            };
        });
        rows.sort((a, b) => b.count - a.count);
        return rows;
    }, [safeConsultants, consultantCounts]);

    const maxCount = useMemo(() => {
        if (rankedRows.length === 0) {
            return 0;
        }
        return rankedRows.reduce((acc, row) => (row.count > acc ? row.count : acc), 0);
    }, [rankedRows]);

    if (safeConsultants.length === 0) {
        return null;
    }

    const hasCounts = hasAnyConsultantCount(consultantCounts);
    const resolvedEmptyText = emptyText || t('admin:dashboard.consultationStats.cumulativeEmpty', {
        defaultValue: '누적 데이터가 없습니다'
    });
    const titleLabel = t('admin:dashboard.consultationStats.cumulativeTitle', {
        defaultValue: '누적 상담 건수'
    });

    if (!hasCounts || maxCount <= 0) {
        return (
            <div className={sectionClassName}>
                <div className={titleClassName}>{titleLabel}</div>
                <p className="mg-v2-cumulative-chart__empty">{resolvedEmptyText}</p>
            </div>
        );
    }

    return (
        <div className={sectionClassName}>
            <div className={titleClassName}>{titleLabel}</div>
            <ol className={listClassName} aria-label={titleLabel}>
                {rankedRows.map((row, index) => {
                    const rank = index + 1;
                    const widthPct = maxCount > 0
                        ? Math.max(2, Math.round((row.count / maxCount) * 100))
                        : 0;
                    const displayName = toDisplayString(maskName(row.name), '—');
                    const displayCount = formatCount(row.count);
                    const ariaLabel = t(
                        'admin:dashboard.consultationStats.cumulativeRowAria',
                        {
                            name: displayName,
                            count: row.count,
                            defaultValue: `${displayName} 누적 ${row.count}회`
                        }
                    );
                    const isZero = row.count === 0;
                    const fillClassName = `mg-v2-cumulative-chart__fill${isZero ? ' mg-v2-cumulative-chart__fill--zero' : ''}`;
                    const fillStyle = {
                        width: `${widthPct}%`,
                        '--cumulative-fill-color': getConsultantColor(row.id)
                    };

                    return (
                        <li
                            key={`cumulative-${row.id}-${rank}`}
                            className="mg-v2-cumulative-chart__row"
                            aria-label={ariaLabel}
                        >
                            <span className="mg-v2-cumulative-chart__rank">{`${rank}위`}</span>
                            <span
                                className="mg-v2-cumulative-chart__name"
                                title={displayName}
                            >
                                {displayName}
                            </span>
                            <div
                                className="mg-v2-cumulative-chart__track"
                                role="progressbar"
                                aria-valuenow={row.count}
                                aria-valuemin={0}
                                aria-valuemax={maxCount}
                                aria-label={ariaLabel}
                            >
                                <div className={fillClassName} style={fillStyle} />
                            </div>
                            <span className="mg-v2-cumulative-chart__value">{`${displayCount}회`}</span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};

CumulativeConsultantCountsChart.propTypes = {
    consultants: PropTypes.array,
    getConsultantColor: PropTypes.func.isRequired,
    consultantCounts: PropTypes.oneOfType([
        PropTypes.instanceOf(Map),
        PropTypes.object
    ]),
    sectionClassName: PropTypes.string,
    titleClassName: PropTypes.string,
    listClassName: PropTypes.string,
    maskName: PropTypes.func,
    emptyText: PropTypes.string
};

export default CumulativeConsultantCountsChart;
