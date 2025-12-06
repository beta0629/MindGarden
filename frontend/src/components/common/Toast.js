import React, { useState, useEffect } from 'react';
import notificationManager from '../../utils/notification';
import './Toast.css';

/**
 * 공통 Toast 알림 컴포넌트
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const Toast = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        console.log('Toast 컴포넌트 마운트됨 - 리스너 등록');
        const unsubscribe = notificationManager.addListener((notification) => {
            console.log('Toast 렌더링:', notification);
            
            setNotifications(prev => {
                const newNotifications = [...prev, notification];
                console.log('Toast - 알림 추가 후 상태:', newNotifications);
                return newNotifications;
            });

            // 자동 제거
            setTimeout(() => {
                console.log('Toast - 알림 자동 제거:', notification.id);
                setNotifications(prev => {
                    const filtered = prev.filter(n => n.id !== notification.id);
                    console.log('Toast - 알림 제거 후 상태:', filtered);
                    return filtered;
                });
            }, notification.duration);
        });

        return unsubscribe;
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };


    // 알림이 없으면 렌더링하지 않음
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
                            data-duration={notification.duration}
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
        case 'system':
            return '🔧';
        default:
            return '📢';
    }
};

export default Toast;
