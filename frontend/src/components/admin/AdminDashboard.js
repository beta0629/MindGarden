import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Table, Toast, Badge } from 'react-bootstrap';
import { FaUsers, FaUserTie, FaLink, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [consultants, setConsultants] = useState([]);
    const [clients, setClients] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [stats, setStats] = useState({
        totalConsultants: 0,
        totalClients: 0,
        totalMappings: 0,
        activeMappings: 0
    });
    
    const [showConsultantModal, setShowConsultantModal] = useState(false);
    const [showClientModal, setShowClientModal] = useState(false);
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // 모달 상태
    const [consultantForm, setConsultantForm] = useState({
        username: '', email: '', password: '', name: '', phone: '', specialization: ''
    });
    const [clientForm, setClientForm] = useState({
        username: '', email: '', password: '', name: '', phone: '', consultationPurpose: ''
    });
    const [mappingForm, setMappingForm] = useState({
        consultantId: '', clientId: '', notes: ''
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [consultantsRes, clientsRes, mappingsRes] = await Promise.all([
                fetch('/api/admin/consultants'),
                fetch('/api/admin/clients'),
                fetch('/api/admin/mappings')
            ]);

            if (consultantsRes.ok) {
                const consultantsData = await consultantsRes.json();
                setConsultants(consultantsData.data || []);
                setStats(prev => ({ ...prev, totalConsultants: consultantsData.count || 0 }));
            }

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json();
                setClients(clientsData.data || []);
                setStats(prev => ({ ...prev, totalClients: clientsData.count || 0 }));
            }

            if (mappingsRes.ok) {
                const mappingsData = await mappingsRes.json();
                setMappings(mappingsData.data || []);
                setStats(prev => ({ 
                    ...prev, 
                    totalMappings: mappingsData.count || 0,
                    activeMappings: (mappingsData.data || []).filter(m => m.status === 'ACTIVE').length
                }));
            }
        } catch (error) {
            console.error('대시보드 데이터 로드 실패:', error);
            showToast('데이터 로드에 실패했습니다.', 'danger');
        }
    };

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleConsultantSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/consultants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(consultantForm)
            });

            if (response.ok) {
                showToast('상담사가 성공적으로 등록되었습니다.');
                setShowConsultantModal(false);
                setConsultantForm({ username: '', email: '', password: '', name: '', phone: '', specialization: '' });
                loadDashboardData();
            } else {
                const error = await response.json();
                showToast(error.message || '상담사 등록에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('상담사 등록 실패:', error);
            showToast('상담사 등록에 실패했습니다.', 'danger');
        }
    };

    const handleClientSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientForm)
            });

            if (response.ok) {
                showToast('내담자가 성공적으로 등록되었습니다.');
                setShowClientModal(false);
                setClientForm({ username: '', email: '', password: '', name: '', phone: '', consultationPurpose: '' });
                loadDashboardData();
            } else {
                const error = await response.json();
                showToast(error.message || '내담자 등록에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('내담자 등록 실패:', error);
            showToast('내담자 등록에 실패했습니다.', 'danger');
        }
    };

    const handleMappingSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/mappings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mappingForm)
            });

            if (response.ok) {
                showToast('매핑이 성공적으로 생성되었습니다.');
                setShowMappingModal(false);
                setMappingForm({ consultantId: '', clientId: '', notes: '' });
                loadDashboardData();
            } else {
                const error = await response.json();
                showToast(error.message || '매핑 생성에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('매핑 생성 실패:', error);
            showToast('매핑 생성에 실패했습니다.', 'danger');
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>관리자 대시보드</h1>
                <p>상담사, 내담자, 매핑을 관리하세요</p>
            </div>

            {/* 통계 카드 */}
            <div className="stats-grid">
                <Card className="stat-card">
                    <Card.Body>
                        <div className="stat-content">
                            <FaUsers className="stat-icon" />
                            <div>
                                <h3>{stats.totalConsultants}</h3>
                                <p>전체 상담사</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card className="stat-card">
                    <Card.Body>
                        <div className="stat-content">
                            <FaUserTie className="stat-icon" />
                            <div>
                                <h3>{stats.totalClients}</h3>
                                <p>전체 내담자</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card className="stat-card">
                    <Card.Body>
                        <div className="stat-content">
                            <FaLink className="stat-icon" />
                            <div>
                                <h3>{stats.totalMappings}</h3>
                                <p>전체 매핑</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card className="stat-card">
                    <Card.Body>
                        <div className="stat-content">
                            <FaLink className="stat-icon" />
                            <div>
                                <h3>{stats.activeMappings}</h3>
                                <p>활성 매핑</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* 액션 버튼 */}
            <div className="action-buttons">
                <Button variant="primary" onClick={() => setShowConsultantModal(true)}>
                    <FaPlus /> 상담사 등록
                </Button>
                <Button variant="success" onClick={() => setShowClientModal(true)}>
                    <FaPlus /> 내담자 등록
                </Button>
                <Button variant="info" onClick={() => setShowMappingModal(true)}>
                    <FaLink /> 매핑 생성
                </Button>
            </div>

            {/* 매핑 목록 */}
            <Card className="mappings-card">
                <Card.Header>
                    <h5>최근 매핑</h5>
                </Card.Header>
                <Card.Body>
                    <Table responsive>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>상담사</th>
                                <th>내담자</th>
                                <th>상태</th>
                                <th>생성일</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mappings.slice(0, 5).map((mapping) => (
                                <tr key={mapping.id}>
                                    <td>{mapping.id}</td>
                                    <td>{mapping.consultantName}</td>
                                    <td>{mapping.clientName}</td>
                                    <td>
                                        <Badge bg={mapping.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                            {mapping.status}
                                        </Badge>
                                    </td>
                                    <td>{new Date(mapping.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <Button size="sm" variant="outline-primary" className="me-2">
                                            <FaEye />
                                        </Button>
                                        <Button size="sm" variant="outline-warning" className="me-2">
                                            <FaEdit />
                                        </Button>
                                        <Button size="sm" variant="outline-danger">
                                            <FaTrash />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* 상담사 등록 모달 */}
            <Modal show={showConsultantModal} onHide={() => setShowConsultantModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>상담사 등록</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleConsultantSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>사용자명</Form.Label>
                            <Form.Control
                                type="text"
                                value={consultantForm.username}
                                onChange={(e) => setConsultantForm({...consultantForm, username: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>이메일</Form.Label>
                            <Form.Control
                                type="email"
                                value={consultantForm.email}
                                onChange={(e) => setConsultantForm({...consultantForm, email: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>비밀번호</Form.Label>
                            <Form.Control
                                type="password"
                                value={consultantForm.password}
                                onChange={(e) => setConsultantForm({...consultantForm, password: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>이름</Form.Label>
                            <Form.Control
                                type="text"
                                value={consultantForm.name}
                                onChange={(e) => setConsultantForm({...consultantForm, name: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>전화번호</Form.Label>
                            <Form.Control
                                type="tel"
                                value={consultantForm.phone}
                                onChange={(e) => setConsultantForm({...consultantForm, phone: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>전문분야</Form.Label>
                            <Form.Control
                                type="text"
                                value={consultantForm.specialization}
                                onChange={(e) => setConsultantForm({...consultantForm, specialization: e.target.value})}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowConsultantModal(false)}>
                                취소
                            </Button>
                            <Button variant="primary" type="submit">
                                등록
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* 내담자 등록 모달 */}
            <Modal show={showClientModal} onHide={() => setShowClientModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>내담자 등록</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleClientSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>사용자명</Form.Label>
                            <Form.Control
                                type="text"
                                value={clientForm.username}
                                onChange={(e) => setClientForm({...clientForm, username: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>이메일</Form.Label>
                            <Form.Control
                                type="email"
                                value={clientForm.email}
                                onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>비밀번호</Form.Label>
                            <Form.Control
                                type="password"
                                value={clientForm.password}
                                onChange={(e) => setClientForm({...clientForm, password: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>이름</Form.Label>
                            <Form.Control
                                type="text"
                                value={clientForm.name}
                                onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>전화번호</Form.Label>
                            <Form.Control
                                type="tel"
                                value={clientForm.phone}
                                onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>상담 목적</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={clientForm.consultationPurpose}
                                onChange={(e) => setClientForm({...clientForm, consultationPurpose: e.target.value})}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowClientModal(false)}>
                                취소
                            </Button>
                            <Button variant="success" type="submit">
                                등록
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* 매핑 생성 모달 */}
            <Modal show={showMappingModal} onHide={() => setShowMappingModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>매핑 생성</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleMappingSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>상담사</Form.Label>
                            <Form.Select
                                value={mappingForm.consultantId}
                                onChange={(e) => setMappingForm({...mappingForm, consultantId: e.target.value})}
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
                                value={mappingForm.clientId}
                                onChange={(e) => setMappingForm({...mappingForm, clientId: e.target.value})}
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
                            <Form.Label>메모</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={mappingForm.notes}
                                onChange={(e) => setMappingForm({...mappingForm, notes: e.target.value})}
                                placeholder="매핑에 대한 메모를 입력하세요"
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowMappingModal(false)}>
                                취소
                            </Button>
                            <Button variant="info" type="submit">
                                생성
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* 토스트 알림 */}
            <Toast 
                show={showToast} 
                onClose={() => setShowToast(false)}
                className={`toast-${toastType}`}
                style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
            >
                <Toast.Header>
                    <strong className="me-auto">알림</strong>
                </Toast.Header>
                <Toast.Body>{toastMessage}</Toast.Body>
            </Toast>
        </div>
    );
};

export default AdminDashboard;
