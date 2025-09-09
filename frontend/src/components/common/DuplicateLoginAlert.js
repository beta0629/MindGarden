import React, { useState, useEffect } from 'react';
import './DuplicateLoginAlert.css';

/**
 * 중복 로그인 알림 컴포넌트
 * 중복 로그인 감지 시 사용자에게 알림을 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
const DuplicateLoginAlert = ({ 
    isVisible, 
    onConfirm, 
    onCancel, 
    countdown = 5 
}) => {
    const [timeLeft, setTimeLeft] = useState(countdown);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (!isVisible) return;

        setTimeLeft(countdown);
        setIsClosing(false);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleConfirm();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVisible, countdown]);

    const handleConfirm = () => {
        setIsClosing(true);
        setTimeout(() => {
            onConfirm && onConfirm();
        }, 300);
    };

    const handleCancel = () => {
        setIsClosing(true);
        setTimeout(() => {
            onCancel && onCancel();
        }, 300);
    };

    if (!isVisible) return null;

    return (
        <div className={`duplicate-login-overlay ${isClosing ? 'closing' : ''}`}>
            <div className={`duplicate-login-alert ${isClosing ? 'closing' : ''}`}>
                <div className="alert-header">
                    <div className="alert-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path 
                                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <h3 className="alert-title">중복 로그인 감지</h3>
                </div>
                
                <div className="alert-content">
                    <p className="alert-message">
                        다른 곳에서 로그인되어 현재 세션이 종료됩니다.
                    </p>
                    <p className="alert-submessage">
                        보안을 위해 {timeLeft}초 후 자동으로 로그아웃됩니다.
                    </p>
                </div>

                <div className="alert-actions">
                    <button 
                        className="btn-cancel"
                        onClick={handleCancel}
                        disabled={timeLeft <= 0}
                    >
                        취소
                    </button>
                    <button 
                        className="btn-confirm"
                        onClick={handleConfirm}
                    >
                        확인 ({timeLeft}초)
                    </button>
                </div>

                <div className="countdown-bar">
                    <div 
                        className="countdown-progress"
                        style={{ 
                            width: `${((countdown - timeLeft) / countdown) * 100}%` 
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DuplicateLoginAlert;
