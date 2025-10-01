import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants/api';
import { useSession } from '../../contexts/SessionContext';
import './ConsultantRatingDisplay.css';

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
            <div className="consultant-rating-display">
                <div className="loading-message">
                    평가 통계를 불러오는 중...
                </div>
            </div>
        );
    }

    if (!ratingStats || ratingStats.totalRatingCount === 0) {
        return (
            <div className="consultant-rating-display">
                <h3 className="section-title">
                    💖 내담자 평가
                </h3>
                <div className="empty-state">
                    아직 받은 평가가 없습니다.
                    <br />
                    상담을 완료하면 내담자님들이 평가를 남겨주실 거예요!
                </div>
            </div>
        );
    }

    return (
        <div className="consultant-rating-display">
            {/* 섹션 헤더 */}
            <div className="section-header">
                <h3 className="section-title">
                    💖 내담자 평가
                    <span className="badge badge--primary">
                        {ratingStats.totalRatingCount}개
                    </span>
                </h3>
            </div>

            {/* 평가 통계 */}
            <div className="rating-stats-grid">
                {/* 평균 점수 */}
                <div className="rating-stat-card rating-stat-card--pink">
                    <div className="stat-value">
                        {ratingStats.averageHeartScore}
                    </div>
                    <div className="stat-label">
                        평균 하트 점수
                    </div>
                    <div className="heart-display">
                        {renderHeartScore(Math.round(ratingStats.averageHeartScore))}
                    </div>
                </div>

                {/* 총 평가 수 */}
                <div className="rating-stat-card rating-stat-card--blue">
                    <div className="stat-value">
                        {ratingStats.totalRatingCount}
                    </div>
                    <div className="stat-label">
                        총 평가 수
                    </div>
                </div>
            </div>

            {/* 점수별 분포 */}
            <div className="rating-distribution">
                <h4 className="distribution-title">
                    하트 점수 분포
                </h4>
                <div className="distribution-grid">
                    {[5, 4, 3, 2, 1].map(score => {
                        const count = ratingStats.heartScoreDistribution[score] || 0;
                        const percentage = ratingStats.totalRatingCount > 0 
                            ? Math.round((count / ratingStats.totalRatingCount) * 100) 
                            : 0;

                        return (
                            <div key={score} className="distribution-card">
                                <div className="distribution-hearts">
                                    {'💖'.repeat(score)}
                                </div>
                                <div className="distribution-count">
                                    {count}개
                                </div>
                                <div className="distribution-percentage">
                                    ({percentage}%)
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 최근 평가 */}
            {ratingStats.recentRatings && ratingStats.recentRatings.length > 0 && (
                <div>
                    <h4 className="consultant-rating-display-title">
                        최근 평가
                    </h4>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        {ratingStats.recentRatings.slice(0, 5).map(rating => (
                            <div
                                key={rating.id}
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{
                                        fontSize: 'var(--font-size-base)'
                                    }}>
                                        {renderHeartScore(rating.heartScore)}
                                    </div>
                                    <div style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: '#666'
                                    }}>
                                        {rating.clientName} • {new Date(rating.ratedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                {rating.comment && (
                                    <div style={{
                                        fontSize: 'var(--font-size-sm)',
                                        color: '#555',
                                        marginBottom: '8px',
                                        fontStyle: 'italic'
                                    }}>
                                        "{rating.comment}"
                                    </div>
                                )}
                                {rating.tags && rating.tags.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '4px'
                                    }}>
                                        {rating.tags.map(tag => (
                                            <span
                                                key={tag}
                                                style={{
                                                    backgroundColor: '#e7f3ff',
                                                    color: '#0066cc',
                                                    fontSize: 'var(--font-size-xs)',
                                                    padding: '2px 6px',
                                                    borderRadius: '10px'
                                                }}
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
    );
};

export default ConsultantRatingDisplay;
