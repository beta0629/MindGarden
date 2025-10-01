import React from 'react';
import { useSession } from '../../../contexts/SessionContext';

const DashboardHeader = () => {
    const { user } = useSession();

    return (
        <div className="dashboard-header">
            <div className="welcome-section">
                <div className="welcome-card">
                    <div className="welcome-profile">
                        <div className="profile-avatar">
                            <div className="profile-icon">
                                <i className="bi bi-person-circle"></i>
                            </div>
                        </div>
                        <div className="welcome-content">
                            <h1 className="welcome-title">안녕하세요, {user?.name || '관리자'}님!</h1>
                            <p className="welcome-message">
                                {new Date().getHours() < 12 ? '좋은 아침입니다' : 
                                 new Date().getHours() < 18 ? '좋은 오후입니다' : '좋은 저녁입니다'}
                            </p>
                            <p className="welcome-time">
                                {new Date().toLocaleDateString('ko-KR', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    weekday: 'long'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
