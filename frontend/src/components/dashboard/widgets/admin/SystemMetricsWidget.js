/**
 * System Metrics Widget - 표준화된 위젯
/**
 * 시스템 메트릭 실시간 모니터링 (CPU, 메모리, JVM)
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
import { useWidget } from '../../../../hooks/useWidget';

import BaseWidget from '../BaseWidget';
import { RoleUtils } from '../../../../constants/roles';
import { WIDGET_CONSTANTS } from '../../../../constants/widgetConstants';
import { formatDate } from '../../../../utils/formatUtils';
import MGButton from '../../../common/MGButton';
const SystemMetricsWidget = ({ widget, user }) => {
  const navigate = useNavigate();


  // 시스템 메트릭 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'single-api',
      cache: false,
      refreshInterval: 5000, // 5초마다 새로고침
      url: '/api/v1/monitoring/system-metrics/current'
    };
  };

  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  const { data, loading, error, refreshData } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, 'HQ_MASTER'),
    cache: true
  });

  // 관리자만 표시
  if (!RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
    return null;
  }

  // 위젯 액션 핸들러
  const handleAction = (action) => {
    switch (action) {
      case 'view-details':
        navigate('/admin/monitoring/system-metrics');
        break;
      case 'refresh':
        refreshData();
        break;
      default:
        break;
    }
  };

  // 메트릭 상태 색상 클래스
  const getMetricStatusClass = (value) => {
    if (value >= 90) return 'mg-text-error';
    if (value >= 75) return 'mg-text-warning';
    return 'mg-text-success';
  };

  // 메트릭 프로그레스 바 색상 클래스
  const getProgressBarClass = (value) => {
    if (value >= 90) return 'mg-progress-bar__fill--error';
    if (value >= 75) return 'mg-progress-bar__fill--warning';
    return 'mg-progress-bar__fill--success';
  };

  // 위젯 컨텐츠 렌더링
  const renderContent = () => {
    const metrics = data || {};
    
    const cpuUsage = metrics.cpuUsage || 0;
    const memoryUsage = metrics.memoryUsage || 0;
    const jvmMemoryUsage = metrics.jvmMemoryUsage || 0;
    const diskUsage = metrics.diskUsage || 0;

    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {/* CPU 사용률 */}
        <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
          WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
          'mg-mb-md'
        )}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
            <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
              WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
              'mg-justify-between',
              'mg-align-center',
              'mg-mb-sm'
            )}>
              <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM,
                'mg-align-center'
              )}>
                
                <span className="mg-text-body mg-font-medium">CPU 사용률</span>
              </div>
              <span className={WIDGET_CONSTANTS.UTILS.combineClasses(
                'mg-text-lg',
                'mg-font-bold',
                getMetricStatusClass(cpuUsage)
              )}>
                {cpuUsage.toFixed(1)}%
              </span>
            </div>
            <div className="mg-progress-bar">
              <div
                className={WIDGET_CONSTANTS.UTILS.combineClasses(
                  'mg-progress-bar__fill',
                  getProgressBarClass(cpuUsage)
                )}
                style={{ '--progress-percentage': `${cpuUsage}%` }}
                role="progressbar"
                aria-valuenow={cpuUsage}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span className="mg-sr-only">{cpuUsage.toFixed(1)}% 사용 중</span>
              </div>
            </div>
          </div>
        </div>

        {/* 메모리 사용률 */}
        <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
          WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
          'mg-mb-md'
        )}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
            <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
              WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
              'mg-justify-between',
              'mg-align-center',
              'mg-mb-sm'
            )}>
              <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM,
                'mg-align-center'
              )}>
                
                <span className="mg-text-body mg-font-medium">메모리 사용률</span>
              </div>
              <span className={WIDGET_CONSTANTS.UTILS.combineClasses(
                'mg-text-lg',
                'mg-font-bold',
                getMetricStatusClass(memoryUsage)
              )}>
                {memoryUsage.toFixed(1)}%
              </span>
            </div>
            <div className="mg-progress-bar">
              <div
                className={WIDGET_CONSTANTS.UTILS.combineClasses(
                  'mg-progress-bar__fill',
                  getProgressBarClass(memoryUsage)
                )}
                style={{ '--progress-percentage': `${memoryUsage}%` }}
                role="progressbar"
                aria-valuenow={memoryUsage}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span className="mg-sr-only">{memoryUsage.toFixed(1)}% 사용 중</span>
              </div>
            </div>
            {metrics.memoryUsed && metrics.memoryTotal && (
              <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM,
                WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED,
                'mg-mt-xs'
              )}>
                {(metrics.memoryUsed / 1024 / 1024 / 1024).toFixed(2)} GB / 
                {(metrics.memoryTotal / 1024 / 1024 / 1024).toFixed(2)} GB
              </div>
            )}
          </div>
        </div>

        {/* JVM 메모리 사용률 */}
        <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
          WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
          'mg-mb-md'
        )}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
            <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
              WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
              'mg-justify-between',
              'mg-align-center',
              'mg-mb-sm'
            )}>
              <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM,
                'mg-align-center'
              )}>
                
                <span className="mg-text-body mg-font-medium">JVM 메모리</span>
              </div>
              <span className={WIDGET_CONSTANTS.UTILS.combineClasses(
                'mg-text-lg',
                'mg-font-bold',
                getMetricStatusClass(jvmMemoryUsage)
              )}>
                {jvmMemoryUsage.toFixed(1)}%
              </span>
            </div>
            <div className="mg-progress-bar">
              <div
                className={WIDGET_CONSTANTS.UTILS.combineClasses(
                  'mg-progress-bar__fill',
                  getProgressBarClass(jvmMemoryUsage)
                )}
                style={{ '--progress-percentage': `${jvmMemoryUsage}%` }}
                role="progressbar"
                aria-valuenow={jvmMemoryUsage}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span className="mg-sr-only">{jvmMemoryUsage.toFixed(1)}% 사용 중</span>
              </div>
            </div>
            {metrics.jvmMemoryUsed && metrics.jvmMemoryMax && (
              <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM,
                WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED,
                'mg-mt-xs'
              )}>
                {(metrics.jvmMemoryUsed / 1024 / 1024).toFixed(0)} MB / 
                {(metrics.jvmMemoryMax / 1024 / 1024).toFixed(0)} MB
              </div>
            )}
          </div>
        </div>

        {/* 디스크 사용률 */}
        {diskUsage > 0 && (
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD}>
            <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
              <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                'mg-justify-between',
                'mg-align-center',
                'mg-mb-sm'
              )}>
                <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                  WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                  WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM,
                  'mg-align-center'
                )}>
                  
                  <span className="mg-text-body mg-font-medium">디스크 사용률</span>
                </div>
                <span className={WIDGET_CONSTANTS.UTILS.combineClasses(
                  'mg-text-lg',
                  'mg-font-bold',
                  getMetricStatusClass(diskUsage)
                )}>
                  {diskUsage.toFixed(1)}%
                </span>
              </div>
              <div className="mg-progress-bar">
                <div
                  className={WIDGET_CONSTANTS.UTILS.combineClasses(
                    'mg-progress-bar__fill',
                    getProgressBarClass(diskUsage)
                  )}
                  style={{ '--progress-percentage': `${diskUsage}%` }}
                  role="progressbar"
                  aria-valuenow={diskUsage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span className="mg-sr-only">{diskUsage.toFixed(1)}% 사용 중</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 마지막 업데이트 시간 */}
        {metrics.timestamp && (
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM,
            WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED,
            'mg-mt-md',
            'mg-text-center'
          )}>
            마지막 업데이트: {formatDate(metrics.timestamp, 'HH:mm:ss')}
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
      size="md"
      variant="default"
      headerActions={
        <MGButton
          onClick={() => handleAction('refresh')}
          variant="outline"
          size="small"
          type="button"
          aria-label="새로고침"
          title="새로고침"
          preventDoubleClick={false}
        >
          {WIDGET_CONSTANTS.ICONS.REFRESH}
        </MGButton>
      }
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default SystemMetricsWidget;