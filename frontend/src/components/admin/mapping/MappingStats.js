import React from 'react';
import { 
    MAPPING_STAT_ICONS, 
    MAPPING_STAT_LABELS, 
    MAPPING_STAT_COLORS, 
    MAPPING_STAT_BG_COLORS 
} from '../../../constants/mapping';

/**
 * 매핑 통계 컴포넌트
 * - 매핑 상태별 통계 표시
 * - 시각적 통계 카드
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingStats = ({ mappings = [], onStatCardClick }) => {
    // 통계 계산
    const stats = {
        pending: mappings.filter(m => m.status === 'PENDING_PAYMENT').length,
        active: mappings.filter(m => m.status === 'ACTIVE').length,
        total: mappings.length,
        paymentConfirmed: mappings.filter(m => m.status === 'PAYMENT_CONFIRMED').length,
        terminated: mappings.filter(m => m.status === 'TERMINATED').length,
        sessionsExhausted: mappings.filter(m => m.status === 'SESSIONS_EXHAUSTED').length
    };

    const statCards = [
        {
            id: 'PENDING_PAYMENT',
            icon: MAPPING_STAT_ICONS.PENDING,
            label: MAPPING_STAT_LABELS.PENDING,
            value: stats.pending,
            color: MAPPING_STAT_COLORS.PENDING,
            bgColor: MAPPING_STAT_BG_COLORS.PENDING,
            action: 'payment' // 결제 확인 액션
        },
        {
            id: 'ACTIVE',
            icon: MAPPING_STAT_ICONS.ACTIVE,
            label: MAPPING_STAT_LABELS.ACTIVE,
            value: stats.active,
            color: MAPPING_STAT_COLORS.ACTIVE,
            bgColor: MAPPING_STAT_BG_COLORS.ACTIVE,
            action: 'view' // 활성 매핑 조회
        },
        {
            id: 'PAYMENT_CONFIRMED',
            icon: MAPPING_STAT_ICONS.PAYMENT_CONFIRMED,
            label: MAPPING_STAT_LABELS.PAYMENT_CONFIRMED,
            value: stats.paymentConfirmed,
            color: MAPPING_STAT_COLORS.PAYMENT_CONFIRMED,
            bgColor: MAPPING_STAT_BG_COLORS.PAYMENT_CONFIRMED,
            action: 'view' // 입금 확인된 매핑 조회
        },
        {
            id: 'TOTAL',
            icon: MAPPING_STAT_ICONS.TOTAL,
            label: MAPPING_STAT_LABELS.TOTAL,
            value: stats.total,
            color: MAPPING_STAT_COLORS.TOTAL,
            bgColor: MAPPING_STAT_BG_COLORS.TOTAL,
            action: 'view_all' // 전체 매핑 조회
        },
        {
            id: 'TERMINATED',
            icon: MAPPING_STAT_ICONS.TERMINATED,
            label: MAPPING_STAT_LABELS.TERMINATED,
            value: stats.terminated,
            color: MAPPING_STAT_COLORS.TERMINATED,
            bgColor: MAPPING_STAT_BG_COLORS.TERMINATED,
            action: 'view' // 종료된 매핑 조회
        },
        {
            id: 'SESSIONS_EXHAUSTED',
            icon: MAPPING_STAT_ICONS.SESSIONS_EXHAUSTED,
            label: MAPPING_STAT_LABELS.SESSIONS_EXHAUSTED,
            value: stats.sessionsExhausted,
            color: MAPPING_STAT_COLORS.SESSIONS_EXHAUSTED,
            bgColor: MAPPING_STAT_BG_COLORS.SESSIONS_EXHAUSTED,
            action: 'view' // 회기 소진된 매핑 조회
        }
    ];

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
                    fontSize: '18px',
                    fontWeight: '600'
                }}>📊 매핑 통계</h3>
                <p style={{
                    margin: '0',
                    fontSize: '14px',
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
                            fontSize: '24px',
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
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#6c757d',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '2px'
                            }}>{stat.label}</div>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                lineHeight: 1,
                                color: stat.color
                            }}>
                                {stat.value}건
                            </div>
                        </div>
                        <div style={{
                            fontSize: '12px',
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
                                fontSize: '10px',
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
                        fontSize: '12px',
                        color: '#6c757d',
                        fontWeight: '500'
                    }}>총 매핑 수:</span>
                    <span style={{
                        fontSize: '16px',
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
                        fontSize: '12px',
                        color: '#6c757d',
                        fontWeight: '500'
                    }}>활성 비율:</span>
                    <span style={{
                        fontSize: '16px',
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
                        fontSize: '12px',
                        color: '#6c757d',
                        fontWeight: '500'
                    }}>승인 대기 비율:</span>
                    <span style={{
                        fontSize: '16px',
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
