import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Badge, Container, Row, Col, Card } from 'react-bootstrap';
import { FaUsers, FaEdit } from 'react-icons/fa';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import LoadingSpinner from '../common/LoadingSpinner';

const UserManagement = ({ onUpdate, showToast }) => {
    // showToast가 없으면 기본 notification 사용
    const toast = showToast || showNotification;
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        newRole: ''
    });

    // 역할 코드 로드
    const loadRoleCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/admin/common-codes/values?groupCode=ROLE');
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
                fetch('/api/admin/users'),
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
    }, []);

    useEffect(() => {
        loadData();
        loadRoleCodes();
    }, [loadData, loadRoleCodes]);

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
            const response = await fetch(`/api/admin/users/${selectedUser.id}/role?newRole=${form.newRole}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const message = selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT' 
                    ? `${selectedUser.name}님이 상담사로 성공적으로 변경되었습니다.`
                    : '사용자 역할이 성공적으로 변경되었습니다.';
                toast(message, 'success');
                setShowRoleModal(false);
                setForm({ newRole: '' });
                loadData();
                onUpdate();
            } else {
                const error = await response.json();
                toast(error.message || '역할 변경에 실패했습니다.', 'danger');
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

    return (
        <Container fluid className="py-4">
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">
                                <i className="bi bi-people-fill me-2"></i>
                                사용자 관리
                            </h5>
                        </Card.Header>
                        <Card.Body>
                {loading ? (
                    <LoadingSpinner text="사용자 목록을 불러오는 중..." size="medium" />
                ) : users.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <FaUsers className="mb-3" style={{ fontSize: '2rem' }} />
                        <p>등록된 사용자가 없습니다.</p>
                    </div>
                ) : (
                    <div className="user-list">
                        {users.slice(0, 5).map((user) => (
                            <div key={user.id} className="summary-item">
                                <div className="summary-icon">
                                    <FaUsers />
                                </div>
                                <div className="summary-info">
                                    <div className="summary-label">{user.name}</div>
                                    <div className="summary-value">
                                        {user.email} | 
                                        <Badge bg={getRoleBadgeVariant(user.role)} className="ms-2">
                                            {getRoleDisplayName(user.role)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="d-flex gap-1">
                                    {/* 내담자→상담사 빠른 변경 버튼 */}
                                    {user.role === 'CLIENT' && (
                                        <Button 
                                            size="sm" 
                                            variant="success"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setForm({ newRole: 'CONSULTANT' });
                                                setShowRoleModal(true);
                                            }}
                                            title="내담자를 상담사로 변경"
                                        >
                                            <i className="bi bi-person-plus"></i>
                                        </Button>
                                    )}
                                    
                                    {/* 일반 역할 변경 버튼 */}
                                    <Button 
                                        size="sm" 
                                        variant="outline-primary"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setForm({ newRole: user.role });
                                            setShowRoleModal(true);
                                        }}
                                        title="역할 변경"
                                    >
                                        <FaEdit />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {users.length > 5 && (
                            <div className="text-center mt-2">
                                <small className="text-muted">
                                    외 {users.length - 5}명 더...
                                </small>
                            </div>
                        )}
                    </div>
                )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* 역할 변경 모달 */}
            <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-person-gear me-2"></i>
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
                                <Form.Label>새로운 역할</Form.Label>
                                <Form.Select
                                    value={form.newRole}
                                    onChange={(e) => setForm({...form, newRole: e.target.value})}
                                    required
                                >
                                    <option value="">역할을 선택하세요</option>
                                    {roleOptions.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.icon} {role.label} ({role.value})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            
                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
                                    취소
                                </Button>
                                <Button 
                                    variant="primary" 
                                    type="submit"
                                    disabled={form.newRole === selectedUser.role}
                                >
                                    <i className="bi bi-check-lg me-2"></i>
                                    {selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT' 
                                        ? '상담사로 변경' 
                                        : '역할 변경'}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default UserManagement;
