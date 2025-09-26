import React, { useState, useEffect } from 'react';
import { 
    Modal, Form, Button, Row, Col, Alert, 
    FormControl, FormSelect, FormCheck
} from 'react-bootstrap';
import { 
    FaBuilding, FaMapMarkerAlt, FaUser, FaPhone, 
    FaEnvelope, FaSave, FaTimes, FaExclamationTriangle
} from 'react-icons/fa';
import { apiPost, apiPut } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import { getCommonCodes } from '../../utils/commonCodeUtils';
import './BranchForm.css';

/**
 * 지점 등록/수정 폼 컴포넌트
 * - 지점 정보 입력 및 수정
 * - 유효성 검사 및 에러 처리
 * - 지점장 할당 기능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const BranchForm = ({ 
    show, 
    onHide, 
    onSuccess, 
    branch = null, 
    managers = [] 
}) => {
    // 폼 상태 관리
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        isActive: true,
        managerId: '',
        timezone: 'Asia/Seoul',
        operatingHours: {
            startTime: '09:00',
            endTime: '18:00',
            workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
        }
    });

    // UI 상태 관리
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // 지점 코드 중복 체크
    const [codeChecking, setCodeChecking] = useState(false);
    const [codeAvailable, setCodeAvailable] = useState(null);

    // 공통코드 옵션
    const [workingDayOptions, setWorkingDayOptions] = useState([]);
    const [timezoneOptions, setTimezoneOptions] = useState([]);

    // 공통코드 옵션 로드
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [workingDays, timezones] = await Promise.all([
                    getCommonCodes('WORKING_DAY'),
                    getCommonCodes('TIMEZONE')
                ]);
                
                setWorkingDayOptions(workingDays);
                setTimezoneOptions(timezones);
            } catch (error) {
                console.error('공통코드 옵션 로드 실패:', error);
                showNotification('공통코드 옵션을 불러오는데 실패했습니다.', 'error');
            }
        };
        
        if (show) {
            loadOptions();
        }
    }, [show]);

    // 모달이 열릴 때 초기 데이터 설정
    useEffect(() => {
        const initializeForm = async () => {
            if (show) {
                if (branch) {
                    // 수정 모드: 기존 지점 데이터로 폼 초기화
                    setFormData({
                        name: branch.name || '',
                        code: branch.branchCode || '',
                        address: branch.address || '',
                        phone: branch.phone || '',
                        email: branch.email || '',
                        description: branch.description || '',
                        isActive: branch.isActive !== undefined ? branch.isActive : true,
                        managerId: branch.managerId || '',
                        timezone: branch.timezone || 'Asia/Seoul',
                        operatingHours: branch.operatingHours || {
                            startTime: '09:00',
                            endTime: '18:00',
                            workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
                        }
                    });
                } else {
                    // 등록 모드: 기본값으로 초기화
                    setFormData({
                        name: '',
                        code: '',
                        address: '',
                        phone: '',
                        email: '',
                        description: '',
                        isActive: true,
                        managerId: '',
                        timezone: 'Asia/Seoul',
                        operatingHours: {
                            startTime: '09:00',
                            endTime: '18:00',
                            workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
                        }
                    });
                }
                setErrors({});
                setTouched({});
                setCodeAvailable(null);
            }
        };
        
        initializeForm();
    }, [show, branch]);

    // 입력 필드 변경 핸들러
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // 해당 필드를 터치된 것으로 표시
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));

        // 에러 제거
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // 중첩된 객체 필드 변경 핸들러
    const handleNestedInputChange = (parentField, childField, value) => {
        setFormData(prev => ({
            ...prev,
            [parentField]: {
                ...prev[parentField],
                [childField]: value
            }
        }));
    };

    // 배열 필드 변경 핸들러 (근무일)
    const handleWorkingDaysChange = (day, checked) => {
        setFormData(prev => ({
            ...prev,
            operatingHours: {
                ...prev.operatingHours,
                workingDays: checked 
                    ? [...prev.operatingHours.workingDays, day]
                    : prev.operatingHours.workingDays.filter(d => d !== day)
            }
        }));
    };

    // 지점 코드 중복 체크
    const checkCodeAvailability = async (code) => {
        if (!code || code.length < 2) return;
        
        setCodeChecking(true);
        try {
            const response = await fetch(`/api/branches/validate/branch-code?branchCode=${encodeURIComponent(code)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setCodeAvailable(!data.isDuplicate);
            } else {
                setCodeAvailable(null);
            }
        } catch (error) {
            console.error('지점 코드 중복 체크 실패:', error);
            setCodeAvailable(null);
        } finally {
            setCodeChecking(false);
        }
    };

    // 지점 코드 변경 핸들러
    const handleCodeChange = (value) => {
        handleInputChange('code', value.toUpperCase());
        
        // 중복 체크 (디바운스)
        if (value.length >= 2) {
            setTimeout(() => {
                checkCodeAvailability(value.toUpperCase());
            }, 500);
        } else {
            setCodeAvailable(null);
        }
    };

    // 폼 유효성 검사
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = '지점명을 입력해주세요';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = '지점명은 2자 이상이어야 합니다';
        } else if (formData.name.trim().length > 50) {
            newErrors.name = '지점명은 50자를 초과할 수 없습니다';
        }

        if (!formData.code.trim()) {
            newErrors.code = '지점 코드를 입력해주세요';
        } else if (formData.code.trim().length < 2) {
            newErrors.code = '지점 코드는 2자 이상이어야 합니다';
        } else if (formData.code.trim().length > 20) {
            newErrors.code = '지점 코드는 20자를 초과할 수 없습니다';
        } else if (!/^[A-Z0-9_]+$/.test(formData.code.trim())) {
            newErrors.code = '지점 코드는 영문 대문자, 숫자, 언더스코어만 사용 가능합니다';
        }

        if (!formData.address.trim()) {
            newErrors.address = '주소를 입력해주세요';
        } else if (formData.address.trim().length < 5) {
            newErrors.address = '주소는 5자 이상이어야 합니다';
        } else if (formData.address.trim().length > 200) {
            newErrors.address = '주소는 200자를 초과할 수 없습니다';
        }

        if (formData.phone && !/^[\d\-\+\(\)\s]+$/.test(formData.phone)) {
            newErrors.phone = '올바른 전화번호 형식이 아닙니다';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다';
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = '설명은 500자를 초과할 수 없습니다';
        }

        if (formData.operatingHours.startTime >= formData.operatingHours.endTime) {
            newErrors.endTime = '종료 시간은 시작 시간보다 늦어야 합니다';
        }

        if (formData.operatingHours.workingDays.length === 0) {
            newErrors.workingDays = '최소 하나의 근무일을 선택해주세요';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 모든 필드를 터치된 것으로 표시
        setTouched({
            name: true,
            code: true,
            address: true,
            phone: true,
            email: true,
            endTime: true,
            workingDays: true
        });

        if (!validateForm()) {
            showNotification('입력 정보를 확인해주세요.', 'warning');
            return;
        }

        if (codeAvailable === false) {
            showNotification('이미 사용 중인 지점 코드입니다.', 'error');
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                branchCode: formData.code.trim(),
                branchName: formData.name.trim(),
                branchType: formData.type || 'FRANCHISE',
                address: formData.address.trim(),
                phoneNumber: formData.phone.trim() || null,
                email: formData.email.trim() || null,
                description: formData.description.trim() || null,
                managerId: formData.managerId || null,
                maxConsultants: formData.maxConsultants || 10,
                maxClients: formData.maxClients || 100
            };

            let response;
            if (branch) {
                // 수정
                response = await apiPut(`/api/hq/branches/${branch.id}`, submitData);
                showNotification('지점 정보가 수정되었습니다.', 'success');
            } else {
                // 등록
                response = await apiPost('/api/hq/branches', submitData);
                showNotification('새 지점이 등록되었습니다.', 'success');
            }

            onSuccess(response.data);
            onHide();
        } catch (error) {
            console.error('지점 저장 실패:', error);
            
            // 에러 메시지 처리
            let errorMessage = '지점 저장에 실패했습니다.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                // 유효성 검사 에러 처리
                const errors = error.response.data.errors;
                const firstError = Object.values(errors)[0];
                if (Array.isArray(firstError)) {
                    errorMessage = firstError[0];
                } else {
                    errorMessage = firstError;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="lg" 
            backdrop="static"
            className="branch-form-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaBuilding className="me-2" />
                    {branch ? '지점 정보 수정' : '새 지점 등록'}
                </Modal.Title>
            </Modal.Header>
            
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {/* 기본 정보 */}
                    <div className="form-section">
                        <h6 className="section-title">
                            <FaBuilding className="me-2" />
                            기본 정보
                        </h6>
                        
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        지점명 <span className="text-danger">*</span>
                                    </Form.Label>
                                    <FormControl
                                        type="text"
                                        placeholder="지점명을 입력하세요"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        isInvalid={touched.name && !!errors.name}
                                        className="form-control-modern"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        지점 코드 <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="position-relative">
                                        <FormControl
                                            type="text"
                                            placeholder="예: HQ01, BRANCH_01"
                                            value={formData.code}
                                            onChange={(e) => handleCodeChange(e.target.value)}
                                            isInvalid={touched.code && (!!errors.code || codeAvailable === false)}
                                            className="form-control-modern"
                                            disabled={!!branch} // 수정 시에는 코드 변경 불가
                                        />
                                        {codeChecking && (
                                            <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                        )}
                                        {codeAvailable === true && (
                                            <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                                                <i className="bi bi-check-circle-fill text-success"></i>
                                            </div>
                                        )}
                                        {codeAvailable === false && (
                                            <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                                                <i className="bi bi-x-circle-fill text-danger"></i>
                                            </div>
                                        )}
                                    </div>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.code || '이미 사용 중인 코드입니다'}
                                    </Form.Control.Feedback>
                                    {!branch && (
                                        <Form.Text className="text-muted">
                                            영문 대문자, 숫자, 언더스코어만 사용 가능
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaMapMarkerAlt className="me-1" />
                                        주소 <span className="text-danger">*</span>
                                    </Form.Label>
                                    <FormControl
                                        type="text"
                                        placeholder="지점 주소를 입력하세요"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        isInvalid={touched.address && !!errors.address}
                                        className="form-control-modern"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.address}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaPhone className="me-1" />
                                        전화번호
                                    </Form.Label>
                                    <FormControl
                                        type="tel"
                                        placeholder="02-1234-5678"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        isInvalid={touched.phone && !!errors.phone}
                                        className="form-control-modern"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.phone}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaEnvelope className="me-1" />
                                        이메일
                                    </Form.Label>
                                    <FormControl
                                        type="email"
                                        placeholder="branch@example.com"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        isInvalid={touched.email && !!errors.email}
                                        className="form-control-modern"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaUser className="me-1" />
                                        지점장
                                    </Form.Label>
                                    <FormSelect
                                        value={formData.managerId}
                                        onChange={(e) => handleInputChange('managerId', e.target.value)}
                                        className="form-control-modern"
                                    >
                                        <option value="">지점장을 선택하세요</option>
                                        {managers.map(manager => (
                                            <option key={manager.id} value={manager.id}>
                                                {manager.name} ({manager.email})
                                            </option>
                                        ))}
                                    </FormSelect>
                                    <Form.Text className="text-muted">
                                        지점장을 지정하면 해당 사용자가 지점 관리 권한을 갖게 됩니다
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>상태</Form.Label>
                                    <div className="d-flex align-items-center">
                                        <FormCheck
                                            type="switch"
                                            id="isActive"
                                            label="활성 상태"
                                            checked={formData.isActive}
                                            onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                            className="form-check-modern"
                                        />
                                    </div>
                                    <Form.Text className="text-muted">
                                        비활성 지점은 새로운 사용자 등록이 제한됩니다
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>설명</Form.Label>
                            <FormControl
                                as="textarea"
                                rows={3}
                                placeholder="지점에 대한 추가 설명을 입력하세요"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="form-control-modern"
                            />
                        </Form.Group>
                    </div>

                    {/* 운영 시간 */}
                    <div className="form-section">
                        <h6 className="section-title">
                            운영 시간
                        </h6>
                        
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>시작 시간</Form.Label>
                                    <FormControl
                                        type="time"
                                        value={formData.operatingHours.startTime}
                                        onChange={(e) => handleNestedInputChange('operatingHours', 'startTime', e.target.value)}
                                        className="form-control-modern"
                                    />
                                </Form.Group>
                            </Col>
                            
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>종료 시간</Form.Label>
                                    <FormControl
                                        type="time"
                                        value={formData.operatingHours.endTime}
                                        onChange={(e) => handleNestedInputChange('operatingHours', 'endTime', e.target.value)}
                                        isInvalid={touched.endTime && !!errors.endTime}
                                        className="form-control-modern"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.endTime}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>시간대</Form.Label>
                                        <FormSelect
                                            value={formData.timezone}
                                            onChange={(e) => handleInputChange('timezone', e.target.value)}
                                            className="form-control-modern"
                                        >
                                            {timezoneOptions.map(option => (
                                                <option key={option.codeValue} value={option.codeValue}>
                                                    {option.codeName}
                                                </option>
                                            ))}
                                        </FormSelect>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>근무일</Form.Label>
                            <div className="working-days-container">
                                {workingDayOptions.map(option => (
                                    <FormCheck
                                        key={option.codeValue}
                                        type="checkbox"
                                        id={`workingDay_${option.codeValue}`}
                                        label={option.codeName}
                                        checked={formData.operatingHours.workingDays.includes(option.codeValue)}
                                        onChange={(e) => handleWorkingDaysChange(option.codeValue, e.target.checked)}
                                        className="form-check-modern"
                                    />
                                ))}
                            </div>
                            {touched.workingDays && errors.workingDays && (
                                <div className="text-danger small mt-1">
                                    {errors.workingDays}
                                </div>
                            )}
                        </Form.Group>
                    </div>
                </Modal.Body>
                
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={onHide}
                        disabled={loading}
                        className="btn-modern"
                    >
                        <FaTimes className="me-1" />
                        취소
                    </Button>
                    <Button 
                        variant="primary" 
                        type="submit"
                        disabled={loading || codeChecking}
                        className="btn-modern"
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                저장 중...
                            </>
                        ) : (
                            <>
                                <FaSave className="me-1" />
                                {branch ? '수정' : '등록'}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default BranchForm;
