import React, { useState, useEffect } from 'react';
import { EMOTION_CSS } from '../../constants/emotionCss';
import './FacialEmotionTimeline.css';

/**
 * 표정 감정 타임라인 컴포넌트
 *
 * 시간별 표정 변화를 타임라인으로 시각화
 *
 * @param {Object} props
 * @param {number} props.emotionId - 비디오 감정 분석 ID
 */
const FacialEmotionTimeline = ({ emotionId }) => {
    const [emotionData, setEmotionData] = useState(null);

    // TODO: 실제 API 호출로 데이터 로드
    useEffect(() => {
        // 모의 데이터
        setEmotionData({
            dominantEmotion: 'neutral',
            avgJoy: 0.25,
            avgSorrow: 0.35,
            avgAnger: 0.10,
            avgFear: 0.20,
            avgSurprise: 0.15,
            emotionTimeline: [
                { time: '0:00', joy: 0.3, sorrow: 0.2, anger: 0.1, fear: 0.1 },
                { time: '5:00', joy: 0.2, sorrow: 0.4, anger: 0.1, fear: 0.3 },
                { time: '10:00', joy: 0.3, sorrow: 0.3, anger: 0.1, fear: 0.2 },
                { time: '15:00', joy: 0.4, sorrow: 0.2, anger: 0.05, fear: 0.1 },
            ],
        });
    }, [emotionId]);

    if (!emotionData) return <div>로딩 중...</div>;

    return (
        <div className={EMOTION_CSS.FACIAL_EMOTION_TIMELINE}>
            {/* 전체 감정 분포 */}
            <div className="emotion-distribution">
                <h4>전체 감정 분포</h4>
                <div className="emotion-bars">
                    <div className="emotion-bar-item">
                        <span>기쁨</span>
                        <div className="bar-container">
                            <div
                                className={`bar ${EMOTION_CSS.EMOTION_TYPE.JOY}`}
                                style={{ width: `${emotionData.avgJoy * 100}%` }}
                            ></div>
                        </div>
                        <span>{(emotionData.avgJoy * 100).toFixed(0)}%</span>
                    </div>

                    <div className="emotion-bar-item">
                        <span>슬픔</span>
                        <div className="bar-container">
                            <div
                                className={`bar ${EMOTION_CSS.EMOTION_TYPE.SORROW}`}
                                style={{ width: `${emotionData.avgSorrow * 100}%` }}
                            ></div>
                        </div>
                        <span>{(emotionData.avgSorrow * 100).toFixed(0)}%</span>
                    </div>

                    <div className="emotion-bar-item">
                        <span>분노</span>
                        <div className="bar-container">
                            <div
                                className={`bar ${EMOTION_CSS.EMOTION_TYPE.ANGER}`}
                                style={{ width: `${emotionData.avgAnger * 100}%` }}
                            ></div>
                        </div>
                        <span>{(emotionData.avgAnger * 100).toFixed(0)}%</span>
                    </div>

                    <div className="emotion-bar-item">
                        <span>두려움</span>
                        <div className="bar-container">
                            <div
                                className={`bar ${EMOTION_CSS.EMOTION_TYPE.FEAR}`}
                                style={{ width: `${emotionData.avgFear * 100}%` }}
                            ></div>
                        </div>
                        <span>{(emotionData.avgFear * 100).toFixed(0)}%</span>
                    </div>

                    <div className="emotion-bar-item">
                        <span>놀람</span>
                        <div className="bar-container">
                            <div
                                className={`bar ${EMOTION_CSS.EMOTION_TYPE.SURPRISE}`}
                                style={{ width: `${emotionData.avgSurprise * 100}%` }}
                            ></div>
                        </div>
                        <span>{(emotionData.avgSurprise * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* 시간별 감정 변화 */}
            <div className="emotion-timeline">
                <h4>시간별 감정 변화</h4>
                <div className="timeline-container">
                    {emotionData.emotionTimeline.map((point, index) => (
                        <div key={index} className="timeline-point">
                            <div className="timeline-time">{point.time}</div>
                            <div className="timeline-emotions">
                                <div className="mini-bar joy" style={{ height: `${point.joy * 100}px` }} />
                                <div className="mini-bar sorrow" style={{ height: `${point.sorrow * 100}px` }} />
                                <div className="mini-bar anger" style={{ height: `${point.anger * 100}px` }} />
                                <div className="mini-bar fear" style={{ height: `${point.fear * 100}px` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 주요 감정 */}
            <div className="dominant-emotion-badge">
                <span>주요 감정: </span>
                <strong>{emotionData.dominantEmotion}</strong>
            </div>
        </div>
    );
};

export default FacialEmotionTimeline;
