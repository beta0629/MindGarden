import React from 'react';
import { EMOTION_CSS } from '../../constants/emotionCss';
import './EmotionTrendChart.css';

/**
 * 감정 변화 추이 차트 컴포넌트
 *
 * 회기별 감정 점수 변화를 표로 표시
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

  const getTrendLabel = (trendType) => {
    const labels = {
      IMPROVING: '호전',
      STABLE: '안정',
      WORSENING: '악화'
    };
    return labels[trendType] || trendType;
  };

  const getTrendColor = (trendType) => {
    const colors = {
      IMPROVING: 'var(--mg-success-500)',
      STABLE: 'var(--mg-warning-500)',
      WORSENING: 'var(--mg-error-500)'
    };
    return colors[trendType] || 'var(--mg-gray-500)';
  };

  return (
    <div className={EMOTION_CSS.EMOTION_TREND_CHART}>
      <div className="trend-summary">
        <div className="latest-trend">
          <span>최근 추세:</span>
          <span
            className={`trend-badge ${EMOTION_CSS.TREND[trend[trend.length - 1].trend]}`}
            style={{ color: getTrendColor(trend[trend.length - 1].trend) }}
          >
            {getTrendLabel(trend[trend.length - 1].trend)}
          </span>
        </div>
      </div>

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
                <td
                  style={{
                    color: point.scoreChangeFromPrevious > 0
                      ? 'var(--mg-success-500)'
                      : 'var(--mg-error-500)'
                  }}
                >
                  {point.scoreChangeFromPrevious > 0 ? '+' : ''}
                  {(point.scoreChangeFromPrevious * 100).toFixed(1)}%
                </td>
                <td style={{ color: getTrendColor(point.trend) }}>
                  {getTrendLabel(point.trend)}
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
