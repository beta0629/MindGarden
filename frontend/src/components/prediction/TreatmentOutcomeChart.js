import React from 'react';
import './TreatmentOutcomeChart.css';

/**
 * 치료 결과 예측 차트 컴포넌트
 *
 * @param {Object} props
 * @param {Object} props.prediction - 치료 예측 데이터
 */
const TreatmentOutcomeChart = ({ prediction }) => {
    const getOutcomeColor = (outcome) => {
        const colors = {
            'EXCELLENT': 'var(--mg-success-500)',
            'GOOD': '#84cc16',
            'MODERATE': 'var(--mg-warning-500)',
            'POOR': '#dc2626',
        };
        return colors[outcome] || '#6b7280';
    };

    const getOutcomeLabel = (outcome) => {
        const labels = {
            'EXCELLENT': '매우 좋음',
            'GOOD': '좋음',
            'MODERATE': '보통',
            'POOR': '좋지 않음',
        };
        return labels[outcome] || outcome;
    };

    return (
        <div className="treatment-outcome-chart">
            <h3>🎯 치료 경과 예측</h3>

            <div className="outcome-display">
                <div
                    className="outcome-badge"
                    style={{ backgroundColor: getOutcomeColor(prediction.predictedOutcome) }}
                >
                    {getOutcomeLabel(prediction.predictedOutcome)}
                </div>

                <div className="success-probability">
                    <div className="probability-label">성공 확률</div>
                    <div className="probability-value">
                        {(prediction.successProbability * 100).toFixed(0)}%
                    </div>
                    <div className="probability-bar">
                        <div
                            className="probability-fill"
                            style={{
                                width: `${prediction.successProbability * 100}%`,
                                backgroundColor: getOutcomeColor(prediction.predictedOutcome)
                            }}
                        ></div>
                    </div>
                </div>

                <div className="improvement-rate">
                    <span>예상 개선률:</span>
                    <strong>{prediction.estimatedImprovementRate?.toFixed(1)}%</strong>
                </div>
            </div>

            {prediction.predictionFactors && (
                <div className="factors-section">
                    <h4>📋 예측 근거</h4>
                    <ul className="factors-list">
                        {JSON.parse(prediction.predictionFactors || '[]').map((factor, index) => (
                            <li key={index}>{factor}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="meta-info">
                <span>모델: {prediction.modelName}</span>
                <span>신뢰도: {(prediction.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
};

export default TreatmentOutcomeChart;
