import React from 'react';
import { useSession } from '../../../contexts/SessionContext';

const DashboardHeader = ({ className = '', ...props }) => {
    const { user } = useSession();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '좋은 아침입니다';
        if (hour < 18) return '좋은 오후입니다';
        return '좋은 저녁입니다';
    };

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        });
    };

    return (
        <div className={`dashboard-header ${className}`} {...props}>
            <div className="welcome-section">
                <div className="mg-card mg-card--glass mg-card--large">
                    <div className="welcome-profile">
                        <div className="profile-avatar">
                            <div className="profile-icon">
                                <i className="bi bi-person-circle"></i>
                            </div>
                        </div>
                        <div className="welcome-content">
                            <h1 className="mg-card__title">
                                안녕하세요, {user?.name || '관리자'}님!
                            </h1>
                            <p className="mg-card__subtitle">
                                {getGreeting()}
                            </p>
                            <p className="mg-card__text">
                                {getCurrentDate()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
