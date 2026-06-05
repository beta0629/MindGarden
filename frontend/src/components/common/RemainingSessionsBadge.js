/**
 * RemainingSessionsBadge - 회기/카운트 배지 (mg-v2-count-badge SSOT)
 *
 * 두 가지 모드를 지원한다:
 *  1) remainingSessions (legacy): "N 회기 남음" 형태로 노출. null/<0 이면 미렌더.
 *  2) count (generic): 임의의 카운트(숫자 또는 '99+' 같은 문자열)를 노출. ScheduleLegend
 *     상담사 칩, 월별 COMPLETED 카운트 등 다양한 위치에서 재사용한다.
 *
 *  - className/title/ariaLabel 은 generic 모드에서 호출자가 자유롭게 주입한다.
 *  - 두 모드 동시 사용 금지(generic 우선).
 *
 * @author MindGarden
 * @since 2025-03-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import './RemainingSessionsBadge.css';

function RemainingSessionsBadge({
    remainingSessions,
    count,
    className,
    ariaLabel,
    title,
    // 호환성을 위해 aria-label kebab-case 도 허용 (JSX 표준).
    'aria-label': ariaLabelAttr
}) {
    const resolvedAriaLabel = ariaLabel ?? ariaLabelAttr;
    const isGenericMode = count !== undefined && count !== null;

    if (isGenericMode) {
        const classes = ['mg-v2-count-badge', className].filter(Boolean).join(' ');
        return (
            <span
                className={classes}
                title={title}
                aria-label={resolvedAriaLabel}
            >
                {count}
            </span>
        );
    }

    if (remainingSessions == null || remainingSessions < 0) {
        return null;
    }

    return (
        <span
            className={['mg-v2-count-badge', className].filter(Boolean).join(' ') || 'mg-v2-count-badge'}
            title={title}
            aria-label={resolvedAriaLabel}
        >
            {remainingSessions} 회기 남음
        </span>
    );
}

RemainingSessionsBadge.propTypes = {
    remainingSessions: PropTypes.number,
    count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    className: PropTypes.string,
    ariaLabel: PropTypes.string,
    'aria-label': PropTypes.string,
    title: PropTypes.string
};

RemainingSessionsBadge.defaultProps = {
    remainingSessions: null,
    count: undefined,
    className: undefined,
    ariaLabel: undefined,
    'aria-label': undefined,
    title: undefined
};

export default RemainingSessionsBadge;
