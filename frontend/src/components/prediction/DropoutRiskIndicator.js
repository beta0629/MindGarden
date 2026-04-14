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
      CRITICAL: 'var(--mg-error-500)',
      HIGH: 'var(--mg-warning-600)',
      MEDIUM: 'var(--mg-warning-500)',
      LOW: 'var(--mg-success-500)'
    };
    return colors[level] || 'var(--mg-gray-500)';
  };

  const getRiskLabel = (level) => {
    const labels = {
      CRITICAL: '매우 높음',
      HIGH: '높음',
      MEDIUM: '보통',
      LOW: '낮음'
    };
    return labels[level] || level;
  };

  return (
    <div className="dropout-risk-indicator">
      <h3>중도 탈락 위험도</h3>

      <div className="risk-display">
        <div
          className="risk-level-badge"
          style={{ backgroundColor: getRiskColor(risk.dropoutRiskLevel) }}
        >
          {getRiskLabel(risk.dropoutRiskLevel)}
        </div>

        <div className="risk-probability">
          <div className="risk-probability-text">
            <span
              className="risk-prob-value"
              style={{ color: getRiskColor(risk.dropoutRiskLevel) }}
            >
              {(risk.dropoutProbability * 100).toFixed(0)}%
            </span>
            <span className="risk-prob-caption">탈락 예측 확률</span>
          </div>
        </div>
      </div>

      <div className="engagement-metrics">
        <h4>참여도 지표</h4>
        <div className="metric-item">
          <span>참여 점수</span>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{ width: `${risk.engagementScore * 100}%`, backgroundColor: 'var(--mg-primary-500)' }}
            />
          </div>
          <span>{(risk.engagementScore * 100).toFixed(0)}%</span>
        </div>

        <div className="metric-item">
          <span>출석률</span>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{ width: `${risk.attendanceRate * 100}%`, backgroundColor: 'var(--mg-success-500)' }}
            />
          </div>
          <span>{(risk.attendanceRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      {risk.warningSigns && JSON.parse(risk.warningSigns).length > 0 && (
        <div className="warning-signs">
          <h4>경고 신호</h4>
          <ul>
            {JSON.parse(risk.warningSigns).map((sign, index) => (
              <li key={index}>{sign}</li>
            ))}
          </ul>
        </div>
      )}

      {risk.earlyInterventionNeeded && risk.recommendedActions && (
        <div className="intervention-needed">
          <h4>조기 개입 필요</h4>
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
