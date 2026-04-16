import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import StatCard from '../../../ui/Card/StatCard';
import { RoleUtils } from '../../../../constants/roles';
import './AdminSystemOverviewWidget.css';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
/**
 * 관리자 시스템 개요 위젯 - 표준화된 위젯
/**
 * 전체 시스템 현황 요약 (상담사, 내담자, 매칭 통계)
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */
const AdminSystemOverviewWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const isAllowedForWidget =
    RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, 'HQ_MASTER');

  // 다중 API 엔드포인트를 위한 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'multi-api',
      cache: true,
      refreshInterval: 300000, // 5분마다 새로고침
      endpoints: [
        {
          url: '/api/v1/admin/statistics/consultants',
          key: 'consultants'
        },
        {
          url: '/api/v1/admin/statistics/clients', 
          key: 'clients'
        },
        {
          url: '/api/v1/admin/statistics/mappings',
          key: 'mappings'
        }
      ],
      transform: (responses) => {
        const [consultants, clients, mappings] = responses;
        return {
          totalConsultants: consultants?.total || 0,
          totalClients: clients?.total || 0,
          totalMappings: mappings?.total || 0,
          activeMappings: mappings?.active || 0,
          pendingMappings: mappings?.pending || 0
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
    data: stats,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: !!(user && user.id) && isAllowedForWidget,
    cache: true,
    retryCount: 3
  });

  if (!isAllowedForWidget) {
    return null;
  }

  // 기본 통계 데이터 구조
  const defaultStats = {
    totalConsultants: 0,
    totalClients: 0,
    totalMappings: 0,
    activeMappings: 0,
    pendingMappings: 0
  };

  const displayStats = stats || defaultStats;

  // 헤더 설정
  const headerConfig = {
    actions: [
      {
        icon: 'REFRESH_CW',
        label: '새로고침',
        onClick: refresh
      }
    ]
  };

  // 통계 카드 클릭 핸들러
  const handleStatClick = (type) => {
    switch (type) {
      case 'consultants':
        navigate('/admin/consultants');
        break;
      case 'clients':
        navigate('/admin/clients');
        break;
      case 'mappings':
        navigate('/admin/mappings');
        break;
      case 'activeMappings':
        navigate('/admin/mappings?status=active');
        break;
      default:
        break;
    }
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="admin-system-overview-widget"
    >
      <div className="admin-system-overview-content">
        <div className="system-stats-grid">
          <div 
            className="system-stat-card clickable"
            onClick={() => handleStatClick('consultants')}
          >
            <div className="stat-icon consultant-icon" />
            <div className="stat-content">
              <div className="stat-value">{displayStats.totalConsultants?.toLocaleString() || 0}</div>
              <div className="stat-label">상담사</div>
            </div>
          </div>

          <div 
            className="system-stat-card clickable"
            onClick={() => handleStatClick('clients')}
          >
            <div className="stat-icon client-icon" />
            <div className="stat-content">
              <div className="stat-value">{displayStats.totalClients?.toLocaleString() || 0}</div>
              <div className="stat-label">내담자</div>
            </div>
          </div>

          <div 
            className="system-stat-card clickable"
            onClick={() => handleStatClick('mappings')}
          >
            <div className="stat-icon mapping-icon" />
            <div className="stat-content">
              <div className="stat-value">{displayStats.totalMappings?.toLocaleString() || 0}</div>
              <div className="stat-label">총 매칭</div>
            </div>
          </div>

          <div 
            className="system-stat-card clickable"
            onClick={() => handleStatClick('activeMappings')}
          >
            <div className="stat-icon active-icon" />
            <div className="stat-content">
              <div className="stat-value">{displayStats.activeMappings?.toLocaleString() || 0}</div>
              <div className="stat-label">활성 매칭</div>
            </div>
          </div>
        </div>
        
        {/* 빈 상태 처리 */}
        {isEmpty && (
          <div className="admin-system-overview-empty">
            
            <p>시스템 통계 데이터가 없습니다</p>
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading,
                className: ''
              })}
              loading={loading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={refresh}
              preventDoubleClick={false}
            >
              다시 시도
            </MGButton>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default AdminSystemOverviewWidget;
