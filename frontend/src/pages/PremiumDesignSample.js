/**
 * MindGarden 프리미엄 디자인 시스템 샘플
 * 디테일하고 세련된 UI 컴포넌트들을 보여주는 고급 샘플
 */

import React, { useState } from 'react';
import MGButton from '../components/common/MGButton';
import MGCard from '../components/common/MGCard';
import MGPageHeader from '../components/common/MGPageHeader';
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
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'AI 분석',
      description: '인공지능이 대화 내용을 분석하여 맞춤형 상담 방향을 제시합니다.',
      icon: '🤖',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: '개인화 추천',
      description: '사용자의 패턴을 학습하여 가장 적합한 상담 프로그램을 추천합니다.',
      icon: '🎯',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: '보안 보장',
      description: '최고 수준의 암호화로 모든 대화 내용을 안전하게 보호합니다.',
      icon: '🔒',
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
            title="MindGarden 프리미엄 디자인"
            subtitle="차세대 상담 플랫폼을 위한 세련된 UI/UX"
            description="디테일하고 직관적인 사용자 경험을 제공하는 디자인 시스템"
            icon="✨"
            actions={
              <div className="hero-actions">
                <MGButton variant="primary" size="large" icon="🚀">
                  시작하기
                </MGButton>
                <MGButton variant="secondary" size="large">
                  더 알아보기
                </MGButton>
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
            <MGCard 
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
                  <div className="stat-label">{stat.label}</div>
                  <div className={`stat-change ${stat.trend}`}>
                    {stat.change}
                  </div>
                </div>
              </div>
            </MGCard>
          ))}
        </div>
      </div>

      {/* 기능 소개 */}
      <div className="features-section">
        <div className="section-header">
          <h2>주요 기능</h2>
          <p>MindGarden의 핵심 기능들을 만나보세요</p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <MGCard 
              key={index}
              variant="elevated" 
              padding="large"
              className="feature-card"
            >
              <div className="feature-header">
                <div className="feature-icon" style={{ background: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
              </div>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-actions">
                <MGButton variant="ghost" size="small">
                  자세히 보기
                </MGButton>
              </div>
            </MGCard>
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
          <MGCard variant="glass" padding="large" className="demo-card">
            <h3>버튼 컴포넌트</h3>
            <div className="button-demo">
              <div className="button-row">
                <MGButton variant="primary" size="small" onClick={() => handleButtonClick('primary-small')}>
                  Primary Small
                </MGButton>
                <MGButton variant="primary" size="medium" onClick={() => handleButtonClick('primary-medium')}>
                  Primary Medium
                </MGButton>
                <MGButton variant="primary" size="large" onClick={() => handleButtonClick('primary-large')}>
                  Primary Large
                </MGButton>
              </div>
              
              <div className="button-row">
                <MGButton variant="secondary" onClick={() => handleButtonClick('secondary')}>
                  Secondary
                </MGButton>
                <MGButton variant="success" onClick={() => handleButtonClick('success')}>
                  Success
                </MGButton>
                <MGButton variant="warning" onClick={() => handleButtonClick('warning')}>
                  Warning
                </MGButton>
                <MGButton variant="danger" onClick={() => handleButtonClick('danger')}>
                  Danger
                </MGButton>
              </div>
              
              <div className="button-row">
                <MGButton variant="primary" disabled>
                  Disabled
                </MGButton>
                <MGButton variant="primary" loading={loading} onClick={handleLoadingTest}>
                  {loading ? '로딩 중...' : '로딩 테스트'}
                </MGButton>
                <MGButton variant="primary" icon="📧">
                  아이콘 버튼
                </MGButton>
              </div>
            </div>
          </MGCard>

          {/* 카드 데모 */}
          <MGCard variant="glass" padding="large" className="demo-card">
            <h3>카드 컴포넌트</h3>
            <div className="card-demo">
              <div className="mini-card-grid">
                <MGCard variant="default" padding="medium" className="mini-card">
                  <h4>Default</h4>
                  <p>기본 카드</p>
                </MGCard>
                
                <MGCard variant="elevated" padding="medium" className="mini-card">
                  <h4>Elevated</h4>
                  <p>그림자 강조</p>
                </MGCard>
                
                <MGCard variant="outlined" padding="medium" className="mini-card">
                  <h4>Outlined</h4>
                  <p>테두리 강조</p>
                </MGCard>
                
                <MGCard variant="filled" padding="medium" className="mini-card">
                  <h4>Filled</h4>
                  <p>배경 채움</p>
                </MGCard>
                
                <MGCard variant="glass" padding="medium" className="mini-card">
                  <h4>Glass</h4>
                  <p>글래스 효과</p>
                </MGCard>
                
                <MGCard 
                  variant="elevated" 
                  padding="medium" 
                  className="mini-card clickable"
                  onClick={() => alert('카드 클릭!')}
                >
                  <h4>Clickable</h4>
                  <p>클릭 가능</p>
                </MGCard>
              </div>
            </div>
          </MGCard>
        </div>
      </div>

      {/* CTA 섹션 */}
      <div className="cta-section">
        <MGCard variant="glass" padding="large" className="cta-card">
          <div className="cta-content">
            <h2>지금 시작해보세요</h2>
            <p>MindGarden의 모든 기능을 무료로 체험해보세요</p>
            <div className="cta-actions">
              <MGButton variant="primary" size="large" icon="🚀">
                무료 체험 시작
              </MGButton>
              <MGButton variant="secondary" size="large">
                상담사 등록
              </MGButton>
            </div>
          </div>
        </MGCard>
      </div>
    </div>
  );
};

export default PremiumDesignSample;



