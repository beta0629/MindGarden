/**
 * 위젯 카드 래퍼 컴포넌트
/**
 * 동적 카드 스타일을 적용하여 위젯을 감싸는 컴포넌트
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-25
 */

import React from 'react';
import './WidgetCardWrapper.css';

/**
 * 카드 스타일 타입
/**
 * - v2: MindGarden v2 디자인 시스템 카드
/**
 * - glass: 글래스모피즘 효과 카드
/**
 * - flat: 평면 스타일 카드
/**
 * - bordered: 테두리 강조 카드
/**
 * - minimal: 미니멀 스타일 카드
 */
const CARD_STYLES = {
  v2: 'mg-v2-card',
  glass: 'mg-glass-card',
  flat: 'mg-flat-card',
  bordered: 'mg-bordered-card',
  minimal: 'mg-minimal-card'
};

/**
 * 카드 Variant
/**
 * - elevated: 그림자 효과
/**
 * - outlined: 테두리만
/**
 * - filled: 배경 채움
/**
 * - text: 텍스트만
 */
const CARD_VARIANTS = {
  elevated: 'mg-card-elevated',
  outlined: 'mg-card-outlined',
  filled: 'mg-card-filled',
  text: 'mg-card-text'
};

/**
 * 패딩 크기
 */
const PADDING_SIZES = {
  none: 'mg-padding-none',
  sm: 'mg-padding-sm',
  md: 'mg-padding-md',
  lg: 'mg-padding-lg',
  xl: 'mg-padding-xl'
};

/**
 * 보더 반경
 */
const BORDER_RADIUS = {
  none: 'mg-radius-none',
  sm: 'mg-radius-sm',
  md: 'mg-radius-md',
  lg: 'mg-radius-lg',
  full: 'mg-radius-full'
};

/**
 * 그림자 크기
 */
const SHADOW_SIZES = {
  none: 'mg-shadow-none',
  sm: 'mg-shadow-sm',
  md: 'mg-shadow-md',
  lg: 'mg-shadow-lg',
  xl: 'mg-shadow-xl'
};

/**
 * 위젯 카드 래퍼
/**
 * @param {Object} props
/**
 * @param {Object} props.widget - 위젯 설정 객체
/**
 * @param {Object} props.cardStyle - 카드 스타일 설정 (위젯별 또는 기본값)
/**
 * @param {Object} props.defaultCardStyle - 대시보드 기본 카드 스타일
/**
 * @param {React.ReactNode} props.children - 위젯 컴포넌트
 */
const WidgetCardWrapper = ({ widget, cardStyle, defaultCardStyle, children }) => {
  // 위젯별 카드 스타일 또는 기본값 사용
  const style = cardStyle || widget?.cardStyle || defaultCardStyle || {};
  
  // 카드 클래스 생성
  const cardClasses = [
    'widget-card-wrapper',
    CARD_STYLES[style.style] || CARD_STYLES.v2,
    CARD_VARIANTS[style.variant] || CARD_VARIANTS.elevated,
    PADDING_SIZES[style.padding] || PADDING_SIZES.md,
    BORDER_RADIUS[style.borderRadius] || BORDER_RADIUS.md,
    SHADOW_SIZES[style.shadow] || SHADOW_SIZES.md,
    style.hoverEffect ? 'mg-card-hover' : '',
    style.glassEffect ? 'mg-glass-effect' : '',
    style.border ? 'mg-card-bordered' : '',
    style.className || ''
  ].filter(Boolean).join(' ');

  // CSS 변수로 동적 스타일 처리
  const styleVars = {};
  if (style.backgroundColor) {
    styleVars['--card-bg-color'] = style.backgroundColor;
  }
  if (style.borderColor) {
    styleVars['--card-border-color'] = style.borderColor;
    styleVars['--card-border-width'] = style.borderWidth || '1px';
  }
  if (style.customStyle) {
    // customStyle의 속성들을 CSS 변수로 변환
    Object.keys(style.customStyle).forEach(key => {
      const cssVarName = `--card-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      styleVars[cssVarName] = style.customStyle[key];
    });
  }

  return (
    <div 
      className={cardClasses}
      style={Object.keys(styleVars).length > 0 ? styleVars : undefined}
      data-widget-id={widget?.id}
      data-widget-type={widget?.type}
    >
      {children}
    </div>
  );
};

export default WidgetCardWrapper;

