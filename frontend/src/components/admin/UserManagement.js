import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Badge, Container, Row, Col, Card, InputGroup } from 'react-bootstrap';
import { FaUsers, FaEdit, FaUser, FaUserTie, FaCrown, FaBuilding, FaSearch, FaFilter } from 'react-icons/fa';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import LoadingSpinner from '../common/LoadingSpinner';
import SimpleLayout from '../layout/SimpleLayout';
import csrfTokenManager from '../../utils/csrfTokenManager';
import './UserManagement.css';

const UserManagement = ({ onUpdate, showToast }) => {
    // showToast가 없으면 기본 notification 사용
    const toast = showToast || showNotification;
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [includeInactive, setIncludeInactive] = useState(false);
    const [form, setForm] = useState({
        newRole: ''
    });

    // 역할 코드 로드
    const loadRoleCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/common-codes/group/ROLE');
            if (response && response.length > 0) {
                const options = response.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel,
                    icon: code.icon,
                    color: code.colorCode,
                    description: code.description
                }));
                setRoleOptions(options);
            }
        } catch (error) {
            console.error('역할 코드 로드 실패:', error);
            // 실패 시 기본값 설정
            setRoleOptions([
                { value: 'CLIENT', label: '내담자', icon: '👤', color: '#3b82f6', description: '상담을 받는 내담자' },
                { value: 'CONSULTANT', label: '상담사', icon: '👨‍⚕️', color: '#10b981', description: '상담을 제공하는 상담사' },
                { value: 'ADMIN', label: '관리자', icon: '👨‍💼', color: '#f59e0b', description: '시스템 관리자' },
                { value: 'BRANCH_SUPER_ADMIN', label: '수퍼관리자', icon: '👑', color: '#ef4444', description: '최고 관리자' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                fetch(`/api/admin/users?includeInactive=${includeInactive}`),
                fetch('/api/admin/users/roles')
            ]);

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.data || []);
            }

            if (rolesRes.ok) {
                const data = await rolesRes.json();
                setRoles(data || []);
            }
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [includeInactive]);

    useEffect(() => {
        loadData();
        loadRoleCodes();
    }, [loadData, loadRoleCodes]);

    // 필터링 로직
    useEffect(() => {
        let filtered = users;

        // 역할 필터
        if (selectedRole) {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        // 검색 필터 (이름, 이메일)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user => 
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term)
            );
        }

        // 비활성 사용자 포함 옵션이 꺼져있으면 활성 사용자만 표시
        if (!includeInactive) {
            filtered = filtered.filter(user => user.isActive !== false);
        }

        setFilteredUsers(filtered);
    }, [users, selectedRole, searchTerm, includeInactive]);

    const handleRoleChange = async (e) => {
        e.preventDefault();
        
        // 내담자→상담사 변경 시 확인 메시지
        if (selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT') {
            const confirmed = window.confirm(
                `${selectedUser.name}님을 상담사로 변경하시겠습니까?\n\n` +
                '이 변경으로 인해:\n' +
                '• 상담사 메뉴와 기능에 접근 가능\n' +
                '• 내담자 관리, 스케줄 관리 권한 부여\n' +
                '• 필요시 다시 내담자로 되돌릴 수 있음'
            );
            if (!confirmed) return;
        }
        
        try {
            const response = await csrfTokenManager.put(`/api/admin/users/${selectedUser.id}/role?newRole=${form.newRole}`);

            const result = await response.json();

            if (response.ok && result.success) {
                const message = selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT' 
                    ? `${selectedUser.name}님이 상담사로 성공적으로 변경되었습니다.`
                    : result.message || '사용자 역할이 성공적으로 변경되었습니다.';
                toast(message, 'success');
                setShowRoleModal(false);
                setForm({ newRole: '' });
                loadData();
                onUpdate && onUpdate();
            } else {
                toast(result.message || '역할 변경에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('역할 변경 실패:', error);
            toast('역할 변경에 실패했습니다.', 'danger');
        }
    };

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'CLIENT': return 'primary';
            case 'CONSULTANT': return 'success';
            case 'ADMIN': return 'warning';
            case 'BRANCH_SUPER_ADMIN': return 'danger';
            default: return 'secondary';
        }
    };

    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'CLIENT': return '내담자';
            case 'CONSULTANT': return '상담사';
            case 'ADMIN': return '관리자';
            case 'BRANCH_SUPER_ADMIN': return '최고관리자';
            default: return role;
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'CLIENT': return <FaUser />;
            case 'CONSULTANT': return <FaUserTie />;
            case 'ADMIN': return <FaBuilding />;
            case 'BRANCH_SUPER_ADMIN': return <FaCrown />;
            default: return <FaUsers />;
        }
    };

    return (
        <SimpleLayout title="사용자 관리">
            <Container fluid className="py-4">
                <Row>
                    <Col>
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <i className="bi bi-people-fill me-2"></i>
                                    사용자 목록 ({filteredUsers.length}명)
                                </h5>
                                <Button variant="outline-primary" size="sm" onClick={loadData}>
                                    <i className="bi bi-arrow-clockwise me-1"></i>
                                    새로고침
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                {/* 필터 및 검색 */}
                                <Row className="mb-4">
                                    <Col md={5}>
                                        <InputGroup>
                                            <InputGroup.Text>
                                                <FaSearch />
                                            </InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="이름 또는 이메일로 검색..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        >
                                            <option value="">모든 역할</option>
                                            <option value="CLIENT">내담자</option>
                                            <option value="CONSULTANT">상담사</option>
                                            <option value="ADMIN">관리자</option>
                                            <option value="BRANCH_SUPER_ADMIN">최고관리자</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Check
                                            type="checkbox"
                                            id="includeInactive"
                                            label="비활성 사용자 포함"
                                            checked={includeInactive}
                                            onChange={(e) => setIncludeInactive(e.target.checked)}
                                        />
                                    </Col>
                                    <Col md={1}>
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
                {loading ? (
                    <LoadingSpinner text="사용자 목록을 불러오는 중..." size="medium" />
                ) : users.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <FaUsers className="mb-3 empty-icon" />
                        <p>등록된 사용자가 없습니다.</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <FaSearch className="mb-3 empty-icon" />
                        <p>검색 결과가 없습니다.</p>
                        <small>다른 검색어나 필터를 시도해보세요.</small>
                    </div>
                ) : (
                    <Row>
                        {filteredUsers.map((user) => (
                            <Col key={user.id} md={6} lg={4} xl={3} className="mb-3">
                                <Card className={`h-100 user-card ${user.isActive === false ? 'inactive-user' : ''}`}>
                                    <Card.Body className="d-flex flex-column">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="user-avatar me-3">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1 text-truncate" title={user.name}>
                                                    {user.name}
                                                </h6>
                                                <small className="text-muted text-truncate d-block" title={user.email}>
                                                    {user.email}
                                                </small>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-3">
                                            <div className="d-flex gap-2 mb-2">
                                                <Badge bg={getRoleBadgeVariant(user.role)} className="flex-fill">
                                                    {getRoleDisplayName(user.role)}
                                                </Badge>
                                                {user.isActive === false && (
                                                    <Badge bg="secondary" className="flex-shrink-0">
                                                        비활성
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="mt-auto">
                                            <div className="d-flex gap-2">
                                                {/* 내담자→상담사 빠른 변경 버튼 */}
                                                {user.role === 'CLIENT' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="success"
                                                        className="flex-fill"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setForm({ newRole: 'CONSULTANT' });
                                                            setShowRoleModal(true);
                                                        }}
                                                        title="내담자를 상담사로 변경"
                                                    >
                                                        <i className="bi bi-person-plus me-1"></i>
                                                        상담사로
                                                    </Button>
                                                )}
                                                
                                                {/* 일반 역할 변경 버튼 */}
                                                <Button 
                                                    size="sm" 
                                                    variant="outline-primary"
                                                    className="flex-fill"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setForm({ newRole: user.role });
                                                        setShowRoleModal(true);
                                                    }}
                                                    title="역할 변경"
                                                >
                                                    <FaEdit className="me-1" />
                                                    변경
                                                </Button>
                                            </div>
                                        </div>
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
            </Container>

            {/* 역할 변경 모달 */}
            <Modal 
                show={showRoleModal} 
                onHide={() => setShowRoleModal(false)} 
                size="lg"
                className="user-management-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="user-management-modal-title">
                        <i className="bi bi-person-gear"></i>
                        사용자 역할 변경
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <Form onSubmit={handleRoleChange}>
                            <div className="mb-3">
                                <strong>사용자:</strong> {selectedUser.name} ({selectedUser.email})
                            </div>
                            <div className="mb-3">
                                <strong>현재 역할:</strong> 
                                <Badge bg={getRoleBadgeVariant(selectedUser.role)} className="ms-2">
                                    {getRoleDisplayName(selectedUser.role)}
                                </Badge>
                            </div>
                            
                            {/* 내담자→상담사 변경 시 특별 안내 */}
                            {selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT' && (
                                <div className="alert alert-info mb-3">
                                    <h6><i className="bi bi-info-circle me-2"></i>상담사 역할 변경 안내</h6>
                                    <ul className="mb-0">
                                        <li>사용자가 상담사 역할로 변경됩니다.</li>
                                        <li>상담사 메뉴와 기능에 접근할 수 있게 됩니다.</li>
                                        <li>내담자 관리, 스케줄 관리 등의 권한이 부여됩니다.</li>
                                        <li>변경 후에는 다시 내담자로 되돌릴 수 있습니다.</li>
                                    </ul>
                                </div>
                            )}
                            
                            <Form.Group className="mb-3">
                                <Form.Label className="user-management-form-label">
                                    새로운 역할
                                </Form.Label>
                                <select
                                    className="role-select-dropdown"
                                    value={form.newRole}
                                    onChange={(e) => setForm({...form, newRole: e.target.value})}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        fontSize: 'var(--font-size-sm)',
                                        border: '2px solid #007bff',
                                        borderRadius: '6px',
                                        backgroundColor: '#fff',
                                        color: '#495057',
                                        outline: 'none',
                                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                                        zIndex: 10000,
                                        position: 'relative',
                                        appearance: 'menulist',
                                        WebkitAppearance: 'menulist',
                                        MozAppearance: 'menulist',
                                        cursor: 'pointer',
                                        minHeight: '38px',
                                        boxSizing: 'border-box',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#80bdff';
                                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#ced4da';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">역할을 선택하세요</option>
                                    {roleOptions.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.icon} {role.label} ({role.value})
                                        </option>
                                    ))}
                                </select>
                            </Form.Group>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowRoleModal(false)}
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: 'var(--font-size-sm)',
                                        border: '1px solid #6c757d',
                                        borderRadius: '4px',
                                        backgroundColor: '#6c757d',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s ease-in-out'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor = '#5a6268';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = '#6c757d';
                                    }}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.newRole === selectedUser.role}
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: 'var(--font-size-sm)',
                                        border: '1px solid #007bff',
                                        borderRadius: '4px',
                                        backgroundColor: form.newRole === selectedUser.role ? '#6c757d' : '#007bff',
                                        color: '#fff',
                                        cursor: form.newRole === selectedUser.role ? 'not-allowed' : 'pointer',
                                        transition: 'background-color 0.15s ease-in-out',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onMouseOver={(e) => {
                                        if (form.newRole !== selectedUser.role) {
                                            e.target.style.backgroundColor = '#0056b3';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (form.newRole !== selectedUser.role) {
                                            e.target.style.backgroundColor = '#007bff';
                                        }
                                    }}
                                >
                                    <i className="bi bi-check-lg"></i>
                                    {selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT' 
                                        ? '상담사로 변경' 
                                        : '역할 변경'}
                                </button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </SimpleLayout>
    );
};

export default UserManagement;
