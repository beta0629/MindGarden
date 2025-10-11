import React, { useState, useEffect } from 'react';
import UnifiedHeader from '../components/common/UnifiedHeader';
import CommonPageTemplate from '../components/common/CommonPageTemplate';
import UnifiedNotification from '../components/common/UnifiedNotification';
import IPhone17Card from '../components/common/IPhone17Card';
import IPhone17Button from '../components/common/IPhone17Button';
import './iPhone17DesignSystemSample.css';

/**
 * iPhone 17 디자인 시스템 공통화 샘플
 * 공통화된 iPhone 17 컴포넌트들을 사용한 종합 샘플
 */
const IPhone17DesignSystemSample = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');

  // 테마 설정 (샘플용)
  const themes = [
    { id: 'default', name: '기본', color: '#007AFF' },
    { id: 'warm', name: '따뜻한', color: '#FF9500' },
    { id: 'cool', name: '시원한', color: '#00C7BE' },
    { id: 'elegant', name: '우아한', color: '#5856D6' },
    { id: 'vibrant', name: '활기찬', color: '#FF3B30' }
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
    const event = new CustomEvent('showNotification', {
      detail: { type, message }
    });
    window.dispatchEvent(event);
  };

  // 헤더 액션들 (샘플용)
  const headerActions = (
    <div className="iphone17-header-controls">
      <div className="iphone17-theme-selector">
        {themes.map(theme => (
          <button
            key={theme.id}
            className={`iphone17-theme-btn ${selectedTheme === theme.id ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
            
            title={theme.name}
          />
        ))}
      </div>
      <button 
        className="iphone17-dark-toggle"
        onClick={toggleDarkMode}
        title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );

  return (
    <CommonPageTemplate
      title="iPhone 17 디자인 시스템 공통화 샘플"
      description="공통화된 iPhone 17 컴포넌트들을 사용한 종합 샘플"
      bodyClass="iphone17-design-system-page"
    >
      {/* UnifiedHeader 사용 */}
      <UnifiedHeader
        title="iPhone 17 디자인 시스템"
        subtitle="공통화된 컴포넌트 시스템 완성 버전"
        extraActions={headerActions}
      />

      <div className="iphone17-sample-container">
        {/* 페이지 헤더 섹션 */}
        <div className="iphone17-page-header">
          <h1 className="iphone17-page-title">iPhone 17 디자인 시스템</h1>
          <p className="iphone17-page-subtitle">
            공통화된 iPhone 17 컴포넌트들을 사용한 종합 샘플
          </p>
          <div className="iphone17-btn-group">
            <IPhone17Button
              variant="primary"
              onClick={() => showNotification('success', '주요 액션이 실행되었습니다.')}
            >
              주요 액션
            </IPhone17Button>
            <IPhone17Button
              variant="secondary"
              onClick={() => showNotification('info', '보조 액션이 실행되었습니다.')}
            >
              보조 액션
            </IPhone17Button>
          </div>
        </div>

        {/* 통계 카드 섹션 */}
        <div className="iphone17-section">
          <h2 className="iphone17-section-title">통계 현황</h2>
          <div className="iphone17-stats-grid">
            <IPhone17Card
              variant="stat"
              icon="👥"
              value="1,234"
              label="총 사용자"
            />
            <IPhone17Card
              variant="stat"
              icon="💬"
              value="89"
              label="활성 세션"
            />
            <IPhone17Card
              variant="stat"
              icon="💰"
              value="₩2.4M"
              label="이번 달 수익"
            />
            <IPhone17Card
              variant="stat"
              icon="⭐"
              value="4.8"
              label="만족도"
            />
          </div>
        </div>

        {/* 콘텐츠 섹션 */}
        <div className="iphone17-content-grid">
          <IPhone17Card
            variant="content"
            title="최근 활동"
          >
            <div className="iphone17-activity-list">
              <div className="iphone17-activity-item">
                <span className="iphone17-activity-text">김민준 상담 완료</span>
                <span className="iphone17-activity-time">5분 전</span>
              </div>
              <div className="iphone17-activity-item">
                <span className="iphone17-activity-text">새로운 매핑 생성</span>
                <span className="iphone17-activity-time">12분 전</span>
              </div>
              <div className="iphone17-activity-item">
                <span className="iphone17-activity-text">결제 완료</span>
                <span className="iphone17-activity-time">1시간 전</span>
              </div>
            </div>
          </IPhone17Card>

          <IPhone17Card
            variant="content"
            title="알림"
          >
            <div className="iphone17-notification-list">
              <div className="iphone17-notification-item">
                <span className="iphone17-notification-icon">🔔</span>
                <span className="iphone17-notification-text">
                  이번 주 예정된 세션이 5개 있습니다.
                </span>
              </div>
              <div className="iphone17-notification-item">
                <span className="iphone17-notification-icon">⚠️</span>
                <span className="iphone17-notification-text">
                  결제 예정일이 2일 남은 내담자가 있습니다.
                </span>
              </div>
              <div className="iphone17-notification-item">
                <span className="iphone17-notification-icon">✅</span>
                <span className="iphone17-notification-text">
                  시스템 백업이 완료되었습니다.
                </span>
              </div>
            </div>
          </IPhone17Card>
        </div>

        {/* 기능 카드 섹션 */}
        <div className="iphone17-section">
          <h2 className="iphone17-section-title">주요 기능</h2>
          <div className="iphone17-features-grid">
            <IPhone17Card
              variant="feature"
              icon="📊"
              title="데이터 분석"
              description="실시간 데이터 모니터링"
            />
            <IPhone17Card
              variant="feature"
              icon="👥"
              title="사용자 관리"
              description="효율적인 사용자 관리"
            />
            <IPhone17Card
              variant="feature"
              icon="🔒"
              title="보안"
              description="강화된 보안 시스템"
            />
            <IPhone17Card
              variant="feature"
              icon="⚡"
              title="성능"
              description="최적화된 성능"
            />
          </div>
        </div>

        {/* 글래스모피즘 카드 섹션 */}
        <div className="iphone17-section">
          <h2 className="iphone17-section-title">글래스모피즘 효과</h2>
          <div className="iphone17-glass-grid">
            <IPhone17Card variant="glass">
              <h3>글래스 카드 1</h3>
              <p>iPhone 17의 정교한 글래스모피즘 효과를 적용한 카드입니다.</p>
            </IPhone17Card>
            <IPhone17Card variant="glass">
              <h3>글래스 카드 2</h3>
              <p>투명도와 블러 효과가 조화롭게 어우러진 디자인입니다.</p>
            </IPhone17Card>
          </div>
        </div>

        {/* 버튼 샘플 섹션 */}
        <div className="iphone17-section">
          <h2 className="iphone17-section-title">버튼 시스템</h2>
          <div className="iphone17-button-showcase">
            <div className="iphone17-button-group">
              <h3>기본 버튼</h3>
              <div className="iphone17-btn-group">
                <IPhone17Button variant="primary">프라이머리</IPhone17Button>
                <IPhone17Button variant="secondary">세컨더리</IPhone17Button>
                <IPhone17Button variant="ghost">고스트</IPhone17Button>
                <IPhone17Button variant="glass">글래스</IPhone17Button>
              </div>
            </div>
            
            <div className="iphone17-button-group">
              <h3>크기별 버튼</h3>
              <div className="iphone17-btn-group">
                <IPhone17Button variant="primary" size="sm">Small</IPhone17Button>
                <IPhone17Button variant="primary" size="md">Medium</IPhone17Button>
                <IPhone17Button variant="primary" size="lg">Large</IPhone17Button>
                <IPhone17Button variant="primary" size="xl">Extra Large</IPhone17Button>
              </div>
            </div>
            
            <div className="iphone17-button-group">
              <h3>아이콘 버튼</h3>
              <div className="iphone17-btn-group">
                <IPhone17Button variant="primary" size="icon" icon="➕" />
                <IPhone17Button variant="secondary" size="icon" icon="⚙️" />
                <IPhone17Button variant="ghost" size="icon" icon="❤️" />
                <IPhone17Button variant="glass" size="icon" icon="⭐" />
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="iphone17-actions">
          <IPhone17Button
            variant="primary"
            size="lg"
            onClick={() => showNotification('success', '변경사항이 저장되었습니다.')}
          >
            변경사항 저장
          </IPhone17Button>
          <IPhone17Button
            variant="secondary"
            size="lg"
            onClick={() => showNotification('warning', '설정이 초기화되었습니다.')}
          >
            설정 초기화
          </IPhone17Button>
        </div>
      </div>

      <UnifiedNotification />
    </CommonPageTemplate>
  );
};

export default IPhone17DesignSystemSample;
