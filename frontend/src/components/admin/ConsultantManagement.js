import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import { Button, Form, Badge } from 'react-bootstrap';
import UnifiedModal from '../common/modals/UnifiedModal';
import { FaUserTie, FaPlus, FaTrash, FaEye } from 'react-icons/fa';
import { getAllConsultantsWithStats } from '../../utils/consultantHelper';
import SafeText from '../common/SafeText';
import { generateMgLoginPassword } from '../../utils/generateMgLoginPassword';
import StandardizedApi from '../../utils/standardizedApi';
import {
    DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE,
    FALLBACK_PROFESSIONAL_TYPE_OPTION_LABEL,
    fetchProfessionalProviderTypeSelectOptions
} from '../../constants/professionalProviderRoles';
import { CONSULTANT_COMP_PROFESSIONAL_TYPE_FORM } from '../../constants/consultantComprehensiveStrings';
import { toDisplayString } from '../../utils/safeDisplay';
import { validateEmail, validatePhone } from '../../utils/validationUtils';
import './AdminDashboard/AdminDashboardB0KlA.css';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';

const ERR_USER_ID_REQUIRED = '사용자 ID를 입력해주세요.';
const ERR_EMAIL_REQUIRED = '이메일을 입력해주세요.';
const ERR_EMAIL_INVALID = '이메일 형식이 올바르지 않습니다.';
const ERR_PASSWORD_REQUIRED = '비밀번호를 입력해주세요.';
const ERR_NAME_REQUIRED = '이름을 입력해주세요.';
const ERR_PHONE_REQUIRED = '전화번호를 입력해주세요.';
const ERR_PHONE_INVALID = '전화번호 형식이 올바르지 않습니다.';
const ERR_PROFESSIONAL_TYPE_REQUIRED = '전문 유형을 선택해주세요.';

const ConsultantManagement = ({ onUpdate, showToast }) => {
    const { t } = useTranslation(['admin', 'common']);
    const [confirm, ConfirmModal] = useConfirm();
    const [consultants, setConsultants] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [loading, setLoading] = useState(false);
    const [professionalTypeOptions, setProfessionalTypeOptions] = useState([]);

    const [form, setForm] = useState({
        userId: '',
        email: '',
        password: '',
        name: '',
        phone: '',
        specialization: '',
        professionalTypeCode: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE
    });

    const professionalTypeLabelByValue = useMemo(() => {
        const m = new Map();
        professionalTypeOptions.forEach((o) => {
            m.set(o.value, o.label);
        });
        return m;
    }, [professionalTypeOptions]);

    const resolveProfessionalTypeDisplay = useCallback(
        (code) => {
            if (code === null || code === undefined) {
                return toDisplayString(null);
            }
            const raw = String(code).trim();
            if (raw.length === 0) {
                return toDisplayString(null);
            }
            const label = professionalTypeLabelByValue.get(raw);
            if (label != null && String(label).trim() !== '') {
                return String(label);
            }
            return toDisplayString(raw);
        },
        [professionalTypeLabelByValue]
    );

    useEffect(() => {
        let cancelled = false;
        (async() => {
            try {
                const opts = await fetchProfessionalProviderTypeSelectOptions();
                if (cancelled) {
                    return;
                }
                setProfessionalTypeOptions(opts);
            } catch (e) {
                console.error('전문가 유형 공통코드 로드 실패:', e);
                if (!cancelled) {
                    setProfessionalTypeOptions([]);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadConsultants = useCallback(async() => {
        setLoading(true);

        try {
            console.log('🔄 상담사 목록 로딩 시작 (통합 API)...');

            const consultantsList = await getAllConsultantsWithStats();
            console.log('📊 통합 API 응답:', consultantsList);

            if (consultantsList && consultantsList.length > 0) {
                const consultantsData = consultantsList.map((item) => {
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
                        professionalProviderTypeCode: consultantEntity.professionalProviderTypeCode,
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

    const openCreateModal = useCallback(() => {
        setForm({
            userId: '',
            email: '',
            password: generateMgLoginPassword(),
            name: '',
            phone: '',
            specialization: '',
            professionalTypeCode: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE
        });
        setFormErrors({});
        setShowModal(true);
    }, []);

    const updateFormField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    /**
     * 등록 submit 전 필수·이메일 포맷 JS validate.
     * @returns {boolean}
     */
    const validateCreateForm = () => {
        const newErrors = {};
        if (!(form.userId || '').trim()) {
            newErrors.userId = ERR_USER_ID_REQUIRED;
        }
        const email = (form.email || '').trim();
        if (!email) {
            newErrors.email = ERR_EMAIL_REQUIRED;
        } else if (!validateEmail(email)) {
            newErrors.email = ERR_EMAIL_INVALID;
        }
        if (!(form.password || '').trim()) {
            newErrors.password = ERR_PASSWORD_REQUIRED;
        }
        if (!(form.name || '').trim()) {
            newErrors.name = ERR_NAME_REQUIRED;
        }
        const phone = (form.phone || '').trim();
        if (!phone) {
            newErrors.phone = ERR_PHONE_REQUIRED;
        } else if (!validatePhone(phone)) {
            newErrors.phone = ERR_PHONE_INVALID;
        }
        if (!(form.professionalTypeCode || '').trim()) {
            newErrors.professionalTypeCode = ERR_PROFESSIONAL_TYPE_REQUIRED;
        }
        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        if (!validateCreateForm()) {
            return;
        }
        try {
            const professionalTypeCode =
                form.professionalTypeCode != null && String(form.professionalTypeCode).trim() !== ''
                    ? String(form.professionalTypeCode).trim()
                    : DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE;

            const payload = {
                userId: (form.userId || '').trim(),
                email: (form.email || '').trim(),
                password: form.password,
                name: (form.name || '').trim(),
                phone: (form.phone || '').trim(),
                specialization: (form.specialization || '').trim(),
                professionalTypeCode
            };

            const user = await StandardizedApi.post(API_ENDPOINTS.ADMIN.CONSULTANTS.LIST, payload);
            if (user && (user.id != null || user.email)) {
                showToast('상담사가 성공적으로 등록되었습니다.');
                setShowModal(false);
                setFormErrors({});
                setForm({
                    userId: '',
                    email: '',
                    password: generateMgLoginPassword(),
                    name: '',
                    phone: '',
                    specialization: '',
                    professionalTypeCode: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE
                });
                loadConsultants();
                onUpdate();
            } else {
                showToast('상담사 등록에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('상담사 등록 실패:', error);
            showToast(error.message || '상담사 등록에 실패했습니다.', 'danger');
        }
    };

    const handleDelete = async(id) => {
        const confirmed = await confirm({
            messageKey: 'admin:consultant.confirm.delete',
            variant: 'danger'
        });
        if (!confirmed) {
            return;
        }

        try {
            await StandardizedApi.delete(`${API_ENDPOINTS.ADMIN.CONSULTANTS.LIST}/${id}`);
            showToast('상담사가 성공적으로 삭제되었습니다.');
            loadConsultants();
            onUpdate();
        } catch (error) {
            console.error('상담사 삭제 실패:', error);
            showToast(error.message || '상담사 삭제에 실패했습니다.', 'danger');
        }
    };

    const selectOptions =
        professionalTypeOptions.length > 0
            ? professionalTypeOptions
            : [
                  {
                      value: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE,
                      label: FALLBACK_PROFESSIONAL_TYPE_OPTION_LABEL,
                      sortOrder: 0
                  }
              ];

    const renderConsultantPanelBody = () => {
        if (loading && consultants.length === 0) {
            return (
                <div aria-busy="true" className="consultant-management-loading">
                    <UnifiedLoading type="inline" />
                </div>
            );
        }
        if (consultants.length === 0) {
            return (
                <div className="text-center py-4 text-muted">
                    <FaUserTie className="mb-3 consultant-management-empty-icon" />
                    <p>등록된 상담사가 없습니다.</p>
                </div>
            );
        }
        return (
            <div className="consultant-list">
                {consultants.slice(0, 5).map((consultant) => (
                    <div key={consultant.id} className="summary-item">
                        <div className="summary-icon">
                            <FaUserTie />
                        </div>
                        <div className="summary-info">
                            <SafeText className="summary-label" tag="div">
                                {consultant.name}
                            </SafeText>
                            <div className="summary-value">
                                <SafeText>{consultant.email}</SafeText>
                            </div>
                            <div className="summary-value text-muted small">
                                <SafeText tag="span">
                                    {CONSULTANT_COMP_PROFESSIONAL_TYPE_FORM.LIST_CAPTION}
                                </SafeText>
                                {': '}
                                <SafeText tag="span">
                                    {resolveProfessionalTypeDisplay(consultant.professionalProviderTypeCode)}
                                </SafeText>
                            </div>
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
                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(consultant.id)}>
                                <FaTrash />
                            </Button>
                        </div>
                    </div>
                ))}
                {consultants.length > 5 && (
                    <div className="text-center mt-2">
                        <small className="text-muted">외 {consultants.length - 5}명 더...</small>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AdminCommonLayout title={t('admin.labels.consultantManagement')}>
            <div className="consultant-management">
                <div className="panel-header">
                    <h3 className="panel-title">
                        <i className="bi bi-person-badge" aria-hidden="true" />
                        {' '}
                        상담사 관리
                    </h3>
                    <Button size="sm" variant="primary" onClick={openCreateModal}>
                        <FaPlus /> 등록
                    </Button>
                </div>
                <div className="panel-content">{renderConsultantPanelBody()}</div>

                <UnifiedModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="상담사 등록"
                    size="large"
                    className="mg-v2-ad-b0kla"
                    backdropClick
                    showCloseButton
                >
                    <Form onSubmit={handleSubmit} noValidate>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                사용자 ID
                                <span className="mg-v2-form-label-required">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={form.userId}
                                onChange={(e) => updateFormField('userId', e.target.value)}
                                className={formErrors.userId ? 'mg-v2-form-input-error' : undefined}
                                isInvalid={!!formErrors.userId}
                            />
                            {formErrors.userId ? (
                                <span className="mg-v2-form-error" role="alert">{formErrors.userId}</span>
                            ) : null}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                {t('admin.labels.email')}
                                <span className="mg-v2-form-label-required">*</span>
                            </Form.Label>
                            <Form.Control
                                type="email"
                                value={form.email}
                                onChange={(e) => updateFormField('email', e.target.value)}
                                isInvalid={!!formErrors.email}
                            />
                            {formErrors.email ? (
                                <span className="mg-v2-form-error" role="alert">{formErrors.email}</span>
                            ) : null}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                비밀번호
                                <span className="mg-v2-form-label-required">*</span>
                            </Form.Label>
                            <Form.Control
                                type="password"
                                value={form.password}
                                onChange={(e) => updateFormField('password', e.target.value)}
                                isInvalid={!!formErrors.password}
                            />
                            {formErrors.password ? (
                                <span className="mg-v2-form-error" role="alert">{formErrors.password}</span>
                            ) : null}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                {t('common.labels.name')}
                                <span className="mg-v2-form-label-required">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={form.name}
                                onChange={(e) => updateFormField('name', e.target.value)}
                                isInvalid={!!formErrors.name}
                            />
                            {formErrors.name ? (
                                <span className="mg-v2-form-error" role="alert">{formErrors.name}</span>
                            ) : null}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                전화번호
                                <span className="mg-v2-form-label-required">*</span>
                            </Form.Label>
                            <Form.Control
                                type="tel"
                                value={form.phone}
                                onChange={(e) => updateFormField('phone', e.target.value)}
                                isInvalid={!!formErrors.phone}
                            />
                            {formErrors.phone ? (
                                <span className="mg-v2-form-error" role="alert">{formErrors.phone}</span>
                            ) : null}
                        </Form.Group>
                        <div className="mg-v2-form-group mb-3">
                            <label htmlFor="legacy-consultant-professional-type" className="mg-v2-form-label">
                                {CONSULTANT_COMP_PROFESSIONAL_TYPE_FORM.LABEL_REQUIRED}
                            </label>
                            <select
                                id="legacy-consultant-professional-type"
                                name="professionalTypeCode"
                                className={`mg-v2-form-input${formErrors.professionalTypeCode ? ' mg-v2-form-input-error' : ''}`}
                                value={form.professionalTypeCode || DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE}
                                onChange={(e) => updateFormField('professionalTypeCode', e.target.value)}
                            >
                                {selectOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {formErrors.professionalTypeCode ? (
                                <span className="mg-v2-form-error" role="alert">{formErrors.professionalTypeCode}</span>
                            ) : null}
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>전문분야</Form.Label>
                            <Form.Control
                                type="text"
                                value={form.specialization}
                                onChange={(e) => updateFormField('specialization', e.target.value)}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                {t('admin.actions.cancel')}
                            </Button>
                            <Button variant="primary" type="submit">
                                등록
                            </Button>
                        </div>
                    </Form>
                </UnifiedModal>

                <UnifiedModal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="상담사 상세 정보"
                    size="medium"
                    className="mg-v2-ad-b0kla"
                    backdropClick
                    showCloseButton
                >
                    {selectedConsultant && (
                        <div>
                            <p>
                                <strong>이름:</strong>{' '}
                                <SafeText tag="span">{selectedConsultant.name}</SafeText>
                            </p>
                            <p>
                                <strong>이메일:</strong> <SafeText>{selectedConsultant.email}</SafeText>
                            </p>
                            <p>
                                <strong>전화번호:</strong> <SafeText>{selectedConsultant.phone}</SafeText>
                            </p>
                            <p>
                                <strong>{CONSULTANT_COMP_PROFESSIONAL_TYPE_FORM.LIST_CAPTION}:</strong>{' '}
                                <SafeText tag="span">
                                    {resolveProfessionalTypeDisplay(selectedConsultant.professionalProviderTypeCode)}
                                </SafeText>
                            </p>
                            <p>
                                <strong>전문분야:</strong>{' '}
                                <SafeText fallback="미설정">
                                    {selectedConsultant.specialty ?? selectedConsultant.specialization}
                                </SafeText>
                            </p>
                            <p>
                                <strong>상태:</strong>
                                <Badge bg={selectedConsultant.isActive ? 'success' : 'secondary'} className="ms-2">
                                    {selectedConsultant.isActive ? '활성' : '비활성'}
                                </Badge>
                            </p>
                        </div>
                    )}
                </UnifiedModal>
            </div>
            <ConfirmModal />
        </AdminCommonLayout>
    );
};

ConsultantManagement.propTypes = {
    onUpdate: PropTypes.func.isRequired,
    showToast: PropTypes.func.isRequired
};

export default ConsultantManagement;
