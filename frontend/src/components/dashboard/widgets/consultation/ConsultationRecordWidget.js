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

import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './ConsultationRecordWidget.css';
import SafeText from '../../../common/SafeText';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
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
    immediate: RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user),
    cache: true
  });

  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString('ko-KR');
  };

  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="record-empty-state">
          <div className="empty-icon-wrapper" />
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
              <div className="record-icon" />
              <div className="record-info">
                <SafeText tag="div" className="record-title" fallback="상담 기록">{record.title}</SafeText>
                <div className="record-details">
                  <div className="detail-item">
                    
                    <span><SafeText>{record.clientName}</SafeText></span>
                  </div>
                  <div className="detail-item">
                    
                    <span><SafeText>{formatDate(record.createdAt)}</SafeText></span>
                  </div>
                </div>
                {record.summary && (
                  <SafeText tag="div" className="record-summary">{record.summary}</SafeText>
                )}
              </div>
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'sm',
                  loading: false,
                  className: 'record-view-btn'
                })}
                loading={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => navigate(`/records/${record.id}`)}
                title="상세 보기"
                preventDoubleClick={false}
              >
                보기
              </MGButton>
            </div>
          ))}
        </div>
        <div className="record-actions">
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
            onClick={() => navigate('/records')}
          >
            전체 기록 보기
          </MGButton>
        </div>
      </div>
    );
  };

  const headerConfig = {
    subtitle: '최근 상담 기록',
    actions: [
      { icon: 'REFRESH_CW', label: '새로고침', onClick: refresh },
      { icon: 'PLUS', label: '기록 작성', onClick: () => navigate('/records/new') }
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