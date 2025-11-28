import React from 'react';
import IPhone17Card from '../common/IPhone17Card';
import IPhone17Button from '../common/IPhone17Button';
import IPhone17Modal from '../common/IPhone17Modal';
import IPhone17PageHeader from '../common/IPhone17PageHeader';
import './ComplexDashboardSample.css';
import { useMoodTheme } from '../../hooks/useMoodTheme'; // useMoodTheme 훅 임포트


const ComplexDashboardSample = () => {
  const { currentMood, setMood } = useMoodTheme(); // 훅 사용

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
          
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInUp {
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
          
          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
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
          
          @keyframes countUp {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}
      </style>
      <div 
        className="complex-dashboard-sample" 
        data-mood={currentMood}
        
    >
      <div 
        className="dashboard-header"
        
      >
        <div >
          <h1 
            className="dashboard-title"
            
          >
            복합 대시보드 샘플
          </h1>
          <p 
            className="dashboard-subtitle"
            
          >
            다양한 데이터를 한눈에 확인하세요.
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

      <div className="dashboard-grid grid grid--cols-3 grid--tablet-cols-2 grid--mobile-cols-1">
        {/* 통계 위젯 */}
        <div 
          className="stat-widget"
          
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
          }}
        >
          <div 
            className="stat-widget__icon"
            
          >
            📊
          </div>
          <div className="stat-widget__content">
            <div 
              className="stat-widget__value"
              
            >
              1,234
            </div>
            <div 
              className="stat-widget__label"
              
            >
              총 세션 수
            </div>
          </div>
        </div>

        <div 
          className="stat-widget"
          
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
          }}
        >
          <div 
            className="stat-widget__icon"
            
          >
            📈
          </div>
          <div className="stat-widget__content">
            <div 
              className="stat-widget__value"
              
            >
              85%
            </div>
            <div 
              className="stat-widget__label"
              
            >
              완료율
            </div>
          </div>
        </div>

        <div 
          className="stat-widget"
          
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
          }}
        >
          <div 
            className="stat-widget__icon"
            
          >
            ⭐
          </div>
          <div className="stat-widget__content">
            <div 
              className="stat-widget__value"
              
            >
              4.8
            </div>
            <div 
              className="stat-widget__label"
              
            >
              평균 평점
            </div>
          </div>
        </div>

        {/* 데이터 카드 */}
        <div 
          className="data-card grid__item--span-2"
          
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
          }}
        >
          <div 
            className="data-card__header"
            
          >
            <h3 
              className="data-card__title"
              
            >
              최근 활동
            </h3>
            <span 
              className="data-card__subtitle"
              
            >
              업데이트: 5분 전
            </span>
          </div>
          <div 
            className="data-card__content"
            
          >
            <ul 
              className="activity-list"
              
            >
              {[
                { text: '김민준 내담자 상담 완료', status: '완료', type: 'active' },
                { text: '새로운 매핑 생성: 이지은', status: '진행 중', type: 'default' },
                { text: '시스템 업데이트 완료', status: '성공', type: 'success' }
              ].map((item, index) => (
                <li 
                  key={index}
                  className="activity-item"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < 2 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
                    animation: `slideInRight 0.5s ease-out ${1.2 + index * 0.1}s both`,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(0, 122, 255, 0.04)';
                    e.target.style.paddingLeft = '8px';
                    e.target.style.borderRadius = '8px';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.paddingLeft = '0';
                    e.target.style.borderRadius = '0';
                  }}
                >
                  <span 
                    className="activity-item__text"
                    
                  >
                    {item.text}
                  </span>
                  <span 
                    className={`activity-item__status activity-item__status--${item.type}`}
                    
                  >
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 알림 카드 */}
        <div 
          className="data-card"
          
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
          }}
        >
          <div 
            className="data-card__header"
            
          >
            <h3 
              className="data-card__title"
              
            >
              알림
            </h3>
            <span 
              className="data-card__subtitle"
              
            >
              3개 미확인
            </span>
          </div>
          <div 
            className="data-card__content"
            
          >
            <ul 
              className="notification-list"
              
            >
              {[
                { icon: '🔔', text: '이번 주 예정된 세션이 5개 있습니다.', color: 'var(--mg-primary-500)' },
                { icon: '⚠️', text: '결제 예정일이 2일 남은 내담자가 있습니다.', color: 'var(--mg-warning-500)' }
              ].map((item, index) => (
                <li 
                  key={index}
                  className={`notification-item notification-item--${index === 0 ? 'info' : 'warning'}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: index < 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
                    animation: `bounceIn 0.6s ease-out ${1.3 + index * 0.2}s both`,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(0, 122, 255, 0.04)';
                    e.target.style.paddingLeft = '8px';
                    e.target.style.borderRadius = '8px';
                    e.target.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.paddingLeft = '0';
                    e.target.style.borderRadius = '0';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  <span 
                    className="notification-item__icon"
                    style={{
                      fontSize: '20px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: '0'
                    }}
                  >
                    {item.icon}
                  </span>
                  <span 
                    className="notification-item__text"
                    
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 차트 카드 (Placeholder) */}
        <div 
          className="data-card grid__item--span-3"
          
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
          }}
        >
          <div 
            className="data-card__header"
            
          >
            <h3 
              className="data-card__title"
              
            >
              월별 세션 현황
            </h3>
            <span 
              className="data-card__subtitle"
              
            >
              2024년
            </span>
          </div>
          <div 
            className="data-card__content chart-placeholder"
            
          >
            {/* 실제 차트 라이브러리 (예: Chart.js, Recharts)가 들어갈 자리 */}
            <div 
              
            >
              📊<br />
              여기에 월별 세션 현황 차트가 표시됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ComplexDashboardSample;