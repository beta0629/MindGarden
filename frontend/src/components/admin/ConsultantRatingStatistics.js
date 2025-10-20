import React, { useState, useEffect } from 'react';
import { Star, Users, TrendingUp, Award } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';
import './ConsultantRatingStatistics.css';

/**
 * 관리자용 상담사 평가 통계 컴포넌트 - MindGarden 디자인 시스템 적용
 * - 전체 상담사 평가 현황 표시
 * - 평균 점수 랭킹 및 통계
 * - 최근 평가 동향 분석
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-09-17
 */
const ConsultantRatingStatistics = () => {
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState({
        totalRatings: 0,
        averageScore: 0,
        topConsultants: [],
        recentTrends: []
    });

    useEffect(() => {
        loadRatingStatistics();
    }, []);

    const loadRatingStatistics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/consultant-rating-stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
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

    if (loading) {
        return (
            <div className="consultant-rating-statistics">
                <div className="mg-loading-container">
                    <div className="mg-spinner"></div>
                    <p>평가 통계를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="consultant-rating-statistics">
            {/* 섹션 헤더 */}
            <div className="rating-header">
                <h3 className="rating-title">
                    <Star className="rating-icon" />
                    상담사 평가 통계
                </h3>
                <p className="rating-subtitle">
                    전체 상담사 평가 현황 및 만족도 지표
                </p>
            </div>

            {/* 전체 통계 요약 */}
            <div className="rating-stats-grid">
                <div className="rating-stat-card">
                    <div className="rating-stat-icon primary">
                        <Users size={24} />
                    </div>
                    <div className="rating-stat-content">
                        <div className="rating-stat-value">{statistics.totalRatings}</div>
                        <div className="rating-stat-label">총 평가 수</div>
                    </div>
                </div>
                
                <div className="rating-stat-card">
                    <div className="rating-stat-icon success">
                        <Star size={24} />
                    </div>
                    <div className="rating-stat-content">
                        <div className="rating-stat-value">{statistics.averageScore.toFixed(1)}</div>
                        <div className="rating-stat-label">평균 점수</div>
                    </div>
                </div>
                
                <div className="rating-stat-card">
                    <div className="rating-stat-icon warning">
                        <TrendingUp size={24} />
                    </div>
                    <div className="rating-stat-content">
                        <div className="rating-stat-value">{statistics.recentTrends.length}</div>
                        <div className="rating-stat-label">최근 평가</div>
                    </div>
                </div>
                
                <div className="rating-stat-card">
                    <div className="rating-stat-icon info">
                        <Award size={24} />
                    </div>
                    <div className="rating-stat-content">
                        <div className="rating-stat-value">{statistics.topConsultants.length}</div>
                        <div className="rating-stat-label">우수 상담사</div>
                    </div>
                </div>
            </div>

            {/* 상담사 랭킹 */}
            {statistics.topConsultants.length > 0 && (
                <div className="rating-section">
                    <h4 className="section-title">
                        <Award className="section-icon" />
                        상담사 랭킹
                    </h4>
                    <div className="consultants-ranking">
                        {statistics.topConsultants.map((consultant, index) => (
                            <div key={consultant.id} className="consultant-rank-card">
                                <div className="rank-number">
                                    {index + 1}
                                </div>
                                <div className="consultant-info">
                                    <div className="consultant-name">{consultant.name}</div>
                                    <div className="consultant-details">
                                        <span className="consultant-score">
                                            ⭐ {consultant.averageRating.toFixed(1)}
                                        </span>
                                        <span className="consultant-count">
                                            ({consultant.ratingCount}개 평가)
                                        </span>
                                    </div>
                                </div>
                                <div className="rank-badge">
                                    {index < 3 ? '🥇🥈🥉'[index] : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 최근 평가 동향 */}
            {statistics.recentTrends.length > 0 && (
                <div className="rating-section">
                    <h4 className="section-title">
                        <TrendingUp className="section-icon" />
                        최근 평가 동향
                    </h4>
                    <div className="trends-list">
                        {statistics.recentTrends.map((trend, index) => (
                            <div key={index} className="trend-item">
                                <div className="trend-date">{trend.date}</div>
                                <div className="trend-content">
                                    <div className="trend-consultant">{trend.consultantName}</div>
                                    <div className="trend-rating">
                                        {'⭐'.repeat(Math.floor(trend.rating))}
                                        <span className="trend-score">{trend.rating}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 평가 통계가 없는 경우 */}
            {statistics.totalRatings === 0 && (
                <div className="mg-empty-state">
                    <div className="mg-empty-state__icon">
                        <Star size={48} />
                    </div>
                    <div className="mg-empty-state__text">
                        아직 평가 데이터가 없습니다
                    </div>
                    <div className="mg-empty-state__hint">
                        상담사들이 평가를 받으면 통계가 표시됩니다
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantRatingStatistics;