import React from 'react';
import { LayoutDashboard, Users, Calendar, TrendingUp, Bell, Settings } from 'lucide-react';

const DashboardLayoutShowcase = () => {
  const stats = [
    { icon: <Users size={20} />, value: '2,543', label: '총 사용자', change: '+12.5%', positive: true },
    { icon: <Calendar size={20} />, value: '1,234', label: '예약된 상담', change: '+8.2%', positive: true },
    { icon: <TrendingUp size={20} />, value: '987', label: '완료된 상담', change: '+15.3%', positive: true }
  ];

  const recentActivities = [
    { user: '김민지', action: '새 상담 예약', time: '5분 전' },
    { user: '이서연', action: '상담 완료', time: '10분 전' },
    { user: '박지훈', action: '프로필 업데이트', time: '15분 전' },
    { user: '최유진', action: '새 메시지', time: '20분 전' }
  ];

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">통일된 대시보드 레이아웃</h2>
      
      <div className="mg-card mg-mb-lg">
        <h3 className="mg-h4 mg-mb-md">레이아웃 구조</h3>
        <p className="mg-body-medium" style={{ color: 'var(--medium-gray)', marginBottom: 'var(--spacing-md)' }}>
          모든 대시보드 페이지에서 사용할 수 있는 통일된 레이아웃 구조입니다.
        </p>
      </div>

      {/* Dashboard Layout Example */}
      <div className="mg-dashboard-layout">
        {/* Dashboard Header */}
        <div className="mg-dashboard-header">
          <div className="mg-dashboard-header-content">
            <div className="mg-dashboard-header-left">
              <LayoutDashboard size={28} style={{ color: 'var(--olive-green)' }} />
              <div>
                <h1 className="mg-dashboard-title">대시보드</h1>
                <p className="mg-dashboard-subtitle">전체 현황을 한눈에 확인하세요</p>
              </div>
            </div>
            <div className="mg-dashboard-header-right">
              <button className="mg-dashboard-icon-btn">
                <Bell size={20} />
              </button>
              <button className="mg-dashboard-icon-btn">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats Grid */}
        <div className="mg-dashboard-stats">
          {stats.map((stat, index) => (
            <div key={index} className="mg-dashboard-stat-card">
              <div className="mg-dashboard-stat-icon">
                {stat.icon}
              </div>
              <div className="mg-dashboard-stat-content">
                <div className="mg-dashboard-stat-value">{stat.value}</div>
                <div className="mg-dashboard-stat-label">{stat.label}</div>
                <div className={`mg-dashboard-stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Content Grid */}
        <div className="mg-dashboard-content">
          {/* Main Content Area */}
          <div className="mg-dashboard-main">
            <div className="mg-dashboard-section">
              <div className="mg-dashboard-section-header">
                <h3 className="mg-dashboard-section-title">최근 활동</h3>
                <a href="#" className="mg-dashboard-section-link">모두 보기</a>
              </div>
              <div className="mg-dashboard-section-content">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="mg-dashboard-activity-item">
                    <div className="mg-dashboard-activity-avatar">
                      {activity.user.charAt(0)}
                    </div>
                    <div className="mg-dashboard-activity-content">
                      <div className="mg-dashboard-activity-text">
                        <strong>{activity.user}</strong>님이 <span>{activity.action}</span>
                      </div>
                      <div className="mg-dashboard-activity-time">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mg-dashboard-section">
              <div className="mg-dashboard-section-header">
                <h3 className="mg-dashboard-section-title">주간 트렌드</h3>
              </div>
              <div className="mg-dashboard-section-content">
                <div style={{ 
                  height: '200px', 
                  background: 'var(--light-beige)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--medium-gray)'
                }}>
                  차트 영역
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="mg-dashboard-sidebar">
            <div className="mg-dashboard-section">
              <div className="mg-dashboard-section-header">
                <h3 className="mg-dashboard-section-title">빠른 작업</h3>
              </div>
              <div className="mg-dashboard-section-content">
                <button className="mg-button mg-button-primary" style={{ width: '100%', marginBottom: 'var(--spacing-sm)' }}>
                  새 상담 예약
                </button>
                <button className="mg-button mg-button-outline" style={{ width: '100%', marginBottom: 'var(--spacing-sm)' }}>
                  클라이언트 추가
                </button>
                <button className="mg-button mg-button-outline" style={{ width: '100%' }}>
                  보고서 생성
                </button>
              </div>
            </div>

            <div className="mg-dashboard-section">
              <div className="mg-dashboard-section-header">
                <h3 className="mg-dashboard-section-title">알림</h3>
              </div>
              <div className="mg-dashboard-section-content">
                <div className="mg-dashboard-notification">
                  <div className="mg-dashboard-notification-dot"></div>
                  <div className="mg-dashboard-notification-text">새로운 메시지 3개</div>
                </div>
                <div className="mg-dashboard-notification">
                  <div className="mg-dashboard-notification-dot"></div>
                  <div className="mg-dashboard-notification-text">오늘 상담 2건</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Description */}
      <div className="mg-card mg-mt-xl">
        <h3 className="mg-h4 mg-mb-md">레이아웃 구성 요소</h3>
        <ul style={{ color: 'var(--medium-gray)', lineHeight: 1.8, paddingLeft: 'var(--spacing-lg)' }}>
          <li><strong>대시보드 헤더</strong>: 페이지 제목, 아이콘, 액션 버튼</li>
          <li><strong>통계 카드 그리드</strong>: 3-4개의 주요 지표 카드 (모바일에서 1열로 자동 전환)</li>
          <li><strong>메인 콘텐츠 영역</strong>: 주요 데이터 및 차트 표시</li>
          <li><strong>사이드바 영역</strong>: 빠른 작업 및 알림 (모바일에서 메인 콘텐츠 아래로 이동)</li>
          <li><strong>섹션 헤더</strong>: 일관된 제목 및 액션 링크 스타일</li>
        </ul>
      </div>
    </section>
  );
};

export default DashboardLayoutShowcase;

