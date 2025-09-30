import React, { useState } from 'react';
import './IOSCardSample.css';

const IOSCardSample = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  const managementCards = [
    {
      id: 'schedule',
      title: '스케줄 관리',
      description: '상담 일정을 관리합니다',
      icon: '📅',
      color: 'schedule'
    },
    {
      id: 'sessions',
      title: '상담 세션',
      description: '진행 중인 상담을 확인합니다',
      icon: '💬',
      color: 'sessions'
    },
    {
      id: 'consultants',
      title: '상담사 관리',
      description: '상담사 정보를 관리합니다',
      icon: '👨‍⚕️',
      color: 'consultants'
    },
    {
      id: 'clients',
      title: '고객 관리',
      description: '고객 정보를 관리합니다',
      icon: '👥',
      color: 'clients'
    },
    {
      id: 'finance',
      title: '재무 관리',
      description: '수입과 지출을 관리합니다',
      icon: '💰',
      color: 'finance'
    },
    {
      id: 'reports',
      title: '보고서',
      description: '통계 및 분석 보고서',
      icon: '📊',
      color: 'reports'
    }
  ];

  const statCards = [
    {
      title: '총 상담사',
      value: '24',
      change: '+12.5%',
      changeType: 'positive',
      icon: '👨‍⚕️'
    },
    {
      title: '이번 달 상담',
      value: '156',
      change: '+8.2%',
      changeType: 'positive',
      icon: '💬'
    },
    {
      title: '수익',
      value: '₩2.4M',
      change: '-3.1%',
      changeType: 'negative',
      icon: '💰'
    },
    {
      title: '고객 만족도',
      value: '4.8',
      change: '+0.2',
      changeType: 'positive',
      icon: '⭐'
    }
  ];

  const handleCardClick = (cardId) => {
    setSelectedCard(selectedCard === cardId ? null : cardId);
  };

  return (
    <div className="ios-sample-container">
      <div className="ios-sample-header">
        <h1 className="ios-sample-title">MindGarden 관리 시스템</h1>
        <p className="ios-sample-subtitle">아이폰 스타일 카드 디자인 샘플</p>
      </div>

      {/* 통계 카드 섹션 */}
      <section className="ios-sample-section">
        <h2 className="ios-section-title">통계 현황</h2>
        <div className="ios-stat-grid">
          {statCards.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                <span className="stat-icon-emoji">{stat.icon}</span>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.title}</div>
              <div className={`stat-change ${stat.changeType}`}>
                <span className="stat-change-icon">
                  {stat.changeType === 'positive' ? '↗' : '↘'}
                </span>
                {stat.change}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 관리 카드 섹션 */}
      <section className="ios-sample-section">
        <h2 className="ios-section-title">관리 기능</h2>
        <div className="ios-management-grid">
          {managementCards.map((card) => (
            <div 
              key={card.id}
              className={`management-card ${selectedCard === card.id ? 'selected' : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className={`management-icon ${card.color}`}>
                <span className="management-icon-emoji">{card.icon}</span>
              </div>
              <div className="management-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 기본 카드 섹션 */}
      <section className="ios-sample-section">
        <h2 className="ios-section-title">기본 카드</h2>
        <div className="ios-basic-cards">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">알림 설정</h3>
              <p className="card-subtitle">푸시 알림을 관리합니다</p>
            </div>
            <div className="card-body">
              <p className="card-text">
                상담 예약, 결제 완료, 시스템 업데이트 등의 알림을 받을 수 있습니다.
              </p>
            </div>
            <div className="card-footer">
              <div className="card-actions">
                <button className="btn btn-secondary">취소</button>
                <button className="btn btn-primary">설정</button>
              </div>
            </div>
          </div>

          <div className="card card-success">
            <div className="card-header">
              <h3 className="card-title">성공 카드</h3>
              <p className="card-subtitle">작업이 완료되었습니다</p>
            </div>
            <div className="card-body">
              <p className="card-text">
                모든 데이터가 성공적으로 저장되었습니다.
              </p>
            </div>
          </div>

          <div className="card card-warning">
            <div className="card-header">
              <h3 className="card-title">경고 카드</h3>
              <p className="card-subtitle">주의가 필요합니다</p>
            </div>
            <div className="card-body">
              <p className="card-text">
                저장 공간이 부족합니다. 불필요한 파일을 정리해주세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 선택된 카드 정보 */}
      {selectedCard && (
        <div className="ios-selected-info">
          <h3>선택된 카드: {managementCards.find(c => c.id === selectedCard)?.title}</h3>
          <p>터치 피드백이 적용된 카드입니다.</p>
        </div>
      )}
    </div>
  );
};

export default IOSCardSample;
