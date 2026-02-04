import React, { useState } from 'react';
import './AdminDashboardSample.css';

/**
 * 관리자 대시보드 샘플 페이지
 * 로그인 없이 접근 가능한 반응형 관리자 대시보드 데모
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-XX
 */
const AdminDashboardSample = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('finance');

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 샘플 데이터
  const sampleData = {
    totalUsers: 2456,
    monthlyReservations: 3420,
    completionRate: 94.2,
    refundCount: 12,
    refundAmount: 840000,
    completedConsultations: 3105,
    avgCompletionTime: 52
  };

  const topConsultants = [
    { name: '김상담', rating: 4.9, color: 'indigo' },
    { name: '이마음', rating: 4.8, color: 'teal' },
    { name: '박치유', rating: 4.7, color: 'orange' },
    { name: '최행복', rating: 4.6, color: 'blue' }
  ];

  const chartData = [
    { month: '5월', tenants: 40, consultants: 30 },
    { month: '6월', tenants: 50, consultants: 45 },
    { month: '7월', tenants: 45, consultants: 40 },
    { month: '8월', tenants: 60, consultants: 55 },
    { month: '9월', tenants: 75, consultants: 65 },
    { month: '10월', tenants: 90, consultants: 82 }
  ];

  return (
    <div className={`admin-dashboard-sample ${isDarkMode ? 'dark' : ''}`}>
      <div className="dashboard-container">
        {/* 사이드바 오버레이 (모바일에서만) */}
        {isSidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={toggleSidebar}
            aria-label="사이드바 닫기"
          />
        )}
        
        {/* 사이드바 */}
        <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-icon">
                <span className="material-symbols-outlined">grid_view</span>
              </div>
              <div className="logo-text">
                <h1>상담 관리 CRM</h1>
                <p>Super Admin</p>
              </div>
            </div>
            <button 
              className="sidebar-close-btn"
              onClick={toggleSidebar}
              aria-label="사이드바 닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="sidebar-nav">
            <a href="#" className="nav-item active">
              <span className="material-symbols-outlined">dashboard</span>
              <span>대시보드</span>
            </a>
            <a href="#" className="nav-item">
              <span className="material-symbols-outlined">apartment</span>
              <span>입주사 관리</span>
            </a>
            <a href="#" className="nav-item">
              <span className="material-symbols-outlined">group</span>
              <span>상담사 관리</span>
            </a>
            <a href="#" className="nav-item">
              <span className="material-symbols-outlined">calendar_month</span>
              <span>예약 현황</span>
            </a>

            <div className="nav-divider"></div>
            <p className="nav-section-label">Finance</p>

            <a href="#" className="nav-item">
              <span className="material-symbols-outlined">payments</span>
              <span>매출 및 정산</span>
            </a>
            <a href="#" className="nav-item">
              <span className="material-symbols-outlined">settings</span>
              <span>시스템 설정</span>
            </a>
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIOtP_g_dqWBS_k_Ehg-Q2R9z62DPt5ueWgUX61VDSsw2RSv2KwAu7fWLXB6wHCFJKULcmBa8aBgmLBITG2eUQx8qDxv8kBNQlnMJ7b398zcgf9xAyFqIrIPacCxoJo32xhZIvMYF9ayKcfcuuOtq0MV3Ao-dqIDX_lSnsMKWvcO5k61O8TL0Bs352QJtO-aT1zOSwqH8mp2u0ucEXtaZeEDkbYDzLUISaixXruK438JBMtjED0cS2GO8Yn1UaL5xLrLPWoaLPpIw" 
                  alt="프로필"
                />
              </div>
              <div className="user-info">
                <p className="user-name">김관리 님</p>
                <p className="user-email">admin@crm.com</p>
              </div>
            </div>
          </div>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="dashboard-main">
          {/* 배경 그라데이션 */}
          <div className="dashboard-bg-gradient"></div>
          <div className="dashboard-bg-blur"></div>

          {/* 헤더 */}
          <header className="dashboard-header">
            <div className="header-left">
              <button 
                className="hamburger-btn"
                onClick={toggleSidebar}
                aria-label="메뉴 열기"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
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
              {/* KPI 카드 그리드 */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-card-bg kpi-card-bg-indigo"></div>
                  <div className="kpi-card-content">
                    <div className="kpi-card-header">
                      <div className="kpi-icon kpi-icon-indigo">
                        <span className="material-symbols-outlined">group</span>
                      </div>
                      <div className="kpi-trend kpi-trend-up">
                        <span className="material-symbols-outlined">trending_up</span>
                        <span>12%</span>
                      </div>
                    </div>
                    <div className="kpi-card-body">
                      <p className="kpi-label">총 사용자 (입주사/상담사)</p>
                      <h3 className="kpi-value">{sampleData.totalUsers.toLocaleString()}</h3>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-bg kpi-card-bg-purple"></div>
                  <div className="kpi-card-content">
                    <div className="kpi-card-header">
                      <div className="kpi-icon kpi-icon-purple">
                        <span className="material-symbols-outlined">event_note</span>
                      </div>
                      <div className="kpi-trend kpi-trend-up">
                        <span className="material-symbols-outlined">trending_up</span>
                        <span>18%</span>
                      </div>
                    </div>
                    <div className="kpi-card-body">
                      <p className="kpi-label">이번 달 예약 건수</p>
                      <h3 className="kpi-value">{sampleData.monthlyReservations.toLocaleString()}</h3>
                    </div>
                  </div>
                </div>

                <div className="kpi-card kpi-card-dark">
                  <div className="kpi-card-bg kpi-card-bg-dark"></div>
                  <div className="kpi-card-content">
                    <div className="kpi-card-header">
                      <div className="kpi-icon kpi-icon-emerald">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                      <div className="kpi-goal">
                        <span>Goal: 95%</span>
                      </div>
                    </div>
                    <div className="kpi-card-body">
                      <p className="kpi-label">상담 완료율</p>
                      <div className="kpi-value-group">
                        <h3 className="kpi-value">{sampleData.completionRate}%</h3>
                        <span className="kpi-change kpi-change-up">+2.4%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 차트 및 사이드바 */}
              <div className="chart-section">
                <div className="chart-card">
                  <div className="chart-header">
                    <div>
                      <h3>시스템 성장 개요</h3>
                      <p>입주사 및 상담사 증가 추이 (최근 6개월)</p>
                    </div>
                    <div className="chart-tabs">
                      <button className="chart-tab active">월간</button>
                      <button className="chart-tab">주간</button>
                    </div>
                  </div>
                  <div className="chart-body">
                    <div className="bar-chart">
                      {chartData.map((data, index) => (
                        <div key={index} className="bar-group">
                          <div className="bar-container">
                            <div 
                              className="bar bar-tenant" 
                              style={{ height: `${data.tenants}%` }}
                            >
                              <div className="bar-tooltip">{data.tenants}</div>
                            </div>
                            <div 
                              className="bar bar-consultant" 
                              style={{ height: `${data.consultants}%` }}
                            >
                              <div className="bar-tooltip">{data.consultants}</div>
                            </div>
                          </div>
                          <span className="bar-label">{data.month}</span>
                        </div>
                      ))}
                    </div>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color legend-color-tenant"></div>
                        <span>입주사 수</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color legend-color-consultant"></div>
                        <span>활성 상담사</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="consultant-card">
                  <h3>우수 상담사 평점</h3>
                  <div className="consultant-list">
                    {topConsultants.map((consultant, index) => (
                      <div key={index} className="consultant-item">
                        <div className={`consultant-avatar consultant-avatar-${consultant.color}`}>
                          {consultant.name.charAt(0)}
                        </div>
                        <div className="consultant-info">
                          <div className="consultant-header">
                            <span className="consultant-name">{consultant.name}</span>
                            <span className="consultant-rating">{consultant.rating}/5.0</span>
                          </div>
                          <div className="consultant-progress">
                            <div 
                              className={`consultant-progress-bar consultant-progress-${consultant.color}`}
                              style={{ width: `${consultant.rating * 20}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="consultant-view-all">전체 순위 보기</button>
                </div>
              </div>

              {/* 재무 및 성과 지표 */}
              <div className="finance-card">
                <div className="finance-tabs">
                  <button 
                    className={`finance-tab ${activeTab === 'finance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('finance')}
                  >
                    <span className="material-symbols-outlined">finance</span>
                    재무 및 성과 지표
                  </button>
                  <button 
                    className={`finance-tab ${activeTab === 'refund' ? 'active' : ''}`}
                    onClick={() => setActiveTab('refund')}
                  >
                    <span className="material-symbols-outlined">currency_exchange</span>
                    환불 현황
                  </button>
                  <button 
                    className={`finance-tab ${activeTab === 'completion' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completion')}
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    상담 완료 통계
                  </button>
                </div>
                <div className="finance-content">
                  <div className="finance-grid">
                    <div className="finance-item">
                      <div className="finance-icon finance-icon-red">
                        <span className="material-symbols-outlined">restart_alt</span>
                      </div>
                      <div>
                        <p>이번 달 환불 건수</p>
                        <h4>{sampleData.refundCount}건</h4>
                      </div>
                    </div>
                    <div className="finance-item">
                      <div className="finance-icon finance-icon-red">
                        <span className="material-symbols-outlined">attach_money</span>
                      </div>
                      <div>
                        <p>총 환불 금액</p>
                        <h4>₩{sampleData.refundAmount.toLocaleString()}</h4>
                      </div>
                    </div>
                    <div className="finance-item">
                      <div className="finance-icon finance-icon-emerald">
                        <span className="material-symbols-outlined">done_all</span>
                      </div>
                      <div>
                        <p>상담 정상 완료</p>
                        <h4>{sampleData.completedConsultations.toLocaleString()}건</h4>
                      </div>
                    </div>
                    <div className="finance-item">
                      <div className="finance-icon finance-icon-emerald">
                        <span className="material-symbols-outlined">schedule</span>
                      </div>
                      <div>
                        <p>평균 상담 완료 시간</p>
                        <h4>{sampleData.avgCompletionTime}분</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 관리자 주요 기능 */}
              <div className="admin-functions">
                <h3>관리자 주요 기능</h3>
                <div className="function-grid">
                  <button className="function-card">
                    <div className="function-icon function-icon-indigo">
                      <span className="material-symbols-outlined">domain_add</span>
                    </div>
                    <span className="function-title">신규 입주사 등록</span>
                    <span className="function-desc">계약 및 계정 생성</span>
                  </button>
                  <button className="function-card">
                    <div className="function-icon function-icon-teal">
                      <span className="material-symbols-outlined">verified_user</span>
                    </div>
                    <span className="function-title">상담사 승인 관리</span>
                    <span className="function-desc">자격 증명 검토</span>
                  </button>
                  <button className="function-card">
                    <div className="function-icon function-icon-orange">
                      <span className="material-symbols-outlined">campaign</span>
                    </div>
                    <span className="function-title">전체 공지 발송</span>
                    <span className="function-desc">앱 푸시 및 메일</span>
                  </button>
                  <button className="function-card">
                    <div className="function-icon function-icon-gray">
                      <span className="material-symbols-outlined">settings_suggest</span>
                    </div>
                    <span className="function-title">시스템 설정</span>
                    <span className="function-desc">API 및 연동 관리</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardSample;
