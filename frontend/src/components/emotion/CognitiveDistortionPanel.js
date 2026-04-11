import React, { useState, useEffect } from 'react';
import { EMOTION_CSS } from '../../constants/emotionCss';
import './CognitiveDistortionPanel.css';

/**
 * 인지 왜곡 패널 컴포넌트
 *
 * 텍스트에서 감지된 인지 왜곡 패턴을 표시
 *
 * @param {Object} props
 * @param {number} props.emotionId - 텍스트 감정 분석 ID
 */
const CognitiveDistortionPanel = ({ emotionId }) => {
    const [emotionData, setEmotionData] = useState(null);

    // TODO: 실제 API 호출로 데이터 로드
    useEffect(() => {
        // 모의 데이터
        setEmotionData({
            sentimentScore: -0.35,
            sentimentMagnitude: 1.8,
            sentimentClassification: 'negative',
            distortionCount: 4,
            distortionRiskLevel: 'MEDIUM',
            cognitiveDistortions: [
                {
                    type: '전부-아무것도 사고',
                    keyword: '전부',
                    context: '전부 다 망했어요',
                    severity: 'HIGH'
                },
                {
                    type: '파국화',
                    keyword: '최악',
                    context: '최악의 상황이에요',
                    severity: 'HIGH'
                },
                {
                    type: '과잉 일반화',
                    keyword: '항상',
                    context: '항상 이렇게 돼요',
                    severity: 'MEDIUM'
                }
            ]
        });
    }, [emotionId]);

    if (!emotionData) return <div>로딩 중...</div>;

    const getSentimentColor = (score) => {
        if (score > 0.5) return 'var(--mg-success-500)';
        if (score > 0.2) return '#84cc16';
        if (score > -0.2) return 'var(--mg-warning-500)';
        if (score > -0.5) return '#f97316';
        return '#dc2626';
    };

    const getSeverityColor = (severity) => {
        const colors = {
            'HIGH': '#dc2626',
            'MEDIUM': 'var(--mg-warning-500)',
            'LOW': 'var(--mg-success-500)'
        };
        return colors[severity] || '#6b7280';
    };

    return (
        <div className={EMOTION_CSS.COGNITIVE_DISTORTION_PANEL}>
            {/* 전체 감정 */}
            <div className="sentiment-overview">
                <div className="sentiment-score">
                    <span>감정 점수:</span>
                    <div
                        className="score-badge"
                        style={{ backgroundColor: getSentimentColor(emotionData.sentimentScore) }}
                    >
                        {emotionData.sentimentScore > 0 ? '+' : ''}{emotionData.sentimentScore.toFixed(2)}
                    </div>
                    <span className="classification">({emotionData.sentimentClassification})</span>
                </div>

                <div className="sentiment-magnitude">
                    <span>감정 강도:</span>
                    <strong>{emotionData.sentimentMagnitude.toFixed(1)}</strong>
                </div>
            </div>

            {/* 인지 왜곡 목록 */}
            <div className="distortions-section">
                <h4>
                    🧠 인지 왜곡 패턴
                    <span className={`count-badge ${EMOTION_CSS.RISK_LEVEL[emotionData.distortionRiskLevel]}`}>
                        {emotionData.distortionCount}개 발견
                    </span>
                </h4>

                {emotionData.cognitiveDistortions && emotionData.cognitiveDistortions.length > 0 ? (
                    <div className="distortions-list">
                        {emotionData.cognitiveDistortions.map((distortion, index) => (
                            <div
                                key={index}
                                className={EMOTION_CSS.DISTORTION_ITEM}
                                style={{ borderLeftColor: getSeverityColor(distortion.severity) }}
                            >
                                <div className={EMOTION_CSS.DISTORTION_TYPE}>
                                    <span className="type-label">{distortion.type}</span>
                                    <span
                                        className="severity-badge"
                                        style={{ backgroundColor: getSeverityColor(distortion.severity) }}
                                    >
                                        {distortion.severity}
                                    </span>
                                </div>

                                <div className={EMOTION_CSS.DISTORTION_TEXT}>
                                    <strong>감지된 키워드:</strong> "{distortion.keyword}"
                                </div>

                                {distortion.context && (
                                    <div className="distortion-context">
                                        <strong>문맥:</strong> "{distortion.context}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-distortions">
                        ✅ 인지 왜곡 패턴이 발견되지 않았습니다.
                    </div>
                )}
            </div>

            {/* 위험도 경고 */}
            {emotionData.distortionRiskLevel === 'HIGH' && (
                <div className="risk-warning high">
                    ⚠️ 높은 수준의 인지 왜곡이 감지되었습니다. 인지 행동 치료를 고려하세요.
                </div>
            )}
        </div>
    );
};

export default CognitiveDistortionPanel;
