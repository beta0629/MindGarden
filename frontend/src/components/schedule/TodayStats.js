import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';
import './TodayStats.css';

/**
 * 오늘의 통계 컴포넌트
 * - 실제 스케줄 데이터를 기반으로 오늘의 통계 계산
 * - 총 상담, 완료, 진행중, 취소 수치 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const TodayStats = () => {
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        cancelled: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * 오늘의 통계 데이터 로드
     */
    const loadTodayStats = async () => {
        try {
            setLoading(true);
            console.log('📊 오늘의 통계 로드 시작');
            
            // 오늘 날짜
            const today = new Date().toISOString().split('T')[0];
            
            // 관리자 권한으로 모든 스케줄 조회
            const response = await apiGet(`/api/schedules?userId=0&userRole=ADMIN`);
            
            if (response && Array.isArray(response)) {
                // 오늘의 스케줄 필터링
                const todaySchedules = response.filter(schedule => 
                    schedule.date === today
                );
                
                console.log('📅 오늘의 스케줄:', todaySchedules);
                
                // 통계 계산 (영어 상태값으로 필터링)
                const statsData = {
                    total: todaySchedules.length,
                    completed: todaySchedules.filter(s => s.status === 'COMPLETED' || s.status === '완료됨').length,
                    inProgress: todaySchedules.filter(s => s.status === 'IN_PROGRESS' || s.status === '진행중').length,
                    cancelled: todaySchedules.filter(s => s.status === 'CANCELLED' || s.status === '취소됨').length
                };
                
                setStats(statsData);
                console.log('📊 오늘의 통계 계산 완료:', statsData);
            } else {
                throw new Error('스케줄 데이터를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('❌ 오늘의 통계 로드 실패:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTodayStats();
        
        // 30초마다 자동 새로고침
        const interval = setInterval(() => {
            loadTodayStats();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="stats-grid">
                <div className="stat-item loading">
                    <div className="stat-value">-</div>
                    <div className="stat-label">로딩중...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stats-grid">
                <div className="stat-item error">
                    <div className="stat-value">❌</div>
                    <div className="stat-label">오류 발생</div>
                </div>
            </div>
        );
    }

    return (
        <div className="today-stats-container">
            <div className="stats-header">
                <span>오늘의 통계</span>
                <button 
                    className="refresh-btn" 
                    onClick={loadTodayStats}
                    title="새로고침"
                >
                    🔄
                </button>
            </div>
            <div className="stats-grid">
                <div className="stat-item">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">총 상담</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{stats.completed}</div>
                    <div className="stat-label">완료</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{stats.inProgress}</div>
                    <div className="stat-label">진행중</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{stats.cancelled}</div>
                    <div className="stat-label">취소</div>
                </div>
            </div>
        </div>
    );
};

export default TodayStats;
