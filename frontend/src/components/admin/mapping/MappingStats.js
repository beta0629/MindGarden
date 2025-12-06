import React, { useState, useEffect } from 'react';
import { 
    getMappingStatusKoreanName,
    getStatusColor,
    getStatusIcon
} from '../../../utils/codeHelper';

/**
 * 매칭 통계 컴포넌트 (동적 처리 지원)
/**
 * - 매칭 상태별 통계 표시
/**
 * - 시각적 통계 카드
/**
 * - 동적 색상/아이콘 조회
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2024-12-19
/**
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
        const loadStatCards = async () => {
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
                        getStatusColor('PENDING_PAYMENT', 'MAPPING_STATUS'),
                        getStatusIcon('PENDING_PAYMENT', 'MAPPING_STATUS')
                    ]).then(([label, color, icon]) => ({
                        id: 'PENDING_PAYMENT',
                        icon: icon,
                        label: label,
                        value: stats.pending,
                        color: color,
                        bgColor: color + '20',
                        action: 'payment',
                        status: 'PENDING_PAYMENT'
                    })),
                    
                    Promise.all([
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        getMappingStatusKoreanName('ACTIVE'),
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        getStatusColor('ACTIVE', 'MAPPING_STATUS'),
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        getStatusIcon('ACTIVE', 'MAPPING_STATUS')
                    ]).then(([label, color, icon]) => ({
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        id: 'ACTIVE',
                        icon: icon,
                        label: label,
                        value: stats.active,
                        color: color,
                        bgColor: color + '20',
                        action: 'view',
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        status: 'ACTIVE'
                    })),
                    
                    Promise.all([
                        getMappingStatusKoreanName('PAYMENT_CONFIRMED'),
                        getStatusColor('PAYMENT_CONFIRMED', 'MAPPING_STATUS'),
                        getStatusIcon('PAYMENT_CONFIRMED', 'MAPPING_STATUS')
                    ]).then(([label, color, icon]) => ({
                        id: 'PAYMENT_CONFIRMED',
                        icon: icon,
                        label: label,
                        value: stats.paymentConfirmed,
                        color: color,
                        bgColor: color + '20',
                        action: 'view',
                        status: 'PAYMENT_CONFIRMED'
                    })),
                    
                    Promise.resolve({
                        id: 'TOTAL',
                        icon: '📊',
                        label: '전체 매칭',
                        value: stats.total,
                        color: 'var(--color-primary)',
                        bgColor: 'var(--color-primary-light)',
                        action: 'view_all',
                        status: 'TOTAL'
                    }),
                    
                    Promise.all([
                        getMappingStatusKoreanName('TERMINATED'),
                        getStatusColor('TERMINATED', 'MAPPING_STATUS'),
                        getStatusIcon('TERMINATED', 'MAPPING_STATUS')
                    ]).then(([label, color, icon]) => ({
                        id: 'TERMINATED',
                        icon: icon,
                        label: label,
                        value: stats.terminated,
                        color: color,
                        bgColor: color + '20',
                        action: 'view',
                        status: 'TERMINATED'
                    })),
                    
                    Promise.all([
                        getMappingStatusKoreanName('SESSIONS_EXHAUSTED'),
                        getStatusColor('SESSIONS_EXHAUSTED', 'MAPPING_STATUS'),
                        getStatusIcon('SESSIONS_EXHAUSTED', 'MAPPING_STATUS')
                    ]).then(([label, color, icon]) => ({
                        id: 'SESSIONS_EXHAUSTED',
                        icon: icon,
                        label: label,
                        value: stats.sessionsExhausted,
                        color: color,
                        bgColor: color + '20',
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
                    {
                        id: 'PENDING_PAYMENT',
                        icon: '⏳',
                        label: '결제 대기',
                        value: stats.pending,
                        color: 'var(--color-warning, var(--mg-warning-500))',
                        bgColor: 'var(--color-warning-light, rgba(255, 193, 7, 0.1))',
                        action: 'payment'
                    },
                    {
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        id: 'ACTIVE',
                        icon: '✅',
                        label: '활성 매칭',
                        value: stats.active,
                        color: 'var(--color-success, var(--mg-success-500))',
                        bgColor: 'var(--color-success-light, rgba(40, 167, 69, 0.1))',
                        action: 'view'
                    },
                    {
                        id: 'PAYMENT_CONFIRMED',
                        icon: '💰',
                        label: '결제 확인',
                        value: stats.paymentConfirmed,
                        color: 'var(--color-info, var(--mg-info-500))',
                        bgColor: 'var(--color-info-light, rgba(23, 162, 184, 0.1))',
                        action: 'view'
                    },
                    {
                        id: 'TOTAL',
                        icon: '📊',
                        label: '전체 매칭',
                        value: stats.total,
                        color: 'var(--color-primary, var(--mg-primary-500))',
                        bgColor: 'var(--color-primary-light, rgba(0, 122, 255, 0.1))',
                        action: 'view_all'
                    },
                    {
                        id: 'TERMINATED',
                        icon: '❌',
                        label: '종료됨',
                        value: stats.terminated,
                        color: 'var(--color-danger, var(--mg-error-500))',
                        bgColor: 'var(--color-danger-light, rgba(220, 53, 69, 0.1))',
                        action: 'view'
                    },
                    {
                        id: 'SESSIONS_EXHAUSTED',
                        icon: '🔚',
                        label: '회기 소진',
                        value: stats.sessionsExhausted,
                        color: 'var(--color-warning, var(--mg-warning-500))',
                        bgColor: 'var(--color-warning-light, rgba(255, 193, 7, 0.1))',
                        action: 'view'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };
        
        loadStatCards();
    }, [mappings]); // mappings가 변경될 때마다 재로드

    if (loading) {
        return (
            <div className="mapping-stats-container">
                <div className="mg-v2-loading-container">
                    <div className="mg-v2-spinner"></div>
                    <p>매칭 통계를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mg-v2-mapping-stats-container">
            <div className="mg-v2-mapping-stats-header">
                <h3 className="mg-v2-mapping-stats-title">📊 매칭 통계</h3>
                <p className="mg-v2-mapping-stats-subtitle">현재 매칭 상태별 통계입니다.</p>
            </div>
            
            <div className="mg-v2-mapping-stats-grid">
                {statCards.map((stat, index) => (
                    <div 
                        key={index} 
                        className={`mg-v2-mapping-stat-card ${stat.status.toLowerCase()}-stat`}
                        onClick={() => onStatCardClick && onStatCardClick(stat)}
                        title={`${stat.label} 클릭하여 ${stat.action === 'payment' ? '결제 확인' : '상세 조회'}`}
                        data-color={stat.color}
                    >
                        <div className="mg-v2-mapping-stat-icon">
                            {stat.icon}
                        </div>
                        <div className="mg-v2-mapping-stat-content">
                            <div className="mg-v2-mapping-stat-label">{stat.label}</div>
                            <div className="mg-v2-mapping-stat-count">
                                {stat.value}건
                            </div>
                        </div>
                        <div className="mg-v2-mapping-stat-percentage">
                            {stats.total > 0 ? Math.round((stat.value / stats.total) * 100) : 0}%
                        </div>
                        {stat.action === 'payment' && stat.value > 0 && (
                            <div className="mg-v2-mapping-stat-payment-badge">
                                💳 결제 확인
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mg-v2-mapping-stats-summary">
                <div className="mg-v2-mapping-summary-item">
                    <span className="mg-v2-mapping-summary-label">총 매칭 수:</span>
                    <span className="mg-v2-mapping-summary-value">{stats.total}건</span>
                </div>
                <div className="mg-v2-mapping-summary-item">
                    <span className="mg-v2-mapping-summary-label">활성 비율:</span>
                    <span className="mg-v2-mapping-summary-value">
                        {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                </div>
                <div className="mg-v2-mapping-summary-item">
                    <span className="mg-v2-mapping-summary-label">승인 대기 비율:</span>
                    <span className="mg-v2-mapping-summary-value">
                        {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MappingStats;
