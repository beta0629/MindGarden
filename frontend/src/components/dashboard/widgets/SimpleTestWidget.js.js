/**
 * Simple Test Widget
 * 가장 간단한 테스트용 위젯 (API 호출 없음)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-28
 */

import React from 'react';
import './Widget.css';

const SimpleTestWidget = ({ widget, user }) => {
  const config = widget.config || {};
  const title = config.title || '테스트 위젯';
  const message = config.message || '정적 데이터 표시 테스트';
  const color = config.color || 'primary';
  
  console.log('🧪 SimpleTestWidget 렌더링:', { widget, user, config });
  
  return (
    <div className={`widget widget-simple-test widget-${color}`}>
      <div className="widget-header">
        <h3 className="widget-title">{title}</h3>
      </div>
      
      <div className="widget-content">
        <div className="test-content">
          <div className="test-message">
            {message}
          </div>
          
          <div className="test-info">
            <p><strong>사용자:</strong> {user?.name || user?.email || '알 수 없음'}</p>
            <p><strong>역할:</strong> {user?.role || '알 수 없음'}</p>
            <p><strong>테넌트:</strong> {user?.tenantId || '알 수 없음'}</p>
            <p><strong>시간:</strong> {new Date().toLocaleString()}</p>
          </div>
          
          <div className="test-status">
            ✅ 위젯 로딩 성공
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTestWidget;
