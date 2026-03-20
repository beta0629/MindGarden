/**
 * Core Solution 프리미엄 디자인 시스템 샘플
/**
 * 디테일하고 세련된 UI 컴포넌트들을 보여주는 고급 샘플
 */

import React, { useState } from 'react';
// // import MGButton from '../components/common/MGButton'; // 임시 비활성화
import MGCard from '../components/common/MGCard'; // 임시 비활성화
import MGPageHeader from '../components/common/MGPageHeader';
import SafeText from '../components/common/SafeText';
import './PremiumDesignSample.css';

const PremiumDesignSample = () => {
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const handleButtonClick = (variant) => {
    console.log(`${variant} 버튼 클릭됨`);
  };

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const statsData = [
    { label: '총 사용자', value: '12,847', change: '+12%', trend: 'up', icon: '👥' },
    { label: '활성 세션', value: '3,429', change: '+8%', trend: 'up', icon: '💬' },
    { label: '완료된 상담', value: '8,923', change: '+15%', trend: 'up', icon: '✅' },
    { label: '만족도', value: '4.8/5', change: '+0.2', trend: 'up', icon: '⭐' }
  ];

  const features = [
    {
      title: '실시간 상담',
      description: '24시간 언제든지 전문 상담사와 연결되어 즉시 상담을 받을 수 있습니다.',
      icon: '💬',
      color: 'linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%)'
    },
    {
      title: 'AI 분석',
      description: '인공지능이 대화 내용을 분석하여 맞춤형 상담 방향을 제시합니다.',
      icon: '🤖',
      color: 'linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%)'
    },
    {
      title: '개인화 추천',
      description: '사용자의 패턴을 학습하여 가장 적합한 상담 프로그램을 추천합니다.',
      icon: '🎯',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #00f2fe -> var(--mg-custom-00f2fe)
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #4facfe -> var(--mg-custom-4facfe)
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: '보안 보장',
      description: '최고 수준의 암호화로 모든 대화 내용을 안전하게 보호합니다.',
      icon: '🔒',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #38f9d7 -> var(--mg-custom-38f9d7)
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #43e97b -> var(--mg-custom-43e97b)
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ];

  return (
    <div className="premium-sample">
      {/* 히어로 섹션 */}
      <div className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <div className="hero-content">
          <MGPageHeader
            title="Core Solution 프리미엄 디자인"
            subtitle="차세대 상담 플랫폼을 위한 세련된 UI/UX"
            description="디테일하고 직관적인 사용자 경험을 제공하는 디자인 시스템"
            icon="✨"
            actions={
              <div className="hero-actions">
                <button className="mg-button" variant="primary" size="large" icon="🚀">
                  시작하기
                </button>
                <button className="mg-button" variant="secondary" size="large">
                  더 알아보기
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* 통계 대시보드 */}
      <div className="stats-section">
        <div className="section-header">
          <h2>실시간 현황</h2>
          <p>플랫폼의 현재 상태를 한눈에 확인하세요</p>
        </div>
        
        <div className="stats-grid">
          {statsData.map((stat, index) => (
            <div className="mg-card" 
              key={index}
              variant="glass" 
              padding="large"
              className={`stat-card ${selectedCard === index ? 'selected' : ''}`}
              onClick={() => setSelectedCard(selectedCard === index ? null : index)}
            >
              <div className="stat-content">
                <div className="stat-icon" style={{ background: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">
                    <SafeText>{stat.label}</SafeText>
                  </div>
                  <div className={`stat-change ${stat.trend}`}>
                    {stat.change}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 기능 소개 */}
      <div className="features-section">
        <div className="section-header">
          <h2>주요 기능</h2>
          <p>Core Solution의 핵심 기능들을 만나보세요</p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="mg-card" 
              key={index}
              variant="elevated" 
              padding="large"
              className="feature-card"
            >
              <div className="feature-header">
                <div className="feature-icon" style={{ background: feature.color }}>
                  {feature.icon}
                </div>
                <h3>
                  <SafeText tag="span">{feature.title}</SafeText>
                </h3>
              </div>
              <p className="feature-description">
                <SafeText>{feature.description}</SafeText>
              </p>
              <div className="feature-actions">
                <button className="mg-button" variant="ghost" size="small">
                  자세히 보기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 인터랙티브 데모 */}
      <div className="demo-section">
        <div className="section-header">
          <h2>인터랙티브 데모</h2>
          <p>다양한 버튼과 카드의 동작을 직접 체험해보세요</p>
        </div>
        
        <div className="demo-grid">
          {/* 버튼 데모 */}
          <div className="mg-card" variant="glass" padding="large" className="demo-card">
            <h3>버튼 컴포넌트</h3>
            <div className="button-demo">
              <div className="button-row">
                <button className="mg-button" variant="primary" size="small" onClick={() => handleButtonClick('primary-small')}>
                  Primary Small
                </button>
                <button className="mg-button" variant="primary" size="medium" onClick={() => handleButtonClick('primary-medium')}>
                  Primary Medium
                </button>
                <button className="mg-button" variant="primary" size="large" onClick={() => handleButtonClick('primary-large')}>
                  Primary Large
                </button>
              </div>
              
              <div className="button-row">
                <button className="mg-button" variant="secondary" onClick={() => handleButtonClick('secondary')}>
                  Secondary
                </button>
                <button className="mg-button" variant="success" onClick={() => handleButtonClick('success')}>
                  Success
                </button>
                <button className="mg-button" variant="warning" onClick={() => handleButtonClick('warning')}>
                  Warning
                </button>
                <button className="mg-button" variant="danger" onClick={() => handleButtonClick('danger')}>
                  Danger
                </button>
              </div>
              
              <div className="button-row">
                <button className="mg-button" variant="primary" disabled>
                  Disabled
                </button>
                <button className="mg-button" variant="primary" loading={loading} onClick={handleLoadingTest}>
                  {loading ? '로딩 중...' : '로딩 테스트'}
                </button>
                <button className="mg-button" variant="primary" icon="📧">
                  아이콘 버튼
                </button>
              </div>
            </div>
          </div>

          {/* 카드 데모 */}
          <div className="mg-card" variant="glass" padding="large" className="demo-card">
            <h3>카드 컴포넌트</h3>
            <div className="card-demo">
              <div className="mini-card-grid">
                <div className="mg-card" variant="default" padding="medium" className="mini-card">
                  <h4>Default</h4>
                  <p>기본 카드</p>
                </div>
                
                <div className="mg-card" variant="elevated" padding="medium" className="mini-card">
                  <h4>Elevated</h4>
                  <p>그림자 강조</p>
                </div>
                
                <div className="mg-card" variant="outlined" padding="medium" className="mini-card">
                  <h4>Outlined</h4>
                  <p>테두리 강조</p>
                </div>
                
                <div className="mg-card" variant="filled" padding="medium" className="mini-card">
                  <h4>Filled</h4>
                  <p>배경 채움</p>
                </div>
                
                <div className="mg-card" variant="glass" padding="medium" className="mini-card">
                  <h4>Glass</h4>
                  <p>글래스 효과</p>
                </div>
                
                <div className="mg-card" 
                  variant="elevated" 
                  padding="medium" 
                  className="mini-card clickable"
                  onClick={() => alert('카드 클릭!')}
                >
                  <h4>Clickable</h4>
                  <p>클릭 가능</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA 섹션 */}
      <div className="cta-section">
        <div className="mg-card" variant="glass" padding="large" className="cta-card">
          <div className="cta-content">
            <h2>지금 시작해보세요</h2>
            <p>Core Solution의 모든 기능을 무료로 체험해보세요</p>
            <div className="cta-actions">
              <button className="mg-button" variant="primary" size="large" icon="🚀">
                무료 체험 시작
              </button>
              <button className="mg-button" variant="secondary" size="large">
                상담사 등록
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumDesignSample;



