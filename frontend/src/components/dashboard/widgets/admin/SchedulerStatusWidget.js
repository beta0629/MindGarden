/**
 * Scheduler Status Widget - 표준화된 위젯
/**
 * 스케줄러 실행 현황 및 성공/실패 통계 모니터링
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0 (표준화)
/**
 * @since 2025-12-02
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils } from '../../../../constants/roles';
import { WIDGET_CONSTANTS } from '../../../../constants/widgetConstants';
import { formatDate } from '../../../../utils/formatUtils';

const SchedulerStatusWidget = ({ widget, user }) => {
  if (!RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
    return null;
  }

  const navigate = useNavigate();

  const tenantId = user?.tenantId || null;

  const getDataSourceConfig = () => {
    const tenantParam = tenantId ? `?tenantId=${tenantId}` : '';
    
    return {
      type: 'multi-api',
      cache: false,
      refreshInterval: 60000, // 1분마다 새로고침
      endpoints: [
        {
          url: `/api/scheduler/execution/recent${tenantParam}`,
          key: 'executions',
          fallback: []
        },
        {
          url: `/api/scheduler/execution/summary${tenantParam}`,
          key: 'summary',
          fallback: { totalExecutions: 0, successCount: 0, failureCount: 0 }
        }
      ]
    };
  };

  const { data, loading, error, refreshData } = useWidget(
    widget,
    getDataSourceConfig()
  );

  const handleAction = (action) => {
    switch (action) {
      case 'view-all':
        navigate('/admin/scheduler/executions');
        break;
      case 'view-failures':
        navigate('/admin/scheduler/executions?status=FAILED');
        break;
      case 'refresh':
        refreshData();
        break;
      default:
        break;
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      SUCCESS: 'mg-badge--success',
      FAILED: 'mg-badge--error',
      RUNNING: 'mg-badge--info',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      PENDING: 'mg-badge--secondary'
    };
    return classes[status] || 'mg-badge--secondary';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle size={16} />;
      case 'FAILED':
        return <XCircle size={16} />;
      case 'RUNNING':
        return <Play size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const renderContent = () => {
    const { executions = [], summary = {} } = data || {};

    const maxItems = WIDGET_CONSTANTS.DASHBOARD_LIMITS.MAX_ITEMS;
    const recentExecutions = executions.slice(0, maxItems);

    const totalExecutions = summary.totalExecutions || 0;
    const successCount = summary.successCount || 0;
    const failureCount = summary.failureCount || 0;
    const successRate = totalExecutions > 0 
      ? ((successCount / totalExecutions) * 100).toFixed(1) 
      : 0;

    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {/* 상단 통계 - 표준화된 MG 스타일 */}
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_GRID}>
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            'mg-stats-card--info'
          )}>
            <div className="mg-stats-card__icon">
              <Clock size={20} />
            </div>
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{totalExecutions}</div>
              <div className="mg-stats-card__label">총 실행</div>
            </div>
          </div>
          
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            'mg-stats-card--success'
          )}>
            <div className="mg-stats-card__icon">
              <CheckCircle size={20} />
            </div>
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{successCount}</div>
              <div className="mg-stats-card__label">성공</div>
            </div>
          </div>
          
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            failureCount > 0 ? 'mg-stats-card--error' : 'mg-stats-card--secondary'
          )}>
            <div className="mg-stats-card__icon">
              <XCircle size={20} />
            </div>
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{failureCount}</div>
              <div className="mg-stats-card__label">실패</div>
            </div>
          </div>
        </div>

        {/* 성공률 표시 */}
        <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
          WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
          'mg-mt-md'
        )}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
            <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
              WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
              'mg-justify-between',
              'mg-align-center',
              'mg-mb-sm'
            )}>
              <span className="mg-text-body mg-font-medium">성공률</span>
              <span className={WIDGET_CONSTANTS.UTILS.combineClasses(
                'mg-text-lg',
                'mg-font-bold',
                successRate >= 95 ? 'mg-text-success' : 
                successRate >= 80 ? 'mg-text-warning' : 'mg-text-error'
              )}>
                {successRate}%
              </span>
            </div>
            <div className="mg-progress-bar">
              <div 
                className={WIDGET_CONSTANTS.UTILS.combineClasses(
                  'mg-progress-bar__fill',
                  successRate >= 95 ? 'mg-progress-bar__fill--success' : 
                  successRate >= 80 ? 'mg-progress-bar__fill--warning' : 'mg-progress-bar__fill--error'
                )}
                role="progressbar"
                aria-valuenow={successRate}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span className="mg-sr-only">{successRate}% 성공</span>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 실행 내역 - 표준화된 MG 카드 */}
        <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
          WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
          'mg-mt-md'
        )}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_HEADER}>
            <Clock size={16} />
            <h4 className="mg-h5 mg-mb-0">최근 실행 내역</h4>
            <button 
              onClick={() => handleAction('view-all')}
              className="mg-button mg-button--sm mg-button--text mg-ml-auto"
              type="button"
            >
              전체보기
            </button>
          </div>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
            {recentExecutions.length === 0 ? (
              <div className="mg-empty-state">
                <p className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                  최근 실행 내역이 없습니다
                </p>
              </div>
            ) : (
              <div className="mg-list mg-list--divided">
                {recentExecutions.map((execution, index) => (
                  <div key={index} className="mg-list__item">
                    <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                      'mg-badge',
                      'mg-badge--sm',
                      getStatusClass(execution.status)
                    )}>
                      {getStatusIcon(execution.status)}
                    </div>
                    <div className="mg-list__content">
                      <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                        'mg-justify-between',
                        'mg-mb-xs'
                      )}>
                        <span className="mg-text-body mg-font-medium">
                          {execution.jobName}
                        </span>
                        <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                          {formatDate(execution.executedAt, 'HH:mm:ss')}
                        </span>
                      </div>
                      <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM,
                        'mg-align-center',
                        'mg-flex-wrap'
                      )}>
                        {execution.durationMs && (
                          <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM}>
                            소요: {execution.durationMs}ms
                          </span>
                        )}
                        {execution.processedCount !== undefined && (
                          <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM}>
                            처리: {execution.processedCount}건
                          </span>
                        )}
                        {execution.status === 'FAILED' && execution.errorMessage && (
                          <span className="mg-badge mg-badge--error mg-badge--sm">
                            <AlertTriangle size={12} />
                            오류
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 실패 내역 바로가기 */}
        {failureCount > 0 && (
          <div className="mg-mt-md">
            <button 
              onClick={() => handleAction('view-failures')}
              className="mg-button mg-button--sm mg-button--error mg-button--outline mg-w-full"
              type="button"
            >
              <AlertTriangle size={16} />
              실패 내역 {failureCount}건 확인
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      loading={loading}
      error={error}
      onRefresh={refreshData}
      size="lg"
      variant="default"
      headerActions={
        <button 
          onClick={() => handleAction('refresh')}
          className="mg-button mg-button--sm mg-button--ghost"
          type="button"
          aria-label="새로고침"
        >
          {WIDGET_CONSTANTS.ICONS.REFRESH}
        </button>
      }
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default SchedulerStatusWidget;

