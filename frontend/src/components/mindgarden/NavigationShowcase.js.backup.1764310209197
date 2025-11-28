import React, { useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { Menu, X, Home, Users, Calendar, Settings, ChevronRight } from 'lucide-react';

const NavigationShowcase = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = ['대시보드', '상담 내역', '통계', '설정'];

  return (
    <section className="mg-v2-section">
      <h2 className="mg-h2 mg-v2-text-center mg-mb-lg">네비게이션</h2>
      
      <div className="mg-v2-grid-layout" style={{ gap: 'var(--spacing-xl)' }}>
        {/* Header Navigation */}
        <div>
          <h4 className="mg-h4 mg-mb-md">헤더 네비게이션</h4>
          <div className="mg-card mg-card-no-padding">
            <div className="mg-header-nav">
              <div className="mg-header-brand">
                <div className="mg-header-logo">MindGarden</div>
              </div>
              <nav className="mg-header-menu">
                <a href="#" className="mg-header-link">홈</a>
                <a href="#" className="mg-header-link">상담</a>
                <a href="#" className="mg-header-link">정보</a>
                <a href="#" className="mg-header-link">문의</a>
              </nav>
              <div className="mg-header-avatar">
                김
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div>
          <h4 className="mg-h4 mg-mb-md">사이드바 네비게이션</h4>
          <div className="mg-card mg-card-no-padding mg-v2-relative" style={{ minHeight: '400px' }}>
            {/* Mobile Menu Button */}
            <button 
              className="mg-button mg-button-outline mg-v2-absolute mg-v2-top-md mg-v2-left-md" style={{ zIndex: 20 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '250px',
              height: '100%',
              background: 'var(--light-beige)',
              transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-lg)',
              paddingTop: '60px',
              zIndex: 15,
              boxShadow: isSidebarOpen ? '2px 0 8px rgba(0, 0, 0, 0.1)' : 'none'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                background: 'white',
                cursor: 'pointer'
              }}>
                <Home size={20} style={{ color: 'var(--olive-green)' }} />
                <span style={{ fontWeight: 500 }}>대시보드</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}>
                <Users size={20} style={{ color: 'var(--medium-gray)' }} />
                <span>클라이언트</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}>
                <Calendar size={20} style={{ color: 'var(--medium-gray)' }} />
                <span>일정</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}>
                <Settings size={20} style={{ color: 'var(--medium-gray)' }} />
                <span>설정</span>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{
              marginLeft: isSidebarOpen ? '250px' : '0',
              transition: 'margin-left 0.3s ease',
              padding: 'var(--spacing-xl)',
              background: 'white',
              minHeight: '400px',
              position: 'relative',
              zIndex: 5
            }}>
              <p style={{ color: 'var(--medium-gray)' }}>
                왼쪽 상단의 메뉴 버튼을 클릭하여 사이드바를 열고 닫을 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div>
          <h4 className="mg-h4 mg-mb-md">브레드크럼</h4>
          <div className="mg-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
              <a href="#" style={{ color: 'var(--olive-green)', textDecoration: 'none', fontSize: '0.875rem' }}>홈</a>
              <ChevronRight size={16} style={{ color: 'var(--medium-gray)' }} />
              <a href="#" style={{ color: 'var(--olive-green)', textDecoration: 'none', fontSize: '0.875rem' }}>상담</a>
              <ChevronRight size={16} style={{ color: 'var(--medium-gray)' }} />
              <span style={{ color: 'var(--medium-gray)', fontSize: '0.875rem' }}>상세보기</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <h4 className="mg-h4 mg-mb-md">탭 네비게이션</h4>
          <div className="mg-card">
            <div style={{
              display: 'flex',
              borderBottom: '2px solid var(--light-beige)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-md)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === index ? '2px solid var(--olive-green)' : '2px solid transparent',
                    color: activeTab === index ? 'var(--olive-green)' : 'var(--medium-gray)',
                    fontWeight: activeTab === index ? 600 : 400,
                    cursor: 'pointer',
                    marginBottom: '-2px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ padding: 'var(--spacing-md)' }}>
              <p style={{ color: 'var(--medium-gray)' }}>
                {tabs[activeTab]} 탭의 내용이 여기에 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NavigationShowcase;

