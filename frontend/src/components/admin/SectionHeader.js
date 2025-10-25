import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import './SectionHeader.css';

/**
 * 섹션 헤더 컴포넌트
 * - 섹션 제목, 부제목, 통계 정보를 포함
 * - 아이폰 스타일과 글래스모피즘 효과 적용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const SectionHeader = ({ 
    title, 
    subtitle, 
    icon, 
    stats = null,
    actions = null 
}) => {
    return (
        <div className="mg-v2-section-header">
            <div className="mg-v2-section-content">
                <div className="mg-v2-section-title-area">
                    <div className="mg-v2-flex mg-v2-items-center mg-v2-gap-sm">
                        {icon && <div className="mg-v2-section-icon">{icon}</div>}
                        <h2 className="mg-v2-section-title">{title}</h2>
                    </div>
                    {subtitle && (
                        <div className="mg-v2-section-subtitle">
                            <span className="mg-v2-badge mg-v2-badge-info">{subtitle}</span>
                        </div>
                    )}
                    {stats && (
                        <div className="mg-v2-section-stats">
                            {stats.map((stat, index) => (
                                <div key={`stat-${index}`} className="mg-v2-stat-item">
                                    <span className="mg-v2-stat-label">{stat.label}</span>
                                    <span className="mg-v2-stat-value">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {actions && (
                    <div className="mg-v2-section-actions">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SectionHeader;
