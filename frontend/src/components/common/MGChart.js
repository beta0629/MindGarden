import React, { useEffect, useRef } from 'react';
import './MGChart.css';

/**
 * Core Solution 차트 컴포넌트
/**
 * Chart.js를 기반으로 한 통합 차트 컴포넌트
 */
const MGChart = ({
  type = 'line', // 'line', 'bar', 'pie', 'doughnut', 'area', 'radar'
  data = {},
  options = {},
  loading = false,
  error = null,
  height = 300,
  className = '',
  variant = 'default', // 'default', 'minimal', 'gradient'
  ...props
}) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Chart.js 동적 import
    const initChart = async () => {
      try {
        const { Chart, registerables } = await import('chart.js/auto');
        Chart.register(...registerables);

        // 기존 차트 인스턴스 제거
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        // 기본 옵션 설정
        const defaultOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  size: 12
                }
              }
            },
            tooltip: {
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.8) -> var(--mg-custom-color)
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'var(--mg-white)',
              bodyColor: 'var(--mg-white)',
              borderColor: 'var(--mg-white)',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true
            }
          },
          scales: {
            x: {
              grid: {
                color: 'var(--mg-shadow-light)',
                drawBorder: false
              },
              ticks: {
                font: {
                  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  size: 11
                }
              }
            },
            y: {
              grid: {
                color: 'var(--mg-shadow-light)',
                drawBorder: false
              },
              ticks: {
                font: {
                  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  size: 11
                }
              }
            }
          },
          ...options
        };

        // 차트 생성
        chartInstanceRef.current = new Chart(canvasRef.current, {
          type: type,
          data: data,
          options: defaultOptions
        });
      } catch (err) {
        console.error('Chart.js 로드 실패:', err);
      }
    };

    initChart();

    // 클린업
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [type, data, options]);

  const getChartClasses = () => {
    return [
      'mg-chart',
      `mg-chart--${variant}`,
      loading ? 'mg-chart--loading' : '',
      error ? 'mg-chart--error' : '',
      className
    ].filter(Boolean).join(' ');
  };

  if (error) {
    return (
      <div className={getChartClasses()}>
        <div className="mg-chart__error">
          <span className="mg-chart__error-icon">📊</span>
          <span className="mg-chart__error-message">차트를 불러올 수 없습니다</span>
          <span className="mg-chart__error-detail">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={getChartClasses()} style={{ '--chart-height': `${height}px` }}>
      {loading && (
        <div className="mg-chart__loading">
          <div className="mg-chart__spinner"></div>
          <span>차트를 불러오는 중...</span>
        </div>
      )}
      
      <div className="mg-chart__container">
        <canvas ref={canvasRef} {...props} />
      </div>
    </div>
  );
};

export default MGChart;



