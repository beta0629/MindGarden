/**
 * 대시보드 생성/수정 모달 컴포넌트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import { apiGet } from '../../utils/ajax';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { API_BASE_URL } from '../../constants/api';
import { sessionManager } from '../../utils/sessionManager';
import { FaTimes } from 'react-icons/fa';
import { LayoutDashboard } from 'lucide-react';
import './DashboardFormModal.css';

const DashboardFormModal = ({ isOpen, onClose, dashboard, onSave }) => {
  const [formData, setFormData] = useState({
    tenantRoleId: '',
    dashboardName: '',
    dashboardNameKo: '',
    dashboardNameEn: '',
    description: '',
    dashboardType: '',
    isActive: true,
    isDefault: false,
    displayOrder: 0,
    dashboardConfig: '{}'
  });

  const [tenantRoles, setTenantRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditMode = !!dashboard;

  // 테넌트 역할 목록 로드
  const loadTenantRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const user = sessionManager.getUser();
      const tenantId = user?.tenantId;
      
      if (!tenantId) {
        console.error('테넌트 ID가 없습니다.');
        return;
      }

      const response = await apiGet(`${API_BASE_URL}/api/tenants/${tenantId}/roles`);
      
      if (response && Array.isArray(response)) {
        setTenantRoles(response);
        console.log('✅ 테넌트 역할 목록 로드 성공:', response.length, '개');
      } else {
        console.warn('⚠️ 테넌트 역할 목록 응답 형식 오류:', response);
        setTenantRoles([]);
      }
    } catch (error) {
      console.error('❌ 테넌트 역할 목록 로드 실패:', error);
      notificationManager.show('역할 목록을 불러오는 중 오류가 발생했습니다.', 'error');
      setTenantRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadTenantRoles();
      
      // 수정 모드인 경우 기존 데이터 설정
      if (dashboard) {
        setFormData({
          tenantRoleId: dashboard.tenantRoleId || '',
          dashboardName: dashboard.dashboardName || '',
          dashboardNameKo: dashboard.dashboardNameKo || '',
          dashboardNameEn: dashboard.dashboardNameEn || '',
          description: dashboard.description || '',
          dashboardType: dashboard.dashboardType || '',
          isActive: dashboard.isActive !== undefined ? dashboard.isActive : true,
          isDefault: dashboard.isDefault !== undefined ? dashboard.isDefault : false,
          displayOrder: dashboard.displayOrder || 0,
          dashboardConfig: dashboard.dashboardConfig || '{}'
        });
      } else {
        // 생성 모드인 경우 기본값 설정
        setFormData({
          tenantRoleId: '',
          dashboardName: '',
          dashboardNameKo: '',
          dashboardNameEn: '',
          description: '',
          dashboardType: '',
          isActive: true,
          isDefault: false,
          displayOrder: 0,
          dashboardConfig: '{}'
        });
      }
      setErrors({});
    }
  }, [isOpen, dashboard, loadTenantRoles]);

  // 폼 데이터 변경 핸들러
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 유효성 검사
  const validate = () => {
    const newErrors = {};

    if (!formData.tenantRoleId) {
      newErrors.tenantRoleId = '역할을 선택해주세요.';
    }

    if (!formData.dashboardNameKo && !formData.dashboardName) {
      newErrors.dashboardNameKo = '대시보드 이름을 입력해주세요.';
    }

    if (!formData.dashboardType) {
      newErrors.dashboardType = '대시보드 타입을 선택해주세요.';
    }

    // JSON 유효성 검사
    if (formData.dashboardConfig) {
      try {
        JSON.parse(formData.dashboardConfig);
      } catch (e) {
        newErrors.dashboardConfig = '올바른 JSON 형식이 아닙니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      notificationManager.show('입력한 정보를 확인해주세요.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/api/v1/tenant/dashboards/${dashboard.dashboardId}`
        : `${API_BASE_URL}/api/v1/tenant/dashboards`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await csrfTokenManager[method.toLowerCase()](url, formData);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show(
            isEditMode ? '대시보드가 수정되었습니다.' : '대시보드가 생성되었습니다.',
            'success'
          );
          if (onSave) {
            await onSave(result.data);
          }
          onClose();
        } else {
          throw new Error(result.message || '대시보드 저장 실패');
        }
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '대시보드 저장 실패');
      }
    } catch (error) {
      console.error('❌ 대시보드 저장 실패:', error);
      notificationManager.show(error.message || '대시보드 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 대시보드 타입 옵션
  const dashboardTypeOptions = [
    { value: 'STUDENT', label: '학생' },
    { value: 'TEACHER', label: '선생님' },
    { value: 'ADMIN', label: '관리자' },
    { value: 'CLIENT', label: '내담자' },
    { value: 'CONSULTANT', label: '상담사' },
    { value: 'PRINCIPAL', label: '원장' },
    { value: 'DEFAULT', label: '기본' }
  ];

  if (!isOpen) return null;

  const portalTarget = document.getElementById('modal-root') || document.body;

  return ReactDOM.createPortal(
    <div className="dashboard-form-modal-overlay" onClick={onClose}>
      <div className="dashboard-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="dashboard-form-modal-header">
          <div className="dashboard-form-modal-title">
            <LayoutDashboard className="modal-icon" />
            <h2>{isEditMode ? '대시보드 수정' : '새 대시보드 생성'}</h2>
          </div>
          <button
            className="dashboard-form-modal-close"
            onClick={onClose}
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        {/* 본문 */}
        <div className="dashboard-form-modal-body">
          {loadingRoles ? (
            <div className="loading-container">
              <UnifiedLoading message="역할 목록을 불러오는 중..." />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="dashboard-form">
              {/* 역할 선택 */}
              <div className="form-group">
                <label htmlFor="tenantRoleId" className="form-label">
                  역할 <span className="required">*</span>
                </label>
                <select
                  id="tenantRoleId"
                  value={formData.tenantRoleId}
                  onChange={(e) => handleChange('tenantRoleId', e.target.value)}
                  className={`form-input ${errors.tenantRoleId ? 'error' : ''}`}
                  disabled={isEditMode || loading}
                  required
                >
                  <option value="">역할을 선택해주세요</option>
                  {tenantRoles.map(role => (
                    <option key={role.tenantRoleId} value={role.tenantRoleId}>
                      {role.nameKo || role.name || role.tenantRoleId}
                    </option>
                  ))}
                </select>
                {errors.tenantRoleId && (
                  <span className="form-error">{errors.tenantRoleId}</span>
                )}
              </div>

              {/* 대시보드 이름 (한글) */}
              <div className="form-group">
                <label htmlFor="dashboardNameKo" className="form-label">
                  대시보드 이름 (한글) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="dashboardNameKo"
                  value={formData.dashboardNameKo}
                  onChange={(e) => handleChange('dashboardNameKo', e.target.value)}
                  className={`form-input ${errors.dashboardNameKo ? 'error' : ''}`}
                  placeholder="예: 학생 대시보드"
                  disabled={loading}
                  required
                />
                {errors.dashboardNameKo && (
                  <span className="form-error">{errors.dashboardNameKo}</span>
                )}
              </div>

              {/* 대시보드 이름 (영문) */}
              <div className="form-group">
                <label htmlFor="dashboardNameEn" className="form-label">
                  대시보드 이름 (영문)
                </label>
                <input
                  type="text"
                  id="dashboardNameEn"
                  value={formData.dashboardNameEn}
                  onChange={(e) => handleChange('dashboardNameEn', e.target.value)}
                  className="form-input"
                  placeholder="예: Student Dashboard"
                  disabled={loading}
                />
              </div>

              {/* 대시보드 타입 */}
              <div className="form-group">
                <label htmlFor="dashboardType" className="form-label">
                  대시보드 타입 <span className="required">*</span>
                </label>
                <select
                  id="dashboardType"
                  value={formData.dashboardType}
                  onChange={(e) => handleChange('dashboardType', e.target.value)}
                  className={`form-input ${errors.dashboardType ? 'error' : ''}`}
                  disabled={loading}
                  required
                >
                  <option value="">타입을 선택해주세요</option>
                  {dashboardTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.dashboardType && (
                  <span className="form-error">{errors.dashboardType}</span>
                )}
              </div>

              {/* 설명 */}
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  설명
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="form-input"
                  placeholder="대시보드에 대한 설명을 입력해주세요"
                  rows="3"
                  disabled={loading}
                />
              </div>

              {/* 표시 순서 */}
              <div className="form-group">
                <label htmlFor="displayOrder" className="form-label">
                  표시 순서
                </label>
                <input
                  type="number"
                  id="displayOrder"
                  value={formData.displayOrder}
                  onChange={(e) => handleChange('displayOrder', parseInt(e.target.value) || 0)}
                  className="form-input"
                  min="0"
                  disabled={loading}
                />
                <small className="form-help">숫자가 작을수록 먼저 표시됩니다.</small>
              </div>

              {/* 체크박스 그룹 */}
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    disabled={loading}
                  />
                  <span>활성화</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => handleChange('isDefault', e.target.checked)}
                    disabled={loading || isEditMode}
                  />
                  <span>기본 대시보드</span>
                  {isEditMode && (
                    <small className="form-help">기본 대시보드는 수정 시 변경할 수 없습니다.</small>
                  )}
                </label>
              </div>

              {/* 대시보드 설정 (JSON) */}
              <div className="form-group">
                <label htmlFor="dashboardConfig" className="form-label">
                  대시보드 설정 (JSON)
                </label>
                <textarea
                  id="dashboardConfig"
                  value={formData.dashboardConfig}
                  onChange={(e) => handleChange('dashboardConfig', e.target.value)}
                  className={`form-input ${errors.dashboardConfig ? 'error' : ''}`}
                  placeholder='{"widgets": [], "layout": "grid"}'
                  rows="5"
                  disabled={loading}
                />
                {errors.dashboardConfig && (
                  <span className="form-error">{errors.dashboardConfig}</span>
                )}
                <small className="form-help">JSON 형식으로 입력해주세요. 향후 위젯 구성에 사용됩니다.</small>
              </div>

              {/* 액션 버튼 */}
              <div className="dashboard-form-modal-actions">
                <MGButton
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  취소
                </MGButton>
                <MGButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? '저장 중...' : (isEditMode ? '수정' : '생성')}
                </MGButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default DashboardFormModal;

