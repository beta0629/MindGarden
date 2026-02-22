import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedScheduleComponent from './UnifiedScheduleComponent';
import ConsultantStatus from './ConsultantStatus';
import TodayStats from './TodayStats';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ScheduleB0KlA.css';
import './SchedulePage.css';

/**
 * 스케줄 관리 메인 페이지
/**
 * - 역할별 스케줄 관리
/**
 * - 권한에 따른 기능 제한
/**
 * - 통합 스케줄 뷰
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const SchedulePage = ({ user: propUser }) => {
    const navigate = useNavigate();
    const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();
    const [userRole, setUserRole] = useState('CLIENT');
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    // 사용자 정보 결정 (prop > session > null)
    const displayUser = propUser || sessionUser;

    useEffect(() => {
        if (sessionLoading) {
            console.log('⏳ 세션 로딩 중...');
            return;
        }

        if (displayUser) {
            console.log('👤 SchedulePage 사용자 정보:', displayUser);
            setUserRole(displayUser.role || 'CLIENT');
            setUserId(displayUser.id);
            setLoading(false);
        } else {
            console.log('👤 SchedulePage 사용자 정보 없음');
            setLoading(false);
        }
    }, [displayUser, sessionLoading]);



/**
     * 권한 확인 (동적 권한 시스템 사용)
     */
    const hasSchedulePermission = () => {
        return hasPermission('REGISTER_SCHEDULER') || userRole === 'CONSULTANT';
    };

/**
     * 관리자 권한 확인 (동적 권한 시스템 사용)
     */
    const isAdmin = () => {
        return hasPermission('REGISTER_SCHEDULER');
    };

    if (loading || sessionLoading) {
        return (
            <SimpleLayout>
                <UnifiedLoading type="page" text="스케줄을 불러오는 중..." />
            </SimpleLayout>
        );
    }

    if (!displayUser) {
        return (
            <SimpleLayout>
                <div className="schedule-page mg-v2-ad-b0kla">
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
            </SimpleLayout>
        );
    }

    if (!hasSchedulePermission()) {
        return (
            <SimpleLayout>
                <div className="schedule-page mg-v2-ad-b0kla">
                    <div className="access-denied">
                        <div className="access-denied-icon">🚫</div>
                        <h2>접근 권한이 없습니다</h2>
                        <p>스케줄 관리 기능은 상담사 이상의 권한이 필요합니다.</p>
                        <div className="current-role">
                            현재 역할: <span className="role-badge">{userRole}</span>
                        </div>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout>
            <div className="schedule-page mg-v2-ad-b0kla">
            <div className="schedule-content">
                <div className="schedule-main">
                    <UnifiedScheduleComponent 
                        user={displayUser}
                        userRole={userRole}
                        userId={isAdmin() ? 0 : userId}
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
        </SimpleLayout>
    );
};

export default SchedulePage;
