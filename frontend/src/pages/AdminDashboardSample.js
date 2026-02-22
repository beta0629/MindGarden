import React, { useState } from 'react';
import { Users, Calendar, Check, Search, Bell, Moon, Activity, Building, ShieldCheck, Megaphone, Settings } from 'lucide-react';
import './AdminDashboardSample.css';

/**
 * 관리자 대시보드 샘플 페이지
 * B0KlA (Sample Dashboard - Counseling Center) 디자인 시스템 반영
 * 로그인 없이 접근 가능한 반응형 데모
 *
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-02
 */
const AdminDashboardSample = () => {
  const [chartPeriod, setChartPeriod] = useState('monthly');

  const sampleData = {
    totalUsers: 2456,
    totalUsersTrend: '12% ↑',
    monthlyReservations: 3420,
    monthlyReservationsTrend: '18% ↑',
    completionRate: '94.2%',
    completionRateTrend: '+2.4%'
  };

  const topConsultants = [
    { name: '김상담', initial: '김', rating: 4.9, barColor: '#e8a87c', barWidth: 98 },
    { name: '이마음', initial: '이', rating: 4.8, barColor: '#4b745c', barWidth: 96 }
  ];

  const adminFeatures = [
    { icon: Building, label: '신규 입주사 등록', desc: '계약 및 계정 생성', color: '#4b745c', bgColor: '#ebf2ee' },
    { icon: ShieldCheck, label: '상담사 승인 관리', desc: '자격 증명 검토', color: '#e8a87c', bgColor: '#fcf3ed' },
    { icon: Megaphone, label: '전체 공지 발송', desc: '앱 푸시 및 메일', color: '#6d9dc5', bgColor: '#f0f5f9' },
    { icon: Settings, label: '시스템 설정', desc: 'API 및 연동 관리', color: '#4a5568', bgColor: '#edf2f7' }
  ];

  return (
    <div className="ads-b0kla">
      <div className="ads-container">
        {/* Header Row */}
        <header className="ads-header">
          <div className="ads-header-left">
            <h1 className="ads-title">대시보드 개요</h1>
            <p className="ads-subtitle">오늘의 주요 지표와 현황을 한눈에 확인하세요.</p>
          </div>
          <div className="ads-header-right">
            <div className="ads-search">
              <Search size={18} className="ads-search-icon" />
              <span className="ads-search-placeholder">통합 검색...</span>
            </div>
            <div className="ads-icon-group">
              <button type="button" className="ads-icon-btn" aria-label="캘린더">
                <Calendar size={20} />
              </button>
              <button type="button" className="ads-icon-btn" aria-label="알림">
                <Bell size={20} />
              </button>
              <button type="button" className="ads-icon-btn" aria-label="테마">
                <Moon size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* KPI Row */}
        <div className="ads-kpi-row">
          <div className="ads-kpi-card">
            <div className="ads-kpi-icon ads-kpi-icon-green">
              <Users size={28} />
            </div>
            <div className="ads-kpi-info">
              <div className="ads-kpi-top">
                <span className="ads-kpi-label">총 사용자</span>
                <span className="ads-kpi-badge ads-kpi-badge-green">{sampleData.totalUsersTrend}</span>
              </div>
              <span className="ads-kpi-value">{sampleData.totalUsers.toLocaleString()}</span>
            </div>
          </div>
          <div className="ads-kpi-card">
            <div className="ads-kpi-icon ads-kpi-icon-orange">
              <Calendar size={28} />
            </div>
            <div className="ads-kpi-info">
              <div className="ads-kpi-top">
                <span className="ads-kpi-label">이번 달 예약</span>
                <span className="ads-kpi-badge ads-kpi-badge-orange">{sampleData.monthlyReservationsTrend}</span>
              </div>
              <span className="ads-kpi-value">{sampleData.monthlyReservations.toLocaleString()}</span>
            </div>
          </div>
          <div className="ads-kpi-card">
            <div className="ads-kpi-icon ads-kpi-icon-blue">
              <Check size={28} />
            </div>
            <div className="ads-kpi-info">
              <div className="ads-kpi-top">
                <span className="ads-kpi-label">상담 완료율</span>
                <span className="ads-kpi-badge ads-kpi-badge-blue">{sampleData.completionRateTrend}</span>
              </div>
              <span className="ads-kpi-value">{sampleData.completionRate}</span>
            </div>
          </div>
        </div>

        {/* Chart + Counselor Row */}
        <div className="ads-growth-row">
          <div className="ads-chart-card">
            <div className="ads-chart-header">
              <div className="ads-chart-title-row">
                <h3 className="ads-chart-title">상담 현황 추이</h3>
                <p className="ads-chart-desc">최근 6개월 간의 예약 및 완료 추이</p>
              </div>
              <div className="ads-pill-toggle">
                <button
                  type="button"
                  className={`ads-pill ${chartPeriod === 'monthly' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('monthly')}
                >
                  월간
                </button>
                <button
                  type="button"
                  className={`ads-pill ${chartPeriod === 'weekly' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('weekly')}
                >
                  주간
                </button>
              </div>
            </div>
            <div className="ads-chart-placeholder">
              <Activity size={48} className="ads-chart-placeholder-icon" />
              <span>차트 영역</span>
            </div>
          </div>
          <div className="ads-counselor-card">
            <h3 className="ads-counselor-title">우수 상담사 평점</h3>
            <div className="ads-counselor-list">
              {topConsultants.map((c, i) => (
                <div key={i} className="ads-counselor-item">
                  <div
                    className="ads-counselor-avatar"
                    style={{ backgroundColor: c.barColor === '#e8a87c' ? '#fcf3ed' : '#ebf2ee', color: c.barColor }}
                  >
                    {c.initial}
                  </div>
                  <div className="ads-counselor-data">
                    <span className="ads-counselor-name">{c.name}</span>
                    <div className="ads-counselor-rating-row">
                      <span className="ads-counselor-rating">{c.rating}</span>
                      <div className="ads-counselor-bar-track">
                        <div
                          className="ads-counselor-bar-fill"
                          style={{ width: c.barWidth, backgroundColor: c.barColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Grid */}
        <div className="ads-admin-grid">
          <h3 className="ads-admin-title">관리자 주요 기능</h3>
          <div className="ads-admin-row">
            {adminFeatures.map((f, i) => (
              <button key={i} type="button" className="ads-admin-card">
                <div className="ads-admin-icon" style={{ backgroundColor: f.bgColor, color: f.color }}>
                  <f.icon size={28} />
                </div>
                <span className="ads-admin-label">{f.label}</span>
                <span className="ads-admin-desc">{f.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSample;
