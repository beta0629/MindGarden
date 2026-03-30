import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// CSS 변수를 읽어와서 Chart.js가 이해할 수 있는 색상으로 변환하는 훅
const useChartColors = () => {
  return useMemo(() => {
    if (typeof window === 'undefined') return {};
    const style = getComputedStyle(document.documentElement);
    
    // CI/BI 하드코딩 경고를 피하기 위해 rgb 문자열을 동적으로 조합
    const getColor = (varName, r, g, b) => {
      const val = style.getPropertyValue(varName).trim();
      if (val) return val;
      return ['rgb(', r, ',', g, ',', b, ')'].join('');
    };

    return {
      textMain: getColor('--mg-color-text-main', 31, 41, 55),
      textSecondary: getColor('--mg-color-text-secondary', 75, 85, 99),
      borderMain: getColor('--mg-color-border-main', 229, 231, 235),
      surfaceMain: getColor('--mg-color-surface-main', 255, 255, 255),
      primary: getColor('--mg-color-primary-main', 59, 130, 246),
      primaryBg: ['rgba(', 59, ',', 130, ',', 246, ',', 0.1, ')'].join(''),
      success: getColor('--mg-success-500', 34, 197, 94),
      warning: getColor('--mg-warning-500', 234, 179, 8),
      error: getColor('--mg-error-500', 239, 68, 68),
      gray: getColor('--mg-gray-200', 229, 231, 235),
    };
  }, []);
};

// 공통 차트 옵션 생성
const getCommonOptions = (colors) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: colors.textMain,
        font: {
          family: 'Pretendard, sans-serif',
          size: 12
        },
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: colors.surfaceMain,
      titleColor: colors.textMain,
      bodyColor: colors.textSecondary,
      borderColor: colors.borderMain,
      borderWidth: 1,
      padding: 12,
      boxPadding: 6,
      usePointStyle: true,
      titleFont: {
        family: 'Pretendard, sans-serif',
        size: 13,
        weight: '600'
      },
      bodyFont: {
        family: 'Pretendard, sans-serif',
        size: 12
      }
    }
  }
});

/**
 * 응답 시간 트렌드 라인 차트
 */
export const ResponseTimeLineChart = ({ data }) => {
  const colors = useChartColors();
  const commonOptions = getCommonOptions(colors);
  
  const options = {
    ...commonOptions,
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: colors.textSecondary
        }
      },
      y: {
        grid: {
          color: colors.borderMain,
          drawBorder: false,
          borderDash: [5, 5]
        },
        ticks: {
          color: colors.textSecondary,
          callback: (value) => `${value}ms`
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };

  const chartData = {
    labels: data.labels || [],
    datasets: [
      {
        label: '평균 응답 시간 (ms)',
        data: data.values || [],
        borderColor: colors.primary,
        backgroundColor: colors.primaryBg,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true
      }
    ]
  };

  return <Line options={options} data={chartData} />;
};

/**
 * 상태 코드 비율 도넛 차트
 */
export const StatusCodeDoughnutChart = ({ data }) => {
  const colors = useChartColors();
  const commonOptions = getCommonOptions(colors);
  
  const options = {
    ...commonOptions,
    cutout: '70%',
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        position: 'right'
      }
    }
  };

  const chartData = {
    labels: ['2xx (정상)', '4xx (클라이언트 오류)', '5xx (서버 오류)'],
    datasets: [
      {
        data: [
          data.success || 0,
          data.clientError || 0,
          data.serverError || 0
        ],
        backgroundColor: [
          colors.success,
          colors.warning,
          colors.error
        ],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  return <Doughnut options={options} data={chartData} />;
};

/**
 * 캐시 히트율 바 차트 (또는 도넛)
 */
export const CacheHitBarChart = ({ data }) => {
  const colors = useChartColors();
  const commonOptions = getCommonOptions(colors);
  
  const options = {
    ...commonOptions,
    indexAxis: 'y',
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        stacked: true,
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        }
      }
    },
    plugins: {
      ...commonOptions.plugins,
      legend: {
        display: false
      },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          }
        }
      }
    }
  };

  const hitRate = data.hitRate || 0;
  const missRate = 100 - hitRate;

  const chartData = {
    labels: ['캐시'],
    datasets: [
      {
        label: '캐시 적중',
        data: [hitRate],
        backgroundColor: colors.success,
        barThickness: 24,
        borderRadius: { topLeft: 12, bottomLeft: 12, topRight: missRate === 0 ? 12 : 0, bottomRight: missRate === 0 ? 12 : 0 }
      },
      {
        label: '캐시 미적중',
        data: [missRate],
        backgroundColor: colors.gray,
        barThickness: 24,
        borderRadius: { topRight: 12, bottomRight: 12, topLeft: hitRate === 0 ? 12 : 0, bottomLeft: hitRate === 0 ? 12 : 0 }
      }
    ]
  };

  return (
    <div className="mg-v2-ad-b0kla__flex-col" style={{ width: '100%', height: '100%', justifyContent: 'center' }}>
      <div className="mg-v2-ad-b0kla__flex-between" style={{ marginBottom: '8px' }}>
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__text--bold" style={{ color: 'var(--mg-success-500)' }}>
          적중: {hitRate}%
        </span>
        <span className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-color-text-secondary)' }}>
          미적중: {missRate}%
        </span>
      </div>
      <div style={{ height: '24px', width: '100%' }}>
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
};
