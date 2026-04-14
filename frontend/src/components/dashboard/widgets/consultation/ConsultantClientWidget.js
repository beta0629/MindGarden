/**
 * Consultant Client Widget - 표준화된 위젯
/**
 * 상담사 내담자 위젯
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
import SafeText from '../../../common/SafeText';
import { toDisplayString } from '../../../../utils/safeDisplay';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import Avatar from '../../../common/Avatar';
import './ConsultantClientWidget.css';
import MGButton from '../../../common/MGButton';
const ConsultantClientWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  const getDataSourceConfig = () => ({
    type: 'api',
    url: '/api/v1/consultant-clients',
    method: 'GET',
    params: { 
      limit: widget.config?.maxItems || 5,
      ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
    },
    refreshInterval: 180000,
    cache: true
  });

  const transform = (rawData) => {
    if (!rawData) return { clients: [], hasData: false };
    return {
      clients: Array.isArray(rawData) ? rawData : [],
      hasData: Array.isArray(rawData) && rawData.length > 0
    };
  };

  const widgetWithDataSource = {
    ...widget,
    config: { ...widget.config, dataSource: getDataSourceConfig(), transform }
  };

  const { data, loading, error, hasData, refresh } = useWidget(widgetWithDataSource, user, {
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
      'INACTIVE': 'status-inactive',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': 'status-pending',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': 'status-completed'
    };
    return statusMap[status] || 'status-unknown';
  };

  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString('ko-KR');
  };

  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="client-empty-state">
          <div className="empty-icon-wrapper" />
          <h3 className="empty-title">배정된 내담자 없음</h3>
          <p className="empty-description">새로운 내담자 매칭을 기다리고 있습니다.</p>
        </div>
      );
    }

    const { clients } = data;

    return (
      <div className="client-content">
        <div className="client-list">
          {clients.map((client) => (
            <div key={client.id} className="client-item">
              <Avatar
                profileImageUrl={client.profileImageUrl}
                displayName={toDisplayString(client.name, '내담자')}
                className="client-avatar"
              />
              <div className="client-info">
                <SafeText tag="div" className="client-name">{client.name}</SafeText>
                <div className="client-details">
                  <div className={`client-status ${getStatusClass(client.status)}`}>
                    {/* ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용 */}
                    {client.status === 'ACTIVE' ? '활성'
                      : client.status === 'PENDING' ? '대기'
                        : client.status === 'COMPLETED' ? '완료' : '비활성'}
                  </div>
                  {client.lastSessionAt && (
                    <div className="last-session">
                      
                      <span>최근: {formatDate(client.lastSessionAt)}</span>
                    </div>
                  )}
                  {client.sessionCount && (
                    <div className="session-count">
                      총 {client.sessionCount}회 상담
                    </div>
                  )}
                </div>
              </div>
              <div className="client-actions">
                <MGButton
                  variant="outline"
                  size="small"
                  className="action-btn message-btn"
                  onClick={() => navigate(`/messages/${client.id}`)}
                  title="메시지"
                  preventDoubleClick={false}
                 />
                <MGButton
                  variant="outline"
                  size="small"
                  className="action-btn view-btn"
                  onClick={() => navigate(`/clients/${client.id}`)}
                  title="상세보기"
                  preventDoubleClick={false}
                 />
              </div>
            </div>
          ))}
        </div>
        <div className="client-actions-footer">
          <MGButton variant="outline" size="small" onClick={() => navigate('/clients')}>
            전체 내담자 보기
          </MGButton>
        </div>
      </div>
    );
  };

  const headerConfig = {
    subtitle: '담당 내담자',
    actions: [
      { icon: 'REFRESH_CW', label: '새로고침', onClick: refresh },
      { icon: 'USER_PLUS', label: '내담자 추가', onClick: () => navigate('/clients/new') }
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
      className="consultant-client-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ConsultantClientWidget;