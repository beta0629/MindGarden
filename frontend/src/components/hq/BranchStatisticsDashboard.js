import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaChartBar, FaUsers, FaUserTie, FaUser, FaCrown,
    FaCalendarAlt, FaDollarSign, FaArrowUp, FaArrowDown,
    FaClock, FaPercentage, FaTrophy, FaBuilding
} from 'react-icons/fa';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import { getCommonCodes } from '../../utils/commonCodeUtils';
import UnifiedLoading from "../common/UnifiedLoading";
import Chart from '../common/Chart';
import SimpleLayout from '../layout/SimpleLayout';
import './BranchStatisticsDashboard.css';

/**
 * 지점별 통계 대시보드 컴포넌트
 * - 전체 지점 통계 및 비교
 * - 지점별 성과 분석
 * - 트렌드 분석 및 차트
 * - 성과 순위 및 인사이트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const BranchStatisticsDashboard = ({ selectedBranchId, onBranchSelect }) => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [overallStats, setOverallStats] = useState({});
    const [branchComparison, setBranchComparison] = useState([]);
    const [trendData, setTrendData] = useState({});
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedMetric, setSelectedMetric] = useState('userCount');

    // 공통코드 옵션
    const [statsPeriodOptions, setStatsPeriodOptions] = useState([]);
    const [statsMetricOptions, setStatsMetricOptions] = useState([]);

    // 공통코드 옵션 로드
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [periods, metrics] = await Promise.all([
                    getCommonCodes('STATS_PERIOD'),
                    getCommonCodes('STATS_METRIC')
                ]);
                setStatsPeriodOptions(periods);
                setStatsMetricOptions(metrics);
            } catch (error) {
                console.error('공통코드 로드 실패:', error);
            }
        };
        loadOptions();
    }, []);

    // 통계 데이터 로드
    const loadStatistics = useCallback(async () => {
        setLoading(true);
        try {
            const [branchesRes, overallRes, comparisonRes, trendRes] = await Promise.all([
                apiGet('/api/hq/branch-management/branches'),
                apiGet('/api/hq/statistics/overall'),
                apiGet('/api/hq/statistics/branch-comparison'),
                apiGet(`/api/hq/statistics/trend?period=${selectedPeriod}&metric=${selectedMetric}`)
            ]);

            setBranches(branchesRes.data || []);
            setOverallStats(overallRes.data || {});
            setBranchComparison(comparisonRes.data || []);
            setTrendData(trendRes.data || {});
        } catch (error) {
            console.error('통계 데이터 로드 실패:', error);
            showNotification('통계 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, selectedMetric]);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    // 차트 데이터 생성
    const getChartData = () => {
        if (!trendData.labels || trendData.labels.length === 0) {
            return {
                labels: ['데이터 없음'],
                datasets: [{
                    label: '통계',
                    data: [0],
                    borderColor: 'var(--color-primary)',
                    backgroundColor: 'var(--color-primary-light)',
                    tension: 0.1
                }]
            };
        }

        return {
            labels: trendData.labels,
            datasets: [{
                label: trendData.metricName || '통계',
                data: trendData.values,
                borderColor: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-light)',
                tension: 0.1,
                fill: true
            }]
        };
    };

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
        switch (trend) {
            case 'up': return <FaArrowUp className="stats-icon-success" />;
            case 'down': return <FaArrowDown className="stats-icon-danger" />;
            default: return <span className="stats-icon-neutral">→</span>;
        }
    };

    const getTrendColor = (trend) => {
        switch (trend) {
            case 'up': return 'stats-value-success';
            case 'down': return 'stats-value-danger';
            default: return 'stats-value-neutral';
        }
    };

    if (loading) {
        return (
            <SimpleLayout title="전사 통계">
                <div className="branch-stats-container">
                    <UnifiedLoading text="통계 데이터를 불러오는 중..." size="large" type="inline" />
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="전사 통계">
            <div className="branch-stats-container">
                {/* 헤더 및 필터 */}
                <div className="branch-stats-header">
                    <div className="branch-stats-title-section">
                        <h2 className="branch-stats-title">
                            <FaChartBar className="branch-stats-icon" />
                            전사 통계 대시보드
                        </h2>
                        <p className="branch-stats-subtitle">전체 지점 통계 및 성과 분석</p>
                    </div>
                    <div className="branch-stats-filters">
                        <div className="branch-stats-filter-group">
                            <label className="branch-stats-filter-label">기간</label>
                            <select
                                className="branch-stats-filter-select"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                            >
                                {statsPeriodOptions.map(option => (
                                    <option key={option.code} value={option.code}>
                                        {option.koreanName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="branch-stats-filter-group">
                            <label className="branch-stats-filter-label">지표</label>
                            <select
                                className="branch-stats-filter-select"
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                            >
                                {statsMetricOptions.map(option => (
                                    <option key={option.code} value={option.code}>
                                        {option.koreanName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button 
                            className="branch-stats-refresh-btn"
                            onClick={loadStatistics}
                        >
                            <FaChartBar />
                            새로고침
                        </button>
                    </div>
                </div>

                {/* 전체 통계 요약 */}
                <div className="branch-stats-summary-grid">
                    <div className="branch-stats-summary-card">
                        <div className="branch-stats-summary-header">
                            <FaUsers className="branch-stats-summary-icon branch-stats-icon-primary" />
                            <h3 className="branch-stats-summary-title">전체 사용자</h3>
                        </div>
                        <div className="branch-stats-summary-body">
                            <div className="branch-stats-summary-value">
                                {formatNumber(overallStats.totalUsers || 0)}
                            </div>
                            <div className="branch-stats-summary-trend">
                                {getTrendIcon(overallStats.userTrend)}
                                <span className={getTrendColor(overallStats.userTrend)}>
                                    {overallStats.userGrowthRate || 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="branch-stats-summary-card">
                        <div className="branch-stats-summary-header">
                            <FaBuilding className="branch-stats-summary-icon branch-stats-icon-success" />
                            <h3 className="branch-stats-summary-title">활성 지점</h3>
                        </div>
                        <div className="branch-stats-summary-body">
                            <div className="branch-stats-summary-value">
                                {overallStats.activeBranches || 0}개
                            </div>
                            <div className="branch-stats-summary-trend">
                                {getTrendIcon(overallStats.branchTrend)}
                                <span className={getTrendColor(overallStats.branchTrend)}>
                                    {overallStats.branchGrowthRate || 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="branch-stats-summary-card">
                        <div className="branch-stats-summary-header">
                            <FaDollarSign className="branch-stats-summary-icon branch-stats-icon-warning" />
                            <h3 className="branch-stats-summary-title">총 수익</h3>
                        </div>
                        <div className="branch-stats-summary-body">
                            <div className="branch-stats-summary-value">
                                {formatCurrency(overallStats.totalRevenue || 0)}
                            </div>
                            <div className="branch-stats-summary-trend">
                                {getTrendIcon(overallStats.revenueTrend)}
                                <span className={getTrendColor(overallStats.revenueTrend)}>
                                    {overallStats.revenueGrowthRate || 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="branch-stats-summary-card">
                        <div className="branch-stats-summary-header">
                            <FaTrophy className="branch-stats-summary-icon branch-stats-icon-info" />
                            <h3 className="branch-stats-summary-title">평균 성과</h3>
                        </div>
                        <div className="branch-stats-summary-body">
                            <div className="branch-stats-summary-value">
                                {overallStats.averagePerformance || 0}점
                            </div>
                            <div className="branch-stats-summary-trend">
                                {getTrendIcon(overallStats.performanceTrend)}
                                <span className={getTrendColor(overallStats.performanceTrend)}>
                                    {overallStats.performanceGrowthRate || 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 트렌드 차트 */}
                <div className="branch-stats-chart-section">
                    <div className="branch-stats-chart-card">
                        <div className="branch-stats-chart-header">
                            <h3 className="branch-stats-chart-title">
                                <FaChartBar className="branch-stats-chart-icon" />
                                {selectedMetric === 'userCount' ? '사용자 수' : 
                                 selectedMetric === 'revenue' ? '수익' : 
                                 selectedMetric === 'sessions' ? '상담 세션' : '통계'} 트렌드
                            </h3>
                        </div>
                        <div className="branch-stats-chart-body">
                            <Chart
                                type="line"
                                data={getChartData()}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                        },
                                        title: {
                                            display: true,
                                            text: `${selectedPeriod === 'week' ? '주간' : 
                                                   selectedPeriod === 'month' ? '월간' : 
                                                   selectedPeriod === 'quarter' ? '분기' : '연간'} 트렌드`
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: function(value) {
                                                    return selectedMetric === 'revenue' ? 
                                                        formatCurrency(value) : 
                                                        formatNumber(value);
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* 지점별 비교 */}
                <div className="branch-stats-comparison-section">
                    <div className="branch-stats-comparison-card">
                        <div className="branch-stats-comparison-header">
                            <h3 className="branch-stats-comparison-title">
                                <FaBuilding className="branch-stats-comparison-icon" />
                                지점별 성과 비교
                            </h3>
                        </div>
                        <div className="branch-stats-comparison-body">
                            {branchComparison.length > 0 ? (
                                <div className="branch-stats-comparison-grid">
                                    {branchComparison.map((branch, index) => (
                                        <div key={branch.branchId} className="branch-stats-comparison-item">
                                            <div className="branch-stats-comparison-item-header">
                                                <div className="branch-stats-comparison-rank">
                                                    <FaTrophy className={`branch-stats-rank-icon branch-stats-rank-${index < 3 ? 'top' : 'normal'}`} />
                                                    <span className="branch-stats-rank-number">{index + 1}</span>
                                                </div>
                                                <h4 className="branch-stats-comparison-branch-name">
                                                    {branch.branchName}
                                                </h4>
                                            </div>
                                            <div className="branch-stats-comparison-item-body">
                                                <div className="branch-stats-comparison-metrics">
                                                    <div className="branch-stats-comparison-metric">
                                                        <FaUsers className="branch-stats-metric-icon" />
                                                        <span className="branch-stats-metric-label">사용자</span>
                                                        <span className="branch-stats-metric-value">
                                                            {formatNumber(branch.userCount)}
                                                        </span>
                                                    </div>
                                                    <div className="branch-stats-comparison-metric">
                                                        <FaDollarSign className="branch-stats-metric-icon" />
                                                        <span className="branch-stats-metric-label">수익</span>
                                                        <span className="branch-stats-metric-value">
                                                            {formatCurrency(branch.revenue)}
                                                        </span>
                                                    </div>
                                                    <div className="branch-stats-comparison-metric">
                                                        <FaPercentage className="branch-stats-metric-icon" />
                                                        <span className="branch-stats-metric-label">성장률</span>
                                                        <span className={`branch-stats-metric-value ${getTrendColor(branch.growthTrend)}`}>
                                                            {branch.growthRate}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="branch-stats-comparison-progress">
                                                    <div className="branch-stats-progress-bar">
                                                        <div 
                                                            className="branch-stats-progress-fill"
                                                            style={{ width: `${Math.min((branch.performance / 100) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="branch-stats-progress-text">
                                                        성과: {branch.performance}점
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="branch-stats-empty-state">
                                    <FaChartBar className="branch-stats-empty-icon" />
                                    <h4 className="branch-stats-empty-title">비교 데이터가 없습니다</h4>
                                    <p className="branch-stats-empty-description">
                                        지점별 성과 비교 데이터를 불러올 수 없습니다.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 상세 통계 테이블 */}
                <div className="branch-stats-table-section">
                    <div className="branch-stats-table-card">
                        <div className="branch-stats-table-header">
                            <h3 className="branch-stats-table-title">
                                <FaChartBar className="branch-stats-table-icon" />
                                지점별 상세 통계
                            </h3>
                        </div>
                        <div className="branch-stats-table-body">
                            <div className="branch-stats-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>지점명</th>
                                            <th>사용자 수</th>
                                            <th>수익</th>
                                            <th>성장률</th>
                                            <th>성과 점수</th>
                                            <th>상태</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branches.map((branch) => (
                                            <tr key={branch.branchId}>
                                                <td className="branch-stats-table-branch">
                                                    <FaBuilding className="branch-stats-table-icon" />
                                                    {branch.branchName}
                                                </td>
                                                <td className="branch-stats-table-users">
                                                    {formatNumber(branch.userCount || 0)}
                                                </td>
                                                <td className="branch-stats-table-revenue">
                                                    {formatCurrency(branch.revenue || 0)}
                                                </td>
                                                <td className={`branch-stats-table-growth ${getTrendColor(branch.growthTrend)}`}>
                                                    {getTrendIcon(branch.growthTrend)}
                                                    {branch.growthRate || 0}%
                                                </td>
                                                <td className="branch-stats-table-performance">
                                                    {branch.performance || 0}점
                                                </td>
                                                <td className="branch-stats-table-status">
                                                    <span className={`branch-stats-status-badge branch-stats-status-${branch.status || 'active'}`}>
                                                        {branch.status === 'active' ? '활성' : 
                                                         branch.status === 'inactive' ? '비활성' : 
                                                         branch.status === 'maintenance' ? '점검중' : '알 수 없음'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SimpleLayout>
    );
};

export default BranchStatisticsDashboard;