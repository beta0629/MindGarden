import React, { useState, useEffect } from 'react';
import notificationManager from '../../utils/notification';

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
        <>
            <style>{getAnimationStyles()}</style>
            <div style={getContainerStyle()}>
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    style={getToastStyle(notification.type)}
                    onClick={() => removeNotification(notification.id)}
                >
                    <div style={getContentStyle()}>
                        <div style={getIconStyle()}>
                            {getIcon(notification.type)}
                        </div>
                        <div style={getMessageStyle()}>
                            {notification.message}
                        </div>
                        <button 
                            style={getCloseButtonStyle()}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f5f5f5';
                                e.target.style.color = '#666';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#999';
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <div style={getProgressStyle()}>
                        <div 
                            style={getProgressBarStyle(notification.type, notification.duration)}
                        />
                    </div>
                </div>
            ))}
        </div>
        </>
    );
};

/**
 * 애니메이션 스타일
 */
const getAnimationStyles = () => `
    @keyframes progressBar {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
    }
    @keyframes slideIn {
        from { 
            transform: translateX(100%); 
            opacity: 0; 
        }
        to { 
            transform: translateX(0); 
            opacity: 1; 
        }
    }
`;

/**
 * 컨테이너 스타일
 */
const getContainerStyle = () => ({
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '400px',
    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
});

/**
 * 토스트 스타일
 */
const getToastStyle = (type) => {
    const borderColors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };

    return {
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: 'translateX(0)',
        borderLeft: `4px solid ${borderColors[type] || '#17a2b8'}`,
        minWidth: '300px',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
        fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
    };
};

/**
 * 컨텐츠 스타일
 */
const getContentStyle = () => ({
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    gap: '12px'
});

/**
 * 아이콘 스타일
 */
const getIconStyle = () => ({
    fontSize: '24px',
    flexShrink: 0
});

/**
 * 메시지 스타일
 */
const getMessageStyle = () => ({
    flex: 1,
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#333',
    fontWeight: '600',
    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
});

/**
 * 닫기 버튼 스타일
 */
const getCloseButtonStyle = () => ({
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#999',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    flexShrink: 0
});

/**
 * 프로그레스 스타일
 */
const getProgressStyle = () => ({
    height: '3px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
});

/**
 * 프로그레스 바 스타일
 */
const getProgressBarStyle = (type, duration) => {
    const progressColors = {
        success: 'linear-gradient(90deg, #28a745, #1e7e34)',
        error: 'linear-gradient(90deg, #dc3545, #c82333)',
        warning: 'linear-gradient(90deg, #ffc107, #e0a800)',
        info: 'linear-gradient(90deg, #17a2b8, #138496)'
    };

    return {
        height: '100%',
        background: progressColors[type] || progressColors.info,
        animation: `progressBar ${duration}ms linear forwards`,
        transformOrigin: 'left'
    };
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
