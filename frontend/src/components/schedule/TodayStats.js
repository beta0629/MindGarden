import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';
import UnifiedLoading from '../common/UnifiedLoading';
import { ContentKpiRow } from '../dashboard-v2/content';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import './TodayStats.css';

/**
 * 오늘의 통계 컴포넌트 (아토믹 디자인 적용)
 *
 * @author MindGarden
 * @version 2.0.0
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

    const loadTodayStats = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const response = await apiGet(`/api/schedules?userId=0&userRole=ADMIN`);
            
            if (response && response.success && Array.isArray(response.data)) {
                const todaySchedules = response.data.filter(schedule => schedule.date === today);
                const statsData = {
                    total: todaySchedules.length,
                    completed: todaySchedules.filter(s => s.status === 'COMPLETED' || s.status === '완료됨').length,
                    inProgress: todaySchedules.filter(s => s.status === 'IN_PROGRESS' || s.status === '진행중').length,
                    cancelled: todaySchedules.filter(s => s.status === 'CANCELLED' || s.status === '취소됨').length
                };
                setStats(statsData);
            } else {
                throw new Error('스케줄 데이터를 가져올 수 없습니다.');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTodayStats();
        const interval = setInterval(loadTodayStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <UnifiedLoading type="inline" text="통계를 불러오는 중..." />;
    if (error) return <div className="mg-v2-text-danger">❌ {error}</div>;

    const kpiItems = [
        {
            id: 'total',
            icon: <Calendar size={24} />,
            label: '총 예약',
            value: stats.total,
            iconVariant: 'blue'
        },
        {
            id: 'completed',
            icon: <CheckCircle2 size={24} />,
            label: '상담 완료',
            value: stats.completed,
            iconVariant: 'green'
        },
        {
            id: 'inProgress',
            icon: <Clock size={24} />,
            label: '진행/대기중',
            value: stats.inProgress,
            iconVariant: 'orange'
        },
        {
            id: 'cancelled',
            icon: <XCircle size={24} />,
            label: '취소',
            value: stats.cancelled,
            iconVariant: 'gray'
        }
    ];

    return (
        <div className="today-stats-wrapper">
            <div className="mg-v2-flex mg-v2-justify-end mg-v2-mb-md">
                <button 
                    className="mg-v2-btn-icon mg-v2-text-secondary" 
                    onClick={loadTodayStats}
                    title="새로고침"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    🔄 새로고침
                </button>
            </div>
            <ContentKpiRow items={kpiItems} />
        </div>
    );
};

export default TodayStats;
