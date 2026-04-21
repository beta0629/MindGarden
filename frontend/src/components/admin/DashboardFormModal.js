/**
 * 대시보드 생성/수정 모달 컴포넌트
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-01-XX
 */

import React, { useState, useEffect, useCallback } from 'react';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedModal from '../common/modals/UnifiedModal';
import notificationManager from '../../utils/notification';
import { apiGet } from '../../utils/ajax';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { API_BASE_URL } from '../../constants/api';
import { sessionManager } from '../../utils/sessionManager';
import DashboardWidgetEditor from './DashboardWidgetEditor';
import DashboardLayoutEditor from './DashboardLayoutEditor';
import Dashboard3DPreview from './Dashboard3DPreview';
import WidgetConfigModal from './WidgetConfigModal';
import ModernDashboardEditor from './ModernDashboardEditor';
import './DashboardFormModal.css';
import { toDisplayString } from '../../utils/safeDisplay';
import {
  DASHBOARD_FORM_ASSIGNMENT_REASON_AUTO,
  DASHBOARD_FORM_BUTTON,
  DASHBOARD_FORM_ERR_THROW,
  DASHBOARD_FORM_FORM,
  DASHBOARD_FORM_MODAL,
  DASHBOARD_FORM_MSG,
  DASHBOARD_FORM_NAME_EN_SUFFIX,
  DASHBOARD_FORM_NAME_KO_SUFFIX,
  DASHBOARD_FORM_ROLE_KEY,
  DASHBOARD_FORM_TYPE_OPTION,
  DASHBOARD_FORM_VAL,
  DASHBOARD_FORM_WIDGET_GUIDE,
  DASHBOARD_FORM_WIDGET_TITLE,
  dashboardFormConfirmDeleteRole
} from '../../constants/dashboardFormModalStrings';

// 대시보드 설정을 JSON 문자열로 변환하는 유틸리티 함수
const stringifyDashboardConfig = (config) => {
  try {
    return JSON.stringify(config, null, 2);
  } catch (error) {
    console.error('대시보드 설정 변환 실패:', error);
    return '{}';
  }
};

/** 중첩 모달 스택: MODAL_STANDARD·토큰 --mg-z-index-modal-high(10000) 기준 */
const DASHBOARD_FORM_MODAL_Z_INDEX = 10000;
const DASHBOARD_FORM_ADD_ROLE_MODAL_Z_INDEX = 10050;

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
  const [editMode, setEditMode] = useState('visual'); // 시각적 편집만 사용
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showWidgetConfigModal, setShowWidgetConfigModal] = useState(false);
  const [parsedConfig, setParsedConfig] = useState(null);
  const [businessType, setBusinessType] = useState(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [roleTemplates, setRoleTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleNameEn, setNewRoleNameEn] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [assignRoleToCurrentUser, setAssignRoleToCurrentUser] = useState(false);

  const isEditMode = !!dashboard;

  // 테넌트 정보 및 역할 목록 로드
  const loadTenantRoles = useCallback(async() => {
    setLoadingRoles(true);
    try {
      const user = sessionManager.getUser();
      const tenantId = user?.tenantId;
      
      if (!tenantId) {
        console.error('테넌트 ID가 없습니다.');
        return;
      }

      // 테넌트 정보 로드 (businessType 포함)
      // 방법 1: /api/v1/auth/tenant/current 사용
      try {
        const tenantResponse = await apiGet(`/api/v1/auth/tenant/current`);
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
      const existingDashboardRoleIds = new Set();
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
        // 메타 데이터 확인 로그
        rolesResponse.forEach(role => {
          if (role.defaultWidgetsJson) {
            console.log('✅ 메타 데이터 확인:', {
              roleName: role.nameKo || role.name,
              templateCode: role.templateCode,
              hasDefaultWidgetsJson: true,
              jsonLength: role.defaultWidgetsJson.length
            });
          } else {
            console.warn('⚠️ 메타 데이터 없음:', {
              roleName: role.nameKo || role.name,
              templateCode: role.templateCode,
              hasDefaultWidgetsJson: false
            });
          }
        });
        
        // 생성 모드인 경우: 이미 대시보드가 있는 역할은 필터링
        // 수정 모드인 경우: 모든 역할 표시
        const filteredRoles = isEditMode 
          ? rolesResponse 
          : rolesResponse.filter(role => !existingDashboardRoleIds.has(role.tenantRoleId));
        
        setTenantRoles(filteredRoles);
        console.log('✅ 테넌트 역할 목록 로드 성공:', filteredRoles.length, '개 (전체:', rolesResponse.length, '개)');
        console.log('📊 메타 데이터 포함 역할:', filteredRoles.filter(r => r.defaultWidgetsJson).length, '개');
        
        // 생성 모드에서 필터링된 역할이 있으면 알림
        if (!isEditMode && filteredRoles.length < rolesResponse.length) {
          const filteredCount = rolesResponse.length - filteredRoles.length;
          console.log(`ℹ️ ${filteredCount}개 역할은 이미 대시보드가 있어 제외되었습니다.`);
          
          // 사용 가능한 역할이 없으면 사용자에게 알림
          if (filteredRoles.length === 0) {
            console.warn('⚠️ 생성 가능한 역할이 없습니다.');
            notificationManager.show(
              DASHBOARD_FORM_MSG.NO_CREATABLE_ROLES,
              'warning'
            );
          }
        }
      } else {
        console.warn('⚠️ 테넌트 역할 목록 응답 형식 오류:', rolesResponse);
        setTenantRoles([]);
      }
    } catch (error) {
      console.error('❌ 테넌트 역할 목록 로드 실패:', error);
      notificationManager.show(DASHBOARD_FORM_MSG.ERR_LOAD_ROLES, 'error');
      setTenantRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, [isEditMode, businessType]);

  // 역할 템플릿 목록 로드
  const loadRoleTemplates = useCallback(async() => {
    setLoadingTemplates(true);
    try {
      const user = sessionManager.getUser();
      const tenantId = user?.tenantId;
      
      if (!tenantId) {
        console.error('테넌트 ID가 없습니다.');
        return;
      }

      const templatesResponse = await apiGet(`/api/v1/tenant/roles/templates`);
      
      if (templatesResponse && Array.isArray(templatesResponse)) {
        // 업종별 필터링
        const filteredTemplates = businessType 
          ? templatesResponse.filter(t => t.businessType === businessType)
          : templatesResponse;
        
        setRoleTemplates(filteredTemplates);
        console.log('✅ 역할 템플릿 목록 로드 성공:', filteredTemplates.length, '개');
      } else {
        console.warn('⚠️ 역할 템플릿 목록 응답 형식 오류:', templatesResponse);
        setRoleTemplates([]);
      }
    } catch (error) {
      console.error('❌ 역할 템플릿 목록 로드 실패:', error);
      notificationManager.show(DASHBOARD_FORM_MSG.ERR_LOAD_ROLE_TEMPLATES, 'error');
      setRoleTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [businessType]);

  // 역할 추가 (템플릿 기반, 이름 커스터마이징 가능)
  const handleAddRole = async() => {
    if (!selectedTemplateId) {
      notificationManager.show(DASHBOARD_FORM_MSG.WARN_SELECT_TEMPLATE, 'warning');
      return;
    }

    if (!newRoleName || newRoleName.trim() === '') {
      notificationManager.show(DASHBOARD_FORM_MSG.WARN_ENTER_ROLE_NAME, 'warning');
      return;
    }

    setLoading(true);
    try {
      const user = sessionManager.getUser();
      const tenantId = user?.tenantId;
      
      if (!tenantId) {
        throw new Error(DASHBOARD_FORM_ERR_THROW.TENANT_ID_MISSING);
      }

      // 템플릿 정보 가져오기
      const selectedTemplate = roleTemplates.find(t => t.roleTemplateId === selectedTemplateId);
      
      // 역할 생성 요청 데이터 (이름 커스터마이징)
      const requestData = {
        roleTemplateId: selectedTemplateId,
        nameKo: newRoleName.trim(),
        nameEn: newRoleNameEn.trim() || newRoleName.trim(),
        name: newRoleName.trim(),
        descriptionKo: newRoleDescription.trim() || (selectedTemplate?.descriptionKo || ''),
        descriptionEn: selectedTemplate?.descriptionEn || '',
        description: selectedTemplate?.description || '',
        isActive: true,
        displayOrder: selectedTemplate?.displayOrder || 0
      };

      const response = await csrfTokenManager.post(
        `/api/v1/tenant/roles`,
        requestData
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show(DASHBOARD_FORM_MSG.TOAST_ROLE_ADDED, 'success');
          setShowAddRoleModal(false);
          setSelectedTemplateId('');
          setNewRoleName('');
          setNewRoleNameEn('');
          setNewRoleDescription('');
          // 역할 목록 새로고침
          await loadTenantRoles();
        } else {
          throw new Error(result.message || DASHBOARD_FORM_MSG.ERR_ROLE_ADD_FALLBACK);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || DASHBOARD_FORM_MSG.ERR_ROLE_ADD_FALLBACK);
      }
    } catch (error) {
      console.error('❌ 역할 추가 실패:', error);
      notificationManager.show(error.message || DASHBOARD_FORM_MSG.ERR_ROLE_ADD_PROCESS, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 역할 제거
  const handleDeleteRole = async(tenantRoleId, roleName) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(dashboardFormConfirmDeleteRole(roleName), resolve);
    });
    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const user = sessionManager.getUser();
      const tenantId = user?.tenantId;
      
      if (!tenantId) {
        throw new Error(DASHBOARD_FORM_ERR_THROW.TENANT_ID_MISSING);
      }

      const response = await csrfTokenManager.delete(`/api/v1/tenant/roles/${tenantRoleId}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show(DASHBOARD_FORM_MSG.TOAST_ROLE_DELETED, 'success');
          // 역할 목록 새로고침
          await loadTenantRoles();
        } else {
          throw new Error(result.message || DASHBOARD_FORM_MSG.ERR_ROLE_DELETE_FALLBACK);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || DASHBOARD_FORM_MSG.ERR_ROLE_DELETE_FALLBACK);
      }
    } catch (error) {
      console.error('❌ 역할 삭제 실패:', error);
      notificationManager.show(error.message || DASHBOARD_FORM_MSG.ERR_ROLE_DELETE_PROCESS, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAddRoleModal = useCallback(() => {
    setShowAddRoleModal(false);
    setSelectedTemplateId('');
    setNewRoleName('');
    setNewRoleNameEn('');
    setNewRoleDescription('');
  }, []);

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      console.log('📂 모달 열림:', { isOpen, dashboard, isEditMode });
      loadTenantRoles();
      loadRoleTemplates();
      
      // 수정 모드인 경우 기존 데이터 설정
      if (dashboard) {
        console.log('📋 수정 모드 - 대시보드 데이터 로드:', {
          dashboardId: dashboard.dashboardId,
          dashboardNameKo: dashboard.dashboardNameKo,
          tenantRoleId: dashboard.tenantRoleId,
          dashboardConfig: dashboard.dashboardConfig ? '있음' : '없음'
        });
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
  }, [isOpen, dashboard, loadTenantRoles, loadRoleTemplates]);

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

  // 역할별 기본 위젯 설정 가져오기 (메타 시스템 우선 사용)
  const getDefaultWidgetsForRole = async(role) => {
    console.log('🔍 역할별 기본 위젯 설정 가져오기:', {
      roleName: role.nameKo || role.name,
      templateCode: role.templateCode,
      hasDefaultWidgetsJson: !!role.defaultWidgetsJson,
      defaultWidgetsJson: role.defaultWidgetsJson ? '있음' : '없음'
    });
    
    // 1. 메타 시스템: RoleTemplate의 default_widgets_json 사용 (최우선)
    if (role.defaultWidgetsJson) {
      try {
        const config = JSON.parse(role.defaultWidgetsJson);
        
        // 기본 구조 보장
        if (!config.version) {
          config.version = '1.0';
        }
        if (!config.layout) {
          config.layout = {
            type: 'grid',
            columns: 3,
            gap: 'md',
            responsive: true
          };
        }
        if (!config.widgets) {
          config.widgets = [];
        }
        
        // 위젯 ID 자동 생성 (없는 경우)
        if (config.widgets && Array.isArray(config.widgets)) {
          config.widgets.forEach((widget, index) => {
            if (!widget.id) {
              const widgetType = widget.type || 'widget';
              widget.id = `${widgetType}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;
            }
            // position이 없으면 자동 생성
            if (!widget.position) {
              const row = Math.floor(index / 3);
              const col = index % 3;
              widget.position = {
                row: row,
                col: col,
                span: 1
              };
            }
          });
        }
        
        console.log('✅ 메타 시스템: RoleTemplate에서 기본 위젯 설정 로드 성공:', {
          templateCode: role.templateCode || role.nameKo,
          widgetCount: config.widgets?.length || 0,
          config: config
        });
        return config;
      } catch (error) {
        console.error('❌ RoleTemplate의 default_widgets_json 파싱 실패:', error);
        console.warn('⚠️ Fallback 로직으로 전환');
      }
    } else {
      console.warn('⚠️ RoleTemplate에 default_widgets_json이 없음, Fallback 사용:', {
        templateCode: role.templateCode,
        roleName: role.nameKo || role.name
      });
    }
    
    // 2. Fallback: 역할 코드나 이름에 따라 기본 위젯 설정 (하드코딩)
    const roleKey = (role.templateCode || role.roleCode || role.nameKo || role.name || '').toUpperCase();
    
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

    // 역할별 기본 위젯 설정 (Fallback)
    if (roleKey.includes('STUDENT') || roleKey.includes(DASHBOARD_FORM_ROLE_KEY.STUDENT)) {
      // 학생: 일정, 알림
      defaultConfig.widgets = [
        {
          id: `schedule-${Date.now()}`,
          type: 'schedule',
          title: DASHBOARD_FORM_WIDGET_TITLE.MY_SCHEDULE,
          position: { x: 0, y: 0 },
          size: { width: 2, height: 1 }
        },
        {
          id: `notification-${Date.now()}`,
          type: 'notification',
          title: DASHBOARD_FORM_WIDGET_TITLE.NOTIFICATION,
          position: { x: 2, y: 0 },
          size: { width: 1, height: 1 }
        }
      ];
    } else if (
      roleKey.includes('TEACHER')
      || roleKey.includes(DASHBOARD_FORM_ROLE_KEY.TEACHER_ALT1)
      || roleKey.includes(DASHBOARD_FORM_ROLE_KEY.TEACHER_ALT2)
    ) {
      // 선생님: 일정, 통계
      defaultConfig.widgets = [
        {
          id: `schedule-${Date.now()}`,
          type: 'schedule',
          title: DASHBOARD_FORM_WIDGET_TITLE.SCHEDULE,
          position: { x: 0, y: 0 },
          size: { width: 2, height: 1 }
        },
        {
          id: `summary-statistics-${Date.now()}`,
          type: 'summary-statistics',
          title: DASHBOARD_FORM_WIDGET_TITLE.STATS,
          position: { x: 2, y: 0 },
          size: { width: 1, height: 1 }
        }
      ];
    } else if (roleKey.includes('ADMIN') || roleKey.includes(DASHBOARD_FORM_ROLE_KEY.ADMIN)) {
      // 관리자: 환영, 통계, 활동 목록
      defaultConfig.widgets = [
        {
          id: `welcome-${Date.now()}`,
          type: 'welcome',
          title: DASHBOARD_FORM_WIDGET_TITLE.WELCOME,
          position: { x: 0, y: 0 },
          size: { width: 3, height: 1 }
        },
        {
          id: `summary-statistics-${Date.now()}`,
          type: 'summary-statistics',
          title: DASHBOARD_FORM_WIDGET_TITLE.STATS_SUMMARY,
          position: { x: 0, y: 1 },
          size: { width: 3, height: 1 }
        },
        {
          id: `activity-list-${Date.now()}`,
          type: 'activity-list',
          title: DASHBOARD_FORM_WIDGET_TITLE.RECENT_ACTIVITY,
          position: { x: 0, y: 2 },
          size: { width: 3, height: 1 }
        }
      ];
    } else {
      // 기본: 환영, 통계
      defaultConfig.widgets = [
        {
          id: `welcome-${Date.now()}`,
          type: 'welcome',
          title: DASHBOARD_FORM_WIDGET_TITLE.WELCOME,
          position: { x: 0, y: 0 },
          size: { width: 2, height: 1 }
        },
        {
          id: `summary-statistics-${Date.now()}`,
          type: 'summary-statistics',
          title: DASHBOARD_FORM_WIDGET_TITLE.STATS,
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
          // 즉시 대시보드 이름과 타입 설정 (비동기 위젯 로드 전에)
          newData.dashboardType = selectedRole.templateCode || selectedRole.roleCode || selectedRole.code || selectedRole.nameKo || selectedRole.name || 'DEFAULT';
          newData.dashboardNameKo = `${selectedRole.nameKo || selectedRole.name || ''}${DASHBOARD_FORM_NAME_KO_SUFFIX}`;
          newData.dashboardName = newData.dashboardNameKo;
          newData.dashboardNameEn = `${selectedRole.nameEn || selectedRole.name || ''}${DASHBOARD_FORM_NAME_EN_SUFFIX}`;
          
          // 메타 시스템: RoleTemplate의 default_widgets_json 사용
          getDefaultWidgetsForRole(selectedRole).then(defaultConfig => {
            newData.dashboardConfig = stringifyDashboardConfig(defaultConfig);
            
            // parsedConfig도 업데이트
            setParsedConfig(defaultConfig);
            console.log('✅ 역할 선택 시 기본 위젯 자동 설정 (메타 시스템):', defaultConfig);
            
            // formData 업데이트
            setFormData(prev => ({
              ...prev,
              dashboardConfig: newData.dashboardConfig,
              dashboardType: newData.dashboardType,
              dashboardNameKo: newData.dashboardNameKo,
              dashboardName: newData.dashboardName,
              dashboardNameEn: newData.dashboardNameEn
            }));
          }).catch(error => {
            console.error('❌ 기본 위젯 설정 로드 실패:', error);
            // 위젯 로드 실패해도 기본 구조는 유지
            const fallbackConfig = {
              version: '1.0',
              layout: { type: 'grid', columns: 3, gap: 'md', responsive: true },
              widgets: []
            };
            setFormData(prev => ({
              ...prev,
              dashboardConfig: stringifyDashboardConfig(fallbackConfig),
              dashboardType: newData.dashboardType,
              dashboardNameKo: newData.dashboardNameKo,
              dashboardName: newData.dashboardName,
              dashboardNameEn: newData.dashboardNameEn
            }));
            setParsedConfig(fallbackConfig);
          });
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
    console.log('🔄 위젯 변경 감지:', {
      이전위젯수: parsedConfig?.widgets?.length || 0,
      새위젯수: newWidgets.length,
      새위젯목록: newWidgets.map(w => ({ id: w.id, type: w.type }))
    });
    
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
    
    const configString = stringifyDashboardConfig(updatedConfig);
    console.log('📝 위젯 설정 업데이트:', {
      위젯수: newWidgets.length,
      설정길이: configString.length,
      설정미리보기: `${configString.substring(0, 100)}...`
    });
    
    setParsedConfig(updatedConfig);
    setFormData(prev => {
      const updated = {
        ...prev,
        dashboardConfig: configString
      };
      console.log('💾 formData.dashboardConfig 업데이트 완료:', {
        이전길이: prev.dashboardConfig?.length || 0,
        새길이: configString.length
      });
      return updated;
    });
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

  // 위젯 삭제 (확인 없이 바로 삭제 - 간소화)
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
    
    // 삭제 완료 알림 (선택적)
    console.log('✅ 위젯 삭제 완료:', widgetId);
  };

  // 유효성 검사
  const validate = () => {
    const newErrors = {};
    console.log('🔍 유효성 검사 시작:', { 
      isEditMode, 
      formData: {
        tenantRoleId: formData.tenantRoleId,
        dashboardNameKo: formData.dashboardNameKo,
        dashboardConfig: formData.dashboardConfig ? '있음' : '없음'
      },
      tenantRoles: tenantRoles.length 
    });

    // 수정 모드에서는 tenantRoleId가 이미 설정되어 있어야 함
    if (!isEditMode && !formData.tenantRoleId) {
      console.warn('⚠️ 생성 모드: tenantRoleId가 없음');
      newErrors.tenantRoleId = DASHBOARD_FORM_VAL.SELECT_ROLE;
    } else if (isEditMode && !formData.tenantRoleId) {
      console.warn('⚠️ 수정 모드: tenantRoleId가 없음 (기존 데이터에서 가져와야 함)');
      // 수정 모드에서는 dashboard에서 가져오기
      if (dashboard && dashboard.tenantRoleId) {
        setFormData(prev => ({ ...prev, tenantRoleId: dashboard.tenantRoleId }));
      } else {
        newErrors.tenantRoleId = DASHBOARD_FORM_VAL.DASHBOARD_ROLE_MISSING;
      }
    } else if (formData.tenantRoleId) {
      // 선택된 역할이 실제로 존재하는지 확인 (수정 모드에서는 모든 역할 목록에 없을 수 있으므로 완화)
      if (!isEditMode) {
        const selectedRole = tenantRoles.find(role => role.tenantRoleId === formData.tenantRoleId);
        if (!selectedRole) {
          console.error('❌ 선택된 역할이 존재하지 않음:', { 
            selectedId: formData.tenantRoleId, 
            availableRoles: tenantRoles.map(r => ({ id: r.tenantRoleId, name: r.nameKo }))
          });
          newErrors.tenantRoleId = DASHBOARD_FORM_VAL.ROLE_INVALID_REOPEN;
        }
      }
    }

    // 대시보드 이름 자동 생성 (역할 선택 시)
    if (!formData.dashboardNameKo && !formData.dashboardName) {
      // 역할이 선택되었으면 자동 생성 시도
      if (formData.tenantRoleId) {
        const selectedRole = tenantRoles.find(role => role.tenantRoleId === formData.tenantRoleId);
        if (selectedRole) {
          const autoName = `${selectedRole.nameKo || selectedRole.name || ''}${DASHBOARD_FORM_NAME_KO_SUFFIX}`;
          setFormData(prev => ({
            ...prev,
            dashboardNameKo: autoName,
            dashboardName: autoName
          }));
        } else {
          newErrors.dashboardNameKo = DASHBOARD_FORM_VAL.ENTER_DASHBOARD_NAME;
        }
      } else {
        newErrors.dashboardNameKo = DASHBOARD_FORM_VAL.SELECT_ROLE_FIRST;
      }
    }

    // 대시보드 타입 자동 설정 (역할 선택 시)
    if (!formData.dashboardType && formData.tenantRoleId) {
      const selectedRole = tenantRoles.find(role => role.tenantRoleId === formData.tenantRoleId);
      if (selectedRole) {
        const autoType = selectedRole.templateCode || selectedRole.roleCode || selectedRole.code || 'DEFAULT';
        setFormData(prev => ({
          ...prev,
          dashboardType: autoType
        }));
      }
    }

    // JSON 유효성 검사
    if (formData.dashboardConfig) {
      try {
        JSON.parse(formData.dashboardConfig);
      } catch (e) {
        newErrors.dashboardConfig = DASHBOARD_FORM_VAL.INVALID_JSON;
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('✅ 유효성 검사 결과:', { isValid, errors: newErrors });
    return isValid;
  };

  // 폼 제출 핸들러
  const handleSubmit = async(e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 대시보드 저장 시작:', { 
      isEditMode, 
      dashboardId: dashboard?.dashboardId,
      formData,
      tenantRoles: tenantRoles.length 
    });

    const validationResult = validate();
    console.log('🔍 유효성 검사 결과:', { 
      isValid: validationResult, 
      errors,
      formData: {
        tenantRoleId: formData.tenantRoleId,
        dashboardNameKo: formData.dashboardNameKo,
        dashboardConfig: formData.dashboardConfig ? '있음' : '없음'
      }
    });
    
    if (!validationResult) {
      console.error('❌ 유효성 검사 실패:', errors);
      notificationManager.show(DASHBOARD_FORM_MSG.VAL_CHECK_INPUT, 'warning');
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
      console.log('📋 저장할 dashboardConfig 확인:', {
        원본길이: dashboardConfigValue.length,
        위젯수: parsedConfig?.widgets?.length || 0,
        미리보기: `${dashboardConfigValue.substring(0, 200)}...`
      });
      
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

      console.log('📥 대시보드 저장 응답:', { 
        status: response.status, 
        ok: response.ok,
        method,
        url,
        isEditMode 
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📥 대시보드 생성 결과:', result);
        
        if (result.success) {
          // 대시보드 생성 성공 후, 역할 자동 할당 옵션이 체크되어 있으면 현재 사용자에게 역할 할당
          if (!isEditMode && assignRoleToCurrentUser && formData.tenantRoleId) {
            try {
              const user = sessionManager.getUser();
              const tenantId = user?.tenantId;
              
              if (user?.id && tenantId) {
                const assignRequest = {
                  tenantId: tenantId,
                  tenantRoleId: formData.tenantRoleId,
                  // branchId 제거됨 - 브랜치 코드 제거 정책에 따라 테넌트 ID만 사용
                  effectiveFrom: new Date().toISOString().split('T')[0],
                  effectiveTo: null, // 무기한
                  assignmentReason: DASHBOARD_FORM_ASSIGNMENT_REASON_AUTO
                };
                
                const assignResponse = await csrfTokenManager.post(
                  `/api/users/${user.id}/roles`,
                  assignRequest
                );
                
                if (assignResponse.ok) {
                  const assignResult = await assignResponse.json();
                  if (assignResult.success) {
                    notificationManager.show(
                      DASHBOARD_FORM_MSG.TOAST_CREATED_WITH_ROLE,
                      'success'
                    );
                  } else {
                    console.warn('⚠️ 역할 할당 실패:', assignResult.message);
                    notificationManager.show(
                      DASHBOARD_FORM_MSG.TOAST_CREATED_ROLE_ASSIGN_FAILED,
                      'warning'
                    );
                  }
                } else {
                  console.warn('⚠️ 역할 할당 HTTP 에러:', assignResponse.status);
                  notificationManager.show(
                    DASHBOARD_FORM_MSG.TOAST_CREATED_ROLE_ASSIGN_FAILED,
                    'warning'
                  );
                }
              } else {
                notificationManager.show(
                  DASHBOARD_FORM_MSG.TOAST_CREATED_ROLE_ASSIGN_NO_SESSION,
                  'warning'
                );
              }
            } catch (assignError) {
              console.error('❌ 역할 할당 중 오류:', assignError);
              notificationManager.show(
                DASHBOARD_FORM_MSG.TOAST_CREATED_ROLE_ASSIGN_ERROR,
                'warning'
              );
            }
          } else {
            notificationManager.show(
              isEditMode ? DASHBOARD_FORM_MSG.TOAST_DASHBOARD_UPDATED : DASHBOARD_FORM_MSG.TOAST_DASHBOARD_CREATED,
              'success'
            );
          }
          
          if (onSave) {
            await onSave(result.data);
          }
          onClose();
        } else {
          // 백엔드에서 반환한 에러 메시지 사용
          const errorMessage = result.message || result.error || DASHBOARD_FORM_MSG.ERR_SAVE_FALLBACK;
          throw new Error(errorMessage);
        }
      } else {
        // HTTP 에러 응답 처리
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 대시보드 저장 HTTP 에러:', { status: response.status, errorData });
        
        // 백엔드 에러 메시지 추출
        let errorMessage = DASHBOARD_FORM_MSG.ERR_SAVE_PROCESS;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (response.status === 400) {
          errorMessage = DASHBOARD_FORM_MSG.VAL_CHECK_INPUT;
        } else if (response.status === 409) {
          errorMessage = DASHBOARD_FORM_MSG.ERR_CONFLICT_DASHBOARD;
        } else if (response.status === 403) {
          errorMessage = DASHBOARD_FORM_MSG.ERR_FORBIDDEN;
        } else if (response.status === 404) {
          errorMessage = DASHBOARD_FORM_MSG.ERR_NOT_FOUND_DASHBOARD;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ 대시보드 저장 실패:', error);
      notificationManager.show(error.message || DASHBOARD_FORM_MSG.ERR_SAVE_PROCESS, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 대시보드 타입 옵션
  const dashboardTypeOptions = [
    { value: 'STUDENT', label: DASHBOARD_FORM_TYPE_OPTION.STUDENT },
    { value: 'TEACHER', label: DASHBOARD_FORM_TYPE_OPTION.TEACHER },
    { value: 'ADMIN', label: DASHBOARD_FORM_TYPE_OPTION.ADMIN },
    { value: 'CLIENT', label: DASHBOARD_FORM_TYPE_OPTION.CLIENT },
    { value: 'CONSULTANT', label: DASHBOARD_FORM_TYPE_OPTION.CONSULTANT },
    { value: 'PRINCIPAL', label: DASHBOARD_FORM_TYPE_OPTION.PRINCIPAL },
    { value: 'DEFAULT', label: DASHBOARD_FORM_TYPE_OPTION.DEFAULT }
  ];

  if (!isOpen) return null;

  const mainModalTitle = isEditMode ? DASHBOARD_FORM_MODAL.TITLE_EDIT : DASHBOARD_FORM_MODAL.TITLE_CREATE;

  const mainModalActions = !loadingRoles ? (
    <>
      <MGButton
        type="button"
        variant="secondary"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'secondary',
          size: 'md',
          loading: false
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onClose}
        disabled={loading}
        preventDoubleClick={true}
      >
        {DASHBOARD_FORM_BUTTON.CANCEL}
      </MGButton>
      <MGButton
        type="button"
        variant="primary"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'primary',
          size: 'md',
          loading: loading
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        disabled={loading}
        onClick={async(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔘 저장 버튼 클릭:', {
            isEditMode,
            loading,
            dashboardId: dashboard?.dashboardId,
            formData: {
              dashboardNameKo: formData.dashboardNameKo,
              tenantRoleId: formData.tenantRoleId,
              dashboardConfig: formData.dashboardConfig ? '있음' : '없음'
            }
          });

          const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} };
          await handleSubmit(fakeEvent);
        }}
        preventDoubleClick={true}
        loading={loading}
      >
        {isEditMode ? DASHBOARD_FORM_BUTTON.SAVE_EDIT : DASHBOARD_FORM_BUTTON.SAVE_CREATE}
      </MGButton>
    </>
  ) : null;

  return (
    <>
      <UnifiedModal
        isOpen={isOpen}
        onClose={onClose}
        title={mainModalTitle}
        size="fullscreen"
        variant="form"
        className="mg-v2-ad-b0kla"
        backdropClick={true}
        showCloseButton={true}
        loading={loading}
        zIndex={DASHBOARD_FORM_MODAL_Z_INDEX}
        actions={mainModalActions}
      >
          {loadingRoles ? (
            <div className="loading-container">
              <div className="mg-loading">{DASHBOARD_FORM_MODAL.LOADING}</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="dashboard-form">
              {/* 역할 선택 */}
              <div className="form-group">
                <div className="mg-form-label-row">
                  <label htmlFor="tenantRoleId" className="form-label mg-form-label-inline">
                    {DASHBOARD_FORM_FORM.ROLE_LABEL} <span className="required">*</span>
                  </label>
                  {!isEditMode && (
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={() => setShowAddRoleModal(true)}
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'sm',
                        loading: false,
                        className: 'mg-btn-add-role'
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      disabled={loading || loadingRoles}
                    >
                      {DASHBOARD_FORM_BUTTON.ADD_ROLE}
                    </MGButton>
                  )}
                </div>
                <select
                  id="tenantRoleId"
                  value={formData.tenantRoleId}
                  onChange={(e) => handleChange('tenantRoleId', e.target.value)}
                  className={`form-input ${errors.tenantRoleId ? 'error' : ''}`}
                  disabled={isEditMode || loading || loadingRoles}
                  required
                >
                  <option value="">{DASHBOARD_FORM_FORM.ROLE_PLACEHOLDER}</option>
                  {tenantRoles.length === 0 && !loadingRoles ? (
                    <option value="" disabled>
                      {DASHBOARD_FORM_FORM.ROLE_EMPTY_NO_DASHBOARD}
                    </option>
                  ) : tenantRoles.length === 0 && loadingRoles ? (
                    <option value="" disabled>
                      {DASHBOARD_FORM_FORM.ROLE_LOADING}
                    </option>
                  ) : (
                    tenantRoles.map(role => (
                      <option key={role.tenantRoleId} value={role.tenantRoleId}>
                        {toDisplayString(role.nameKo || role.name || role.tenantRoleId)}
                      </option>
                    ))
                  )}
                </select>
                {errors.tenantRoleId && (
                  <span className="form-error">{errors.tenantRoleId}</span>
                )}
                {!isEditMode && formData.tenantRoleId && (
                  <div className="form-group mg-form-group-spaced">
                    <label className="checkbox-label mg-checkbox-label-flex">
                      <input
                        type="checkbox"
                        checked={assignRoleToCurrentUser}
                        onChange={(e) => setAssignRoleToCurrentUser(e.target.checked)}
                        disabled={loading}
                      />
                      <span className="mg-text-sm">
                        {DASHBOARD_FORM_FORM.ASSIGN_ROLE_AFTER_CREATE}
                      </span>
                    </label>
                    <small className="form-help mg-block mg-mt-xs mg-text-tertiary">
                      {DASHBOARD_FORM_FORM.ASSIGN_ROLE_HELP}
                    </small>
                  </div>
                )}
                {!isEditMode && tenantRoles.length > 0 && (
                  <div className="mg-role-management">
                    <details>
                      <summary className="mg-role-management-summary">
                        {DASHBOARD_FORM_FORM.ROLE_MANAGE}
                      </summary>
                      <div className="mg-role-list">
                        {tenantRoles.map(role => (
                          <div key={role.tenantRoleId} className="mg-role-item">
                            <span>{role.nameKo || role.name}</span>
                            <MGButton
                              type="button"
                              variant="danger"
                              size="small"
                              onClick={() => handleDeleteRole(role.tenantRoleId, role.nameKo || role.name)}
                              className={buildErpMgButtonClassName({
                                variant: 'danger',
                                size: 'sm',
                                loading: false,
                                className: 'mg-btn-delete-role'
                              })}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              disabled={loading}
                              title={DASHBOARD_FORM_FORM.DELETE_ROLE_TITLE}
                            >
                              {DASHBOARD_FORM_BUTTON.DELETE}
                            </MGButton>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {/* 대시보드 이름 (한글) - 자동 생성, 수정 가능 */}
              <div className="form-group">
                <label htmlFor="dashboardNameKo" className="form-label">
                  {DASHBOARD_FORM_FORM.DASHBOARD_NAME}
                  {!isEditMode && (
                    <span className="form-help mg-ml-sm mg-text-xs mg-text-tertiary mg-font-normal">
                      {DASHBOARD_FORM_FORM.DASHBOARD_NAME_AUTO_HINT}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  id="dashboardNameKo"
                  value={formData.dashboardNameKo}
                  onChange={(e) => handleChange('dashboardNameKo', e.target.value)}
                  className={`form-input ${errors.dashboardNameKo ? 'error' : ''}`}
                  placeholder={
                    formData.tenantRoleId
                      ? DASHBOARD_FORM_FORM.DASHBOARD_NAME_PH_AUTO
                      : DASHBOARD_FORM_FORM.DASHBOARD_NAME_PH_SELECT_ROLE_FIRST
                  }
                  disabled={loading || (!isEditMode && !formData.tenantRoleId)}
                  required
                  autoComplete="off"
                />
                {errors.dashboardNameKo && (
                  <span className="form-error">{errors.dashboardNameKo}</span>
                )}
                {!isEditMode && formData.tenantRoleId && !formData.dashboardNameKo && (
                  <small className="form-help mg-text-success">
                    {DASHBOARD_FORM_FORM.DASHBOARD_NAME_AUTO_SUCCESS}
                  </small>
                )}
              </div>

              {/* 대시보드 이름 (영문) - 자동 생성, 선택적 */}
              <div className="form-group mg-hidden">
                <label htmlFor="dashboardNameEn" className="form-label">
                  {DASHBOARD_FORM_FORM.DASHBOARD_NAME_EN}
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

              {/* 대시보드 타입 - 자동 설정, 숨김 */}
              <div className="form-group mg-hidden">
                <label htmlFor="dashboardType" className="form-label">
                  {DASHBOARD_FORM_FORM.DASHBOARD_TYPE}
                </label>
                <select
                  id="dashboardType"
                  value={formData.dashboardType}
                  onChange={(e) => handleChange('dashboardType', e.target.value)}
                  className={`form-input ${errors.dashboardType ? 'error' : ''}`}
                  disabled={loading}
                >
                  <option value="">{DASHBOARD_FORM_FORM.TYPE_PLACEHOLDER}</option>
                  {dashboardTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {toDisplayString(option.label)}
                    </option>
                  ))}
                </select>
                {errors.dashboardType && (
                  <span className="form-error">{errors.dashboardType}</span>
                )}
              </div>

              {/* 설명 - 선택적, 접기/펼치기 */}
              <div className="form-group">
                <details className="mg-advanced-settings">
                  <summary className="mg-advanced-settings-summary">
                    {DASHBOARD_FORM_FORM.ADVANCED_SUMMARY}
                  </summary>
                  <div className="mg-advanced-settings-content">
                    {/* 설명 */}
                    <div className="form-group">
                      <label htmlFor="description" className="form-label">
                        {DASHBOARD_FORM_FORM.DESCRIPTION}
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="form-input"
                        placeholder={DASHBOARD_FORM_FORM.DESCRIPTION_PLACEHOLDER}
                        rows="3"
                        disabled={loading}
                      />
                    </div>

                    {/* 표시 순서 */}
                    <div className="form-group">
                      <label htmlFor="displayOrder" className="form-label">
                        {DASHBOARD_FORM_FORM.DISPLAY_ORDER}
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
                      <small className="form-help">{DASHBOARD_FORM_FORM.DISPLAY_ORDER_HELP}</small>
                    </div>
                  </div>
                </details>
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
                  <span>{DASHBOARD_FORM_FORM.IS_ACTIVE}</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => handleChange('isDefault', e.target.checked)}
                    disabled={loading || isEditMode}
                  />
                  <span>{DASHBOARD_FORM_FORM.IS_DEFAULT}</span>
                  {isEditMode && (
                    <small className="form-help">{DASHBOARD_FORM_FORM.IS_DEFAULT_EDIT_HELP}</small>
                  )}
                </label>
              </div>

              {/* 대시보드 설정 */}
              <div className="form-group">
                <label className="form-label">
                  {DASHBOARD_FORM_FORM.WIDGET_SETTINGS}
                  <span className="form-help mg-ml-sm mg-text-xs mg-text-tertiary mg-font-normal">
                    {DASHBOARD_FORM_FORM.WIDGET_SETTINGS_HELP}
                  </span>
                </label>
                
                {/* 편집 헤더 (탭 제거) */}
                <div className="mg-v2-edit-header">
                  <h3 className="mg-v2-section-title">
                    {DASHBOARD_FORM_FORM.WIDGET_EDIT_TITLE}
                  </h3>
                  <p className="mg-v2-section-subtitle">
                    {DASHBOARD_FORM_FORM.WIDGET_EDIT_SUBTITLE}
                  </p>
                </div>

                {/* Core Solution 표준 위젯 편집기 */}
                <div className="mg-v2-editor-container">
                    {parsedConfig ? (
                        <div className="mg-v2-editor-complete">
                          <div className="mg-v2-editor-guide">
                            <h4 className="mg-v2-guide-title">{DASHBOARD_FORM_FORM.WIDGET_GUIDE_TITLE}</h4>
                            <ul className="mg-v2-guide-list">
                              <li>
                                {DASHBOARD_FORM_WIDGET_GUIDE.CLICK.before}
                                <strong>{DASHBOARD_FORM_WIDGET_GUIDE.CLICK.strong}</strong>
                                {DASHBOARD_FORM_WIDGET_GUIDE.CLICK.after}
                              </li>
                              <li>
                                {DASHBOARD_FORM_WIDGET_GUIDE.DRAG.before}
                                <strong>{DASHBOARD_FORM_WIDGET_GUIDE.DRAG.strong}</strong>
                                {DASHBOARD_FORM_WIDGET_GUIDE.DRAG.after}
                              </li>
                              <li>
                                {DASHBOARD_FORM_WIDGET_GUIDE.DELETE.before}
                                <strong>{DASHBOARD_FORM_WIDGET_GUIDE.DELETE.strong}</strong>
                                {DASHBOARD_FORM_WIDGET_GUIDE.DELETE.after}
                              </li>
                              <li>
                                {DASHBOARD_FORM_WIDGET_GUIDE.CONFIG.before}
                                <strong>{DASHBOARD_FORM_WIDGET_GUIDE.CONFIG.strong}</strong>
                                {DASHBOARD_FORM_WIDGET_GUIDE.CONFIG.after}
                              </li>
                            </ul>
                          </div>
                          
                          <ModernDashboardEditor
                            widgets={parsedConfig.widgets || []}
                            onWidgetsChange={handleWidgetsChange}
                            businessType={businessType}
                          />
                        </div>
                    ) : (
                      <div className="mg-v2-loading-placeholder">
                        <p>{DASHBOARD_FORM_FORM.WIDGET_GUIDE_LOADING}</p>
                      </div>
                    )}
                </div>
              </div>
            </form>
          )}
      </UnifiedModal>

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

      {showAddRoleModal && (
        <UnifiedModal
          isOpen={true}
          onClose={handleCloseAddRoleModal}
          title={DASHBOARD_FORM_MODAL.TITLE_ADD_ROLE}
          size="medium"
          variant="form"
          className="mg-v2-ad-b0kla mg-add-role-modal"
          backdropClick={true}
          showCloseButton={true}
          loading={loading}
          zIndex={DASHBOARD_FORM_ADD_ROLE_MODAL_Z_INDEX}
          actions={
            <>
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'md',
                  loading: false
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleCloseAddRoleModal}
                disabled={loading}
                preventDoubleClick={false}
              >
                {DASHBOARD_FORM_BUTTON.CANCEL}
              </MGButton>
              <MGButton
                type="button"
                variant="primary"
                size="medium"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'md',
                  loading: loading
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleAddRole}
                disabled={loading || !selectedTemplateId || !newRoleName || loadingTemplates}
                loading={loading}
                preventDoubleClick={false}
              >
                {loading ? DASHBOARD_FORM_BUTTON.ADD_ROLE_LOADING : DASHBOARD_FORM_BUTTON.ADD_ROLE_SUBMIT}
              </MGButton>
            </>
          }
        >
          {loadingTemplates ? (
            <div className="loading-container">
              <div className="mg-loading">{DASHBOARD_FORM_MODAL.LOADING}</div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="roleTemplate" className="form-label">
                  {DASHBOARD_FORM_FORM.ROLE_TEMPLATE_LABEL} <span className="required">*</span>
                </label>
                <select
                  id="roleTemplate"
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    const selectedTemplate = roleTemplates.find(t => t.roleTemplateId === e.target.value);
                    if (selectedTemplate && !newRoleName) {
                      setNewRoleName(selectedTemplate.nameKo || selectedTemplate.name || '');
                      setNewRoleNameEn(selectedTemplate.nameEn || selectedTemplate.name || '');
                      setNewRoleDescription(selectedTemplate.descriptionKo || selectedTemplate.description || '');
                    }
                  }}
                  className="form-input"
                  disabled={loading}
                >
                  <option value="">{DASHBOARD_FORM_FORM.TEMPLATE_PLACEHOLDER}</option>
                  {roleTemplates.length === 0 ? (
                    <option value="" disabled>
                      {DASHBOARD_FORM_FORM.TEMPLATE_EMPTY}
                    </option>
                  ) : (
                    roleTemplates.map(template => (
                      <option key={template.roleTemplateId} value={template.roleTemplateId}>
                        {`${toDisplayString(template.nameKo || template.name)}${
                          template.businessType ? ` (${toDisplayString(template.businessType)})` : ''
                        }`}
                      </option>
                    ))
                  )}
                </select>
                <small className="form-help">
                  {DASHBOARD_FORM_FORM.TEMPLATE_HELP}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="newRoleName" className="form-label">
                  {DASHBOARD_FORM_FORM.NEW_ROLE_NAME_KO} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="newRoleName"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="form-input"
                  placeholder={DASHBOARD_FORM_FORM.NEW_ROLE_NAME_KO_PLACEHOLDER}
                  disabled={loading}
                  required
                />
                <small className="form-help">
                  {DASHBOARD_FORM_FORM.NEW_ROLE_NAME_KO_HELP}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="newRoleNameEn" className="form-label">
                  {DASHBOARD_FORM_FORM.NEW_ROLE_NAME_EN}
                </label>
                <input
                  type="text"
                  id="newRoleNameEn"
                  value={newRoleNameEn}
                  onChange={(e) => setNewRoleNameEn(e.target.value)}
                  className="form-input"
                  placeholder="예: Director, Counselor, Assistant Teacher"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newRoleDescription" className="form-label">
                  {DASHBOARD_FORM_FORM.DESCRIPTION}
                </label>
                <textarea
                  id="newRoleDescription"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="form-input"
                  placeholder={DASHBOARD_FORM_FORM.ROLE_DESC_PLACEHOLDER}
                  rows="3"
                  disabled={loading}
                />
              </div>
            </>
          )}
        </UnifiedModal>
      )}
    </>
  );
};

export default DashboardFormModal;

