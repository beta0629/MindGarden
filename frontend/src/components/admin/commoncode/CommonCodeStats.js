import React from 'react';
import './CommonCodeStats.css';

/**
 * 공통코드 통계 컴포넌트
 * - 전체 공통코드 수, 활성 코드 수, 코드 그룹 수 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const CommonCodeStats = ({ totalCodes, activeCodes, codeGroups }) => {
    const inactiveCodes = totalCodes - activeCodes;
    const activePercentage = totalCodes > 0 ? Math.round((activeCodes / totalCodes) * 100) : 0;

    return (
        <div className="common-code-stats">
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">
                        <i className="bi bi-list-ul"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{totalCodes}</div>
                        <div className="stat-label">전체 코드</div>
                    </div>
                </div>

                <div className="stat-card active">
                    <div className="stat-icon">
                        <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{activeCodes}</div>
                        <div className="stat-label">활성 코드</div>
                        <div className="stat-percentage">{activePercentage}%</div>
                    </div>
                </div>

                <div className="stat-card inactive">
                    <div className="stat-icon">
                        <i className="bi bi-x-circle"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{inactiveCodes}</div>
                        <div className="stat-label">비활성 코드</div>
                    </div>
                </div>

                <div className="stat-card groups">
                    <div className="stat-icon">
                        <i className="bi bi-collection"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{codeGroups}</div>
                        <div className="stat-label">코드 그룹</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommonCodeStats;
