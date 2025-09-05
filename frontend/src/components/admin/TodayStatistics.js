import React, { useState, useEffect, useCallback } from 'react';
import { FaChartLine, FaSync } from 'react-icons/fa';
import './TodayStatistics.css';

/**
 * 오늘의 통계 컴포넌트
 * 실시간으로 오늘의 스케줄 통계를 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const TodayStatistics = ({ userRole, userId, onShowStatistics }) => {
    const [statistics, setStatistics] = useState({
        totalToday: 0,
        completedToday: 0,
        inProgressToday: 0,
        cancelledToday: 0,
        bookedToday: 0,
        confirmedToday: 0
    });
    
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    /**
     * 통계 데이터 로드
     */
    const loadStatistics = useCallback(async () => {
        if (!userRole || !userId) return;
        
        setLoading(true);
        try {
            console.log('📊 오늘의 통계 로드 시작:', { userId, userRole });
            
            const response = await fetch(`/api/schedules/today/statistics?userRole=${userRole}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📊 오늘의 통계 데이터:', data);
                
                setStatistics({
                    totalToday: data.totalToday || 0,
                    completedToday: data.completedToday || 0,
                    inProgressToday: data.inProgressToday || 0,
                    cancelledToday: data.cancelledToday || 0,
                    bookedToday: data.bookedToday || 0,
                    confirmedToday: data.confirmedToday || 0
                });
                
                setLastUpdated(new Date());
                console.log('📊 오늘의 통계 로드 완료');
            } else {
                console.error('오늘의 통계 API 응답 오류:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('오늘의 통계 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [userRole, userId]);

    /**
     * 수동 새로고침
     */
    const handleRefresh = () => {
        loadStatistics();
    };

    // 컴포넌트 마운트 시 및 의존성 변경 시 통계 로드
    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    // 30초마다 자동 새로고침
    useEffect(() => {
        const interval = setInterval(() => {
            loadStatistics();
        }, 30000); // 30초

        return () => clearInterval(interval);
    }, [loadStatistics]);

    return (
        <div className="today-statistics">
            <div className="statistics-header">
                <h3 className="statistics-title">
                    <FaChartLine className="title-icon" />
                    오늘의 통계
                </h3>
                <div className="statistics-actions">
                    <button
                        className="statistics-view-btn"
                        onClick={onShowStatistics}
                        title="전체 통계 보기"
                    >
                        <i className="bi bi-graph-up"></i>
                        통계 보기
                    </button>
                    <button 
                        className="refresh-btn"
                        onClick={handleRefresh}
                        disabled={loading}
                        title="새로고침"
                    >
                        <FaSync className={loading ? 'spinning' : ''} />
                    </button>
                </div>
            </div>
            
            <div className="statistics-grid">
                <div className="stat-card total">
                    <div className="stat-number">{statistics.totalToday}</div>
                    <div className="stat-label">총 상담</div>
                </div>
                
                <div className="stat-card completed">
                    <div className="stat-number">{statistics.completedToday}</div>
                    <div className="stat-label">완료</div>
                </div>
                
                <div className="stat-card in-progress">
                    <div className="stat-number">{statistics.inProgressToday}</div>
                    <div className="stat-label">진행중</div>
                </div>
                
                <div className="stat-card cancelled">
                    <div className="stat-number">{statistics.cancelledToday}</div>
                    <div className="stat-label">취소</div>
                </div>
            </div>
            
            {lastUpdated && (
                <div className="last-updated">
                    마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                </div>
            )}
        </div>
    );
};

export default TodayStatistics;
