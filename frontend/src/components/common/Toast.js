import React, { useState, useEffect } from 'react';
import notificationManager from '../../utils/notification';
import './Toast.css';

/**
 * 공통 Toast 알림 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const Toast = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const unsubscribe = notificationManager.addListener((notification) => {
            setNotifications(prev => [...prev, notification]);

            // 자동 제거
            setTimeout(() => {
                setNotifications(prev => 
                    prev.filter(n => n.id !== notification.id)
                );
            }, notification.duration);
        });

        return unsubscribe;
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="toast-container">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`toast toast-${notification.type}`}
                    onClick={() => removeNotification(notification.id)}
                >
                    <div className="toast-content">
                        <div className="toast-icon">
                            {getIcon(notification.type)}
                        </div>
                        <div className="toast-message">
                            {notification.message}
                        </div>
                        <button 
                            className="toast-close"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <div className="toast-progress">
                        <div 
                            className="toast-progress-bar"
                            style={{
                                animationDuration: `${notification.duration}ms`
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * 알림 타입별 아이콘 반환
 */
const getIcon = (type) => {
    switch (type) {
        case 'success':
            return '✅';
        case 'error':
            return '❌';
        case 'warning':
            return '⚠️';
        case 'info':
            return 'ℹ️';
        default:
            return '📢';
    }
};

export default Toast;
