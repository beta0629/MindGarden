import React, { useState, useEffect } from 'react';
import {
    Clock,
    CheckCircle,
    CreditCard,
    LayoutGrid,
    XCircle,
    RotateCcw
} from 'lucide-react';
import {
    getMappingStatusKoreanName,
    getStatusColor
} from '../../../utils/codeHelper';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import '../../dashboard-v2/content/ContentKpiRow.css';

const KPI_ICON_SIZE = 24;

/** MappingKpiSection·B0KlA와 동일한 상태별 아이콘·variant */
const KPI_ICON_BY_STAT_ID = {
    PENDING_PAYMENT: { Icon: Clock, iconVariant: 'orange' },
    ACTIVE: { Icon: CheckCircle, iconVariant: 'green' },
    PAYMENT_CONFIRMED: { Icon: CreditCard, iconVariant: 'blue' },
    TOTAL: { Icon: LayoutGrid, iconVariant: 'blue' },
    TERMINATED: { Icon: XCircle, iconVariant: 'gray' },
    SESSIONS_EXHAUSTED: { Icon: RotateCcw, iconVariant: 'orange' }
};

/**
 * 매칭 통계 컴포넌트 (동적 처리 지원)
 * - 매칭 상태별 통계 표시
 * - 시각적 통계 카드
 * - 동적 색상/아이콘 조회
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2024-12-19
 * @updated 2025-09-14 - 동적 처리로 변경
 */
const MappingStats = ({ mappings = [], onStatCardClick }) => {
    const [statCards, setStatCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const stats = {
        pending: mappings.filter(m => m.status === 'PENDING_PAYMENT').length,
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        active: mappings.filter(m => m.status === 'ACTIVE').length,
        total: mappings.length,
        paymentConfirmed: mappings.filter(m => m.status === 'PAYMENT_CONFIRMED').length,
        terminated: mappings.filter(m => m.status === 'TERMINATED').length,
        sessionsExhausted: mappings.filter(m => m.status === 'SESSIONS_EXHAUSTED').length
    };

    useEffect(() => {
        const loadStatCards = async() => {
            try {
                setLoading(true);
                
                const [
                    pendingData,
                    activeData,
                    paymentConfirmedData,
                    totalData,
                    terminatedData,
                    sessionsExhaustedData
                ] = await Promise.all([
                    Promise.all([
                        getMappingStatusKoreanName('PENDING_PAYMENT'),
                        getStatusColor('PENDING_PAYMENT', 'MAPPING_STATUS')
                    ]).then(([label, color]) => ({
                        id: 'PENDING_PAYMENT',
                        label: label,
                        value: stats.pending,
                        color: color,
                        bgColor: `${color}20`,
                        action: 'payment',
                        status: 'PENDING_PAYMENT'
                    })),
                    
                    Promise.all([
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        getMappingStatusKoreanName('ACTIVE'),
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        getStatusColor('ACTIVE', 'MAPPING_STATUS')
                    ]).then(([label, color]) => ({
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        id: 'ACTIVE',
                        label: label,
                        value: stats.active,
                        color: color,
                        bgColor: `${color}20`,
                        action: 'view',
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        status: 'ACTIVE'
                    })),
                    
                    Promise.all([
                        getMappingStatusKoreanName('PAYMENT_CONFIRMED'),
                        getStatusColor('PAYMENT_CONFIRMED', 'MAPPING_STATUS')
                    ]).then(([label, color]) => ({
                        id: 'PAYMENT_CONFIRMED',
                        label: label,
                        value: stats.paymentConfirmed,
                        color: color,
                        bgColor: `${color}20`,
                        action: 'view',
                        status: 'PAYMENT_CONFIRMED'
                    })),
                    
                    Promise.resolve({
                        id: 'TOTAL',
                        label: '전체 매칭',
                        value: stats.total,
                        color: 'var(--color-primary)',
                        bgColor: 'var(--color-primary-light)',
                        action: 'view_all',
                        status: 'TOTAL'
                    }),
                    
                    Promise.all([
                        getMappingStatusKoreanName('TERMINATED'),
                        getStatusColor('TERMINATED', 'MAPPING_STATUS')
                    ]).then(([label, color]) => ({
                        id: 'TERMINATED',
                        label: label,
                        value: stats.terminated,
                        color: color,
                        bgColor: `${color}20`,
                        action: 'view',
                        status: 'TERMINATED'
                    })),
                    
                    Promise.all([
                        getMappingStatusKoreanName('SESSIONS_EXHAUSTED'),
                        getStatusColor('SESSIONS_EXHAUSTED', 'MAPPING_STATUS')
                    ]).then(([label, color]) => ({
                        id: 'SESSIONS_EXHAUSTED',
                        label: label,
                        value: stats.sessionsExhausted,
                        color: color,
                        bgColor: `${color}20`,
                        action: 'view',
                        status: 'SESSIONS_EXHAUSTED'
                    }))
                ]);
                
                const cardData = [
                    pendingData,
                    activeData,
                    paymentConfirmedData,
                    totalData,
                    terminatedData,
                    sessionsExhaustedData
                ];
                
                setStatCards(cardData);
                console.log('✅ 매칭 통계 카드 동적 로드 완료:', cardData);
            } catch (error) {
                console.error('매칭 통계 카드 로드 실패:', error);
                setStatCards([
                    { id: 'PENDING_PAYMENT', label: '결제 대기', value: stats.pending, color: 'var(--mg-warning-500)', bgColor: 'var(--mg-warning-50)', action: 'payment' },
                    { id: 'ACTIVE', label: '활성 매칭', value: stats.active, color: 'var(--mg-success-500)', bgColor: 'var(--mg-success-50)', action: 'view' },
                    { id: 'PAYMENT_CONFIRMED', label: '결제 확인', value: stats.paymentConfirmed, color: 'var(--mg-primary-500)', bgColor: 'var(--mg-primary-50)', action: 'view' },
                    { id: 'TOTAL', label: '전체 매칭', value: stats.total, color: 'var(--mg-primary-500)', bgColor: 'var(--mg-primary-50)', action: 'view_all' },
                    { id: 'TERMINATED', label: '종료됨', value: stats.terminated, color: 'var(--mg-error-500)', bgColor: 'var(--mg-error-50)', action: 'view' },
                    { id: 'SESSIONS_EXHAUSTED', label: '회기 소진', value: stats.sessionsExhausted, color: 'var(--mg-warning-500)', bgColor: 'var(--mg-warning-50)', action: 'view' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        
        loadStatCards();
    }, [mappings]); // mappings가 변경될 때마다 재로드

    if (loading) {
        return (
            <div className="mg-v2-content-kpi-row mg-v2-mapping-stats-loading">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="mg-v2-content-kpi-card mg-v2-content-kpi-card--skeleton">
                        <div className="mg-v2-content-kpi-card__icon mg-v2-content-kpi-card__icon--gray">
                            <LayoutGrid size={KPI_ICON_SIZE} aria-hidden />
                        </div>
                        <div className="mg-v2-content-kpi-card__info">
                            <span className="mg-v2-content-kpi-card__label">로딩 중...</span>
                            <span className="mg-v2-content-kpi-card__value">-</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="mg-v2-content-kpi-row">
            {statCards.map((stat, index) => {
                const numericValue = toSafeNumber(stat.value);
                const percentage = stats.total > 0 ? Math.round((numericValue / stats.total) * 100) : 0;
                const titleHint = `${toDisplayString(stat.label)} 클릭하여 ${
                    stat.action === 'payment' ? '결제 확인' : '상세 조회'
                }`;
                const valueLine =
                    `${numericValue}건${percentage > 0 ? ` (${percentage}%)` : ''}`;
                const { Icon: KpiIcon, iconVariant } =
                    KPI_ICON_BY_STAT_ID[stat.id] || KPI_ICON_BY_STAT_ID.TOTAL;
                return (
                    <div
                        key={stat.id || index}
                        className={`mg-v2-content-kpi-card mg-v2-content-kpi-card--clickable-split mg-v2-content-kpi-card--accent-${iconVariant}`}
                    >
                        <div className={`mg-v2-content-kpi-card__icon mg-v2-content-kpi-card__icon--${iconVariant}`}>
                            <KpiIcon size={KPI_ICON_SIZE} aria-hidden />
                        </div>
                        <MGButton
                            type="button"
                            variant="primary"
                            className="mg-v2-content-kpi-card__click-target"
                            onClick={() => onStatCardClick && onStatCardClick(stat)}
                            title={titleHint}
                            preventDoubleClick={false}
                        >
                            <div className="mg-v2-content-kpi-card__info">
                                <div className="mg-v2-content-kpi-card__top">
                                    <SafeText className="mg-v2-content-kpi-card__label">{stat.label}</SafeText>
                                    {stat.action === 'payment' && numericValue > 0 && (
                                        <span className="mg-v2-content-kpi-card__badge mg-v2-content-kpi-card__badge--orange">
                                            결제 확인
                                        </span>
                                    )}
                                </div>
                                <SafeText className="mg-v2-content-kpi-card__value">{valueLine}</SafeText>
                            </div>
                        </MGButton>
                    </div>
                );
            })}
        </div>
    );
};

export default MappingStats;
