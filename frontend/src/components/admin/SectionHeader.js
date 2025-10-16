import React from 'react';
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
        <div className="mg-section-header">
            <div className="mg-section-content">
                <div className="mg-section-title-area">
                    <div className="mg-flex mg-items-center mg-gap-sm">
                        {icon && <div className="mg-section-icon">{icon}</div>}
                        <h2 className="mg-section-title">{title}</h2>
                    </div>
                    {subtitle && (
                        <div className="mg-section-subtitle">
                            <span className="mg-badge mg-badge-info">{subtitle}</span>
                        </div>
                    )}
                    {stats && (
                        <div className="mg-section-stats">
                            {stats.map((stat, index) => (
                                <div key={`stat-${index}`} className="mg-stat-item">
                                    <span className="mg-stat-label">{stat.label}</span>
                                    <span className="mg-stat-value">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {actions && (
                    <div className="mg-section-actions">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SectionHeader;
