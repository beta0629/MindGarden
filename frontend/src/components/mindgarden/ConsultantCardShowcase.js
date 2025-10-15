import React, { useState } from 'react';
import { User, Star, Clock, Phone, Mail, MessageCircle, Calendar, Award, TrendingUp } from 'lucide-react';

const ConsultantCardShowcase = () => {
  const [viewMode, setViewMode] = useState('detailed'); // 'compact', 'detailed', 'mobile', 'mobile-simple'

  const consultants = [
    {
      id: 1,
      name: '김상담',
      email: 'kim.consultant@mindgarden.com',
      phone: '010-1234-5678',
      rating: 4.8,
      totalClients: 45,
      availableSlots: 3,
      specialties: ['우울증', '불안장애'],
      status: 'available',
      experience: '5년',
      nextAvailable: '2025-10-15 14:00'
    },
    {
      id: 2,
      name: '이치료',
      email: 'lee.therapist@mindgarden.com',
      phone: '010-2345-6789',
      rating: 4.9,
      totalClients: 38,
      availableSlots: 0,
      specialties: ['트라우마', 'PTSD'],
      status: 'busy',
      experience: '8년',
      nextAvailable: '2025-10-16 10:00'
    },
    {
      id: 3,
      name: '박심리',
      email: 'park.psychology@mindgarden.com',
      phone: '010-3456-7890',
      rating: 4.7,
      totalClients: 52,
      availableSlots: 5,
      specialties: ['가족상담', '커플상담'],
      status: 'available',
      experience: '6년',
      nextAvailable: '2025-10-15 16:30'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'unavailable': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return '상담 가능';
      case 'busy': return '상담 중';
      case 'unavailable': return '휴무';
      default: return '알 수 없음';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <TrendingUp size={12} />;
      case 'busy': return <Clock size={12} />;
      case 'unavailable': return <Calendar size={12} />;
      default: return <User size={12} />;
    }
  };

  // 컴팩트 카드 (목록용)
  const renderCompactCard = (consultant) => (
    <div key={consultant.id} className="mg-consultant-card mg-consultant-card--compact">
      <div className="mg-consultant-card__avatar">
        {consultant.name.charAt(0)}
      </div>
      <div className="mg-consultant-card__info">
        <div className="mg-consultant-card__header">
          <h4 className="mg-consultant-card__name">{consultant.name}</h4>
          <div className="mg-consultant-card__status" style={{ backgroundColor: getStatusColor(consultant.status) }}>
            {getStatusIcon(consultant.status)}
            <span>{getStatusText(consultant.status)}</span>
          </div>
        </div>
        <div className="mg-consultant-card__meta">
          <div className="mg-consultant-card__rating">
            <Star size={14} />
            <span>{consultant.rating}</span>
          </div>
          <span className="mg-consultant-card__clients">{consultant.totalClients}명</span>
          <span className="mg-consultant-card__slots">{consultant.availableSlots}개</span>
        </div>
      </div>
    </div>
  );

  // 상세 카드 (메인 카드)
  const renderDetailedCard = (consultant) => (
    <div key={consultant.id} className="mg-consultant-card mg-consultant-card--detailed">
      <div className="mg-consultant-card__status-badge" style={{ backgroundColor: getStatusColor(consultant.status) }}>
        {getStatusIcon(consultant.status)}
        <span>{getStatusText(consultant.status)}</span>
      </div>
      
      <div className="mg-consultant-card__avatar mg-consultant-card__avatar--large">
        {consultant.name.charAt(0)}
      </div>
      
      <div className="mg-consultant-card__info">
        <h4 className="mg-consultant-card__name mg-consultant-card__name--large">{consultant.name}</h4>
        
        <div className="mg-consultant-card__rating-section">
          <div className="mg-consultant-card__rating">
            <Star size={16} />
            <span className="mg-consultant-card__rating-value">{consultant.rating}</span>
            <span className="mg-consultant-card__rating-text">평점</span>
          </div>
          <div className="mg-consultant-card__experience">
            <Award size={16} />
            <span>{consultant.experience} 경력</span>
          </div>
        </div>
        
        <div className="mg-consultant-card__details">
          <div className="mg-consultant-card__detail-item">
            <User size={16} />
            <span>총 {consultant.totalClients}명 상담</span>
          </div>
          
          <div className="mg-consultant-card__detail-item">
            <Clock size={16} />
            <span>예약 가능: {consultant.availableSlots}개</span>
          </div>
          
          <div className="mg-consultant-card__detail-item">
            <Calendar size={16} />
            <span>다음 가능: {consultant.nextAvailable}</span>
          </div>
        </div>
        
        <div className="mg-consultant-card__specialties">
          <h5 className="mg-consultant-card__specialties-title">전문 분야</h5>
          <div className="mg-consultant-card__specialties-list">
            {consultant.specialties.map((specialty, index) => (
              <span key={index} className="mg-consultant-card__specialty-tag">
                {specialty}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mg-consultant-card__actions">
          <button className="mg-button mg-button-primary mg-button-sm">
            상담 예약
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
  const renderMobileCard = (consultant) => (
    <div key={consultant.id} className="mg-consultant-card mg-consultant-card--mobile">
      <div className="mg-consultant-card__header-mobile">
        <div className="mg-consultant-card__avatar mg-consultant-card__avatar--mobile">
          {consultant.name.charAt(0)}
        </div>
        <div className="mg-consultant-card__status" style={{ backgroundColor: getStatusColor(consultant.status) }}>
          {getStatusIcon(consultant.status)}
          <span>{getStatusText(consultant.status)}</span>
        </div>
      </div>
      
      <div className="mg-consultant-card__content-mobile">
        <h4 className="mg-consultant-card__name mg-consultant-card__name--mobile">{consultant.name}</h4>
        
        <div className="mg-consultant-card__rating-mobile">
          <div className="mg-consultant-card__rating-item">
            <Star size={16} />
            <span>{consultant.rating} 평점</span>
          </div>
          <div className="mg-consultant-card__rating-item">
            <Award size={16} />
            <span>{consultant.experience} 경력</span>
          </div>
        </div>
        
        <div className="mg-consultant-card__info-mobile">
          <div className="mg-consultant-card__info-row">
            <Mail size={14} />
            <span>{consultant.email}</span>
          </div>
          <div className="mg-consultant-card__info-row">
            <Phone size={14} />
            <span>{consultant.phone}</span>
          </div>
          <div className="mg-consultant-card__info-row">
            <User size={14} />
            <span>총 {consultant.totalClients}명 상담</span>
          </div>
        </div>
        
        <div className="mg-consultant-card__specialties-mobile">
          <h5 className="mg-consultant-card__specialties-title-mobile">전문 분야</h5>
          <div className="mg-consultant-card__specialties-list-mobile">
            {consultant.specialties.map((specialty, index) => (
              <span key={index} className="mg-consultant-card__specialty-tag-mobile">
                {specialty}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mg-consultant-card__stats-mobile">
          <div className="mg-consultant-card__stat">
            <span className="mg-consultant-card__stat-label">예약 가능</span>
            <span className="mg-consultant-card__stat-value">{consultant.availableSlots}개</span>
          </div>
          <div className="mg-consultant-card__stat">
            <span className="mg-consultant-card__stat-label">다음 가능</span>
            <span className="mg-consultant-card__stat-value">{consultant.nextAvailable}</span>
          </div>
        </div>
        
        <div className="mg-consultant-card__actions mg-consultant-card__actions--mobile">
          <button className="mg-button mg-button-primary mg-button-sm" style={{ flex: 1 }}>
            상담 예약
          </button>
          <button className="mg-button mg-button-outline mg-button-sm">
            <MessageCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // 모바일 간단 카드 (스케줄 모달용)
  const renderMobileSimpleCard = (consultant) => (
    <div key={consultant.id} className="mg-consultant-card mg-consultant-card--mobile-simple">
      <div className="mg-consultant-card__avatar mg-consultant-card__avatar--mobile-simple">
        {consultant.name.charAt(0)}
      </div>
      
      <div className="mg-consultant-card__info mg-consultant-card__info--mobile-simple">
        <h4 className="mg-consultant-card__name mg-consultant-card__name--mobile-simple">{consultant.name}</h4>
        
        <div className="mg-consultant-card__meta mg-consultant-card__meta--mobile-simple">
          <div className="mg-consultant-card__rating mg-consultant-card__rating--mobile-simple">
            <Star size={12} />
            <span>{consultant.rating}</span>
          </div>
          <span>{consultant.experience}</span>
          <span>{consultant.availableSlots}개 가능</span>
        </div>
      </div>
      
      <div className="mg-consultant-card__status mg-consultant-card__status--mobile-simple" style={{ backgroundColor: getStatusColor(consultant.status) }}>
        {getStatusIcon(consultant.status)}
      </div>
    </div>
  );

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">상담사 카드 변형</h2>
      
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
      <div className={`mg-consultant-cards-grid mg-consultant-cards-grid--${viewMode}`}>
        {viewMode === 'compact' && consultants.map(renderCompactCard)}
        {viewMode === 'detailed' && consultants.map(renderDetailedCard)}
        {viewMode === 'mobile' && consultants.map(renderMobileCard)}
        {viewMode === 'mobile-simple' && consultants.map(renderMobileSimpleCard)}
      </div>
    </section>
  );
};

export default ConsultantCardShowcase;
