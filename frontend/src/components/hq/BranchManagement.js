import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Row, Col, Card, Button, Modal, Form, 
    Table, Badge, Alert, InputGroup, FormControl, 
    FormSelect, FormCheck, Spinner, ButtonGroup,
    Tabs, Tab
} from 'react-bootstrap';
import { 
    FaBuilding, FaUsers, FaUserTie, FaUser, FaCrown, 
    FaSearch, FaFilter, FaExchangeAlt, FaPlus, FaEdit,
    FaChartBar, FaMapMarkerAlt, FaEye
} from 'react-icons/fa';
import { apiGet, apiPost } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import LoadingSpinner from '../common/LoadingSpinner';
import SimpleLayout from '../layout/SimpleLayout';
import './BranchManagement.css';

/**
 * 본사 지점 관리 컴포넌트
 * 컴포넌트화된 지점 관리 및 사용자 지점 이동 기능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const BranchManagement = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchUsers, setBranchUsers] = useState([]);
    const [branchStatistics, setBranchStatistics] = useState({});
    
    // 필터 및 검색
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [includeInactive, setIncludeInactive] = useState(false);
    const [activeTab, setActiveTab] = useState('branches');
    
    // 모달 상태
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [transferForm, setTransferForm] = useState({
        targetBranchCode: '',
        reason: ''
    });
    
    // 컴포넌트 로드
    useEffect(() => {
        loadBranches();
    }, []);
    
    useEffect(() => {
        console.log('🔍 useEffect 트리거 - selectedBranch:', selectedBranch);
        if (selectedBranch) {
            console.log(`📊 지점 ${selectedBranch.code} 선택됨, 데이터 로드 시작`);
            loadBranchStatistics(selectedBranch.code);
            loadBranchUsers(selectedBranch.code);
        }
    }, [selectedBranch, selectedRole, includeInactive]);
    
    // 지점 목록 로드
    const loadBranches = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiGet('/api/hq/branch-management/branches');
            setBranches(response.data || []);
            if (response.data && response.data.length > 0 && !selectedBranch) {
                setSelectedBranch(response.data[0]);
            }
        } catch (error) {
            console.error('지점 목록 로드 실패:', error);
            showNotification('지점 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedBranch]);
    
    // 지점 통계 로드
    const loadBranchStatistics = useCallback(async (branchCode) => {
        try {
            console.log(`📊 지점 ${branchCode} 통계 로드 중...`);
            const response = await apiGet(`/api/hq/branch-management/branches/${branchCode}/statistics`);
            console.log(`📊 지점 ${branchCode} 통계 응답:`, response);
            setBranchStatistics(response || {});
        } catch (error) {
            console.error('지점 통계 로드 실패:', error);
            setBranchStatistics({});
        }
    }, []);
    
    // 지점 사용자 목록 로드
    const loadBranchUsers = useCallback(async (branchCode) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedRole) params.append('role', selectedRole);
            if (includeInactive) params.append('includeInactive', 'true');
            
            const response = await apiGet(`/api/hq/branch-management/branches/${branchCode}/users?${params}`);
            setBranchUsers(response.users || []);
        } catch (error) {
            console.error('지점 사용자 목록 로드 실패:', error);
            showNotification('사용자 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedRole, includeInactive]);
    
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
    
    // 사용자 지점 이동
    const handleBulkTransfer = async () => {
        if (selectedUsers.length === 0) {
            showNotification('이동할 사용자를 선택해주세요.', 'warning');
            return;
        }
        
        if (!transferForm.targetBranchCode) {
            showNotification('대상 지점을 선택해주세요.', 'warning');
            return;
        }
        
        try {
            const requestData = {
                userIds: selectedUsers,
                targetBranchCode: transferForm.targetBranchCode,
                reason: transferForm.reason
            };
            
            const response = await apiPost('/api/hq/branch-management/users/bulk-transfer', requestData);
            
            if (response.success) {
                showNotification(response.message, 'success');
                setShowTransferModal(false);
                setSelectedUsers([]);
                setTransferForm({ targetBranchCode: '', reason: '' });
                if (selectedBranch) {
                    loadBranchUsers(selectedBranch.code);
                    loadBranchStatistics(selectedBranch.code);
                }
            } else {
                showNotification(response.message || '지점 이동에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('사용자 일괄 이동 실패:', error);
            showNotification('사용자 이동에 실패했습니다: ' + (error.message || '알 수 없는 오류'), 'error');
        }
    };
    
    // 필터된 사용자 목록
    const filteredUsers = branchUsers.filter(user => {
        const matchesSearch = !searchTerm || 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });
    
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
    
    return (
        <SimpleLayout title="지점 관리">
            <div className="hq-branch-management">
                <Container fluid className="py-4">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={setActiveTab}
                        className="mb-4"
                    >
                        <Tab eventKey="branches" title={
                            <span><FaBuilding className="me-2" />지점 목록</span>
                        }>
                            <Row>
                                <Col md={3}>
                                    <Card className="branch-list-card h-100">
                                        <Card.Header>
                                            <h5 className="mb-0">
                                                <FaBuilding className="me-2" />
                                                지점 목록 ({branches.length}개)
                                            </h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {loading ? (
                                                <div className="loading-container">
                                                    <LoadingSpinner text="지점 목록을 불러오는 중..." size="small" />
                                                </div>
                                            ) : (
                                                <div>
                                                    {branches.map((branch) => (
                                                        <button
                                                            key={branch.id}
                                                            className={`branch-list-item ${
                                                                selectedBranch?.id === branch.id ? 'active' : ''
                                                            }`}
                                                            onClick={() => setSelectedBranch(branch)}
                                                        >
                                                            <div className="branch-info">
                                                                <strong>{branch.name}</strong>
                                                                <small>{branch.code}</small>
                                                            </div>
                                                            <Badge bg={branch.isActive ? 'success' : 'secondary'}>
                                                                {branch.isActive ? '활성' : '비활성'}
                                                            </Badge>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            
                            <Col md={9}>
                                {selectedBranch && (
                                    <>
                                        {/* 지점 통계 */}
                                        <Row className="mb-4">
                                            <Col>
                                                <Card className="branch-stats-card">
                                                    <Card.Header>
                                                        <h5 className="mb-0">
                                                            <FaChartBar className="me-2" />
                                                            {selectedBranch.name} 통계
                                                        </h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <Row>
                                                            <Col md={2}>
                                                                <div className="stat-item">
                                                                    <span className="stat-number text-primary">{branchStatistics.totalUsers || 0}</span>
                                                                    <span className="stat-label">전체 사용자</span>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div className="stat-item">
                                                                    <span className="stat-number text-success">{branchStatistics.consultants || 0}</span>
                                                                    <span className="stat-label">상담사</span>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div className="stat-item">
                                                                    <span className="stat-number text-primary">{branchStatistics.clients || 0}</span>
                                                                    <span className="stat-label">내담자</span>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div className="stat-item">
                                                                    <span className="stat-number text-warning">{branchStatistics.admins || 0}</span>
                                                                    <span className="stat-label">관리자</span>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div className="stat-item">
                                                                    <span className="stat-number text-info">{branchStatistics.activeUsers || 0}</span>
                                                                    <span className="stat-label">활성</span>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div className="stat-item">
                                                                    <span className="stat-number text-secondary">{branchStatistics.inactiveUsers || 0}</span>
                                                                    <span className="stat-label">비활성</span>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                        
                                        {/* 사용자 목록 */}
                                        <Card className="user-list-card">
                                            <Card.Header>
                                                <Row className="align-items-center">
                                                    <Col>
                                                        <h5 className="mb-0">
                                                            <FaUsers className="me-2" />
                                                            {selectedBranch.name} 사용자 목록
                                                        </h5>
                                                    </Col>
                                                    <Col xs="auto">
                                                        <ButtonGroup>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => setShowTransferModal(true)}
                                                                disabled={selectedUsers.length === 0}
                                                                className="me-2"
                                                            >
                                                                <FaExchangeAlt className="me-1" />
                                                                지점 이동 ({selectedUsers.length})
                                                            </Button>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => loadBranchUsers(selectedBranch.code)}
                                                            >
                                                                <FaSearch className="me-1" />
                                                                새로고침
                                                            </Button>
                                                        </ButtonGroup>
                                                    </Col>
                                                </Row>
                                            </Card.Header>
                                            <Card.Body>
                                                {/* 필터 및 검색 */}
                                                <div className="filter-section">
                                                    <Row>
                                                        <Col md={4}>
                                                            <InputGroup size="sm">
                                                                <InputGroup.Text>
                                                                    <FaSearch />
                                                                </InputGroup.Text>
                                                                <FormControl
                                                                    placeholder="이름 또는 이메일로 검색..."
                                                                    value={searchTerm}
                                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                                />
                                                            </InputGroup>
                                                        </Col>
                                                        <Col md={3}>
                                                            <FormSelect
                                                                size="sm"
                                                                value={selectedRole}
                                                                onChange={(e) => setSelectedRole(e.target.value)}
                                                            >
                                                                <option value="">모든 역할</option>
                                                                <option value="CLIENT">내담자</option>
                                                                <option value="CONSULTANT">상담사</option>
                                                                <option value="ADMIN">관리자</option>
                                                            </FormSelect>
                                                        </Col>
                                                        <Col md={3}>
                                                            <FormCheck
                                                                type="checkbox"
                                                                id="includeInactive"
                                                                label="비활성 사용자 포함"
                                                                checked={includeInactive}
                                                                onChange={(e) => setIncludeInactive(e.target.checked)}
                                                            />
                                                        </Col>
                                                        <Col md={2}>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSearchTerm('');
                                                                    setSelectedRole('');
                                                                    setIncludeInactive(false);
                                                                }}
                                                            >
                                                                <FaFilter className="me-1" />
                                                                초기화
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </div>
                                                
                                                {/* 사용자 테이블 */}
                                                {/* 사용자 선택 안내 */}
                                                {selectedUsers.length > 0 && (
                                                    <Alert variant="info" className="selected-users-alert mb-3">
                                                        <strong>{selectedUsers.length}명</strong>의 사용자가 선택되었습니다. 
                                                        "지점 이동" 버튼을 클릭하여 다른 지점으로 이동시킬 수 있습니다.
                                                    </Alert>
                                                )}
                                                
                                                <div className="user-table">
                                                    {loading ? (
                                                        <div className="loading-container">
                                                            <LoadingSpinner text="사용자 목록을 불러오는 중..." size="medium" />
                                                        </div>
                                                    ) : filteredUsers.length === 0 ? (
                                                        <div className="empty-state">
                                                            <FaUsers className="mb-3" style={{ fontSize: '2rem' }} />
                                                            <p>이 지점에는 사용자가 없습니다.</p>
                                                            <small>다른 지점을 선택하거나 필터를 조정해보세요.</small>
                                                        </div>
                                                    ) : (
                                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                            <Table responsive hover>
                                                                <thead className="sticky-top bg-white">
                                                                    <tr>
                                                                        <th>
                                                                            <FormCheck
                                                                                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                                            />
                                                                        </th>
                                                                        <th>사용자</th>
                                                                        <th>역할</th>
                                                                        <th>지점</th>
                                                                        <th>상태</th>
                                                                        <th>등록일</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                {filteredUsers.map((user) => (
                                                                    <tr key={user.id} className={!user.isActive ? 'table-secondary' : ''}>
                                                                        <td>
                                                                            <FormCheck
                                                                                checked={selectedUsers.includes(user.id)}
                                                                                onChange={(e) => handleUserSelection(user.id, e.target.checked)}
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
                                                                            <Badge bg="info">
                                                                                <FaMapMarkerAlt className="me-1" />
                                                                                {user.branchCode}
                                                                            </Badge>
                                                                        </td>
                                                                        <td>
                                                                            <Badge bg={user.isActive ? 'success' : 'secondary'}>
                                                                                {user.isActive ? '활성' : '비활성'}
                                                                            </Badge>
                                                                        </td>
                                                                        <td>
                                                                            <small>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</small>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </>
                                )}
                            </Col>
                        </Row>
                    </Tab>
                    
                    <Tab eventKey="transfer" title={
                        <span><FaExchangeAlt className="me-2" />지점 이동</span>
                    }>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">
                                    <FaExchangeAlt className="me-2" />
                                    사용자 지점 이동 관리
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Alert variant="info" className="mb-4">
                                    <strong>지점 이동 기능 사용법</strong><br />
                                    1. "지점 목록" 탭에서 원하는 지점을 선택하세요<br />
                                    2. 이동할 사용자들을 체크박스로 선택하세요<br />
                                    3. "지점 이동" 버튼을 클릭하여 대상 지점을 선택하고 이동하세요
                                </Alert>
                                
                                {selectedUsers.length > 0 ? (
                                    <Row>
                                        <Col md={6}>
                                            <Alert variant="success">
                                                <h6><FaUsers className="me-2" />선택된 사용자</h6>
                                                <strong>{selectedUsers.length}명</strong>의 사용자가 선택되었습니다.
                                            </Alert>
                                        </Col>
                                        <Col md={6}>
                                            <div className="d-grid">
                                                <Button 
                                                    variant="primary" 
                                                    size="lg"
                                                    onClick={() => setShowTransferModal(true)}
                                                >
                                                    <FaExchangeAlt className="me-2" />
                                                    {selectedUsers.length}명 지점 이동
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaUsers className="mb-3 text-muted" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">이동할 사용자를 선택해주세요</h5>
                                        <p className="text-muted">
                                            "지점 목록" 탭에서 지점을 선택하고 사용자를 체크한 후<br />
                                            다시 이 탭으로 돌아오시면 이동 기능을 사용할 수 있습니다.
                                        </p>
                                        <Button 
                                            variant="outline-primary" 
                                            onClick={() => setActiveTab('branches')}
                                        >
                                            <FaBuilding className="me-2" />
                                            지점 목록으로 이동
                                        </Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>
                
                {/* 지점 이동 모달 */}
                <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <FaExchangeAlt className="me-2" />
                            사용자 지점 이동
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Alert variant="warning">
                            <strong>{selectedUsers.length}명의 사용자</strong>를 다른 지점으로 이동합니다.
                        </Alert>
                        
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Label>대상 지점</Form.Label>
                                    <FormSelect
                                        value={transferForm.targetBranchCode}
                                        onChange={(e) => setTransferForm(prev => ({
                                            ...prev,
                                            targetBranchCode: e.target.value
                                        }))}
                                        required
                                    >
                                        <option value="">지점을 선택하세요</option>
                                        {branches
                                            .filter(branch => branch.code !== selectedBranch?.code)
                                            .map(branch => (
                                                <option key={branch.id} value={branch.code}>
                                                    {branch.name} ({branch.code})
                                                </option>
                                            ))
                                        }
                                    </FormSelect>
                                </Col>
                                <Col md={6}>
                                    <Form.Label>이동 사유</Form.Label>
                                    <FormControl
                                        type="text"
                                        placeholder="이동 사유를 입력하세요 (선택사항)"
                                        value={transferForm.reason}
                                        onChange={(e) => setTransferForm(prev => ({
                                            ...prev,
                                            reason: e.target.value
                                        }))}
                                    />
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowTransferModal(false)}>
                            취소
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleBulkTransfer}
                            disabled={!transferForm.targetBranchCode}
                        >
                            <FaExchangeAlt className="me-2" />
                            이동 실행
                        </Button>
                    </Modal.Footer>
                </Modal>
                </Container>
            </div>
        </SimpleLayout>
    );
};

export default BranchManagement;
