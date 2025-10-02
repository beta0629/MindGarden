import React, { useState, useEffect } from 'react';
import notificationManager from '../../utils/notification';
import '../../styles/main.css'; // Ensure main.css is imported for mg-notification styles

/**
 * 통합 알림 컴포넌트 (UnifiedNotification)
 * 모든 알림 UI의 표준이 되는 공통 컴포넌트
 * 
 * 기존 컴포넌트 통합:
 * - Toast: 일반적인 토스트 알림
 * - DuplicateLoginAlert: 중복 로그인 알림
 * - NotificationTest: 테스트용 알림
 * 
 * 지원하는 알림 타입:
 * - toast: 일반 토스트 알림
 * - modal: 모달 형태 알림 (중복 로그인 등)
 * - banner: 배너 형태 알림
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.type - 알림 타입 (toast, modal, banner)
 * @param {string} props.variant - 알림 스타일 (success, error, warning, info)
 * @param {string} props.message - 알림 메시지
 * @param {string} props.title - 알림 제목 (modal 타입에서 사용)
 * @param {number} props.duration - 표시 시간 (ms)
 * @param {string} props.position - 토스트 위치 (top-right, top-center, bottom-right)
 * @param {Array} props.actions - 액션 버튼들
 * @param {boolean} props.autoClose - 자동 닫힘 여부
 * @param {function} props.onClose - 닫기 핸들러
 * @param {function} props.onAction - 액션 핸들러
 * @param {boolean} props.showCountdown - 카운트다운 표시 여부 (modal 타입)
 * @param {number} props.countdown - 카운트다운 시간 (초)
 * 
 * @author MindGarden
 * @version 1.1.0
 * @since 2025-01-02
 */
const UnifiedNotification = ({ 
  type = "toast",
  variant = "info",
  message = "",
  title = "",
  duration = 1000, // 기본 duration을 5초에서 1초로 단축
  position = "top-right",
  actions = [],
  autoClose = true,
  onClose,
  onAction,
  showCountdown = false,
  countdown = 5,
  ...props 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    console.log('UnifiedNotification 컴포넌트 마운트됨 - 리스너 등록');
    const unsubscribe = notificationManager.addListener((notification) => {
      console.log('UnifiedNotification 렌더링:', notification);
      
      setNotifications(prev => {
        const newNotifications = [...prev, notification];
        console.log('UnifiedNotification - 알림 추가 후 상태:', newNotifications);
        return newNotifications;
      });

      // 카운트다운이 있는 경우 설정 (중복 로그인 알림 등)
      if (notification.showCountdown && notification.countdown) {
        setCountdowns(prev => ({
          ...prev,
          [notification.id]: notification.countdown
        }));
      }

      // 자동 제거
      if (autoClose) {
        const autoCloseTime = notification.showCountdown 
          ? (notification.countdown * 1000) 
          : (notification.duration || duration);
          
        setTimeout(() => {
          console.log('UnifiedNotification - 알림 자동 제거:', notification.id);
          setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== notification.id);
            console.log('UnifiedNotification - 알림 제거 후 상태:', filtered);
            return filtered;
          });
          setCountdowns(prev => {
            const newCountdowns = { ...prev };
            delete newCountdowns[notification.id];
            return newCountdowns;
          });
        }, autoCloseTime);
      }
    });

    return unsubscribe;
  }, [duration, autoClose]);

  // 카운트다운 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdowns(prev => {
        const newCountdowns = {};
        let hasActiveCountdown = false;
        
        Object.entries(prev).forEach(([id, timeLeft]) => {
          if (timeLeft > 1) {
            newCountdowns[id] = timeLeft - 1;
            hasActiveCountdown = true;
          }
        });
        
        return hasActiveCountdown ? newCountdowns : {};
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setCountdowns(prev => {
      const newCountdowns = { ...prev };
      delete newCountdowns[id];
      return newCountdowns;
    });
    onClose?.();
  };

  const handleAction = (action, notificationId) => {
    onAction?.(action);
    removeNotification(notificationId);
  };

  // 알림 아이콘 반환
  const getIcon = (variant) => {
    switch (variant) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  // 알림이 없으면 렌더링하지 않음
  if (notifications.length === 0) {
    return null;
  }

  // 토스트 타입 렌더링
  if (type === "toast") {
    return (
      <div className={`mg-notification-container mg-notification-container--${position}`}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`mg-notification mg-notification--toast mg-notification--${notification.type || variant}`}
            onClick={() => removeNotification(notification.id)}
          >
            <div className="mg-notification-content">
              <div className="mg-notification-icon">
                {getIcon(notification.type || variant)}
              </div>
              <div className="mg-notification-message">
                {notification.message}
              </div>
              <button 
                className="mg-notification-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
              >
                ×
              </button>
            </div>
            <div className="mg-notification-progress">
              <div 
                className="mg-notification-progress-bar"
                style={{
                  animationDuration: `${notification.duration || duration}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 모달 타입 렌더링 (중복 로그인 알림 등)
  if (type === "modal") {
    return (
      <>
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="mg-notification-overlay mg-notification-overlay--modal"
          >
            <div className={`mg-notification mg-notification--modal mg-notification--${notification.type || variant}`}>
              <div className="mg-notification-header">
                <div className="mg-notification-icon mg-notification-icon--large">
                  {getIcon(notification.type || variant)}
                </div>
                <h3 className="mg-notification-title">
                  {notification.title || '알림'}
                </h3>
              </div>
              
              <div className="mg-notification-body">
                <p className="mg-notification-message">
                  {notification.message}
                </p>
                
                {/* 카운트다운 표시 */}
                {notification.showCountdown && countdowns[notification.id] && (
                  <p className="mg-notification-countdown">
                    보안을 위해 {countdowns[notification.id]}초 후 자동으로 처리됩니다.
                  </p>
                )}
              </div>

              <div className="mg-notification-actions">
                {notification.actions && notification.actions.length > 0 ? (
                  notification.actions.map((action, index) => (
                    <button
                      key={index}
                      className={`mg-btn mg-btn--${action.variant || 'secondary'}`}
                      onClick={() => handleAction(action, notification.id)}
                    >
                      {countdowns[notification.id] && action.showCountdown 
                        ? `${action.label} (${countdowns[notification.id]}초)`
                        : action.label
                      }
                    </button>
                  ))
                ) : (
                  <>
                    <button 
                      className="mg-btn mg-btn--secondary"
                      onClick={() => removeNotification(notification.id)}
                    >
                      취소
                    </button>
                    <button 
                      className="mg-btn mg-btn--primary"
                      onClick={() => handleAction({ id: 'confirm' }, notification.id)}
                    >
                      {countdowns[notification.id] 
                        ? `확인 (${countdowns[notification.id]}초)`
                        : '확인'
                      }
                    </button>
                  </>
                )}
              </div>

              {/* 카운트다운 진행바 */}
              {notification.showCountdown && countdowns[notification.id] && (
                <div className="mg-notification-countdown-bar">
                  <div 
                    className="mg-notification-countdown-progress"
                    style={{
                      width: `${((notification.countdown - countdowns[notification.id]) / notification.countdown) * 100}%`
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </>
    );
  }


  // 배너 타입 렌더링
  if (type === "banner") {
    return (
      <div className={`mg-notification-banner mg-notification-banner--${variant}`}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="mg-notification-banner-content"
          >
            <div className="mg-notification-banner-icon">
              {getIcon(notification.type || variant)}
            </div>
            <div className="mg-notification-banner-message">
              {notification.message}
            </div>
            <button 
              className="mg-notification-banner-close"
              onClick={() => removeNotification(notification.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default UnifiedNotification;
