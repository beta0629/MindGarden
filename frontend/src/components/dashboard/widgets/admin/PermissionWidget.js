/**
 * Permission Widget - 표준화된 위젯
/**
 * 관리자 권한 관리 및 사용자 권한 현황을 표시
/**
 * 아코디언 형태로 카테고리별 권한 관리
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
import { Shield, ChevronDown, ChevronRight, CheckCircle, XCircle, Users, Settings } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils } from '../../../../constants/roles';
import './PermissionWidget.css';
import SafeText from '../../../common/SafeText';

const PermissionWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState({
    '관리 권한': true, // 기본 확장
    '사용자 권한': false,
    '시스템 권한': false
  });

  // 권한 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'api',
      url: '/api/v1/admin/permissions/current-user',
      cache: true,
      refreshInterval: 600000, // 10분마다 새로고침
      params: {
        userId: user.id,
        includeCategories: true
      },
      transform: (data) => {
        if (!data || !Array.isArray(data.permissions)) {
          return { permissions: [], categories: [], totalCount: 0 };
        }
        
        const permissions = data.permissions.map(perm => ({
          id: perm.id,
          code: perm.code,
          name: perm.name || perm.code,
          description: perm.description,
          category: perm.category || '기타',
          hasPermission: perm.hasPermission || false,
          isActive: perm.isActive !== false,
          lastUpdated: perm.lastUpdated
        }));
        
        return {
          permissions,
          categories: data.categories || [],
          totalCount: permissions.length,
          activeCount: permissions.filter(p => p.hasPermission).length
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
    immediate: RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, 'HQ_MASTER'),
    cache: true,
    retryCount: 3
  });

  // 관리자만 표시
  if (!RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
    return null;
  }
  // 기본 데이터 구조
  const defaultData = {
    permissions: [],
    categories: [],
    totalCount: 0,
    activeCount: 0
  };

  const displayData = permissionData || defaultData;

  // 헤더 설정
  const headerConfig = {
    icon: <Shield className="widget-header-icon" />,
    badge: displayData.totalCount > 0 ? {
      text: `${displayData.activeCount}/${displayData.totalCount}`,
      variant: displayData.activeCount === displayData.totalCount ? 'success' : 'info'
    } : null,
    actions: [
      {
        icon: 'RefreshCw',
        label: '새로고침',
        onClick: refresh
      },
      {
        icon: 'ExternalLink',
        label: '권한 관리',
        onClick: () => navigate('/admin/permissions')
      }
    ]
  };

  // 카테고리 토글
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // 권한을 카테고리별로 그룹화
  const groupByCategory = (permissions) => {
    const grouped = {};
    permissions.forEach(perm => {
      const category = perm.category || '기타';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(perm);
    });
    return grouped;
  };

  // 고급 권한 설정
  const handleAdvancedPermissions = () => {
    navigate('/admin/permissions/advanced');
  };

  // 권한 상태별 아이콘 결정
  const getPermissionIcon = (permission) => {
    if (!permission.isActive) {
      return <XCircle className="permission-icon disabled" />;
    }
    return permission.hasPermission 
      ? <CheckCircle className="permission-icon active" />
      : <XCircle className="permission-icon inactive" />;
  };

  // 카테고리별 아이콘
  const getCategoryIcon = (category) => {
    switch (category) {
      case '관리 권한':
        return <Settings className="category-icon" />;
      case '사용자 권한':
        return <Users className="category-icon" />;
      default:
        return <Shield className="category-icon" />;
    }
  };
  
  const groupedPermissions = hasData ? groupByCategory(displayData.permissions) : {};
  const maxItems = widget.config?.maxItems || 10;
  
  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="permission-widget"
    >
      <div className="permission-content">
        {/* 권한 요약 */}
        {hasData && displayData.totalCount > 0 && (
          <div className="permission-summary">
            <div className="summary-item">
              <span className="summary-label">총 권한</span>
              <span className="summary-value">{displayData.totalCount}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">활성 권한</span>
              <span className="summary-value success">{displayData.activeCount}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">비활성 권한</span>
              <span className="summary-value warning">{displayData.totalCount - displayData.activeCount}</span>
            </div>
          </div>
        )}

        {/* 카테고리별 권한 목록 */}
        {hasData && Object.keys(groupedPermissions).length > 0 ? (
          <div className="permission-categories">
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <div key={category} className="permission-category">
                <div 
                  className="permission-category-header clickable"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="category-left">
                    {getCategoryIcon(category)}
                    <span className="category-title"><SafeText>{category}</SafeText></span>
                    <span className="category-count">({permissions.length})</span>
                  </div>
                  <div className="category-right">
                    {expandedCategories[category] ? (
                      <ChevronDown className="chevron-icon" />
                    ) : (
                      <ChevronRight className="chevron-icon" />
                    )}
                  </div>
                </div>
                
                {expandedCategories[category] && (
                  <div className="permission-list">
                    {permissions.slice(0, maxItems).map((permission) => (
                      <div key={permission.id || permission.code} className="permission-item">
                        <div className="permission-info">
                          <SafeText tag="div" className="permission-name">{permission.name}</SafeText>
                          {permission.description && (
                            <SafeText tag="div" className="permission-description">{permission.description}</SafeText>
                          )}
                          <div className="permission-code">Code: <SafeText>{permission.code}</SafeText></div>
                        </div>
                        <div className={`permission-status ${
                          !permission.isActive ? 'disabled' : 
                          permission.hasPermission ? 'active' : 'inactive'
                        }`}>
                          {getPermissionIcon(permission)}
                        </div>
                      </div>
                    ))}
                    
                    {/* 더 보기 버튼 */}
                    {permissions.length > maxItems && (
                      <div className="permission-more">
                        <button 
                          className="mg-btn mg-btn-ghost mg-btn-sm"
                          onClick={() => navigate(`/admin/permissions?category=${encodeURIComponent(category)}`)}
                        >
                          {permissions.length - maxItems}개 더 보기
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* 고급 설정 버튼 */}
            <div className="permission-actions">
              <button 
                className="mg-btn mg-btn-outline mg-btn-sm"
                onClick={handleAdvancedPermissions}
              >
                <Settings className="btn-icon" />
                고급 권한 설정
              </button>
            </div>
          </div>
        ) : (
          <div className="permission-empty">
            <Shield className="empty-icon" />
            <p>권한 정보가 없습니다</p>
            <button 
              className="mg-btn mg-btn-primary mg-btn-sm"
              onClick={refresh}
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default PermissionWidget;



