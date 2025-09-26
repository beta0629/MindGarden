import React, { useState, useEffect, useCallback } from 'react';
import { 
    Card, Row, Col, Button, FormSelect, 
    Alert, Badge, ProgressBar
} from 'react-bootstrap';
import { 
    FaChartBar, FaUsers, FaUserTie, FaUser, FaCrown,
    FaCalendarAlt, FaDollarSign, FaArrowUp, FaArrowDown,
    FaClock, FaPercentage, FaTrophy, FaBuilding
} from 'react-icons/fa';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import { getCommonCodes } from '../../utils/commonCodeUtils';
import LoadingSpinner from '../common/LoadingSpinner';
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
                console.error('공통코드 옵션 로드 실패:', error);
                showNotification('통계 옵션을 불러오는데 실패했습니다.', 'error');
            }
        };
        
        loadOptions();
    }, []);

    // 데이터 로드
    const loadStatisticsData = useCallback(async () => {
        setLoading(true);
        try {
            const [branchesRes, overallRes, comparisonRes, trendRes] = await Promise.all([
                apiGet('/api/hq/branches'),
                apiGet(`/api/hq/statistics/overall?period=${selectedPeriod}`),
                apiGet(`/api/hq/statistics/comparison?period=${selectedPeriod}`),
                apiGet(`/api/hq/statistics/trend?period=${selectedPeriod}&metric=${selectedMetric}`)
            ]);
            
            setBranches(branchesRes.data || []);
            setOverallStats(overallRes || {});
            setBranchComparison(comparisonRes.data || []);
            setTrendData(trendRes || {});
        } catch (error) {
            console.error('통계 데이터 로드 실패:', error);
            showNotification('통계 데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, selectedMetric]);

    // 컴포넌트 마운트 및 의존성 변경 시 데이터 로드
    useEffect(() => {
        loadStatisticsData();
    }, [loadStatisticsData]);

    // 지점 선택 핸들러
    const handleBranchSelect = (branchId) => {
        if (onBranchSelect) {
            onBranchSelect(branchId);
        }
    };

    // 성과 지표 계산
    const calculatePerformanceMetrics = (branch) => {
        const totalUsers = branch.totalUsers || 0;
        const activeUsers = branch.activeUsers || 0;
        const consultations = branch.totalConsultations || 0;
        const revenue = branch.totalRevenue || 0;
        
        return {
            userGrowth: branch.userGrowth || 0,
            consultationGrowth: branch.consultationGrowth || 0,
            revenueGrowth: branch.revenueGrowth || 0,
            userRetention: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
            avgConsultationPerUser: totalUsers > 0 ? consultations / totalUsers : 0,
            revenuePerUser: totalUsers > 0 ? revenue / totalUsers : 0
        };
    };

    // 성과 순위 계산
    const getPerformanceRank = (branchId, metric) => {
        const sortedBranches = [...branchComparison]
            .sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
        
        const rank = sortedBranches.findIndex(b => b.id === branchId) + 1;
        return rank || '-';
    };

    // 트렌드 방향 아이콘
    const getTrendIcon = (value) => {
        if (value > 0) {
            return <FaArrowUp className="text-success" />;
        } else if (value < 0) {
            return <FaArrowDown className="text-danger" />;
        }
        return <span className="text-muted">-</span>;
    };

    // 성과 등급 계산
    const getPerformanceGrade = (rank, total) => {
        const percentage = (rank / total) * 100;
        if (percentage <= 20) return { grade: 'A+', color: 'success', label: '우수' };
        if (percentage <= 40) return { grade: 'A', color: 'primary', label: '양호' };
        if (percentage <= 60) return { grade: 'B', color: 'warning', label: '보통' };
        if (percentage <= 80) return { grade: 'C', color: 'info', label: '개선필요' };
        return { grade: 'D', color: 'danger', label: '미흡' };
    };

    if (loading) {
        return (
            <div className="branch-statistics-dashboard">
                <div className="text-center py-5">
                    <LoadingSpinner text="통계 데이터를 불러오는 중..." size="large" />
                </div>
            </div>
        );
    }

    return (
        <div className="branch-statistics-dashboard">
            {/* 헤더 및 필터 */}
            <Card className="dashboard-header">
                <Card.Header>
                    <Row className="align-items-center">
                        <Col>
                            <h4 className="mb-1">
                                <FaChartBar className="me-2" />
                                지점별 통계 대시보드
                            </h4>
                            <p className="text-muted mb-0">
                                전체 지점의 성과를 분석하고 비교합니다
                            </p>
                        </Col>
                        <Col xs="auto">
                            <div className="d-flex gap-2">
                                <FormSelect
                                    size="sm"
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="filter-select"
                                >
                                    {statsPeriodOptions.map(option => (
                                        <option key={option.codeValue} value={option.codeValue}>
                                            {option.codeName}
                                        </option>
                                    ))}
                                </FormSelect>
                                <FormSelect
                                    size="sm"
                                    value={selectedMetric}
                                    onChange={(e) => setSelectedMetric(e.target.value)}
                                    className="filter-select"
                                >
                                    {statsMetricOptions.map(option => (
                                        <option key={option.codeValue} value={option.codeValue}>
                                            {option.codeName}
                                        </option>
                                    ))}
                                </FormSelect>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={loadStatisticsData}
                                    className="refresh-btn"
                                >
                                    새로고침
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Header>
            </Card>

            {/* 전체 통계 요약 */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="stat-summary-card">
                        <Card.Body>
                            <div className="stat-icon total-users">
                                <FaUsers />
                            </div>
                            <div className="stat-content">
                                <h3>{overallStats.totalUsers || 0}</h3>
                                <p>전체 사용자</p>
                                <div className="stat-change">
                                    {getTrendIcon(overallStats.userGrowth)}
                                    <span className={overallStats.userGrowth >= 0 ? 'text-success' : 'text-danger'}>
                                        {Math.abs(overallStats.userGrowth || 0)}%
                                    </span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="stat-summary-card">
                        <Card.Body>
                            <div className="stat-icon total-branches">
                                <FaBuilding />
                            </div>
                            <div className="stat-content">
                                <h3>{overallStats.totalBranches || 0}</h3>
                                <p>활성 지점</p>
                                <div className="stat-change">
                                    {getTrendIcon(overallStats.branchGrowth)}
                                    <span className={overallStats.branchGrowth >= 0 ? 'text-success' : 'text-danger'}>
                                        {Math.abs(overallStats.branchGrowth || 0)}%
                                    </span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="stat-summary-card">
                        <Card.Body>
                            <div className="stat-icon total-consultations">
                                <FaCalendarAlt />
                            </div>
                            <div className="stat-content">
                                <h3>{overallStats.totalConsultations || 0}</h3>
                                <p>총 상담 건수</p>
                                <div className="stat-change">
                                    {getTrendIcon(overallStats.consultationGrowth)}
                                    <span className={overallStats.consultationGrowth >= 0 ? 'text-success' : 'text-danger'}>
                                        {Math.abs(overallStats.consultationGrowth || 0)}%
                                    </span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="stat-summary-card">
                        <Card.Body>
                            <div className="stat-icon total-revenue">
                                <FaDollarSign />
                            </div>
                            <div className="stat-content">
                                <h3>{(overallStats.totalRevenue || 0).toLocaleString()}</h3>
                                <p>총 매출 (원)</p>
                                <div className="stat-change">
                                    {getTrendIcon(overallStats.revenueGrowth)}
                                    <span className={overallStats.revenueGrowth >= 0 ? 'text-success' : 'text-danger'}>
                                        {Math.abs(overallStats.revenueGrowth || 0)}%
                                    </span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* 지점 성과 비교 */}
            <Card className="comparison-card">
                <Card.Header>
                    <h5 className="mb-0">
                        <FaTrophy className="me-2" />
                        지점 성과 비교
                    </h5>
                </Card.Header>
                <Card.Body>
                    {branchComparison.length === 0 ? (
                        <div className="text-center py-4">
                            <FaChartBar className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                            <p className="text-muted">비교할 지점 데이터가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="branch-comparison-list">
                            {branchComparison.map((branch, index) => {
                                const metrics = calculatePerformanceMetrics(branch);
                                const userRank = getPerformanceRank(branch.id, 'totalUsers');
                                const consultationRank = getPerformanceRank(branch.id, 'totalConsultations');
                                const revenueRank = getPerformanceRank(branch.id, 'totalRevenue');
                                
                                const overallRank = Math.round((userRank + consultationRank + revenueRank) / 3);
                                const performanceGrade = getPerformanceGrade(overallRank, branchComparison.length);

                                return (
                                    <div 
                                        key={branch.id}
                                        className={`branch-comparison-item ${selectedBranchId === branch.id ? 'selected' : ''}`}
                                        onClick={() => handleBranchSelect(branch.id)}
                                    >
                                        <div className="branch-rank">
                                            <Badge 
                                                bg={performanceGrade.color}
                                                className="rank-badge"
                                            >
                                                {overallRank}위
                                            </Badge>
                                            <div className="performance-grade">
                                                <span className={`grade grade-${performanceGrade.color}`}>
                                                    {performanceGrade.grade}
                                                </span>
                                                <small className="grade-label">{performanceGrade.label}</small>
                                            </div>
                                        </div>
                                        
                                        <div className="branch-info">
                                            <h6 className="branch-name">
                                                <FaBuilding className="me-2" />
                                                {branch.name}
                                            </h6>
                                            <div className="branch-code">
                                                <code>{branch.branchCode}</code>
                                            </div>
                                            {branch.managerName && (
                                                <div className="branch-manager">
                                                    <small className="text-muted">
                                                        지점장: {branch.managerName}
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="branch-metrics">
                                            <div className="metric-row">
                                                <div className="metric-item">
                                                    <div className="metric-label">
                                                        <FaUsers className="me-1" />
                                                        사용자
                                                    </div>
                                                    <div className="metric-value">
                                                        {branch.totalUsers || 0}명
                                                        <span className="metric-rank">#{userRank}</span>
                                                    </div>
                                                    <div className="metric-trend">
                                                        {getTrendIcon(metrics.userGrowth)}
                                                        <span className={metrics.userGrowth >= 0 ? 'text-success' : 'text-danger'}>
                                                            {Math.abs(metrics.userGrowth)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="metric-item">
                                                    <div className="metric-label">
                                                        <FaCalendarAlt className="me-1" />
                                                        상담
                                                    </div>
                                                    <div className="metric-value">
                                                        {branch.totalConsultations || 0}건
                                                        <span className="metric-rank">#{consultationRank}</span>
                                                    </div>
                                                    <div className="metric-trend">
                                                        {getTrendIcon(metrics.consultationGrowth)}
                                                        <span className={metrics.consultationGrowth >= 0 ? 'text-success' : 'text-danger'}>
                                                            {Math.abs(metrics.consultationGrowth)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="metric-item">
                                                    <div className="metric-label">
                                                        <FaDollarSign className="me-1" />
                                                        매출
                                                    </div>
                                                    <div className="metric-value">
                                                        {(branch.totalRevenue || 0).toLocaleString()}원
                                                        <span className="metric-rank">#{revenueRank}</span>
                                                    </div>
                                                    <div className="metric-trend">
                                                        {getTrendIcon(metrics.revenueGrowth)}
                                                        <span className={metrics.revenueGrowth >= 0 ? 'text-success' : 'text-danger'}>
                                                            {Math.abs(metrics.revenueGrowth)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="performance-indicators">
                                                <div className="indicator">
                                                    <div className="indicator-label">
                                                        <FaPercentage className="me-1" />
                                                        사용자 유지율
                                                    </div>
                                                    <ProgressBar 
                                                        now={metrics.userRetention} 
                                                        variant={metrics.userRetention >= 80 ? 'success' : metrics.userRetention >= 60 ? 'warning' : 'danger'}
                                                        className="indicator-bar"
                                                    />
                                                    <small className="indicator-value">
                                                        {metrics.userRetention.toFixed(1)}%
                                                    </small>
                                                </div>
                                                
                                                <div className="indicator">
                                                    <div className="indicator-label">
                                                        <FaClock className="me-1" />
                                                        사용자당 상담수
                                                    </div>
                                                    <div className="indicator-value">
                                                        {metrics.avgConsultationPerUser.toFixed(1)}회
                                                    </div>
                                                </div>
                                                
                                                <div className="indicator">
                                                    <div className="indicator-label">
                                                        <FaDollarSign className="me-1" />
                                                        사용자당 매출
                                                    </div>
                                                    <div className="indicator-value">
                                                        {metrics.revenuePerUser.toLocaleString()}원
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* 트렌드 분석 */}
            {trendData && Object.keys(trendData).length > 0 && (
                <Card className="trend-card">
                    <Card.Header>
                        <h5 className="mb-0">
                            <FaChartBar className="me-2" />
                            {selectedMetric === 'userCount' ? '사용자 수' : 
                             selectedMetric === 'consultationCount' ? '상담 건수' :
                             selectedMetric === 'revenue' ? '매출' : '성장률'} 트렌드
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="trend-chart-placeholder">
                            <div className="text-center py-5">
                                <FaChartBar className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                <p className="text-muted">
                                    차트 컴포넌트는 추후 구현 예정입니다.
                                </p>
                                <p className="text-muted small">
                                    현재 선택된 지표: {selectedMetric}
                                </p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default BranchStatisticsDashboard;
