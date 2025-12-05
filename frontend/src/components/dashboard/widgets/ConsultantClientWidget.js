import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar } from 'lucide-react';
import { RoleUtils } from '../../../constants/roles';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import './ConsultantClientWidget.css';

const ConsultantClientWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  if (!RoleUtils.isConsultant(user)) {
    return null;
  }

  const getDataSourceConfig = () => ({
    type: 'api',
    cache: true,
    refreshInterval: 300000, // 5분마다 새로고침 (내담자 정보 변경)
    url: `/api/admin/mappings/consultant/${user.id}/clients`,
    params: {
      includePackages: true,
      includeSessions: true,
      limit: 5 // 최대 5명만 표시
    }
  });

  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  const {
    data: mappings,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  const transformMappingData = (mappings) => {
    if (!mappings || !Array.isArray(mappings)) {
      return [];
    }

    const clientMap = new Map();

    mappings.forEach(mapping => {
      const clientId = mapping.client?.id || mapping.clientId;
      const clientStatus = mapping.client?.status || mapping.status;

      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          id: clientId,
          name: mapping.client?.name || mapping.clientName,
          email: mapping.client?.email || '',
          mappingStatus: clientStatus,
          totalSessions: 0,
          usedSessions: 0,
          remainingSessions: 0,
          lastConsultationDate: mapping.lastConsultationDate,
          packageName: mapping.packageName,
          packagePrice: mapping.packagePrice,
          paymentStatus: mapping.paymentStatus,
          createdAt: mapping.createdAt,
          packages: []
        });
      }

      const client = clientMap.get(clientId);
      client.totalSessions += mapping.totalSessions || 0;
      client.usedSessions += mapping.usedSessions || 0;
      client.remainingSessions += mapping.remainingSessions || 0;
      client.packages.push({
        packageName: mapping.packageName,
        totalSessions: mapping.totalSessions || 0,
        usedSessions: mapping.usedSessions || 0,
        remainingSessions: mapping.remainingSessions || 0
      });

      if (mapping.lastConsultationDate && 
          (!client.lastConsultationDate || 
           new Date(mapping.lastConsultationDate) > new Date(client.lastConsultationDate))) {
        client.lastConsultationDate = mapping.lastConsultationDate;
      }
    });

    return Array.from(clientMap.values());
  };

  const clients = transformMappingData(mappings);

  const handleClientClick = (clientId) => {
    navigate(`/consultant/client/${clientId}`);
  };

  const handleViewAllClients = () => {
    navigate('/consultant/clients');
  };

  const getStatusClass = (status) => {
    switch (status) {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'ACTIVE':
        return 'status-active';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'PENDING':
        return 'status-pending';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'INACTIVE':
        return 'status-inactive';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'COMPLETED':
        return 'status-completed';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'SUSPENDED':
        return 'status-suspended';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'DELETED':
        return 'status-deleted';
      default:
        return 'status-unknown';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'ACTIVE':
        return '활성';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'PENDING':
        return '대기';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'INACTIVE':
        return '비활성';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'COMPLETED':
        return '완료';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'SUSPENDED':
        return '일시정지';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'DELETED':
        return '삭제';
      default:
        return status || '알 수 없음';
    }
  };

  const headerConfig = {
    title: (
      <div className="consultant-client-header">
        <Users size={20} />
        내 내담자 ({clients.length}명)
      </div>
    ),
    actions: (
      <button 
        className="consultant-client-view-all-btn"
        onClick={handleViewAllClients}
      >
        전체보기 →
      </button>
    )
  };

  const renderContent = () => {
    if (isEmpty || clients.length === 0) {
      return (
        <div className="consultant-client-empty">
          <div className="consultant-client-empty-icon">👤</div>
          <div className="consultant-client-empty-text">
            아직 매칭된 내담자가 없습니다
          </div>
        </div>
      );
    }

    return (
      <div className="consultant-client-grid">
        {clients.slice(0, 5).map((client, index) => (
          <div
            key={`${client.id}-${index}`}
            className="consultant-client-card"
            onClick={() => handleClientClick(client.id)}
          >
            <div className="consultant-client-card-header">
              <div className="consultant-client-avatar">
                {client.name ? client.name.charAt(0) : '?'}
              </div>
              <div className="consultant-client-info">
                <h4 className="consultant-client-name">
                  {client.name || '이름 없음'}
                </h4>
                <p className="consultant-client-email">
                  {client.email || '이메일 없음'}
                </p>
              </div>
              <span className={`consultant-client-status-badge ${getStatusClass(client.mappingStatus)}`}>
                {getStatusText(client.mappingStatus)}
              </span>
            </div>

            <div className="consultant-client-stats">
              <div className="consultant-client-stat">
                <div className="consultant-client-stat-label">총 회기</div>
                <div className="consultant-client-stat-value">
                  {client.totalSessions || 0}회
                </div>
              </div>
              <div className="consultant-client-stat">
                <div className="consultant-client-stat-label">사용 회기</div>
                <div className="consultant-client-stat-value">
                  {client.usedSessions || 0}회
                </div>
              </div>
            </div>

            <div className="consultant-client-footer">
              <Calendar size={14} />
              마지막 상담: {client.lastConsultationDate ? 
                new Date(client.lastConsultationDate).toLocaleDateString('ko-KR') : 
                '없음'
              }
            </div>
          </div>
        ))}
      </div>
    );
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
