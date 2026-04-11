import React, { useState, useEffect } from 'react';
import { EMOTION_CSS } from '../../constants/emotionCss';
import './VoiceBiomarkerChart.css';

/**
 * 음성 바이오마커 차트 컴포넌트
 *
 * 피치, 말속도, 볼륨, 떨림 등을 시각화
 *
 * @param {Object} props
 * @param {number} props.biomarkerId - 바이오마커 ID
 */
const VoiceBiomarkerChart = ({ biomarkerId }) => {
    const [biomarker, setBiomarker] = useState(null);

    // TODO: 실제 API 호출로 데이터 로드
    useEffect(() => {
        // 모의 데이터
        setBiomarker({
            pitchMean: 180.5,
            pitchStd: 25.3,
            speechRateWpm: 145,
            pauseCount: 23,
            volumeMean: 65,
            tremorDetected: false,
            anxietyScore: 0.42,
            depressionScore: 0.28,
            stressScore: 0.35
        });
    }, [biomarkerId]);

    if (!biomarker) return <div>로딩 중...</div>;

    /**
     * 정상 범위 체크
     */
    const isNormalRange = (value, min, max) => {
        return value >= min && value <= max;
    };

    return (
        <div className={EMOTION_CSS.VOICE_BIOMARKER_CHART}>
            {/* 음성 특징 */}
            <div className="biomarker-metrics">
                <div className={EMOTION_CSS.BIOMARKER_METRIC}>
                    <div className={EMOTION_CSS.METRIC_LABEL}>평균 피치</div>
                    <div className={`${EMOTION_CSS.METRIC_VALUE} ${isNormalRange(biomarker.pitchMean, 150, 250) ? EMOTION_CSS.NORMAL_RANGE : EMOTION_CSS.OUT_OF_RANGE}`}>
                        {biomarker.pitchMean.toFixed(1)} Hz
                    </div>
                    <small>정상 범위: 150-250 Hz</small>
                </div>

                <div className={EMOTION_CSS.BIOMARKER_METRIC}>
                    <div className={EMOTION_CSS.METRIC_LABEL}>말 속도</div>
                    <div className={`${EMOTION_CSS.METRIC_VALUE} ${isNormalRange(biomarker.speechRateWpm, 120, 180) ? EMOTION_CSS.NORMAL_RANGE : EMOTION_CSS.OUT_OF_RANGE}`}>
                        {biomarker.speechRateWpm} wpm
                    </div>
                    <small>정상 범위: 120-180 wpm</small>
                </div>

                <div className={EMOTION_CSS.BIOMARKER_METRIC}>
                    <div className={EMOTION_CSS.METRIC_LABEL}>평균 볼륨</div>
                    <div className={`${EMOTION_CSS.METRIC_VALUE} ${EMOTION_CSS.NORMAL_RANGE}`}>
                        {biomarker.volumeMean.toFixed(1)} dB
                    </div>
                </div>

                <div className={EMOTION_CSS.BIOMARKER_METRIC}>
                    <div className={EMOTION_CSS.METRIC_LABEL}>휴지기 횟수</div>
                    <div className={EMOTION_CSS.METRIC_VALUE}>
                        {biomarker.pauseCount}회
                    </div>
                </div>
            </div>

            {/* 감정 지표 */}
            <div className="emotion-indicators">
                <h4>감정 지표</h4>

                <div className="indicator-item">
                    <span>불안</span>
                    <div className="indicator-bar">
                        <div
                            className="indicator-fill anxiety"
                            style={{ width: `${biomarker.anxietyScore * 100}%` }}
                         />
                    </div>
                    <span>{(biomarker.anxietyScore * 100).toFixed(0)}%</span>
                </div>

                <div className="indicator-item">
                    <span>우울</span>
                    <div className="indicator-bar">
                        <div
                            className="indicator-fill depression"
                            style={{ width: `${biomarker.depressionScore * 100}%` }}
                         />
                    </div>
                    <span>{(biomarker.depressionScore * 100).toFixed(0)}%</span>
                </div>

                <div className="indicator-item">
                    <span>스트레스</span>
                    <div className="indicator-bar">
                        <div
                            className="indicator-fill stress"
                            style={{ width: `${biomarker.stressScore * 100}%` }}
                         />
                    </div>
                    <span>{(biomarker.stressScore * 100).toFixed(0)}%</span>
                </div>
            </div>

            {/* 음성 떨림 */}
            {biomarker.tremorDetected && (
                <div className="tremor-alert">
                    ⚠️ 음성 떨림이 감지되었습니다 (긴장 또는 불안 징후)
                </div>
            )}
        </div>
    );
};

export default VoiceBiomarkerChart;
