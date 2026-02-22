import React from 'react';
import './DropoutRiskIndicator.css';

/**
 * 중도 탈락 위험 지표 컴포넌트
 *
 * @param {Object} props
 * @param {Object} props.risk - 탈락 위험 평가 데이터
 */
const DropoutRiskIndicator = ({ risk }) => {
    const getRiskColor = (level) => {
        const colors = {
            'CRITICAL': '#dc2626',
            'HIGH': '#ea580c',
            'MEDIUM': '#f59e0b',
            'LOW': '#10b981',
        };
        return colors[level] || '#6b7280';
    };

    const getRiskLabel = (level) => {
        const labels = {
            'CRITICAL': '매우 높음',
            'HIGH': '높음',
            'MEDIUM': '보통',
            'LOW': '낮음',
        };
        return labels[level] || level;
    };

    return (
        <div className="dropout-risk-indicator">
            <h3>⚠️ 중도 탈락 위험도</h3>

            <div className="risk-display">
                <div
                    className="risk-level-badge"
                    style={{ backgroundColor: getRiskColor(risk.dropoutRiskLevel) }}
                >
                    {getRiskLabel(risk.dropoutRiskLevel)}
                </div>

                <div className="risk-probability">
                    <div className="prob-circle">
                        <svg width="120" height="120">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke={getRiskColor(risk.dropoutRiskLevel)}
                                strokeWidth="10"
                                strokeDasharray={`${2 * Math.PI * 50 * risk.dropoutProbability} ${2 * Math.PI * 50}`}
                                strokeDashoffset={2 * Math.PI * 50 * 0.25}
                                style={{ transition: 'stroke-dasharray 1s ease' }}
                            />
                            <text x="60" y="70" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#1f2937">
                                {(risk.dropoutProbability * 100).toFixed(0)}%
                            </text>
                        </svg>
                    </div>
                </div>
            </div>

            {/* 참여도 지표 */}
            <div className="engagement-metrics">
                <h4>참여도 지표</h4>
                <div className="metric-item">
                    <span>참여 점수</span>
                    <div className="metric-bar">
                        <div
                            className="metric-fill"
                            style={{ width: `${risk.engagementScore * 100}%`, backgroundColor: '#3b82f6' }}
                        ></div>
                    </div>
                    <span>{(risk.engagementScore * 100).toFixed(0)}%</span>
                </div>

                <div className="metric-item">
                    <span>출석률</span>
                    <div className="metric-bar">
                        <div
                            className="metric-fill"
                            style={{ width: `${risk.attendanceRate * 100}%`, backgroundColor: '#10b981' }}
                        ></div>
                    </div>
                    <span>{(risk.attendanceRate * 100).toFixed(0)}%</span>
                </div>
            </div>

            {/* 경고 신호 */}
            {risk.warningSigns && JSON.parse(risk.warningSigns).length > 0 && (
                <div className="warning-signs">
                    <h4>⚠️ 경고 신호</h4>
                    <ul>
                        {JSON.parse(risk.warningSigns).map((sign, index) => (
                            <li key={index}>{sign}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 권장 조치 */}
            {risk.earlyInterventionNeeded && risk.recommendedActions && (
                <div className="intervention-needed">
                    <h4>🚨 조기 개입 필요</h4>
                    <ul>
                        {JSON.parse(risk.recommendedActions).map((action, index) => (
                            <li key={index}>{action}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DropoutRiskIndicator;
