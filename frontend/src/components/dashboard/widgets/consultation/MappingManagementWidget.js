/**
 * Mapping Management Widget - 표준화된 위젯
 * 상담소 특화 매칭 관리 위젯
 * 
 * @author CoreSolution
 * @version 2.0.0 (위젯 표준화 업그레이드)
 * @since 2025-11-29
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Users, TrendingUp, Clock, CheckCircle, XCircle, Pause, Eye, Plus } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './MappingManagementWidget.css';

const MappingManagementWidget = ({ widget, user }) => {
  // 권한 확인: 관리자와 상담사만 접근 가능
  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)) {
    return null;
  }

  const navigate = useNavigate();

  // 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'multi-api',
      endpoints: {
        mappings: {
          url: '/api/admin/mappings',
          method: 'GET',
          params: { 
            limit: widget.config?.maxItems || 10,
            status: 'all'
          }
        },
        stats: {
          url: '/api/admin/mappings/stats',
          method: 'GET'
        }
      },
      refreshInterval: widget.config?.refreshInterval || 30000, // 30초마다 새로고침
      cache: true,
      cacheDuration: 30000
    };
  };

  // Transform 함수: API 응답 데이터를 위젯 형태로 변환
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

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig(),
      transform
    }
  };

  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: true,
    cache: true
  });

  // 매핑 상태별 스타일 클래스
  const getStatusClass = (status) => {
    const statusMap = {
      'ACTIVE': 'status-active',
      'PENDING': 'status-pending', 
      'TERMINATED': 'status-terminated',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled'
    };
    return statusMap[status] || 'status-unknown';
  };

  // 매핑 상태별 아이콘
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="status-icon" />;
      case 'PENDING':
        return <Clock className="status-icon" />;
      case 'TERMINATED':
      case 'CANCELLED':
        return <XCircle className="status-icon" />;
      case 'COMPLETED':
        return <CheckCircle className="status-icon" />;
      default:
        return <Pause className="status-icon" />;
    }
  };

  // 매핑 상태 한글명
  const getStatusLabel = (status) => {
    const statusLabels = {
      'ACTIVE': '활성',
      'PENDING': '대기',
      'TERMINATED': '종료',
      'COMPLETED': '완료',
      'CANCELLED': '취소'
    };
    return statusLabels[status] || '미지정';
  };

  // 매핑 상세보기
  const handleViewMapping = (mappingId) => {
    navigate(`/admin/mappings/${mappingId}`);
  };

  // 새 매핑 생성
  const handleCreateMapping = () => {
    navigate('/admin/mappings/new');
  };

  // 매핑 관리 페이지로 이동
  const handleViewAll = () => {
    navigate('/admin/mappings');
  };

  // 렌더링 내용
  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="mapping-empty-state">
          <div className="empty-icon-wrapper">
            <Link2 className="empty-icon" />
          </div>
          <h3 className="empty-title">등록된 매칭이 없습니다</h3>
          <p className="empty-description">
            {widget.config?.emptyMessage || '상담사와 내담자 간의 매칭을 생성해보세요.'}
          </p>
          {RoleUtils.isAdmin(user) && (
            <button 
              className="mg-btn mg-btn-primary"
              onClick={handleCreateMapping}
            >
              <Plus className="btn-icon" />
              새 매칭 만들기
            </button>
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
              <div className="stat-icon total">
                <Link2 />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">전체 매칭</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon active">
                <CheckCircle />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.active}</div>
                <div className="stat-label">활성 매칭</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pending">
                <Clock />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">대기 중</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon terminated">
                <XCircle />
              </div>
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
            <button 
              className="mg-btn mg-btn-ghost mg-btn-sm"
              onClick={handleViewAll}
            >
              전체 보기
            </button>
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
                      <Link2 className="mapping-connector" />
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
                  <button 
                    className="action-btn view-btn"
                    onClick={() => handleViewMapping(mapping.id)}
                    title="상세 보기"
                  >
                    <Eye className="action-icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 액션 */}
        {RoleUtils.isAdmin(user) && (
          <div className="mapping-quick-actions">
            <button 
              className="mg-btn mg-btn-primary mg-btn-sm"
              onClick={handleCreateMapping}
            >
              <Plus className="btn-icon" />
              새 매칭 생성
            </button>
          </div>
        )}
      </div>
    );
  };

  // 헤더 설정
  const headerConfig = {
    icon: <Link2 className="widget-header-icon" />,
    subtitle: '상담사-내담자 매칭 관리',
    actions: [
      {
        icon: 'RefreshCw',
        label: '새로고침',
        onClick: refresh
      },
      ...(RoleUtils.isAdmin(user) ? [{
        icon: 'Plus',
        label: '새 매칭',
        onClick: handleCreateMapping
      }] : []),
      {
        icon: 'ExternalLink',
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