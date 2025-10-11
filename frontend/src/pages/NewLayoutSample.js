import React, { useState, useEffect } from 'react';
import IPhone17Card from '../components/common/IPhone17Card';
import IPhone17Button from '../components/common/IPhone17Button';
import IPhone17Modal from '../components/common/IPhone17Modal';
import IPhone17PageHeader from '../components/common/IPhone17PageHeader';
import UnifiedHeader from '../components/common/UnifiedHeader';
import CommonPageTemplate from '../components/common/CommonPageTemplate';
import UnifiedNotification from '../components/common/UnifiedNotification';
import './NewLayoutSample.css';


const NewLayoutSample = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');

  // 테마 설정 (샘플용)
  const themes = [
    { id: 'default', name: '기본', color: '#3b82f6' },
    { id: 'warm', name: '따뜻한', color: '#f59e0b' },
    { id: 'cool', name: '시원한', color: '#06b6d4' },
    { id: 'elegant', name: '우아한', color: '#8b5cf6' },
    { id: 'vibrant', name: '활기찬', color: '#ef4444' }
  ];

  // 다크모드 토글 (샘플용)
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    const root = document.documentElement;
    if (newDarkMode) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
  };

  // 테마 변경 (샘플용)
  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    const root = document.documentElement;
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      root.style.setProperty('--current-theme', theme.color);
      root.setAttribute('data-theme', themeId);
    }
  };

  // 초기 설정
  useEffect(() => {
    const defaultTheme = themes.find(t => t.id === 'default');
    if (defaultTheme) {
      const root = document.documentElement;
      root.style.setProperty('--current-theme', defaultTheme.color);
      root.setAttribute('data-theme', 'default');
      setIsDarkMode(false);
      root.classList.remove('dark-mode');
    }
  }, []);

  // 알림 표시
  const showNotification = (type, message) => {
    // UnifiedNotification을 통해 알림 표시
    const event = new CustomEvent('showNotification', {
      detail: { type, message }
    });
    window.dispatchEvent(event);
  };

  // 헤더 액션들 (샘플용)
  const headerActions = (
    <div className="header-controls">
      <div className="theme-selector">
        {themes.map(theme => (
          <button
            key={theme.id}
            className={`theme-btn ${selectedTheme === theme.id ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
            
            title={theme.name}
          />
        ))}
      </div>
      <button 
        className="dark-mode-toggle"
        onClick={toggleDarkMode}
        title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );

  return (
    <CommonPageTemplate
      title="디자인 개편 총집약 샘플"
      description="ITCSS 아키텍처 기반 공통 레이아웃 시스템 완성 버전"
      bodyClass="design-showcase-page"
    >
      {/* UnifiedHeader 사용 */}
      <UnifiedHeader
        title="디자인 개편 총집약 샘플"
        subtitle="ITCSS 아키텍처 기반 공통 레이아웃 시스템"
        extraActions={headerActions}
      />

      <div className="design-showcase-container">
        {/* 페이지 헤더 섹션 */}
        <div className="page-header-section">
          <h1 className="page-title">MindGarden 디자인 시스템</h1>
          <p className="page-subtitle">ITCSS 아키텍처 기반 공통 레이아웃 시스템을 활용한 종합 샘플</p>
          <div className="page-actions">
            <button 
              className="btn-primary"
              onClick={() => showNotification('success', '주요 액션이 실행되었습니다.')}
            >
              주요 액션
            </button>
            <button 
              className="btn-secondary"
              onClick={() => showNotification('info', '보조 액션이 실행되었습니다.')}
            >
              보조 액션
            </button>
          </div>
        </div>

        {/* 통계 카드 섹션 */}
        <div className="showcase-section">
          <h2 className="section-title">통계 현황</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">1,234</div>
                <div className="stat-label">총 사용자</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <div className="stat-value">89</div>
                <div className="stat-label">활성 세션</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">₩2.4M</div>
                <div className="stat-label">이번 달 수익</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">4.8</div>
                <div className="stat-label">만족도</div>
              </div>
            </div>
          </div>
        </div>

        {/* 콘텐츠 섹션 */}
        <div className="showcase-content">
          <div className="content-card">
            <h3>최근 활동</h3>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-text">김민준 상담 완료</span>
                <span className="activity-time">5분 전</span>
              </div>
              <div className="activity-item">
                <span className="activity-text">새로운 매핑 생성</span>
                <span className="activity-time">12분 전</span>
              </div>
              <div className="activity-item">
                <span className="activity-text">결제 완료</span>
                <span className="activity-time">1시간 전</span>
              </div>
            </div>
          </div>

          <div className="content-card">
            <h3>알림</h3>
            <div className="notification-list">
              <div className="notification-item">
                <span className="notification-icon">🔔</span>
                <span className="notification-text">이번 주 예정된 세션이 5개 있습니다.</span>
              </div>
              <div className="notification-item">
                <span className="notification-icon">⚠️</span>
                <span className="notification-text">결제 예정일이 2일 남은 내담자가 있습니다.</span>
              </div>
              <div className="notification-item">
                <span className="notification-icon">✅</span>
                <span className="notification-text">시스템 백업이 완료되었습니다.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 기능 카드 섹션 */}
        <div className="showcase-section">
          <h2 className="section-title">주요 기능</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>데이터 분석</h4>
              <p>실시간 데이터 모니터링</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h4>사용자 관리</h4>
              <p>효율적인 사용자 관리</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h4>보안</h4>
              <p>강화된 보안 시스템</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h4>성능</h4>
              <p>최적화된 성능</p>
            </div>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="showcase-section">
          <h2 className="section-title">월별 성과 분석</h2>
          <div className="chart-container">
            <div className="chart-placeholder">
              <div className="chart-icon">📈</div>
              <h4>성과 분석 차트</h4>
              <p>여기에 실제 차트 라이브러리가 표시됩니다.</p>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="showcase-actions">
          <button 
            className="btn-primary"
            onClick={() => showNotification('success', '변경사항이 저장되었습니다.')}
          >
            변경사항 저장
          </button>
          <button 
            className="btn-secondary"
            onClick={() => showNotification('warning', '설정이 초기화되었습니다.')}
          >
            설정 초기화
          </button>
        </div>
      </div>

      <UnifiedNotification />
    </CommonPageTemplate>
  );
};

export default NewLayoutSample;
