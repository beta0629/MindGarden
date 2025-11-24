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
import DashboardWidgetEditor from './DashboardWidgetEditor';
import DashboardLayoutEditor from './DashboardLayoutEditor';
import WidgetConfigModal from './WidgetConfigModal';
import './DashboardFormModal.css';

// 대시보드 설정을 JSON 문자열로 변환하는 유틸리티 함수
const stringifyDashboardConfig = (config) => {
  try {
    return JSON.stringify(config, null, 2);
  } catch (error) {
    console.error('대시보드 설정 변환 실패:', error);
    return '{}';
  }
};

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
  const [editMode, setEditMode] = useState('visual'); // 'visual' or 'json'
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showWidgetConfigModal, setShowWidgetConfigModal] = useState(false);
  const [parsedConfig, setParsedConfig] = useState(null);
  const [businessType, setBusinessType] = useState(null);

  const isEditMode = !!dashboard;

  // 테넌트 정보 및 역할 목록 로드
  const loadTenantRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const user = sessionManager.getUser();
      const tenantId = user?.tenantId;
      
      if (!tenantId) {
        console.error('테넌트 ID가 없습니다.');
        return;
      }

      // 테넌트 정보 로드 (businessType 포함)
      // 방법 1: /api/auth/tenant/current 사용
      try {
        const tenantResponse = await apiGet(`/api/auth/tenant/current`);
        // apiGet은 ApiResponse 래퍼를 처리하여 data를 반환
        // 응답 구조: { tenant: { tenantId, name, businessType, status } }
        if (tenantResponse) {
          if (tenantResponse.tenant && tenantResponse.tenant.businessType) {
            setBusinessType(tenantResponse.tenant.businessType);
            console.log('✅ 테넌트 업종 정보 로드:', tenantResponse.tenant.businessType);
          } else if (tenantResponse.businessType) {
            // 직접 businessType이 있는 경우 (응답 구조가 다른 경우)
            setBusinessType(tenantResponse.businessType);
            console.log('✅ 테넌트 업종 정보 로드 (직접):', tenantResponse.businessType);
          }
        }
      } catch (error) {
        // 404나 다른 오류는 조용히 처리하고 fallback 사용
        console.warn('⚠️ 테넌트 정보 로드 실패, 사용자 정보에서 가져오기 시도:', error.message || error);
      }
      
      // 방법 2: 사용자 정보에서 businessType 가져오기 (fallback)
      if (!businessType) {
        if (user?.tenant?.businessType) {
          setBusinessType(user.tenant.businessType);
          console.log('✅ 사용자 정보에서 업종 정보 로드:', user.tenant.businessType);
        } else if (user?.businessType) {
          setBusinessType(user.businessType);
          console.log('✅ 사용자 businessType 필드에서 업종 정보 로드:', user.businessType);
        } else {
          console.warn('⚠️ 업종 정보를 찾을 수 없습니다. 기본 위젯만 표시됩니다.');
        }
      }

      // 역할 목록과 대시보드 목록을 동시에 로드
      const [rolesResponse, dashboardsResponse] = await Promise.all([
        apiGet(`/api/tenants/${tenantId}/roles`),
        apiGet(`/api/v1/tenant/dashboards`).catch(() => null) // 대시보드 목록 로드 실패해도 계속 진행
      ]);
      
      // 대시보드가 있는 역할 ID 목록 생성
      let existingDashboardRoleIds = new Set();
      if (dashboardsResponse) {
        // apiGet은 ApiResponse 래퍼를 처리하여 data를 반환하거나, 직접 배열을 반환할 수 있음
        let dashboardList = [];
        
        if (dashboardsResponse.success && dashboardsResponse.data) {
          // ApiResponse 형식: { success: true, data: [...] }
          dashboardList = Array.isArray(dashboardsResponse.data) ? dashboardsResponse.data : [];
        } else if (Array.isArray(dashboardsResponse)) {
          // 직접 배열 형식
          dashboardList = dashboardsResponse;
        } else if (dashboardsResponse.data && Array.isArray(dashboardsResponse.data)) {
          // data 필드에 배열이 있는 경우
          dashboardList = dashboardsResponse.data;
        }
        
        if (dashboardList.length > 0) {
          dashboardList.forEach(dashboard => {
            if (dashboard.tenantRoleId) {
              existingDashboardRoleIds.add(dashboard.tenantRoleId);
            }
          });
          console.log('✅ 대시보드 목록 로드 성공:', dashboardList.length, '개');
          console.log('📋 대시보드가 있는 역할 ID:', Array.from(existingDashboardRoleIds));
        } else {
          console.log('ℹ️ 대시보드 목록이 비어있습니다.');
        }
      } else {
        console.log('ℹ️ 대시보드 목록을 로드하지 못했습니다.');
      }

      // 역할 목록 처리
      if (rolesResponse && Array.isArray(rolesResponse)) {
        // 생성 모드인 경우: 이미 대시보드가 있는 역할은 필터링
        // 수정 모드인 경우: 모든 역할 표시
        const filteredRoles = isEditMode 
          ? rolesResponse 
          : rolesResponse.filter(role => !existingDashboardRoleIds.has(role.tenantRoleId));
        
        setTenantRoles(filteredRoles);
        console.log('✅ 테넌트 역할 목록 로드 성공:', filteredRoles.length, '개 (전체:', rolesResponse.length, '개)');
        
        // 생성 모드에서 필터링된 역할이 있으면 알림
        if (!isEditMode && filteredRoles.length < rolesResponse.length) {
          const filteredCount = rolesResponse.length - filteredRoles.length;
          console.log(`ℹ️ ${filteredCount}개 역할은 이미 대시보드가 있어 제외되었습니다.`);
        }
      } else {
        console.warn('⚠️ 테넌트 역할 목록 응답 형식 오류:', rolesResponse);
        setTenantRoles([]);
      }
    } catch (error) {
      console.error('❌ 테넌트 역할 목록 로드 실패:', error);
      notificationManager.show('역할 목록을 불러오는 중 오류가 발생했습니다.', 'error');
      setTenantRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, [isEditMode, businessType]);

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

  // dashboardConfig 변경 시 parsedConfig 업데이트
  useEffect(() => {
    if (formData.dashboardConfig) {
      try {
        const parsed = JSON.parse(formData.dashboardConfig);
        // 기본 구조 보장
        setParsedConfig({
          version: parsed.version || '1.0',
          layout: parsed.layout || { type: 'grid', columns: 3, gap: 'md' },
          widgets: parsed.widgets || []
        });
      } catch (error) {
        console.error('대시보드 설정 파싱 실패:', error);
        // 파싱 실패 시 기본 구조 설정
        setParsedConfig({
          version: '1.0',
          layout: { type: 'grid', columns: 3, gap: 'md' },
          widgets: []
        });
      }
    } else {
      // 빈 설정일 때 기본 구조 설정
      setParsedConfig({
        version: '1.0',
        layout: { type: 'grid', columns: 3, gap: 'md' },
        widgets: []
      });
    }
  }, [formData.dashboardConfig]);

  // 역할별 기본 위젯 설정 가져오기
  const getDefaultWidgetsForRole = (roleCode, roleName) => {
    // 역할 코드나 이름에 따라 기본 위젯 설정
    const roleKey = (roleCode || roleName || '').toUpperCase();
    
    // 기본 위젯 설정
    const defaultConfig = {
      version: '1.0',
      layout: {
        type: 'grid',
        columns: 3,
        gap: 'md',
        responsive: true
      },
      widgets: []
    };

    // 역할별 기본 위젯 설정
    if (roleKey.includes('STUDENT') || roleKey.includes('학생')) {
      // 학생: 일정, 알림
      defaultConfig.widgets = [
        {
          id: 'schedule-' + Date.now(),
          type: 'schedule',
          title: '내 일정',
          position: { x: 0, y: 0 },
          size: { width: 2, height: 1 }
        },
        {
          id: 'notification-' + Date.now(),
          type: 'notification',
          title: '알림',
          position: { x: 2, y: 0 },
          size: { width: 1, height: 1 }
        }
      ];
    } else if (roleKey.includes('TEACHER') || roleKey.includes('선생님') || roleKey.includes('교사')) {
      // 선생님: 일정, 통계
      defaultConfig.widgets = [
        {
          id: 'schedule-' + Date.now(),
          type: 'schedule',
          title: '일정',
          position: { x: 0, y: 0 },
          size: { width: 2, height: 1 }
        },
        {
          id: 'summary-statistics-' + Date.now(),
          type: 'summary-statistics',
          title: '통계',
          position: { x: 2, y: 0 },
          size: { width: 1, height: 1 }
        }
      ];
    } else if (roleKey.includes('ADMIN') || roleKey.includes('관리자')) {
      // 관리자: 환영, 통계, 활동 목록
      defaultConfig.widgets = [
        {
          id: 'welcome-' + Date.now(),
          type: 'welcome',
          title: '환영합니다',
          position: { x: 0, y: 0 },
          size: { width: 3, height: 1 }
        },
        {
          id: 'summary-statistics-' + Date.now(),
          type: 'summary-statistics',
          title: '통계 요약',
          position: { x: 0, y: 1 },
          size: { width: 3, height: 1 }
        },
        {
          id: 'activity-list-' + Date.now(),
          type: 'activity-list',
          title: '최근 활동',
          position: { x: 0, y: 2 },
          size: { width: 3, height: 1 }
        }
      ];
    } else {
      // 기본: 환영, 통계
      defaultConfig.widgets = [
        {
          id: 'welcome-' + Date.now(),
          type: 'welcome',
          title: '환영합니다',
          position: { x: 0, y: 0 },
          size: { width: 2, height: 1 }
        },
        {
          id: 'summary-statistics-' + Date.now(),
          type: 'summary-statistics',
          title: '통계',
          position: { x: 2, y: 0 },
          size: { width: 1, height: 1 }
        }
      ];
    }

    return defaultConfig;
  };

  // 폼 데이터 변경 핸들러
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // 역할 선택 시 기본 위젯 자동 설정 (생성 모드에서만)
      if (field === 'tenantRoleId' && value && !isEditMode) {
        const selectedRole = tenantRoles.find(role => role.tenantRoleId === value);
        if (selectedRole) {
          const defaultConfig = getDefaultWidgetsForRole(
            selectedRole.roleCode || selectedRole.code,
            selectedRole.nameKo || selectedRole.name
          );
          newData.dashboardConfig = stringifyDashboardConfig(defaultConfig);
          newData.dashboardType = selectedRole.roleCode || selectedRole.code || selectedRole.nameKo || selectedRole.name;
          newData.dashboardNameKo = (selectedRole.nameKo || selectedRole.name || '') + ' 대시보드';
          newData.dashboardNameEn = (selectedRole.nameEn || selectedRole.name || '') + ' Dashboard';
          
          // parsedConfig도 업데이트
          setParsedConfig(defaultConfig);
          console.log('✅ 역할 선택 시 기본 위젯 자동 설정:', defaultConfig);
        }
      }

      return newData;
    });
    
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 위젯 변경 핸들러
  const handleWidgetsChange = (newWidgets) => {
    // parsedConfig가 없으면 기본 구조 생성
    const currentConfig = parsedConfig || {
      version: '1.0',
      layout: { type: 'grid', columns: 3, gap: 'md' },
      widgets: []
    };
    
    const updatedConfig = {
      ...currentConfig,
      widgets: newWidgets
    };
    
    setParsedConfig(updatedConfig);
    setFormData(prev => ({
      ...prev,
      dashboardConfig: stringifyDashboardConfig(updatedConfig)
    }));
  };

  // 위젯 설정 열기
  const handleWidgetConfig = (widget) => {
    setSelectedWidget(widget);
    setShowWidgetConfigModal(true);
  };

  // 위젯 설정 저장
  const handleWidgetConfigSave = (updatedWidget) => {
    // parsedConfig가 없으면 기본 구조 생성
    const currentConfig = parsedConfig || {
      version: '1.0',
      layout: { type: 'grid', columns: 3, gap: 'md' },
      widgets: []
    };
    
    const updatedWidgets = currentConfig.widgets.map(w =>
      w.id === updatedWidget.id ? updatedWidget : w
    );
    
    const updatedConfig = {
      ...currentConfig,
      widgets: updatedWidgets
    };
    
    setParsedConfig(updatedConfig);
    setFormData(prev => ({
      ...prev,
      dashboardConfig: stringifyDashboardConfig(updatedConfig)
    }));
    setShowWidgetConfigModal(false);
    setSelectedWidget(null);
  };

  // 위젯 삭제
  const handleWidgetDelete = (widgetId) => {
    // parsedConfig가 없으면 기본 구조 생성
    const currentConfig = parsedConfig || {
      version: '1.0',
      layout: { type: 'grid', columns: 3, gap: 'md' },
      widgets: []
    };
    
    const updatedWidgets = currentConfig.widgets.filter(w => w.id !== widgetId);
    
    const updatedConfig = {
      ...currentConfig,
      widgets: updatedWidgets
    };
    
    setParsedConfig(updatedConfig);
    setFormData(prev => ({
      ...prev,
      dashboardConfig: stringifyDashboardConfig(updatedConfig)
    }));
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
        ? `/api/v1/tenant/dashboards/${dashboard.dashboardId}`
        : `/api/v1/tenant/dashboards`;

      const method = isEditMode ? 'PUT' : 'POST';

      // dashboardConfig 검증 및 기본값 설정
      let dashboardConfigValue = formData.dashboardConfig || '{}';
      
      // 빈 문자열이거나 빈 객체인 경우 기본 구조 생성
      if (!dashboardConfigValue || dashboardConfigValue.trim() === '' || dashboardConfigValue.trim() === '{}') {
        const defaultConfig = {
          version: '1.0',
          layout: {
            type: 'grid',
            columns: 3,
            gap: 'md',
            responsive: true
          },
          widgets: []
        };
        dashboardConfigValue = stringifyDashboardConfig(defaultConfig);
      } else {
        // JSON 파싱하여 검증
        try {
          const parsed = JSON.parse(dashboardConfigValue);
          // version과 layout이 없으면 추가
          if (!parsed.version || !parsed.layout) {
            const defaultConfig = {
              version: parsed.version || '1.0',
              layout: parsed.layout || {
                type: 'grid',
                columns: 3,
                gap: 'md',
                responsive: true
              },
              widgets: parsed.widgets || []
            };
            dashboardConfigValue = stringifyDashboardConfig(defaultConfig);
          }
        } catch (e) {
          console.error('dashboardConfig JSON 파싱 오류:', e);
          // 파싱 실패 시 기본 구조 사용
          const defaultConfig = {
            version: '1.0',
            layout: {
              type: 'grid',
              columns: 3,
              gap: 'md',
              responsive: true
            },
            widgets: []
          };
          dashboardConfigValue = stringifyDashboardConfig(defaultConfig);
        }
      }

      // 백엔드 DTO에 맞게 데이터 준비
      const requestData = {
        tenantRoleId: formData.tenantRoleId,
        dashboardName: formData.dashboardName || formData.dashboardNameKo, // dashboardName이 없으면 dashboardNameKo 사용
        dashboardNameKo: formData.dashboardNameKo,
        dashboardNameEn: formData.dashboardNameEn || '',
        description: formData.description || '',
        dashboardType: formData.dashboardType,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        displayOrder: formData.displayOrder || 0,
        dashboardConfig: dashboardConfigValue
      };

      console.log('📤 대시보드 생성 요청:', { url, method, data: requestData });

      const response = await csrfTokenManager[method.toLowerCase()](url, requestData);

      console.log('📥 대시보드 생성 응답:', { status: response.status, ok: response.ok });

      if (response.ok) {
        const result = await response.json();
        console.log('📥 대시보드 생성 결과:', result);
        
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
          // 백엔드에서 반환한 에러 메시지 사용
          const errorMessage = result.message || result.error || '대시보드 저장 실패';
          throw new Error(errorMessage);
        }
      } else {
        // HTTP 에러 응답 처리
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 대시보드 저장 HTTP 에러:', { status: response.status, errorData });
        
        // 백엔드 에러 메시지 추출
        let errorMessage = '대시보드 저장 중 오류가 발생했습니다.';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (response.status === 400) {
          errorMessage = '입력한 정보를 확인해주세요.';
        } else if (response.status === 409) {
          errorMessage = '해당 역할에 이미 대시보드가 존재합니다.';
        } else if (response.status === 403) {
          errorMessage = '접근 권한이 없습니다.';
        } else if (response.status === 404) {
          errorMessage = '대시보드를 찾을 수 없습니다.';
        }
        
        throw new Error(errorMessage);
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
                  disabled={isEditMode || loading || loadingRoles}
                  required
                >
                  <option value="">역할을 선택해주세요</option>
                  {tenantRoles.length === 0 && !loadingRoles ? (
                    <option value="" disabled>
                      생성 가능한 역할이 없습니다. (모든 역할에 대시보드가 이미 존재합니다)
                    </option>
                  ) : (
                    tenantRoles.map(role => (
                      <option key={role.tenantRoleId} value={role.tenantRoleId}>
                        {role.nameKo || role.name || role.tenantRoleId}
                      </option>
                    ))
                  )}
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

              {/* 대시보드 설정 */}
              <div className="form-group">
                <label className="form-label">
                  위젯 설정
                </label>
                
                {/* 편집 모드 전환 탭 */}
                <div className="edit-mode-tabs" style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  borderBottom: '2px solid #e0e0e0'
                }}>
                  <button
                    type="button"
                    onClick={() => setEditMode('visual')}
                    className={`edit-mode-tab ${editMode === 'visual' ? 'active' : ''}`}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderBottom: editMode === 'visual' ? '3px solid #007bff' : '3px solid transparent',
                      color: editMode === 'visual' ? '#007bff' : '#666',
                      fontWeight: editMode === 'visual' ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    🎨 시각적 편집
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode('json')}
                    className={`edit-mode-tab ${editMode === 'json' ? 'active' : ''}`}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderBottom: editMode === 'json' ? '3px solid #007bff' : '3px solid transparent',
                      color: editMode === 'json' ? '#007bff' : '#666',
                      fontWeight: editMode === 'json' ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    📝 JSON 편집
                  </button>
                </div>

                {/* 시각적 편집 모드 */}
                {editMode === 'visual' ? (
                  <div className="visual-editor-container" style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: '#fafafa',
                    minHeight: '400px'
                  }}>
                    {parsedConfig ? (
                      <>
                        <DashboardWidgetEditor
                          widgets={parsedConfig.widgets || []}
                          onWidgetsChange={handleWidgetsChange}
                          onWidgetConfig={handleWidgetConfig}
                          onWidgetDelete={handleWidgetDelete}
                          businessType={businessType}
                        />
                        <div style={{ marginTop: '24px' }}>
                          <DashboardLayoutEditor
                            widgets={parsedConfig.widgets || []}
                            onWidgetsChange={handleWidgetsChange}
                            onWidgetConfig={handleWidgetConfig}
                            onWidgetDelete={handleWidgetDelete}
                            columns={parsedConfig.layout?.columns || 3}
                          />
                        </div>
                      </>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px',
                        color: '#999'
                      }}>
                        <p>위젯 설정을 불러오는 중...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* JSON 편집 모드 */
                  <div className="json-editor-container">
                    <textarea
                      id="dashboardConfig"
                      value={formData.dashboardConfig}
                      onChange={(e) => {
                        handleChange('dashboardConfig', e.target.value);
                        // JSON 변경 시 parsedConfig 동기화 시도
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setParsedConfig(parsed);
                        } catch (error) {
                          // JSON 파싱 실패 시 무시 (에러는 validate에서 처리)
                        }
                      }}
                      className={`form-input ${errors.dashboardConfig ? 'error' : ''}`}
                      placeholder={`{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 3
  },
  "widgets": [
    {
      "id": "widget-1",
      "type": "welcome",
      "position": { "row": 0, "col": 0, "span": 3 }
    }
  ]
}`}
                      rows="12"
                      disabled={loading}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '13px'
                      }}
                    />
                    {errors.dashboardConfig && (
                      <span className="form-error">{errors.dashboardConfig}</span>
                    )}
                    <div className="form-help" style={{ marginTop: '8px' }}>
                      <p style={{ marginBottom: '8px', fontWeight: '500' }}>
                        📝 <strong>JSON이란?</strong> 데이터를 표현하는 텍스트 형식입니다. 위젯의 배치와 설정을 저장합니다.
                      </p>
                      <p style={{ marginBottom: '8px' }}>
                        <strong>작성 방법:</strong>
                      </p>
                      <ul style={{ marginLeft: '20px', marginBottom: '8px', lineHeight: '1.6' }}>
                        <li>중괄호 <code>{`{}`}</code>로 시작하고 끝나야 합니다</li>
                        <li>각 항목은 쉼표 <code>,</code>로 구분합니다</li>
                        <li>문자열은 큰따옴표 <code>"</code>로 감싸야 합니다</li>
                        <li>위의 예시를 복사해서 수정하시면 쉽습니다</li>
                      </ul>
                      <p style={{ marginBottom: '4px', color: '#666', fontSize: '0.9em' }}>
                        💡 <strong>팁:</strong> 시각적 편집 모드로 전환하면 드래그 앤 드롭으로 쉽게 편집할 수 있습니다.
                      </p>
                      <details style={{ marginTop: '8px' }}>
                        <summary style={{ cursor: 'pointer', color: '#007bff', fontSize: '0.9em' }}>
                          📋 자세한 예시 보기
                        </summary>
                        <pre style={{ 
                          marginTop: '8px', 
                          padding: '12px', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: '4px', 
                          fontSize: '0.85em',
                          overflow: 'auto',
                          maxHeight: '300px'
                        }}>
{`{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 3,
    "gap": "md"
  },
  "widgets": [
    {
      "id": "widget-welcome",
      "type": "welcome",
      "position": { "row": 0, "col": 0, "span": 3 },
      "config": {}
    },
    {
      "id": "widget-stats",
      "type": "summary-statistics",
      "position": { "row": 1, "col": 0, "span": 2 },
      "config": {}
    },
    {
      "id": "widget-activity",
      "type": "activity-list",
      "position": { "row": 1, "col": 2, "span": 1 },
      "config": {}
    }
  ]
}`}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}
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

      {/* 위젯 설정 모달 */}
      {showWidgetConfigModal && selectedWidget && (
        <WidgetConfigModal
          isOpen={showWidgetConfigModal}
          onClose={() => {
            setShowWidgetConfigModal(false);
            setSelectedWidget(null);
          }}
          widget={selectedWidget}
          onSave={handleWidgetConfigSave}
        />
      )}
    </div>,
    portalTarget
  );
};

export default DashboardFormModal;

