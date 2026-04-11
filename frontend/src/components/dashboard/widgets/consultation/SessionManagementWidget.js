/**
 * Session Management Widget - 표준화된 위젯
/**
 * 상담소 특화 회기 관리 위젯
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
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Plus, FileText, Users } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './SessionManagementWidget.css';
import MGButton from '../../../common/MGButton';

const SessionManagementWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  const getDataSourceConfig = () => {
    const baseEndpoints = {
      sessions: {
        url: '/api/v1/sessions',
        method: 'GET',
        params: { 
          limit: widget.config?.maxItems || 10,
          status: 'all',
          ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
        }
      },
      stats: {
        url: '/api/v1/sessions/stats',
        method: 'GET',
        params: {
          ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
        }
      }
    };

    if (widget.config?.showExtensionRequests !== false) {
      baseEndpoints.extensionRequests = {
        url: '/api/v1/sessions/extension-requests',
        method: 'GET',
        params: {
          status: 'pending',
          ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
        }
      };
    }

    return {
      type: 'multi-api',
      endpoints: baseEndpoints,
      refreshInterval: widget.config?.refreshInterval || 60000, // 1분마다 새로고침
      cache: true,
      cacheDuration: 60000
    };
  };

  const transform = (rawData) => {
    if (!rawData) return { sessions: [], stats: null, extensionRequests: [], hasData: false };

    const { sessions, stats, extensionRequests } = rawData;

    return {
      sessions: Array.isArray(sessions) ? sessions.slice(0, widget.config?.maxItems || 10) : [],
      stats: stats || {
        total: 0,
        completed: 0,
        pending: 0,
        upcoming: 0
      },
      extensionRequests: Array.isArray(extensionRequests) ? extensionRequests : [],
      hasData: (Array.isArray(sessions) && sessions.length > 0) || 
               (Array.isArray(extensionRequests) && extensionRequests.length > 0)
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
      'COMPLETED': 'status-completed',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': 'status-pending', 
      'UPCOMING': 'status-upcoming',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': 'status-cancelled',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'IN_PROGRESS': 'status-in-progress'
    };
    return statusMap[status] || 'status-unknown';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'COMPLETED':
        return <CheckCircle className="status-icon" />;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'PENDING':
        return <Clock className="status-icon" />;
      case 'UPCOMING':
        return <Calendar className="status-icon" />;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'CANCELLED':
        return <XCircle className="status-icon" />;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'IN_PROGRESS':
        return <Users className="status-icon" />;
      default:
        return <AlertTriangle className="status-icon" />;
    }
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': '완료',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': '대기',
      'UPCOMING': '예정',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': '취소',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'IN_PROGRESS': '진행중'
    };
    return statusLabels[status] || '미지정';
  };

  const handleViewSession = (sessionId) => {
    navigate(`/sessions/${sessionId}`);
  };

  const handleCreateSession = () => {
    navigate('/sessions/new');
  };

  const handleViewAll = () => {
    navigate('/sessions');
  };

  const handleExtensionRequest = (requestId) => {
    navigate(`/sessions/extension-requests/${requestId}`);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="session-empty-state">
          <div className="empty-icon-wrapper">
            <Calendar className="empty-icon" />
          </div>
          <h3 className="empty-title">등록된 세션이 없습니다</h3>
          <p className="empty-description">
            {widget.config?.emptyMessage || '새로운 상담 세션을 예약해보세요.'}
          </p>
          {(RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user)) && (
            <MGButton variant="primary" onClick={handleCreateSession}>
              <Plus className="btn-icon" />
              새 세션 예약
            </MGButton>
          )}
        </div>
      );
    }

    const { sessions, stats, extensionRequests } = data;

    return (
      <div className="session-content">
        {/* 통계 섹션 */}
        {widget.config?.showStats !== false && stats && (
          <div className="session-stats">
            <div className="stat-card">
              <div className="stat-icon total">
                <Calendar />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">전체 세션</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon completed">
                <CheckCircle />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.completed}</div>
                <div className="stat-label">완료</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pending">
                <Clock />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">대기중</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon upcoming">
                <Calendar />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.upcoming}</div>
                <div className="stat-label">예정</div>
              </div>
            </div>
          </div>
        )}

        {/* 연장 요청 섹션 */}
        {widget.config?.showExtensionRequests !== false && extensionRequests && extensionRequests.length > 0 && (
          <div className="extension-requests">
            <div className="section-header">
              <h4 className="section-title">
                <AlertTriangle className="section-icon" />
                회기 연장 요청
              </h4>
              <div className="section-badge">{extensionRequests.length}</div>
            </div>
            <div className="extension-list">
              {extensionRequests.map((request) => (
                <div key={request.id} className="extension-item">
                  <div className="extension-info">
                    <div className="extension-header">
                      <span className="client-name">{request.clientName}</span>
                      <span className="request-date">
                        {formatDateTime(request.requestedAt)}
                      </span>
                    </div>
                    <div className="extension-reason">
                      {request.reason || '사유 없음'}
                    </div>
                  </div>
                  <MGButton
                    variant="outline"
                    size="small"
                    className="action-btn review-btn"
                    onClick={() => handleExtensionRequest(request.id)}
                    title="검토하기"
                    preventDoubleClick={false}
                  >
                    <Eye className="action-icon" />
                  </MGButton>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 세션 목록 */}
        <div className="session-list">
          <div className="list-header">
            <h4 className="list-title">최근 세션 현황</h4>
            <MGButton variant="outline" size="small" onClick={handleViewAll}>
              전체 보기
            </MGButton>
          </div>
          <div className="session-items">
            {sessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <div className="session-header">
                    <div className="session-participants">
                      <div className="session-time">
                        <Calendar className="time-icon" />
                        {formatDateTime(session.scheduledAt)}
                      </div>
                      <div className="session-duration">
                        {session.duration || 50}분
                      </div>
                    </div>
                    <div className={`session-status ${getStatusClass(session.status)}`}>
                      {getStatusIcon(session.status)}
                      <span className="status-text">{getStatusLabel(session.status)}</span>
                    </div>
                  </div>
                  <div className="session-details">
                    <div className="detail-item">
                      <span className="detail-label">상담사:</span>
                      <span className="detail-value">{session.consultantName || '미배정'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">내담자:</span>
                      <span className="detail-value">{session.clientName || '미배정'}</span>
                    </div>
                    {session.sessionNumber && (
                      <div className="detail-item">
                        <span className="detail-label">회차:</span>
                        <span className="detail-value">{session.sessionNumber}회차</span>
                      </div>
                    )}
                    {session.notes && (
                      <div className="detail-item full-width">
                        <span className="detail-label">메모:</span>
                        <span className="detail-value">{session.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="session-actions">
                  <MGButton
                    variant="outline"
                    size="small"
                    className="action-btn view-btn"
                    onClick={() => handleViewSession(session.id)}
                    title="상세 보기"
                    preventDoubleClick={false}
                  >
                    <Eye className="action-icon" />
                  </MGButton>
                  {session.recordUrl && (
                    <MGButton
                      variant="outline"
                      size="small"
                      className="action-btn record-btn"
                      onClick={() => window.open(session.recordUrl, '_blank')}
                      title="기록 보기"
                      preventDoubleClick={false}
                    >
                      <FileText className="action-icon" />
                    </MGButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 액션 */}
        {(RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user)) && (
          <div className="session-quick-actions">
            <MGButton variant="primary" size="small" onClick={handleCreateSession}>
              <Plus className="btn-icon" />
              새 세션 예약
            </MGButton>
          </div>
        )}
      </div>
    );
  };

  const headerConfig = {
    icon: <Calendar className="widget-header-icon" />,
    subtitle: '상담 세션 관리',
    actions: [
      {
        icon: 'RefreshCw',
        label: '새로고침',
        onClick: refresh
      },
      ...((RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user)) ? [{
        icon: 'Plus',
        label: '새 세션',
        onClick: handleCreateSession
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
      className="session-management-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default SessionManagementWidget;