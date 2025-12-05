import React, { useState } from 'react';
import IPhone17Card from '../common/IPhone17Card';
import IPhone17Button from '../common/IPhone17Button';
import IPhone17Modal from '../common/IPhone17Modal';
import IPhone17PageHeader from '../common/IPhone17PageHeader';
import { useMoodTheme } from '../../hooks/useMoodTheme';


const MobileUISample = () => {
  const { currentMood, setMood } = useMoodTheme();

  const [selectedCard, setSelectedCard] = useState(null);

  // 모바일 카드 데이터
  const mobileCards = [
    {
      id: 1,
      title: '프로필 설정',
      subtitle: '개인정보 관리',
      icon: '👤',
      color: 'var(--mg-primary-500)',
      description: '사용자 프로필과 개인정보를 관리합니다.',
      features: ['프로필 사진', '이름 변경', '연락처 정보', '보안 설정']
    },
    {
      id: 2,
      title: '알림 설정',
      subtitle: '푸시 알림 관리',
      icon: '🔔',
      color: 'var(--mg-warning-500)',
      description: '앱 알림과 푸시 메시지를 설정합니다.',
      features: ['푸시 알림', '이메일 알림', 'SMS 알림', '알림 시간']
    },
    {
      id: 3,
      title: '테마 설정',
      subtitle: '화면 테마 변경',
      icon: '🎨',
      color: 'var(--mg-success-500)',
      description: '앱의 색상과 테마를 변경합니다.',
      features: ['다크 모드', '라이트 모드', '커스텀 색상', '폰트 크기']
    },
    {
      id: 4,
      title: '데이터 관리',
      subtitle: '백업 및 복원',
      icon: '💾',
      color: 'var(--mg-purple-500)',
      description: '데이터 백업과 복원을 관리합니다.',
      features: ['자동 백업', '수동 백업', '데이터 복원', '클라우드 동기화']
    }
  ];

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes shake {
            0%, 100% {
              transform: translateX(0);
            }
            25% {
              transform: translateX(-5px);
            }
            75% {
              transform: translateX(5px);
            }
          }
        `}
      </style>
      <div 
        className="mobile-ui-sample" 
        data-mood={currentMood}
        
      >
        {/* 헤더 */}
        <div 
          className="mobile-header"
          
        >
          <div >
            <h1 
              
            >
              📱 모바일 UI 샘플
            </h1>
            <p 
              
            >
              iOS 스타일의 모바일 카드 컴포넌트들을 확인하세요.
            </p>
          </div>
          <div 
            className="mood-selector"
            
          >
            {['default', 'warm', 'cool', 'elegant', 'energetic'].map((mood, index) => (
              <button 
                key={mood}
                onClick={() => setMood(mood)} 
                className={`mood-btn ${currentMood === mood ? 'active' : ''}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: `bounceIn 0.6s ease-out ${0.5 + index * 0.1}s both`,
                  background: currentMood === mood ? 'var(--mood-accent)' : 'rgba(142, 142, 147, 0.12)',
                  color: currentMood === mood ? 'white' : 'var(--mood-accent)',
                  transform: currentMood === mood ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: currentMood === mood ? 'var(--mood-shadow)' : '0 2px 4px var(--mg-shadow-light)'
                }}
                onMouseEnter={(e) => {
                  if (currentMood !== mood) {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 4px 8px var(--mood-accent, rgba(0, 122, 255, 0.2))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentMood !== mood) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 4px var(--mg-shadow-light)';
                  }
                }}
              >
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* 모바일 카드 그리드 */}
        <div 
          className="mobile-cards-grid"
          
        >
          {mobileCards.map((card, index) => (
            <div
              key={card.id}
              className="mobile-card"
              style={{
                background: 'var(--mood-card-bg)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--mood-shadow)',
                // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.04) -> var(--mg-custom-color)
                border: '1px solid rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: `slideInLeft 0.6s ease-out ${0.6 + index * 0.1}s both`,
                transform: selectedCard === card.id ? 'scale(1.02)' : 'scale(1)',
                boxShadow: selectedCard === card.id ? '0 12px 40px var(--mg-shadow-medium)' : 'var(--mood-shadow)'
              }}
              onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
              onMouseEnter={(e) => {
                if (selectedCard !== card.id) {
                  e.target.style.transform = 'translateY(-4px)';
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.12) -> var(--mg-custom-color)
                  e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCard !== card.id) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'var(--mood-shadow)';
                }
              }}
            >
              {/* 카드 헤더 */}
              <div 
                
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginRight: '16px',
                    boxShadow: `0 4px 12px ${card.color}40`,
                    animation: selectedCard === card.id ? 'pulse 2s ease-in-out infinite' : 'none'
                  }}
                >
                  {card.icon}
                </div>
                <div >
                  <h3 
                    
                  >
                    {card.title}
                  </h3>
                  <p 
                    
                  >
                    {card.subtitle}
                  </p>
                </div>
                <div
                  
                >
                  ▼
                </div>
              </div>

              {/* 카드 설명 */}
              <p 
                
              >
                {card.description}
              </p>

              {/* 기능 목록 (확장 시 표시) */}
              {selectedCard === card.id && (
                <div 
                  
                >
                  <h4 
                    
                  >
                    주요 기능:
                  </h4>
                  <div 
                    
                  >
                    {card.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        style={{
                          padding: '8px 12px',
                          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(142, 142, 147, 0.12) -> var(--mg-custom-color)
                          background: 'rgba(142, 142, 147, 0.12)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'var(--mood-text-secondary)',
                          textAlign: 'center',
                          animation: `bounceIn 0.4s ease-out ${0.8 + featureIndex * 0.1}s both`
                        }}
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* iOS 스타일 토글 스위치 샘플 */}
        <div 
          className="toggle-section"
          
        >
          <h2 
            
          >
            🔘 iOS 스타일 토글 스위치
          </h2>
          <div 
            
          >
            {[
              { label: '푸시 알림', enabled: true },
              { label: '위치 서비스', enabled: false },
              { label: '다크 모드', enabled: true },
              { label: '자동 업데이트', enabled: false },
              { label: '백그라운드 새로고침', enabled: true },
              { label: '데이터 사용량 최적화', enabled: false }
            ].map((toggle, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  animation: `fadeInUp 0.4s ease-out ${1.3 + index * 0.1}s both`
                }}
              >
                <span 
                  
                >
                  {toggle.label}
                </span>
                <div
                  
                  onClick={() => {
                    // 토글 상태 변경 로직 (실제로는 state로 관리)
                  }}
                >
                  <div
                    
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* iOS 스타일 버튼 샘플 */}
        <div 
          className="button-section"
          
        >
          <h2 
            
          >
            🔘 iOS 스타일 버튼들
          </h2>
          <div 
            
          >
            {[
              { text: 'Primary Button', type: 'primary' },
              { text: 'Secondary Button', type: 'secondary' },
              { text: 'Destructive Button', type: 'destructive' },
              { text: 'Plain Button', type: 'plain' }
            ].map((button, index) => (
              <button
                key={index}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  animation: `bounceIn 0.4s ease-out ${1.5 + index * 0.1}s both`,
                  background: button.type === 'primary' ? 'var(--mood-accent)' :
                             // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(142, 142, 147, 0.12) -> var(--mg-custom-color)
                             button.type === 'secondary' ? 'rgba(142, 142, 147, 0.12)' :
                             button.type === 'destructive' ? 'var(--mg-error-500)' : 'transparent',
                  color: button.type === 'primary' ? 'white' :
                         button.type === 'secondary' ? 'var(--mood-accent)' :
                         button.type === 'destructive' ? 'white' : 'var(--mood-accent)',
                  boxShadow: button.type === 'primary' ? 'var(--mood-shadow)' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.opacity = '1';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                }}
              >
                {button.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileUISample;

