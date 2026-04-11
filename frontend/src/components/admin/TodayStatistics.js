import { useState, useEffect, useCallback } from 'react';
import TodayStatisticsView from '../ui/Statistics/TodayStatisticsView';
import { SCHEDULE_API } from '../../constants/api';
import './TodayStatistics.css';

/**
 * 오늘의 통계 컨테이너 컴포넌트
/**
 * - 비즈니스 로직만 담당
/**
 * - 상태 관리, 데이터 로드
/**
 * - Presentational 컴포넌트에 데이터와 핸들러 전달
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0 (Presentational/Container 분리)
/**
 * @since 2024-12-19
 */
const TodayStatistics = ({ userRole, userId, onShowStatistics }) => {
    // ========== 상태 관리 ==========
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

    // ========== 데이터 로드 ==========
    const loadStatistics = useCallback(async() => {
        if (!userRole) return;
        
        setLoading(true);
        try {
            console.log('📊 오늘의 통계 로드 시작:', { userId, userRole });
            
            const response = await fetch(`${SCHEDULE_API.TODAY_STATISTICS}?userRole=${userRole}`, {
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
                
                const newStatistics = {
                    totalToday: data.totalToday || 0,
                    completedToday: data.completedToday || 0,
                    inProgressToday: data.inProgressToday || 0,
                    cancelledToday: data.cancelledToday || 0,
                    bookedToday: data.bookedToday || 0,
                    confirmedToday: data.confirmedToday || 0
                };
                
                console.log('📊 설정할 통계 데이터:', newStatistics);
                setStatistics(newStatistics);
                
                setLastUpdated(new Date());
                console.log('📊 오늘의 통계 로드 완료');
            } else {
                console.error('오늘의 통계 API 응답 오류:', response.status, response.statusText);
                setStatistics({
                    totalToday: 0,
                    completedToday: 0,
                    inProgressToday: 0,
                    cancelledToday: 0,
                    bookedToday: 0,
                    confirmedToday: 0
                });
            }
        } catch (error) {
            console.error('오늘의 통계 로드 실패:', error);
            setStatistics({
                totalToday: 0,
                completedToday: 0,
                inProgressToday: 0,
                cancelledToday: 0,
                bookedToday: 0,
                confirmedToday: 0
            });
        } finally {
            setLoading(false);
        }
    }, [userRole, userId]);

    // ========== 이벤트 핸들러 ==========
    const handleRefresh = () => {
        loadStatistics();
    };

    // ========== 효과 ==========
    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    useEffect(() => {
        const interval = setInterval(() => {
            loadStatistics();
        }, 30000); // 30초

        return () => clearInterval(interval);
    }, [loadStatistics]);

    // ========== 렌더링 (Presentational 컴포넌트 사용) ==========
    return (
        <TodayStatisticsView
            statistics={statistics}
            loading={loading}
            lastUpdated={lastUpdated}
            onShowStatistics={onShowStatistics}
            onRefresh={handleRefresh}
        />
    );
};

export default TodayStatistics;
