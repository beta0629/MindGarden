import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, Alert, Row, Col } from 'react-bootstrap';
import UnifiedModal from './modals/UnifiedModal';
import { apiPost, apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import { USER_ROLES } from '../../constants/roles';
import { useTranslation } from 'react-i18next';

/**
 * 상담사 신청 모달 컴포넌트
/**
 * - 내담자가 상담사로 신청할 수 있는 UI 제공
/**
 * - 자격 요건 확인 및 신청 정보 입력
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-01-17
 */
const ConsultantApplicationModal = ({ 
    isOpen, 
    onClose, 
    userId, 
    userRole,
    onSuccess 
}) => {
    const { t } = useTranslation();
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

/**
     * 자격 요건 상세 정보 조회 (미충족 시)
     */
    const getRequirementsDetails = useCallback(async() => {
        try {
            // 자격 요건 상세 정보를 별도 API로 조회하거나 
            // 프로필 완성도 정보를 활용
            const response = await apiGet(`/api/user/profile/${userId}/completion`);
            setRequirements({ completionRate: response.data });
        } catch (error) {
            console.error('자격 요건 상세 정보 조회 오류:', error);
        }
    }, [userId]);

/**
     * 상담사 자격 요건 확인
     */
    const checkEligibility = useCallback(async() => {
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
    }, [userId, getRequirementsDetails]);

    // 모달이 열릴 때마다 자격 요건 확인
    useEffect(() => {
        if (isOpen && userId && userRole === USER_ROLES.CLIENT) {
            checkEligibility();
        }
    }, [isOpen, userId, userRole, checkEligibility]);

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
    const handleSubmit = async(e) => {
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
    if (userRole !== USER_ROLES.CLIENT) {
        return null;
    }

    const modalTitle = (
        <>
            <i className="bi bi-person-plus me-2" aria-hidden="true" />
            {t('common:common.ConsultantApplicationModal.t_fb707f09')}
        </>
    );

    const modalActions = (
        <>
            <Button variant="secondary" onClick={handleClose}>
                {t('common.actions.cancel')}
            </Button>
            {eligibilityChecked && isEligible && (
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                            {t('common:common.ConsultantApplicationModal.t_41f11881')}
                        </>
                    ) : (
                        <>
                            <i className="bi bi-send me-2" aria-hidden="true" />
                            {t('common:common.ConsultantApplicationModal.t_fb707f09')}
                        </>
                    )}
                </Button>
            )}
        </>
    );

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={handleClose}
            title={modalTitle}
            size="large"
            showCloseButton
            backdropClick
            actions={modalActions}
        >
            {loading && !eligibilityChecked && (
                <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('common:common.ConsultantApplicationModal.t_e37a510b')}</span>
                    </div>
                    <p className="mt-2 text-muted">{t('common:common.ConsultantApplicationModal.t_2e9cdd2d')}</p>
                </div>
            )}

            {eligibilityChecked && !isEligible && (
                <Alert variant="warning" className="mb-4">
                    <Alert.Heading>
                        <i className="bi bi-exclamation-triangle me-2" aria-hidden="true" />
                        {t('common:common.ConsultantApplicationModal.t_d9bb3245')}
                    </Alert.Heading>
                    <p>{t('common:common.ConsultantApplicationModal.t_75ea8857')}</p>
                    <ul className="mb-0">
                        <li>{t('common:common.ConsultantApplicationModal.t_9192bf92')}</li>
                        <li>{t('common:common.ConsultantApplicationModal.t_59ec04e3')}</li>
                        <li>{t('common:common.ConsultantApplicationModal.t_37219536')}</li>
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
                        <i className="bi bi-check-circle me-2" aria-hidden="true" />
                        {t('common:common.ConsultantApplicationModal.t_0e40e57e')}
                    </Alert.Heading>
                    <p className="mb-0">{t('common:common.ConsultantApplicationModal.t_61b9e24e')}</p>
                </Alert>
            )}

            {eligibilityChecked && isEligible && (
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('common:common.ConsultantApplicationModal.t_cf8e854b')} <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="applicationReason"
                                    value={formData.applicationReason}
                                    onChange={handleInputChange}
                                    placeholder={t('common:common.ConsultantApplicationModal.t_382a2311')}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('common:common.ConsultantApplicationModal.t_9779fc26')}</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleInputChange}
                                    placeholder={t('common:common.ConsultantApplicationModal.t_b57b49d3')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('common:common.ConsultantApplicationModal.t_b97f36a8')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="certifications"
                                    value={formData.certifications}
                                    onChange={handleInputChange}
                                    placeholder={t('common:common.ConsultantApplicationModal.t_fc1dd2b6')}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('common:common.ConsultantApplicationModal.t_b04e1c0c')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleInputChange}
                                    placeholder={t('common:common.ConsultantApplicationModal.t_886cc74c')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('common:common.ConsultantApplicationModal.t_ca2beb3b')} <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            name="introduction"
                            value={formData.introduction}
                            onChange={handleInputChange}
                            placeholder={t('common:common.ConsultantApplicationModal.t_d4dd2794')}
                            required
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('common:common.ConsultantApplicationModal.t_70f97ab4')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="contactInfo"
                                    value={formData.contactInfo}
                                    onChange={handleInputChange}
                                    placeholder={t('common:common.ConsultantApplicationModal.t_e12bf92b')}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('common:common.ConsultantApplicationModal.t_4f11ad0a')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="preferredHours"
                                    value={formData.preferredHours}
                                    onChange={handleInputChange}
                                    placeholder={t('common:common.ConsultantApplicationModal.t_1f9cabd1')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('common:common.ConsultantApplicationModal.t_ee55c948')}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            name="additionalNotes"
                            value={formData.additionalNotes}
                            onChange={handleInputChange}
                            placeholder={t('common:common.ConsultantApplicationModal.t_dec9182b')}
                        />
                    </Form.Group>
                </Form>
            )}
        </UnifiedModal>
    );
};

export default ConsultantApplicationModal;
