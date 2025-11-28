/**
 * MindGarden 위젯 베이스 컴포넌트
 * 
 * 모든 위젯의 공통 구조와 기능을 제공
 * - 표준화된 레이아웃 (헤더, 바디, 푸터)
 * - 로딩/에러 상태 자동 처리
 * - MindGarden 디자인 시스템 적용
 * - 접근성 및 반응형 지원
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-28
 */

import React from 'react';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import { MG_DESIGN_TOKENS } from '../../../constants/designTokens';
import './Widget.css';
import '../../../styles/unified-design-tokens.css';

/**
 * 표준화된 위젯 베이스 컴포넌트
 * 
 * @param {Object} props
 * @param {Object} props.widget - 위젯 설정 정보
 * @param {Object} props.user - 현재 사용자 정보
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.error - 에러 메시지
 * @param {boolean} props.isEmpty - 빈 데이터 상태
 * @param {React.ReactNode} props.children - 위젯 내용
 * @param {Function} props.onRefresh - 새로고침 콜백
 * @param {Object} props.headerActions - 헤더 액션 버튼들
 * @param {React.ReactNode} props.footer - 푸터 내용
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Object} props.style - 인라인 스타일 (사용 지양)
 * @param {string} props.size - 위젯 크기 ('sm', 'md', 'lg', 'xl')
 * @param {string} props.variant - 위젯 변형 ('default', 'card', 'minimal')
 */
const BaseWidget = ({
  widget = {},
  user = null,
  loading = false,
  error = null,
  isEmpty = false,
  children,
  onRefresh,
  headerActions,
  footer,
  className = '',
  style = {},
  size = 'md',
  variant = 'default'
}) => {
  const config = widget.config || {};
  const widgetType = widget.type || 'unknown';
  
  // CSS 클래스 조합
  const containerClasses = WIDGET_CONSTANTS.UTILS.combineClasses(
    WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTAINER(widgetType),
    `mg-widget--size-${size}`,
    `mg-widget--variant-${variant}`,
    loading && 'mg-widget--loading',
    error && 'mg-widget--error',
    isEmpty && 'mg-widget--empty',
    className
  );

  /**
   * 로딩 상태 렌더링
   */
  const renderLoading = () => (
    <div className={WIDGET_CONSTANTS.CSS_CLASSES.LOADING_CONTAINER}>
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_LOADING_SPINNER}></div>
      <p className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
        {config.loadingMessage || WIDGET_CONSTANTS.LOADING_MESSAGES.DEFAULT}
      </p>
    </div>
  );

  /**
   * 에러 상태 렌더링
   */
  const renderError = () => (
    <div className={WIDGET_CONSTANTS.CSS_CLASSES.ERROR_CONTAINER}>
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_ALERT_ERROR}>
        <span className={WIDGET_CONSTANTS.CSS_CLASSES.MG_ALERT_ICON}>
          {WIDGET_CONSTANTS.ICONS.ERROR}
        </span>
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_ALERT_MESSAGE}>
          <strong>오류 발생</strong>
          <p>{error}</p>
          {onRefresh && (
            <button 
              className="mg-button mg-button--sm mg-button--outline"
              onClick={onRefresh}
              type="button"
            >
              {WIDGET_CONSTANTS.ICONS.REFRESH} 다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /**
   * 빈 상태 렌더링
   */
  const renderEmpty = () => (
    <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX + ' ' + 
                   WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX_COL + ' ' + 
                   WIDGET_CONSTANTS.CSS_CLASSES.MG_ALIGN_CENTER + ' ' + 
                   WIDGET_CONSTANTS.CSS_CLASSES.MG_PY_XL}>
      <div className="mg-empty-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        {config.emptyIcon || '📭'}
      </div>
      <p className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
        {config.emptyMessage || '표시할 데이터가 없습니다'}
      </p>
      {onRefresh && (
        <button 
          className="mg-button mg-button--sm mg-button--ghost"
          onClick={onRefresh}
          type="button"
          style={{ marginTop: '1rem' }}
        >
          {WIDGET_CONSTANTS.ICONS.REFRESH} 새로고침
        </button>
      )}
    </div>
  );

  /**
   * 위젯 헤더 렌더링
   */
  const renderHeader = () => {
    const hasTitle = config.title;
    const hasSubtitle = config.subtitle;
    const hasActions = headerActions || onRefresh;

    if (!hasTitle && !hasSubtitle && !hasActions) {
      return null;
    }

    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_HEADER}>
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_HEADER}>
          {/* 제목 영역 */}
          <div className="mg-widget-title-area">
            {config.icon && (
              <span className="mg-widget-icon" style={{ marginRight: '0.5rem' }}>
                {config.icon}
              </span>
            )}
            {hasTitle && (
              <h3 className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_TITLE}>
                {config.title}
              </h3>
            )}
            {hasSubtitle && (
              <p className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_SUBTITLE}>
                {config.subtitle}
              </p>
            )}
          </div>

          {/* 액션 영역 */}
          {hasActions && (
            <div className="mg-widget-actions">
              {headerActions}
              {onRefresh && (
                <button 
                  className="mg-button mg-button--sm mg-button--ghost"
                  onClick={onRefresh}
                  type="button"
                  title="새로고침"
                  disabled={loading}
                >
                  {WIDGET_CONSTANTS.ICONS.REFRESH}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * 위젯 바디 렌더링
   */
  const renderBody = () => {
    // 로딩 상태가 최우선
    if (loading && !children) {
      return renderLoading();
    }

    // 에러 상태
    if (error) {
      return renderError();
    }

    // 빈 상태 (children이 없고 isEmpty가 true인 경우)
    if (isEmpty && !children) {
      return renderEmpty();
    }

    // 정상 상태 - children 렌더링
    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {children}
      </div>
    );
  };

  /**
   * 위젯 푸터 렌더링
   */
  const renderFooter = () => {
    if (!footer) {
      return null;
    }

    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_FOOTER}>
        {footer}
      </div>
    );
  };

  return (
    <div 
      className={containerClasses}
      style={style}
      data-widget-id={widget.id}
      data-widget-type={widgetType}
      role="region"
      aria-label={config.title || `${widgetType} 위젯`}
      aria-busy={loading}
      aria-live={loading ? 'polite' : undefined}
    >
      {renderHeader()}
      
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_BODY}>
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
          {renderBody()}
        </div>
      </div>

      {renderFooter()}
    </div>
  );
};

/**
 * 간단한 위젯 래퍼 (헤더만 있는 경우)
 */
export const SimpleWidget = ({ title, children, className = '', ...props }) => (
  <BaseWidget
    widget={{ config: { title } }}
    className={`mg-widget--simple ${className}`}
    {...props}
  >
    {children}
  </BaseWidget>
);

/**
 * 카드 스타일 위젯 래퍼
 */
export const CardWidget = ({ children, className = '', ...props }) => (
  <BaseWidget
    variant="card"
    className={`mg-widget--card ${className}`}
    {...props}
  >
    {children}
  </BaseWidget>
);

/**
 * 미니멀 위젯 래퍼 (테두리 없음)
 */
export const MinimalWidget = ({ children, className = '', ...props }) => (
  <BaseWidget
    variant="minimal"
    className={`mg-widget--minimal ${className}`}
    {...props}
  >
    {children}
  </BaseWidget>
);

export default BaseWidget;
