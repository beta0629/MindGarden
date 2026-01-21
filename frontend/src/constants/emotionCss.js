/**
 * 감정 분석 CSS 클래스명 상수
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */

export const EMOTION_CSS = {
    // EmotionDashboard
    EMOTION_DASHBOARD: 'emotion-dashboard',
    DASHBOARD_HEADER: 'emotion-dashboard-header',
    DASHBOARD_GRID: 'emotion-dashboard-grid',
    EMOTION_CARD: 'emotion-card',

    // VoiceBiomarkerChart
    VOICE_BIOMARKER_CHART: 'voice-biomarker-chart',
    BIOMARKER_METRIC: 'biomarker-metric',
    METRIC_VALUE: 'metric-value',
    METRIC_LABEL: 'metric-label',
    NORMAL_RANGE: 'normal-range',
    OUT_OF_RANGE: 'out-of-range',

    // FacialEmotionTimeline
    FACIAL_EMOTION_TIMELINE: 'facial-emotion-timeline',
    TIMELINE_CONTAINER: 'timeline-container',
    EMOTION_BAR: 'emotion-bar',
    EMOTION_LABEL: 'emotion-label',

    // EmotionTrendChart
    EMOTION_TREND_CHART: 'emotion-trend-chart',
    TREND_LINE: 'trend-line',
    TREND_POINT: 'trend-point',

    // CognitiveDistortionHighlight
    COGNITIVE_DISTORTION_PANEL: 'cognitive-distortion-panel',
    DISTORTION_ITEM: 'distortion-item',
    DISTORTION_TYPE: 'distortion-type',
    DISTORTION_TEXT: 'distortion-text',

    // 감정 타입
    EMOTION_TYPE: {
        JOY: 'emotion-joy',
        SORROW: 'emotion-sorrow',
        ANGER: 'emotion-anger',
        FEAR: 'emotion-fear',
        SURPRISE: 'emotion-surprise',
        NEUTRAL: 'emotion-neutral',
    },

    // 위험도
    RISK_LEVEL: {
        CRITICAL: 'risk-critical',
        HIGH: 'risk-high',
        MEDIUM: 'risk-medium',
        LOW: 'risk-low',
    },

    // 추세
    TREND: {
        IMPROVING: 'trend-improving',
        STABLE: 'trend-stable',
        WORSENING: 'trend-worsening',
    },
};

export default EMOTION_CSS;
