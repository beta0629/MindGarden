import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { WELCOME_SECTION_CSS } from '../../constants/css';
import { DASHBOARD_MESSAGES } from '../../constants/dashboard';
import WeatherCard from './WeatherCard';
import '../../styles/main.css';
import './WelcomeSection.css';

const WelcomeSection = ({ user, currentTime, consultationData }) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const navigate = useNavigate();

  // 프로필 이미지 URL 가져오기
  const getProfileImageUrl = () => {
    if (user?.profileImageUrl && !imageLoadError) {
      return user.profileImageUrl;
    }
    if (user?.socialProfileImage && !imageLoadError) {
      return user.socialProfileImage;
    }
    // 기본 아바타 사용
    return '/default-avatar.svg';
  };

  // 사용자 이름 가져오기
  const getUserDisplayName = () => {
    if (user?.name && !user.name.includes('==')) {
      return user.name;
    }
    if (user?.nickname && !user.nickname.includes('==')) {
      return user.nickname;
    }
    if (user?.username) {
      return user.username;
    }
    return '사용자';
  };

  const getWelcomeTitle = () => {
    if (!user?.role) {
      return DASHBOARD_MESSAGES.WELCOME.DEFAULT;
    }
    
    switch (user.role) {
      case 'CLIENT':
        return DASHBOARD_MESSAGES.WELCOME.CLIENT;
      case 'CONSULTANT':
        return DASHBOARD_MESSAGES.WELCOME.CONSULTANT;
      case 'ADMIN':
      case 'BRANCH_SUPER_ADMIN':
        return DASHBOARD_MESSAGES.WELCOME.ADMIN;
      default:
        console.log('⚠️ 알 수 없는 role:', user.role);
        return DASHBOARD_MESSAGES.WELCOME.DEFAULT;
    }
  };

  const profileImageUrl = getProfileImageUrl();
  const displayName = getUserDisplayName();

  // 오늘 날짜의 상담만 필터링
  const getTodayConsultations = () => {
    if (!consultationData?.upcomingConsultations) return [];
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    return consultationData.upcomingConsultations.filter(consultation => {
      const consultationDate = new Date(consultation.date);
      const consultationDateString = consultationDate.toISOString().split('T')[0];
      return consultationDateString === todayString;
    });
  };

  const todayConsultations = getTodayConsultations();

  // 카드 클릭 핸들러
  const handleCardClick = (action) => {
    switch (action) {
      case 'schedule':
        navigate('/consultant/schedule');
        break;
      case 'consultants':
        navigate('/consultant/consultant-list');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className={WELCOME_SECTION_CSS.CONTAINER}>
      <div className="welcome-card">
        <div className="welcome-profile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div className="profile-avatar" style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            flexShrink: 0
          }}>
            <img 
              src={profileImageUrl} 
              alt="프로필 이미지" 
              className="profile-image"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
              onError={() => setImageLoadError(true)}
            />
          </div>
          <div className="welcome-content" style={{ flex: 1 }}>
            <h2 className="welcome-title" style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: '0 0 0.5rem 0',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>{getWelcomeTitle()}</h2>
            <p className="welcome-message" style={{
              fontSize: '1rem',
              margin: '0 0 0.5rem 0',
              opacity: '0.9',
              lineHeight: '1.4'
            }}>
              {displayName}님, 오늘도 좋은 하루 되세요!
            </p>
            <div className="welcome-time" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              opacity: '0.8'
            }}>
              <i className="bi bi-clock" style={{ fontSize: '1rem' }}></i>
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 내담자 전용 - 오늘의 상담 정보 (큰 카드) */}
      {user?.role === 'CLIENT' && (
        <div className="welcome-info-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div className="welcome-info-card today-consultation-card" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e9ecef',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <div className="info-icon" style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#667eea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)'
            }}>
              <i className="bi bi-calendar-check" style={{
                fontSize: '1.2rem',
                color: 'white'
              }}></i>
            </div>
            <div className="info-content">
              <h3 className="info-title" style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
                color: '#2d3748'
              }}>오늘의 상담</h3>
              <p className="info-value">
                {todayConsultations.length > 0 
                  ? (
                    <span>
                      <span style={{
                        fontSize: '1.2em',
                        fontWeight: '700',
                        color: '#007bff',
                        textShadow: '0 1px 2px rgba(0, 123, 255, 0.3)'
                      }}>{todayConsultations.length}</span>
                      건의 상담이 오늘 예정되어 있습니다
                    </span>
                  )
                  : '오늘 예정된 상담이 없습니다'
                }
              </p>
              {todayConsultations.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px',
                  marginTop: '16px'
                }}>
                  {todayConsultations.slice(0, 3).map((consultation, index) => (
                    <div key={index} style={{
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #e9ecef',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}>
                      <div className="consultation-date-time">
                        {new Date(consultation.date).toLocaleDateString('ko-KR')} {consultation.startTime} - {consultation.endTime}
                      </div>
                      <div className="consultation-consultant-name">
                        {consultation.consultantName} 상담사
                      </div>
                      <div className={`consultation-status-badge consultation-status-badge--${consultation.status.toLowerCase()}`}>
                        {consultation.status === 'CONFIRMED' ? '확정' : consultation.status === 'BOOKED' ? '예약' : consultation.status}
                      </div>
                    </div>
                  ))}
                  
                  {/* 더 많은 상담이 있을 때 표시 */}
                  {todayConsultations.length > 3 && (
                    <div style={{
                      textAlign: 'center',
                      marginTop: '12px',
                      padding: '8px',
                      background: '#e9ecef',
                      borderRadius: '8px',
                      fontSize: 'var(--font-size-sm)',
                      color: '#6c757d'
                    }}>
                      +{todayConsultations.length - 3}건의 추가 상담이 있습니다
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 상담사/관리자용 정보 카드 */}
      {user?.role !== 'CLIENT' && (
        <div className="welcome-info-cards">
          {/* 오늘의 상담 - 큰 카드 */}
          <div className="welcome-info-card today-consultation-card">
            <div className="info-icon info-icon--consultation">
              <i className="bi bi-calendar-check"></i>
            </div>
            <div className="info-content">
              <h3 className="info-title">오늘의 상담</h3>
              <p className="info-value">
                {todayConsultations.length > 0 
                  ? (
                    <span>
                      <span className="consultation-count">{todayConsultations.length}</span>
                      건의 상담이 오늘 예정되어 있습니다
                    </span>
                  )
                  : '오늘 예정된 상담이 없습니다'
                }
              </p>
              {todayConsultations.length > 0 ? (
                <div className="consultation-cards-grid">
                  {todayConsultations.map((consultation, index) => (
                    <div key={index} className="consultation-card">
                      <div>
                        <div className="consultation-header">
                          <div className="consultation-time">
                            {consultation.startTime} - {consultation.endTime}
                          </div>
                          <div className={`consultation-status consultation-status--${consultation.status.toLowerCase()}`}>
                            {consultation.status === 'CONFIRMED' ? '확정' : consultation.status === 'BOOKED' ? '예약' : consultation.status}
                          </div>
                        </div>
                        <div className="consultation-consultant">
                          <span className="consultation-icon">👤</span>
                          {consultation.consultantName} 상담사
                        </div>
                        {consultation.clientName && (
                          <div className="consultation-client">
                            <span className="consultation-icon">👥</span>
                            {consultation.clientName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                </div>
              ) : (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6c757d',
                  fontSize: 'var(--font-size-sm)',
                  textAlign: 'center',
                  padding: '40px 20px'
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xxxl)', marginBottom: '16px' }}>📅</div>
                    <div>오늘 예정된 상담이 없습니다</div>
                  </div>
                </div>
              )}
              
              {/* 오늘 상담이 많을 때 자세히 보기 버튼 */}
              {todayConsultations.length > 4 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e9ecef',
                  width: '100%'
                }}>
                  <button 
                    onClick={() => handleCardClick('schedule')}
                    style={{
                      background: 'transparent',
                      border: '1px solid #667eea',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: '#667eea',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#667eea';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#667eea';
                    }}
                  >
                    +{todayConsultations.length - 4}건 더 보기
                  </button>
                </div>
              )}
            </div>
          </div>


          {/* 상담사 목록 */}
          {consultationData?.consultantList?.length > 0 && (
            <div 
              className="welcome-info-card" 
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e9ecef',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => handleCardClick('consultants')}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
              }}
            >
              <div className="info-icon" style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#3f51b5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(63, 81, 181, 0.2)'
              }}>
                <i className="bi bi-people" style={{
                  fontSize: 'var(--font-size-xl)',
                  color: 'white'
                }}></i>
              </div>
              <div className="info-content">
                <h3 className="info-title" style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  color: '#2d3748'
                }}>상담사 목록</h3>
                <p className="info-value" style={{
                  fontSize: 'var(--font-size-sm)',
                  color: '#6c757d',
                  margin: '0 0 12px 0',
                  lineHeight: '1.5'
                }}>
                  {consultationData.consultantList.length}명의 상담사가 있습니다
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: '#3f51b5',
                    fontWeight: '500'
                  }}>
                    자세히 보기
                  </span>
                  <i className="bi bi-arrow-right" style={{
                    fontSize: 'var(--font-size-xs)',
                    color: '#3f51b5'
                  }}></i>
                </div>
              </div>
            </div>
          )}
          
          {/* 오늘의 팁 */}
          <div className="welcome-info-card">
            <div className="info-icon info-icon--tip">
              <i className="bi bi-lightbulb"></i>
            </div>
            <div className="info-content">
              <h3 className="info-title" style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                margin: '0 0 12px 0',
                color: '#2d3748'
              }}>오늘의 팁</h3>
              <p className="info-value" style={{
                fontSize: 'var(--font-size-sm)',
                color: '#6c757d',
                margin: '0',
                lineHeight: '1.5'
              }}>작은 변화가 큰 변화를 만듭니다</p>
            </div>
          </div>

          {/* 오늘의 날씨 */}
          <div className="weather-card-wrapper">
            <WeatherCard />
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeSection;
