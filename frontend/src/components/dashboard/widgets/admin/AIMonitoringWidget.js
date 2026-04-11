/**
 * AI Monitoring Widget - 표준화된 위젯
/**
 * AI 기반 이상 탐지 및 보안 위협 모니터링
/**
 * 하이브리드 AI 시스템 (통계 + AI 분석) 현황 표시
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
import { Brain, AlertTriangle, Shield, Activity } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils } from '../../../../constants/roles';
import { WIDGET_CONSTANTS } from '../../../../constants/widgetConstants';
import { formatDate } from '../../../../utils/formatUtils';
import MGButton from '../../../common/MGButton';

const AIMonitoringWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  
  // 테넌트 ID 추출
  const tenantId = user?.tenantId || null;

  // AI 모니터링 데이터 소스 설정 (테넌트별)
  const getDataSourceConfig = () => {
    // 테넌트 ID가 있으면 쿼리 파라미터로 추가
    const tenantParam = tenantId ? `?tenantId=${tenantId}` : '';
    
    return {
      type: 'multi-api',
      cache: false,
      refreshInterval: 30000, // 30초마다 새로고침
      endpoints: [
        {
          url: `/api/monitoring/anomaly-detection/recent${tenantParam}`,
          key: 'anomalies',
          fallback: []
        },
        {
          url: `/api/monitoring/security-threats/recent${tenantParam}`,
          key: 'threats',
          fallback: []
        },
        {
          url: `/api/monitoring/ai-usage/summary${tenantParam}`,
          key: 'aiUsage',
          fallback: { totalCalls: 0, todayCalls: 0, monthlyBudget: 0 }
        }
      ]
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
    cache: false
  });

  // 관리자만 표시
  if (!RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
    return null;
  }

  // 위젯 액션 핸들러
  const handleAction = (action) => {
    switch (action) {
      case 'view-anomalies':
        navigate('/admin/monitoring/anomalies');
        break;
      case 'view-threats':
        navigate('/admin/monitoring/security-threats');
        break;
      case 'view-ai-usage':
        navigate('/admin/monitoring/ai-usage');
        break;
      case 'refresh':
        refreshData();
        break;
      default:
        break;
    }
  };

  // 심각도별 CSS 클래스
  const getSeverityClass = (severity) => {
    const classes = {
      CRITICAL: 'mg-badge--error',
      HIGH: 'mg-badge--warning',
      MEDIUM: 'mg-badge--info',
      LOW: 'mg-badge--success'
    };
    return classes[severity] || 'mg-badge--secondary';
  };

  // 심각도별 아이콘
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle size={16} />;
      case 'MEDIUM':
        return <Activity size={16} />;
      case 'LOW':
        return <Shield size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  // 위젯 컨텐츠 렌더링
  const renderContent = () => {
    const { anomalies = [], threats = [], aiUsage = {} } = data || {};

    // 최근 이상 탐지 (표준화 원칙: 최대 10개)
    const maxItems = WIDGET_CONSTANTS.DASHBOARD_LIMITS.MAX_ITEMS;
    const recentAnomalies = anomalies.slice(0, maxItems);
    
    // 최근 보안 위협 (표준화 원칙: 최대 10개)
    const recentThreats = threats.slice(0, maxItems);

    // 통계 요약
    const criticalCount = [...anomalies, ...threats].filter(
      item => item.severity === 'CRITICAL'
    ).length;
    
    const highCount = [...anomalies, ...threats].filter(
      item => item.severity === 'HIGH'
    ).length;

    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {/* 상단 통계 - 표준화된 MG 스타일 */}
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_GRID}>
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            'mg-stats-card--error'
          )}>
            <div className="mg-stats-card__icon">
              <AlertTriangle size={20} />
            </div>
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{criticalCount}</div>
              <div className="mg-stats-card__label">긴급</div>
            </div>
          </div>
          
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            'mg-stats-card--warning'
          )}>
            <div className="mg-stats-card__icon">
              <Shield size={20} />
            </div>
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{highCount}</div>
              <div className="mg-stats-card__label">높음</div>
            </div>
          </div>
          
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            'mg-stats-card--info'
          )}>
            <div className="mg-stats-card__icon">
              <Brain size={20} />
            </div>
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{aiUsage.todayCalls || 0}</div>
              <div className="mg-stats-card__label">오늘 AI 호출</div>
            </div>
          </div>
        </div>

        {/* 이상 탐지 섹션 - 표준화된 MG 카드 */}
        <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
          WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
          'mg-mt-md'
        )}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_HEADER}>
            <Activity size={16} />
            <h4 className="mg-h5 mg-mb-0">최근 이상 탐지</h4>
            <MGButton
              onClick={() => handleAction('view-anomalies')}
              className="mg-ml-auto"
              variant="outline"
              size="small"
              type="button"
            >
              전체보기
            </MGButton>
          </div>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
            {recentAnomalies.length === 0 ? (
              <div className="mg-empty-state">
                <p className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                  ✅ 최근 이상 탐지 없음
                </p>
              </div>
            ) : (
              <div className="mg-list mg-list--divided">
                {recentAnomalies.map((anomaly, index) => (
                  <div key={index} className="mg-list__item">
                    <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                      'mg-badge',
                      'mg-badge--sm',
                      getSeverityClass(anomaly.severity)
                    )}>
                      {getSeverityIcon(anomaly.severity)}
                    </div>
                    <div className="mg-list__content">
                      <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                        'mg-justify-between',
                        'mg-mb-xs'
                      )}>
                        <span className="mg-text-body mg-font-medium">
                          {anomaly.metricType}
                        </span>
                        <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                          {formatDate(anomaly.detectedAt, 'HH:mm')}
                        </span>
                      </div>
                      <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM,
                        'mg-align-center'
                      )}>
                        <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM}>
                          이상 점수: {(anomaly.anomalyScore * 100).toFixed(0)}%
                        </span>
                        {anomaly.modelUsed === 'HYBRID_AI' && (
                          <span className="mg-badge mg-badge--primary mg-badge--sm">
                            <Brain size={12} />
                            AI 분석
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

        {/* 보안 위협 섹션 - 표준화된 MG 카드 */}
        <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
          WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
          'mg-mt-md'
        )}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_HEADER}>
            <Shield size={16} />
            <h4 className="mg-h5 mg-mb-0">최근 보안 위협</h4>
            <MGButton
              onClick={() => handleAction('view-threats')}
              className="mg-ml-auto"
              variant="outline"
              size="small"
              type="button"
            >
              전체보기
            </MGButton>
          </div>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
            {recentThreats.length === 0 ? (
              <div className="mg-empty-state">
                <p className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                  ✅ 최근 보안 위협 없음
                </p>
              </div>
            ) : (
              <div className="mg-list mg-list--divided">
                {recentThreats.map((threat, index) => (
                  <div key={index} className="mg-list__item">
                    <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                      'mg-badge',
                      'mg-badge--sm',
                      getSeverityClass(threat.severity)
                    )}>
                      {getSeverityIcon(threat.severity)}
                    </div>
                    <div className="mg-list__content">
                      <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                        'mg-justify-between',
                        'mg-mb-xs'
                      )}>
                        <span className="mg-text-body mg-font-medium">
                          {threat.threatType}
                        </span>
                        <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                          {formatDate(threat.detectedAt, 'HH:mm')}
                        </span>
                      </div>
                      <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM,
                        'mg-align-center',
                        'mg-flex-wrap'
                      )}>
                        <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM}>
                          IP: {threat.sourceIp}
                        </span>
                        {threat.blocked && (
                          <span className="mg-badge mg-badge--error mg-badge--sm">
                            차단됨
                          </span>
                        )}
                        {threat.modelUsed === 'HYBRID_AI' && (
                          <span className="mg-badge mg-badge--primary mg-badge--sm">
                            <Brain size={12} />
                            AI 분석
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

        {/* AI 사용량 정보 - 표준화된 MG 카드 푸터 */}
        <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
          WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
          'mg-mt-md'
        )}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
            <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
              WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
              'mg-justify-between',
              'mg-align-center'
            )}>
              <div>
                <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                  오늘 AI 호출:
                </span>
                <span className="mg-text-body mg-font-medium mg-ml-xs">
                  {aiUsage.todayCalls || 0}회
                </span>
              </div>
              <div>
                <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                  월 예산 사용:
                </span>
                <span className="mg-text-body mg-font-medium mg-ml-xs">
                  {aiUsage.monthlyBudgetUsage 
                    ? `${(aiUsage.monthlyBudgetUsage * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
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

export default AIMonitoringWidget;