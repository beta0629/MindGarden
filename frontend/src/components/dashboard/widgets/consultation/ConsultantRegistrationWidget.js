/**
 * Consultant Registration Widget - 표준화된 위젯
/**
 * 상담소 특화 상담사 등록 폼 위젯
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseWidget from '../BaseWidget';
import { RoleUtils, LEGACY_USER_ROLES } from '../../../../constants/roles';
import {
  DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE,
  FALLBACK_PROFESSIONAL_TYPE_OPTION_LABEL,
  fetchProfessionalProviderTypeSelectOptions
} from '../../../../constants/professionalProviderRoles';
import { useNotification } from '../../../../contexts/NotificationContext';
import { validateEmail, validatePhone } from '../../../../utils/validationUtils';
import { generateMgLoginPassword } from '../../../../utils/generateMgLoginPassword';
import StandardizedApi from '../../../../utils/standardizedApi';
import './ConsultantRegistrationWidget.css';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import { API_ENDPOINTS } from '../../../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';

const ConsultantRegistrationWidget = ({ widget, user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    password: generateMgLoginPassword(),
    name: '',
    phone: '',
    rrnFirst6: '',
    rrnLast1: '',
    address: '',
    addressDetail: '',
    postalCode: '',
    specialization: '',
    qualifications: '',
    workHistory: '',
    notes: '',
    professionalTypeCode: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [professionalTypeOptions, setProfessionalTypeOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async() => {
      try {
        const opts = await fetchProfessionalProviderTypeSelectOptions();
        if (cancelled) {
          return;
        }
        setProfessionalTypeOptions(opts);
        if (opts.length > 0) {
          setFormData((prev) => ({
            ...prev,
            professionalTypeCode: prev.professionalTypeCode || opts[0].value
          }));
        }
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

  // 관리자/상담사만 사용 가능
  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.hasRole(user, LEGACY_USER_ROLES.HQ_MASTER)) {
    return null;
  }

  const showCompactForm = widget.config?.showCompactForm !== false;
  const autoCloseAfterSubmit = widget.config?.autoCloseAfterSubmit !== false;

  // 입력 및 유효성 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 실시간 유효성 검사
    const newErrors = { ...validationErrors };
    
    switch (name) {
      case 'email':
        if (value && !validateEmail(value)) {
          newErrors[name] = '올바른 이메일 형식이 아닙니다.';
        } else {
          delete newErrors[name];
        }
        break;
      case 'phone':
        if (value && !validatePhone(value)) {
          newErrors[name] = '올바른 전화번호 형식이 아닙니다. (010-1234-5678)';
        } else {
          delete newErrors[name];
        }
        break;
      case 'rrnFirst6':
        if (value && !/^[0-9]{0,6}$/.test(value)) {
          newErrors[name] = '주민번호 앞 6자리는 6자리 숫자로 입력해 주세요.';
        } else {
          delete newErrors[name];
        }
        break;
      case 'rrnLast1':
        if (value && !/^[1-4]?$/.test(value)) {
          newErrors[name] = '주민번호 뒤 1자리는 1~4 중 한 자리 숫자로 입력해 주세요.';
        } else {
          delete newErrors[name];
        }
        break;
      default:
        // 필수 필드 검사
        if (['userId', 'name', 'email', 'password', 'phone'].includes(name) && !value.trim()) {
          newErrors[name] = '이 필드는 필수입니다.';
        } else {
          delete newErrors[name];
        }
        break;
    }
    
    setValidationErrors(newErrors);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 등록 성공 핸들러
  const handleRegistrationSuccess = (response) => {
    showNotification('상담사가 성공적으로 등록되었습니다.', 'success');
    
    // 폼 초기화
    handleReset();
    
    // 자동 닫기
    if (autoCloseAfterSubmit) {
      setShowForm(false);
    }
    
    // 리다이렉트 옵션
    if (widget.config?.redirectAfterSuccess) {
      navigate('/admin/consultants');
    }
    
    // 커스텀 콜백
    if (widget.config?.onSuccess) {
      widget.config.onSuccess(response);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async(e) => {
    e.preventDefault();
    
    // 필수 필드 검사
    const requiredFields = ['userId', 'name', 'email', 'password', 'phone'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    
    if (missingFields.length > 0) {
      showNotification('필수 항목을 모두 입력해주세요.', 'warning');
      return;
    }
    
    // 유효성 검사
    if (Object.keys(validationErrors).length > 0) {
      showNotification('입력 오류를 수정해주세요.', 'error');
      return;
    }
    
    // 주민번호 형식 검증 (앞 6자리 + 뒤 1자리)
    if (formData.rrnFirst6?.trim() || formData.rrnLast1?.trim()) {
      const f = formData.rrnFirst6?.trim() || '';
      const l = formData.rrnLast1?.trim() || '';
      if (f.length !== 6 || !/^[0-9]{6}$/.test(f)) {
        showNotification('주민번호 앞 6자리는 6자리 숫자로 입력해 주세요.', 'warning');
        return;
      }
      if (l.length !== 1 || !/^[1-4]$/.test(l)) {
        showNotification('주민번호 뒤 1자리는 1~4 중 한 자리 숫자로 입력해 주세요.', 'warning');
        return;
      }
    }

    // 제출 데이터 준비
    const requestData = {
      userId: formData.userId?.trim(),
      email: formData.email?.trim(),
      password: formData.password,
      name: formData.name?.trim(),
      phone: formData.phone?.trim(),
      professionalTypeCode: formData.professionalTypeCode || DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE,
      ...(formData.rrnFirst6?.trim() && { rrnFirst6: formData.rrnFirst6.trim() }),
      ...(formData.rrnLast1?.trim() && { rrnLast1: formData.rrnLast1.trim() }),
      ...(formData.address && { address: formData.address.trim() }),
      ...(formData.addressDetail && { addressDetail: formData.addressDetail.trim() }),
      ...(formData.postalCode && { postalCode: formData.postalCode.trim() }),
      ...(formData.specialization && { specialization: formData.specialization.trim() }),
      ...(formData.qualifications && { qualifications: formData.qualifications.trim() }),
      ...(formData.workHistory && { workHistory: formData.workHistory.trim() }),
      ...(formData.notes && { notes: formData.notes.trim() })
    };
    
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await StandardizedApi.post(API_ENDPOINTS.ADMIN.CONSULTANTS.LIST, requestData);
      handleRegistrationSuccess(response);
    } catch (error) {
      console.error('❌ 상담사 등록 실패:', error);
      const message = error.message || '상담사 등록 중 오류가 발생했습니다.';
      setSubmitError(message);
      showNotification(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 폼 초기화
  const handleReset = () => {
    setFormData({
      userId: '',
      email: '',
      password: generateMgLoginPassword(),
      name: '',
      phone: '',
      rrnFirst6: '',
      rrnLast1: '',
      address: '',
      addressDetail: '',
      postalCode: '',
      specialization: '',
      qualifications: '',
      workHistory: '',
      notes: '',
      professionalTypeCode: professionalTypeOptions[0]?.value || DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE
    });
    setValidationErrors({});
  };

  // 폼 닫기
  const handleCloseForm = () => {
    setShowForm(false);
    handleReset();
  };

  // 에러 메시지 표시 함수
  const getFieldError = (fieldName) => {
    return validationErrors[fieldName];
  };

  return (
    <BaseWidget
      widget={{
        ...widget,
        config: {
          ...widget.config,
          subtitle: widget.config?.subtitle || '전문 상담사 등록 대시보드'
        }
      }}
      user={user}
      loading={submitting}
      error={submitError}
      className="consultant-registration-widget"
    >
      <div className="consultant-registration-content">
        {!showForm ? (
          // 등록 버튼 화면
          <div className="registration-welcome">
            <div className="welcome-icon-wrapper" />
            <h3 className="welcome-title">{t('common:dashboard.ConsultantRegistrationWidget.t_2b4a8bea')}</h3>
            <p className="welcome-description">
              {
                widget.config?.emptyMessage || 
                '새로운 상담사를 등록하여 상담 서비스를 확장하세요.'
              }
            </p>
            <MGButton
              type="button"
              variant="primary"
              size="large"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'lg',
                loading: false,
                className: 'registration-start-btn'
              })}
              loading={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => setShowForm(true)}
            >
              {t('common:dashboard.ConsultantRegistrationWidget.t_b4ed9bd7')}
            </MGButton>
          </div>
        ) : (
          // 등록 폼
          <div className="registration-form-container">
            <div className="form-header">
              <h3 className="form-title">{t('common:dashboard.ConsultantRegistrationWidget.t_afbe24bb')}</h3>
              <MGButton
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'sm',
                  loading: false,
                  className: 'form-close-btn'
                })}
                loading={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleCloseForm}
                type="button"
                title={t('common.actions.close')}
                preventDoubleClick={false}
              >
                {t('common.actions.close')}
              </MGButton>
            </div>
            <form onSubmit={handleSubmit} className="consultant-registration-form">
              {/* 필수 필드 */}
              <div className="form-section">
                <h4 className="section-title">{t('common:dashboard.ConsultantRegistrationWidget.t_eb7f501b')}</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="userId" className="form-label">
                      {t('common:dashboard.ConsultantRegistrationWidget.t_8dd085d9')} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      required
                      className={`form-control ${getFieldError('userId') ? 'error' : ''}`}
                      placeholder={t('common:dashboard.ConsultantRegistrationWidget.t_8f56d137')}
                    />
                    {getFieldError('userId') && (
                      <div className="field-error">
                        
                        {getFieldError('userId')}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      {t('common.labels.name')} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`form-control ${getFieldError('name') ? 'error' : ''}`}
                    />
                    {getFieldError('name') && (
                      <div className="field-error">
                        
                        {getFieldError('name')}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="professionalTypeCode" className="form-label">
                      {t('common:dashboard.ConsultantRegistrationWidget.t_a910cb43')} <span className="required">*</span>
                    </label>
                    <select
                      id="professionalTypeCode"
                      name="professionalTypeCode"
                      value={formData.professionalTypeCode || DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                    >
                      {(professionalTypeOptions.length > 0
                        ? professionalTypeOptions
                        : [{ value: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE, label: FALLBACK_PROFESSIONAL_TYPE_OPTION_LABEL, sortOrder: 0 }]
                      ).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      {t('admin.labels.email')} <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`form-control ${getFieldError('email') ? 'error' : ''}`}
                    />
                    {getFieldError('email') && (
                      <div className="field-error">
                        
                        {getFieldError('email')}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      {t('common:dashboard.ConsultantRegistrationWidget.t_81973897')} <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className={`form-control ${getFieldError('password') ? 'error' : ''}`}
                      placeholder={t('common:dashboard.ConsultantRegistrationWidget.t_6669670d')}
                    />
                    {getFieldError('password') && (
                      <div className="field-error">
                        
                        {getFieldError('password')}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      {t('common:dashboard.ConsultantRegistrationWidget.t_9a1c3aaa')} <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className={`form-control ${getFieldError('phone') ? 'error' : ''}`}
                      placeholder="010-1234-5678"
                    />
                    {getFieldError('phone') && (
                      <div className="field-error">
                        
                        {getFieldError('phone')}
                      </div>
                    )}
                  </div>

                  <div className="form-row two-cols">
                    <div className="form-group">
                      <label htmlFor="rrnFirst6" className="form-label">{t('common:dashboard.ConsultantRegistrationWidget.t_61537487')}</label>
                      <input
                        type="text"
                        id="rrnFirst6"
                        name="rrnFirst6"
                        value={formData.rrnFirst6}
                        onChange={handleInputChange}
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`form-control ${getFieldError('rrnFirst6') ? 'error' : ''}`}
                        placeholder="900101"
                      />
                      {getFieldError('rrnFirst6') && (
                        <div className="field-error">{getFieldError('rrnFirst6')}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="rrnLast1" className="form-label">{t('common:dashboard.ConsultantRegistrationWidget.t_77fb1e91')}</label>
                      <input
                        type="text"
                        id="rrnLast1"
                        name="rrnLast1"
                        value={formData.rrnLast1}
                        onChange={handleInputChange}
                        maxLength={1}
                        inputMode="numeric"
                        pattern="[1-4]"
                        className={`form-control ${getFieldError('rrnLast1') ? 'error' : ''}`}
                        placeholder="1"
                      />
                      {getFieldError('rrnLast1') && (
                        <div className="field-error">{getFieldError('rrnLast1')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 전문 분야 정보 */}
              {!showCompactForm && (
                <div className="form-section">
                  <h4 className="section-title">
                    
                    {t('common:dashboard.ConsultantRegistrationWidget.t_ac4050b9')}
                  </h4>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label htmlFor="specialization" className="form-label">{t('common:dashboard.ConsultantRegistrationWidget.t_b04e1c0c')}</label>
                      <select
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="">{t('common:dashboard.ConsultantRegistrationWidget.t_c95a1266')}</option>
                        <option value="개인상담">{t('common:dashboard.ConsultantRegistrationWidget.t_efda14c0')}</option>
                        <option value="부부상담">{t('common.labels.coupleConsultation')}</option>
                        <option value="가족상담">{t('common.labels.familyConsultation')}</option>
                        <option value="청소년상담">{t('common:dashboard.ConsultantRegistrationWidget.t_62dd9bfa')}</option>
                        <option value="트라우마상담">{t('common:dashboard.ConsultantRegistrationWidget.t_308bfd55')}</option>
                        <option value="중독상담">{t('common:dashboard.ConsultantRegistrationWidget.t_e00f86f0')}</option>
                        <option value="직업상담">{t('common:dashboard.ConsultantRegistrationWidget.t_c0cbed8a')}</option>
                        <option value="기타">{t('admin.labels.other')}</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="qualifications" className="form-label">{t('common:dashboard.ConsultantRegistrationWidget.t_c44d2799')}</label>
                      <input
                        type="text"
                        id="qualifications"
                        name="qualifications"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder={t('common:dashboard.ConsultantRegistrationWidget.t_7edd2cd8')}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="workHistory" className="form-label">{t('common:dashboard.ConsultantRegistrationWidget.t_c2bd8daf')}</label>
                      <textarea
                        id="workHistory"
                        name="workHistory"
                        value={formData.workHistory}
                        onChange={handleInputChange}
                        className="form-control"
                        rows={3}
                        placeholder={t('common:dashboard.ConsultantRegistrationWidget.t_8f92fc9c')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 추가 정보 */}
              {!showCompactForm && (
                <div className="form-section">
                  <h4 className="section-title">{t('common:dashboard.ConsultantRegistrationWidget.t_9b3193e1')}</h4>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">{t('common:dashboard.ConsultantRegistrationWidget.t_1c2422dd')}</label>
                      <div className="address-search-row">
                        <MGButton
                          type="button"
                          variant="outline"
                          className={buildErpMgButtonClassName({
                            variant: 'outline',
                            size: 'md',
                            loading: false,
                            className: 'address-search-btn'
                          })}
                          loading={false}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          onClick={() => {
                            if (window.daum && window.daum.Postcode) {
                              new window.daum.Postcode({
                                oncomplete: function(data) {
                                  setFormData(prev => ({
                                    ...prev,
                                    postalCode: data.zonecode || '',
                                    address: data.address || ''
                                  }));
                                }
                              }).open();
                            } else {
                              showNotification('주소 검색 서비스를 불러올 수 없습니다.', 'info');
                            }
                          }}
                        >
                          {t('common:dashboard.ConsultantRegistrationWidget.t_1c2422dd')}
                        </MGButton>
                        <input
                          type="text"
                          readOnly
                          className="form-control address-display"
                          value={formData.address || ''}
                          placeholder={t('common:dashboard.ConsultantRegistrationWidget.t_c44d8d97')}
                        />
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="addressDetail" className="form-label">{t('common:dashboard.ConsultantRegistrationWidget.t_dad291cb')}</label>
                      <input
                        type="text"
                        id="addressDetail"
                        name="addressDetail"
                        value={formData.addressDetail}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder={t('common:dashboard.ConsultantRegistrationWidget.t_9c34782e')}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="postalCode" className="form-label">{t('common:dashboard.ConsultantRegistrationWidget.t_cd21379e')}</label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="00000"
                        maxLength={5}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="notes" className="form-label">{t('common:dashboard.ConsultantRegistrationWidget.t_f3ce23c8')}</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="form-control"
                        rows={3}
                        placeholder={t('common:dashboard.ConsultantRegistrationWidget.t_ee55c948')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 폼 액션 버튼 */}
              <div className="form-actions">
                <MGButton
                  type="button"
                  variant="secondary"
                  className={buildErpMgButtonClassName({
                    variant: 'secondary',
                    size: 'md',
                    loading: false
                  })}
                  loading={false}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleCloseForm}
                >
                  {t('admin.actions.cancel')}
                </MGButton>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false
                  })}
                  loading={false}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleReset}
                >
                  {t('common:dashboard.ConsultantRegistrationWidget.t_ff75b4ff')}
                </MGButton>
                <MGButton
                  type="submit"
                  variant="primary"
                  disabled={submitting || Object.keys(validationErrors).length > 0}
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: submitting
                  })}
                  loading={submitting}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  {t('common:dashboard.ConsultantRegistrationWidget.t_2b4a8bea')}
                </MGButton>
              </div>
            </form>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default ConsultantRegistrationWidget;