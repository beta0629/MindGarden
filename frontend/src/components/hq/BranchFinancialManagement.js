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
 * 지점별 재무관리 필터 카드 컴포넌트
 */
const BranchFilterCard = ({
    branches,
    selectedBranch,
    onBranchChange,
    filters,
    onFilterChange,
    onApplyFilters
}) => {
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
                backgroundColor: 'white', 
                border: '1px solid #dee2e6', 
                borderRadius: '0.375rem',
                boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
            }}>
                <div style={{ 
                    padding: '1rem 1.25rem', 
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa'
                }}>
                    <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '500' }}>
                        <FaFilter style={{ marginRight: '0.5rem' }} />
                        지점 선택 및 필터
                    </h5>
                </div>
                <div style={{ padding: '1.25rem' }}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1rem',
                        alignItems: 'end'
                    }}>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                지점 선택
                            </label>
                            <select 
                                value={selectedBranch?.code || ''}
                                onChange={(e) => {
                                    const branch = branches.find(b => b.code === e.target.value);
                                    onBranchChange(branch);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.375rem 0.75rem',
                                    fontSize: '1rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="">지점을 선택하세요</option>
                                {branches.map(branch => (
                                    <option key={branch.code} value={branch.code}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                시작일
                            </label>
                            <input 
                                type="date" 
                                value={filters.startDate}
                                onChange={(e) => onFilterChange('startDate', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.375rem 0.75rem',
                                    fontSize: '1rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'white'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                종료일
                            </label>
                            <input 
                                type="date" 
                                value={filters.endDate}
                                onChange={(e) => onFilterChange('endDate', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.375rem 0.75rem',
                                    fontSize: '1rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'white'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                거래 유형
                            </label>
                            <select 
                                value={filters.transactionType}
                                onChange={(e) => onFilterChange('transactionType', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.375rem 0.75rem',
                                    fontSize: '1rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="">전체</option>
                                <option value="INCOME">수입</option>
                                <option value="EXPENSE">지출</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                카테고리
                            </label>
                            <select 
                                value={filters.category}
                                onChange={(e) => onFilterChange('category', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.375rem 0.75rem',
                                    fontSize: '1rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="">전체</option>
                                <option value="CONSULTATION">상담 수익</option>
                                <option value="RENT">임대료</option>
                                <option value="SALARY">급여</option>
                                <option value="UTILITY">공과금</option>
                                <option value="MARKETING">마케팅</option>
                                <option value="OTHER">기타</option>
                            </select>
                        </div>
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
                                onClick={onApplyFilters}
                                disabled={!selectedBranch}
                                style={{
                                    width: '100%',
                                    padding: '0.375rem 0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'white',
                                    backgroundColor: selectedBranch ? '#0d6efd' : '#6c757d',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: selectedBranch ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <FaEye />
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
            console.log('🏢 지점 목록 API 응답:', response);
            
            if (response.success && response.data) {
                setBranches(response.data);
                if (response.data.length > 0 && !selectedBranch) {
                    setSelectedBranch(response.data[0]);
                }
            } else if (response.data) {
                // 백워드 호환성
                setBranches(response.data);
                if (response.data.length > 0 && !selectedBranch) {
                    setSelectedBranch(response.data[0]);
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
            <Container className="branch-financial-management" style={{ maxWidth: '100%', padding: '0 2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1rem'
                    }}>
                        <h2 style={{ 
                            margin: 0, 
                            fontSize: '2rem', 
                            fontWeight: '600',
                            color: '#212529'
                        }}>
                            <FaDollarSign style={{ marginRight: '0.5rem', color: '#ffc107' }} />
                            지점별 재무관리
                        </h2>
                        <div style={{
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                            fontWeight: '500'
                        }}>
                            {user?.role === 'HQ_MASTER' ? 'HQ 마스터' : '본사 관리자'}
                        </div>
                    </div>
                    <p style={{ 
                        color: '#6c757d', 
                        fontSize: '1.25rem', 
                        marginTop: '1rem',
                        marginBottom: '2rem',
                        margin: '1rem 0 2rem 0',
                        lineHeight: '1.5'
                    }}>
                        지점별 수익, 지출 현황을 분석하고 관리합니다.
                    </p>
                </div>

                {/* 지점 선택 및 필터 */}
                <BranchFilterCard
                    branches={branches}
                    selectedBranch={selectedBranch}
                    onBranchChange={setSelectedBranch}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={handleApplyFilters}
                />

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
                                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                    <Table striped bordered hover responsive size="sm">
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
                                                </div>
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
