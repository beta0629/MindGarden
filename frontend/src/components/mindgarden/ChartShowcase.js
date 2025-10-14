import React from 'react';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

const ChartShowcase = () => {
  const barData = [
    { label: '월', value: 45, height: '45%' },
    { label: '화', value: 68, height: '68%' },
    { label: '수', value: 82, height: '82%' },
    { label: '목', value: 55, height: '55%' },
    { label: '금', value: 95, height: '95%' },
    { label: '토', value: 72, height: '72%' },
    { label: '일', value: 60, height: '60%' }
  ];

  const progressCircles = [
    { label: '완료율', value: 75, deg: 270 },
    { label: '만족도', value: 88, deg: 317 },
    { label: '참여율', value: 62, deg: 223 }
  ];

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">차트 & 그래프</h2>
      
      <div className="mg-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--spacing-xl)' }}>
        {/* Bar Chart */}
        <div className="mg-card">
          <div className="mg-flex mg-gap-sm mg-mb-md" style={{ alignItems: 'center' }}>
            <BarChart3 size={24} style={{ color: 'var(--olive-green)' }} />
            <h4 className="mg-h4">막대 그래프</h4>
          </div>
          <div className="mg-bar-chart" style={{ marginBottom: 'var(--spacing-lg)' }}>
            {barData.map((item, index) => (
              <div 
                key={index} 
                className="mg-bar" 
                style={{ height: item.height }}
              >
                <span className="mg-bar-value">{item.value}</span>
                <span className="mg-bar-label">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mg-text-sm" style={{ color: 'var(--medium-gray)', textAlign: 'center' }}>
            주간 상담 건수 통계
          </p>
        </div>

        {/* Progress Circles */}
        <div className="mg-card">
          <div className="mg-flex mg-gap-sm mg-mb-md" style={{ alignItems: 'center' }}>
            <PieChart size={24} style={{ color: 'var(--olive-green)' }} />
            <h4 className="mg-h4">진행률 서클</h4>
          </div>
          <div className="mg-flex mg-gap-lg" style={{ justifyContent: 'space-around', padding: 'var(--spacing-lg) 0' }}>
            {progressCircles.map((item, index) => (
              <div key={index} className="mg-flex-col mg-gap-sm" style={{ alignItems: 'center' }}>
                <div 
                  className="mg-progress-circle" 
                  style={{ '--progress-deg': `${item.deg}deg` }}
                >
                  <span className="mg-progress-circle-value">{item.value}%</span>
                </div>
                <span className="mg-text-sm" style={{ fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mg-text-sm" style={{ color: 'var(--medium-gray)', textAlign: 'center' }}>
            전체 프로세스 진행 현황
          </p>
        </div>

        {/* Line Chart (Simple CSS) */}
        <div className="mg-card">
          <div className="mg-flex mg-gap-sm mg-mb-md" style={{ alignItems: 'center' }}>
            <TrendingUp size={24} style={{ color: 'var(--olive-green)' }} />
            <h4 className="mg-h4">트렌드 그래프</h4>
          </div>
          <div style={{ 
            height: '200px', 
            background: `
              linear-gradient(to right, transparent 0%, transparent 12.5%, var(--light-beige) 12.5%, var(--light-beige) 13%, transparent 13%),
              linear-gradient(to right, transparent 0%, transparent 25%, var(--light-beige) 25%, var(--light-beige) 25.5%, transparent 25.5%),
              linear-gradient(to right, transparent 0%, transparent 37.5%, var(--light-beige) 37.5%, var(--light-beige) 38%, transparent 38%),
              linear-gradient(to right, transparent 0%, transparent 50%, var(--light-beige) 50%, var(--light-beige) 50.5%, transparent 50.5%),
              linear-gradient(to right, transparent 0%, transparent 62.5%, var(--light-beige) 62.5%, var(--light-beige) 63%, transparent 63%),
              linear-gradient(to right, transparent 0%, transparent 75%, var(--light-beige) 75%, var(--light-beige) 75.5%, transparent 75.5%),
              linear-gradient(to right, transparent 0%, transparent 87.5%, var(--light-beige) 87.5%, var(--light-beige) 88%, transparent 88%)
            `,
            borderBottom: '2px solid var(--medium-gray)',
            position: 'relative',
            padding: 'var(--spacing-md)'
          }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              <polyline
                points="5,150 60,120 115,80 170,95 225,50 280,65 335,40"
                fill="none"
                stroke="var(--mint-green)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="5" cy="150" r="5" fill="var(--mint-green)" />
              <circle cx="60" cy="120" r="5" fill="var(--mint-green)" />
              <circle cx="115" cy="80" r="5" fill="var(--mint-green)" />
              <circle cx="170" cy="95" r="5" fill="var(--mint-green)" />
              <circle cx="225" cy="50" r="5" fill="var(--mint-green)" />
              <circle cx="280" cy="65" r="5" fill="var(--mint-green)" />
              <circle cx="335" cy="40" r="5" fill="var(--mint-green)" />
            </svg>
          </div>
          <div className="mg-flex" style={{ justifyContent: 'space-around', marginTop: 'var(--spacing-md)', fontSize: '0.75rem', color: 'var(--medium-gray)' }}>
            <span>1월</span>
            <span>2월</span>
            <span>3월</span>
            <span>4월</span>
            <span>5월</span>
            <span>6월</span>
            <span>7월</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChartShowcase;

