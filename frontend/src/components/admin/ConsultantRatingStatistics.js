import { useState, useEffect } from 'react';
import ConsultantRatingStatisticsView from '../ui/Statistics/ConsultantRatingStatisticsView';
import { API_BASE_URL } from '../../constants/api';
import './ConsultantRatingStatistics.css';

/**
 * 상담사 평가 통계 컨테이너 컴포넌트
 * - 비즈니스 로직만 담당
 * - 상태 관리, 데이터 로드
 * - Presentational 컴포넌트에 데이터 전달
 * 
 * @author MindGarden
 * @version 2.0.0 (Presentational/Container 분리)
 * @since 2025-09-17
 */
const ConsultantRatingStatistics = () => {
    // ========== 상태 관리 ==========
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState({
        totalRatings: 0,
        averageScore: 0,
        topConsultants: [],
        recentTrends: []
    });

    // ========== 데이터 로드 ==========
    const loadRatingStatistics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/consultant-rating-stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setStatistics(result.data);
                }
            }
        } catch (error) {
            console.error('평가 통계 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    // ========== 효과 ==========
    useEffect(() => {
        loadRatingStatistics();
    }, []);

    // ========== 렌더링 (Presentational 컴포넌트 사용) ==========
    return (
        <ConsultantRatingStatisticsView
            statistics={statistics}
            loading={loading}
        />
    );
};

export default ConsultantRatingStatistics;
