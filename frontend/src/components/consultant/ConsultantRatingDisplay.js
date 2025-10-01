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
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px'
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    평가 통계를 불러오는 중...
                </div>
            </div>
        );
    }

    if (!ratingStats || ratingStats.totalRatingCount === 0) {
        return (
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px'
            }}>
                <h3 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    💖 내담자 평가
                </h3>
                <div style={{
                    textAlign: 'center',
                    color: '#666',
                    padding: '20px'
                }}>
                    아직 받은 평가가 없습니다.
                    <br />
                    상담을 완료하면 내담자님들이 평가를 남겨주실 거예요!
                </div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
        }}>
            {/* 섹션 헤더 */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    💖 내담자 평가
                    <span style={{
                        backgroundColor: '#ffe6f0',
                        color: '#d63384',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '500',
                        padding: '2px 8px',
                        borderRadius: '12px'
                    }}>
                        {ratingStats.totalRatingCount}개
                    </span>
                </h3>
            </div>

            {/* 평가 통계 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* 평균 점수 */}
                <div style={{
                    backgroundColor: '#fff0f6',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #ffc2d6'
                }}>
                    <div style={{
                        fontSize: 'var(--font-size-xxxl)',
                        fontWeight: '700',
                        color: '#d63384',
                        marginBottom: '8px'
                    }}>
                        {ratingStats.averageHeartScore}
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '8px'
                    }}>
                        평균 하트 점수
                    </div>
                    <div style={{ fontSize: '20px' }}>
                        {renderHeartScore(Math.round(ratingStats.averageHeartScore))}
                    </div>
                </div>

                {/* 총 평가 수 */}
                <div style={{
                    backgroundColor: '#f0f9ff',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #bfdbfe'
                }}>
                    <div style={{
                        fontSize: 'var(--font-size-xxxl)',
                        fontWeight: '700',
                        color: '#0066cc',
                        marginBottom: '8px'
                    }}>
                        {ratingStats.totalRatingCount}
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        총 평가 수
                    </div>
                </div>
            </div>

            {/* 점수별 분포 */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '12px'
                }}>
                    하트 점수 분포
                </h4>
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                }}>
                    {[5, 4, 3, 2, 1].map(score => {
                        const count = ratingStats.heartScoreDistribution[score] || 0;
                        const percentage = ratingStats.totalRatingCount > 0 
                            ? Math.round((count / ratingStats.totalRatingCount) * 100) 
                            : 0;

                        return (
                            <div
                                key={score}
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    minWidth: '80px',
                                    border: '1px solid #e9ecef'
                                }}
                            >
                                <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                                    {'💖'.repeat(score)}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#333'
                                }}>
                                    {count}개
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: '#666'
                                }}>
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
                    <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '12px'
                    }}>
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
                                        fontSize: '16px'
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
                                        fontSize: '13px',
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
                                                    fontSize: '11px',
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
