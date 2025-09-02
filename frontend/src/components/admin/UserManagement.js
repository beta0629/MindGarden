import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Badge } from 'react-bootstrap';
import { FaUsers, FaEdit } from 'react-icons/fa';

const UserManagement = ({ onUpdate, showToast }) => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        newRole: ''
    });

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
    }, [loadData]);

    const handleRoleChange = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newRole: form.newRole })
            });

            if (response.ok) {
                showToast('사용자 역할이 성공적으로 변경되었습니다.');
                setShowRoleModal(false);
                setForm({ newRole: '' });
                loadData();
                onUpdate();
            } else {
                const error = await response.json();
                showToast(error.message || '역할 변경에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('역할 변경 실패:', error);
            showToast('역할 변경에 실패했습니다.', 'danger');
        }
    };

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'CLIENT': return 'primary';
            case 'CONSULTANT': return 'success';
            case 'ADMIN': return 'warning';
            case 'SUPER_ADMIN': return 'danger';
            default: return 'secondary';
        }
    };

    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'CLIENT': return '내담자';
            case 'CONSULTANT': return '상담사';
            case 'ADMIN': return '관리자';
            case 'SUPER_ADMIN': return '최고관리자';
            default: return role;
        }
    };

    return (
        <div className="user-management">
            <div className="panel-header">
                <h3 className="panel-title">
                    <i className="bi bi-people-fill"></i>
                    사용자 관리
                </h3>
            </div>
            <div className="panel-content">
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">로딩 중...</span>
                        </div>
                    </div>
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
                                    <Button 
                                        size="sm" 
                                        variant="outline-primary"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setForm({ newRole: user.role });
                                            setShowRoleModal(true);
                                        }}
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
            </div>

            {/* 역할 변경 모달 */}
            <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>사용자 역할 변경</Modal.Title>
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
                            <Form.Group className="mb-3">
                                <Form.Label>새로운 역할</Form.Label>
                                <Form.Select
                                    value={form.newRole}
                                    onChange={(e) => setForm({...form, newRole: e.target.value})}
                                    required
                                >
                                    <option value="">역할을 선택하세요</option>
                                    {roles.map(role => (
                                        <option key={role} value={role}>
                                            {getRoleDisplayName(role)}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
                                    취소
                                </Button>
                                <Button variant="primary" type="submit">
                                    변경
                                </Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default UserManagement;
