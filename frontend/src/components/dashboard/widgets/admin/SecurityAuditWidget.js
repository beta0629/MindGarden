/**
 * Security Audit Widget - 표준화된 위젯
/**
 * 보안 감사 로그 및 사용자 활동 모니터링
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
const SecurityAuditWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  
  // 테넌트 ID 추출
  const tenantId = user?.tenantId || null;

  // 보안 감사 데이터 소스 설정 (테넌트별)
  const getDataSourceConfig = () => {
    const tenantParam = tenantId ? `?tenantId=${tenantId}` : '';
    
    return {
      type: 'multi-api',
      cache: false,
      refreshInterval: 30000, // 30초마다 새로고침
      endpoints: [
        {
          url: `/api/security/audit/recent${tenantParam}`,
          key: 'audits',
          fallback: []
        },
        {
          url: `/api/security/audit/summary${tenantParam}`,
          key: 'summary',
          fallback: { totalEvents: 0, loginAttempts: 0, failedLogins: 0 }
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
      case 'view-all':
        navigate('/admin/security/audit-logs');
        break;
      case 'view-failed-logins':
        navigate('/admin/security/audit-logs?eventType=LOGIN_FAILED');
        break;
      case 'refresh':
        refreshData();
        break;
      default:
        break;
    }
  };

  // 이벤트 타입별 CSS 클래스
  const getEventTypeClass = (eventType) => {
    const classes = {
      LOGIN_SUCCESS: 'mg-badge--success',
      LOGIN_FAILED: 'mg-badge--error',
      LOGOUT: 'mg-badge--secondary',
      PASSWORD_CHANGED: 'mg-badge--info',
      PERMISSION_CHANGED: 'mg-badge--warning',
      DATA_ACCESS: 'mg-badge--info',
      DATA_MODIFIED: 'mg-badge--warning',
      SUSPICIOUS_ACTIVITY: 'mg-badge--error'
    };
    return classes[eventType] || 'mg-badge--secondary';
  };


  // 이벤트 타입 한글명
  const getEventTypeName = (eventType) => {
    const names = {
      LOGIN_SUCCESS: '로그인 성공',
      LOGIN_FAILED: '로그인 실패',
      LOGOUT: '로그아웃',
      PASSWORD_CHANGED: '비밀번호 변경',
      PERMISSION_CHANGED: '권한 변경',
      DATA_ACCESS: '데이터 접근',
      DATA_MODIFIED: '데이터 수정',
      SUSPICIOUS_ACTIVITY: '의심스러운 활동'
    };
    return names[eventType] || eventType;
  };

  // 위젯 컨텐츠 렌더링
  const renderContent = () => {
    const { audits = [], summary = {} } = data || {};

    // 최근 감사 로그 (표준화 원칙: 최대 10개)
    const maxItems = WIDGET_CONSTANTS.DASHBOARD_LIMITS.MAX_ITEMS;
    const recentAudits = audits.slice(0, maxItems);

    // 통계
    const totalEvents = summary.totalEvents || 0;
    const loginAttempts = summary.loginAttempts || 0;
    const failedLogins = summary.failedLogins || 0;
    const suspiciousCount = audits.filter(
      a => a.eventType === 'SUSPICIOUS_ACTIVITY' || a.eventType === 'LOGIN_FAILED'
    ).length;

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
              <div className="mg-stats-card__value">{totalEvents}</div>
              <div className="mg-stats-card__label">총 이벤트</div>
            </div>
          </div>
          
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            'mg-stats-card--success'
          )}>
            <div className="mg-stats-card__icon" />
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{loginAttempts}</div>
              <div className="mg-stats-card__label">로그인 시도</div>
            </div>
          </div>
          
          <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
            WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_CARD,
            suspiciousCount > 0 ? 'mg-stats-card--error' : 'mg-stats-card--secondary'
          )}>
            <div className="mg-stats-card__icon" />
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{suspiciousCount}</div>
              <div className="mg-stats-card__label">의심 활동</div>
            </div>
          </div>
        </div>

        {/* 최근 감사 로그 - 표준화된 MG 카드 */}
        <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
          WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD,
          'mg-mt-md'
        )}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_HEADER}>
            
            <h4 className="mg-h5 mg-mb-0">최근 감사 로그</h4>
            <MGButton
              onClick={() => handleAction('view-all')}
              className="mg-ml-auto"
              variant="outline"
              size="small"
              type="button"
            >
              전체보기
            </MGButton>
          </div>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
            {recentAudits.length === 0 ? (
              <div className="mg-empty-state">
                <p className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                  최근 감사 로그가 없습니다
                </p>
              </div>
            ) : (
              <div className="mg-list mg-list--divided">
                {recentAudits.map((audit, index) => (
                  <div key={index} className="mg-list__item">
                    <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                      'mg-badge',
                      'mg-badge--sm',
                      getEventTypeClass(audit.eventType)
                    )}>
                      {getEventTypeName(audit.eventType)}
                    </div>
                    <div className="mg-list__content">
                      <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                        'mg-justify-between',
                        'mg-mb-xs'
                      )}>
                        <span className="mg-text-body mg-font-medium">
                          {getEventTypeName(audit.eventType)}
                        </span>
                        <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
                          {formatDate(audit.createdAt, 'HH:mm:ss')}
                        </span>
                      </div>
                      <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                        WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM,
                        'mg-align-center',
                        'mg-flex-wrap'
                      )}>
                        {audit.userEmail && (
                          <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM}>
                            사용자: {audit.userEmail}
                          </span>
                        )}
                        {audit.ipAddress && (
                          <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_SM}>
                            IP: {audit.ipAddress}
                          </span>
                        )}
                        {audit.result === 'FAILED' && (
                          <span className="mg-badge mg-badge--error mg-badge--sm">
                            실패
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

        {/* 로그인 실패 통계 */}
        {failedLogins > 0 && (
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
                <div className={WIDGET_CONSTANTS.UTILS.combineClasses(
                  WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX,
                  WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM,
                  'mg-align-center'
                )}>
                  
                  <span className="mg-text-body">로그인 실패: {failedLogins}회</span>
                </div>
                <MGButton
                  onClick={() => handleAction('view-failed-logins')}
                  variant="outline"
                  size="small"
                  type="button"
                >
                  상세보기
                </MGButton>
              </div>
            </div>
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

export default SecurityAuditWidget;