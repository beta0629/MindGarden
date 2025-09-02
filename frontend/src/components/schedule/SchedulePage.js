import React, { useState, useEffect } from 'react';
import ScheduleCalendar from './ScheduleCalendar';
import ConsultantStatus from './ConsultantStatus';
import TodayStats from './TodayStats';
import notificationManager from '../../utils/notification';
import './SchedulePage.css';

/**
 * 스케줄 관리 메인 페이지
 * - 역할별 스케줄 관리
 * - 권한에 따른 기능 제한
 * - 통합 스케줄 뷰
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const SchedulePage = ({ user }) => {
    const [userRole, setUserRole] = useState('CLIENT');
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (user) {
            console.log('👤 사용자 정보:', user);
            setUserRole(user.role || 'CLIENT');
            setUserId(user.id);
            setLoading(false);
        } else {
            console.log('👤 사용자 정보 없음');
            setLoading(false);
        }
    }, [user]);



    /**
     * 권한 확인
     */
    const hasSchedulePermission = () => {
        return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'CONSULTANT';
    };

    /**
     * 관리자 권한 확인
     */
    const isAdmin = () => {
        return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    };

    if (loading) {
        return (
            <div className="schedule-page">
                <div className="loading-container">
                    <div className="loading-spinner">스케줄 정보를 불러오는 중...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="schedule-page">
                <div className="access-denied">
                    <div className="access-denied-icon">🔐</div>
                    <h2>로그인이 필요합니다</h2>
                    <p>스케줄 관리 기능을 사용하려면 로그인해주세요.</p>
                    <button 
                        className="btn schedule-page-btn-primary"
                        onClick={() => window.location.href = '/login'}
                    >
                        로그인하기
                    </button>
                </div>
            </div>
        );
    }

    if (!hasSchedulePermission()) {
        return (
            <div className="schedule-page">
                <div className="access-denied">
                    <div className="access-denied-icon">🚫</div>
                    <h2>접근 권한이 없습니다</h2>
                    <p>스케줄 관리 기능은 상담사 이상의 권한이 필요합니다.</p>
                    <div className="current-role">
                        현재 역할: <span className="role-badge">{userRole}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="schedule-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>📅 스케줄 관리</h1>
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{userRole}</span>
                    </div>
                </div>
                
                <div className="page-actions">
                    {isAdmin() && (
                        <div className="admin-actions">
                            <button className="btn schedule-page-btn-primary">
                                📊 통계 보기
                            </button>
                            <button className="btn schedule-page-btn-secondary">
                                📋 전체 스케줄
                            </button>
                        </div>
                    )}
                    
                    <div className="view-controls">
                        <button className="btn schedule-page-btn-outline">
                            🔄 새로고침
                        </button>
                    </div>
                </div>
            </div>

            <div className="schedule-content">
                <div className="schedule-main">
                    <ScheduleCalendar 
                        userRole={userRole}
                        userId={userId}
                    />
                </div>
                
                {isAdmin() && (
                    <div className="schedule-sidebar">
                        <div className="sidebar-section">
                            <h3>📈 오늘의 통계</h3>
                            <TodayStats />
                        </div>
                        
                        <div className="sidebar-section">
                            <h3>👥 상담사 현황</h3>
                            <ConsultantStatus />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchedulePage;
