import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import { Button, Modal, Form, Badge } from 'react-bootstrap';
import { FaUserTie, FaPlus, FaTrash, FaEye } from 'react-icons/fa';
import { getAllConsultantsWithStats } from '../../utils/consultantHelper';

const ConsultantManagement = ({ onUpdate, showToast }) => {
    const [consultants, setConsultants] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        username: '', email: '', password: '', name: '', phone: '', specialization: ''
    });

    const loadConsultants = useCallback(async () => {
        setLoading(true);

        try {
            console.log('🔄 상담사 목록 로딩 시작 (통합 API)...');
            
            // 통합 API 사용 (전문분야 포함)
            const consultantsList = await getAllConsultantsWithStats();
            console.log('📊 통합 API 응답:', consultantsList);
            
            if (consultantsList && consultantsList.length > 0) {
                // 응답 데이터 변환: Map.of() 구조 파싱
                const consultantsData = consultantsList.map(item => {
                    const consultantEntity = item.consultant || {};
                    return {
                        id: consultantEntity.id,
                        name: consultantEntity.name,
                        email: consultantEntity.email,
                        phone: consultantEntity.phone,
                        role: consultantEntity.role,
                        isActive: consultantEntity.isActive,
                        branchCode: consultantEntity.branchCode,
                        specialty: consultantEntity.specialty,
                        specialtyDetails: consultantEntity.specialtyDetails,
                        specialization: consultantEntity.specialization,
                        specializationDetails: consultantEntity.specializationDetails,
                        yearsOfExperience: consultantEntity.yearsOfExperience,
                        maxClients: consultantEntity.maxClients,
                        currentClients: item.currentClients || 0,
                        totalClients: item.totalClients || 0
                    };
                });
                
                setConsultants(consultantsData);
                console.log('✅ 상담사 목록 설정 완료 (통합 API):', consultantsData.length, '명');
            } else {
                console.warn('⚠️ 상담사 데이터 없음');
                setConsultants([]);
            }
        } catch (error) {
            console.error('❌ 상담사 목록 로딩 오류:', error);
            setConsultants([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConsultants();
    }, [loadConsultants]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/consultants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (response.ok) {
                showToast('상담사가 성공적으로 등록되었습니다.');
                setShowModal(false);
                setForm({ username: '', email: '', password: '', name: '', phone: '', specialization: '' });
                loadConsultants();
                onUpdate();
            } else {
                const error = await response.json();
                showToast(error.message || '상담사 등록에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('상담사 등록 실패:', error);
            showToast('상담사 등록에 실패했습니다.', 'danger');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('정말로 이 상담사를 삭제하시겠습니까?', resolve);
    });
    if (!confirmed) {
        return;
    }

        try {
            const response = await fetch(`/api/admin/consultants/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast('상담사가 성공적으로 삭제되었습니다.');
                loadConsultants();
                onUpdate();
            } else {
                const error = await response.json();
                showToast(error.message || '상담사 삭제에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('상담사 삭제 실패:', error);
            showToast('상담사 삭제에 실패했습니다.', 'danger');
        }
    };

    return (
        <div className="consultant-management">
            <div className="panel-header">
                <h3 className="panel-title">
                    <i className="bi bi-person-badge"></i>
                    상담사 관리
                </h3>
                <Button size="sm" variant="primary" onClick={() => setShowModal(true)}>
                    <FaPlus /> 등록
                </Button>
            </div>
            <div className="panel-content">
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">로딩 중...</span>
                        </div>
                    </div>
                ) : consultants.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <FaUserTie className="mb-3 consultant-management-empty-icon" />
                        <p>등록된 상담사가 없습니다.</p>
                    </div>
                ) : (
                    <div className="consultant-list">
                        {consultants.slice(0, 5).map((consultant) => (
                            <div key={consultant.id} className="summary-item">
                                <div className="summary-icon">
                                    <FaUserTie />
                                </div>
                                <div className="summary-info">
                                    <div className="summary-label">{consultant.name}</div>
                                    <div className="summary-value">{consultant.email}</div>
                                </div>
                                <div className="d-flex gap-1">
                                    <Button 
                                        size="sm" 
                                        variant="outline-primary"
                                        onClick={() => {
                                            setSelectedConsultant(consultant);
                                            setShowDetailModal(true);
                                        }}
                                    >
                                        <FaEye />
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline-danger"
                                        onClick={() => handleDelete(consultant.id)}
                                    >
                                        <FaTrash />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {consultants.length > 5 && (
                            <div className="text-center mt-2">
                                <small className="text-muted">
                                    외 {consultants.length - 5}명 더...
                                </small>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 상담사 등록 모달 */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>상담사 등록</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>사용자명</Form.Label>
                            <Form.Control
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm({...form, username: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>이메일</Form.Label>
                            <Form.Control
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({...form, email: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>비밀번호</Form.Label>
                            <Form.Control
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({...form, password: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>이름</Form.Label>
                            <Form.Control
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({...form, name: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>전화번호</Form.Label>
                            <Form.Control
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({...form, phone: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>전문분야</Form.Label>
                            <Form.Control
                                type="text"
                                value={form.specialization}
                                onChange={(e) => setForm({...form, specialization: e.target.value})}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                취소
                            </Button>
                            <Button variant="primary" type="submit">
                                등록
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* 상담사 상세 정보 모달 */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>상담사 상세 정보</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedConsultant && (
                        <div>
                            <p><strong>이름:</strong> {selectedConsultant.name}</p>
                            <p><strong>이메일:</strong> {selectedConsultant.email}</p>
                            <p><strong>전화번호:</strong> {selectedConsultant.phone}</p>
                            <p><strong>전문분야:</strong> {selectedConsultant.specialty || selectedConsultant.specialization || '미설정'}</p>
                            <p><strong>상태:</strong> 
                                <Badge bg={selectedConsultant.isActive ? 'success' : 'secondary'} className="ms-2">
                                    {selectedConsultant.isActive ? '활성' : '비활성'}
                                </Badge>
                            </p>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ConsultantManagement;
