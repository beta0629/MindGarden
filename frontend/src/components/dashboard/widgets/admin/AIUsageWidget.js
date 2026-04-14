/**
 * AI Usage Widget - 표준화된 위젯
/**
 * AI 사용량 및 비용 추적 모니터링
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
import MGButton from '../../../common/MGButton';
const AIUsageWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // AI 사용량 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'single-api',
      cache: false,
      refreshInterval: 60000, // 1분마다 새로고침
      url: '/api/v1/monitoring/ai-usage/detailed'
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
      case 'view-details':
        navigate('/admin/monitoring/ai-usage');
        break;
      case 'refresh':
        refreshData();
        break;
      default:
        break;
    }
  };

  // 예산 사용률 색상 클래스
  const getBudgetStatusClass = (usage) => {
    if (usage >= 90) return 'mg-text-error';
    if (usage >= 75) return 'mg-text-warning';
    return 'mg-text-success';
  };

  // 예산 프로그레스 바 색상 클래스
  const getBudgetProgressBarClass = (usage) => {
    if (usage >= 90) return 'mg-progress-bar__fill--error';
    if (usage >= 75) return 'mg-progress-bar__fill--warning';
    return 'mg-progress-bar__fill--success';
  };

  // 위젯 컨텐츠 렌더링
  const renderContent = () => {
    const usage = data || {};
    
    const todayCalls = usage.todayCalls || 0;
    const monthCalls = usage.monthCalls || 0;
    const todayCost = usage.todayCost || 0;
    const monthCost = usage.monthCost || 0;
    const monthlyBudget = usage.monthlyBudget || 50;
    const budgetUsage = (monthCost / monthlyBudget) * 100;
    const dailyLimit = usage.dailyLimit || 100;
    const dailyUsage = (todayCalls / dailyLimit) * 100;

    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {/* 상단 통계 - 표준화된 MG 스타일 */}
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_GRID}>
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            'mg-stats-card--info'
          )}>
            <div className="mg-stats-card__icon" />
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{todayCalls}</div>
              <div className="mg-stats-card__label">오늘 호출</div>
            </div>
          </div>
          
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            'mg-stats-card--info'
          )}>
            <div className="mg-stats-card__icon" />
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{monthCalls}</div>
              <div className="mg-stats-card__label">이번 달 호출</div>
            </div>
          </div>
          
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            budgetUsage >= 75 ? 'mg-stats-card--warning' : 'mg-stats-card--success'
          )}>
            <div className="mg-stats-card__icon" />
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">${monthCost.toFixed(2)}</div>
              <div className="mg-stats-card__label">이번 달 비용</div>
            </div>
          </div>
        </div>

        {/* 일일 호출 제한 */}
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
              <span className="mg-text-body mg-font-medium">일일 호출 제한</span>
              <span className={WIDGET_CONSTANTS.UTILS.combineClasses(
                'mg-text-lg',
                'mg-font-bold',
                getBudgetStatusClass(dailyUsage)
              )}>
                {todayCalls} / {dailyLimit}
              </span>
            </div>
            <div className="mg-progress-bar">
              <div
                className={WIDGET_CONSTANTS.UTILS.combineClasses(
                  'mg-progress-bar__fill',
                  getBudgetProgressBarClass(dailyUsage)
                )}
                style={{ '--progress-percentage': `${dailyUsage}%` }}
                role="progressbar"
                aria-valuenow={dailyUsage}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span className="mg-sr-only">{dailyUsage.toFixed(1)}% 사용</span>
              </div>
            </div>
            <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
              WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM,
              WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED,
              'mg-mt-xs'
            )}>
              {dailyUsage.toFixed(1)}% 사용 중
            </div>
          </div>
        </div>

        {/* 월 예산 사용률 */}
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
              <span className="mg-text-body mg-font-medium">월 예산 사용률</span>
              <span className={WIDGET_CONSTANTS.UTILS.combineClasses(
                'mg-text-lg',
                'mg-font-bold',
                getBudgetStatusClass(budgetUsage)
              )}>
                {budgetUsage.toFixed(1)}%
              </span>
            </div>
            <div className="mg-progress-bar">
              <div
                className={WIDGET_CONSTANTS.UTILS.combineClasses(
                  'mg-progress-bar__fill',
                  getBudgetProgressBarClass(budgetUsage)
                )}
                style={{ '--progress-percentage': `${budgetUsage}%` }}
                role="progressbar"
                aria-valuenow={budgetUsage}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span className="mg-sr-only">{budgetUsage.toFixed(1)}% 사용</span>
              </div>
            </div>
            <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
              WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM,
              WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED,
              'mg-mt-xs'
            )}>
              ${monthCost.toFixed(2)} / ${monthlyBudget.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 사용 내역 요약 */}
        {usage.usageByType && Object.keys(usage.usageByType).length > 0 && (
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
            'mg-mt-md'
          )}>
            <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_HEADER}>
              
              <h4 className="mg-h5 mg-mb-0">타입별 사용 내역</h4>
            </div>
            <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
              <div className="mg-list mg-list--divided">
                {Object.entries(usage.usageByType).map(([type, count], index) => (
                  <div key={index} className="mg-list__item">
                    <div className="mg-list__content">
                      <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                        'mg-justify-between',
                        'mg-align-center'
                      )}>
                        <span className="mg-text-body">{getTypeName(type)}</span>
                        <span className="mg-text-body mg-font-medium">{count}회</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 예산 경고 */}
        {budgetUsage >= 80 && (
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            'mg-alert',
            'mg-alert--warning',
            'mg-mt-md'
          )}>
            <span className="mg-alert__icon">⚠️</span>
            <div className="mg-alert__message">
              월 예산의 {budgetUsage.toFixed(0)}%를 사용했습니다.
            </div>
          </div>
        )}
      </div>
    );
  };

  // 타입 한글명
  const getTypeName = (type) => {
    const names = {
      wellness_content: '웰니스 컨텐츠',
      anomaly_detection: '이상 탐지',
      security_threat_detection: '보안 위협 탐지',
      consultation_analysis: '상담 분석'
    };
    return names[type] || type;
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

export default AIUsageWidget;