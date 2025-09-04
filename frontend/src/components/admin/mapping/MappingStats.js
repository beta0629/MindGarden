import React from 'react';
import { 
    MAPPING_STAT_ICONS, 
    MAPPING_STAT_LABELS, 
    MAPPING_STAT_COLORS, 
    MAPPING_STAT_BG_COLORS 
} from '../../../constants/mapping';
import './MappingStats.css';

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
        <div className="mapping-stats">
            <div className="stats-header">
                <h3>📊 매핑 통계</h3>
                <p>현재 매핑 상태별 통계입니다.</p>
            </div>
            
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div 
                        key={index} 
                        className="stat-card clickable"
                        style={{ 
                            backgroundColor: stat.bgColor 
                        }}
                        onClick={() => onStatCardClick && onStatCardClick(stat)}
                        title={`${stat.label} 클릭하여 ${stat.action === 'payment' ? '결제 확인' : '상세 조회'}`}
                    >
                        <div className="stat-icon" style={{ color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value" style={{ color: stat.color }}>
                                {stat.value}건
                            </div>
                        </div>
                        <div className="stat-percentage">
                            {stats.total > 0 ? Math.round((stat.value / stats.total) * 100) : 0}%
                        </div>
                        {stat.action === 'payment' && stat.value > 0 && (
                            <div className="stat-action-badge">
                                💳 결제 확인
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="stats-summary">
                <div className="summary-item">
                    <span className="summary-label">총 매핑 수:</span>
                    <span className="summary-value">{stats.total}건</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">활성 비율:</span>
                    <span className="summary-value">
                        {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">승인 대기 비율:</span>
                    <span className="summary-value">
                        {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MappingStats;
