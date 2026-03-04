import React from 'react';
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

// 공통 차트 옵션
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: 'var(--mg-color-text-main)',
        font: {
          family: 'Pretendard, sans-serif',
          size: 12
        },
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'var(--mg-color-surface-main)',
      titleColor: 'var(--mg-color-text-main)',
      bodyColor: 'var(--mg-color-text-secondary)',
      borderColor: 'var(--mg-color-border-main)',
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
};

/**
 * 응답 시간 트렌드 라인 차트
 */
export const ResponseTimeLineChart = ({ data }) => {
  const options = {
    ...commonOptions,
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: 'var(--mg-color-text-secondary)'
        }
      },
      y: {
        grid: {
          color: 'var(--mg-color-border-main)',
          drawBorder: false,
          borderDash: [5, 5]
        },
        ticks: {
          color: 'var(--mg-color-text-secondary)',
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
        borderColor: 'var(--mg-color-primary-main, #3b82f6)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
          'var(--mg-success-500, #22c55e)',
          'var(--mg-warning-500, #eab308)',
          'var(--mg-error-500, #ef4444)'
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
    labels: ['Cache'],
    datasets: [
      {
        label: 'Cache Hit',
        data: [hitRate],
        backgroundColor: 'var(--mg-success-500, #22c55e)',
        barThickness: 24,
        borderRadius: { topLeft: 12, bottomLeft: 12, topRight: missRate === 0 ? 12 : 0, bottomRight: missRate === 0 ? 12 : 0 }
      },
      {
        label: 'Cache Miss',
        data: [missRate],
        backgroundColor: 'var(--mg-gray-200, #e5e7eb)',
        barThickness: 24,
        borderRadius: { topRight: 12, bottomRight: 12, topLeft: hitRate === 0 ? 12 : 0, bottomLeft: hitRate === 0 ? 12 : 0 }
      }
    ]
  };

  return (
    <div className="mg-v2-ad-b0kla__flex-col" style={{ width: '100%', height: '100%', justifyContent: 'center' }}>
      <div className="mg-v2-ad-b0kla__flex-between" style={{ marginBottom: '8px' }}>
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__text--bold" style={{ color: 'var(--mg-success-500, #22c55e)' }}>
          Hit: {hitRate}%
        </span>
        <span className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-color-text-secondary)' }}>
          Miss: {missRate}%
        </span>
      </div>
      <div style={{ height: '24px', width: '100%' }}>
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
};
