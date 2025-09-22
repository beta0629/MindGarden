import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import { apiPost, apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';

/**
 * 상담사 신청 모달 컴포넌트
 * - 내담자가 상담사로 신청할 수 있는 UI 제공
 * - 자격 요건 확인 및 신청 정보 입력
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const ConsultantApplicationModal = ({ 
    isOpen, 
    onClose, 
    userId, 
    userRole,
    onSuccess 
}) => {
    const [loading, setLoading] = useState(false);
    const [eligibilityChecked, setEligibilityChecked] = useState(false);
    const [isEligible, setIsEligible] = useState(false);
    const [requirements, setRequirements] = useState({});
    const [formData, setFormData] = useState({
        applicationReason: '',
        experience: '',
        certifications: '',
        specialty: '',
        introduction: '',
        contactInfo: '',
        preferredHours: '',
        additionalNotes: ''
    });

    // 모달이 열릴 때마다 자격 요건 확인
    useEffect(() => {
        if (isOpen && userId && userRole === 'CLIENT') {
            checkEligibility();
        }
    }, [isOpen, userId, userRole, checkEligibility]);

    /**
     * 상담사 자격 요건 확인
     */
    const checkEligibility = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiGet(`/api/user/profile/${userId}/consultant-eligibility`);
            
            setIsEligible(response.data);
            setEligibilityChecked(true);
            
            if (!response.data) {
                // 자격 요건 미충족 시 상세 요건 정보 조회
                await getRequirementsDetails();
            }
        } catch (error) {
            console.error('자격 요건 확인 오류:', error);
            showNotification('자격 요건 확인 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    /**
     * 자격 요건 상세 정보 조회 (미충족 시)
     */
    const getRequirementsDetails = async () => {
        try {
            // 자격 요건 상세 정보를 별도 API로 조회하거나 
            // 프로필 완성도 정보를 활용
            const response = await apiGet(`/api/user/profile/${userId}/completion`);
            setRequirements({ completionRate: response.data });
        } catch (error) {
            console.error('자격 요건 상세 정보 조회 오류:', error);
        }
    };

    /**
     * 폼 데이터 변경 핸들러
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /**
     * 상담사 신청 제출
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isEligible) {
            showNotification('상담사 자격 요건을 먼저 충족해주세요.', 'warning');
            return;
        }

        try {
            setLoading(true);
            
            const response = await apiPost(`/api/user/profile/${userId}/apply-consultant`, formData);
            
            if (response.data.success) {
                showNotification(response.data.message, 'success');
                onSuccess && onSuccess(response.data);
                handleClose();
            } else {
                showNotification(response.data.message, 'error');
            }
        } catch (error) {
            console.error('상담사 신청 오류:', error);
            showNotification('상담사 신청 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 모달 닫기
     */
    const handleClose = () => {
        setFormData({
            applicationReason: '',
            experience: '',
            certifications: '',
            specialty: '',
            introduction: '',
            contactInfo: '',
            preferredHours: '',
            additionalNotes: ''
        });
        setEligibilityChecked(false);
        setIsEligible(false);
        setRequirements({});
        onClose();
    };

    // 내담자가 아닌 경우 접근 제한
    if (userRole !== 'CLIENT') {
        return null;
    }

    return (
        <Modal 
            show={isOpen} 
            onHide={handleClose}
            size="lg"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-person-plus me-2"></i>
                    상담사 신청
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                {loading && !eligibilityChecked && (
                    <div className="text-center py-3">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">자격 요건 확인 중...</span>
                        </div>
                        <p className="mt-2 text-muted">자격 요건을 확인하고 있습니다...</p>
                    </div>
                )}

                {eligibilityChecked && !isEligible && (
                    <Alert variant="warning" className="mb-4">
                        <Alert.Heading>
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            상담사 자격 요건 미충족
                        </Alert.Heading>
                        <p>상담사 신청을 위해서는 다음 요건을 충족해야 합니다:</p>
                        <ul className="mb-0">
                            <li>이메일 인증 완료</li>
                            <li>기본 프로필 정보 완성 (성별, 생년월일)</li>
                            <li>만 20세 이상</li>
                        </ul>
                        {requirements.completionRate && (
                            <p className="mt-2 mb-0">
                                <strong>현재 프로필 완성도: {requirements.completionRate}%</strong>
                            </p>
                        )}
                    </Alert>
                )}

                {eligibilityChecked && isEligible && (
                    <Alert variant="success" className="mb-4">
                        <Alert.Heading>
                            <i className="bi bi-check-circle me-2"></i>
                            상담사 자격 요건 충족
                        </Alert.Heading>
                        <p className="mb-0">상담사 신청이 가능합니다. 아래 정보를 입력해주세요.</p>
                    </Alert>
                )}

                {eligibilityChecked && isEligible && (
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>신청 사유 <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="applicationReason"
                                        value={formData.applicationReason}
                                        onChange={handleInputChange}
                                        placeholder="상담사가 되고 싶은 이유를 입력해주세요"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>관련 경험</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleInputChange}
                                        placeholder="상담 관련 경험이나 배경을 입력해주세요"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>보유 자격증</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="certifications"
                                        value={formData.certifications}
                                        onChange={handleInputChange}
                                        placeholder="예: 상담심리사 2급, 사회복지사 1급 등"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>전문 분야</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="specialty"
                                        value={formData.specialty}
                                        onChange={handleInputChange}
                                        placeholder="예: 우울증, 불안장애, 관계 문제 등"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>자기소개 <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="introduction"
                                value={formData.introduction}
                                onChange={handleInputChange}
                                placeholder="간단한 자기소개를 입력해주세요"
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>추가 연락처</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contactInfo"
                                        value={formData.contactInfo}
                                        onChange={handleInputChange}
                                        placeholder="비상 연락처나 카카오톡 ID 등"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>희망 상담 시간</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="preferredHours"
                                        value={formData.preferredHours}
                                        onChange={handleInputChange}
                                        placeholder="예: 평일 오후 2시-6시, 주말 오전 10시-12시"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>추가 메모</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="additionalNotes"
                                value={formData.additionalNotes}
                                onChange={handleInputChange}
                                placeholder="기타 전달하고 싶은 사항이 있다면 입력해주세요"
                            />
                        </Form.Group>
                    </Form>
                )}
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    취소
                </Button>
                {eligibilityChecked && isEligible && (
                    <Button 
                        variant="primary" 
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                신청 중...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-send me-2"></i>
                                상담사 신청
                            </>
                        )}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default ConsultantApplicationModal;
