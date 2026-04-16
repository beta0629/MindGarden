/**
 * Consultation Stats Widget - 표준화된 위젯
/**
 * 상담 통계 위젯
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
import './ConsultationStatsWidget.css';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
const ConsultationStatsWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  const getDataSourceConfig = () => ({
    type: 'api',
    url: '/api/v1/consultations/stats',
    method: 'GET',
    params: { 
      period: widget.config?.period || 'month',
      ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
    },
    refreshInterval: 300000,
    cache: true
  });

  const transform = (rawData) => {
    if (!rawData) return { stats: null, hasData: false };
    return {
      stats: rawData,
      hasData: rawData && Object.keys(rawData).length > 0
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

  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="stats-empty-state">
          <div className="empty-icon-wrapper" />
          <h3 className="empty-title">통계 데이터 없음</h3>
          <p className="empty-description">상담 완료 후 통계가 표시됩니다.</p>
        </div>
      );
    }

    const { stats } = data;

    return (
      <div className="stats-content">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon completed" />
            <div className="stat-info">
              <div className="stat-number">{stats.completed || 0}</div>
              <div className="stat-label">완료된 상담</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon pending" />
            <div className="stat-info">
              <div className="stat-number">{stats.pending || 0}</div>
              <div className="stat-label">진행 중</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon cancelled" />
            <div className="stat-info">
              <div className="stat-number">{stats.cancelled || 0}</div>
              <div className="stat-label">취소됨</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon total" />
            <div className="stat-info">
              <div className="stat-number">{stats.total || 0}</div>
              <div className="stat-label">총 상담</div>
            </div>
          </div>
        </div>
        <div className="stats-actions">
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
            onClick={() => navigate('/reports/stats')}
          >
            상세 통계 보기
          </MGButton>
        </div>
      </div>
    );
  };

  const headerConfig = {
    subtitle: '상담 현황 통계',
    actions: [{ icon: 'REFRESH_CW', label: '새로고침', onClick: refresh }]
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
      className="consultation-stats-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ConsultationStatsWidget;