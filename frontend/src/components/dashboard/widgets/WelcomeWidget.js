import React, { useState, useEffect } from 'react';
import { useSession } from '../../../contexts/SessionContext';
import MGButton from '../../common/MGButton';
import Avatar from '../../common/Avatar';
import './WelcomeWidget.css';

/**
 * 환영 위젯 컴포넌트
/**
 * - 사용자 환영 메시지
/**
 * - 오늘의 할 일 요약
/**
 * - 빠른 액션 버튼
 */
const WelcomeWidget = ({ config }) => {
    const { user } = useSession();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayStats, setTodayStats] = useState({
        pendingTasks: 5,
        newMessages: 3,
        upcomingSessions: 2
    });

    // 현재 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // 1분마다 업데이트

        return () => clearInterval(timer);
    }, []);

    // 시간대별 인사말
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return '좋은 아침입니다';
        if (hour < 18) return '좋은 오후입니다';
        return '좋은 저녁입니다';
    };

    // 날짜 포맷
    const getFormattedDate = () => {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        return currentTime.toLocaleDateString('ko-KR', options);
    };

    return (
        <div className="welcome-widget">
            {/* 헤더 섹션 */}
            <div className="welcome-header">
                <div className="greeting-section">
                    <h2 className="greeting-text">{getGreeting()}, {user?.name || '사용자'}님! 👋</h2>
                    <p className="date-text">{getFormattedDate()}</p>
                </div>
                <div className="user-avatar">
                    <Avatar
                        profileImageUrl={user?.profileImageUrl || user?.avatar}
                        displayName={user?.name || '사용자'}
                        className="avatar-circle"
                    />
                </div>
            </div>

            {/* 오늘의 요약 */}
            <div className="today-summary">
                <h3 className="summary-title">오늘의 할 일</h3>
                <div className="summary-cards">
                    <div className="summary-card pending">
                        <div className="card-icon">📋</div>
                        <div className="card-content">
                            <span className="card-number">{todayStats.pendingTasks}</span>
                            <span className="card-label">대기 중인 작업</span>
                        </div>
                    </div>
                    <div className="summary-card messages">
                        <div className="card-icon">💬</div>
                        <div className="card-content">
                            <span className="card-number">{todayStats.newMessages}</span>
                            <span className="card-label">새 메시지</span>
                        </div>
                    </div>
                    <div className="summary-card sessions">
                        <div className="card-icon">📅</div>
                        <div className="card-content">
                            <span className="card-number">{todayStats.upcomingSessions}</span>
                            <span className="card-label">예정된 일정</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 빠른 액션 */}
            <div className="quick-actions">
                <h3 className="actions-title">빠른 작업</h3>
                <div className="action-buttons">
                    <MGButton 
                        variant="primary"
                        className="action-btn primary"
                        preventDoubleClick={true}
                    >
                        <span className="btn-icon">➕</span>
                        <span className="btn-text">새 상담 등록</span>
                    </MGButton>
                    <MGButton 
                        variant="secondary"
                        className="action-btn secondary"
                        preventDoubleClick={true}
                    >
                        <span className="btn-icon">📊</span>
                        <span className="btn-text">통계 보기</span>
                    </MGButton>
                    <MGButton 
                        variant="secondary"
                        className="action-btn secondary"
                        preventDoubleClick={true}
                    >
                        <span className="btn-icon">⚙️</span>
                        <span className="btn-text">설정</span>
                    </MGButton>
                </div>
            </div>

            {/* 최근 활동 알림 */}
            <div className="recent-activity">
                <div className="activity-item">
                    <span className="activity-icon">🔔</span>
                    <span className="activity-text">새로운 상담 요청이 2건 있습니다.</span>
                </div>
            </div>
        </div>
    );
};

export default WelcomeWidget;
