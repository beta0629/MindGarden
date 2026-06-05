import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toDisplayString } from '../../../utils/safeDisplay';
import RemainingSessionsBadge from '../../common/RemainingSessionsBadge';
import {
    KR_PUBLIC_HOLIDAY_LEGEND_DISCLAIMER,
    KR_PUBLIC_HOLIDAY_LEGEND_LABEL,
    SCHEDULE_LEGEND_INTEGRATED_WEEKEND_HOLIDAY_NOTE,
    SCHEDULE_LEGEND_SESSION_BOOKING_SEQUENCE_MEANING,
    SCHEDULE_LEGEND_SESSION_BOOKING_SEQUENCE_SAMPLE,
    SCHEDULE_LEGEND_SESSION_LABELS_TITLE,
    SCHEDULE_LEGEND_SESSION_REMAINING_MEANING,
    SCHEDULE_LEGEND_SESSION_REMAINING_SAMPLE
} from '../../../constants/schedule';
import { useTranslation } from 'react-i18next';
import './ScheduleLegend.css';

/** "99+" 표기 상한 — count 가 이 값을 초과하면 ariaLabel/title 에는 절대값을 노출한다. */
const CONSULTANT_COUNT_MAX_DISPLAY = 99;

/**
 * consultantCounts 가 Map 또는 일반 객체 둘 다 허용되도록 통일된 lookup 헬퍼.
 */
const lookupCount = (consultantCounts, consultantId) => {
    if (!consultantCounts || consultantId == null) {
        return undefined;
    }
    if (consultantCounts instanceof Map) {
        if (consultantCounts.has(consultantId)) {
            return consultantCounts.get(consultantId);
        }
        // id 가 number/string 불일치할 수 있으므로 보조 lookup.
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

const hasAnyConsultantCount = (consultantCounts) => {
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

const LEGEND_COLLAPSED_STORAGE_KEY = 'mg.integratedSchedule.legendCollapsed';

const readStoredBoolean = (key) => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;
        return raw === 'true';
    } catch (e) {
        return null;
    }
};

const writeStoredBoolean = (key, value) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(key, String(Boolean(value)));
    } catch (e) {
        // 무시
    }
};

/**
 * 스케줄 범례 컴포넌트 (Presentational)
 * - 순수 UI 컴포넌트
 * - 비즈니스 로직 없음
 * - props로 데이터를 받음
 * - 주요 상태만 간소화하여 표시
 *
 * 반응형 옵션 A (2026-05-26): calendarSkin === 'integrated' 인 경우
 * 상단 범례를 collapsible accordion 으로 노출하여 캘린더 영역을 확보한다.
 * 기본 상태는 접힘 (Q2=A 사용자 컴펜), localStorage 로 사용자 선호 보존.
 *
 * - collapsible 은 통합 스킨에서만 적용. 다른 라우트(상담사 캘린더 등)에서는 기존 인라인 렌더링 유지.
 * - 접힘 시 컨텐츠는 DOM 에 유지되지만 [hidden] 으로 가려 a11y/스크롤 압박 모두 회피.
 */
const ScheduleLegend = ({
    consultants,
    events,
    scheduleStatusOptions,
    getConsultantColor,
    calendarSkin,
    consultantCounts
}) => {
    const { t } = useTranslation();
    const isIntegrated = calendarSkin === 'integrated';
    const reactId = useId();
    const bodyId = `mg-v2-schedule-legend-body-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    // 카운트 데이터가 1건이라도 존재하면 통합 스킨 기본 접힘을 무시하고 강제 펼침.
    const hasCounts = useMemo(() => hasAnyConsultantCount(consultantCounts), [consultantCounts]);

    // 통합 스킨일 때만 사용자 선호 / 기본 접힘 적용
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (!isIntegrated) return false;
        const stored = readStoredBoolean(LEGEND_COLLAPSED_STORAGE_KEY);
        if (stored !== null) return stored;
        return true; // Q2=A : 기본 접힘
    });
    const userOverrideRef = useRef(readStoredBoolean(LEGEND_COLLAPSED_STORAGE_KEY) !== null);

    // calendarSkin 이 통합/비통합 사이를 토글할 수 있는 경우(매우 드문 케이스) 비통합으로 전환되면 펼친 상태 유지
    useEffect(() => {
        if (!isIntegrated) {
            setIsCollapsed(false);
        }
    }, [isIntegrated]);

    // 카운트가 도착하면 사용자 선호와 무관하게 강제 펼침(디자이너 결정).
    useEffect(() => {
        if (hasCounts && isCollapsed) {
            setIsCollapsed(false);
        }
    }, [hasCounts, isCollapsed]);

    const handleToggle = useCallback(() => {
        setIsCollapsed((prev) => {
            const next = !prev;
            userOverrideRef.current = true;
            writeStoredBoolean(LEGEND_COLLAPSED_STORAGE_KEY, next);
            return next;
        });
    }, []);

    // 활성 상담사 필터링.
    //  - 카운트 모드(월별 COMPLETED 카운트 보유) : 카운트가 있는 모든 활성 상담사 노출(0건 포함).
    //    slice(0, 5) 상한 해제 — flex-wrap 으로 다중 줄 처리.
    //  - 비카운트 모드(기존 동작) : 이벤트가 있는 활성 상담사 최대 5명.
    const activeConsultants = useMemo(() => {
        const safeConsultants = Array.isArray(consultants) ? consultants : [];
        if (hasCounts) {
            return safeConsultants.filter((consultant) => {
                if (consultant.isActive === false) {
                    return false;
                }
                const count = lookupCount(consultantCounts, consultant.id);
                return count !== undefined && count !== null;
            });
        }
        return safeConsultants
            .filter((consultant) =>
                consultant.isActive !== false
                && events.some((event) => event.extendedProps?.consultantId === consultant.id)
            )
            .slice(0, 5);
    }, [consultants, events, consultantCounts, hasCounts]);

    // 주요 상태만 필터링 (확인됨, 결제확인, 완료, 취소됨 등)
    const mainStatuses = scheduleStatusOptions?.filter(option =>
        ['확인됨', '결제확인', '완료', '취소됨', '승인됨'].includes(option.label)
    ) || [];

    const bodyContent = (
        <>
            <div className="mg-v2-legend-section mg-v2-legend-section--kr-public-holiday">
                <div className="mg-v2-legend-title">{toDisplayString(KR_PUBLIC_HOLIDAY_LEGEND_LABEL)}</div>
                <div className="mg-v2-legend-kr-ph-row">
                    <span className="mg-v2-legend-kr-ph-swatch" aria-hidden="true" />
                    <p className="mg-v2-legend-kr-ph-disclaimer">{toDisplayString(KR_PUBLIC_HOLIDAY_LEGEND_DISCLAIMER)}</p>
                </div>
                {isIntegrated && (
                    <p className="mg-v2-legend-weekend-holiday-note">
                        {toDisplayString(SCHEDULE_LEGEND_INTEGRATED_WEEKEND_HOLIDAY_NOTE)}
                    </p>
                )}
            </div>
            {isIntegrated && (
                <div className="mg-v2-legend-section mg-v2-legend-section--session-labels">
                    <div className="mg-v2-legend-title">{toDisplayString(SCHEDULE_LEGEND_SESSION_LABELS_TITLE)}</div>
                    <div className="mg-v2-legend-session-items">
                        <div className="mg-v2-legend-session-item">
                            <span
                                className="mg-v2-legend-session-sample mg-v2-legend-session-sample--booking-sequence mg-v2-ad-calendar-event__sessions mg-v2-ad-calendar-event__sessions--booking-sequence"
                                aria-hidden="true"
                            >
                                {toDisplayString(SCHEDULE_LEGEND_SESSION_BOOKING_SEQUENCE_SAMPLE)}
                            </span>
                            <span className="mg-v2-legend-text">
                                {`= ${toDisplayString(SCHEDULE_LEGEND_SESSION_BOOKING_SEQUENCE_MEANING)}`}
                            </span>
                        </div>
                        <div className="mg-v2-legend-session-item">
                            <span
                                className="mg-v2-legend-session-sample mg-v2-legend-session-sample--remaining mg-v2-ad-calendar-event__sessions mg-v2-ad-calendar-event__sessions--remaining"
                                aria-hidden="true"
                            >
                                {toDisplayString(SCHEDULE_LEGEND_SESSION_REMAINING_SAMPLE)}
                            </span>
                            <span className="mg-v2-legend-text">
                                {`= ${toDisplayString(SCHEDULE_LEGEND_SESSION_REMAINING_MEANING)}`}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            {/* 상담사가 있을 때만 표시 */}
            {activeConsultants.length > 0 && (
                <div className="mg-v2-legend-section">
                    <div className="mg-v2-legend-title">{t('common.labels.consultant')}</div>
                    <div className="mg-v2-legend-items mg-v2-consultant-legend">
                        {activeConsultants.map((consultant, index) => {
                            const consultantName = toDisplayString(consultant.name, '—');
                            const rawCount = lookupCount(consultantCounts, consultant.id);
                            const hasCount = rawCount !== undefined && rawCount !== null;
                            const numericCount = hasCount ? Number(rawCount) : null;
                            const isZeroCount = hasCount && numericCount === 0;
                            const isOverflow = hasCount && Number.isFinite(numericCount)
                                && numericCount > CONSULTANT_COUNT_MAX_DISPLAY;
                            const displayCount = isOverflow
                                ? `${CONSULTANT_COUNT_MAX_DISPLAY}+`
                                : numericCount;
                            const badgeClassName = `mg-v2-legend-count-badge${isZeroCount ? ' mg-v2-count-badge--zero' : ''}`;
                            const badgeAriaLabel = hasCount
                                ? t(
                                    'admin:integratedSchedule.legend.consultantCompletedAria',
                                    {
                                        name: consultantName,
                                        count: numericCount,
                                        defaultValue: `${consultantName}, 이번 달 완료 ${numericCount}회`
                                    }
                                )
                                : undefined;
                            const badgeTitle = isOverflow ? `${numericCount}회` : undefined;
                            return (
                                <div key={`consultant-${consultant.id}-${index}`} className="mg-v2-legend-item">
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
                        {!hasCounts && consultants.length > 5 && (
                            <span className="mg-v2-legend-more">외 {consultants.length - 5}명</span>
                        )}
                    </div>
                </div>
            )}

            {/* 주요 상태만 표시 - 오른쪽에 위치 */}
            {mainStatuses.length > 0 && (
                <div className="mg-v2-legend-section mg-v2-legend-section-right">
                    <div className="mg-v2-legend-title">주요 상태</div>
                    <div className="mg-v2-legend-items">
                        {mainStatuses.map((option, index) => (
                            <div key={option.value || `status-${index}`} className="mg-v2-legend-item">
                                <span
                                    className="mg-v2-legend-color"
                                    style={{ '--legend-color': option.color }}
                                 />
                                <span className="mg-v2-legend-text">{toDisplayString(option.label, '—')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );

    const rootClassName = [
        'mg-v2-schedule-legend',
        'mg-v2-ad-b0kla',
        isIntegrated ? 'mg-v2-schedule-legend--calendar-skin-integrated' : '',
        isIntegrated ? 'mg-v2-schedule-legend--collapsible' : '',
        isIntegrated && isCollapsed ? 'mg-v2-schedule-legend--collapsed' : ''
    ].filter(Boolean).join(' ');

    if (!isIntegrated) {
        // 비통합 스킨: 기존 구조 그대로 유지
        return <div className={rootClassName}>{bodyContent}</div>;
    }

    return (
        <div className={rootClassName}>
            <button
                type="button"
                className="mg-v2-schedule-legend__toggle"
                onClick={handleToggle}
                aria-expanded={!isCollapsed}
                aria-controls={bodyId}
                aria-label={
                    isCollapsed
                        ? t('integratedSchedule.legend.expandAria')
                        : t('integratedSchedule.legend.collapseAria')
                }
            >
                <span className="mg-v2-schedule-legend__toggle-heading">
                    {t('integratedSchedule.legend.heading')}
                </span>
                <span className="mg-v2-schedule-legend__toggle-summary">
                    ({t('integratedSchedule.legend.summary')})
                </span>
                <ChevronDown
                    size={16}
                    className="mg-v2-schedule-legend__toggle-icon"
                    aria-hidden="true"
                />
            </button>
            <div
                id={bodyId}
                className="mg-v2-schedule-legend__body"
                hidden={isCollapsed}
            >
                {bodyContent}
            </div>
        </div>
    );
};

export default ScheduleLegend;
