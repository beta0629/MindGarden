import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants/api';
import { useSession } from '../../contexts/SessionContext';

/**
 * 상담사용 평가 표시 컴포넌트
 * - 상담사가 받은 하트 평가 통계 및 목록 표시
 * - 평균 점수, 점수별 분포, 최근 평가 등
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
const ConsultantRatingDisplay = ({ consultantId }) => {
    const { user } = useSession();
    const [ratingStats, setRatingStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const targetConsultantId = consultantId || user?.id;
        if (targetConsultantId) {
            loadRatingStats(targetConsultantId);
        }
    }, [consultantId, user]);

    const loadRatingStats = async (targetConsultantId) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/ratings/consultant/${targetConsultantId}/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                setRatingStats(result.data);
            } else {
                console.error('평가 통계 조회 실패:', result.message);
            }

        } catch (error) {
            console.error('평가 통계 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderHeartScore = (score) => {
        return '💖'.repeat(score) + '🤍'.repeat(5 - score);
    };

    if (loading) {
        return (
            <div className="mg-card">
                <div className="mg-card-body">
                    <div className="mg-loading-container">
                        <div className="mg-spinner"></div>
                        <p>평가 통계를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!ratingStats || ratingStats.totalRatingCount === 0) {
        return (
            <div className="mg-card">
                <div className="mg-card-header">
                    <h3 className="mg-h4 mg-mb-0">
                        💖 내담자 평가
                    </h3>
                </div>
                <div className="mg-card-body">
                    <div className="mg-empty-state">
                        <div className="mg-empty-state__icon">💖</div>
                        <div className="mg-empty-state__text">
                            아직 받은 평가가 없습니다.
                        </div>
                        <div className="mg-empty-state__hint">
                            상담을 완료하면 내담자님들이 평가를 남겨주실 거예요!
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mg-card">
            {/* 카드 헤더 */}
            <div className="mg-card-header mg-flex mg-justify-between mg-align-center">
                <h3 className="mg-h4 mg-mb-0">
                    💖 내담자 평가
                    <span className="mg-badge mg-badge-primary mg-ml-sm">
                        {ratingStats.totalRatingCount}개
                    </span>
                </h3>
            </div>

            {/* 카드 바디 */}
            <div className="mg-card-body">
                {/* 평가 통계 그리드 */}
                <div className="mg-dashboard-stats mg-mb-lg">
                    {/* 평균 점수 */}
                    <div className="mg-dashboard-stat-card">
                        <div className="mg-dashboard-stat-icon" style={{ background: 'var(--olive-green)' }}>
                            💖
                        </div>
                        <div className="mg-dashboard-stat-content">
                            <div className="mg-dashboard-stat-value">
                                {ratingStats.averageHeartScore}
                            </div>
                            <div className="mg-dashboard-stat-label">평균 하트 점수</div>
                        </div>
                    </div>

                    {/* 총 평가 수 */}
                    <div className="mg-dashboard-stat-card">
                        <div className="mg-dashboard-stat-icon" style={{ background: 'var(--mint-green)' }}>
                            📊
                        </div>
                        <div className="mg-dashboard-stat-content">
                            <div className="mg-dashboard-stat-value">
                                {ratingStats.totalRatingCount}
                            </div>
                            <div className="mg-dashboard-stat-label">총 평가 수</div>
                        </div>
                    </div>
                </div>

                {/* 점수별 분포 */}
                <div className="mg-mb-lg">
                    <h4 className="mg-h5 mg-mb-md">
                        하트 점수 분포
                    </h4>
                    <div className="rating-distribution-grid">
                        {[5, 4, 3, 2, 1].map(score => {
                            const count = ratingStats.heartScoreDistribution[score] || 0;
                            const percentage = ratingStats.totalRatingCount > 0 
                                ? Math.round((count / ratingStats.totalRatingCount) * 100) 
                                : 0;

                            return (
                                <div key={score} className="rating-schedule-item">
                                    <div className="mg-text-center mg-mb-xs">
                                        {'💖'.repeat(score)}
                                    </div>
                                    <div className="mg-text-center mg-font-semibold">
                                        {count}개
                                    </div>
                                    <div className="mg-text-center mg-text-sm mg-color-text-secondary">
                                        ({percentage}%)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 최근 평가 */}
                {ratingStats.recentRatings && ratingStats.recentRatings.length > 0 && (
                    <div className="mg-pt-lg mg-border-top">
                        <h4 className="mg-h5 mg-mb-md">
                            최근 평가
                        </h4>
                        <div className="mg-space-y-sm recent-ratings-container">
                            {ratingStats.recentRatings.slice(0, 5).map(rating => (
                                <div
                                    key={rating.id}
                                    className="rating-schedule-item"
                                >
                                    <div className="mg-flex mg-justify-between mg-align-start mg-mb-sm">
                                        <div className="mg-text-base">
                                            {renderHeartScore(rating.heartScore)}
                                        </div>
                                        <div className="mg-text-xs mg-color-text-secondary">
                                            {rating.clientName} • {new Date(rating.ratedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    {rating.comment && (
                                        <div className="mg-text-sm mg-color-text-primary mg-mb-sm rating-comment">
                                            "{rating.comment}"
                                        </div>
                                    )}
                                    {rating.tags && rating.tags.length > 0 && (
                                        <div className="mg-flex rating-tags-wrapper">
                                            {rating.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="mg-badge mg-badge-primary"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultantRatingDisplay;
