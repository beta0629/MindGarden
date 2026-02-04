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

              {/* 관리자 대시보드 섹션별 디자인 샘플 */}
              <div className="admin-sections-showcase">
                <h2 className="showcase-title">관리자 대시보드 섹션별 디자인 샘플</h2>
                
                {/* 1. 관리 기능 카드 그리드 - 섹션별 그룹화 */}
                <div className="admin-section-sample">
                  <div className="section-header">
                    <div>
                      <h3 className="section-title">관리 기능</h3>
                      <p className="section-subtitle">주요 관리 기능에 빠르게 접근</p>
                    </div>
                  </div>
                  
                  {/* 운영 관리 (CORE OPS) */}
                  <div className="function-group">
                    <div className="group-label">운영 관리 (CORE OPS)</div>
                    <div className="management-grid">
                      {[
                        { icon: 'schedule', title: '스케줄 관리', desc: '상담사 및 센터의 일정을 통합 관리하고 조정합니다.', gradient: 'blue-green' },
                        { icon: 'group', title: '상담사 관리', desc: '상담사 프로필 및 자격, 배정 내역을 관리합니다.', gradient: 'purple-blue' },
                        { icon: 'receipt', title: '회계 및 정산 관리', desc: '상담 회기 등록 및 월별 정산 내역을 자동으로 처리합니다.', gradient: 'blue-green', badge: 'AUTO' }
                      ].map((item, idx) => (
                        <div key={idx} className="management-card">
                          <div className={`management-icon-bg gradient-${item.gradient}`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                          </div>
                          <div className="management-card-content">
                            <div className="management-card-header">
                              <h4 className="management-title">{item.title}</h4>
                              {item.badge && <span className="management-badge">{item.badge}</span>}
                            </div>
                            <p className="management-desc">{item.desc}</p>
                          </div>
                          <div className="management-arrow">
                            <span className="material-symbols-outlined">arrow_forward</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI & 데이터 */}
                  <div className="function-group">
                    <div className="group-label">AI & 데이터</div>
                    <div className="management-grid">
                      {[
                        { icon: 'psychology', title: '심리검사 리포트 (AI)', desc: 'TCI/MMPI 업로드 및 AI 분석', gradient: 'dark', badge: 'BETA', isDark: true },
                        { icon: 'dashboard', title: '대시보드 설정', desc: '위젯 및 레이아웃 커스텀', gradient: 'purple-blue' }
                      ].map((item, idx) => (
                        <div key={idx} className={`management-card ${item.isDark ? 'card-dark' : ''}`}>
                          <div className={`management-icon-bg gradient-${item.gradient}`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                          </div>
                          <div className="management-card-content">
                            <div className="management-card-header">
                              <h4 className="management-title">{item.title}</h4>
                              {item.badge && <span className="management-badge badge-${item.badge.toLowerCase()}">{item.badge}</span>}
                            </div>
                            <p className="management-desc">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 모니터링 */}
                  <div className="function-group">
                    <div className="group-label">모니터링</div>
                    <div className="management-grid">
                      {[
                        { icon: 'shield', title: '보안 모니터링', desc: '실시간 보안 위협 감지 중', gradient: 'purple-blue', progress: 98 },
                        { icon: 'speed', title: 'API 성능 상태', desc: 'Response Time: 45ms', gradient: 'blue-green', metric: '45ms' },
                        { icon: 'memory', title: '캐시 모니터링', desc: '시스템 리소스 최적화', gradient: 'purple-blue' }
                      ].map((item, idx) => (
                        <div key={idx} className="management-card">
                          <div className={`management-icon-bg gradient-${item.gradient}`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                          </div>
                          <div className="management-card-content">
                            <div className="management-card-header">
                              <h4 className="management-title">{item.title}</h4>
                            </div>
                            {item.progress && (
                              <div className="management-progress">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
                                </div>
                                <span className="progress-value">{item.progress}%</span>
                              </div>
                            )}
                            {item.metric && (
                              <div className="management-metric">
                                <span className="metric-label">Response Time</span>
                                <span className="metric-value">{item.metric}</span>
                              </div>
                            )}
                            <p className="management-desc">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. 시스템 상태 섹션 */}
                <div className="admin-section-sample">
                  <div className="section-header">
                    <div>
                      <h3 className="section-title">시스템 상태</h3>
                      <p className="section-subtitle">서버 및 데이터베이스 상태 모니터링</p>
                    </div>
                    <button className="status-check-btn">
                      <span className="material-symbols-outlined">refresh</span>
                      상태 체크
                    </button>
                  </div>
                  <div className="system-status-grid">
                    {[
                      { label: '서버', status: 'healthy', icon: 'dns' },
                      { label: '데이터베이스', status: 'healthy', icon: 'storage' },
                      { label: '캐시', status: 'warning', icon: 'memory' },
                      { label: 'API', status: 'healthy', icon: 'api' }
                    ].map((item, idx) => (
                      <div key={idx} className="status-item">
                        <div className="status-icon">
                          <span className="material-symbols-outlined">{item.icon}</span>
                          <span className={`status-dot status-${item.status}`}></span>
                        </div>
                        <div className="status-info">
                          <span className="status-label">{item.label}</span>
                          <span className="status-value">
                            {item.status === 'healthy' ? '정상' : item.status === 'warning' ? '경고' : '오류'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. 시스템 도구 섹션 */}
                <div className="admin-section-sample">
                  <div className="section-header">
                    <div>
                      <h3 className="section-title">시스템 도구</h3>
                      <p className="section-subtitle">시스템 관리 및 유지보수 도구</p>
                    </div>
                  </div>
                  <div className="system-tools-grid">
                    {[
                      { icon: 'refresh', label: '캐시 초기화', desc: '시스템 캐시를 초기화합니다' },
                      { icon: 'backup', label: '백업 생성', desc: '시스템 백업을 생성합니다' },
                      { icon: 'description', label: '로그 보기', desc: '시스템 로그를 확인합니다' },
                      { icon: 'update', label: '시스템 업데이트', desc: '시스템을 업데이트합니다' }
                    ].map((item, idx) => (
                      <button key={idx} className="tool-btn">
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <div className="tool-info">
                          <span className="tool-label">{item.label}</span>
                          <span className="tool-desc">{item.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. 통계 테이블 섹션 */}
                <div className="admin-section-sample">
                  <div className="section-header">
                    <div>
                      <h3 className="section-title">상담 통계</h3>
                      <p className="section-subtitle">최근 상담 완료 통계</p>
                    </div>
                  </div>
                  <div className="stats-table">
                    <table>
                      <thead>
                        <tr>
                          <th>날짜</th>
                          <th>완료 건수</th>
                          <th>완료율</th>
                          <th>평균 소요시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { date: '2025-02-04', count: 45, rate: '94.2%', time: '32분' },
                          { date: '2025-02-03', count: 52, rate: '96.3%', time: '28분' },
                          { date: '2025-02-02', count: 38, rate: '92.1%', time: '35분' },
                          { date: '2025-02-01', count: 48, rate: '95.8%', time: '30분' }
                        ].map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.date}</td>
                            <td>{row.count}건</td>
                            <td>
                              <span className="rate-badge">{row.rate}</span>
                            </td>
                            <td>{row.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 상담사 관리 상세 화면 */}
              <div className="admin-section-sample">
                {/* 섹션 헤더 */}
                <div className="section-header">
                  <div>
                    <h3 className="section-title">상담사 관리</h3>
                    <p className="section-subtitle">상담사의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다.</p>
                  </div>
                  <div className="section-controls">
                    <button className="control-btn active">종합관리</button>
                    <button className="control-btn">기본관리</button>
                  </div>
                </div>

                {/* 현황 요약 - KPI 카드 스타일 */}
                <div className="kpi-grid" style={{ marginBottom: '32px' }}>
                  {[
                    { icon: 'groups', label: '총 상담사', value: '2', change: '+0', changeType: 'neutral', color: 'indigo' },
                    { icon: 'link', label: '활성 매칭', value: '0', change: '+0', changeType: 'neutral', color: 'emerald' },
                    { icon: 'event', label: '총 스케줄', value: '0', change: '+0', changeType: 'neutral', color: 'purple' },
                    { icon: 'list_alt', label: '오늘 스케줄', value: '0', change: '+0', changeType: 'neutral', color: 'blue' }
                  ].map((item, idx) => (
                    <div key={idx} className="kpi-card">
                      <div className={`kpi-card-bg kpi-card-bg-${item.color}`}></div>
                      <div className="kpi-card-content">
                        <div className="kpi-card-header">
                          <div className={`kpi-icon kpi-icon-${item.color}`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                          </div>
                          <div className={`kpi-trend kpi-trend-${item.changeType}`}>
                            <span className="material-symbols-outlined">trending_up</span>
                            <span>{item.change}</span>
                          </div>
                        </div>
                        <div className="kpi-card-body">
                          <p className="kpi-label">{item.label}</p>
                          <h3 className="kpi-value">{item.value}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 검색 및 필터 */}
                <div className="counselor-search-section">
                  <div className="counselor-search-wrapper">
                    <span className="material-symbols-outlined counselor-search-icon">search</span>
                    <input 
                      type="text" 
                      className="counselor-search-input"
                      placeholder="이름, 이메일, 전화번호 또는 #태그로 검색..."
                    />
                  </div>
                  <button className="counselor-filter-btn">
                    <span className="material-symbols-outlined">filter_list</span>
                    필터
                  </button>
                </div>

                {/* 상담사 목록 - Management Card 스타일 */}
                <div className="management-grid" style={{ marginTop: '24px' }}>
                  {[
                    { 
                      name: 'test11', email: 'test11@gamil.com', phone: '010-0000-0000', 
                      joinDate: '2025. 12. 11.', status: 'available', statusColor: 'emerald',
                      avatarText: 't', badge: '전문 상담사', badgeColor: 'indigo',
                      clients: 0, maxClients: 20, clientColor: 'indigo', gradient: 'blue-green'
                    },
                    { 
                      name: '테스트 상담사', email: '222@gmail.com', phone: '010-0000-0000', 
                      joinDate: '2025. 12. 11.', status: 'offline', statusColor: 'slate',
                      avatarText: '테', badge: null, badgeColor: null,
                      clients: 0, maxClients: 20, clientColor: 'slate', gradient: 'purple-blue'
                    },
                    { 
                      name: '김상담', email: 'kim.counsel@example.com', phone: '010-1234-5678', 
                      joinDate: '2024. 11. 05.', status: 'busy', statusColor: 'orange',
                      avatarText: 'K', badge: null, badgeColor: null,
                      clients: 12, maxClients: 20, clientColor: 'orange', gradient: 'blue-green'
                    }
                  ].map((counselor, idx) => (
                    <div key={idx} className="management-card">
                      <div className={`management-icon-bg gradient-${counselor.gradient}`}>
                        <div className="counselor-avatar-small">
                          {counselor.avatarText}
                        </div>
                        <div className={`counselor-status-dot-small counselor-status-${counselor.statusColor}`}></div>
                      </div>
                      <div className="management-card-content">
                        <div className="management-card-header">
                          <h4 className="management-title">
                            {counselor.name}
                            {counselor.badge && (
                              <span className="management-badge">{counselor.badge}</span>
                            )}
                          </h4>
                        </div>
                        <div className="counselor-card-info-compact">
                          <div className="counselor-info-row">
                            <span className="material-symbols-outlined">email</span>
                            <span>{counselor.email}</span>
                          </div>
                          <div className="counselor-info-row">
                            <span className="material-symbols-outlined">phone</span>
                            <span>{counselor.phone}</span>
                          </div>
                          <div className="counselor-info-row">
                            <span className="material-symbols-outlined">calendar_today</span>
                            <span>가입일: {counselor.joinDate}</span>
                          </div>
                        </div>
                        {counselor.clients > 0 && (
                          <div className="management-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${(counselor.clients / counselor.maxClients) * 100}%` }}
                              ></div>
                            </div>
                            <span className="progress-value">
                              담당 클라이언트: {counselor.clients}/{counselor.maxClients}명
                            </span>
                          </div>
                        )}
                        <div className="counselor-card-actions-compact">
                          <button className="counselor-action-btn-small">수정</button>
                          <button className="counselor-action-btn-small">비밀번호 초기화</button>
                          <button className="counselor-delete-btn-small" title="삭제">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="management-arrow">
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </div>
                    </div>
                  ))}
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
