/**
 * Mapping Management Widget - 표준화된 위젯
/**
 * 상담소 특화 매칭 관리 위젯
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
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './MappingManagementWidget.css';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
const MappingManagementWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  const getDataSourceConfig = () => {
    return {
      type: 'multi-api',
      endpoints: {
        mappings: {
          url: '/api/v1/admin/mappings',
          method: 'GET',
          params: { 
            limit: widget.config?.maxItems || 10,
            status: 'all'
          }
        },
        stats: {
          url: '/api/v1/admin/mappings/stats',
          method: 'GET'
        }
      },
      refreshInterval: widget.config?.refreshInterval || 30000, // 30초마다 새로고침
      cache: true,
      cacheDuration: 30000
    };
  };

  const transform = (rawData) => {
    if (!rawData) return { mappings: [], stats: null, hasData: false };

    const { mappings, stats } = rawData;

    return {
      mappings: Array.isArray(mappings) ? mappings.slice(0, widget.config?.maxItems || 10) : [],
      stats: stats || {
        total: 0,
        active: 0,
        pending: 0,
        terminated: 0
      },
      hasData: Array.isArray(mappings) && mappings.length > 0
    };
  };

  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig(),
      transform
    }
  };

  const {
    data,
    loading,
    error,
    hasData,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user),
    cache: true
  });

  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  const getStatusClass = (status) => {
    const statusMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'ACTIVE': 'status-active',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': 'status-pending', 
      'TERMINATED': 'status-terminated',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': 'status-completed',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': 'status-cancelled'
    };
    return statusMap[status] || 'status-unknown';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'ACTIVE':
        return null;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'PENDING':
        return null;
      case 'TERMINATED':
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      // eslint-disable-next-line no-fallthrough
      case 'CANCELLED':
        return null;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'COMPLETED':
        return null;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'ACTIVE': '활성',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': '대기',
      'TERMINATED': '종료',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': '완료',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': '취소'
    };
    return statusLabels[status] || '미지정';
  };

  const handleViewMapping = (mappingId) => {
    navigate(`/admin/mappings/${mappingId}`);
  };

  const handleCreateMapping = () => {
    navigate('/admin/mappings/new');
  };

  const handleViewAll = () => {
    navigate('/admin/mappings');
  };

  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="mapping-empty-state">
          <div className="empty-icon-wrapper" />
          <h3 className="empty-title">등록된 매칭이 없습니다</h3>
          <p className="empty-description">
            {widget.config?.emptyMessage || '상담사와 내담자 간의 매칭을 생성해보세요.'}
          </p>
          {RoleUtils.isAdmin(user) && (
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading: false
              })}
              loading={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleCreateMapping}
            >
              새 매칭 만들기
            </MGButton>
          )}
        </div>
      );
    }

    const { mappings, stats } = data;

    return (
      <div className="mapping-content">
        {/* 통계 섹션 */}
        {widget.config?.showStats !== false && stats && (
          <div className="mapping-stats">
            <div className="stat-card">
              <div className="stat-icon total" />
              <div className="stat-info">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">전체 매칭</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon active" />
              <div className="stat-info">
                <div className="stat-number">{stats.active}</div>
                <div className="stat-label">활성 매칭</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pending" />
              <div className="stat-info">
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">대기 중</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon terminated" />
              <div className="stat-info">
                <div className="stat-number">{stats.terminated}</div>
                <div className="stat-label">종료됨</div>
              </div>
            </div>
          </div>
        )}

        {/* 매핑 목록 */}
        <div className="mapping-list">
          <div className="list-header">
            <h4 className="list-title">최근 매칭 현황</h4>
            <MGButton
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false
              })}
              loading={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleViewAll}
            >
              전체 보기
            </MGButton>
          </div>
          <div className="mapping-items">
            {mappings.map((mapping) => (
              <div key={mapping.id} className="mapping-item">
                <div className="mapping-info">
                  <div className="mapping-header">
                    <div className="mapping-participants">
                      <span className="participant consultant">
                        {mapping.consultantName || '미배정'}
                      </span>
                      
                      <span className="participant client">
                        {mapping.clientName || '미배정'}
                      </span>
                    </div>
                    <div className={`mapping-status ${getStatusClass(mapping.status)}`}>
                      {getStatusIcon(mapping.status)}
                      <span className="status-text">{getStatusLabel(mapping.status)}</span>
                    </div>
                  </div>
                  <div className="mapping-details">
                    <div className="detail-item">
                      <span className="detail-label">매칭일:</span>
                      <span className="detail-value">
                        {mapping.createdAt ? new Date(mapping.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </span>
                    </div>
                    {mapping.sessionCount && (
                      <div className="detail-item">
                        <span className="detail-label">진행 회차:</span>
                        <span className="detail-value">{mapping.sessionCount}회</span>
                      </div>
                    )}
                    {mapping.lastSessionAt && (
                      <div className="detail-item">
                        <span className="detail-label">최근 상담:</span>
                        <span className="detail-value">
                          {new Date(mapping.lastSessionAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mapping-actions">
                  <MGButton
                    type="button"
                    variant="outline"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'sm',
                      loading: false,
                      className: 'action-btn view-btn'
                    })}
                    loading={false}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => handleViewMapping(mapping.id)}
                    title="상세 보기"
                    preventDoubleClick={false}
                  >
                    보기
                  </MGButton>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 액션 */}
        {RoleUtils.isAdmin(user) && (
          <div className="mapping-quick-actions">
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading: false
              })}
              loading={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleCreateMapping}
            >
              새 매칭 생성
            </MGButton>
          </div>
        )}
      </div>
    );
  };

  const headerConfig = {
    subtitle: '상담사-내담자 매칭 관리',
    actions: [
      {
        icon: 'REFRESH_CW',
        label: '새로고침',
        onClick: refresh
      },
      ...(RoleUtils.isAdmin(user) ? [{
        icon: 'PLUS',
        label: '새 매칭',
        onClick: handleCreateMapping
      }] : []),
      {
        icon: 'EXTERNAL_LINK',
        label: '전체 보기',
        onClick: handleViewAll
      }
    ]
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      hasData={hasData}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="mapping-management-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default MappingManagementWidget;