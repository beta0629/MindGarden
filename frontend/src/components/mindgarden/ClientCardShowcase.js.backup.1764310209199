import React, { useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { User, MessageCircle, Calendar, TrendingUp, Phone, Mail, Clock, CheckCircle } from 'lucide-react';

const ClientCardShowcase = () => {
  const [viewMode, setViewMode] = useState('detailed'); // 'compact', 'detailed', 'mobile', 'mobile-simple'

  const clients = [
    {
      id: 1,
      name: '김민지',
      status: '진행중',
      lastConsultation: '2025-10-10',
      progress: 75,
      sessions: 8,
      email: 'kim.minji@email.com',
      phone: '010-1234-5678',
      nextAppointment: '2025-10-15 14:00'
    },
    {
      id: 2,
      name: '이서연',
      status: '예약됨',
      lastConsultation: '2025-10-12',
      progress: 45,
      sessions: 5,
      email: 'lee.seoyeon@email.com',
      phone: '010-2345-6789',
      nextAppointment: '2025-10-16 10:30'
    },
    {
      id: 3,
      name: '박지훈',
      status: '완료',
      lastConsultation: '2025-10-08',
      progress: 100,
      sessions: 12,
      email: 'park.jihun@email.com',
      phone: '010-3456-7890',
      nextAppointment: null
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case '진행중': return '#10b981';
      case '예약됨': return '#3b82f6';
      case '완료': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case '진행중': return <TrendingUp size={12} />;
      case '예약됨': return <Calendar size={12} />;
      case '완료': return <CheckCircle size={12} />;
      default: return <User size={12} />;
    }
  };

  // 컴팩트 카드 (목록용)
  const renderCompactCard = (client) => (
    <div key={client.id} className="mg-client-card mg-client-card--compact">
      <div className="mg-client-card__avatar">
        {client.name.charAt(0)}
      </div>
      <div className="mg-client-card__info">
        <div className="mg-client-card__header">
          <h4 className="mg-client-card__name">{client.name}</h4>
          <div className="mg-client-card__status" style={{ backgroundColor: getStatusColor(client.status) }}>
            {getStatusIcon(client.status)}
            <span>{client.status}</span>
          </div>
        </div>
        <div className="mg-client-card__meta">
          <span className="mg-client-card__sessions">{client.sessions}회 진행</span>
          <span className="mg-client-card__progress">{client.progress}%</span>
        </div>
      </div>
    </div>
  );

  // 상세 카드 (메인 카드)
  const renderDetailedCard = (client) => (
    <div key={client.id} className="mg-client-card mg-client-card--detailed">
      <div className="mg-client-card__status-badge" style={{ backgroundColor: getStatusColor(client.status) }}>
        {getStatusIcon(client.status)}
        <span>{client.status}</span>
      </div>
      
      <div className="mg-client-card__avatar mg-client-card__avatar--large">
        {client.name.charAt(0)}
      </div>
      
      <div className="mg-client-card__info">
        <h4 className="mg-client-card__name mg-client-card__name--large">{client.name}</h4>
        
        <div className="mg-client-card__details">
          <div className="mg-client-card__detail-item">
            <Calendar size={16} />
            <span>최근 상담: {client.lastConsultation}</span>
          </div>
          
          <div className="mg-client-card__detail-item">
            <TrendingUp size={16} />
            <span>총 {client.sessions}회 진행</span>
          </div>
          
          {client.nextAppointment && (
            <div className="mg-client-card__detail-item">
              <Clock size={16} />
              <span>다음 상담: {client.nextAppointment}</span>
            </div>
          )}
        </div>
        
        <div className="mg-client-card__progress-section">
          <div className="mg-client-card__progress-header">
            <span>진행률</span>
            <span className="mg-client-card__progress-value">{client.progress}%</span>
          </div>
          <div className="mg-progress-bar">
            <div className="mg-progress-fill" style={{ width: `${client.progress}%` }}></div>
          </div>
        </div>
        
        <div className="mg-client-card__actions">
          <button className="mg-button mg-button-primary mg-button-sm">
            상세보기
          </button>
          <button className="mg-button mg-button-outline mg-button-sm">
            <MessageCircle size={16} />
          </button>
          <button className="mg-button mg-button-ghost mg-button-sm">
            <Phone size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // 모바일 카드 (세로 레이아웃)
  const renderMobileCard = (client) => (
    <div key={client.id} className="mg-client-card mg-client-card--mobile">
      <div className="mg-client-card__header-mobile">
        <div className="mg-client-card__avatar mg-client-card__avatar--mobile">
          {client.name.charAt(0)}
        </div>
        <div className="mg-client-card__status" style={{ backgroundColor: getStatusColor(client.status) }}>
          {getStatusIcon(client.status)}
          <span>{client.status}</span>
        </div>
      </div>
      
      <div className="mg-client-card__content-mobile">
        <h4 className="mg-client-card__name mg-client-card__name--mobile">{client.name}</h4>
        
        <div className="mg-client-card__info-mobile">
          <div className="mg-client-card__info-row">
            <Mail size={14} />
            <span>{client.email}</span>
          </div>
          <div className="mg-client-card__info-row">
            <Phone size={14} />
            <span>{client.phone}</span>
          </div>
          <div className="mg-client-card__info-row">
            <Calendar size={14} />
            <span>최근: {client.lastConsultation}</span>
          </div>
        </div>
        
        <div className="mg-client-card__stats-mobile">
          <div className="mg-client-card__stat">
            <span className="mg-client-card__stat-label">진행률</span>
            <span className="mg-client-card__stat-value">{client.progress}%</span>
          </div>
          <div className="mg-client-card__stat">
            <span className="mg-client-card__stat-label">상담횟수</span>
            <span className="mg-client-card__stat-value">{client.sessions}회</span>
          </div>
        </div>
        
        <div className="mg-client-card__actions mg-client-card__actions--mobile">
          <button className="mg-button mg-button-primary mg-button-sm" style={{ flex: 1 }}>
            상세보기
          </button>
          <button className="mg-button mg-button-outline mg-button-sm">
            <MessageCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // 모바일 간단 카드 (스케줄 모달용)
  const renderMobileSimpleCard = (client) => (
    <div key={client.id} className="mg-client-card mg-client-card--mobile-simple">
      <div className="mg-client-card__avatar mg-client-card__avatar--mobile-simple">
        {client.name.charAt(0)}
      </div>
      
      <div className="mg-client-card__info mg-client-card__info--mobile-simple">
        <h4 className="mg-client-card__name mg-client-card__name--mobile-simple">{client.name}</h4>
        
        <div className="mg-client-card__meta mg-client-card__meta--mobile-simple">
          <div className="mg-client-card__progress mg-client-card__progress--mobile-simple">
            <span>{client.progress}% 진행</span>
          </div>
          <span>{client.sessions}회 상담</span>
        </div>
      </div>
      
      <div className="mg-client-card__status mg-client-card__status--mobile-simple" style={{ backgroundColor: getStatusColor(client.status) }}>
        <span>{client.status}</span>
      </div>
    </div>
  );

  return (
    <section className="mg-v2-section">
      <h2 className="mg-h2 mg-v2-text-center mg-mb-lg">클라이언트 카드 변형</h2>
      
      {/* 뷰 모드 선택 */}
      <div className="mg-card mg-mb-lg">
        <h3 className="mg-h4 mg-mb-md">카드 스타일 선택</h3>
        <div className="mg-flex mg-gap-sm">
          <button 
            className={`mg-button ${viewMode === 'compact' ? 'mg-button-primary' : 'mg-button-outline'}`}
            onClick={() => setViewMode('compact')}
          >
            컴팩트 (목록용)
          </button>
          <button 
            className={`mg-button ${viewMode === 'detailed' ? 'mg-button-primary' : 'mg-button-outline'}`}
            onClick={() => setViewMode('detailed')}
          >
            상세 (메인)
          </button>
          <button 
            className={`mg-button ${viewMode === 'mobile' ? 'mg-button-primary' : 'mg-button-outline'}`}
            onClick={() => setViewMode('mobile')}
          >
            모바일
          </button>
          <button 
            className={`mg-button ${viewMode === 'mobile-simple' ? 'mg-button-primary' : 'mg-button-outline'}`}
            onClick={() => setViewMode('mobile-simple')}
          >
            모바일 간단
          </button>
        </div>
      </div>
      
      {/* 카드 그리드 */}
      <div className={`mg-client-cards-grid mg-client-cards-grid--${viewMode}`}>
        {viewMode === 'compact' && clients.map(renderCompactCard)}
        {viewMode === 'detailed' && clients.map(renderDetailedCard)}
        {viewMode === 'mobile' && clients.map(renderMobileCard)}
        {viewMode === 'mobile-simple' && clients.map(renderMobileSimpleCard)}
      </div>
    </section>
  );
};

export default ClientCardShowcase;

