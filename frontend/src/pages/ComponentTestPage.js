/**
 * 컴포넌트 테스트 페이지
 * Phase 3.1 테스트용 - 로그인 없이 접근 가능
 */

import React from 'react';
import { FaUserTie, FaUsers, FaLink, FaCalendarAlt, FaChartBar, FaCog } from 'react-icons/fa';
import StatCard from '../components/common/StatCard';
import DashboardSection from '../components/layout/DashboardSection';
import DashboardGrid from '../components/layout/DashboardGrid';
import './ComponentTestPage.css';

const ComponentTestPage = () => {
  return (
    <div className="component-test-page">
      <div className="test-container">
        <h1>컴포넌트 테스트 페이지</h1>
        <p>Phase 3: 공통 레이아웃 컴포넌트 테스트</p>
        
        {/* DashboardSection 테스트 */}
        <DashboardSection
          title="StatCard 컴포넌트"
          icon={<FaChartBar />}
          actions={
            <button className="test-action-btn">
              <FaCog /> 설정
            </button>
          }
        >
          <DashboardGrid cols="auto" gap="lg">
            <StatCard
              icon={<FaUserTie />}
              title="상담사"
              value="24명"
              description="현재 활성화된 상담사"
              variant="consultants"
            />
            
            <StatCard
              icon={<FaUsers />}
              title="내담자"
              value="156명"
              description="현재 활성화된 내담자"
              variant="clients"
            />
            
            <StatCard
              icon={<FaLink />}
              title="매핑"
              value="89개"
              description="생성된 매핑"
              variant="mappings"
            />
            
            <StatCard
              icon={<FaCalendarAlt />}
              title="활성 매칭"
              value="67개"
              description="활성 상태"
              variant="active"
              onClick={() => alert('클릭됨!')}
            />
          </DashboardGrid>
        </DashboardSection>
        
        {/* 접기/펼치기 테스트 */}
        <DashboardSection
          title="접기/펼치기 테스트"
          icon={<FaCog />}
          collapsible={true}
        >
          <p>이 섹션은 접기/펼치기가 가능합니다.</p>
        </DashboardSection>
        
        <section className="test-section">
          <h2>CSS 변수 테스트</h2>
          
          <div className="color-test-grid">
            <div className="color-test-item">
              <div className="color-box" style={{ background: 'var(--status-requested)' }}></div>
              <span>상담 요청</span>
            </div>
            <div className="color-test-item">
              <div className="color-box" style={{ background: 'var(--status-in-progress)' }}></div>
              <span>진행중</span>
            </div>
            <div className="color-test-item">
              <div className="color-box" style={{ background: 'var(--status-completed)' }}></div>
              <span>완료</span>
            </div>
            <div className="color-test-item">
              <div className="color-box" style={{ background: 'var(--grade-junior)' }}></div>
              <span>주니어</span>
            </div>
            <div className="color-test-item">
              <div className="color-box" style={{ background: 'var(--grade-expert)' }}></div>
              <span>전문가</span>
            </div>
            <div className="color-test-item">
              <div className="color-box" style={{ background: 'var(--role-consultant)' }}></div>
              <span>상담사</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ComponentTestPage;

