import React, { useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaSearch } from 'react-icons/fa';
import { apiPost } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';

/**
 * 지점 등록 모달 컴포넌트
 * - 새 지점 등록 기능
 * - 지점 정보 입력 폼
 * - 유효성 검사 및 등록 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-26
 */
const BranchRegistrationModal = ({ show, onHide, onBranchAdded }) => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        branchName: '',
        branchCode: '',
        branchType: 'FRANCHISE',
        address: '',
        addressDetail: '',
        postalCode: '',
        phoneNumber: '',
        email: '',
        websiteUrl: '',
        operatingStartTime: '09:00',
        operatingEndTime: '18:00',
        closedDays: [],
        maxConsultants: 10,
        maxClients: 100,
        description: ''
    });
    const [errors, setErrors] = useState({});

    // 카카오 주소 API 함수
    const openAddressSearch = () => {
        if (window.daum && window.daum.Postcode) {
            new window.daum.Postcode({
                oncomplete: function(data) {
                    // 우편번호와 주소 정보를 해당 필드에 넣는다.
                    setFormData(prev => ({
                        ...prev,
                        postalCode: data.zonecode,
                        address: data.address,
                        addressDetail: ''
                    }));
                    
                    // 에러 메시지 제거
                    setErrors(prev => ({
                        ...prev,
                        postalCode: '',
                        address: ''
                    }));
                }
            }).open();
        } else {
            showNotification('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.', 'warning');
        }
    };

    // 폼 데이터 변경 핸들러
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            const newClosedDays = checked 
                ? [...formData.closedDays, value]
                : formData.closedDays.filter(day => day !== value);
            setFormData(prev => ({ ...prev, closedDays: newClosedDays }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // 에러 메시지 제거
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // 유효성 검사
    const validateForm = () => {
        const newErrors = {};

        if (!formData.branchName.trim()) {
            newErrors.branchName = '지점명을 입력해주세요.';
        }

        if (!formData.branchCode.trim()) {
            newErrors.branchCode = '지점코드를 입력해주세요.';
        } else if (!/^[A-Z0-9_]+$/.test(formData.branchCode)) {
            newErrors.branchCode = '지점코드는 영문 대문자, 숫자, 언더스코어만 사용 가능합니다.';
        }

        if (!formData.address.trim()) {
            newErrors.address = '주소를 입력해주세요.';
        }

        // 우편번호 유효성 검사 (5자리 숫자)
        if (formData.postalCode && !/^\d{5}$/.test(formData.postalCode)) {
            newErrors.postalCode = '우편번호는 5자리 숫자여야 합니다.';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = '전화번호를 입력해주세요.';
        } else if (!/^[0-9-]+$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = '올바른 전화번호 형식을 입력해주세요.';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식을 입력해주세요.';
        }

        if (parseInt(formData.maxConsultants) < 1) {
            newErrors.maxConsultants = '최소 1명 이상이어야 합니다.';
        }

        if (parseInt(formData.maxClients) < 1) {
            newErrors.maxClients = '최소 1명 이상이어야 합니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 지점 등록 처리
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await apiPost('/api/hq/branches', {
                branchName: formData.branchName,
                branchCode: formData.branchCode,
                branchType: formData.branchType,
                address: formData.address,
                addressDetail: formData.addressDetail,
                postalCode: formData.postalCode,
                phoneNumber: formData.phoneNumber,
                email: formData.email,
                websiteUrl: formData.websiteUrl,
                operatingStartTime: formData.operatingStartTime,
                operatingEndTime: formData.operatingEndTime,
                closedDays: formData.closedDays.join(','),
                maxConsultants: parseInt(formData.maxConsultants),
                maxClients: parseInt(formData.maxClients),
                description: formData.description
            });

            showNotification('지점이 성공적으로 등록되었습니다.', 'success');
            onBranchAdded(response.data);
            handleClose();
            
        } catch (error) {
            console.error('지점 등록 실패:', error);
            showNotification('지점 등록에 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 모달 닫기
    const handleClose = () => {
        setFormData({
            branchName: '',
            branchCode: '',
            branchType: 'BRANCH',
            address: '',
            addressDetail: '',
            postalCode: '',
            phoneNumber: '',
            email: '',
            websiteUrl: '',
            operatingStartTime: '09:00',
            operatingEndTime: '18:00',
            closedDays: [],
            maxConsultants: 10,
            maxClients: 100,
            description: '',
            branchStatus: 'ACTIVE'
        });
        setErrors({});
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaBuilding className="me-2" />
                    새 지점 등록
                </Modal.Title>
            </Modal.Header>
            
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Alert variant="info" className="mb-4">
                        <FaBuilding className="me-2" />
                        새 지점을 등록합니다. 모든 필수 정보를 입력해주세요.
                    </Alert>

                    {/* 기본 정보 */}
                    <Row className="mb-4">
                        <Col>
                            <h5 className="mb-3">기본 정보</h5>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>지점명 *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="branchName"
                                    value={formData.branchName}
                                    onChange={handleInputChange}
                                    placeholder="예: 강남점"
                                    isInvalid={!!errors.branchName}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.branchName}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>지점코드 *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="branchCode"
                                    value={formData.branchCode}
                                    onChange={handleInputChange}
                                    placeholder="예: GANGNAM"
                                    isInvalid={!!errors.branchCode}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.branchCode}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>지점 유형</Form.Label>
                                <Form.Select
                                    name="branchType"
                                    value={formData.branchType}
                                    onChange={handleInputChange}
                                >
                                    <option value="FRANCHISE">가맹점</option>
                                    <option value="MAIN">본사</option>
                                    <option value="DIRECT">직영점</option>
                                    <option value="PARTNER">파트너</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>상태</Form.Label>
                                <Form.Select
                                    name="branchStatus"
                                    value={formData.branchStatus}
                                    onChange={handleInputChange}
                                >
                                    <option value="ACTIVE">활성</option>
                                    <option value="INACTIVE">비활성</option>
                                    <option value="MAINTENANCE">점검중</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* 주소 정보 */}
                    <Row className="mb-4">
                        <Col>
                            <h5 className="mb-3">
                                <FaMapMarkerAlt className="me-2" />
                                주소 정보
                            </h5>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>주소 *</Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="예: 서울시 강남구 테헤란로 123"
                                        isInvalid={!!errors.address}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={openAddressSearch}
                                        type="button"
                                        className="d-flex align-items-center"
                                    >
                                        <FaSearch className="me-1" />
                                        주소검색
                                    </Button>
                                </div>
                                <Form.Control.Feedback type="invalid">
                                    {errors.address}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>우편번호</Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        placeholder="예: 12345"
                                        isInvalid={!!errors.postalCode}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={openAddressSearch}
                                        type="button"
                                        className="d-flex align-items-center"
                                    >
                                        <FaSearch className="me-1" />
                                        주소검색
                                    </Button>
                                </div>
                                {errors.postalCode && (
                                    <Form.Control.Feedback type="invalid">
                                        {errors.postalCode}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>상세주소</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="addressDetail"
                                    value={formData.addressDetail}
                                    onChange={handleInputChange}
                                    placeholder="예: 456호"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* 연락처 정보 */}
                    <Row className="mb-4">
                        <Col>
                            <h5 className="mb-3">
                                <FaPhone className="me-2" />
                                연락처 정보
                            </h5>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>전화번호 *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="예: 02-1234-5678"
                                    isInvalid={!!errors.phoneNumber}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.phoneNumber}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>이메일</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="예: branch@mindgarden.com"
                                    isInvalid={!!errors.email}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.email}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>웹사이트 URL</Form.Label>
                                <Form.Control
                                    type="url"
                                    name="websiteUrl"
                                    value={formData.websiteUrl}
                                    onChange={handleInputChange}
                                    placeholder="예: https://branch.mindgarden.com"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* 운영 정보 */}
                    <Row className="mb-4">
                        <Col>
                            <h5 className="mb-3">
                                <FaClock className="me-2" />
                                운영 정보
                            </h5>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>운영 시작 시간</Form.Label>
                                <Form.Control
                                    type="time"
                                    name="operatingStartTime"
                                    value={formData.operatingStartTime}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>운영 종료 시간</Form.Label>
                                <Form.Control
                                    type="time"
                                    name="operatingEndTime"
                                    value={formData.operatingEndTime}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>휴무일</Form.Label>
                                <div className="d-flex flex-wrap gap-2">
                                    {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                                        <Form.Check
                                            key={day}
                                            type="checkbox"
                                            id={`closedDay${index}`}
                                            label={day}
                                            value={day}
                                            checked={formData.closedDays.includes(day)}
                                            onChange={handleInputChange}
                                            inline
                                        />
                                    ))}
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* 제한 정보 */}
                    <Row className="mb-4">
                        <Col>
                            <h5 className="mb-3">제한 정보</h5>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>최대 상담사 수 *</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="maxConsultants"
                                    value={formData.maxConsultants}
                                    onChange={handleInputChange}
                                    min="1"
                                    isInvalid={!!errors.maxConsultants}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.maxConsultants}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>최대 내담자 수 *</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="maxClients"
                                    value={formData.maxClients}
                                    onChange={handleInputChange}
                                    min="1"
                                    isInvalid={!!errors.maxClients}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.maxClients}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* 설명 */}
                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>설명</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="지점에 대한 추가 설명을 입력해주세요."
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        취소
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? '등록 중...' : '지점 등록'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default BranchRegistrationModal;
