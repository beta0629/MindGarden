import React, { useState, useEffect, useCallback } from 'react';
import MGButton from '../common/MGButton';
import { 
    FaUsers, FaUserTie, FaUser, FaChartBar, FaChartLine,
    FaBuilding, FaDollarSign, FaArrowUp, FaArrowDown,
    FaPercentage, FaTrophy, FaCalendarAlt, FaClock
} from 'react-icons/fa';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import UnifiedLoading from '../common/UnifiedLoading';
import Chart from '../common/Chart';
import './StatisticsDashboard.css';

/**
 * 통계 대시보드 컴포넌트
 * - 전체 시스템 통계
 * - 사용자별 통계
 * - 성과 분석
 * - 트렌드 차트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
const StatisticsDashboard = ({ userRole = 'ADMIN', userId }) => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState({
        overall: {
            totalClients: 0,
            totalConsultants: 0,
            totalSessions: 0,
            activeMappings: 0,
            completionRate: 0,
            totalRevenue: 0
        },
        trends: {
            clientGrowth: 0,
            consultantGrowth: 0,
            sessionGrowth: 0,
            revenueGrowth: 0
        },
        chartData: {
            labels: [],
            datasets: []
        },
        recentActivity: []
    });

    // 통계 데이터 로드
    const loadStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // 실제 API 호출
            const [overallStats, trendStats, chartStats, activityStats] = await Promise.all([
                apiGet('/api/admin/statistics/overall'),
                apiGet('/api/admin/statistics/trends'),
                apiGet('/api/admin/statistics/chart-data'),
                apiGet('/api/admin/statistics/recent-activity')
            ]);

            const apiData = {
                overall: overallStats.data || {
                    totalClients: 0,
                    totalConsultants: 0,
                    totalSessions: 0,
                    activeMappings: 0,
                    completionRate: 0,
                    totalRevenue: 0
                },
                trends: trendStats.data || {
                    clientGrowth: 0,
                    consultantGrowth: 0,
                    sessionGrowth: 0,
                    revenueGrowth: 0
                },
                chartData: chartStats.data || {
                    labels: [],
                    datasets: []
                },
                recentActivity: activityStats.data || []
            };
            
            setStatistics(apiData);
        } catch (err) {
            console.error('통계 API 호출 오류:', err);
            
            // API 실패 시 더미 데이터로 폴백
            const dummyData = {
                overall: {
                    totalClients: 1247,
                    totalConsultants: 89,
                    totalSessions: 3456,
                    activeMappings: 234,
                    completionRate: 87.5,
                    totalRevenue: 125000000
                },
                trends: {
                    clientGrowth: 12.5,
                    consultantGrowth: 8.3,
                    sessionGrowth: 15.7,
                    revenueGrowth: 18.2
                },
                chartData: {
                    labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
                    datasets: [{
                        label: '내담자 수',
                        data: [120, 135, 142, 158, 167, 180],
                        borderColor: 'var(--color-primary)',
                        backgroundColor: 'var(--color-primary-light)',
                        tension: 0.1
                    }, {
                        label: '상담 세션',
                        data: [280, 320, 350, 380, 420, 450],
                        borderColor: 'var(--status-success)',
                        backgroundColor: 'var(--status-success-light)',
                        tension: 0.1
                    }]
                },
                recentActivity: [
                    { type: 'client', message: '새로운 내담자 등록', time: '2분 전', icon: FaUsers },
                    { type: 'session', message: '상담 세션 완료', time: '5분 전', icon: FaChartLine },
                    { type: 'mapping', message: '새로운 매칭 생성', time: '10분 전', icon: FaUserTie },
                    { type: 'consultant', message: '상담사 승인', time: '15분 전', icon: FaUser }
                ]
            };
            
            setStatistics(dummyData);
            showNotification('API 연결 실패로 샘플 데이터를 표시합니다.', 'warning');
        } finally {
            setLoading(false);
        }
    }, []);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    // 유틸리티 함수
    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num?.toString() || '0';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    const getTrendIcon = (trend) => {
        return trend > 0 ? 
            <FaArrowUp className="stats-trend-icon stats-trend-up" /> : 
            <FaArrowDown className="stats-trend-icon stats-trend-down" />;
    };

    const getTrendColor = (trend) => {
        return trend > 0 ? 'stats-trend-positive' : 'stats-trend-negative';
    };

    if (loading) {
        return (
            <div className="statistics-dashboard-container">
                <UnifiedLoading text="통계 데이터를 불러오는 중..." size="large" type="inline" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="statistics-dashboard-container">
                <div className="statistics-error-card">
                    <div className="statistics-error-content">
                        <FaChartBar className="statistics-error-icon" />
                        <h3 className="statistics-error-title">오류 발생</h3>
                        <p className="statistics-error-message">{error}</p>
                        <MGButton variant="primary" className="statistics-retry-btn" onClick={loadStatistics}>다시 시도
                        </MGButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="statistics-dashboard-container">
            {/* 헤더 */}
            <div className="statistics-header">
                <div className="statistics-title-section">
                    <h1 className="statistics-title">
                        <FaChartBar className="statistics-title-icon" />
                        통계 대시보드
                    </h1>
                    <p className="statistics-subtitle">전체 시스템 현황 및 성과 분석</p>
                </div>
                <div className="statistics-actions">
                    <button 
                        className="statistics-refresh-btn"
                        onClick={loadStatistics}
                    >
                        <FaChartBar />
                        새로고침
                    </button>
                </div>
            </div>

            {/* 주요 통계 카드 */}
            <div className="statistics-cards-grid">
                <div className="statistics-card statistics-card--primary">
                    <div className="statistics-card-header">
                        <FaUsers className="statistics-card-icon" />
                        <h3 className="statistics-card-title">총 내담자</h3>
                    </div>
                    <div className="statistics-card-body">
                        <div className="statistics-card-value">
                            {formatNumber(statistics.overall.totalClients)}
                        </div>
                        <div className="statistics-card-trend">
                            {getTrendIcon(statistics.trends.clientGrowth)}
                            <span className={getTrendColor(statistics.trends.clientGrowth)}>
                                {statistics.trends.clientGrowth}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="statistics-card statistics-card--success">
                    <div className="statistics-card-header">
                        <FaUserTie className="statistics-card-icon" />
                        <h3 className="statistics-card-title">총 상담사</h3>
                    </div>
                    <div className="statistics-card-body">
                        <div className="statistics-card-value">
                            {formatNumber(statistics.overall.totalConsultants)}
                        </div>
                        <div className="statistics-card-trend">
                            {getTrendIcon(statistics.trends.consultantGrowth)}
                            <span className={getTrendColor(statistics.trends.consultantGrowth)}>
                                {statistics.trends.consultantGrowth}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="statistics-card statistics-card--info">
                    <div className="statistics-card-header">
                        <FaChartLine className="statistics-card-icon" />
                        <h3 className="statistics-card-title">총 상담 세션</h3>
                    </div>
                    <div className="statistics-card-body">
                        <div className="statistics-card-value">
                            {formatNumber(statistics.overall.totalSessions)}
                        </div>
                        <div className="statistics-card-trend">
                            {getTrendIcon(statistics.trends.sessionGrowth)}
                            <span className={getTrendColor(statistics.trends.sessionGrowth)}>
                                {statistics.trends.sessionGrowth}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="statistics-card statistics-card--warning">
                    <div className="statistics-card-header">
                        <FaUser className="statistics-card-icon" />
                        <h3 className="statistics-card-title">활성 매칭</h3>
                    </div>
                    <div className="statistics-card-body">
                        <div className="statistics-card-value">
                            {formatNumber(statistics.overall.activeMappings)}
                        </div>
                        <div className="statistics-card-description">
                            완료율: {statistics.overall.completionRate}%
                        </div>
                    </div>
                </div>

                <div className="statistics-card statistics-card--danger">
                    <div className="statistics-card-header">
                        <FaDollarSign className="statistics-card-icon" />
                        <h3 className="statistics-card-title">총 수익</h3>
                    </div>
                    <div className="statistics-card-body">
                        <div className="statistics-card-value">
                            {formatCurrency(statistics.overall.totalRevenue)}
                        </div>
                        <div className="statistics-card-trend">
                            {getTrendIcon(statistics.trends.revenueGrowth)}
                            <span className={getTrendColor(statistics.trends.revenueGrowth)}>
                                {statistics.trends.revenueGrowth}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="statistics-card statistics-card--secondary">
                    <div className="statistics-card-header">
                        <FaTrophy className="statistics-card-icon" />
                        <h3 className="statistics-card-title">성과 지표</h3>
                    </div>
                    <div className="statistics-card-body">
                        <div className="statistics-card-value">
                            {statistics.overall.completionRate}%
                        </div>
                        <div className="statistics-card-description">
                            평균 완료율
                        </div>
                    </div>
                </div>
            </div>

            {/* 차트 섹션 */}
            <div className="statistics-chart-section">
                <div className="statistics-chart-card">
                    <div className="statistics-chart-header">
                        <h3 className="statistics-chart-title">
                            <FaChartBar className="statistics-chart-icon" />
                            월별 성장 추이
                        </h3>
                    </div>
                    <div className="statistics-chart-body">
                        <Chart
                            type="line"
                            data={statistics.chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: true,
                                        text: '월별 성장 추이'
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: function(value) {
                                                return formatNumber(value);
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* 최근 활동 */}
            <div className="statistics-activity-section">
                <div className="statistics-activity-card">
                    <div className="statistics-activity-header">
                        <h3 className="statistics-activity-title">
                            <FaClock className="statistics-activity-icon" />
                            최근 활동
                        </h3>
                    </div>
                    <div className="statistics-activity-body">
                        {statistics.recentActivity.map((activity, index) => {
                            const IconComponent = activity.icon;
                            return (
                                <div key={index} className="statistics-activity-item">
                                    <div className="statistics-activity-item-icon">
                                        <IconComponent />
                                    </div>
                                    <div className="statistics-activity-item-content">
                                        <p className="statistics-activity-item-message">
                                            {activity.message}
                                        </p>
                                        <span className="statistics-activity-item-time">
                                            {activity.time}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsDashboard;