// import MGButton from '../../../components/common/MGButton'; // 임시 비활성화
/**
 * 상담 완료 통계 뷰 컴포넌트 (Presentational)
/**
 * - 순수 UI 컴포넌트
/**
 * - 비즈니스 로직 없음
/**
 * - props로 데이터와 핸들러를 받음
 */
const ConsultationCompletionStatsView = ({
    statistics,
    loading,
    error,
    selectedPeriod,
    periodOptions,
    onPeriodChange,
    onRetry,
    convertGradeToKorean,
    convertSpecialtyToKorean
}) => {
    if (loading) {
        return (
            <div className="mg-v2-loading-container">
                <div className="mg-v2-spinner"></div>
                <p>상담 완료 건수 통계를 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mg-v2-error-state">
                <p>{error}</p>
                <button className="mg-button" variant="primary" className="mg-v2-button mg-button-danger" onClick={onRetry}>
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="mg-v2-card">
            {/* 헤더 */}
            <div className="mg-v2-card-header">
                <div className="mg-v2-flex mg-justify-between mg-align-center mg-mb-md">
                    <h3 className="mg-v2-h3 mg-mb-0">
                        상담사별 상담 완료 건수
                    </h3>
                    <div className="mg-v2-flex mg-align-center mg-gap-sm">
                        <label className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary mg-font-medium">
                            기간:
                        </label>
                        <select
                            className="mg-v2-select mg-select-sm"
                            value={selectedPeriod}
                            onChange={onPeriodChange}
                        >
                            <option value="">전체</option>
                            {periodOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* 요약 정보 카드 */}
                <div className="mg-v2-stats-grid mg-mt-lg">
                    <div className="mg-v2-stat-card mg-v2-text-center">
                        <div className="mg-v2-stat-icon primary">
                            👥
                        </div>
                        <div className="mg-v2-stat-value mg-v2-color-primary mg-mb-sm">
                            {statistics.length}
                        </div>
                        <div className="mg-v2-stat-label">
                            총 상담사
                        </div>
                    </div>
                    
                    <div className="mg-v2-stat-card mg-v2-text-center">
                        <div className="mg-v2-stat-icon success">
                            ✅
                        </div>
                        <div className="mg-v2-stat-value mg-v2-color-success mg-mb-sm">
                            {statistics.reduce((sum, stat) => sum + stat.completedCount, 0)}
                        </div>
                        <div className="mg-v2-stat-label">
                            완료 건수
                        </div>
                    </div>
                    
                    <div className="mg-v2-stat-card mg-v2-text-center">
                        <div className="mg-v2-stat-icon warning">
                            📊
                        </div>
                        <div className="mg-v2-stat-value mg-v2-stat-value-warning">
                            {statistics.length > 0 
                                ? Math.round(statistics.reduce((sum, stat) => sum + stat.completedCount, 0) / statistics.length)
                                : 0
                            }
                        </div>
                        <div className="mg-v2-stat-label">
                            평균 건수
                        </div>
                    </div>
                </div>
            </div>

            {/* 상담사별 통계 카드 그리드 */}
            <div className="mg-v2-management-grid mg-mt-lg">
                {statistics.map((stat, index) => (
                    <div key={stat.consultantId} className="mg-v2-card mg-v2-card-clickable">
                        {/* 상담사 헤더 */}
                        <div className="mg-v2-flex mg-align-center mg-justify-between mg-mb-md">
                            <div className="mg-v2-consultant-header">
                                <div className={`mg-v2-consultant-rank ${index < 3 ? 'mg-v2-consultant-rank-top' : 'mg-v2-consultant-rank-normal'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="mg-v2-consultant-name">
                                        {stat.consultantName}
                                    </div>
                                    <div className="mg-v2-consultant-id">
                                        {stat.consultantPhone}
                                    </div>
                                </div>
                            </div>
                            
                            {/* 등급 배지 */}
                            <div className={`mg-v2-grade-badge ${stat.grade ? 'mg-v2-grade-badge-active' : 'mg-v2-grade-badge-inactive'}`}>
                                {stat.grade ? convertGradeToKorean(stat.grade) : '미설정'}
                            </div>
                        </div>

                        {/* 전문분야 */}
                        <div className="mg-v2-specialty-section">
                            <div className="mg-v2-specialty-label">
                                전문분야
                            </div>
                            <div className="mg-v2-specialty-content">
                                {stat.specialization ? convertSpecialtyToKorean(stat.specialization) : '미설정'}
                            </div>
                        </div>

                        {/* 통계 정보 */}
                        <div className="mg-v2-stats-grid">
                            <div className="mg-v2-stat-item">
                                <div className="mg-v2-stat-number mg-v2-stat-number-success">
                                    {stat.completedCount}
                                </div>
                                <div className="mg-v2-stat-label">
                                    완료 건수
                                </div>
                            </div>
                            
                            <div className="mg-v2-text-center">
                                <div className="mg-v2-stat-number mg-v2-stat-number-secondary">
                                    {stat.totalCount}
                                </div>
                                <div className="mg-v2-text-xs mg-v2-text-secondary mg-v2-font-weight-medium">
                                    총 건수
                                </div>
                            </div>
                            
                            <div className="mg-v2-stat-item">
                                <div className={`mg-v2-stat-number mg-v2-stat-number-rate ${stat.completionRate >= 80 ? 'mg-v2-stat-number-success' : 
                                           stat.completionRate >= 60 ? 'mg-v2-stat-number-warning' : 'mg-v2-stat-number-danger'}`}>
                                    {stat.completionRate}%
                                </div>
                                <div className="mg-v2-stat-label">
                                    완료율
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {statistics.length === 0 && (
                <div className="mg-v2-card mg-v2-text-center mg-v2-pt-xl mg-v2-px-xxl mg-v2-mt-md">
                    <div className="mg-v2-empty-state-icon mg-v2-empty-state-icon-large">
                        📊
                    </div>
                    <h3 className="mg-v2-empty-title">
                        상담 완료 건수 데이터가 없습니다
                    </h3>
                    <p className="mg-v2-empty-description">
                        상담사들이 상담을 완료하면 여기에 통계가 표시됩니다.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ConsultationCompletionStatsView;

