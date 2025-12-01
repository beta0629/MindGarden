import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar } from 'lucide-react';
import { RoleUtils } from '../../../constants/roles';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import './ConsultantClientWidget.css';

const ConsultantClientWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // 상담사 전용 위젯 (다른 역할은 표시하지 않음)
  if (!RoleUtils.isConsultant(user)) {
    return null;
  }

  // 데이터 소스 설정 (상담사 전용)
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

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (내담자 데이터)
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

  // 매핑 데이터를 내담자 데이터로 변환
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

  // 변환된 내담자 데이터
  const clients = transformMappingData(mappings);

  // 내담자 클릭 핸들러
  const handleClientClick = (clientId) => {
    navigate(`/consultant/client/${clientId}`);
  };

  // 전체보기 핸들러
  const handleViewAllClients = () => {
    navigate('/consultant/clients');
  };

  // 상태별 CSS 클래스
  const getStatusClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'PENDING':
        return 'status-pending';
      case 'INACTIVE':
        return 'status-inactive';
      case 'COMPLETED':
        return 'status-completed';
      case 'SUSPENDED':
        return 'status-suspended';
      case 'DELETED':
        return 'status-deleted';
      default:
        return 'status-unknown';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '활성';
      case 'PENDING':
        return '대기';
      case 'INACTIVE':
        return '비활성';
      case 'COMPLETED':
        return '완료';
      case 'SUSPENDED':
        return '일시정지';
      case 'DELETED':
        return '삭제';
      default:
        return status || '알 수 없음';
    }
  };

  // 위젯 헤더 설정
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

  // 위젯 콘텐츠
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
