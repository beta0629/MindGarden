import { Star, Users, TrendingUp, Award } from 'lucide-react';
import SafeText from '../../common/SafeText';

/**
 * 상담사 평가 통계 뷰 컴포넌트 (Presentational)
/**
 * - 순수 UI 컴포넌트
/**
 * - 비즈니스 로직 없음
/**
 * - props로 데이터를 받음
 */
const ConsultantRatingStatisticsView = ({ statistics, loading }) => {
    if (loading) {
        return (
            <div className="consultant-rating-statistics">
                <div className="mg-v2-loading-container">
                    <div className="mg-v2-spinner" />
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
                        <div className="rating-stat-value">{statistics.averageScore ? statistics.averageScore.toFixed(1) : '0.0'}</div>
                        <div className="rating-stat-label">평균 점수</div>
                    </div>
                </div>
                
                <div className="rating-stat-card">
                    <div className="rating-stat-icon warning">
                        <TrendingUp size={24} />
                    </div>
                    <div className="rating-stat-content">
                        <div className="rating-stat-value">
                            {statistics.recentTrends 
                                ? statistics.recentTrends.reduce((sum, trend) => sum + (trend.count || 0), 0)
                                : 0}
                        </div>
                        <div className="rating-stat-label">최근 평가 (7일)</div>
                    </div>
                </div>
                
                <div className="rating-stat-card">
                    <div className="rating-stat-icon info">
                        <Award size={24} />
                    </div>
                    <div className="rating-stat-content">
                        <div className="rating-stat-value">{statistics.topConsultants ? statistics.topConsultants.length : 0}</div>
                        <div className="rating-stat-label">우수 상담사</div>
                    </div>
                </div>
            </div>

            {/* 상담사 랭킹 */}
            {statistics.topConsultants && statistics.topConsultants.length > 0 && (
                <div className="rating-section">
                    <h4 className="section-title">
                        <Award className="section-icon" />
                        상담사 랭킹
                    </h4>
                    <div className="consultants-ranking">
                        {statistics.topConsultants.map((consultant, index) => (
                            <div key={consultant.id || `consultant-${index}`} className="consultant-rank-card">
                                <div className="rank-number">
                                    {index + 1}
                                </div>
                                <div className="consultant-info">
                                    <SafeText tag="div" className="consultant-name">{consultant.name}</SafeText>
                                    <div className="consultant-details">
                                        <span className="consultant-score">
                                            ⭐ {consultant.averageRating ? consultant.averageRating.toFixed(1) : '0.0'}
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
            {statistics.recentTrends && statistics.recentTrends.length > 0 && (
                <div className="rating-section">
                    <h4 className="section-title">
                        <TrendingUp className="section-icon" />
                        최근 평가 동향
                    </h4>
                    <div className="trends-list">
                        {statistics.recentTrends.map((trend, index) => (
                            <div key={trend.id || `trend-${index}`} className="trend-item">
                                <SafeText tag="div" className="trend-date">{trend.date}</SafeText>
                                <div className="trend-content">
                                    <SafeText tag="div" className="trend-consultant">{trend.consultantName}</SafeText>
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
                <div className="mg-v2-empty-state">
                    <div className="mg-v2-empty-state__icon">
                        <Star size={48} />
                    </div>
                    <div className="mg-v2-empty-state__text">
                        아직 평가 데이터가 없습니다
                    </div>
                    <div className="mg-v2-empty-state__hint">
                        상담사들이 평가를 받으면 통계가 표시됩니다
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantRatingStatisticsView;

