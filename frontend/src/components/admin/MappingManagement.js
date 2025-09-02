import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Badge } from 'react-bootstrap';
import { FaLink, FaPlus, FaTrash, FaEye } from 'react-icons/fa';

const MappingManagement = ({ onUpdate, showToast }) => {
    const [mappings, setMappings] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [clients, setClients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedMapping, setSelectedMapping] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        consultantId: '', clientId: '', status: 'ACTIVE', notes: ''
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [mappingsRes, consultantsRes, clientsRes] = await Promise.all([
                fetch('/api/admin/mappings'),
                fetch('/api/admin/consultants'),
                fetch('/api/admin/clients')
            ]);

            if (mappingsRes.ok) {
                const data = await mappingsRes.json();
                setMappings(data.data || []);
            }

            if (consultantsRes.ok) {
                const data = await consultantsRes.json();
                setConsultants(data.data || []);
            }

            if (clientsRes.ok) {
                const data = await clientsRes.json();
                setClients(data.data || []);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/mappings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (response.ok) {
                showToast('매핑이 성공적으로 생성되었습니다.');
                setShowModal(false);
                setForm({ consultantId: '', clientId: '', status: 'ACTIVE', notes: '' });
                loadData();
                onUpdate();
            } else {
                const error = await response.json();
                showToast(error.message || '매핑 생성에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('매핑 생성 실패:', error);
            showToast('매핑 생성에 실패했습니다.', 'danger');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('정말로 이 매핑을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/mappings/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast('매핑이 성공적으로 삭제되었습니다.');
                loadData();
                onUpdate();
            } else {
                const error = await response.json();
                showToast(error.message || '매핑 삭제에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('매핑 삭제 실패:', error);
            showToast('매핑 삭제에 실패했습니다.', 'danger');
        }
    };

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'INACTIVE': return 'secondary';
            case 'SUSPENDED': return 'warning';
            case 'TERMINATED': return 'danger';
            default: return 'secondary';
        }
    };

    const getConsultantName = (consultantId) => {
        const consultant = consultants.find(c => c.id === consultantId);
        return consultant ? consultant.name : '알 수 없음';
    };

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client ? client.name : '알 수 없음';
    };

    return (
        <div className="mapping-management">
            <div className="panel-header">
                <h3 className="panel-title">
                    <i className="bi bi-link-45deg"></i>
                    매핑 관리
                </h3>
                <Button size="sm" variant="primary" onClick={() => setShowModal(true)}>
                    <FaPlus /> 생성
                </Button>
            </div>
            <div className="panel-content">
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">로딩 중...</span>
                        </div>
                    </div>
                ) : mappings.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <FaLink className="mb-3" style={{ fontSize: '2rem' }} />
                        <p>생성된 매핑이 없습니다.</p>
                    </div>
                ) : (
                    <div className="mapping-list">
                        {mappings.slice(0, 5).map((mapping) => (
                            <div key={mapping.id} className="summary-item">
                                <div className="summary-icon">
                                    <FaLink />
                                </div>
                                <div className="summary-info">
                                    <div className="summary-label">
                                        {getConsultantName(mapping.consultantId)} → {getClientName(mapping.clientId)}
                                    </div>
                                    <div className="summary-value">
                                        <Badge bg={getStatusBadgeVariant(mapping.status)}>
                                            {mapping.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="d-flex gap-1">
                                    <Button 
                                        size="sm" 
                                        variant="outline-primary"
                                        onClick={() => {
                                            setSelectedMapping(mapping);
                                            setShowDetailModal(true);
                                        }}
                                    >
                                        <FaEye />
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline-danger"
                                        onClick={() => handleDelete(mapping.id)}
                                    >
                                        <FaTrash />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {mappings.length > 5 && (
                            <div className="text-center mt-2">
                                <small className="text-muted">
                                    외 {mappings.length - 5}개 더...
                                </small>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 매핑 생성 모달 */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>매핑 생성</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>상담사</Form.Label>
                            <Form.Select
                                value={form.consultantId}
                                onChange={(e) => setForm({...form, consultantId: e.target.value})}
                                required
                            >
                                <option value="">상담사를 선택하세요</option>
                                {consultants.map(consultant => (
                                    <option key={consultant.id} value={consultant.id}>
                                        {consultant.name} ({consultant.email})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>내담자</Form.Label>
                            <Form.Select
                                value={form.clientId}
                                onChange={(e) => setForm({...form, clientId: e.target.value})}
                                required
                            >
                                <option value="">내담자를 선택하세요</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.name} ({client.email})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>상태</Form.Label>
                            <Form.Select
                                value={form.status}
                                onChange={(e) => setForm({...form, status: e.target.value})}
                            >
                                <option value="ACTIVE">활성</option>
                                <option value="INACTIVE">비활성</option>
                                <option value="SUSPENDED">중단</option>
                                <option value="TERMINATED">종료</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>메모</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={form.notes}
                                onChange={(e) => setForm({...form, notes: e.target.value})}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                취소
                            </Button>
                            <Button variant="primary" type="submit">
                                생성
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* 매핑 상세 정보 모달 */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>매핑 상세 정보</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedMapping && (
                        <div>
                            <p><strong>상담사:</strong> {getConsultantName(selectedMapping.consultantId)}</p>
                            <p><strong>내담자:</strong> {getClientName(selectedMapping.clientId)}</p>
                            <p><strong>상태:</strong> 
                                <Badge bg={getStatusBadgeVariant(selectedMapping.status)} className="ms-2">
                                    {selectedMapping.status}
                                </Badge>
                            </p>
                            <p><strong>생성일:</strong> {new Date(selectedMapping.createdAt).toLocaleDateString()}</p>
                            {selectedMapping.notes && (
                                <p><strong>메모:</strong> {selectedMapping.notes}</p>
                            )}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default MappingManagement;
