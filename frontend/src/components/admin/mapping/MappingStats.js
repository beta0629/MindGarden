import React, { useState, useEffect } from 'react';
import { 
    getMappingStatusKoreanName,
    getStatusColor,
    getStatusIcon
} from '../../../utils/codeHelper';

/**
 * 매핑 통계 컴포넌트 (동적 처리 지원)
 * - 매핑 상태별 통계 표시
 * - 시각적 통계 카드
 * - 동적 색상/아이콘 조회
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 * @updated 2025-09-14 - 동적 처리로 변경
 */
const MappingStats = ({ mappings = [], onStatCardClick }) => {
    const [statCards, setStatCards] = useState([]);
    const [loading, setLoading] = useState(true);
    // 통계 계산
    const stats = {
        pending: mappings.filter(m => m.status === 'PENDING_PAYMENT').length,
        active: mappings.filter(m => m.status === 'ACTIVE').length,
        total: mappings.length,
        paymentConfirmed: mappings.filter(m => m.status === 'PAYMENT_CONFIRMED').length,
        terminated: mappings.filter(m => m.status === 'TERMINATED').length,
        sessionsExhausted: mappings.filter(m => m.status === 'SESSIONS_EXHAUSTED').length
    };

    // 동적 통계 카드 데이터 로드
    useEffect(() => {
        const loadStatCards = async () => {
            try {
                setLoading(true);
                
                // 동적으로 색상, 아이콘, 라벨 조회
                const cardData = await Promise.all([
                    // PENDING_PAYMENT
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
                        bgColor: color + '20', // 투명도 추가
                        action: 'payment'
                    })),
                    
                    // ACTIVE
                    Promise.all([
                        getMappingStatusKoreanName('ACTIVE'),
                        getStatusColor('ACTIVE', 'MAPPING_STATUS'),
                        getStatusIcon('ACTIVE', 'MAPPING_STATUS')
                    ]).then(([label, color, icon]) => ({
                        id: 'ACTIVE',
                        icon: icon,
                        label: label,
                        value: stats.active,
                        color: color,
                        bgColor: color + '20',
                        action: 'view'
                    })),
                    
                    // PAYMENT_CONFIRMED
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
                        action: 'view'
                    })),
                    
                    // TOTAL (특별 처리)
                    Promise.resolve({
                        id: 'TOTAL',
                        icon: '📊',
                        label: '전체 매핑',
                        value: stats.total,
                        color: '#6f42c1',
                        bgColor: '#6f42c120',
                        action: 'view_all'
                    }),
                    
                    // TERMINATED
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
                        action: 'view'
                    })),
                    
                    // SESSIONS_EXHAUSTED
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
                        action: 'view'
                    }))
                ]);
                
                setStatCards(cardData);
                console.log('✅ 매핑 통계 카드 동적 로드 완료:', cardData);
            } catch (error) {
                console.error('매핑 통계 카드 로드 실패:', error);
                // 오류 시 기본값 설정
                setStatCards([
                    {
                        id: 'PENDING_PAYMENT',
                        icon: '⏳',
                        label: '결제 대기',
                        value: stats.pending,
                        color: '#ffc107',
                        bgColor: '#ffc10720',
                        action: 'payment'
                    },
                    {
                        id: 'ACTIVE',
                        icon: '✅',
                        label: '활성 매핑',
                        value: stats.active,
                        color: '#28a745',
                        bgColor: '#28a74520',
                        action: 'view'
                    },
                    {
                        id: 'PAYMENT_CONFIRMED',
                        icon: '💰',
                        label: '결제 확인',
                        value: stats.paymentConfirmed,
                        color: '#17a2b8',
                        bgColor: '#17a2b820',
                        action: 'view'
                    },
                    {
                        id: 'TOTAL',
                        icon: '📊',
                        label: '전체 매핑',
                        value: stats.total,
                        color: '#6f42c1',
                        bgColor: '#6f42c120',
                        action: 'view_all'
                    },
                    {
                        id: 'TERMINATED',
                        icon: '❌',
                        label: '종료됨',
                        value: stats.terminated,
                        color: '#dc3545',
                        bgColor: '#dc354520',
                        action: 'view'
                    },
                    {
                        id: 'SESSIONS_EXHAUSTED',
                        icon: '🔚',
                        label: '회기 소진',
                        value: stats.sessionsExhausted,
                        color: '#fd7e14',
                        bgColor: '#fd7e1420',
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
                <div style={{ color: '#7B68EE', fontSize: 'var(--font-size-base)' }}>
                    매핑 통계를 불러오는 중...
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px',
            border: '1px solid #e1e8ed',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #E8E0FF 0%, #D1C4E9 100%)',
                color: '#7B68EE',
                textAlign: 'center'
            }}>
                <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '600'
                }}>📊 매핑 통계</h3>
                <p style={{
                    margin: '0',
                    fontSize: 'var(--font-size-sm)',
                    opacity: 0.9
                }}>현재 매핑 상태별 통계입니다.</p>
            </div>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                padding: '20px'
            }}>
                {statCards.map((stat, index) => (
                    <div 
                        key={index} 
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e1e8ed',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            userSelect: 'none',
                            background: stat.bgColor
                        }}
                        onClick={() => onStatCardClick && onStatCardClick(stat)}
                        title={`${stat.label} 클릭하여 ${stat.action === 'payment' ? '결제 확인' : '상세 조회'}`}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            fontSize: 'var(--font-size-xxl)',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: stat.color
                        }}>
                            {stat.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '600',
                                color: '#6c757d',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '2px'
                            }}>{stat.label}</div>
                            <div style={{
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: '700',
                                lineHeight: 1,
                                color: stat.color
                            }}>
                                {stat.value}건
                            </div>
                        </div>
                        <div style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            color: '#6c757d',
                            background: 'rgba(255, 255, 255, 0.2)',
                            padding: '4px 8px',
                            borderRadius: '12px'
                        }}>
                            {stats.total > 0 ? Math.round((stat.value / stats.total) * 100) : 0}%
                        </div>
                        {stat.action === 'payment' && stat.value > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(255, 255, 255, 0.9)',
                                color: '#059669',
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '600',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #10b981',
                                animation: 'pulse 2s infinite'
                            }}>
                                💳 결제 확인
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                padding: '16px 20px',
                background: '#f8f9fa',
                borderTop: '1px solid #e1e8ed'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span style={{
                        fontSize: 'var(--font-size-xs)',
                        color: '#6c757d',
                        fontWeight: '500'
                    }}>총 매핑 수:</span>
                    <span style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: '700',
                        color: '#2c3e50'
                    }}>{stats.total}건</span>
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span style={{
                        fontSize: 'var(--font-size-xs)',
                        color: '#6c757d',
                        fontWeight: '500'
                    }}>활성 비율:</span>
                    <span style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: '700',
                        color: '#2c3e50'
                    }}>
                        {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span style={{
                        fontSize: 'var(--font-size-xs)',
                        color: '#6c757d',
                        fontWeight: '500'
                    }}>승인 대기 비율:</span>
                    <span style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: '700',
                        color: '#2c3e50'
                    }}>
                        {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MappingStats;
