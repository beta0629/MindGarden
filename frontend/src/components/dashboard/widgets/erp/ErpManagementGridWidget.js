/**
 * ERP Management Grid Widget - 표준화된 위젯
/**
 * ERP 관리 빠른 액션 그리드 (재무관리, 구매관리, 예산관리 등)
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingCart, 
  Calculator, 
  TrendingUp, 
  PieChart, 
  Settings,
  FileText,
  BarChart3,
  Target,
  RefreshCw
} from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './ErpManagementGridWidget.css';

const ErpManagementGridWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // 사용자 권한 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'api',
      url: '/api/v1/admin/permissions/user-permissions',
      cache: true,
      refreshInterval: 600000, // 10분마다 새로고침
      params: {
        userId: user.id,
        context: 'erp-management'
      },
      transform: (data) => {
        if (!data || !Array.isArray(data.permissions)) {
          return { permissions: [], availableActions: [] };
        }
        
        // 권한에 따른 사용 가능한 액션 필터링
        const availableActions = getErpActions(user).filter(action => 
          hasPermissionForAction(data.permissions, action)
        );
        
        return {
          permissions: data.permissions,
          availableActions
        };
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

  // 표준화된 위젯 훅 사용
  const {
    data: permissionData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user),
    cache: true,
    retryCount: 3
  });

  // ERP 접근 권한 체크 (상담사 이상)
  if (!RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  // 기본 데이터 구조
  const defaultData = {
    permissions: [],
    availableActions: []
  };

  const displayData = permissionData || defaultData;

  // 헤더 설정
  const headerConfig = {
    icon: <Settings className="widget-header-icon" />,
    subtitle: 'ERP 관리 메뉴',
    actions: [
      {
        icon: 'RefreshCw',
        label: '권한 새로고침',
        onClick: refresh
      },
      {
        icon: 'ExternalLink',
        label: 'ERP 대시보드',
        onClick: () => navigate('/erp/dashboard')
      }
    ]
  };

  // ERP 관리 액션 정의
  const getErpActions = (user) => [
    {
      id: 'financial-management',
      title: '재무 관리',
      description: '수입, 지출, 예산 관리',
      icon: DollarSign,
      url: '/erp/financial-management',
      permission: 'ERP_FINANCIAL_READ',
      category: 'finance',
      roles: ['CONSULTANT', 'ADMIN', 'HQ_MASTER']
    },
    {
      id: 'purchase-management',
      title: '구매 관리',
      description: '구매 요청 및 승인 관리',
      icon: ShoppingCart,
      url: '/erp/purchase-management',
      permission: 'ERP_PURCHASE_READ',
      category: 'purchase',
      roles: ['CONSULTANT', 'ADMIN', 'HQ_MASTER']
    },
    {
      id: 'budget-management',
      title: '예산 관리',
      description: '예산 계획 및 모니터링',
      icon: Target,
      url: '/erp/budget-management',
      permission: 'ERP_BUDGET_READ',
      category: 'budget',
      roles: ['ADMIN', 'HQ_MASTER']
    },
    {
      id: 'expense-form',
      title: '비용 등록',
      description: '빠른 비용 입력',
      icon: Calculator,
      url: '/erp/quick-expense-form',
      permission: 'ERP_EXPENSE_CREATE',
      category: 'expense',
      roles: ['CONSULTANT', 'ADMIN', 'HQ_MASTER']
    },
    {
      id: 'reports',
      title: '리포트',
      description: '재무 및 비용 리포트',
      icon: BarChart3,
      url: '/erp/reports',
      permission: 'ERP_REPORT_READ',
      category: 'report',
      roles: ['CONSULTANT', 'ADMIN', 'HQ_MASTER']
    },
    {
      id: 'tax-management',
      title: '세무 관리',
      description: '세금계산 및 신고',
      icon: FileText,
      url: '/erp/tax-management',
      permission: 'ERP_TAX_READ',
      category: 'tax',
      roles: ['ADMIN', 'HQ_MASTER']
    },
    {
      id: 'analytics',
      title: '데이터 분석',
      description: '재무 데이터 분석',
      icon: TrendingUp,
      url: '/erp/analytics',
      permission: 'ERP_ANALYTICS_READ',
      category: 'analytics',
      roles: ['ADMIN', 'HQ_MASTER']
    },
    {
      id: 'settings',
      title: 'ERP 설정',
      description: '시스템 및 계정 설정',
      icon: Settings,
      url: '/erp/settings',
      permission: 'ERP_SETTINGS_READ',
      category: 'settings',
      roles: ['ADMIN', 'HQ_MASTER']
    }
  ];

  // 권한 체크 함수
  const hasPermissionForAction = (permissions, action) => {
    if (!action.permission) return true;
    
    return permissions.some(perm => 
      perm.code === action.permission && perm.hasPermission
    );
  };

  // 액션 클릭 핸들러
  const handleActionClick = (action) => {
    if (action.url) {
      navigate(action.url);
    } else if (action.onClick) {
      action.onClick(user);
    }
  };

  // 카테고리별 그룹화
  const groupActionsByCategory = (actions) => {
    const grouped = {};
    actions.forEach(action => {
      const category = action.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(action);
    });
    return grouped;
  };
  
  const visibleActions = displayData.availableActions;
  const groupedActions = groupActionsByCategory(visibleActions);

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="erp-management-grid-widget"
    >
      <div className="erp-management-content">
        {hasData && visibleActions.length > 0 ? (
          <div className="erp-action-categories">
            {Object.entries(groupedActions).map(([category, actions]) => (
              <div key={category} className="erp-action-category">
                <div className="category-header">
                  <h3 className="category-title">{getCategoryTitle(category)}</h3>
                  <span className="category-count">{actions.length}</span>
                </div>
                <div className="erp-actions-grid">
                  {actions.map((action) => (
                    <div
                      key={action.id}
                      className={`erp-action-card erp-action-${action.category} clickable`}
                      onClick={() => handleActionClick(action)}
                    >
                      <div className="erp-action-icon-wrapper">
                        <action.icon className="erp-action-icon" />
                      </div>
                      <div className="erp-action-content">
                        <h4 className="erp-action-title">{action.title}</h4>
                        <p className="erp-action-description">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="erp-management-empty">
            <Settings className="empty-icon" />
            <p>사용 가능한 ERP 관리 메뉴가 없습니다</p>
            <button 
              className="mg-btn mg-btn-primary mg-btn-sm"
              onClick={refresh}
            >
              권한 새로고침
            </button>
          </div>
        )}
      </div>
    </BaseWidget>
  );

  // 카테고리 제목 가져오기
  function getCategoryTitle(category) {
    const titles = {
      finance: '재무 관리',
      purchase: '구매 관리', 
      budget: '예산 관리',
      expense: '비용 관리',
      report: '리포트',
      tax: '세무 관리',
      analytics: '데이터 분석',
      settings: '시스템 설정',
      other: '기타'
    };
    return titles[category] || category;
  }
};

export default ErpManagementGridWidget;

