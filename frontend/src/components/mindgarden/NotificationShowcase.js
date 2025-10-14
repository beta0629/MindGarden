import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationShowcase = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type) => {
    const id = Date.now();
    const messages = {
      success: { title: '성공!', message: '작업이 성공적으로 완료되었습니다.' },
      error: { title: '오류 발생', message: '작업을 완료하는 중 오류가 발생했습니다.' },
      warning: { title: '경고', message: '주의가 필요한 상황이 발생했습니다.' },
      info: { title: '알림', message: '새로운 정보가 있습니다.' }
    };

    const notification = {
      id,
      type,
      ...messages[type]
    };

    setNotifications(prev => [...prev, notification]);

    // 3초 후 자동 제거
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, closing: true } : n)
    );
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={24} />;
      case 'error': return <XCircle size={24} />;
      case 'warning': return <AlertTriangle size={24} />;
      case 'info': return <Info size={24} />;
      default: return <Info size={24} />;
    }
  };

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">알림 (Toast)</h2>
      
      <div className="mg-card mg-p-xl">
        <p className="mg-body-medium mg-mb-md">
          버튼을 클릭하면 우측 상단에 알림이 표시되고 3초 후 자동으로 사라집니다.
        </p>
        
        <div className="mg-flex mg-gap-md" style={{ flexWrap: 'wrap' }}>
          <button 
            className="mg-button mg-button-primary"
            onClick={() => addNotification('success')}
          >
            성공 알림
          </button>
          
          <button 
            className="mg-button mg-button-danger"
            onClick={() => addNotification('error')}
          >
            오류 알림
          </button>
          
          <button 
            className="mg-button mg-button-outline"
            onClick={() => addNotification('warning')}
          >
            경고 알림
          </button>
          
          <button 
            className="mg-button mg-button-ghost"
            onClick={() => addNotification('info')}
          >
            정보 알림
          </button>
        </div>
      </div>
      
      {/* Notification Container */}
      <div className="mg-notification-container">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`mg-notification mg-notification-${notification.type} ${notification.closing ? 'closing' : ''}`}
          >
            <div className="mg-notification-icon">
              {getIcon(notification.type)}
            </div>
            <div className="mg-notification-content">
              <div className="mg-notification-title">{notification.title}</div>
              <div className="mg-notification-message">{notification.message}</div>
            </div>
            <button 
              className="mg-notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NotificationShowcase;

