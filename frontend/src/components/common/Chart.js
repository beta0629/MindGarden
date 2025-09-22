/**
 * 차트 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  Bar, 
  Line, 
  Pie, 
  Doughnut 
} from 'react-chartjs-2';
import { 
  CHART_TYPES, 
  CHART_COLORS, 
  CHART_OPTIONS, 
  PIE_CHART_OPTIONS,
  CHART_HEIGHTS,
  CHART_DEFAULTS 
} from '../../constants/charts';
import './Chart.css';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Chart = ({ 
  type = CHART_DEFAULTS.TYPE,
  data,
  title,
  height = CHART_DEFAULTS.HEIGHT,
  options = {},
  loading = false,
  error = null,
  className = '',
  onDataPointClick = null,
  onLegendClick = null
}) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

  // 차트 옵션 병합
  const getChartOptions = () => {
    const baseOptions = (type === CHART_TYPES.PIE || type === CHART_TYPES.DOUGHNUT) 
      ? PIE_CHART_OPTIONS 
      : CHART_OPTIONS;
    
    return {
      ...baseOptions,
      ...options,
      plugins: {
        ...baseOptions.plugins,
        ...options.plugins,
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold'
          },
          color: '#2c3e50'
        }
      },
      onClick: onDataPointClick,
      onHover: (event, elements) => {
        if (chartRef.current && chartRef.current.style) {
          chartRef.current.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      }
    };
  };

  const mergedOptions = getChartOptions();

  // 차트 데이터 처리
  const processedData = React.useMemo(() => {
    if (!data) return null;

    // 기본 색상 적용
    const colors = data.colors || CHART_DEFAULTS.COLORS;
    
    return {
      ...data,
      datasets: data.datasets?.map((dataset, index) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || colors[index % colors.length],
        borderColor: dataset.borderColor || colors[index % colors.length],
        borderWidth: dataset.borderWidth || CHART_DEFAULTS.BORDER_WIDTH,
        borderRadius: dataset.borderRadius || CHART_DEFAULTS.BORDER_RADIUS,
        pointRadius: dataset.pointRadius || CHART_DEFAULTS.POINT_RADIUS,
        pointHoverRadius: dataset.pointHoverRadius || CHART_DEFAULTS.POINT_HOVER_RADIUS
      }))
    };
  }, [data]);

  // 차트 컴포넌트 렌더링
  const renderChart = () => {
    if (!processedData) return null;

    const commonProps = {
      ref: chartRef,
      data: processedData,
      options: mergedOptions,
      className: `chart-component ${className}`
    };

    switch (type) {
      case CHART_TYPES.BAR:
        return <Bar {...commonProps} />;
      case CHART_TYPES.LINE:
        return <Line {...commonProps} />;
      case CHART_TYPES.PIE:
        return <Pie {...commonProps} />;
      case CHART_TYPES.DOUGHNUT:
        return <Doughnut {...commonProps} />;
      default:
        return <Bar {...commonProps} />;
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="chart-container chart-loading" style={{ height }}>
        <div className="chart-loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p className="chart-loading-text">차트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="chart-container chart-error" style={{ height }}>
        <div className="chart-error-content">
          <i className="bi bi-exclamation-triangle chart-error-icon"></i>
          <p className="chart-error-text">차트를 불러올 수 없습니다</p>
          <small className="chart-error-detail">{error}</small>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!processedData || !processedData.datasets || processedData.datasets.length === 0) {
    return (
      <div className="chart-container chart-empty" style={{ height }}>
        <div className="chart-empty-content">
          <i className="bi bi-graph-up chart-empty-icon"></i>
          <p className="chart-empty-text">표시할 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  // 차트 타입에 따른 CSS 클래스 결정
  const getChartContainerClass = () => {
    const baseClass = "chart-container";
    if (type === CHART_TYPES.PIE) {
      return `${baseClass} pie-chart`;
    } else if (type === CHART_TYPES.DOUGHNUT) {
      return `${baseClass} doughnut-chart`;
    }
    return baseClass;
  };

  return (
    <div className={getChartContainerClass()} style={{ height }}>
      <div className="chart-wrapper">
        {renderChart()}
      </div>
    </div>
  );
};

Chart.propTypes = {
  type: PropTypes.oneOf(Object.values(CHART_TYPES)),
  data: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string),
    datasets: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string,
      data: PropTypes.arrayOf(PropTypes.number),
      backgroundColor: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ]),
      borderColor: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ]),
      borderWidth: PropTypes.number,
      borderRadius: PropTypes.number,
      pointRadius: PropTypes.number,
      pointHoverRadius: PropTypes.number
    }))
  }),
  title: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  options: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
  onDataPointClick: PropTypes.func,
  onLegendClick: PropTypes.func
};

Chart.defaultProps = {
  type: CHART_DEFAULTS.TYPE,
  height: CHART_DEFAULTS.HEIGHT,
  loading: false,
  error: null,
  className: '',
  onDataPointClick: null,
  onLegendClick: null
};

export default Chart;
