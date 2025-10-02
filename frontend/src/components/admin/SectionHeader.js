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
        <div className="section-header">
            <div className="section-title-area">
                <div className="title-with-icon">
                    {icon && <i className={`bi ${icon} section-icon`}></i>}
                    <h2 className="section-title">{title}</h2>
                </div>
                {subtitle && (
                    <div className="section-subtitle">{subtitle}</div>
                )}
                {stats && (
                    <div className="section-stats">
                        {stats.map((stat, index) => (
                            <div key={`stat-${index}`} className="stat-item">
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {actions && (
                <div className="section-actions">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default SectionHeader;
