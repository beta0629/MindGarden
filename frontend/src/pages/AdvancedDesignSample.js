/**
 * MindGarden 고급 디자인 시스템 샘플
 * 최신 디자인 트렌드와 정교한 레이아웃을 적용한 프리미엄 샘플
 */

import React, { useState } from 'react';
import MGButton from '../components/common/MGButton';
import MGCard from '../components/common/MGCard';
import MGPageHeader from '../components/common/MGPageHeader';
import MGLayout, { MGSection, MGContainer, MGGrid, MGFlex, MGSpace, MGDivider } from '../components/common/MGLayout';
import MGStats, { MGStatsGrid } from '../components/common/MGStats';
import MGLoading, { MGPageLoading, MGInlineLoading } from '../components/common/MGLoading';
import MGHeader from '../components/common/MGHeader';
import MGModal, { MGConfirmModal, MGLoadingModal, MGModalBody, MGModalFooter } from '../components/common/MGModal';
import MGTable from '../components/common/MGTable';
import MGChart from '../components/common/MGChart';
import MGForm, { MGFormGroup, MGFormInput, MGFormTextarea, MGFormSelect } from '../components/common/MGForm';
import MGStatistics, { MGStatisticsGrid, MGStatisticsChart, MGStatisticsCard } from '../components/common/MGStatistics';
import MGFilter from '../components/common/MGFilter';
import MGPagination from '../components/common/MGPagination';
import './AdvancedDesignSample.css';
// import { PerformanceOptimizationSample } from '../components/v0-results/mindgarden-design-system/components/mindgarden/performance-optimization-sample.js';

// 글래스모피즘 스파크라인 컴포넌트
const GlassSparkline = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="glass-sparkline-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="glass-sparkline-line"
      />
    </svg>
  );
};

// 글래스모피즘 통계 카드 컴포넌트
const GlassStatCard = ({ title, value, trend, icon, iconColor, sparklineData }) => {
  const isPositive = trend > 0;
  const TrendIcon = isPositive ? '↗' : '↘';

  const getSparklineColor = (iconColor) => {
    switch (iconColor) {
      case 'blue':
        return '#6b8dbd';
      case 'purple':
        return '#8b7cb8';
      case 'amber':
        return '#c4a484';
      case 'pink':
        return '#d4a5b8';
      default:
        return '#6b8dbd';
    }
  };

  return (
    <div className={`glass-stat-card glass-stat-card--${iconColor}`}>
      {/* Gradient overlay */}
      <div className="glass-stat-card__gradient-overlay" />

      <div className="glass-stat-card__content">
        {/* Header with icon */}
        <div className="glass-stat-card__header">
          <div className={`glass-stat-card__icon glass-stat-card__icon--${iconColor}`}>
            {icon}
          </div>
          <div className={`glass-stat-card__trend glass-stat-card__trend--${isPositive ? 'positive' : 'negative'}`}>
            <span className="glass-stat-card__trend-icon">{TrendIcon}</span>
            <span className="glass-stat-card__trend-value">{Math.abs(trend)}%</span>
          </div>
        </div>

        {/* Title and value */}
        <div className="glass-stat-card__main">
          <p className="glass-stat-card__title">{title}</p>
          <p className="glass-stat-card__value">{value}</p>
        </div>

        {/* Sparkline chart */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="glass-stat-card__sparkline">
            <GlassSparkline data={sparklineData} color={getSparklineColor(iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
};

const AdvancedDesignSample = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateRange: { start: '', end: '' }
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    message: ''
  });

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  // 테이블 데이터 생성
  const generateTableData = () => {
    const data = [];
    for (let i = 1; i <= 50; i++) {
      data.push({
        id: i,
        name: `사용자 ${i}`,
        email: `user${i}@example.com`,
        role: ['관리자', '상담사', '내담자'][Math.floor(Math.random() * 3)],
        status: ['활성', '비활성', '대기'][Math.floor(Math.random() * 3)],
        joinDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
        lastLogin: new Date().toLocaleDateString()
      });
    }
    return data;
  };

  // 컴포넌트 마운트 시 테이블 데이터 생성
  React.useEffect(() => {
    setTableData(generateTableData());
  }, []);

  const tableColumns = [
    { key: 'name', header: '이름', render: (value) => <strong>{value}</strong> },
    { key: 'email', header: '이메일' },
    { key: 'role', header: '역할' },
    { key: 'status', header: '상태', render: (value) => (
      <span className={`status-badge status-${value}`}>{value}</span>
    )},
    { key: 'joinDate', header: '가입일' },
    { key: 'lastLogin', header: '마지막 로그인' }
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const chartData = {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
    datasets: [{
      label: '사용자 수',
      data: [65, 59, 80, 81, 56, 55],
      borderColor: 'rgb(102, 126, 234)',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4
    }]
  };

  const statsData = [
    { 
      title: '총 사용자', 
      value: '12,847', 
      change: 12.5, 
      changeType: 'increase',
      icon: '👥',
      color: 'blue',
      sparklineData: [20, 35, 30, 45, 40, 55, 50, 60, 55, 70]
    },
    { 
      title: '활성 세션', 
      value: '3,429', 
      change: 8.2, 
      changeType: 'increase',
      icon: '💬',
      color: 'orange',
      sparklineData: [30, 25, 35, 30, 40, 35, 45, 40, 50, 45]
    },
    { 
      title: '완료된 상담', 
      value: '8,923', 
      change: 3.1, 
      changeType: 'decrease',
      icon: '✅',
      color: 'green',
      sparklineData: [50, 45, 55, 50, 60, 55, 50, 45, 40, 35]
    },
    { 
      title: '만족도', 
      value: '4.8/5', 
      change: 5.4, 
      changeType: 'increase',
      icon: '⭐',
      color: 'purple',
      sparklineData: [40, 42, 45, 43, 46, 44, 47, 46, 48, 47]
    }
  ];

  // 글래스모피즘 통계 데이터
  const glassStatsData = [
    {
      title: '총 사용자',
      value: '12,847',
      trend: 12.5,
      icon: '👥',
      iconColor: 'blue',
      sparklineData: [45, 52, 48, 58, 53, 65, 62, 70, 68, 75, 72, 80]
    },
    {
      title: '활성 세션',
      value: '3,429',
      trend: 8.2,
      icon: '💬',
      iconColor: 'purple',
      sparklineData: [30, 35, 32, 40, 38, 45, 42, 48, 50, 55, 52, 58]
    },
    {
      title: '완료된 상담',
      value: '8,923',
      trend: -3.1,
      icon: '✅',
      iconColor: 'amber',
      sparklineData: [85, 88, 82, 80, 78, 75, 73, 70, 72, 68, 70, 65]
    },
    {
      title: '만족도',
      value: '4.8/5',
      trend: 5.4,
      icon: '⭐',
      iconColor: 'pink',
      sparklineData: [4.2, 4.3, 4.4, 4.5, 4.4, 4.6, 4.5, 4.7, 4.6, 4.8, 4.7, 4.8]
    }
  ];

  const features = [
    {
      title: 'AI 기반 상담',
      description: '인공지능이 대화 내용을 분석하여 맞춤형 상담 방향을 제시합니다.',
      icon: '🤖',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stats: { sessions: '2.4K', satisfaction: '98%' }
    },
    {
      title: '실시간 모니터링',
      description: '상담 진행 상황을 실시간으로 모니터링하고 필요한 지원을 제공합니다.',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stats: { sessions: '1.8K', satisfaction: '96%' }
    },
    {
      title: '보안 암호화',
      description: '최고 수준의 암호화로 모든 대화 내용을 안전하게 보호합니다.',
      icon: '🔒',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stats: { sessions: '3.2K', satisfaction: '99%' }
    },
    {
      title: '개인화 추천',
      description: '사용자 패턴을 학습하여 가장 적합한 상담 프로그램을 추천합니다.',
      icon: '🎯',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      stats: { sessions: '2.1K', satisfaction: '97%' }
    }
  ];

  const tabs = [
    { id: 'overview', label: '개요', icon: '📊' },
    { id: 'table', label: '테이블', icon: '📋' },
    { id: 'form', label: '폼', icon: '📝' },
    { id: 'chart', label: '차트', icon: '📈' },
    { id: 'analytics', label: '분석', icon: '📊' },
    { id: 'users', label: '사용자', icon: '👥' },
    { id: 'settings', label: '설정', icon: '⚙️' }
  ];

  return (
    <MGLayout variant="default">
      {/* 샘플 전용 헤더 */}
      <div className="sample-header">
        <div className="sample-header__container">
          <div className="sample-header__logo">
            <span className="sample-header__logo-icon">🌱</span>
            <span className="sample-header__logo-text">MindGarden 샘플</span>
          </div>
          
          {/* 샘플 전용 탭 네비게이션 */}
          <div className="sample-header__tabs">
            <button 
              className={`sample-tab ${selectedTab === 'overview' ? 'active' : ''}`}
              onClick={() => setSelectedTab('overview')}
            >
              <span className="sample-tab__icon">📊</span>
              <span className="sample-tab__label">개요</span>
            </button>
            <button 
              className={`sample-tab ${selectedTab === 'table' ? 'active' : ''}`}
              onClick={() => setSelectedTab('table')}
            >
              <span className="sample-tab__icon">📋</span>
              <span className="sample-tab__label">테이블</span>
            </button>
            <button 
              className={`sample-tab ${selectedTab === 'form' ? 'active' : ''}`}
              onClick={() => setSelectedTab('form')}
            >
              <span className="sample-tab__icon">📝</span>
              <span className="sample-tab__label">폼</span>
            </button>
            <button 
              className={`sample-tab ${selectedTab === 'chart' ? 'active' : ''}`}
              onClick={() => setSelectedTab('chart')}
            >
              <span className="sample-tab__icon">📈</span>
              <span className="sample-tab__label">차트</span>
            </button>
            <button 
              className={`sample-tab ${selectedTab === 'performance' ? 'active' : ''}`}
              onClick={() => setSelectedTab('performance')}
            >
              <span className="sample-tab__icon">⚡</span>
              <span className="sample-tab__label">성능</span>
            </button>
          </div>
          
          {/* 모바일 햄버거 메뉴 버튼 */}
          <button 
            className="sample-header__mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="메뉴 열기"
          >
            <span className={`sample-header__hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
      
      {/* 모바일 메뉴 드롭다운 */}
      {isMobileMenuOpen && (
        <div className="sample-header__mobile-menu">
          <div className="sample-header__mobile-tabs">
            <button 
              className={`sample-tab ${selectedTab === 'overview' ? 'active' : ''}`}
              onClick={() => {
                setSelectedTab('overview');
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="sample-tab__icon">📊</span>
              <span className="sample-tab__label">개요</span>
            </button>
            <button 
              className={`sample-tab ${selectedTab === 'table' ? 'active' : ''}`}
              onClick={() => {
                setSelectedTab('table');
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="sample-tab__icon">📋</span>
              <span className="sample-tab__label">테이블</span>
            </button>
            <button 
              className={`sample-tab ${selectedTab === 'form' ? 'active' : ''}`}
              onClick={() => {
                setSelectedTab('form');
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="sample-tab__icon">📝</span>
              <span className="sample-tab__label">폼</span>
            </button>
            <button 
              className={`sample-tab ${selectedTab === 'chart' ? 'active' : ''}`}
              onClick={() => {
                setSelectedTab('chart');
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="sample-tab__icon">📈</span>
              <span className="sample-tab__label">차트</span>
            </button>
          </div>
        </div>
      )}
      
      {/* 히어로 섹션 */}
      <MGSection variant="elevated" background="primary" padding="xl">
        <MGContainer size="xl">
          <div className="hero-content">
            <div className="hero-header">
              <div className="hero-icon">✨</div>
              <h1 className="hero-title">MindGarden 고급 디자인 시스템</h1>
              <h2 className="hero-subtitle">차세대 상담 플랫폼을 위한 정교한 UI/UX</h2>
              <p className="hero-description">
                최신 디자인 트렌드와 사용자 중심의 인터페이스를 적용한 프리미엄 디자인 시스템
              </p>
            </div>
            <div className="hero-actions">
              <MGButton variant="primary" size="large" icon="🚀">
                시작하기
              </MGButton>
              <MGButton variant="secondary" size="large">
                더 알아보기
              </MGButton>
            </div>
          </div>
        </MGContainer>
      </MGSection>

      {/* 통계 대시보드 */}
      <MGSection padding="large">
        <MGContainer size="xl">
          <MGFlex direction="column" gap="large">
            <MGFlex direction="column" align="center" gap="medium">
              <h2 className="section-title">실시간 현황</h2>
              <p className="section-description">
                플랫폼의 현재 상태와 주요 지표를 실시간으로 확인하세요
              </p>
            </MGFlex>
            
            <MGStatsGrid cols={4} gap="large">
              {statsData.map((stat, index) => (
                <MGStats
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  change={stat.change}
                  changeType={stat.changeType}
                  icon={stat.icon}
                  color={stat.color}
                  sparklineData={stat.sparklineData}
                  onClick={() => console.log(`${stat.title} 클릭됨`)}
                />
              ))}
            </MGStatsGrid>
          </MGFlex>
        </MGContainer>
      </MGSection>

      {/* 글래스모피즘 통계 대시보드 */}
      <MGSection padding="large" className="glassmorphism-section">
        <MGContainer size="xl">
          <MGFlex direction="column" gap="large">
            <MGFlex direction="column" align="center" gap="medium">
              <h2 className="section-title">글래스모피즘 대시보드</h2>
              <p className="section-description">
                v0.dev에서 생성된 프리미엄 글래스모피즘 디자인을 경험해보세요
              </p>
            </MGFlex>
            
            <div className="glass-stats-grid">
              {glassStatsData.map((stat, index) => (
                <GlassStatCard key={index} {...stat} />
              ))}
            </div>
          </MGFlex>
        </MGContainer>
      </MGSection>

      {/* 탭 네비게이션 */}
      <MGSection padding="medium" background="gray">
        <MGContainer size="xl">
          <MGFlex justify="center" gap="small">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${selectedTab === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </MGFlex>
        </MGContainer>
      </MGSection>

      {/* 기능 소개 */}
      <MGSection padding="large">
        <MGContainer size="xl">
          <MGFlex direction="column" gap="large">
            <MGFlex direction="column" align="center" gap="medium">
              <h2 className="section-title">핵심 기능</h2>
              <p className="section-description">
                MindGarden의 혁신적인 기능들을 만나보세요
              </p>
            </MGFlex>
            
            <MGGrid cols="auto" gap="large">
              {features.map((feature, index) => (
                <MGCard key={index} variant="elevated" padding="large" className="feature-card">
                  <MGFlex direction="column" gap="medium">
                    <MGFlex align="center" gap="medium">
                      <div 
                        className="feature-icon" 
                        style={{ background: feature.gradient }}
                      >
                        {feature.icon}
                      </div>
                      <MGFlex direction="column" gap="xs">
                        <h3 className="feature-title">{feature.title}</h3>
                        <MGFlex gap="medium">
                          <span className="feature-stat">
                            {feature.stats.sessions} 세션
                          </span>
                          <span className="feature-stat">
                            {feature.stats.satisfaction} 만족도
                          </span>
                        </MGFlex>
                      </MGFlex>
                    </MGFlex>
                    
                    <p className="feature-description">{feature.description}</p>
                    
                    <MGFlex justify="between" align="center">
                      <MGFlex gap="small">
                        <span className="feature-badge">AI</span>
                        <span className="feature-badge">실시간</span>
                      </MGFlex>
                      <MGButton variant="ghost" size="small">
                        자세히 보기 →
                      </MGButton>
                    </MGFlex>
                  </MGFlex>
                </MGCard>
              ))}
            </MGGrid>
          </MGFlex>
        </MGContainer>
      </MGSection>

      <MGDivider variant="gradient" />

      {/* 인터랙티브 데모 */}
      <MGSection padding="large" background="gray">
        <MGContainer size="xl">
          <MGFlex direction="column" gap="large">
            <MGFlex direction="column" align="center" gap="medium">
              <h2 className="section-title">컴포넌트 데모</h2>
              <p className="section-description">
                다양한 UI 컴포넌트의 동작을 직접 체험해보세요
              </p>
              
              {/* 로딩바 데모 */}
              <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', width: '100%', maxWidth: '800px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#1a202c' }}>로딩바 데모</h4>
                <MGFlex gap="medium" wrap justify="center">
                  <MGLoading variant="spinner" size="small" text="스피너" />
                  <MGLoading variant="dots" size="medium" text="도츠" />
                  <MGLoading variant="pulse" size="large" text="펄스" />
                  <MGLoading variant="progress" progress={75} text="진행률 75%" />
                </MGFlex>
              </div>
              
              {/* 모달 테스트 버튼들 */}
              <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '8px', width: '100%', maxWidth: '800px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#1a202c' }}>모달 테스트</h4>
                <MGFlex gap="medium" wrap justify="center">
                  <MGButton variant="primary" onClick={() => setShowConfirmModal(true)}>
                    확인 모달 열기
                  </MGButton>
                  <MGButton variant="warning" onClick={() => {
                    setShowLoadingModal(true);
                    setTimeout(() => setShowLoadingModal(false), 3000);
                  }}>
                    로딩 모달 열기
                  </MGButton>
                  <MGButton variant="success" onClick={() => setShowDemoModal(true)}>
                    데모 모달 열기
                  </MGButton>
                </MGFlex>
              </div>
            </MGFlex>
            
            <MGGrid cols="auto" gap="large">
              {/* 버튼 데모 */}
              <MGCard variant="glass" padding="large" className="demo-card">
                <MGFlex direction="column" gap="large">
                  <h3 className="demo-title">버튼 컴포넌트</h3>
                  
                  <MGFlex direction="column" gap="medium">
                    <MGFlex gap="medium" wrap>
                      <MGButton variant="primary" size="small">
                        Primary Small
                      </MGButton>
                      <MGButton variant="primary" size="medium">
                        Primary Medium
                      </MGButton>
                      <MGButton variant="primary" size="large">
                        Primary Large
                      </MGButton>
                    </MGFlex>
                    
                    <MGFlex gap="medium" wrap>
                      <MGButton variant="secondary">Secondary</MGButton>
                      <MGButton variant="success">Success</MGButton>
                      <MGButton variant="warning">Warning</MGButton>
                      <MGButton variant="danger">Danger</MGButton>
                    </MGFlex>
                    
                    <MGFlex gap="medium" wrap>
                      <MGButton variant="primary" disabled>
                        Disabled
                      </MGButton>
                      <MGButton variant="primary" loading={loading} onClick={handleLoadingTest}>
                        {loading ? '로딩 중...' : '로딩 테스트'}
                      </MGButton>
                      <MGButton variant="primary" icon="📧">
                        아이콘 버튼
                      </MGButton>
                      <MGButton variant="primary" onClick={() => setShowConfirmModal(true)}>
                        확인 모달
                      </MGButton>
                      <MGButton variant="warning" onClick={() => setShowLoadingModal(true)}>
                        로딩 모달
                      </MGButton>
                      <MGButton variant="success" onClick={() => setShowDemoModal(true)}>
                        데모 모달
                      </MGButton>
                    </MGFlex>
                  </MGFlex>
                </MGFlex>
              </MGCard>

              {/* 레이아웃 데모 */}
              <MGCard variant="glass" padding="large" className="demo-card">
                <MGFlex direction="column" gap="large">
                  <h3 className="demo-title">레이아웃 시스템</h3>
                  
                  <MGFlex direction="column" gap="medium">
                    <MGGrid cols={2} gap="small">
                      <MGCard variant="outlined" padding="medium" className="mini-card">
                        <MGFlex direction="column" align="center" gap="small">
                          <span className="mini-card-icon">📐</span>
                          <span className="mini-card-title">Grid</span>
                        </MGFlex>
                      </MGCard>
                      
                      <MGCard variant="outlined" padding="medium" className="mini-card">
                        <MGFlex direction="column" align="center" gap="small">
                          <span className="mini-card-icon">📏</span>
                          <span className="mini-card-title">Flex</span>
                        </MGFlex>
                      </MGCard>
                    </MGGrid>
                    
                    <MGDivider variant="dashed" />
                    
                    <MGFlex justify="between" align="center">
                      <span className="demo-label">컨테이너 크기</span>
                      <MGFlex gap="small">
                        <span className="size-badge">SM</span>
                        <span className="size-badge active">MD</span>
                        <span className="size-badge">LG</span>
                        <span className="size-badge">XL</span>
                      </MGFlex>
                    </MGFlex>
                  </MGFlex>
                </MGFlex>
              </MGCard>
            </MGGrid>
          </MGFlex>
        </MGContainer>
      </MGSection>

      {/* 탭 콘텐츠 */}
      <MGSection padding="large">
        <MGContainer size="xl">
          {/* 테이블 탭 */}
          {selectedTab === 'table' && (
            <MGFlex direction="column" gap="large">
              <MGFlex direction="column" align="center" gap="medium">
                <h2 className="section-title">데이터 테이블</h2>
                <p className="section-description">
                  고급 테이블 기능과 필터링, 페이징을 지원하는 데이터 테이블입니다
                </p>
              </MGFlex>

              <MGFilter
                filters={[
                  {
                    type: 'select',
                    key: 'status',
                    value: filters.status,
                    placeholder: '상태별 필터',
                    options: [
                      { value: '', label: '전체' },
                      { value: '활성', label: '활성' },
                      { value: '비활성', label: '비활성' },
                      { value: '대기', label: '대기' }
                    ]
                  },
                  {
                    type: 'input',
                    key: 'search',
                    value: filters.search,
                    placeholder: '검색...'
                  },
                  {
                    type: 'dateRange',
                    key: 'dateRange',
                    value: filters.dateRange
                  }
                ]}
                onFilterChange={handleFilterChange}
                onReset={() => setFilters({ status: '', search: '', dateRange: { start: '', end: '' } })}
              />

              <MGTable
                data={tableData}
                columns={tableColumns}
                loading={tableLoading}
                selectable={true}
                selectedRows={selectedRows}
                onSelectionChange={setSelectedRows}
                onRowClick={(row) => console.log('행 클릭:', row)}
                variant="striped"
              />

              <MGPagination
                currentPage={currentPage}
                totalPages={Math.ceil(tableData.length / itemsPerPage)}
                totalItems={tableData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[5, 10, 20, 50]}
              />
            </MGFlex>
          )}

          {/* 폼 탭 */}
          {selectedTab === 'form' && (
            <MGFlex direction="column" gap="large">
              <MGFlex direction="column" align="center" gap="medium">
                <h2 className="section-title">폼 컴포넌트</h2>
                <p className="section-description">
                  다양한 입력 필드와 유효성 검사를 지원하는 폼 컴포넌트입니다
                </p>
              </MGFlex>

              <MGGrid cols={2} gap="large">
                <MGForm
                  variant="card"
                  onSubmit={(e) => {
                    e.preventDefault();
                    console.log('폼 제출:', formData);
                  }}
                >
                  <MGFormInput
                    name="name"
                    label="이름"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="이름을 입력하세요"
                    required={true}
                    icon="👤"
                  />

                  <MGFormInput
                    name="email"
                    type="email"
                    label="이메일"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="이메일을 입력하세요"
                    required={true}
                    icon="📧"
                  />

                  <MGFormSelect
                    name="role"
                    label="역할"
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    placeholder="역할을 선택하세요"
                    required={true}
                    options={[
                      { value: 'admin', label: '관리자' },
                      { value: 'consultant', label: '상담사' },
                      { value: 'client', label: '내담자' }
                    ]}
                  />

                  <MGFormTextarea
                    name="message"
                    label="메시지"
                    value={formData.message}
                    onChange={(e) => handleFormChange('message', e.target.value)}
                    placeholder="메시지를 입력하세요"
                    rows={4}
                  />

                  <MGFlex gap="medium" justify="end">
                    <MGButton variant="secondary" type="button">
                      취소
                    </MGButton>
                    <MGButton variant="primary" type="submit">
                      저장
                    </MGButton>
                  </MGFlex>
                </MGForm>

                <MGCard variant="glass" padding="large">
                  <h3>폼 데이터 미리보기</h3>
                  <pre style={{ 
                    background: 'var(--bg-secondary)', 
                    padding: 'var(--spacing-md)', 
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(formData, null, 2)}
                  </pre>
                </MGCard>
              </MGGrid>
            </MGFlex>
          )}

          {/* 차트 탭 */}
          {selectedTab === 'chart' && (
            <MGFlex direction="column" gap="large">
              <MGFlex direction="column" align="center" gap="medium">
                <h2 className="section-title">차트 컴포넌트</h2>
                <p className="section-description">
                  다양한 차트 타입과 데이터 시각화를 지원하는 차트 컴포넌트입니다
                </p>
              </MGFlex>

              <MGGrid cols={2} gap="large">
                <MGStatisticsCard title="사용자 증가 추이">
                  <MGChart
                    type="line"
                    data={chartData}
                    height={300}
                    variant="gradient"
                  />
                </MGStatisticsCard>

                <MGStatisticsCard title="월별 상담 현황">
                  <MGChart
                    type="bar"
                    data={{
                      labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
                      datasets: [{
                        label: '상담 수',
                        data: [12, 19, 3, 5, 2, 3],
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                      }]
                    }}
                    height={300}
                  />
                </MGStatisticsCard>

                <MGStatisticsCard title="사용자 분포">
                  <MGChart
                    type="doughnut"
                    data={{
                      labels: ['관리자', '상담사', '내담자'],
                      datasets: [{
                        data: [10, 45, 100],
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.8)',
                          'rgba(54, 162, 235, 0.8)',
                          'rgba(255, 205, 86, 0.8)'
                        ]
                      }]
                    }}
                    height={300}
                  />
                </MGStatisticsCard>

                <MGStatisticsCard title="성과 지표">
                  <MGStatisticsGrid cols={2} gap="medium">
                    <MGStatistics
                      title="완료율"
                      value="87%"
                      change="+5%"
                      changeType="positive"
                      icon="✅"
                      color="success"
                      variant="card"
                    />
                    <MGStatistics
                      title="평점"
                      value="4.8"
                      change="+0.2"
                      changeType="positive"
                      icon="⭐"
                      color="warning"
                      variant="card"
                    />
                  </MGStatisticsGrid>
                </MGStatisticsCard>
              </MGGrid>
            </MGFlex>
          )}

          {/* 성능 최적화 탭 */}
          {selectedTab === 'performance' && (
            <div className="performance-optimization-sample">
              <h3>성능 최적화 샘플</h3>
              <p>성능 최적화 컴포넌트가 준비 중입니다.</p>
            </div>
          )}
        </MGContainer>
      </MGSection>

      {/* CTA 섹션 */}
      <MGSection variant="elevated" padding="large">
        <MGContainer size="xl">
          <MGCard variant="elevated" padding="large" className="cta-card">
            <MGFlex direction="column" align="center" gap="large">
              <MGFlex direction="column" align="center" gap="medium">
                <h2 className="cta-title">지금 시작해보세요</h2>
                <p className="cta-description">
                  MindGarden의 모든 기능을 무료로 체험하고, 더 나은 상담 서비스를 경험해보세요
                </p>
              </MGFlex>
              
              <MGFlex gap="medium" wrap justify="center">
                <MGButton variant="primary" size="large">
                  무료 체험 시작
                </MGButton>
                <MGButton variant="secondary" size="large">
                  상담사 등록
                </MGButton>
                <MGButton variant="ghost" size="large">
                  데모 시청
                </MGButton>
              </MGFlex>
            </MGFlex>
          </MGCard>
        </MGContainer>
      </MGSection>

      {/* 모달들 */}
      <MGConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => console.log('확인됨')}
        title="확인"
        message="정말로 이 작업을 진행하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="진행"
        cancelText="취소"
        confirmVariant="danger"
      />

      <MGLoadingModal
        isOpen={showLoadingModal}
        title="처리 중..."
        message="데이터를 불러오고 있습니다. 잠시만 기다려주세요."
      />

      <MGModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        title="데모 모달"
        size="medium"
      >
        <MGModalBody>
          <div style={{ padding: '20px 0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
              모달 컴포넌트 데모
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#4a5568', lineHeight: '1.6' }}>
              이것은 다양한 기능을 보여주는 데모 모달입니다.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ 
                padding: '16px', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px',
                backgroundColor: '#f8fafc'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>기능 1</h4>
                <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
                  모달 내에서도 모든 컴포넌트를 사용할 수 있습니다.
                </p>
              </div>
              
              <div style={{ 
                padding: '16px', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px',
                backgroundColor: '#f8fafc'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>기능 2</h4>
                <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
                  반응형 레이아웃도 완벽하게 지원합니다.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#667eea', borderRadius: '50%', animation: 'bounce 1.4s ease-in-out infinite both' }}></div>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#667eea', borderRadius: '50%', animation: 'bounce 1.4s ease-in-out infinite both', animationDelay: '-0.32s' }}></div>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#667eea', borderRadius: '50%', animation: 'bounce 1.4s ease-in-out infinite both', animationDelay: '-0.16s' }}></div>
              <span style={{ fontSize: '12px', color: '#718096', marginLeft: '8px' }}>로딩 중...</span>
            </div>
          </div>
        </MGModalBody>
        
        <MGModalFooter>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <MGButton variant="secondary" onClick={() => setShowDemoModal(false)}>
              닫기
            </MGButton>
            <MGButton variant="primary">
              저장
            </MGButton>
          </div>
        </MGModalFooter>
      </MGModal>
    </MGLayout>
  );
};

export default AdvancedDesignSample;
