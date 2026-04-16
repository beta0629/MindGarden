/**
 * System Status Widget - 표준화된 위젯
/**
 * 실시간 시스템 상태 모니터링 (서버, 데이터베이스, 외부 서비스)
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
import { useWidget } from '../../../../hooks/useWidget';

import BaseWidget from '../BaseWidget';
import { RoleUtils } from '../../../../constants/roles';
import { formatDate } from '../../../../utils/formatUtils';
import './SystemStatusWidget.css';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import SafeText from '../../../common/SafeText';
const SystemStatusWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // 시스템 상태 모니터링 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'multi-api',
      cache: false, // 실시간 상태이므로 캐시 비활성화
      refreshInterval: 60000, // 1분마다 새로고침
      endpoints: [
        {
          url: '/api/v1/health/server',
          key: 'server',
          fallback: { status: 'unknown', uptime: 0, version: 'unknown' }
        },
        {
          url: '/api/v1/health/database',
          key: 'database', 
          fallback: { status: 'unknown', connectionCount: 0, queryTime: 0 }
        },
        {
          url: '/api/v1/health/external-services',
          key: 'services',
          fallback: []
        },
        {
          url: '/api/v1/health/system-metrics',
          key: 'metrics',
          fallback: { cpu: 0, memory: 0, disk: 0 }
        }
      ],
      transform: (responses) => {
        const [server, database, services, metrics] = responses;
        
        // 전체 상태 계산 함수
        const calculateOverallStatus = (statuses) => {
          const hasError = statuses.some(s => s?.status === 'error');
          const hasWarning = statuses.some(s => s?.status === 'warning');
          
          if (hasError) return 'error';
          if (hasWarning) return 'warning';
          
          const allHealthy = statuses.every(s => s?.status === 'healthy');
          return allHealthy ? 'healthy' : 'unknown';
        };
        
        return {
          server: {
            status: server?.status || 'unknown',
            uptime: server?.uptime || 0,
            version: server?.version || 'unknown',
            details: server?.details || {}
          },
          database: {
            status: database?.status || 'unknown', 
            connectionCount: database?.connectionCount || 0,
            queryTime: database?.avgQueryTime || 0,
            details: database?.details || {}
          },
          externalServices: Array.isArray(services) ? services : [],
          systemMetrics: {
            cpu: metrics?.cpu || 0,
            memory: metrics?.memory || 0,
            disk: metrics?.disk || 0
          },
          lastChecked: new Date().toISOString(),
          overallStatus: calculateOverallStatus([server, database, services])
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
    data: systemStatus,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, 'HQ_MASTER'),
    cache: false, // 실시간 데이터
    retryCount: 2
  });

  // 관리자만 표시
  if (!RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
    return null;
  }
  // 기본 데이터 구조
  const defaultData = {
    server: { status: 'unknown', uptime: 0, version: 'unknown' },
    database: { status: 'unknown', connectionCount: 0, queryTime: 0 },
    externalServices: [],
    systemMetrics: { cpu: 0, memory: 0, disk: 0 },
    lastChecked: null,
    overallStatus: 'unknown'
  };

  const displayData = systemStatus || defaultData;

  // 헤더 설정
  const headerConfig = {
    badge: displayData.overallStatus ? {
      text: getStatusText(displayData.overallStatus),
      variant: getStatusVariant(displayData.overallStatus)
    } : null,
    actions: [
      {
        icon: 'REFRESH_CW',
        label: '상태 체크',
        onClick: refresh
      },
      {
        icon: 'EXTERNAL_LINK',
        label: '시스템 모니터링',
        onClick: () => navigate('/admin/system-monitor')
      }
    ]
  };
  
  // 상태별 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'healthy': return '정상';
      case 'warning': return '경고';
      case 'error': return '오류';
      default: return '미확인';
    }
  };

  // 상태별 배지 변형
  const getStatusVariant = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'secondary';
    }
  };
  
  // 상태별 아이콘
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': 
        return null;
      case 'warning':
        return null;
      case 'error':
        return null;
      default:
        return null;
    }
  };

  // 외부 서비스 상태 확인
  const getServiceStatus = (services) => {
    if (!Array.isArray(services) || services.length === 0) return 'unknown';
    
    const hasError = services.some(s => s.status === 'error');
    const hasWarning = services.some(s => s.status === 'warning');
    
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'healthy';
  };

  // 시스템 메트릭 포맷팅
  const formatMetric = (value, type) => {
    switch (type) {
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'uptime':
        const days = Math.floor(value / (24 * 3600));
        const hours = Math.floor((value % (24 * 3600)) / 3600);
        return `${days}일 ${hours}시간`;
      case 'ms':
        return `${Math.round(value)}ms`;
      default:
        return value.toString();
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
      className="system-status-widget"
    >
      <div className="system-status-content">
        {/* 전체 시스템 상태 */}
        <div className="status-overview">
          <div className="overall-status">
            {getStatusIcon(displayData.overallStatus)}
            <span className={`overall-status-text ${displayData.overallStatus}`}>
              시스템 {getStatusText(displayData.overallStatus)}
            </span>
          </div>
        </div>

        {/* 개별 서비스 상태 */}
        <div className="status-grid">
          {/* 서버 상태 */}
          <div className={`status-card server-status status-${displayData.server.status}`}>
            <div className="status-card-header">
              
              <span className="service-name">서버</span>
              {getStatusIcon(displayData.server.status)}
            </div>
            <div className="status-card-body">
              <div className="status-details">
                <div className="detail-item">
                  <span className="detail-label">가동시간</span>
                  <span className="detail-value">{formatMetric(displayData.server.uptime, 'uptime')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">버전</span>
                  <span className="detail-value">{displayData.server.version}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 데이터베이스 상태 */}
          <div className={`status-card database-status status-${displayData.database.status}`}>
            <div className="status-card-header">
              
              <span className="service-name">데이터베이스</span>
              {getStatusIcon(displayData.database.status)}
            </div>
            <div className="status-card-body">
              <div className="status-details">
                <div className="detail-item">
                  <span className="detail-label">연결 수</span>
                  <span className="detail-value">{displayData.database.connectionCount}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">응답시간</span>
                  <span className="detail-value">{formatMetric(displayData.database.queryTime, 'ms')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 외부 서비스 상태 */}
          {displayData.externalServices.length > 0 && (
            <div className={`status-card services-status status-${getServiceStatus(displayData.externalServices)}`}>
              <div className="status-card-header">
                
                <span className="service-name">외부 서비스</span>
                {getStatusIcon(getServiceStatus(displayData.externalServices))}
              </div>
              <div className="status-card-body">
                <div className="service-list">
                  {displayData.externalServices.slice(0, 3).map((service, index) => (
                    <div key={index} className="service-item">
                      <span className="service-item-name"><SafeText>{service.name}</SafeText></span>
                      <span className={`service-item-status ${service.status}`}>
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  ))}
                  {displayData.externalServices.length > 3 && (
                    <div className="service-more">
                      +{displayData.externalServices.length - 3}개 더
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 시스템 리소스 메트릭 */}
        <div className="system-metrics">
          <div className="metric-item">
            <span className="metric-label">CPU 사용률</span>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill cpu"
                style={{ width: `${displayData.systemMetrics.cpu}%` }}
               />
            </div>
            <span className="metric-value">{formatMetric(displayData.systemMetrics.cpu, 'percentage')}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">메모리 사용률</span>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill memory"
                style={{ width: `${displayData.systemMetrics.memory}%` }}
               />
            </div>
            <span className="metric-value">{formatMetric(displayData.systemMetrics.memory, 'percentage')}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">디스크 사용률</span>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill disk"
                style={{ width: `${displayData.systemMetrics.disk}%` }}
               />
            </div>
            <span className="metric-value">{formatMetric(displayData.systemMetrics.disk, 'percentage')}</span>
          </div>
        </div>

        {/* 마지막 업데이트 시간 */}
        {displayData.lastChecked && (
          <div className="last-updated">
            
            마지막 업데이트: {formatDate(displayData.lastChecked, 'datetime')}
          </div>
        )}

        {/* 빈 상태 */}
        {isEmpty && (
          <div className="system-status-empty">
            
            <p>시스템 상태 정보를 가져올 수 없습니다</p>
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading
              })}
              loading={loading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={refresh}
            >
              재시도
            </MGButton>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default SystemStatusWidget;