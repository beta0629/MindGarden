/**
 * Custom Widget
 * 커스텀 컴포넌트를 표시하는 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */

import React from 'react';
import './Widget.css';

const CustomWidget = ({ widget, user }) => {
  const config = widget.config || {};
  const componentName = config.component;
  const props = config.props || {};
  
  if (!componentName) {
    return (
      <div className="widget widget-custom widget-error">
        <div className="widget-error-message">
          커스텀 위젯에 component가 지정되지 않았습니다.
        </div>
      </div>
    );
  }
  
  // 동적 컴포넌트 로드 (향후 구현)
  // 현재는 플레이스홀더만 표시
  return (
    <div className="widget widget-custom">
      <div className="widget-header">
        <div className="widget-title">커스텀 위젯</div>
      </div>
      <div className="widget-body">
        <div className="custom-widget-placeholder">
          <p>컴포넌트: {componentName}</p>
          <p>Props: {JSON.stringify(props, null, 2)}</p>
          <small>커스텀 컴포넌트 동적 로드 기능 필요</small>
        </div>
      </div>
    </div>
  );
};

export default CustomWidget;



