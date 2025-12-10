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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Save, RotateCcw, X, CheckCircle, AlertCircle, Award, Briefcase } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils } from '../../../../constants/roles';
import { useNotification } from '../../../../contexts/NotificationContext';
import { validateEmail, validatePhone } from '../../../../utils/validationUtils';
import './ConsultantRegistrationWidget.css';

const ConsultantRegistrationWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    addressDetail: '',
    postalCode: '',
    specialization: '',
    qualifications: '',
    experience: '',
    notes: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  // 폼 제출용 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'form-submit',
      url: '/api/v1/admin/consultants',
      method: 'POST',
      validateOnSubmit: true,
      successMessage: '상담사가 성공적으로 등록되었습니다.',
      errorMessage: '상담사 등록 중 오류가 발생했습니다.',
      onSuccess: (response) => {
        handleRegistrationSuccess(response);
      }
    };
  };

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (폼 제출용)
  const {
    data: submitResponse,
    loading: submitting,
    error: submitError,
    submitData,
    resetForm,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: false,
    cache: false
  });

  // 관리자/상담사만 사용 가능
  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
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
  const handleSubmit = async (e) => {
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
    
    // 제출 데이터 준비
    const requestData = {
      userId: formData.userId?.trim(),
      email: formData.email?.trim(),
      password: formData.password,
      name: formData.name?.trim(),
      phone: formData.phone?.trim(),
      role: 'CONSULTANT', // 상담사로 고정
      ...(formData.address && { address: formData.address.trim() }),
      ...(formData.addressDetail && { addressDetail: formData.addressDetail.trim() }),
      ...(formData.postalCode && { postalCode: formData.postalCode.trim() }),
      ...(formData.specialization && { specialization: formData.specialization.trim() }),
      ...(formData.qualifications && { qualifications: formData.qualifications.trim() }),
      ...(formData.experience && { experience: formData.experience.trim() }),
      ...(formData.notes && { notes: formData.notes.trim() })
    };
    
    try {
      await submitData(requestData);
    } catch (error) {
      console.error('❌ 상담사 등록 실패:', error);
      showNotification(
        error.message || '상담사 등록 중 오류가 발생했습니다.',
        'error'
      );
    }
  };

  // 폼 초기화
  const handleReset = () => {
    setFormData({
      userId: '',
      email: '',
      password: '',
      name: '',
      phone: '',
      address: '',
      addressDetail: '',
      postalCode: '',
      specialization: '',
      qualifications: '',
      experience: '',
      notes: ''
    });
    setValidationErrors({});
    if (resetForm) resetForm();
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

  // 헤더 설정
  const headerConfig = {
    icon: <Users className="widget-header-icon" />,
    subtitle: '전문 상담사 등록 대시보드',
    actions: [
      {
        icon: 'RefreshCw',
        label: '새로고침',
        onClick: refresh
      }
    ]
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={submitting}
      error={submitError}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="consultant-registration-widget"
    >
      <div className="consultant-registration-content">
        {!showForm ? (
          // 등록 버튼 화면
          <div className="registration-welcome">
            <div className="welcome-icon-wrapper">
              <Users className="welcome-icon" />
            </div>
            <h3 className="welcome-title">상담사 등록</h3>
            <p className="welcome-description">
              {
                widget.config?.emptyMessage || 
                '새로운 상담사를 등록하여 상담 서비스를 확장하세요.'
              }
            </p>
            <button 
              className="mg-btn mg-btn-primary mg-btn-lg registration-start-btn"
              onClick={() => setShowForm(true)}
            >
              <Users className="btn-icon" />
              상담사 등록 시작
            </button>
          </div>
        ) : (
          // 등록 폼
          <div className="registration-form-container">
            <div className="form-header">
              <h3 className="form-title">상담사 정보 입력</h3>
              <button 
                className="form-close-btn"
                onClick={handleCloseForm}
                type="button"
                title="닫기"
              >
                <X className="close-icon" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="consultant-registration-form">
              {/* 필수 필드 */}
              <div className="form-section">
                <h4 className="section-title">기본 정보</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="userId" className="form-label">
                      아이디 <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      required
                      className={`form-control ${getFieldError('userId') ? 'error' : ''}`}
                      placeholder="로그인 아이디"
                    />
                    {getFieldError('userId') && (
                      <div className="field-error">
                        <AlertCircle className="error-icon" />
                        {getFieldError('userId')}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      이름 <span className="required">*</span>
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
                        <AlertCircle className="error-icon" />
                        {getFieldError('name')}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      이메일 <span className="required">*</span>
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
                        <AlertCircle className="error-icon" />
                        {getFieldError('email')}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      비밀번호 <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className={`form-control ${getFieldError('password') ? 'error' : ''}`}
                      placeholder="로그인 비밀번호"
                    />
                    {getFieldError('password') && (
                      <div className="field-error">
                        <AlertCircle className="error-icon" />
                        {getFieldError('password')}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      전화번호 <span className="required">*</span>
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
                        <AlertCircle className="error-icon" />
                        {getFieldError('phone')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 전문 분야 정보 */}
              {!showCompactForm && (
                <div className="form-section">
                  <h4 className="section-title">
                    <Briefcase className="section-icon" />
                    전문 정보
                  </h4>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label htmlFor="specialization" className="form-label">전문 분야</label>
                      <select
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="">전문 분야 선택</option>
                        <option value="개인상담">개인상담</option>
                        <option value="부부상담">부부상담</option>
                        <option value="가족상담">가족상담</option>
                        <option value="청소년상담">청소년상담</option>
                        <option value="트라우마상담">트라우마상담</option>
                        <option value="중독상담">중독상담</option>
                        <option value="직업상담">직업상담</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="qualifications" className="form-label">자격증</label>
                      <textarea
                        id="qualifications"
                        name="qualifications"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        className="form-control"
                        rows={3}
                        placeholder="보유 자격증 및 학력사항을 입력해주세요"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="experience" className="form-label">경력사항</label>
                      <textarea
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="form-control"
                        rows={3}
                        placeholder="상담 경력 및 주요 경험을 입력해주세요"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 추가 정보 */}
              {!showCompactForm && (
                <div className="form-section">
                  <h4 className="section-title">추가 정보</h4>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label htmlFor="address" className="form-label">주소</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="기본 주소"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="addressDetail" className="form-label">상세 주소</label>
                      <input
                        type="text"
                        id="addressDetail"
                        name="addressDetail"
                        value={formData.addressDetail}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="상세 주소"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="postalCode" className="form-label">우편번호</label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="12345"
                        maxLength={5}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="notes" className="form-label">메모</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="form-control"
                        rows={3}
                        placeholder="추가 메모"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 폼 액션 버튼 */}
              <div className="form-actions">
                <button
                  type="button"
                  className="mg-btn mg-btn-secondary"
                  onClick={handleCloseForm}
                >
                  <X className="btn-icon" />
                  취소
                </button>
                <button
                  type="button"
                  className="mg-btn mg-btn-ghost"
                  onClick={handleReset}
                >
                  <RotateCcw className="btn-icon" />
                  초기화
                </button>
                <button
                  type="submit"
                  className="mg-btn mg-btn-primary"
                  disabled={submitting || Object.keys(validationErrors).length > 0}
                >
                  {submitting ? (
                    <>
                      <div className="loading-spinner" />
                      등록 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="btn-icon" />
                      상담사 등록
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default ConsultantRegistrationWidget;