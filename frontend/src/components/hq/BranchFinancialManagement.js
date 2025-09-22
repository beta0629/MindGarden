import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Tab, Tabs, Table } from 'react-bootstrap';
import { 
    FaBuilding, FaDollarSign, FaChartLine, FaCalendar, 
    FaFilter, FaDownload, FaEye, FaArrowUp, FaArrowDown,
    FaPiggyBank, FaCreditCard, FaMoneyBillWave
} from 'react-icons/fa';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import './BranchFinancialManagement.css';

/**
 * HQ 마스터용 지점별 재무관리 컴포넌트
 * 각 지점의 수익, 지출, 순이익을 분석하고 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const BranchFinancialManagement = () => {
    const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
    
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [financialData, setFinancialData] = useState({
        summary: {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            transactionCount: 0
        },
        transactions: [],
        monthlyStats: [],
        categoryBreakdown: []
    });
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        category: '',
        transactionType: ''
    });

    // 권한 체크
    useEffect(() => {
        if (sessionLoading) return;
        
        if (!isLoggedIn || !user) {
            showNotification('로그인이 필요합니다.', 'error');
            window.location.href = '/login';
            return;
        }

        const allowedRoles = ['HQ_MASTER', 'SUPER_HQ_ADMIN', 'HQ_ADMIN'];
        if (!allowedRoles.includes(user.role)) {
            showNotification('접근 권한이 없습니다.', 'error');
            window.location.href = '/dashboard';
            return;
        }
    }, [user, isLoggedIn, sessionLoading]);

    // 지점 목록 로드
    const loadBranches = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiGet('/api/hq/branch-management/branches');
            
            if (response.success && response.branches) {
                setBranches(response.branches);
                if (response.branches.length > 0 && !selectedBranch) {
                    setSelectedBranch(response.branches[0]);
                }
            }
        } catch (error) {
            console.error('지점 목록 로드 실패:', error);
            showNotification('지점 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedBranch]);

    // 지점별 재무 데이터 로드
    const loadBranchFinancialData = useCallback(async (branchCode) => {
        if (!branchCode) return;

        try {
            setLoading(true);
            const params = {
                branchCode,
                startDate: filters.startDate,
                endDate: filters.endDate,
                category: filters.category,
                transactionType: filters.transactionType
            };

            const response = await apiGet('/api/hq/erp/branch-financial', params);
            
            if (response.success) {
                setFinancialData(response.data);
            }
        } catch (error) {
            console.error('지점 재무 데이터 로드 실패:', error);
            showNotification('재무 데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // 초기 데이터 로드
    useEffect(() => {
        if (!sessionLoading && user) {
            loadBranches();
        }
    }, [sessionLoading, user, loadBranches]);

    // 선택된 지점 변경 시 재무 데이터 로드
    useEffect(() => {
        if (selectedBranch) {
            loadBranchFinancialData(selectedBranch.code);
        }
    }, [selectedBranch, loadBranchFinancialData]);

    // 필터 변경 핸들러
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 필터 적용
    const handleApplyFilters = () => {
        if (selectedBranch) {
            loadBranchFinancialData(selectedBranch.code);
        }
    };

    // 금액 포맷팅
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount || 0);
    };

    // 거래 유형 라벨
    const getTransactionTypeLabel = (type) => {
        const labels = {
            'INCOME': '수입',
            'EXPENSE': '지출'
        };
        return labels[type] || type;
    };

    // 거래 유형 배지 색상
    const getTransactionTypeBadge = (type) => {
        return type === 'INCOME' ? 'success' : 'danger';
    };

    if (sessionLoading || loading) {
        return <LoadingSpinner />;
    }

    return (
        <SimpleLayout>
            <Container fluid className="branch-financial-management">
                <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center">
                            <h2>
                                <FaDollarSign className="me-2 text-warning" />
                                지점별 재무관리
                            </h2>
                            <Badge bg="info" className="fs-6">
                                {user?.role === 'HQ_MASTER' ? 'HQ 마스터' : '본사 관리자'}
                            </Badge>
                        </div>
                        <p className="text-muted">지점별 수익, 지출 현황을 분석하고 관리합니다.</p>
                    </Col>
                </Row>

                {/* 지점 선택 및 필터 */}
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">
                                    <FaFilter className="me-2" />
                                    지점 선택 및 필터
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>지점 선택</Form.Label>
                                            <Form.Select 
                                                value={selectedBranch?.code || ''}
                                                onChange={(e) => {
                                                    const branch = branches.find(b => b.code === e.target.value);
                                                    setSelectedBranch(branch);
                                                }}
                                            >
                                                <option value="">지점을 선택하세요</option>
                                                {branches.map(branch => (
                                                    <option key={branch.code} value={branch.code}>
                                                        {branch.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label>시작일</Form.Label>
                                            <Form.Control 
                                                type="date" 
                                                value={filters.startDate}
                                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label>종료일</Form.Label>
                                            <Form.Control 
                                                type="date" 
                                                value={filters.endDate}
                                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label>거래 유형</Form.Label>
                                            <Form.Select 
                                                value={filters.transactionType}
                                                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                                            >
                                                <option value="">전체</option>
                                                <option value="INCOME">수입</option>
                                                <option value="EXPENSE">지출</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label>카테고리</Form.Label>
                                            <Form.Select 
                                                value={filters.category}
                                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                            >
                                                <option value="">전체</option>
                                                <option value="CONSULTATION">상담 수익</option>
                                                <option value="RENT">임대료</option>
                                                <option value="SALARY">급여</option>
                                                <option value="UTILITY">공과금</option>
                                                <option value="MARKETING">마케팅</option>
                                                <option value="OTHER">기타</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={1}>
                                        <Form.Group>
                                            <Form.Label>&nbsp;</Form.Label>
                                            <div className="d-grid">
                                                <Button 
                                                    variant="primary"
                                                    onClick={handleApplyFilters}
                                                    disabled={!selectedBranch}
                                                >
                                                    조회
                                                </Button>
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {selectedBranch && (
                    <>
                        {/* 재무 요약 */}
                        <Row className="mb-4">
                            <Col md={3}>
                                <Card className="h-100 border-success">
                                    <Card.Body className="text-center">
                                        <FaArrowUp className="text-success mb-2" style={{ fontSize: '2rem' }} />
                                        <h3 className="text-success">{formatCurrency(financialData.summary.totalRevenue)}</h3>
                                        <p className="text-muted mb-0">총 수익</p>
                                        <small className="text-muted">선택 기간</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="h-100 border-danger">
                                    <Card.Body className="text-center">
                                        <FaArrowDown className="text-danger mb-2" style={{ fontSize: '2rem' }} />
                                        <h3 className="text-danger">{formatCurrency(financialData.summary.totalExpenses)}</h3>
                                        <p className="text-muted mb-0">총 지출</p>
                                        <small className="text-muted">선택 기간</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="h-100 border-primary">
                                    <Card.Body className="text-center">
                                        <FaPiggyBank className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                                        <h3 className="text-primary">{formatCurrency(financialData.summary.netProfit)}</h3>
                                        <p className="text-muted mb-0">순이익</p>
                                        <small className="text-muted">수익 - 지출</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="h-100 border-info">
                                    <Card.Body className="text-center">
                                        <FaCreditCard className="text-info mb-2" style={{ fontSize: '2rem' }} />
                                        <h3 className="text-info">{financialData.summary.transactionCount}</h3>
                                        <p className="text-muted mb-0">거래 건수</p>
                                        <small className="text-muted">선택 기간</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* 상세 데이터 탭 */}
                        <Row>
                            <Col>
                                <Card>
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            <FaChartLine className="me-2" />
                                            {selectedBranch.name} 재무 상세
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Tabs defaultActiveKey="transactions" className="mb-3">
                                            <Tab eventKey="transactions" title="거래 내역">
                                                <Table striped bordered hover responsive>
                                                    <thead>
                                                        <tr>
                                                            <th>날짜</th>
                                                            <th>유형</th>
                                                            <th>카테고리</th>
                                                            <th>설명</th>
                                                            <th>금액</th>
                                                            <th>작업</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {financialData.transactions.length > 0 ? (
                                                            financialData.transactions.map((transaction, index) => (
                                                                <tr key={index}>
                                                                    <td>{transaction.date}</td>
                                                                    <td>
                                                                        <Badge bg={getTransactionTypeBadge(transaction.type)}>
                                                                            {getTransactionTypeLabel(transaction.type)}
                                                                        </Badge>
                                                                    </td>
                                                                    <td>{transaction.category}</td>
                                                                    <td>{transaction.description}</td>
                                                                    <td className={transaction.type === 'INCOME' ? 'text-success' : 'text-danger'}>
                                                                        {formatCurrency(transaction.amount)}
                                                                    </td>
                                                                    <td>
                                                                        <Button variant="outline-primary" size="sm">
                                                                            <FaEye />
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="6" className="text-center text-muted">
                                                                    선택한 조건에 해당하는 거래 내역이 없습니다.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </Tab>
                                            <Tab eventKey="monthly" title="월별 통계">
                                                <Alert variant="info">
                                                    <FaCalendar className="me-2" />
                                                    월별 수익/지출 통계 차트가 여기에 표시됩니다.
                                                </Alert>
                                            </Tab>
                                            <Tab eventKey="category" title="카테고리 분석">
                                                <Alert variant="info">
                                                    <FaChartLine className="me-2" />
                                                    카테고리별 지출 분석 차트가 여기에 표시됩니다.
                                                </Alert>
                                            </Tab>
                                        </Tabs>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}

                {!selectedBranch && branches.length > 0 && (
                    <Row>
                        <Col>
                            <Alert variant="info" className="text-center">
                                <FaBuilding className="me-2" />
                                지점을 선택하여 재무 현황을 확인하세요.
                            </Alert>
                        </Col>
                    </Row>
                )}

                {branches.length === 0 && !loading && (
                    <Row>
                        <Col>
                            <Alert variant="warning" className="text-center">
                                <FaBuilding className="me-2" />
                                등록된 지점이 없습니다.
                            </Alert>
                        </Col>
                    </Row>
                )}
            </Container>
        </SimpleLayout>
    );
};

export default BranchFinancialManagement;
