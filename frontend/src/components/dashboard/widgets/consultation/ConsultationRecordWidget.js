/**
 * Consultation Record Widget - 표준화된 위젯
/**
 * 상담 기록 위젯
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
import { FileText, Eye, Calendar, User, Plus, BookOpen } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './ConsultationRecordWidget.css';

const ConsultationRecordWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  const getDataSourceConfig = () => ({
    type: 'api',
    url: '/api/v1/consultation-records',
    method: 'GET',
    params: { 
      limit: widget.config?.maxItems || 5,
      ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
    },
    refreshInterval: 120000,
    cache: true
  });

  const transform = (rawData) => {
    if (!rawData) return { records: [], hasData: false };
    return {
      records: Array.isArray(rawData) ? rawData : [],
      hasData: Array.isArray(rawData) && rawData.length > 0
    };
  };

  const widgetWithDataSource = {
    ...widget,
    config: { ...widget.config, dataSource: getDataSourceConfig(), transform }
  };

  const { data, loading, error, hasData, refresh } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user) || RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER),
    cache: true
  });

  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)) {
    return null;
  }

  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString('ko-KR');
  };

  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="record-empty-state">
          <div className="empty-icon-wrapper">
            <BookOpen className="empty-icon" />
          </div>
          <h3 className="empty-title">상담 기록 없음</h3>
          <p className="empty-description">상담 완료 후 기록이 표시됩니다.</p>
        </div>
      );
    }

    const { records } = data;

    return (
      <div className="record-content">
        <div className="record-list">
          {records.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-icon">
                <FileText />
              </div>
              <div className="record-info">
                <div className="record-title">{record.title || '상담 기록'}</div>
                <div className="record-details">
                  <div className="detail-item">
                    <User className="detail-icon" />
                    <span>{record.clientName}</span>
                  </div>
                  <div className="detail-item">
                    <Calendar className="detail-icon" />
                    <span>{formatDate(record.createdAt)}</span>
                  </div>
                </div>
                {record.summary && (
                  <div className="record-summary">{record.summary}</div>
                )}
              </div>
              <button 
                className="record-view-btn" 
                onClick={() => navigate(`/records/${record.id}`)}
              >
                <Eye className="view-icon" />
              </button>
            </div>
          ))}
        </div>
        <div className="record-actions">
          <button className="mg-btn mg-btn-ghost mg-btn-sm" onClick={() => navigate('/records')}>
            전체 기록 보기
          </button>
        </div>
      </div>
    );
  };

  const headerConfig = {
    icon: <FileText className="widget-header-icon" />,
    subtitle: '최근 상담 기록',
    actions: [
      { icon: 'RefreshCw', label: '새로고침', onClick: refresh },
      { icon: 'Plus', label: '기록 작성', onClick: () => navigate('/records/new') }
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
      className="consultation-record-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ConsultationRecordWidget;