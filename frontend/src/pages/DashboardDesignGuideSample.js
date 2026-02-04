import React, { useState, useEffect } from 'react';
import './DashboardDesignGuideSample.css';

/**
 * 디자인 가이드 기반 대시보드 샘플 페이지
 * 
 * 디자인 가이드(DASHBOARD_DESIGN_GUIDE.md)에 정의된 스펙을 정확히 구현한 샘플
 * 실제 대시보드에 적용하기 전 레이아웃 및 디자인 확인용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-02-04
 * @reference docs/standards/DASHBOARD_DESIGN_GUIDE.md
 */
const DashboardDesignGuideSample = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 767;
    }
    return false;
  });

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 샘플 데이터
  const kpiData = [
    {
      id: 1,
      label: '총 사용자',
      value: '2,456',
      change: '+12%',
      changeType: 'up',
      icon: 'group',
      color: 'indigo'
    },
    {
      id: 2,
      label: '이번 달 예약 건수',
      value: '3,420',
      change: '+18%',
      changeType: 'up',
      icon: 'event_note',
      color: 'purple'
    },
    {
      id: 3,
      label: '상담 완료율',
      value: '94.2%',
      change: '+2.4%',
      changeType: 'up',
      icon: 'check_circle',
      color: 'emerald',
      isDark: true
    }
  ];

  return (
    <div className={`dashboard-design-guide-sample ${isDarkMode ? 'dark' : ''}`}>
      <div className="dashboard-container">
        {/* 사이드바 오버레이 (모바일에서만) */}
        {isMobile && isSidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={toggleSidebar}
            aria-label="사이드바 닫기"
          />
        )}
        
        {/* 사이드바 - 디자인 가이드 스펙 준수 */}
        <aside 
          className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}
        >
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-icon">
                <span className="material-symbols-outlined">grid_view</span>
              </div>
              <div>
                <h1 className="logo-title">상담 관리 CRM</h1>
                <p className="logo-subtitle">Super Admin</p>
              </div>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <a className="nav-item active">
              <span className="material-symbols-outlined">dashboard</span>
              <span>대시보드</span>
            </a>
            <a className="nav-item">
              <span className="material-symbols-outlined">apartment</span>
              <span>입주사 관리</span>
            </a>
            <a className="nav-item">
              <span className="material-symbols-outlined">group</span>
              <span>상담사 관리</span>
            </a>
            <a className="nav-item">
              <span className="material-symbols-outlined">calendar_month</span>
              <span>예약 현황</span>
            </a>
            
            <div className="nav-divider"></div>
            
            <div className="nav-section-label">Finance</div>
            <a className="nav-item">
              <span className="material-symbols-outlined">payments</span>
              <span>매출 및 정산</span>
            </a>
            <a className="nav-item">
              <span className="material-symbols-outlined">settings</span>
              <span>시스템 설정</span>
            </a>
          </nav>
          
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                <img src="https://via.placeholder.com/40" alt="프로필" />
              </div>
              <div className="user-info">
                <p className="user-name">김관리 님</p>
                <p className="user-email">admin@crm.com</p>
              </div>
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 - 디자인 가이드 스펙 준수 */}
        <main className="dashboard-main">
          {/* 배경 그라데이션 및 블러 효과 */}
          <div className="dashboard-bg-gradient"></div>
          <div className="dashboard-bg-blur"></div>
          
          {/* 헤더 - 디자인 가이드 스펙 준수 */}
          <header className="dashboard-header">
            <div className="header-left">
              {isMobile && (
                <button 
                  className="hamburger-btn"
                  onClick={toggleSidebar}
                  aria-label="메뉴 열기"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
              )}
              <div className="header-title">
                <h2>대시보드 개요</h2>
                <p>오늘의 주요 지표와 현황을 한눈에 확인하세요.</p>
              </div>
            </div>
            <div className="header-right">
              <div className="search-box">
                <span className="material-symbols-outlined">search</span>
                <input type="text" placeholder="통합 검색..." />
              </div>
              <button className="notification-btn">
                <span className="material-symbols-outlined">notifications</span>
                <span className="notification-badge"></span>
              </button>
              <button 
                className="theme-toggle-btn"
                onClick={toggleDarkMode}
                aria-label="다크 모드 토글"
              >
                <span className="material-symbols-outlined">
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>
          </header>

          {/* 컨텐츠 영역 */}
          <div className="dashboard-content">
            <div className="content-wrapper">
              {/* KPI 카드 그리드 - 디자인 가이드 스펙 준수 */}
              <div className="kpi-grid">
                {kpiData.map((kpi) => (
                  <div 
                    key={kpi.id} 
                    className={`kpi-card ${kpi.isDark ? 'kpi-card-dark' : ''}`}
                  >
                    <div className={`kpi-card-bg kpi-card-bg-${kpi.color}`}></div>
                    <div className="kpi-card-content">
                      <div className="kpi-card-header">
                        <div className={`kpi-icon kpi-icon-${kpi.color}`}>
                          <span className="material-symbols-outlined">{kpi.icon}</span>
                        </div>
                        <div className={`kpi-trend kpi-trend-${kpi.changeType}`}>
                          <span className="material-symbols-outlined">trending_up</span>
                          <span>{kpi.change}</span>
                        </div>
                      </div>
                      <div className="kpi-card-body">
                        <p className="kpi-label">{kpi.label}</p>
                        <h3 className="kpi-value">{kpi.value}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 세로 배치 컴포넌트 샘플 - 2열 그리드 */}
              <div className="vertical-layout-grid">
                {/* 왼쪽: 차트/그래프 섹션 */}
                <div className="vertical-section chart-section">
                  <div className="section-header">
                    <div>
                      <h3 className="section-title">시스템 성장 개요</h3>
                      <p className="section-subtitle">입주사 및 상담사 증가 추이 (최근 6개월)</p>
                    </div>
                    <div className="section-controls">
                      <button className="control-btn active">월간</button>
                      <button className="control-btn">주간</button>
                    </div>
                  </div>
                  <div className="chart-placeholder">
                    <div className="chart-content">
                      <div className="chart-legend">
                        <div className="legend-item">
                          <span className="legend-dot legend-dot-blue"></span>
                          <span>입주사 수</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-dot legend-dot-indigo"></span>
                          <span>활성 상담사</span>
                        </div>
                      </div>
                      <div className="chart-area">
                        <div className="chart-line"></div>
                        <div className="chart-labels">
                          <span>5월</span>
                          <span>6월</span>
                          <span>7월</span>
                          <span>8월</span>
                          <span>9월</span>
                          <span>10월</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 리스트 섹션 */}
                <div className="vertical-section list-section">
                  <div className="section-header">
                    <div>
                      <h3 className="section-title">우수 상담사 평점</h3>
                    </div>
                  </div>
                  <div className="list-content">
                    {[
                      { name: '김상담', rating: 4.9, color: 'blue', initial: '김' },
                      { name: '이마음', rating: 4.8, color: 'green', initial: '이' },
                      { name: '박치유', rating: 4.7, color: 'orange', initial: '박' },
                      { name: '최행복', rating: 4.6, color: 'indigo', initial: '최' }
                    ].map((consultant, idx) => (
                      <div key={idx} className="list-item">
                        <div className="list-item-avatar" style={{ backgroundColor: `var(--dashboard-primary-${consultant.color})` }}>
                          {consultant.initial}
                        </div>
                        <div className="list-item-content">
                          <div className="list-item-name">{consultant.name}</div>
                          <div className="list-item-rating">
                            <span className="rating-value">{consultant.rating}/5.0</span>
                            <div className="rating-bar">
                              <div 
                                className="rating-bar-fill" 
                                style={{ 
                                  width: `${(consultant.rating / 5) * 100}%`,
                                  backgroundColor: `var(--dashboard-primary-${consultant.color})`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="section-footer">
                    <button className="view-all-btn">전체 순위 보기</button>
                  </div>
                </div>
              </div>

              {/* 추가 콘텐츠 예시 */}
              <div className="content-section">
                <h3 className="section-title">디자인 가이드 스펙 준수</h3>
                <p className="section-description">
                  이 샘플 페이지는 디자인 가이드(DASHBOARD_DESIGN_GUIDE.md)에 정의된 
                  모든 스펙을 정확히 구현한 것입니다. 실제 대시보드에 적용하기 전 
                  레이아웃 및 디자인을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardDesignGuideSample;
