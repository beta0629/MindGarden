import React, { useState, useEffect, useCallback } from 'react';
import { 
    Card, Row, Col, Button, Badge, Alert, 
    Tab, Tabs, Table, Modal, Form, ButtonGroup
} from 'react-bootstrap';
import { 
    FaBuilding, FaUsers, FaUserTie, FaUser, FaCrown, 
    FaEdit, FaToggleOn, FaToggleOff, FaMapMarkerAlt,
    FaPhone, FaEnvelope, FaClock, FaExchangeAlt,
    FaChartBar, FaCog, FaUserCog, FaTrash
} from 'react-icons/fa';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import LoadingSpinner from '../common/LoadingSpinner';
import BranchUserTransfer from './BranchUserTransfer';
import './BranchDetail.css';

/**
 * 지점 상세 정보 및 관리 컴포넌트
 * - 지점 기본 정보 표시
 * - 지점 통계 및 현황
 * - 지점 사용자 관리
 * - 지점 설정 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const BranchDetail = ({ 
    branch, 
    onBranchUpdate, 
    onUserTransfer,
    onBranchDelete,
    branches = [] // 다른 지점 목록을 받아서 이동 대상으로 사용
}) => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [branchUsers, setBranchUsers] = useState([]);
    const [branchStats, setBranchStats] = useState({});
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // 지점 정보가 변경될 때마다 데이터 로드
    useEffect(() => {
        if (branch?.id) {
            loadBranchData();
        }
    }, [branch?.id]);

    // 지점 데이터 로드
    const loadBranchData = useCallback(async () => {
        if (!branch?.id) return;
        
        setLoading(true);
        try {
            const [usersResponse, statsResponse] = await Promise.all([
                apiGet(`/api/hq/branches/${branch.id}/users`),
                apiGet(`/api/hq/branches/${branch.id}/statistics`)
            ]);
            
            setBranchUsers(usersResponse.users || []);
            setBranchStats(statsResponse || {});
        } catch (error) {
            console.error('지점 데이터 로드 실패:', error);
            showNotification('지점 데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [branch?.id]);

    // 사용자 선택/해제
    const handleUserSelection = (userId, isSelected) => {
        if (isSelected) {
            setSelectedUsers(prev => [...prev, userId]);
        } else {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
        }
    };

    // 전체 선택/해제
    const handleSelectAll = (isSelected) => {
        if (isSelected) {
            setSelectedUsers(branchUsers.map(user => user.id));
        } else {
            setSelectedUsers([]);
        }
    };

    // 사용자 이동 완료 핸들러
    const handleTransferComplete = (transferData) => {
        setShowTransferModal(false);
        setSelectedUsers([]);
        loadBranchData();
        if (onUserTransfer) {
            onUserTransfer(transferData.userIds, transferData.targetBranchCode);
        }
    };

    // 지점 상태 토글
    const handleBranchStatusToggle = async () => {
        if (!branch?.id) return;
        
        try {
            const response = await apiPut(`/api/hq/branches/${branch.id}/toggle-status`);
            if (response.success) {
                showNotification(
                    `지점이 ${branch.isActive ? '비활성화' : '활성화'}되었습니다.`, 
                    'success'
                );
                if (onBranchUpdate) {
                    onBranchUpdate({ ...branch, isActive: !branch.isActive });
                }
            }
        } catch (error) {
            console.error('지점 상태 변경 실패:', error);
            showNotification('지점 상태 변경에 실패했습니다.', 'error');
        }
    };

    // 지점 삭제
    const handleBranchDelete = async () => {
        if (!branch?.id) return;
        
        try {
            const response = await apiDelete(`/api/hq/branches/${branch.id}`);
            if (response.success) {
                showNotification('지점이 삭제되었습니다.', 'success');
                setShowDeleteModal(false);
                if (onBranchDelete) {
                    onBranchDelete(branch.id);
                }
            }
        } catch (error) {
            console.error('지점 삭제 실패:', error);
            showNotification('지점 삭제에 실패했습니다.', 'error');
        }
    };

    // 역할 아이콘 반환
    const getRoleIcon = (role) => {
        switch (role) {
            case 'CLIENT': return <FaUser className="text-primary" />;
            case 'CONSULTANT': return <FaUserTie className="text-success" />;
            case 'ADMIN': return <FaCrown className="text-warning" />;
            default: return <FaUsers className="text-secondary" />;
        }
    };

    // 역할 배지 색상 반환
    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'CLIENT': return 'primary';
            case 'CONSULTANT': return 'success';
            case 'ADMIN': return 'warning';
            default: return 'secondary';
        }
    };

    if (!branch) {
        return (
            <div className="branch-detail-empty">
                <Card className="text-center">
                    <Card.Body className="py-5">
                        <FaBuilding className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                        <h5 className="text-muted">지점을 선택해주세요</h5>
                        <p className="text-muted">왼쪽 목록에서 지점을 선택하면 상세 정보를 확인할 수 있습니다.</p>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    return (
        <div className="branch-detail">
            {/* 지점 헤더 */}
            <Card className="branch-header-card">
                <Card.Header>
                    <Row className="align-items-center">
                        <Col>
                            <div className="d-flex align-items-center">
                                <FaBuilding className="me-3 text-primary" style={{ fontSize: '1.5rem' }} />
                                <div>
                                    <h4 className="mb-1">{branch.name}</h4>
                                    <div className="d-flex align-items-center gap-3">
                                        <Badge 
                                            bg="info" 
                                            className="branch-code-badge"
                                        >
                                            <code>{branch.branchCode}</code>
                                        </Badge>
                                        <Badge 
                                            bg={branch.isActive ? 'success' : 'secondary'}
                                            className="branch-status-badge"
                                        >
                                            {branch.isActive ? (
                                                <>
                                                    <FaToggleOn className="me-1" />
                                                    활성
                                                </>
                                            ) : (
                                                <>
                                                    <FaToggleOff className="me-1" />
                                                    비활성
                                                </>
                                            )}
                                        </Badge>
                                        {branch.managerName && (
                                            <Badge bg="warning" className="branch-manager-badge">
                                                <FaUserCog className="me-1" />
                                                지점장: {branch.managerName}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col xs="auto">
                            <ButtonGroup>
                                <Button
                                    variant={branch.isActive ? 'warning' : 'success'}
                                    size="sm"
                                    onClick={handleBranchStatusToggle}
                                    className="branch-action-btn"
                                >
                                    {branch.isActive ? (
                                        <>
                                            <FaToggleOff className="me-1" />
                                            비활성화
                                        </>
                                    ) : (
                                        <>
                                            <FaToggleOn className="me-1" />
                                            활성화
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="branch-action-btn"
                                >
                                    <FaTrash className="me-1" />
                                    삭제
                                </Button>
                            </ButtonGroup>
                        </Col>
                    </Row>
                </Card.Header>
            </Card>

            {/* 지점 기본 정보 */}
            <Card className="branch-info-card">
                <Card.Header>
                    <h6 className="mb-0">
                        <FaBuilding className="me-2" />
                        지점 정보
                    </h6>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <div className="info-item">
                                <FaMapMarkerAlt className="me-2 text-muted" />
                                <strong>주소:</strong> {branch.address || '-'}
                            </div>
                            <div className="info-item">
                                <FaPhone className="me-2 text-muted" />
                                <strong>전화번호:</strong> {branch.phone || '-'}
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="info-item">
                                <FaEnvelope className="me-2 text-muted" />
                                <strong>이메일:</strong> {branch.email || '-'}
                            </div>
                            <div className="info-item">
                                <FaClock className="me-2 text-muted" />
                                <strong>등록일:</strong> {
                                    branch.createdAt ? 
                                        new Date(branch.createdAt).toLocaleDateString() : 
                                        '-'
                                }
                            </div>
                        </Col>
                    </Row>
                    {branch.description && (
                        <div className="info-item mt-3">
                            <strong>설명:</strong> {branch.description}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* 탭 컨텐츠 */}
            <Card className="branch-content-card">
                <Tabs
                    activeKey={activeTab}
                    onSelect={setActiveTab}
                    className="branch-tabs"
                >
                    {/* 개요 탭 */}
                    <Tab eventKey="overview" title={
                        <span><FaChartBar className="me-1" />개요</span>
                    }>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-4">
                                    <LoadingSpinner text="통계를 불러오는 중..." size="medium" />
                                </div>
                            ) : (
                                <Row>
                                    <Col md={3}>
                                        <div className="stat-card">
                                            <div className="stat-icon users">
                                                <FaUsers />
                                            </div>
                                            <div className="stat-content">
                                                <h3>{branchStats.totalUsers || 0}</h3>
                                                <p>전체 사용자</p>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="stat-card">
                                            <div className="stat-icon consultants">
                                                <FaUserTie />
                                            </div>
                                            <div className="stat-content">
                                                <h3>{branchStats.consultants || 0}</h3>
                                                <p>상담사</p>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="stat-card">
                                            <div className="stat-icon clients">
                                                <FaUser />
                                            </div>
                                            <div className="stat-content">
                                                <h3>{branchStats.clients || 0}</h3>
                                                <p>내담자</p>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="stat-card">
                                            <div className="stat-icon admins">
                                                <FaCrown />
                                            </div>
                                            <div className="stat-content">
                                                <h3>{branchStats.admins || 0}</h3>
                                                <p>관리자</p>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Tab>

                    {/* 사용자 관리 탭 */}
                    <Tab eventKey="users" title={
                        <span><FaUsers className="me-1" />사용자 관리</span>
                    }>
                        <Card.Body>
                            {selectedUsers.length > 0 && (
                                <Alert variant="info" className="mb-3">
                                    <strong>{selectedUsers.length}명</strong>의 사용자가 선택되었습니다.
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="ms-3"
                                        onClick={() => setShowTransferModal(true)}
                                    >
                                        <FaExchangeAlt className="me-1" />
                                        지점 이동
                                    </Button>
                                </Alert>
                            )}

                            <div className="table-responsive">
                                <Table hover className="branch-users-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.length === branchUsers.length && branchUsers.length > 0}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    className="form-check-input"
                                                />
                                            </th>
                                            <th>사용자</th>
                                            <th>역할</th>
                                            <th>상태</th>
                                            <th>등록일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branchUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                                                        className="form-check-input"
                                                    />
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="me-2">
                                                            {getRoleIcon(user.role)}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">{user.name}</div>
                                                            <small className="text-muted">{user.email}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg={getRoleBadgeVariant(user.role)}>
                                                        {user.roleDisplayName}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={user.isActive ? 'success' : 'secondary'}>
                                                        {user.isActive ? '활성' : '비활성'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {user.createdAt ? 
                                                            new Date(user.createdAt).toLocaleDateString() : 
                                                            '-'
                                                        }
                                                    </small>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Tab>

                    {/* 설정 탭 */}
                    <Tab eventKey="settings" title={
                        <span><FaCog className="me-1" />설정</span>
                    }>
                        <Card.Body>
                            <div className="settings-section">
                                <h6>운영 시간</h6>
                                <Row>
                                    <Col md={6}>
                                        <div className="setting-item">
                                            <strong>시작 시간:</strong> {branch.operatingHours?.startTime || '09:00'}
                                        </div>
                                        <div className="setting-item">
                                            <strong>종료 시간:</strong> {branch.operatingHours?.endTime || '18:00'}
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="setting-item">
                                            <strong>시간대:</strong> {branch.timezone || 'Asia/Seoul'}
                                        </div>
                                        <div className="setting-item">
                                            <strong>근무일:</strong> {
                                                branch.operatingHours?.workingDays?.length > 0 ?
                                                    branch.operatingHours.workingDays.join(', ') :
                                                    '월-금'
                                            }
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </Card.Body>
                    </Tab>
                </Tabs>
            </Card>

            {/* 사용자 이동 모달 */}
            <BranchUserTransfer
                show={showTransferModal}
                onHide={() => setShowTransferModal(false)}
                selectedUsers={selectedUsers}
                sourceBranch={branch}
                branches={branches}
                onTransferComplete={handleTransferComplete}
            />

            {/* 지점 삭제 확인 모달 */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaTrash className="me-2 text-danger" />
                        지점 삭제 확인
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="danger">
                        <strong>주의:</strong> 지점을 삭제하면 모든 관련 데이터가 영구적으로 삭제됩니다.
                    </Alert>
                    <p>
                        <strong>{branch.name}</strong> 지점을 정말로 삭제하시겠습니까?
                    </p>
                    <ul className="text-danger">
                        <li>지점에 속한 모든 사용자 데이터</li>
                        <li>상담 기록 및 통계</li>
                        <li>지점 설정 정보</li>
                    </ul>
                    <p className="text-muted">
                        이 작업은 되돌릴 수 없습니다.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        취소
                    </Button>
                    <Button variant="danger" onClick={handleBranchDelete}>
                        <FaTrash className="me-2" />
                        삭제 확인
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default BranchDetail;
