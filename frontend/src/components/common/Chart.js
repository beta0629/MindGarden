/**
 * 차트 컴포넌트
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
  // 고유한 chartRef 생성 (타임스탬프 + 랜덤)
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const chartId = useRef(`chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // 컴포넌트 언마운트 시 차트 인스턴스 정리
  useEffect(() => {
    return () => {
      if (chartInstance) {
        console.log('🧹 Chart 인스턴스 정리:', chartId.current);
        chartInstance.destroy();
        setChartInstance(null);
      }
    };
  }, [chartInstance]);

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
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
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
    console.log('🔍 Chart 컴포넌트 - 원본 데이터:', data);
    if (!data) {
      console.log('❌ Chart 컴포넌트 - 데이터가 없음');
      return null;
    }

    // 기본 색상 적용
    const colors = data.colors || CHART_DEFAULTS.COLORS;
    
    const processed = {
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
    
    console.log('🔍 Chart 컴포넌트 - 처리된 데이터:', processed);
    return processed;
  }, [data]);

  // 차트 컴포넌트 렌더링
  const renderChart = () => {
    console.log('🔍 Chart renderChart 호출됨:', { type, processedData, mergedOptions });
    
    if (!processedData) {
      console.log('❌ Chart renderChart - processedData가 null');
      return null;
    }

    const commonProps = {
      ref: chartRef,
      data: processedData,
      options: mergedOptions,
      className: `chart-component ${className}`
    };

    console.log('🔍 Chart commonProps:', commonProps);

    switch (type) {
      case CHART_TYPES.BAR:
        console.log('📊 Bar 차트 렌더링');
        return <Bar {...commonProps} />;
      case CHART_TYPES.LINE:
        console.log('📊 Line 차트 렌더링');
        return <Line {...commonProps} />;
      case CHART_TYPES.PIE:
        console.log('📊 Pie 차트 렌더링');
        return <Pie {...commonProps} />;
      case CHART_TYPES.DOUGHNUT:
        console.log('📊 Doughnut 차트 렌더링');
        return <Doughnut {...commonProps} />;
      default:
        console.log('📊 기본 Bar 차트 렌더링');
        return <Bar {...commonProps} />;
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="chart-container chart-loading" data-height={height}>
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
      <div className="chart-container chart-error" data-height={height}>
        <div className="chart-error-content">
          <i className="bi bi-exclamation-triangle chart-error-icon"></i>
          <p className="chart-error-text">차트를 불러올 수 없습니다</p>
          <small className="chart-error-detail">
            {typeof error === 'string' ? error : (error?.message ?? JSON.stringify(error))}
          </small>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!processedData || !processedData.datasets || processedData.datasets.length === 0) {
    console.log('❌ Chart 컴포넌트 - 데이터 없음 상태:', {
      processedData,
      hasDatasets: !!processedData?.datasets,
      datasetsLength: processedData?.datasets?.length
    });
    return (
      <div className="chart-container chart-empty" data-height={height}>
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

  console.log('🔍 Chart 최종 렌더링:', { 
    containerClass: getChartContainerClass(), 
    height, 
    chartComponent: renderChart() 
  });

  return (
    <div 
      id={chartId.current}
      className={getChartContainerClass()} 
      data-height={height}
    >
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
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  className: PropTypes.string,
  onDataPointClick: PropTypes.func,
  onLegendClick: PropTypes.func
};

export default Chart;
