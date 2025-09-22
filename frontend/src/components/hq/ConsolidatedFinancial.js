import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Form, Alert, Badge } from 'react-bootstrap';
import { 
    FaCalculator, FaArrowLeft, FaDownload, FaFilter, FaChartLine,
    FaDollarSign, FaArrowUp, FaArrowDown, FaBuilding, FaCalendarAlt
} from 'react-icons/fa';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import { showNotification } from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import Chart from '../common/Chart';
import './ConsolidatedFinancial.css';

/**
 * 통합 재무현황 컴포넌트
 * 전사 재무 데이터를 통합하여 보여주는 대시보드
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const ConsolidatedFinancial = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn } = useSession();
    
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 현재 월 1일
        endDate: new Date().toISOString().split('T')[0] // 현재 날짜
    });
    
    const [consolidatedData, setConsolidatedData] = useState({
        summary: {
            totalRevenue: 0,
            totalExpense: 0,
            netProfit: 0,
            profitMargin: 0
        },
        branchData: [],
        monthlyTrend: [],
        categoryBreakdown: []
    });

    // 권한 확인
    useEffect(() => {
        console.log('📊 ConsolidatedFinancial useEffect 실행됨');
        console.log('📊 isLoggedIn:', isLoggedIn);
        console.log('📊 user:', user);
        
        if (!isLoggedIn) {
            console.log('📊 로그인되지 않음, 로그인 페이지로 이동');
            navigate('/login', { replace: true });
            return;
        }

        if (!user || !['HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER'].includes(user.role)) {
            console.log('📊 권한 없음, 대시보드로 이동');
            showNotification('접근 권한이 없습니다.', 'error');
            navigate('/dashboard', { replace: true });
            return;
        }

        console.log('📊 권한 확인 완료, 데이터 로드 시작');
        loadConsolidatedData();
    }, [isLoggedIn, user, navigate, dateRange]);

    // 통합 재무 데이터 로드
    const loadConsolidatedData = useCallback(async () => {
        console.log('🚀 loadConsolidatedData 함수 호출됨');
        setLoading(true);
        try {
            console.log('📊 통합 재무현황 데이터 로드 시작');
            console.log('📊 현재 dateRange:', dateRange);
            console.log('📊 현재 user:', user);
            console.log('📊 날짜 범위:', dateRange.startDate, '~', dateRange.endDate);

            // 지점 목록 로드
            const branchesResponse = await apiGet('/api/hq/branch-management/branches');
            const branches = branchesResponse.data || [];

            // 각 지점별 재무 데이터 로드
            const branchFinancialData = [];
            let totalRevenue = 0;
            let totalExpense = 0;

            console.log('📊 지점별 재무 데이터 로드 시작:', branches.length, '개 지점');

            for (const branch of branches) {
                try {
                    console.log(`📊 지점 ${branch.code} 데이터 로드 중...`);
                    
                    const financialResponse = await apiGet(
                        `/api/erp/finance/dashboard?branchCode=${branch.code}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
                    );
                    
                    // 지점명을 공통코드에서 가져오기
                    const branchName = await getCodeLabel('BRANCH', branch.code);
                    
                    // API 응답 구조에 따라 financialData 추출
                    let financialData;
                    if (financialResponse.data?.data?.financialData) {
                        financialData = financialResponse.data.data.financialData;
                    } else if (financialResponse.data?.financialData) {
                        financialData = financialResponse.data.financialData;
                    } else if (financialResponse.data?.data) {
                        financialData = financialResponse.data.data;
                    } else {
                        financialData = financialResponse.data;
                    }
                    
                    console.log(`📊 지점 ${branch.code} 전체 응답:`, financialResponse);
                    console.log(`📊 지점 ${branch.code} financialData:`, financialData);
                    console.log(`📊 지점 ${branch.code} 카테고리 데이터:`, financialData?.categoryBreakdown || {});
                    
                    console.log(`📊 지점 ${branch.code} 데이터:`, {
                        revenue: financialData?.summary?.totalRevenue || 0,
                        expense: financialData?.summary?.totalExpenses || 0,
                        transactionCount: financialData?.summary?.transactionCount || 0
                    });
                    
                    const branchData = {
                        branchCode: branch.code,
                        branchName: branchName || branch.name || branch.code,
                        revenue: financialData?.summary?.totalRevenue || 0,
                        expense: financialData?.summary?.totalExpenses || 0,
                        profit: (financialData?.summary?.totalRevenue || 0) - (financialData?.summary?.totalExpenses || 0),
                        transactionCount: financialData?.summary?.transactionCount || 0,
                        categoryBreakdown: financialData?.categoryBreakdown || {}
                    };

                    branchFinancialData.push(branchData);
                    totalRevenue += branchData.revenue;
                    totalExpense += branchData.expense;
                    
                    console.log(`✅ 지점 ${branch.code} 데이터 로드 완료:`, branchData);
                } catch (error) {
                    console.error(`❌ 지점 ${branch.code} 재무 데이터 로드 실패:`, error);
                    branchFinancialData.push({
                        branchCode: branch.code,
                        branchName: branch.name,
                        revenue: 0,
                        expense: 0,
                        profit: 0,
                        transactionCount: 0
                    });
                }
            }

            console.log('📊 지점별 합계:', {
                totalRevenue,
                totalExpense,
                netProfit: totalRevenue - totalExpense
            });

            const netProfit = totalRevenue - totalExpense;
            const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

            // 카테고리별 지출 분석 데이터 생성
            const categoryBreakdown = {};
            
            // 각 지점별 데이터에서 카테고리별 지출 수집 (이미 로드된 데이터 사용)
            console.log('📊 branchFinancialData:', branchFinancialData);
            for (const branch of branchFinancialData) {
                try {
                    // 이미 로드된 지점별 데이터에서 카테고리 정보 추출
                    const branchCategoryBreakdown = branch.categoryBreakdown || {};
                    
                    console.log(`📊 지점 ${branch.branchCode} 전체 데이터:`, branch);
                    console.log(`📊 지점 ${branch.branchCode} 카테고리 데이터:`, branchCategoryBreakdown);
                    console.log(`📊 지점 ${branch.branchCode} 카테고리 데이터 키:`, Object.keys(branchCategoryBreakdown));
                    console.log(`📊 지점 ${branch.branchCode} 카테고리 데이터 값:`, Object.values(branchCategoryBreakdown));
                    
                    // 카테고리별 지출 합산
                    for (const [category, amount] of Object.entries(branchCategoryBreakdown)) {
                        console.log(`📊 카테고리 ${category}: ${amount}`);
                        if (amount > 0) {
                            categoryBreakdown[category] = (categoryBreakdown[category] || 0) + amount;
                        }
                    }
                } catch (error) {
                    console.error(`❌ 지점 ${branch.branchCode} 카테고리 데이터 처리 실패:`, error);
                }
            }
            
            console.log('📊 카테고리별 지출 합계:', categoryBreakdown);

            // 카테고리별 지출을 배열로 변환하고 비율 계산
            const categoryBreakdownArray = Object.entries(categoryBreakdown)
                .map(([category, amount]) => ({
                    category: getCategoryKoreanName(category),
                    amount: amount,
                    percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0
                }))
                .sort((a, b) => b.amount - a.amount);

            // 월별 트렌드 데이터 생성 (지점별 데이터를 지점명으로 표시)
            console.log('📊 branchFinancialData:', branchFinancialData);
            console.log('📊 branchFinancialData.length:', branchFinancialData.length);
            
            const monthlyTrend = branchFinancialData.map((branch) => ({
                month: branch.branchName,
                revenue: branch.revenue,
                expense: branch.expense
            }));
            
            console.log('📊 월별 트렌드 데이터 생성:', monthlyTrend);
            console.log('📊 monthlyTrend.length:', monthlyTrend.length);

            setConsolidatedData({
                summary: {
                    totalRevenue,
                    totalExpense,
                    netProfit,
                    profitMargin
                },
                branchData: branchFinancialData,
                monthlyTrend,
                categoryBreakdown: categoryBreakdownArray
            });

            console.log('✅ 통합 재무현황 데이터 로드 완료');

        } catch (error) {
            console.error('❌ 통합 재무현황 데이터 로드 실패:', error);
            showNotification('데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);


    // 통화 포맷팅
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    // 카테고리명을 한국어로 변환
    const getCategoryKoreanName = (category) => {
        const categoryMap = {
            'SALARY': '급여비용',
            'RENT': '임대료',
            'UTILITY': '관리비',
            'OFFICE_SUPPLIES': '사무용품비',
            'TAX': '세금',
            'CONSULTATION': '상담비용',
            'MARKETING': '마케팅비',
            'TRAVEL': '출장비',
            'EQUIPMENT': '장비비',
            'MAINTENANCE': '유지보수비',
            'INSURANCE': '보험료',
            'TRAINING': '교육비',
            'OTHER': '기타비용'
        };
        return categoryMap[category] || category;
    };

    // 날짜 변경 핸들러
    const handleDateChange = (field, value) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 차트 데이터 준비
    const chartData = {
        labels: consolidatedData.monthlyTrend.map(item => item.month),
        datasets: [
            {
                label: '수익',
                data: consolidatedData.monthlyTrend.map(item => item.revenue),
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 2,
                fill: true
            },
            {
                label: '지출',
                data: consolidatedData.monthlyTrend.map(item => item.expense),
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                borderColor: 'rgba(220, 53, 69, 1)',
                borderWidth: 2,
                fill: true
            }
        ]
    };

    if (loading) {
        return (
            <SimpleLayout title="통합 재무현황">
                <Container fluid className="py-4">
                    <LoadingSpinner text="재무 데이터를 불러오는 중..." size="large" />
                </Container>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="통합 재무현황">
            <Container fluid className="consolidated-financial py-4" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
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
                                    <FaCalculator className="me-2" />
                                    통합 재무현황
                                </h2>
                            </div>
                            <Button variant="success">
                                <FaDownload className="me-2" />
                                보고서 다운로드
                            </Button>
                        </div>
                    </Col>
                </Row>

                {/* 필터 */}
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <Card.Body>
                                <Row className="align-items-end">
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>시작일</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={dateRange.startDate}
                                                onChange={(e) => handleDateChange('startDate', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>종료일</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={dateRange.endDate}
                                                onChange={(e) => handleDateChange('endDate', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Button 
                                            variant="primary" 
                                            className="w-100"
                                            onClick={loadConsolidatedData}
                                        >
                                            <FaFilter className="me-2" />
                                            조회
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 요약 통계 */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="h-100 border-success">
                            <Card.Body className="text-center">
                                <FaArrowUp className="text-success mb-2" style={{ fontSize: '2rem' }} />
                                <h3 className="text-success">{formatCurrency(consolidatedData.summary.totalRevenue)}</h3>
                                <p className="text-muted mb-0">총 수익</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="h-100 border-danger">
                            <Card.Body className="text-center">
                                <FaArrowDown className="text-danger mb-2" style={{ fontSize: '2rem' }} />
                                <h3 className="text-danger">{formatCurrency(consolidatedData.summary.totalExpense)}</h3>
                                <p className="text-muted mb-0">총 지출</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="h-100 border-primary">
                            <Card.Body className="text-center">
                                <FaDollarSign className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                                <h3 className={`${consolidatedData.summary.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {formatCurrency(consolidatedData.summary.netProfit)}
                                </h3>
                                <p className="text-muted mb-0">순이익</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="h-100 border-info">
                            <Card.Body className="text-center">
                                <FaChartLine className="text-info mb-2" style={{ fontSize: '2rem' }} />
                                <h3 className={`${consolidatedData.summary.profitMargin >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {consolidatedData.summary.profitMargin.toFixed(1)}%
                                </h3>
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
                                    <FaChartLine className="me-2" />
                                    월별 수익/지출 트렌드
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                {consolidatedData.monthlyTrend.length > 0 ? (
                                    <Chart
                                        type="line"
                                        data={chartData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
                                                },
                                                title: {
                                                    display: false
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        callback: function(value) {
                                                            return new Intl.NumberFormat('ko-KR', {
                                                                style: 'currency',
                                                                currency: 'KRW',
                                                                minimumFractionDigits: 0
                                                            }).format(value);
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="text-center py-5">
                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">트렌드 데이터가 없습니다</h5>
                                        <p className="text-muted">선택한 기간에 대한 월별 트렌드 데이터가 없습니다.</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 지점별 재무현황 */}
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">
                                    <FaBuilding className="me-2" />
                                    지점별 재무현황
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>지점명</th>
                                                <th>지점코드</th>
                                                <th>수익</th>
                                                <th>지출</th>
                                                <th>순이익</th>
                                                <th>거래건수</th>
                                                <th>상태</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consolidatedData.branchData.map((branch, index) => (
                                                <tr key={index}>
                                                    <td>{branch.branchName}</td>
                                                    <td>{branch.branchCode}</td>
                                                    <td className="text-success">{formatCurrency(branch.revenue)}</td>
                                                    <td className="text-danger">{formatCurrency(branch.expense)}</td>
                                                    <td className={branch.profit >= 0 ? 'text-success' : 'text-danger'}>
                                                        {formatCurrency(branch.profit)}
                                                    </td>
                                                    <td>{branch.transactionCount}건</td>
                                                    <td>
                                                        <Badge bg={branch.profit >= 0 ? 'success' : 'warning'}>
                                                            {branch.profit >= 0 ? '흑자' : '적자'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 카테고리별 지출 분석 */}
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
                                {consolidatedData.categoryBreakdown.length > 0 ? (
                                    <Row>
                                        {consolidatedData.categoryBreakdown.map((item, index) => (
                                            <Col key={index} md={6} lg={4} className="mb-3">
                                                <div className="category-item p-3 border rounded">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="mb-0">{item.category}</h6>
                                                        <Badge bg="primary">{item.percentage}%</Badge>
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
            </Container>
        </SimpleLayout>
    );
};

export default ConsolidatedFinancial;
