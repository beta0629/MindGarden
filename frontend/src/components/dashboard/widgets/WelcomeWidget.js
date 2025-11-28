/**
 * Welcome Widget - 표준화된 위젯
 * 환영 메시지를 표시하는 위젯
 * 
 * @author CoreSolution
 * @version 2.0.0 (표준화 업그레이드)
 * @since 2025-11-21
 */

import React from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './Widget.css';

const WelcomeWidget = ({ widget, user }) => {
  // 표준화된 위젯 훅 사용 (환영 메시지는 정적이므로 API 호출 불필요)
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: false, // 정적 콘텐츠이므로 API 호출 안함
    cache: false,
    retryCount: 0
  });

  const config = widget.config || {};
  
  // 사용자 정보 기반 개인화된 환영 메시지 생성
  const getPersonalizedMessage = () => {
    const userName = user?.name || user?.nickname || user?.username || '사용자';
    const userRole = user?.role || '사용자';
    const tenantName = user?.tenant?.name || user?.tenantName || user?.branchName || '';
    
    if (config.message) {
      // 설정된 메시지가 있으면 변수 치환
      return config.message
        .replace('{userName}', userName)
        .replace('{userRole}', userRole)
        .replace('{tenantName}', tenantName);
    }
    
    // 기본 환영 메시지
    const timeOfDay = getTimeOfDay();
    let greeting = `${timeOfDay}, ${userName}님!`;
    
    if (tenantName) {
      greeting += ` ${tenantName}에 오신 것을 환영합니다.`;
    } else {
      greeting += ' CoreSolution에 오신 것을 환영합니다.';
    }
    
    return greeting;
  };
  
  // 시간대별 인사말
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침';
    if (hour < 18) return '안녕하세요';
    return '좋은 저녁';
  };
  
  // 추가 정보 렌더링
  const renderAdditionalInfo = () => {
    const items = [];
    
    if (config.showLastLogin && user?.lastLoginAt) {
      items.push({
        icon: 'clock',
        label: '마지막 로그인',
        value: new Date(user.lastLoginAt).toLocaleString('ko-KR')
      });
    }
    
    if (config.showRole && user?.role) {
      items.push({
        icon: 'person-badge',
        label: '역할',
        value: user.role
      });
    }
    
    if (config.showTenant && (user?.tenant?.name || user?.tenantName)) {
      items.push({
        icon: 'building',
        label: '소속',
        value: user?.tenant?.name || user?.tenantName
      });
    }
    
    if (items.length === 0) return null;
    
    return (
      <div className="welcome-info">
        {items.map((item, index) => (
          <div key={index} className="welcome-info-item">
            <i className={`bi bi-${item.icon}`}></i>
            <span className="info-label">{item.label}:</span>
            <span className="info-value">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // 환영 메시지 렌더링
  const renderWelcomeContent = () => {
    return (
      <div className="welcome-container">
        <div className="welcome-header">
          {config.icon && (
            <div className="welcome-icon">
              <i className={`bi bi-${config.icon}`}></i>
            </div>
          )}
          <div className="welcome-message">
            <h3 className="welcome-title">
              {getPersonalizedMessage()}
            </h3>
            {config.subtitle && (
              <p className="welcome-subtitle">
                {config.subtitle}
              </p>
            )}
          </div>
        </div>
        
        {renderAdditionalInfo()}
        
        {config.actions && Array.isArray(config.actions) && (
          <div className="welcome-actions">
            {config.actions.map((action, index) => (
              <button
                key={index}
                className={`welcome-action-btn ${action.variant || 'primary'}`}
                onClick={() => action.onClick && action.onClick()}
              >
                {action.icon && <i className={`bi bi-${action.icon}`}></i>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={false} // 정적 콘텐츠이므로 로딩 없음
      error={null}
      isEmpty={false}
      onRefresh={refresh}
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.WELCOME}
      subtitle="" // 환영 위젯은 내부에서 subtitle 처리
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderWelcomeContent()}
      </div>
    </BaseWidget>
  );
};

export default WelcomeWidget;