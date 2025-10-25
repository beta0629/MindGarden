import { FaChartLine, FaSync } from 'react-icons/fa';

/**
 * 오늘의 통계 뷰 컴포넌트 (Presentational)
 * - 순수 UI 컴포넌트
 * - 비즈니스 로직 없음
 * - props로 데이터와 핸들러를 받음
 */
const TodayStatisticsView = ({
    statistics,
    loading,
    lastUpdated,
    onShowStatistics,
    onRefresh
}) => {
    return (
        <div className="today-statistics">
            <div className="statistics-header">
                <h3 className="statistics-title">
                    <FaChartLine className="title-icon" />
                    오늘의 통계
                </h3>
                <div className="statistics-actions">
                    <button
                        className="statistics-view-btn"
                        onClick={onShowStatistics}
                        title="전체 통계 보기"
                    >
                        <i className="bi bi-graph-up"></i>
                        통계 보기
                    </button>
                    <button 
                        className="refresh-btn"
                        onClick={onRefresh}
                        disabled={loading}
                        title="새로고침"
                    >
                        <FaSync className={loading ? 'spinning' : ''} />
                    </button>
                </div>
            </div>
            
            <div className="statistics-grid">
                <div className="stat-card total">
                    <div className="stat-number">{statistics.totalToday}</div>
                    <div className="stat-label">총 상담</div>
                </div>
                
                <div className="stat-card completed">
                    <div className="stat-number">{statistics.completedToday}</div>
                    <div className="stat-label">완료</div>
                </div>
                
                <div className="stat-card in-progress">
                    <div className="stat-number">{statistics.inProgressToday}</div>
                    <div className="stat-label">진행중</div>
                </div>
                
                <div className="stat-card cancelled">
                    <div className="stat-number">{statistics.cancelledToday}</div>
                    <div className="stat-label">취소</div>
                </div>
            </div>
            
            {lastUpdated && (
                <div className="last-updated">
                    마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                </div>
            )}
        </div>
    );
};

export default TodayStatisticsView;

