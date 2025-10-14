import React, { useState, useEffect } from 'react';

const LoadingShowcase = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">로딩 & 스켈레톤</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {/* Spinner */}
        <div className="mg-card">
          <h4 className="mg-h4 mg-mb-md">스피너</h4>
          <div className="mg-flex-center" style={{ padding: 'var(--spacing-lg)' }}>
            <div className="mg-spinner"></div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mg-card">
          <h4 className="mg-h4 mg-mb-md">프로그레스 바</h4>
          <div className="mg-mb-md">
            <div className="mg-flex-between mg-mb-sm">
              <span className="mg-body-small">진행률</span>
              <span className="mg-body-small">{progress}%</span>
            </div>
            <div className="mg-progress-bar">
              <div className="mg-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          
          <div className="mg-mb-md">
            <p className="mg-body-small mg-mb-sm">Large</p>
            <div className="mg-progress-bar large">
              <div className="mg-progress-fill" style={{ width: '70%' }}></div>
            </div>
          </div>
          
          <div>
            <p className="mg-body-small mg-mb-sm">Small</p>
            <div className="mg-progress-bar small">
              <div className="mg-progress-fill" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>
        
        {/* Dots Animation */}
        <div className="mg-card">
          <h4 className="mg-h4 mg-mb-md">점 애니메이션</h4>
          <div className="mg-flex-center" style={{ padding: 'var(--spacing-lg)' }}>
            <div className="mg-dots-loading">
              <div className="mg-dot"></div>
              <div className="mg-dot"></div>
              <div className="mg-dot"></div>
            </div>
          </div>
        </div>
        
        {/* Skeleton Loading - Text */}
        <div className="mg-card">
          <h4 className="mg-h4 mg-mb-md">스켈레톤 - 텍스트</h4>
          <div className="mg-skeleton-box mg-skeleton-title"></div>
          <div className="mg-skeleton-box mg-skeleton-text"></div>
          <div className="mg-skeleton-box mg-skeleton-text"></div>
          <div className="mg-skeleton-box mg-skeleton-text" style={{ width: '80%' }}></div>
        </div>
        
        {/* Skeleton Loading - Avatar */}
        <div className="mg-card">
          <h4 className="mg-h4 mg-mb-md">스켈레톤 - 프로필</h4>
          <div className="mg-flex mg-gap-md">
            <div className="mg-skeleton-box mg-skeleton-avatar"></div>
            <div style={{ flex: 1 }}>
              <div className="mg-skeleton-box" style={{ height: '1.25rem', width: '60%', marginBottom: '0.5rem' }}></div>
              <div className="mg-skeleton-box" style={{ height: '1rem', width: '80%' }}></div>
            </div>
          </div>
        </div>
        
        {/* Skeleton Loading - Card */}
        <div className="mg-skeleton-card">
          <div className="mg-skeleton-box" style={{ height: '150px', marginBottom: 'var(--spacing-md)' }}></div>
          <div className="mg-skeleton-box mg-skeleton-title"></div>
          <div className="mg-skeleton-box mg-skeleton-text"></div>
          <div className="mg-skeleton-box mg-skeleton-text"></div>
        </div>
      </div>
    </section>
  );
};

export default LoadingShowcase;

