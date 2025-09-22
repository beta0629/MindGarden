import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { 
    FaBuilding, FaUsers, FaChartBar, FaMapMarkerAlt, 
    FaCog, FaExchangeAlt, FaPlus, FaEdit, FaEye,
    FaUserTie, FaUser, FaCrown, FaTachometerAlt,
    FaCalendarCheck, FaFileAlt, FaBox
} from 'react-icons/fa';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import MotivationCard from '../common/MotivationCard';
import './HQDashboard.css';

/**
 * 본사 관리자 전용 대시보드
 * 지점 관리 및 전사 통계를 중심으로 한 대시보드
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const HQDashboard = ({ user: propUser }) => {
    const navigate = useNavigate();
    const { user: sessionUser, isLoggedIn, isLoading: sessionLoading } = useSession();
    
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        branchStats: {
            totalBranches: 0,
            activeBranches: 0,
            totalUsers: 0,
            totalConsultants: 0,
            totalClients: 0,
            totalAdmins: 0
        },
        branchList: [],
        recentActivities: []
    });

    // 현재 사용자 결정
    const user = propUser || sessionUser;

    // 세션 체크 및 권한 확인
    useEffect(() => {
        if (sessionLoading) {
            console.log('⏳ 세션 로딩 중...');
            return;
        }

        if (!isLoggedIn) {
            console.log('❌ 로그인되지 않음, 로그인 페이지로 이동');
            navigate('/login', { replace: true });
            return;
        }

        const currentUser = user;
        if (!currentUser || !['HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER'].includes(currentUser.role)) {
            console.log('❌ 본사 관리자 권한 없음, 일반 대시보드로 이동');
            navigate('/dashboard', { replace: true });
            return;
        }

        console.log('✅ HQ Dashboard 접근 허용:', currentUser?.role);
        loadDashboardData();
    }, [isLoggedIn, sessionLoading, user, navigate]);

    // 대시보드 데이터 로드
    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            console.log('📊 본사 대시보드 데이터 로드 시작');

            // 1. 지점 목록 먼저 로드
            const branchesResponse = await apiGet('/api/hq/branch-management/branches');
            console.log('📍 API 응답:', branchesResponse);
            
            const branches = branchesResponse.data || [];
            console.log('📍 지점 목록 로드 완료:', branches.length, '개', branches);

            // 2. 각 지점별 사용자 목록 로드하여 통계 계산
            const enrichedBranches = [];
            
            for (const branch of branches) {
                try {
                    console.log(`📊 지점 ${branch.code} (${branch.name}) 사용자 목록 로드 중...`);
                    
                    const usersResponse = await apiGet(`/api/hq/branch-management/branches/${branch.code}/users?includeInactive=false`);
                    console.log(`📊 지점 ${branch.code} API 응답:`, usersResponse);
                    
                    const users = usersResponse.users || [];
                    console.log(`📊 지점 ${branch.code} 사용자 배열:`, users);
                    
                    const userStats = {
                        total: users.length,
                        consultants: users.filter(u => u.role === 'CONSULTANT').length,
                        clients: users.filter(u => u.role === 'CLIENT').length,
                        admins: users.filter(u => ['ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN'].includes(u.role)).length
                    };
                    
                    console.log(`📊 지점 ${branch.code} 계산된 통계:`, userStats);
                    
                    enrichedBranches.push({
                        ...branch,
                        userStats
                    });
                } catch (error) {
                    console.error(`❌ 지점 ${branch.code} 데이터 로드 실패:`, error);
                    enrichedBranches.push({
                        ...branch,
                        userStats: { total: 0, consultants: 0, clients: 0, admins: 0 }
                    });
                }
            }
            
            // 3. 전사 통계 계산
            const totalStats = enrichedBranches.reduce((acc, branch) => ({
                totalUsers: acc.totalUsers + branch.userStats.total,
                totalConsultants: acc.totalConsultants + branch.userStats.consultants,
                totalClients: acc.totalClients + branch.userStats.clients,
                totalAdmins: acc.totalAdmins + branch.userStats.admins
            }), { totalUsers: 0, totalConsultants: 0, totalClients: 0, totalAdmins: 0 });

            const branchStats = {
                totalBranches: branches.length,
                activeBranches: branches.filter(b => b.isActive).length,
                ...totalStats
            };

            setDashboardData({
                branchStats,
                branchList: enrichedBranches,
                recentActivities: [] // 추후 구현
            });

            console.log('✅ 본사 대시보드 데이터 로드 완료');
            console.log('📊 전사 통계:', branchStats);
            console.log('🏢 지점별 데이터:', enrichedBranches);

        } catch (error) {
            console.error('❌ 본사 대시보드 데이터 로드 실패:', error);
            showNotification('대시보드 데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // 지점 관리 페이지로 이동
    const handleBranchManagement = () => {
        navigate('/hq/branch-management');
    };

    // 지점 상세보기
    const handleBranchDetail = (branchCode) => {
        navigate(`/hq/branch-management?branch=${branchCode}`);
    };

    if (loading) {
        return (
            <SimpleLayout title="본사 대시보드">
                <Container fluid className="py-4">
                    <LoadingSpinner text="대시보드를 불러오는 중..." size="large" />
                </Container>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="본사 대시보드">
            <Container fluid className="py-4">
                {/* 환영 메시지 */}
                <Row className="mb-4">
                    <Col>
                        <Alert variant="info" className="d-flex align-items-center">
                            <FaBuilding className="me-3" style={{ fontSize: '1.5rem' }} />
                            <div>
                                <h5 className="mb-1">본사 관리자 대시보드</h5>
                                <p className="mb-0">
                                    안녕하세요, <strong>{user?.name || user?.username}</strong>님! 
                                    전사 지점 현황과 통계를 한눈에 확인하세요.
                                </p>
                            </div>
                        </Alert>
                    </Col>
                </Row>

                {/* 전사 통계 카드 */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="h-100 border-primary">
                            <Card.Body className="text-center">
                                <FaBuilding className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                                <h3 className="text-primary">{dashboardData.branchStats.activeBranches}</h3>
                                <p className="text-muted mb-0">활성 지점</p>
                                <small className="text-muted">전체 {dashboardData.branchStats.totalBranches}개</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="h-100 border-success">
                            <Card.Body className="text-center">
                                <FaUserTie className="text-success mb-2" style={{ fontSize: '2rem' }} />
                                <h3 className="text-success">{dashboardData.branchStats.totalConsultants}</h3>
                                <p className="text-muted mb-0">전체 상담사</p>
                                <small className="text-muted">활동 중인 상담사</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="h-100 border-info">
                            <Card.Body className="text-center">
                                <FaUser className="text-info mb-2" style={{ fontSize: '2rem' }} />
                                <h3 className="text-info">{dashboardData.branchStats.totalClients}</h3>
                                <p className="text-muted mb-0">전체 내담자</p>
                                <small className="text-muted">등록된 내담자</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="h-100 border-warning">
                            <Card.Body className="text-center">
                                <FaCrown className="text-warning mb-2" style={{ fontSize: '2rem' }} />
                                <h3 className="text-warning">{dashboardData.branchStats.totalAdmins}</h3>
                                <p className="text-muted mb-0">전체 관리자</p>
                                <small className="text-muted">지점 관리자 포함</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 빠른 액션 */}
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">
                                    <FaTachometerAlt className="me-2" />
                                    빠른 액션
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={3}>
                                        <div className="d-grid">
                                            <Button 
                                                variant="primary" 
                                                size="lg"
                                                onClick={handleBranchManagement}
                                                className="mb-2"
                                            >
                                                <FaBuilding className="me-2" />
                                                지점 관리
                                            </Button>
                                            <small className="text-muted text-center">지점 현황 및 사용자 이동</small>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="d-grid">
                                            <Button 
                                                variant="success" 
                                                size="lg"
                                                onClick={() => navigate('/admin/user-management')}
                                                className="mb-2"
                                            >
                                                <FaUsers className="me-2" />
                                                사용자 관리
                                            </Button>
                                            <small className="text-muted text-center">역할 변경 및 권한 관리</small>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="d-grid">
                                            <Button 
                                                variant="info" 
                                                size="lg"
                                                onClick={() => navigate('/admin/statistics')}
                                                className="mb-2"
                                            >
                                                <FaChartBar className="me-2" />
                                                전사 통계
                                            </Button>
                                            <small className="text-muted text-center">전사 현황 및 분석</small>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="d-grid">
                                            <Button 
                                                variant="secondary" 
                                                size="lg"
                                                onClick={() => navigate('/erp/dashboard')}
                                                className="mb-2"
                                            >
                                                <FaBox className="me-2" />
                                                ERP 관리
                                            </Button>
                                            <small className="text-muted text-center">구매 및 예산 관리</small>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 지점 현황 */}
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <FaMapMarkerAlt className="me-2" />
                                    지점 현황
                                </h5>
                                <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={handleBranchManagement}
                                >
                                    <FaEye className="me-1" />
                                    전체보기
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                {dashboardData.branchList.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <FaBuilding className="mb-3" style={{ fontSize: '2rem' }} />
                                        <p>등록된 지점이 없습니다.</p>
                                    </div>
                                ) : (
                                    <Row>
                                        {dashboardData.branchList.slice(0, 6).map((branch) => (
                                            <Col key={branch.id} md={6} lg={4} className="mb-3">
                                                <Card 
                                                    className={`h-100 branch-card ${!branch.isActive ? 'inactive' : ''}`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleBranchDetail(branch.code)}
                                                >
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h6 className="mb-0">{branch.name}</h6>
                                                            <Badge bg={branch.isActive ? 'success' : 'secondary'}>
                                                                {branch.isActive ? '활성' : '비활성'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-muted small mb-2">{branch.code}</p>
                                                        
                                                        <Row className="text-center">
                                                            <Col xs={3}>
                                                                <div className="text-primary">
                                                                    <strong>{branch.userStats.total}</strong>
                                                                    <br />
                                                                    <small>전체</small>
                                                                </div>
                                                            </Col>
                                                            <Col xs={3}>
                                                                <div className="text-success">
                                                                    <strong>{branch.userStats.consultants}</strong>
                                                                    <br />
                                                                    <small>상담사</small>
                                                                </div>
                                                            </Col>
                                                            <Col xs={3}>
                                                                <div className="text-info">
                                                                    <strong>{branch.userStats.clients}</strong>
                                                                    <br />
                                                                    <small>내담자</small>
                                                                </div>
                                                            </Col>
                                                            <Col xs={3}>
                                                                <div className="text-warning">
                                                                    <strong>{branch.userStats.admins}</strong>
                                                                    <br />
                                                                    <small>관리자</small>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 동기부여 카드 */}
                <Row>
                    <Col>
                        <MotivationCard userRole={user?.role} />
                    </Col>
                </Row>
            </Container>
        </SimpleLayout>
    );
};

export default HQDashboard;
