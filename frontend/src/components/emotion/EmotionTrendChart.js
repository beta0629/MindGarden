import React from 'react';
import { EMOTION_CSS } from '../../constants/emotionCss';
import './EmotionTrendChart.css';

/**
 * 감정 변화 추이 차트 컴포넌트
 *
 * 회기별 감정 점수 변화를 선 그래프로 표시
 *
 * @param {Object} props
 * @param {Array} props.trend - 감정 추적 이력
 */
const EmotionTrendChart = ({ trend }) => {
    if (!trend || trend.length === 0) {
        return (
            <div className={EMOTION_CSS.EMOTION_TREND_CHART}>
                <p>추적 데이터가 없습니다.</p>
            </div>
        );
    }

    /**
     * 추세 아이콘
     */
    const getTrendIcon = (trendType) => {
        const icons = {
            'IMPROVING': '📈 호전',
            'STABLE': '➡️ 안정',
            'WORSENING': '📉 악화',
        };
        return icons[trendType] || trendType;
    };

    /**
     * 추세 색상
     */
    const getTrendColor = (trendType) => {
        const colors = {
            'IMPROVING': 'var(--mg-success-500)',
            'STABLE': 'var(--mg-warning-500)',
            'WORSENING': '#dc2626',
        };
        return colors[trendType] || '#6b7280';
    };

    // 차트 그리기 (간단한 SVG)
    const maxScore = 1.0;
    const chartHeight = 200;
    const chartWidth = 600;
    const pointSpacing = chartWidth / (trend.length - 1 || 1);

    return (
        <div className={EMOTION_CSS.EMOTION_TREND_CHART}>
            <div className="trend-summary">
                <div className="latest-trend">
                    <span>최근 추세:</span>
                    <span
                        className={`trend-badge ${EMOTION_CSS.TREND[trend[trend.length - 1].trend]}`}
                        style={{ color: getTrendColor(trend[trend.length - 1].trend) }}
                    >
                        {getTrendIcon(trend[trend.length - 1].trend)}
                    </span>
                </div>
            </div>

            <svg width={chartWidth} height={chartHeight} className="trend-chart-svg">
                {/* 격자선 */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((value, i) => (
                    <g key={i}>
                        <line
                            x1="0"
                            y1={chartHeight - (value * chartHeight)}
                            x2={chartWidth}
                            y2={chartHeight - (value * chartHeight)}
                            stroke="#e5e7eb"
                            strokeDasharray="5,5"
                        />
                        <text
                            x="-5"
                            y={chartHeight - (value * chartHeight) + 5}
                            fill="#6b7280"
                            fontSize="12"
                            textAnchor="end"
                        >
                            {(value * 100).toFixed(0)}
                        </text>
                    </g>
                ))}

                {/* 선 그래프 */}
                <polyline
                    points={trend.map((point, i) =>
                        `${i * pointSpacing},${chartHeight - (point.emotionScore * chartHeight)}`
                    ).join(' ')}
                    fill="none"
                    stroke="var(--mg-primary-500)"
                    strokeWidth="3"
                />

                {/* 데이터 포인트 */}
                {trend.map((point, i) => (
                    <g key={i}>
                        <circle
                            cx={i * pointSpacing}
                            cy={chartHeight - (point.emotionScore * chartHeight)}
                            r="5"
                            fill={getTrendColor(point.trend)}
                            stroke="#fff"
                            strokeWidth="2"
                        />
                        <text
                            x={i * pointSpacing}
                            y={chartHeight + 20}
                            fill="#6b7280"
                            fontSize="11"
                            textAnchor="middle"
                        >
                            {point.sessionNumber}회기
                        </text>
                    </g>
                ))}
            </svg>

            {/* 데이터 테이블 */}
            <div className="trend-table">
                <table>
                    <thead>
                        <tr>
                            <th>회기</th>
                            <th>점수</th>
                            <th>변화</th>
                            <th>추세</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trend.map((point, index) => (
                            <tr key={index}>
                                <td>{point.sessionNumber}회기</td>
                                <td>{(point.emotionScore * 100).toFixed(0)}%</td>
                                <td style={{
                                    color: point.scoreChangeFromPrevious > 0 ? 'var(--mg-success-500)' : '#dc2626'
                                }}>
                                    {point.scoreChangeFromPrevious > 0 ? '+' : ''}
                                    {(point.scoreChangeFromPrevious * 100).toFixed(1)}%
                                </td>
                                <td style={{ color: getTrendColor(point.trend) }}>
                                    {getTrendIcon(point.trend)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmotionTrendChart;
