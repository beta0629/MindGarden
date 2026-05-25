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
import './AdminDashboard/AdminDashboardB0KlA.css';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';

const ConsultantManagement = ({ onUpdate, showToast }) => {
    const { t } = useTranslation(['admin', 'common']);
    const [confirm, ConfirmModal] = useConfirm();
    const [consultants, setConsultants] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
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
        setShowModal(true);
    }, []);

    const handleSubmit = async(e) => {
        e.preventDefault();
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
                    <UnifiedLoading type="inline" text="상담사 목록을 불러오는 중..." />
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
        <AdminCommonLayout title={t('admin.labels.consultantManagement', '상담사 관리')}>
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
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>사용자 ID</Form.Label>
                            <Form.Control
                                type="text"
                                value={form.userId}
                                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('admin.labels.email', '이메일')}</Form.Label>
                            <Form.Control
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>비밀번호</Form.Label>
                            <Form.Control
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('common.labels.name', '이름')}</Form.Label>
                            <Form.Control
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>전화번호</Form.Label>
                            <Form.Control
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <div className="mg-v2-form-group mb-3">
                            <label htmlFor="legacy-consultant-professional-type" className="mg-v2-form-label">
                                {CONSULTANT_COMP_PROFESSIONAL_TYPE_FORM.LABEL_REQUIRED}
                            </label>
                            <select
                                id="legacy-consultant-professional-type"
                                name="professionalTypeCode"
                                className="mg-v2-form-input"
                                value={form.professionalTypeCode || DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE}
                                onChange={(e) => setForm({ ...form, professionalTypeCode: e.target.value })}
                                required
                            >
                                {selectOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>전문분야</Form.Label>
                            <Form.Control
                                type="text"
                                value={form.specialization}
                                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                {t('admin.actions.cancel', '취소')}
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
