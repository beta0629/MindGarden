import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { 
    FaChartLine, FaArrowLeft, FaDownload, FaFilter, FaCalendarAlt,
    FaFileAlt, FaPrint, FaEnvelope, FaBuilding, FaChartBar,
    FaArrowUp, FaArrowDown, FaDollarSign, FaPercentage
} from 'react-icons/fa';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import { showNotification } from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import Chart from '../common/Chart';
import './FinancialReports.css';

/**
 * 재무 보고서 필터 컴포넌트
 */
const ReportFilterCard = ({
    reportPeriod,
    onPeriodChange,
    activeTab,
    onLoadData
}) => {
    return (
        <div className="financial-reports-section">
            <div className="financial-reports-card">
                <div className="financial-reports-card-content">
                    <div className="financial-reports-card-grid">
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                연도
                            </label>
                            <select 
                                value={reportPeriod.year}
                                onChange={(e) => onPeriodChange({ ...reportPeriod, year: parseInt(e.target.value) })}
                                style={{
                                    width: '100%',
                                    padding: '0.375rem 0.75rem',
                                    fontSize: '1rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                {[2023, 2024, 2025].map(year => (
                                    <option key={year} value={year}>{year}년</option>
                                ))}
                            </select>
                        </div>
                        {activeTab === 'monthly' && (
                            <div>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '0.5rem', 
                                    fontWeight: '500',
                                    color: '#495057'
                                }}>
                                    월
                                </label>
                                <select 
                                    value={reportPeriod.month}
                                    onChange={(e) => onPeriodChange({ ...reportPeriod, month: parseInt(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.375rem 0.75rem',
                                        fontSize: '1rem',
                                        border: '1px solid #ced4da',
                                        borderRadius: '0.375rem',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                                        <option key={month} value={month}>{month}월</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                &nbsp;
                            </label>
                            <button 
                                onClick={onLoadData}
                                style={{
                                    width: '100%',
                                    padding: '0.375rem 0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'white',
                                    backgroundColor: '#0d6efd',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <FaFilter />
                                조회
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * 재무 보고서 컴포넌트
 * 월별/연별 재무 리포트를 생성하고 관리하는 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const FinancialReports = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn } = useSession();
    
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('monthly');
    const [reportPeriod, setReportPeriod] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1 // 현재 월 (9월)
    });
    
    // 데이터가 있는 월을 자동으로 감지하는 함수
    const detectDataMonth = async () => {
        try {
            // 최근 3개월 데이터 확인
            const currentDate = new Date();
            for (let i = 0; i < 3; i++) {
                const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const year = checkDate.getFullYear();
                const month = checkDate.getMonth() + 1;
                
                console.log(`📊 ${year}년 ${month}월 데이터 확인 중...`);
                
                // 간단한 API 호출로 데이터 존재 여부 확인
                const testResponse = await apiGet(`/api/hq/erp/reports?year=${year}&month=${month}`);
                if (testResponse.data && testResponse.data.totalIncome > 0) {
                    console.log(`✅ ${year}년 ${month}월에 데이터 발견!`);
                    setReportPeriod({ year, month });
                    return;
                }
            }
            console.log('⚠️ 최근 3개월에 데이터가 없습니다.');
        } catch (error) {
            console.error('❌ 데이터 월 감지 실패:', error);
        }
    };
    
    const [reportData, setReportData] = useState({
        monthly: {
            summary: {
                totalRevenue: 0,
                totalExpense: 0,
                netProfit: 0,
                profitMargin: 0,
                transactionCount: 0
            },
            branchPerformance: [],
            categoryAnalysis: [],
            trends: []
        },
        yearly: {
            summary: {
                totalRevenue: 0,
                totalExpense: 0,
                netProfit: 0,
                profitMargin: 0,
                transactionCount: 0
            },
            monthlyBreakdown: [],
            branchComparison: [],
            growthAnalysis: []
        }
    });

    // 권한 확인
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { replace: true });
            return;
        }

        if (!user || !['HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER'].includes(user.role)) {
            showNotification('접근 권한이 없습니다.', 'error');
            navigate('/dashboard', { replace: true });
            return;
        }

        loadReportData();
    }, [isLoggedIn, user, navigate, reportPeriod, activeTab]);

    // 보고서 데이터 로드
    const loadReportData = useCallback(async () => {
        setLoading(true);
        try {
            console.log('📊 재무 보고서 데이터 로드 시작');

            // 지점 목록 로드
            const branchesResponse = await apiGet('/api/hq/branches');
            const branches = branchesResponse.data || [];

            if (activeTab === 'monthly') {
                await loadMonthlyReport(branches);
            } else {
                await loadYearlyReport(branches);
            }

            console.log('✅ 재무 보고서 데이터 로드 완료');

        } catch (error) {
            console.error('❌ 재무 보고서 데이터 로드 실패:', error);
            showNotification('데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [reportPeriod, activeTab]);

    // 월별 보고서 데이터 로드
    const loadMonthlyReport = async (branches) => {
        console.log('📊 월별 보고서 데이터 로드 시작');
        
        try {
            // 월별 보고서 API 호출
            const reportResponse = await apiGet(
                `/api/hq/erp/reports?reportType=monthly&period=${reportPeriod.year}-${String(reportPeriod.month).padStart(2, '0')}`
            );
            
            console.log('📊 월별 보고서 API 응답:', reportResponse);
            
            // API 응답에서 데이터 추출
            const responseData = reportResponse.data?.data || reportResponse.data;
            console.log('📊 추출된 월별 데이터:', responseData);
            
            // API 응답 구조에 맞게 데이터 추출
            const reportData = responseData?.reportData || [];
            console.log('📊 reportData:', reportData);
            
            // 전체 요약 데이터 (첫 번째 리포트 데이터 사용)
            const firstReport = reportData[0] || {};
            const totalRevenue = firstReport?.totalRevenue || 0;
            const totalExpense = firstReport?.totalExpenses || 0;
            const totalTransactions = firstReport?.totalTransactions || 0;
            const netProfit = firstReport?.netProfit || 0;
            const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
            
            console.log('📊 월별 전체 요약:', {
                totalRevenue,
                totalExpense,
                netProfit,
                profitMargin,
                totalTransactions
            });
            
            // 지점별 데이터 처리 (현재는 전체 데이터를 하나의 지점으로 처리)
            const branchPerformance = [];
            
            if (reportData.length > 0) {
                const report = reportData[0];
                branchPerformance.push({
                    branchCode: 'ALL',
                    branchName: '전체',
                    revenue: report.totalRevenue || 0,
                    expense: report.totalExpenses || 0,
                    profit: report.netProfit || 0,
                    transactionCount: report.totalTransactions || 0,
                    profitMargin: profitMargin,
                    categoryBreakdown: {} // 카테고리별 데이터는 별도 처리 필요
                });
            }
            
            console.log('📊 변환된 지점별 데이터:', branchPerformance);

            // 카테고리별 지출 분석 데이터 처리 및 변환
            const rawCategoryAnalysis = responseData?.categoryAnalysis || [];
            const categoryAnalysis = rawCategoryAnalysis.map(item => {
                const totalExpense = firstReport?.totalExpenses || 0;
                const percentage = totalExpense > 0 ? (item.totalAmount / totalExpense) * 100 : 0;
                return {
                    category: getCategoryKoreanName(item.category),
                    originalCategory: item.category,
                    amount: item.totalAmount,
                    percentage: Math.round(percentage * 100) / 100,
                    transactionCount: item.transactionCount,
                    avgAmount: item.avgAmount,
                    trend: 'stable' // 기본값
                };
            });
            
            // 월별 일별 트렌드 데이터 생성 (간단한 예시)
            const trends = [];
            if (branchPerformance.length > 0) {
                // 해당 월의 일수 계산
                const daysInMonth = new Date(reportPeriod.year, reportPeriod.month, 0).getDate();
                
                // 각 일별로 데이터 생성 (평균 분산)
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayRevenue = totalRevenue > 0 ? Math.floor(totalRevenue / daysInMonth) : 0;
                    const dayExpense = totalExpense > 0 ? Math.floor(totalExpense / daysInMonth) : 0;
                    
                    if (dayRevenue > 0 || dayExpense > 0) {
                        trends.push({
                            day: `${day}일`,
                            revenue: dayRevenue,
                            expense: dayExpense
                        });
                    }
                }
                
                // 데이터가 없는 경우 기본 데이터 생성
                if (trends.length === 0) {
                    trends.push({
                        day: '1일',
                        revenue: totalRevenue,
                        expense: totalExpense
                    });
                }
            }
            
            console.log('📊 월별 trends 데이터 생성:', trends);

            setReportData(prev => ({
                ...prev,
                monthly: {
                    summary: {
                        totalRevenue,
                        totalExpense,
                        netProfit,
                        profitMargin,
                        transactionCount: totalTransactions
                    },
                    branchPerformance,
                    categoryAnalysis,
                    trends
                }
            }));
            
        } catch (error) {
            console.error('❌ 월별 보고서 데이터 로드 실패:', error);
            showNotification('월별 보고서 데이터를 불러오는데 실패했습니다.', 'error');
        }
    };

    // 연별 보고서 데이터 로드
    const loadYearlyReport = async (branches) => {
        console.log('📊 연별 보고서 데이터 로드 시작');
        
        try {
            // 연별 보고서 API 호출
            const reportResponse = await apiGet(
                `/api/hq/erp/reports?reportType=yearly&period=${reportPeriod.year}`
            );
            
            console.log('📊 연별 보고서 API 응답:', reportResponse);
            
            // API 응답에서 데이터 추출
            const responseData = reportResponse.data?.data || reportResponse.data;
            console.log('📊 추출된 연별 데이터:', responseData);
            
            // API 응답 구조에 맞게 데이터 추출
            const reportData = responseData?.reportData || [];
            console.log('📊 reportData:', reportData);
            
            // 전체 요약 데이터 (첫 번째 리포트 데이터 사용)
            const firstReport = reportData[0] || {};
            const totalRevenue = firstReport?.totalRevenue || 0;
            const totalExpense = firstReport?.totalExpenses || 0;
            const totalTransactions = firstReport?.totalTransactions || 0;
            const netProfit = firstReport?.netProfit || 0;
            const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
            
            console.log('📊 연별 전체 요약:', {
                totalRevenue,
                totalExpense,
                netProfit,
                profitMargin,
                totalTransactions
            });
            
            // 지점별 데이터 처리 (현재는 전체 데이터를 하나의 지점으로 처리)
            const branchPerformance = [];
            
            if (reportData.length > 0) {
                const report = reportData[0];
                branchPerformance.push({
                    branchCode: 'ALL',
                    branchName: '전체',
                    revenue: report.totalRevenue || 0,
                    expense: report.totalExpenses || 0,
                    profit: report.netProfit || 0,
                    transactionCount: report.totalTransactions || 0,
                    profitMargin: profitMargin,
                    categoryBreakdown: {} // 카테고리별 데이터는 별도 처리 필요
                });
            }
            
            console.log('📊 변환된 지점별 데이터:', branchPerformance);

            // 월별 데이터 생성 (연별 보고서용)
            const monthlyBreakdown = [];
            if (branchPerformance.length > 0) {
                // 현재 월의 데이터를 월별 형태로 변환
                monthlyBreakdown.push({
                    month: `${reportPeriod.month}월`,
                    revenue: totalRevenue,
                    expense: totalExpense,
                    profit: totalRevenue - totalExpense,
                    transactionCount: totalTransactions
                });
            }

            // 성장률 분석 데이터 생성 (간단한 예시)
            const growthAnalysis = [];
            if (branchPerformance.length > 0) {
                branchPerformance.forEach((branch, index) => {
                    growthAnalysis.push({
                        branch: branch.branchName,
                        revenue: branch.revenue,
                        expense: branch.expense,
                        profit: branch.profit,
                        growthRate: 0, // 실제로는 전년 대비 계산 필요
                        trend: branch.profit > 0 ? 'up' : 'down', // 수익이 있으면 상승, 없으면 하락
                        percentage: branch.profit > 0 ? Math.abs(branch.profit / (branch.revenue || 1) * 100) : 0
                    });
                });
            }
            
            console.log('📊 성장률 분석 데이터 생성:', growthAnalysis);
            
            // 카테고리별 지출 분석 데이터 생성 (현재는 빈 배열로 설정)
            const categoryAnalysis = [];
            
            // 월별 데이터를 트렌드로 사용
            const trends = monthlyBreakdown.map(month => ({
                day: month.month,
                revenue: month.revenue,
                expense: month.expense
            }));
            
            console.log('📊 연별 trends 데이터 생성:', trends);

            setReportData(prev => ({
                ...prev,
                yearly: {
                    summary: {
                        totalRevenue,
                        totalExpense,
                        netProfit,
                        profitMargin,
                        transactionCount: totalTransactions
                    },
                    monthlyBreakdown,
                    branchComparison: branchPerformance,
                    growthAnalysis,
                    categoryAnalysis,
                    trends
                }
            }));
            
        } catch (error) {
            console.error('❌ 연별 보고서 데이터 로드 실패:', error);
            showNotification('연별 보고서 데이터를 불러오는데 실패했습니다.', 'error');
        }
    };


    // 카테고리 한글 매핑
    const getCategoryKoreanName = (category) => {
        const categoryMap = {
            'CONSULTATION': '상담',
            'RENT': '임대료',
            'SALARY': '급여',
            'UTILITY': '공과금',
            'MARKETING': '마케팅',
            'EQUIPMENT': '장비',
            'TRAINING': '교육',
            'INSURANCE': '보험',
            'MAINTENANCE': '유지보수',
            'OTHER': '기타'
        };
        return categoryMap[category] || category;
    };

    // 통화 포맷팅
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };


    // 보고서 다운로드
    const handleDownloadReport = () => {
        showNotification('보고서 다운로드 기능은 준비 중입니다.', 'info');
    };

    // 보고서 인쇄
    const handlePrintReport = () => {
        window.print();
    };

    // 보고서 이메일 발송
    const handleEmailReport = () => {
        showNotification('이메일 발송 기능은 준비 중입니다.', 'info');
    };

    // 차트 데이터 준비
    const getChartData = () => {
        console.log('📊 getChartData 호출됨, activeTab:', activeTab);
        console.log('📊 reportData.monthly:', reportData.monthly);
        console.log('📊 reportData.yearly:', reportData.yearly);
        
        if (activeTab === 'monthly') {
            const trends = reportData.monthly.trends || [];
            console.log('📊 월별 trends 데이터:', trends);
            console.log('📊 trends 데이터 상세:', JSON.stringify(trends, null, 2));
            if (trends.length === 0) {
                return {
                    labels: ['데이터 없음'],
                    datasets: [
                        {
                            label: '수익',
                            data: [0],
                            backgroundColor: 'var(--color-success-light, rgba(40, 167, 69, 0.2))',
                            borderColor: 'var(--color-success, #28A745)',
                            borderWidth: 2,
                            fill: true
                        },
                        {
                            label: '지출',
                            data: [0],
                            backgroundColor: 'var(--color-danger-light, rgba(220, 53, 69, 0.2))',
                            borderColor: 'var(--color-danger, #DC3545)',
                            borderWidth: 2,
                            fill: true
                        }
                    ]
                };
            }
            
            const chartData = {
                labels: trends.map(item => item.day),
                datasets: [
                    {
                        label: '일별 수익',
                        data: trends.map(item => item.revenue),
                        backgroundColor: 'rgba(40, 167, 69, 0.2)',
                        borderColor: 'rgba(40, 167, 69, 1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: '일별 지출',
                        data: trends.map(item => item.expense),
                        backgroundColor: 'rgba(220, 53, 69, 0.2)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 2,
                        fill: true
                    }
                ]
            };
            
            console.log('📊 월별 차트 데이터 반환:', chartData);
            return chartData;
        } else {
            const trends = reportData.yearly.trends || [];
            console.log('📊 연별 trends 데이터:', trends);
            console.log('📊 연별 trends 데이터 상세:', JSON.stringify(trends, null, 2));
            if (trends.length === 0) {
                return {
                    labels: ['데이터 없음'],
                    datasets: [
                        {
                            label: '수익',
                            data: [0],
                            backgroundColor: 'var(--color-success-light, rgba(40, 167, 69, 0.2))',
                            borderColor: 'var(--color-success, #28A745)',
                            borderWidth: 2,
                            fill: true
                        },
                        {
                            label: '지출',
                            data: [0],
                            backgroundColor: 'var(--color-danger-light, rgba(220, 53, 69, 0.2))',
                            borderColor: 'var(--color-danger, #DC3545)',
                            borderWidth: 2,
                            fill: true
                        }
                    ]
                };
            }
            
            const chartData = {
                labels: trends.map(item => item.day),
                datasets: [
                    {
                        label: '월별 수익',
                        data: trends.map(item => item.revenue),
                        backgroundColor: 'rgba(40, 167, 69, 0.2)',
                        borderColor: 'rgba(40, 167, 69, 1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: '월별 지출',
                        data: trends.map(item => item.expense),
                        backgroundColor: 'rgba(220, 53, 69, 0.2)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 2,
                        fill: true
                    }
                ]
            };
            
            console.log('📊 연별 차트 데이터 반환:', chartData);
            return chartData;
        }
    };

    if (loading) {
        return (
            <SimpleLayout title="재무 보고서">
                <Container fluid className="py-4">
                    <LoadingSpinner text="보고서를 생성하는 중..." size="large" />
                </Container>
            </SimpleLayout>
        );
    }

    const currentData = activeTab === 'monthly' ? reportData.monthly : reportData.yearly;

    return (
        <SimpleLayout title="재무 보고서">
            <Container fluid className="financial-reports py-4" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                {/* 헤더 */}
                <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => navigate('/hq/dashboard')}
                                    className="me-3"
                                >
                                    <FaArrowLeft className="me-2" />
                                    본사 대시보드
                                </Button>
                                <h2 className="d-inline-block mb-0">
                                    <FaChartLine className="me-2" />
                                    재무 보고서
                                </h2>
                            </div>
                            <div>
                                <Button variant="outline-info" className="me-2" onClick={handleEmailReport}>
                                    <FaEnvelope className="me-2" />
                                    이메일
                                </Button>
                                <Button variant="outline-secondary" className="me-2" onClick={handlePrintReport}>
                                    <FaPrint className="me-2" />
                                    인쇄
                                </Button>
                                <Button variant="success" onClick={handleDownloadReport}>
                                    <FaDownload className="me-2" />
                                    다운로드
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* 기간 선택 */}
                <ReportFilterCard
                    reportPeriod={reportPeriod}
                    onPeriodChange={setReportPeriod}
                    activeTab={activeTab}
                    onLoadData={loadReportData}
                />

                {/* 탭 메뉴 */}
                <Row className="mb-4">
                    <Col>
                        <Tabs
                            activeKey={activeTab}
                            onSelect={(k) => {
                                console.log('📊 탭 변경:', k);
                                setActiveTab(k);
                                if (k === 'yearly') {
                                    console.log('📊 연별 보고서 로드 시작');
                                    loadReportData();
                                }
                            }}
                            className="mb-3"
                        >
                            <Tab eventKey="monthly" title="월별 보고서">
                                {/* 월별 요약 통계 */}
                                <Row className="mb-4">
                                    <Col md={3}>
                                        <Card className="h-100 border-success">
                                            <Card.Body className="text-center">
                                                <FaArrowUp className="text-success mb-2" style={{ fontSize: '2rem' }} />
                                                <h4 className="text-success">{formatCurrency(currentData.summary.totalRevenue)}</h4>
                                                <p className="text-muted mb-0">월 총수익</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="h-100 border-danger">
                                            <Card.Body className="text-center">
                                                <FaArrowDown className="text-danger mb-2" style={{ fontSize: '2rem' }} />
                                                <h4 className="text-danger">{formatCurrency(currentData.summary.totalExpense)}</h4>
                                                <p className="text-muted mb-0">월 총지출</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="h-100 border-primary">
                                            <Card.Body className="text-center">
                                                <FaDollarSign className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                                                <h4 className={`${currentData.summary.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {formatCurrency(currentData.summary.netProfit)}
                                                </h4>
                                                <p className="text-muted mb-0">월 순이익</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="h-100 border-info">
                                            <Card.Body className="text-center">
                                                <FaPercentage className="text-info mb-2" style={{ fontSize: '2rem' }} />
                                                <h4 className={`${currentData.summary.profitMargin >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {currentData.summary.profitMargin.toFixed(1)}%
                                                </h4>
                                                <p className="text-muted mb-0">수익률</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* 일별 트렌드 차트 */}
                                <Row className="mb-4">
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                <h5 className="mb-0">
                                                    <FaChartBar className="me-2" />
                                                    일별 수익/지출 트렌드
                                                </h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Chart
                                                    type="line"
                                                    data={getChartData()}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: { position: 'top' }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                ticks: {
                                                                    callback: function(value) {
                                                                        return formatCurrency(value);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* 지점별 성과 */}
                                <Row className="mb-4">
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                <h5 className="mb-0">
                                                    <FaBuilding className="me-2" />
                                                    지점별 월간 성과
                                                </h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                    <Table striped bordered hover responsive>
                                                        <thead>
                                                            <tr>
                                                                <th>지점명</th>
                                                                <th>수익</th>
                                                                <th>지출</th>
                                                                <th>순이익</th>
                                                                <th>수익률</th>
                                                                <th>거래건수</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {currentData.branchPerformance && currentData.branchPerformance.length > 0 ? (
                                                                currentData.branchPerformance.map((branch, index) => (
                                                                    <tr key={index}>
                                                                        <td>{branch.branchName}</td>
                                                                        <td className="text-success">{formatCurrency(branch.revenue)}</td>
                                                                        <td className="text-danger">{formatCurrency(branch.expense)}</td>
                                                                        <td className={branch.profit >= 0 ? 'text-success' : 'text-danger'}>
                                                                            {formatCurrency(branch.profit)}
                                                                        </td>
                                                                        <td className={branch.profitMargin >= 0 ? 'text-success' : 'text-danger'}>
                                                                            {branch.profitMargin.toFixed(1)}%
                                                                        </td>
                                                                        <td>{branch.transactionCount}건</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center py-4 text-muted">
                                                                        지점별 성과 데이터가 없습니다.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* 카테고리별 분석 */}
                                <Row>
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                <h5 className="mb-0">
                                                    <FaChartLine className="me-2" />
                                                    카테고리별 지출 분석
                                                </h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {currentData.categoryAnalysis && currentData.categoryAnalysis.length > 0 ? (
                                                    <Row>
                                                        {currentData.categoryAnalysis.map((item, index) => (
                                                            <Col key={index} md={6} lg={4} className="mb-3">
                                                                <div className="category-item p-3 border rounded">
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        <h6 className="mb-0">{item.category}</h6>
                                                                        <div>
                                                                            <Badge bg="primary" className="me-1">{item.percentage}%</Badge>
                                                                            {item.trend === 'up' && <FaArrowUp className="text-success" />}
                                                                            {item.trend === 'down' && <FaArrowDown className="text-danger" />}
                                                                            {item.trend === 'stable' && <span className="text-muted">→</span>}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-muted mb-0">{formatCurrency(item.amount)}</p>
                                                                    <div className="progress mt-2" style={{ height: '8px' }}>
                                                                        <div 
                                                                            className="progress-bar" 
                                                                            style={{ width: `${item.percentage}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                                        <h5 className="text-muted">분석 데이터가 없습니다</h5>
                                                        <p className="text-muted">카테고리별 지출 분석 데이터가 없습니다.</p>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab>

                            <Tab eventKey="yearly" title="연별 보고서">
                                {/* 연별 요약 통계 */}
                                <Row className="mb-4">
                                    <Col md={3}>
                                        <Card className="h-100 border-success">
                                            <Card.Body className="text-center">
                                                <FaArrowUp className="text-success mb-2" style={{ fontSize: '2rem' }} />
                                                <h4 className="text-success">{formatCurrency(currentData.summary.totalRevenue)}</h4>
                                                <p className="text-muted mb-0">연 총수익</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="h-100 border-danger">
                                            <Card.Body className="text-center">
                                                <FaArrowDown className="text-danger mb-2" style={{ fontSize: '2rem' }} />
                                                <h4 className="text-danger">{formatCurrency(currentData.summary.totalExpense)}</h4>
                                                <p className="text-muted mb-0">연 총지출</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="h-100 border-primary">
                                            <Card.Body className="text-center">
                                                <FaDollarSign className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                                                <h4 className={`${currentData.summary.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {formatCurrency(currentData.summary.netProfit)}
                                                </h4>
                                                <p className="text-muted mb-0">연 순이익</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="h-100 border-info">
                                            <Card.Body className="text-center">
                                                <FaPercentage className="text-info mb-2" style={{ fontSize: '2rem' }} />
                                                <h4 className={`${currentData.summary.profitMargin >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {currentData.summary.profitMargin.toFixed(1)}%
                                                </h4>
                                                <p className="text-muted mb-0">수익률</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* 월별 트렌드 차트 */}
                                <Row className="mb-4">
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                <h5 className="mb-0">
                                                    <FaChartBar className="me-2" />
                                                    월별 수익/지출 트렌드
                                                </h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Chart
                                                    type="line"
                                                    data={getChartData()}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: { position: 'top' }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                ticks: {
                                                                    callback: function(value) {
                                                                        return formatCurrency(value);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* 지점별 연간 비교 */}
                                <Row className="mb-4">
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                <h5 className="mb-0">
                                                    <FaBuilding className="me-2" />
                                                    지점별 연간 성과 비교
                                                </h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                    <Table striped bordered hover responsive>
                                                        <thead>
                                                            <tr>
                                                                <th>지점명</th>
                                                                <th>연간 수익</th>
                                                                <th>연간 지출</th>
                                                                <th>연간 순이익</th>
                                                                <th>연간 수익률</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {currentData.branchComparison && currentData.branchComparison.length > 0 ? (
                                                                currentData.branchComparison.map((branch, index) => (
                                                                    <tr key={index}>
                                                                        <td>{branch.branchName}</td>
                                                                        <td className="text-success">{formatCurrency(branch.revenue)}</td>
                                                                        <td className="text-danger">{formatCurrency(branch.expense)}</td>
                                                                        <td className={branch.profit >= 0 ? 'text-success' : 'text-danger'}>
                                                                            {formatCurrency(branch.profit)}
                                                                        </td>
                                                                        <td className={branch.profitMargin >= 0 ? 'text-success' : 'text-danger'}>
                                                                            {branch.profitMargin.toFixed(1)}%
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="5" className="text-center py-4 text-muted">
                                                                        지점별 비교 데이터가 없습니다.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* 성장률 분석 */}
                                <Row>
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                <h5 className="mb-0">
                                                    <FaChartLine className="me-2" />
                                                    전년 대비 성장률 분석
                                                </h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {currentData.growthAnalysis && currentData.growthAnalysis.length > 0 ? (
                                                    <Row>
                                                        {currentData.growthAnalysis.map((item, index) => (
                                                            <Col key={index} md={6} lg={3} className="mb-3">
                                                                <div className="growth-item p-3 border rounded text-center">
                                                                    <div className="mb-2">
                                                                        {item.trend === 'up' && <FaArrowUp className="text-success" style={{ fontSize: '1.5rem' }} />}
                                                                        {item.trend === 'down' && <FaArrowDown className="text-danger" style={{ fontSize: '1.5rem' }} />}
                                                                    </div>
                                                                    <h5 className={`${item.percentage >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                        {item.percentage > 0 ? '+' : ''}{item.percentage.toFixed(1)}%
                                                                    </h5>
                                                                    <h6 className="mb-1">{item.branch}</h6>
                                                                    <small className="text-muted">{item.description}</small>
                                                                </div>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                                        <h5 className="text-muted">성장률 데이터가 없습니다</h5>
                                                        <p className="text-muted">전년 대비 성장률 분석 데이터가 없습니다.</p>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab>
                        </Tabs>
                    </Col>
                </Row>
            </Container>
        </SimpleLayout>
    );
};

export default FinancialReports;
